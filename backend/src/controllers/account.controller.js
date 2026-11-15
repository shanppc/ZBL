const { createAccount } = require("../services/account.service");

async function createBankAccount(req, res) {
    try {
        const { customerId } = req.body;

        // Validate customer ID
        if (
            typeof customerId !== "string" ||
            !customerId.trim()
        ) {
            return res.status(400).json({
                status: "error",
                message: "Customer ID is required"
            });
        }

        // Create bnak account
        const bankAccount = await createAccount(customerId.trim());

        if (!bankAccount) {
            return res.status(404).json({
                status: "error",
                message: "Customer does not exist"
            });
        }

        return res.status(201).json({
            status: "success",
            message: "Account created successfully",
            data: bankAccount
        });

    } catch (err) {
        console.error("Account creation error:", err);

        return res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
}

module.exports = { createBankAccount };