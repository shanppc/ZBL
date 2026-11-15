const express = require("express");
const app = express();
const customerRoutes = require("./routes/customer.routes");
const accountRoutes = require("./routes/account.routes");


// Middleware
app.use(express.json());

app.use("/api/customers", customerRoutes);
app.use("/api/accounts", accountRoutes);

module.exports = app;