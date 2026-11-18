const prisma = require("../config/prisma");
const { randomInt } = require("crypto");

async function createAccount(customerId) {

    // is customer exists
    const customer = await prisma.customer.findUnique({
        where: { id: customerId }
    });

    if (!customer) {
        return null;
    }

    // Generate a unique account number
    for (let attempt = 0; attempt < 5; attempt++) {

        const accountNumber = String(
            randomInt(1000000000, 10000000000)
        );

        try {
            const account = await prisma.account.create({
                data: {
                    accountNumber,
                    balance: 0,
                    isActive: true,
                    customerId
                }
            });

            return account;

        } catch (error) {
            // Retry only if account number already exists
            if (error.code !== "P2002") {
                throw error;
            }
        }
    }

    throw new Error("Could not generate a unique account number");
}

async function getAccountByNumber(accountNumber) {
    const account = await prisma.account.findUnique({
        where: {accountNumber}
    });
    return account;
}

async function getAllAccounts(customerId) {

    // verify customer exists
    const customer = await prisma.customer.findUnique({
        where: { id: customerId }
    });

    if (!customer) {
        return null;
    }

    // Fetch all accounts belonging to customer
    const accounts = await prisma.account.findMany({
        where: { customerId }
    });

    return accounts;
}


async function getAccountTransactions(accountNumber) {
    const account = await prisma.account.findUnique({
        where: {
            accountNumber
        },
        select: {
            id: true
        }
    });

    if (!account) {
        return null;
    }

    const transactions = await prisma.bankTransaction.findMany({
        where: {
            OR: [
                { sourceAccountId: account.id },
                { destinationAccountId: account.id }
            ]
        },
        select: {
            reference: true,
            type: true,
            amount: true,
            status: true,
            createdAt: true,

            sourceAccount: {
                select: {
                    accountNumber: true
                }
            },

            destinationAccount: {
                select: {
                    accountNumber: true
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    return transactions.map((tx) => ({
        reference: tx.reference,
        type: tx.type,
        amount: tx.amount,
        status: tx.status,
        senderAccountNumber: tx.sourceAccount.accountNumber,
        receiverAccountNumber: tx.destinationAccount.accountNumber,
        transactionDate: tx.createdAt
    }));
}


module.exports = { createAccount, getAccountByNumber, getAllAccounts, getAccountTransactions};