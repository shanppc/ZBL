const{ createCustomer, 
        getAllCustomers, 
        getCustomerById
      } = require("../services/customer.service");

async function registerCustomer(req, res) {
  try {
    const { fullName, email } = req.body;

    // Validate input
    if (
      typeof fullName !== "string" ||
      typeof email !== "string" ||
      !fullName.trim() ||
      !email.trim()
    ) {
      return res.status(400).json({
        status: "error",
        message: "Full name and email are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        status: "error",
        message: "Invalid email format",
      });
    }

    // Create customer
    const customer = await createCustomer(fullName, email);

    return res.status(201).json({
      status: "success",
      message: "Customer created successfully",
      data: customer,
    });

  } catch (error) {
    // Handle duplicate email
    if (error.code === "P2002") {
      return res.status(409).json({
        status: "error",
        message: "Email already exists",
      });
    }

    console.error("Customer creation error:", error);

    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
}

async function listCustomers(req, res) {
  try {

    const listOfCustomers = await getAllCustomers();

    return res.status(200).json({
      status: "success",
      message: "Customers fetched successfully",
      data: listOfCustomers
    })

  } catch(error) {
    console.error("unexpected error", error)
    return res.status(500).json({
      status: "error",
      message: "unexpected error"
    });
  }
 
}

async function getCustomerWithId(req, res) {
  try {
    const id = req.params.id;
    const customer = await getCustomerById(id);
    if(!customer) {
      return res.status(404).json({
        status: "failed",
        message: "customer does not exist!"
      });
    }
    return res.status(200).json({
      status: "success", 
      message: "customer fetched successfuly",
      data: customer
    });

  } catch(err){
      console.error("unexpected error", err)
    return res.status(500).json({
      status: "error",
      message: "unexpected error"
    });

  }  

}

module.exports = {
  registerCustomer, 
  listCustomers,
  getCustomerWithId
};
