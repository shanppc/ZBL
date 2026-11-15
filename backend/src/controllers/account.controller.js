const { createAccount, getAccountByNumber, getAllAccounts } = require("../services/account.service");

async function createBankAccount(req, res) {
    try {
        const { customerId } = req.body;

        // Validate customer ID
        if (
            typeof customerId !== "string" ||
            !customerId.trim()
        ) {
            return res.status(400).json({
                status: "error",
                message: "Customer ID is required"
            });
        }

        // Create bnak account
        const bankAccount = await createAccount(customerId.trim());

        if (!bankAccount) {
            return res.status(404).json({
                status: "error",
                message: "Customer does not exist"
            });
        }

        return res.status(201).json({
            status: "success",
            message: "Account created successfully",
            data: bankAccount
        });

    } catch (err) {
        console.error("Account creation error:", err);

        return res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
}

async function getAccountWithNumber(req, res) {
 try{
      const accountNumber = req.params.accountNumber;

      const account = await getAccountByNumber(accountNumber);

      if(!account) {
            return res.status(404).json({
                status: "not found",
                message: "account does not exist" 
            });
        }

      return res.status(200).json({
            status: "success",
            message: "account fetched successfuly",
            data: account
        });

    }
    catch(error){
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "unexpected error"
        });
    }
    
}


async function AllAccounts(req, res) {
    try {
        const customerId = req.params.customerId;

        if (!customerId || !customerId.trim()) {
            return res.status(400).json({
                status: "error",
                message: "Customer ID is required"
            });
        }

        const accounts = await getAllAccounts(customerId.trim());

        if (accounts === null) {
            return res.status(404).json({
                status: "error",
                message: "Customer does not exist"
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Accounts fetched successfully",
            data: accounts
        });

    } catch (error) {
        console.error("Get customer accounts error:", error);

        return res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
}
module.exports = { createBankAccount, getAccountWithNumber, AllAccounts};