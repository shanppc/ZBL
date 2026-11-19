class DepositError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = "DepositError";
        this.statusCode = statusCode;
    }
}

module.exports = {DepositError}
