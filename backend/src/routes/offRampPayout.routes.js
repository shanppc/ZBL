const express = require("express");
const router = express.Router();

const {OffRampPayout} = require("../controllers/offRampPayout.controller");

router.post("/off-ramp", OffRampPayout);

module.exports = router
