const {Prisma} = require("@prisma/client") ;
const prisma = require("../config/prisma.js");
const {PayoutError} = require("../error/payout.error.js");

const RaahvaPayAccNumber = process.env.RAAHVA_PAY_ACCOUNT;

async function payout(accountNumber, amount, reference) {
    
    if (!accountNumber || typeof accountNumber !== "string") {
        throw new PayoutError("Invalid account number", 400);
    }

    if (!reference || typeof reference !== "string") {
        throw new PayoutError("Payout reference is required", 400);
    }

    if (!RaahvaPayAccNumber) {
        throw new PayoutError(
            "RaahvaPay is not configured",
            500
        );
    }

    if (accountNumber === RaahvaPayAccNumber) {
        throw new PayoutError(
            "Cannot payout into the Raahva Pay account",
            400
        );
    }

    // Validate amount
    let payoutAmount;

    try {
        payoutAmount = new Prisma.Decimal(amount);
    } catch {
        throw new PayoutError("Invalid payout amount", 400);
    }

    if (
        !payoutAmount.isFinite() ||
        !payoutAmount.gt(0) ||
        payoutAmount.decimalPlaces() > 2
    ) {
        throw new PayoutError("Invalid payout amount", 400);
    }

    // Start atomic database transaction
    return await prisma.$transaction(async (tx) => {

        // Lock both account rows in a consistent order.
        const accounts = await tx.$queryRaw`
            SELECT "id", "accountNumber", "balance", "isActive"
            FROM "Account"
            WHERE "accountNumber" IN (
                ${RaahvaPayAccNumber},
                ${accountNumber}
            )
            ORDER BY "accountNumber" ASC
            FOR UPDATE
        `;

        const raahvaPayAccount = accounts.find(
            account => account.accountNumber === RaahvaPayAccNumber
        );

        const customerAccount = accounts.find(
            account => account.accountNumber === accountNumber
        );

        //  Check accounts
        if (!customerAccount) {
            throw new PayoutError("customer Account not found", 404);
        }
        if (!raahvaPayAccount ) {
            throw new PayoutError("Raahva Pay Account not found", 404);
        }


        if (!raahvaPayAccount.isActive || !customerAccount.isActive) {
            throw new PayoutError(
                "Both accounts must be active",
                403
            );
        }
        const availableBalance = new Prisma.Decimal(raahvaPayAccount.balance.toString());
        if (availableBalance.lt(payoutAmount)) {
                throw new PayoutError(
                "Insufficient Raahva Pay balance",
                409
            );
        }

        const txReference = await tx.bankTransaction.findUnique({
            where: {reference}
        });

        if (txReference) {
            const isSameRequest =
            txReference.type === "PAYOUT" &&
            txReference.amount.eq(payoutAmount) &&
            txReference.sourceAccountId === raahvaPayAccount.id &&
            txReference.destinationAccountId === customerAccount.id;

            if (!isSameRequest) {
                throw new PayoutError("Reference already used for a different request", 409);
            }
            else{
                return {
                    transaction: txReference,
                    raahvaPayAccount: {
                    accountNumber: raahvaPayAccount.accountNumber,
                    balance: raahvaPayAccount.balance 
                    },
                    customerAccount: {
                    accountNumber: customerAccount.accountNumber,
                    balance: customerAccount.balance
                    }
                };            
            }
        }

        // decrease and debit Raahva Pay account
        const updatedRaahvaPay = await tx.account.update({
            where: { id: raahvaPayAccount.id },
            data: {
                balance: {
                    decrement: payoutAmount
                }
            }
        });

        // Credit customer account
        const updatedCustomer = await tx.account.update({
            where: { id: customerAccount.id },
            data: {
                balance: {
                    increment: payoutAmount
                }
            }
        });

        // Create payout transaction
        const bankTransaction = await tx.bankTransaction.create({
            data: {
                reference: reference,
                type: "PAYOUT",
                amount: payoutAmount,
                status: "COMPLETED",
                sourceAccountId: raahvaPayAccount.id,
                destinationAccountId: customerAccount.id
            }
        });

        // Create matching ledger entries
        await tx.ledgerEntry.createMany({
            data: [
                {
                    transactionId: bankTransaction.id,
                    accountId: raahvaPayAccount.id,
                    entryType: "DEBIT",
                    amount: payoutAmount
                },
                {
                    transactionId: bankTransaction.id,
                    accountId: customerAccount.id,
                    entryType: "CREDIT",
                    amount: payoutAmount
                }
            ]
        });

        // Return result
        return {
            transaction: bankTransaction,
            raahvaPayAccount: {
                accountNumber: updatedRaahvaPay.accountNumber,
                balance: updatedRaahvaPay.balance
            },
            customerAccount: {
                accountNumber: updatedCustomer.accountNumber,
                balance: updatedCustomer.balance
            }
        };
    });
    
}

module.exports = {payout}