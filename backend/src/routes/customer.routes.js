const express = require("express");
const router = express.Router();
const {
  registerCustomer,
  listCustomers,
  getCustomerWithId
} = require("../controllers/customer.controller");

router.post("/", registerCustomer);
router.get("/", listCustomers);
router.get("/:id", getCustomerWithId);

module.exports = router;
