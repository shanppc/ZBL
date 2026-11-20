class PayoutError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = "PayoutError";
        this.statusCode = statusCode;
    }
}

module.exports = {PayoutError}
