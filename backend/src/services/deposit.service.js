const Prisma = require("@prisma/client") ;
const randomUUID = require("crypto");
const prisma = require("../config/prisma.js");
const {DepositError} = require("../error/deposit.error.js");

const settlementAccNumber = process.env.ZBL_SETTLEMENT_ACCOUNT;

async function deposit(accountNumber, amount, reference) {

    // Validate input
    if (!accountNumber || typeof accountNumber !== "string") {
        throw new DepositError("Invalid account number", 400);
    }

    if (!reference || typeof reference !== "string") {
        throw new DepositError("Deposit reference is required", 400);
    }

    if (!settlementAccNumber) {
        throw new DepositError(
            "Settlement account is not configured",
            500
        );
    }

    if (accountNumber === settlementAccNumber) {
        throw new DepositError(
            "Cannot deposit into the settlement account",
            400
        );
    }

    // Validate amount
    let depositAmount;

    try {
        depositAmount = new Prisma.Decimal(amount);
    } catch {
        throw new DepositError("Invalid deposit amount", 400);
    }

    if (
        !depositAmount.isFinite() ||
        !depositAmount.gt(0) ||
        depositAmount.decimalPlaces() > 2
    ) {
        throw new DepositError("Invalid deposit amount", 400);
    }

    // Start atomic database transaction
    return await prisma.$transaction(async (tx) => {

        // Lock both account rows in a consistent order.
        const accounts = await tx.$queryRaw`
            SELECT "id", "accountNumber", "balance", "isActive"
            FROM "Account"
            WHERE "accountNumber" IN (
                ${settlementAccNumber},
                ${accountNumber}
            )
            ORDER BY "accountNumber" ASC
            FOR UPDATE
        `;

        const settlementAccount = accounts.find(
            account => account.accountNumber === settlementAccNumber
        );

        const customerAccount = accounts.find(
            account => account.accountNumber === accountNumber
        );

        //  Check accounts
        if (!customerAccount) {
            throw new DepositError("customer Account not found", 404);
        }
        if (!settlementAccount ) {
            throw new DepositError("settlement Account not found", 404);
        }


        if (!settlementAccount.isActive || !customerAccount.isActive) {
            throw new DepositError(
                "Both accounts must be active",
                403
            );
        }

        const txReference = await tx.bankTransaction.findUnique({
            where: {reference}
        });

        if (txReference) {
            const isSameRequest =
            txReference.type === "DEPOSIT" &&
            txReference.amount.eq(depositAmount) &&
            txReference.sourceAccountId === settlementAccount.id &&
            txReference.destinationAccountId === customerAccount.id;

            if (!isSameRequest) {
                throw new DepositError("Reference already used for a different request", 409);
            }
            else{
                return {
                    transaction: txReference,
                    settlementAccount: {
                    accountNumber: settlementAccount.accountNumber,
                    balance: settlementAccount.balance 
                    },
                    customerAccount: {
                    accountNumber: customerAccount.accountNumber,
                    balance: customerAccount.balance
                    }
                };            
            }
        }

        // Credit settlement account
        const updatedSettlement = await tx.account.update({
            where: { id: settlementAccount.id },
            data: {
                balance: {
                    increment: depositAmount
                }
            }
        });

        // Credit customer account
        const updatedCustomer = await tx.account.update({
            where: { id: customerAccount.id },
            data: {
                balance: {
                    increment: depositAmount
                }
            }
        });

        // Create deposit transaction
        const bankTransaction = await tx.bankTransaction.create({
            data: {
                reference: reference,
                type: "DEPOSIT",
                amount: depositAmount,
                status: "COMPLETED",
                sourceAccountId: settlementAccount.id,
                destinationAccountId: customerAccount.id
            }
        });

        // Create matching ledger entries
        await tx.ledgerEntry.createMany({
            data: [
                {
                    transactionId: bankTransaction.id,
                    accountId: settlementAccount.id,
                    entryType: "DEBIT",
                    amount: depositAmount
                },
                {
                    transactionId: bankTransaction.id,
                    accountId: customerAccount.id,
                    entryType: "CREDIT",
                    amount: depositAmount
                }
            ]
        });

        // Return result
        return {
            transaction: bankTransaction,
            settlementAccount: {
                accountNumber: updatedSettlement.accountNumber,
                balance: updatedSettlement.balance
            },
            customerAccount: {
                accountNumber: updatedCustomer.accountNumber,
                balance: updatedCustomer.balance
            }
        };
    });
}

module.exports = {deposit}