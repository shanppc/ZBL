const { transfer } = require("../services/transfer.service");

async function createTransfer(req, res) {
    try {
        const {
            senderAccountNumber,
            receiverAccountNumber,
            amount
        } = req.body ?? {};

        // Validate sender account number.
        if (
            typeof senderAccountNumber !== "string" ||
            !/^\d{10}$/.test(senderAccountNumber)
        ) {
            return res.status(400).json({
                status: "error",
                message: "Valid 10-digit sender account number is required"
            });
        }

        // Validate receiver account number.
        if (
            typeof receiverAccountNumber !== "string" ||
            !/^\d{10}$/.test(receiverAccountNumber)
        ) {
            return res.status(400).json({
                status: "error",
                message: "Valid 10-digit receiver account number is required"
            });
        }

        // Prevent transfers to the same account.
        if (senderAccountNumber === receiverAccountNumber) {
            return res.status(400).json({
                status: "error",
                message: "Cannot transfer to the same account"
            });
        }

        // Validate amount format and precision.
        if (
            typeof amount !== "string" ||
            !/^(0|[1-9]\d{0,15})(\.\d{1,2})?$/.test(amount)
        ) {
            return res.status(400).json({
                status: "error",
                message: "Amount must be a positive decimal string with up to 2 decimal places"
            });
        }

        const result = await transfer(
            senderAccountNumber,
            receiverAccountNumber,
            amount
        );

        return res.status(201).json({
            status: "success",
            message: "Transfer completed successfully",
            data: result
        });

    } catch (error) {
        console.error("Transfer error:", error);

        if (error.statusCode) {
            return res.status(error.statusCode).json({
                status: "error",
                message: error.message
            });
        }

        return res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
}

module.exports = { createTransfer };
