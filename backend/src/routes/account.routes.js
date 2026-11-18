const express = require("express");
const router = express.Router();
const {createBankAccount, getAccountWithNumber, getTxns} = require("../controllers/account.controller");

router.post("/", createBankAccount);
router.get("/:accountNumber", getAccountWithNumber);
router.get("/:accountNumber/transactions", getTxns);

module.exports = router;