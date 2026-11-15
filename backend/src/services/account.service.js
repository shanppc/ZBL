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

module.exports = { createAccount, getAccountByNumber, getAllAccounts};