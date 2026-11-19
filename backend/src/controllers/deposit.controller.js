const {deposit} = require ("../services/deposit.service.js");

async function depositController(req, res, next) {
    try {
        const { accountNumber, amount, reference } = req.body;

        const result = await deposit(
            accountNumber,
            amount,
            reference
        );

        return res.status(201).json({
            success: true,
            message: "Deposit completed successfully",
            data: result
        });

    } catch (error) {
        next(error);
    }
}

module.exports = {depositController}