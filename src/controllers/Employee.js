const yup = require("yup");
const firebase = require("../../config/firebase");
const {
  checkEmailExistsInAuth,
  checkMobileExistsInAuth,
} = require("../utils/helperFunc");
const Employee = require("../models/Employee");
const { VendorSuccessRegister } = require("../utils/sendMail");
const Caller = require("../models/Caller");
const Preparer = require("../models/Preparer");
const Reviewer = require("../models/Reviewer");
const FinalDrafter = require("../models/FinalDrafter");
const { failedResponse, successResponse } = require("../utils/message");
const generateId = require("../utils/genRandomId");
const UserRole = require("../models/UserRole");
const _= require("lodash")

// Define a Yup schema for request data validation
const createEmployeeSchema = yup.object().shape({
  name: yup.string().required("Name is required"),
  mobileNumber: yup.string().required("Mobile number is required"),
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  password: yup.string().required("Password is required"),
  designation: yup.string().required("Designation is required"),
  address: yup.string(),
  identityType: yup.string(),
  identityNumber: yup.string(),
});
const updateEmployeeSchema = yup.object().shape({
  name: yup.string().required("Name is required"),
  mobileNumber: yup.string().required("Mobile number is required"),
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  designation: yup.string().required("Designation is required"),
  address: yup.string(),
  identityType: yup.string(),
  identityNumber: yup.string(),
});

exports.createEmployee = async (req, res) => {
  try {
    let photo = "";
    let _IDURL = "";

    if (req.files) {
      if (req.files["photo"] && req.files["photo"].length > 0) {
        photo = req.files["photo"][0].location;
      }
      if (req.files["_IDURL"] && req.files["_IDURL"].length > 0) {
        _IDURL = req.files["_IDURL"][0].location;
      }
    }

    // Validate request data using Yup schema
    await createEmployeeSchema.validate(req.body, { abortEarly: false });

    const {
      name,
      mobileNumber,
      email,
      password,
      designation,
      identityType,
      identityNumber,
      state,
      zipCode
    } = req.body;

    // Check if email already exists in Firebase Authentication
    const emailExistsInAuth = await checkEmailExistsInAuth(email);
    if (emailExistsInAuth) {
      return res
        .status(400)
        .json(failedResponse(400, false, "Email already exists."));
    }

    // Check if mobile number already exists
    const mobileExistsInAuth = await checkMobileExistsInAuth(mobileNumber);
    if (mobileExistsInAuth) {
      return res
        .status(400)
        .json(failedResponse(400, false, "Mobile number already exists."));
    }

    var randomNum = "";

    async function getUniqueNumber() {
      randomNum = "E" + generateId(2);

      try {
        const result = await SubAdmin.findOne({ id: randomNum });
        if (result) {
          return getUniqueNumber();
        }
        return randomNum;
      } catch (err) {
        throw err;
      }
    }
    getUniqueNumber();

    const newEmp = new Employee({
      id: randomNum,
      name,
      mobileNumber,
      email,
      designation,
      state,
      zipCode,
      identity: {
        _IDType: identityType,
        _IDNumber: identityNumber,
        url: _IDURL,
      },
      photo,
    });

    const savedEmp = await newEmp.save();
    if (!savedEmp) {
      return res
        .status(500)
        .json(failedResponse(500, false, "Something went wrong"));
    }

    // Create a user in Firebase Authentication
    const empCred = await firebase.auth().createUser({
      email,
      password,
      mobileNumber,
      photoURL: photo,
      emailVerified: false,
      disabled: false,
    });

    const empCredId = empCred.uid;

    // Save user roles
    const empRole = new UserRole({
      userMongoId: savedEmp._id,
      firebaseId: empCredId,
      "role.employee": true,
      userModel: "employees",
    });

    const empRoleSaved = await empRole.save();
    if (!empRoleSaved) {
      return res
        .status(500)
        .json(failedResponse(500, false, "Something went wrong"));
    }

    // Create a designation document based on the employee's role
    let newDesInstance, savedDesInstance;

    switch (designation) {
      case "Caller":
        newDesInstance = new Caller({ employee: savedEmp._id });
        newEmp.designationModel = "callers";

        break;
      case "Preparer":
        newDesInstance = new Preparer({ employee: savedEmp._id });
        newEmp.designationModel = "preparers";

        break;
      case "Reviewer":
        newDesInstance = new Reviewer({ employee: savedEmp._id });
        newEmp.designationModel = "reviewers";

        break;
      case "FinalDrafter":
        newDesInstance = new FinalDrafter({ employee: savedEmp._id });
        newEmp.designationModel = "final_drafters";

        break;
      default:
        // Handle the case where designation is not recognized
        return res
          .status(500)
          .json(failedResponse(500, false, "Invalid designation"));
    }

    savedDesInstance = await newDesInstance.save();
    newEmp.designationRef = savedDesInstance._id;
    newEmp.userRole = empRole._id;

    await newEmp.save();

    // Additional logic for VendorSuccessRegister function is not provided in the code

    return res
      .status(201)
      .json(successResponse(201, true, "Employee created successfully"));
  } catch (error) {
    // Handle Yup validation errors
    console.log(error)
    if (error.name === "ValidationError") {
      const validationErrors = error.errors.reduce((acc, curr) => {
        acc[curr.path] = curr.message;
        return acc;
      }, {});
      return res
        .status(400)
        .json(
          failedResponse(400, false, "Validation failed", validationErrors)
        );
    }

    // Handle other errors...
    res
      .status(500)
      .json(failedResponse(500, false, "Internal Server Error", error));
  }
};

