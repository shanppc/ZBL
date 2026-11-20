const prisma = require("../config/prisma");
const { Prisma } = require("@prisma/client");

class TransferError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

async function transfer(senderAccNum, receiverAccNum, amount, reference) {

    if (senderAccNum === receiverAccNum) {
        throw new TransferError(
            "Cannot transfer to the same account",
            400
        );
    }

    const transferAmount = new Prisma.Decimal(amount);

    if (!transferAmount.isFinite() || !transferAmount.gt(0)) {
        throw new TransferError("Invalid transfer amount", 400);
    }

    return await prisma.$transaction(async (tx) => {

        // Lock both account rows in a consistent order.
        const accounts = await tx.$queryRaw`
            SELECT "id", "accountNumber", "balance", "isActive"
            FROM "Account"
            WHERE "accountNumber" IN (${senderAccNum}, ${receiverAccNum})
            ORDER BY "accountNumber" ASC
            FOR UPDATE
        `;

        const sender = accounts.find(
            account => account.accountNumber === senderAccNum
        );

        const receiver = accounts.find(
            account => account.accountNumber === receiverAccNum
        );

        if (!sender || !receiver) {
            throw new TransferError("Account not found", 404);
        }

        if (!sender.isActive || !receiver.isActive) {
            throw new TransferError(
                "Both accounts must be active",
                403
            );
        }

        // Check available balance using Decimal arithmetic.
        const senderBalance = new Prisma.Decimal(
            sender.balance.toString()
        );

        if (senderBalance.lt(transferAmount)) {
            throw new TransferError("Insufficient balance", 409);
        }

        //Check Idempotency
        const txReference = await tx.bankTransaction.findUnique({
            where: { reference } 
        });
        
        if (txReference) {
            const isSameRequest =
            txReference.type === "TRANSFER" &&
            txReference.amount.eq(transferAmount) &&
            txReference.sourceAccountId === sender.id &&
            txReference.destinationAccountId === receiver.id;

            if (!isSameRequest) {
                throw new TransferError("Reference already used for a different request", 409);
            }
            else{
                return {
                    transaction: txReference,
                    sender: {
                    accountNumber: sender.accountNumber,
                    balance: sender.balance 
                    },
                    receiver: {
                    accountNumber: receiver.accountNumber,
                    balance: receiver.balance
                    }
                };            
            }
        }

        // Deduct from sender.
        const updatedSender = await tx.account.update({
            where: { id: sender.id },
            data: {
                balance: {
                    decrement: transferAmount
                }
            }
        });

        // Credit receiver.
        const updatedReceiver = await tx.account.update({
            where: { id: receiver.id },
            data: {
                balance: {
                    increment: transferAmount
                }
            }
        });

        // Create the bank transaction record.
        const bankTransaction = await tx.bankTransaction.create({
            data: {
                reference: reference,
                type: "TRANSFER",
                amount: transferAmount,
                status: "COMPLETED",
                sourceAccountId: sender.id,
                destinationAccountId: receiver.id
            }
        });

        // Create matching debit and credit ledger entries.
        await tx.ledgerEntry.createMany({
            data: [
                {
                    transactionId: bankTransaction.id,
                    accountId: sender.id,
                    entryType: "DEBIT",
                    amount: transferAmount
                },
                {
                    transactionId: bankTransaction.id,
                    accountId: receiver.id,
                    entryType: "CREDIT",
                    amount: transferAmount
                }
            ]
        });

        return {
            transaction: bankTransaction,
            sender: {
                accountNumber: updatedSender.accountNumber,
                balance: updatedSender.balance
            },
            receiver: {
                accountNumber: updatedReceiver.accountNumber,
                balance: updatedReceiver.balance
            }
        };
    });
}

module.exports = { transfer };
