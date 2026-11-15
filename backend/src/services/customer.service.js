const prisma = require("../config/prisma");

async function createCustomer(fullName, email) {
  const customer = await prisma.customer.create({
    data: {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
    },
  });

  return customer;
}

async function getAllCustomers() {
  const customers = await prisma.customer.findMany();

  return customers;
}

async function getCustomerById(id) {
    const customer = await prisma.customer.findUnique({
      where: {id}
    });
    return customer;
}

module.exports = {
  createCustomer, 
  getAllCustomers, 
  getCustomerById
};