exports.fetchEmployees = async (req, res) => {
  try {
    const { searchKey, page = 1, limit = 10, download } = req.query;

    let pipeline = [];

    // Match stage for searchKey
    if (searchKey) {
      pipeline.push({
        $match: {
          $or: [
            { id: { $regex: new RegExp(searchKey, "i") } },
            { name: { $regex: new RegExp(searchKey, "i") } },
            { email: { $regex: new RegExp(searchKey, "i") } },
            { mobileNumber: { $regex: new RegExp(searchKey, "i") } },
            { designation: { $regex: new RegExp(searchKey, "i") } },
            { status: { $regex: new RegExp(searchKey, "i") } },
          ],
        },
      });
    }

    // Add other stages for filtering, if needed

    // Projection stage to include specific fields
    pipeline.push({
      $project: {
        id: 1,
        name: 1,
        email: 1,
        mobileNumber: 1,
        designation: 1,
        status: 1,
        assignedAdmin: "$assignedAdmin.id", // Assuming assignedAdmin is a reference to sub_admins
      },
    });

    // Count stage to get the total number of documents
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: "totalData" });

    const [totalDataCount] = await Employee.aggregate(countPipeline);
    if (!totalDataCount.totalData || totalDataCount.totalData === 0) {
      return res.status(404).json(failedResponse(404, false, "No Data found"));
    }
    if (Boolean(download?.toLowerCase() !=="true")) {
      const skip = (page - 1) * limit;
      pipeline.push({ $skip: skip }, { $limit: parseInt(limit) });
     }
   
    
    

    // Execute the aggregation pipeline
    const limitedData = await Employee.aggregate(pipeline);

    const currentPage = parseInt(page) || 1;

    res.status(200).json(
      successResponse(200, true, "Employees Fetch successfully", {
        limitedData,
        totalData: totalDataCount ? totalDataCount.totalData : 0,
        currentPage,
      })
    );
  } catch (error) {
    console.error("Error fetching employees:", error);
    res
      .status(500)
      .json(
        failedResponse(500, false, "Internal Server Error", error?.message)
      );
  }
};

