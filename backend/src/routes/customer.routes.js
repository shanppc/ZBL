const express = require("express");
const router = express.Router();
const {
  registerCustomer,
  listCustomers,
  getCustomerWithId
} = require("../controllers/customer.controller");

const {AllAccounts} = require("../controllers/account.controller")
router.post("/", registerCustomer);
router.get("/", listCustomers);
router.get("/:id", getCustomerWithId);
router.get("/:customerId/accounts", AllAccounts);


module.exports = router;
