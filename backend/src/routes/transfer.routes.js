const express = require("express");
const router = express.Router();
const {createTransfer} = require("../controllers/transfer.controller");

router.post("/", createTransfer);

module.exports = router;