const express = require("express");
const router = express.Router();
const {createBankAccount} = require("../controllers/account.controller");

router.post("/", createBankAccount)

module.exports = router;