exports.fetchEmployeeById = async (req, res) => {
  try {
    const employeeId = req.params.id;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: "Employee ID is required.",
      });
    }

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found.",
      });
    }

    // Extract specific fields from the employee object
    const { name, email, mobileNumber, designation, state,zipCode, identity, photo } =
      employee;

    res.status(200).json(
      successResponse(200, true, "Employee Fetched successfully", {
        name,
        email,
        mobileNumber,
        designation,
        state,
        zipCode,
        identity,
        photo,
      })
    );
  } catch (error) {
    console.error("Error fetching employee by ID:", error);
    res
      .status(500)
      .json(
        failedResponse(500, false, "Internal Server Error", error?.message)
      );
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Employee ID is required.",
      });
    }
    let photo = "",
      _IDURL = "";
      console.log(req.files)
    if (!_.isEmpty(req.files)) {
      if (req.files["photo"]?.length > 0) {
        photo = req.files["photo"][0].location;
      }
      if (req.files["_IDURL"].length > 0) {
        _IDURL = req.files["_IDURL"][0].location;
      }
    }
    

    // Validate request data using Yup schema
    // Update the schema as needed for the update operation
    // Assuming you have an updateEmployeeSchema for validation
    // You can adjust it based on the fields that can be updated
    await updateEmployeeSchema.validate(req.body, { abortEarly: false });

    const {
      name,
      mobileNumber,
      email,
      designation,
      identityType,
      identityNumber,
      state,
      zipCode
    } = req.body;

    // Find the employee by ID
    const employee = await Employee.findById(id).populate("userRole").exec();
    console.log(employee)

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found.",
      });
    }

    // Check if the updated email is already associated with another employee
    if (email !== employee.email) {
      const emailExistsInEmployees = await Employee.findOne({ email });
      if (emailExistsInEmployees) {
        return res
          .status(400)
          .json(
            failedResponse(
              400,
              false,
              "Email is already associated with another employee."
            )
          );
      }

      const emailExistsInAuth = await checkEmailExistsInAuth(email);
      if (emailExistsInAuth) {
        return res
          .status(400)
          .json(
            failedResponse(
              400,
              false,
              "Email is already associated with another user account."
            )
          );
      }

      // Update email in Firebase Authentication
      await firebase.auth().updateUser(employee.userRole.firebaseId, { email });
    }

    // Check if the updated mobile number is already associated with another employee
    if (mobileNumber !== employee.mobileNumber) {
      const mobileExistsInEmployees = await Employee.findOne({ mobileNumber });
      if (mobileExistsInEmployees) {
        return res
          .status(400)
          .json(
            failedResponse(
              400,
              false,
              "Mobile number is already associated with another employee."
            )
          );
      }

      const mobileExistsInAuth = await checkMobileExistsInAuth(mobileNumber);
      if (mobileExistsInAuth) {
        return res
          .status(400)
          .json(
            failedResponse(
              400,
              false,
              "Mobile number is already associated with another user account."
            )
          );
      }

      // Update mobile number in Firebase Authentication
      await firebase
        .auth()
        .updateUser(employee.userRole.firebaseId, {
          phoneNumber: mobileNumber,
        });
    }

    // Update the employee fields
    employee.name = name;
    employee.mobileNumber = mobileNumber;
    employee.email = email;
    employee.designation = designation;
    employee.state = state;
    employee.zipCode = zipCode;
    employee.identity = {
      _IDType: identityType,
      _IDNumber: identityNumber,
      url: _IDURL || employee.identity.url, // Assuming you want to keep the existing URL
    };
    employee.photo = photo || employee.photo;

    // Save the updated employee
    const updatedEmployee = await employee.save();

    // Assuming you have a similar logic for UsersRoles updates as in the createEmployee API

    return res
      .status(201)
      .json(successResponse(201, true, "Employee updated successfully"));
  } catch (error) {
    // Handle Yup validation errors
    if (error.name === "ValidationError") {
      const validationErrors = error.errors.reduce((acc, curr) => {
        acc[curr.path] = curr.message;
        return acc;
      }, {});
      return res
        .status(400)
        .json(
          failedResponse(400, false, "Validation failed", validationErrors)
        );
    }

    // Handle other errors...
    console.error("Error updating employee:", error);
    res
      .status(500)
      .json(failedResponse(500, false, "Internal Server Error", error));
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Employee ID is required.",
      });
    }

    // Find the employee by ID
    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found.",
      });
    }

    // Delete the employee's Firebase Authentication account
    await firebase.auth().deleteUser(employee.userRole.firebaseId);

    // Delete the employee from the Employees collection
    await Employee.findByIdAndDelete(id);

    // Delete the employee's entry from the UsersRoles collection
    await UserRole.findByIdAndDelete(employee.userRole._id);

    // Remove the employee ID from the subAdmins collection
    await SubAdmin.updateMany(
      { employees: employee._id },
      { $pull: { employees: employee._id } }
    );

    return res
      .status(200)
      .json(successResponse(200, true, "Employee deleted successfully"));
  } catch (error) {
    console.error("Error deleting employee:", error);
    res
      .status(500)
      .json(failedResponse(500, false, "Internal Server Error", error));
  }
};


