const express = require("express");
const router = express.Router();
const {createBankAccount, getAccountWithNumber} = require("../controllers/account.controller");

router.post("/", createBankAccount);
router.get("/:accountNumber", getAccountWithNumber);

module.exports = router;