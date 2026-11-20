const {payout} = require("../services/offRampPayout.service");

async function OffRampPayout(req, res, next) {
    try {
        const { accountNumber, amount, reference } = req.body;

        const result = await payout(
            accountNumber,
            amount,
            reference
        );

        return res.status(201).json({
            success: true,
            message: "off ramp payout completed successfully",
            data: result
        });

    } catch (error) {
        next(error);
    }
}

module.exports = {OffRampPayout}