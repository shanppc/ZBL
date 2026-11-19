const express = require("express");
const app = express();
const customerRoutes = require("./routes/customer.routes");
const accountRoutes = require("./routes/account.routes");
const transferRoutes = require("./routes/transfer.routes");
const depositRoutes = require("./routes/deposit.routes");


// Middleware
app.use(express.json());

app.use("/api/customers", customerRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/transfer", transferRoutes);
app.use("/api/v1/deposits", depositRoutes);

module.exports = app;