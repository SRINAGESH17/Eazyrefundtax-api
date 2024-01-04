const yup = require("yup");
const mongoose = require("mongoose");
const firebase = require("../../config/firebase");
const {
  checkEmailExistsInAuth,
  checkMobileExistsInAuth,
} = require("../utils/helperFunc");
const Employee = require("../models/Employee");
const {
  VendorSuccessRegister,
  EmployeeSuccessRegister,
} = require("../utils/sendMail");
const Caller = require("../models/Caller");
const Preparer = require("../models/Preparer");
const Reviewer = require("../models/Reviewer");
const FinalDrafter = require("../models/FinalDrafter");
const { failedResponse, successResponse } = require("../utils/message");
const generateId = require("../utils/genRandomId");
const UserRole = require("../models/UserRole");
const _ = require("lodash");
const Call = require("../models/Call");
const Client = require("../models/Client");
const SubAdmin = require("../models/SubAdmin");


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
    // await createEmployeeSchema.validate(req.body, { abortEarly: false });

    console.log(req.body);

    const {
      name,
      mobileNumber,
      email,
      password,
      designation,
      identityType,
      identityNumber,
      state,
      zipCode,
    } = req.body;

    console.log(req.body, "Create employee data received");

    // Check if email already exists in Firebase Authentication
    const isEmailExist = await Employee.find({ email });
    const emailExistsInAuth = await checkEmailExistsInAuth(email);
    if (emailExistsInAuth || !_.isEmpty(isEmailExist)) {
      return res
        .status(400)
        .json(failedResponse(400, false, "Email already exists."));
    }

    // Check if mobile number already exists
    const isMobExist = await Employee.find({ mobileNumber });
    const mobileExistsInAuth = await checkMobileExistsInAuth(mobileNumber);
    if (mobileExistsInAuth || !_.isEmpty(isMobExist)) {
      return res
        .status(400)
        .json(failedResponse(400, false, "Mobile number already exists."));
    }

    var randomNum = "";

    async function getUniqueNumber() {
      randomNum = "E" + generateId(2);

      try {
        const result = await Employee.findOne({ id: randomNum });
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
      case "Final Drafter":
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
    newEmp.userRole = empRoleSaved._id;

    await newEmp.save();

    await EmployeeSuccessRegister(email, password, name);

    return res
      .status(201)
      .json(successResponse(201, true, "Employee created successfully"));
  } catch (error) {
    // Handle Yup validation errors

    console.log(error);
    if (error.name === "ValidationError") {
      console.log(error.errors);

      return res
        .status(400)
        .json(failedResponse(400, false, "Validation failed", error.errors));
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

    console.log(page, "page changed");

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
    pipeline.push({ $sort: { created: -1 } });

    // Count stage to get the total number of documents
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: "totalData" });

    const [totalDataCount] = await Employee.aggregate(countPipeline);
    if (!totalDataCount.totalData || totalDataCount.totalData === 0) {
      return res.status(404).json(failedResponse(404, false, "No Data found"));
    }
    if (Boolean(download?.toLowerCase() !== "true")) {
      const skip = (page - 1) * limit;
      pipeline.push({ $skip: skip }, { $limit: parseInt(limit) });
    }

    // Execute the aggregation pipeline
    const limitedData = await Employee.aggregate(pipeline);

    console.log(limitedData.length);

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
    const {role,userMongoId}= req.userRole;
    let employeeId;
    if (role.employee) {
      employeeId=userMongoId;
    } else {
       employeeId = req.params.id;
      
    }

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
    console.log(employee, "employee data");
    // Extract specific fields from the employee object
    const {
      name,
      email,
      mobileNumber,
      designation,
      state,
      zipCode,
      identity,
      photo,
    } = employee;

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
    const {role,userMongoId}=req.userRole;
    let id;
    if (role.employee) {
      id= userMongoId;
    } else {
        id  = req.params.id;
      
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Employee ID is required.",
      });
    }
    let photo = "",
      _IDURL = "";

    if (!_.isEmpty(req.files)) {
      if (req.files["photo"]?.length > 0) {
        photo = req.files["photo"][0].location;
      }
      if (req.files["_IDURL"]?.length > 0) {
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
      zipCode,
    } = req.body;

    console.log(req.body, req.files, "employee updatation details received");

    // Find the employee by ID
    const employee = await Employee.findById(id).populate("userRole").exec();
    console.log(employee);

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
      await firebase.auth().updateUser(employee.userRole.firebaseId, {
        phoneNumber: mobileNumber,
      });
    }

    // Update the employee fields
    employee.name = name;
    employee.mobileNumber = mobileNumber;
    employee.email = email;
    //  employee.designation = designation;
    employee.state = state;
    employee.zipCode = zipCode;
    employee.identity = {
      _IDType: identityType,
      _IDNumber: identityNumber,
      url: _IDURL || employee.identity.url, // Assuming you want to keep the existing URL
    };

    if (photo) {
      console.log(photo, "photo received");
    }
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

const deleteUserRole = async (userId) => {
  // Delete the employee's Firebase Authentication account
  await firebase.auth().deleteUser(userId);

  // Delete the employee's entry from the UsersRoles collection
  await UserRole.deleteOne({ firebaseId: userId });
};

const deleteEmployeeFromSubAdmins = async (employeeId) => {
  // Remove the employee ID from the subAdmins collection
  await SubAdmin.updateMany(
    { employees: employeeId },
    { $pull: { employees: employeeId } }
  );
};

const removeEmployeeReferences = async (employee) => {
  const { designation, designationRef } = employee;

  const updateClient = async (client, field) => {
    await Client.findByIdAndUpdate(client, { [field]: null });
  };

  const updateTaxation = async (data, field) => {
    await clientYearlyTaxations.findByIdAndUpdate(data, { [field]: null });
  };

  const updateDocument = async (data, field) => {
    await clientsDocuments.findByIdAndUpdate(data, { [field]: null });
  };

  switch (designation) {
    case "Caller":
      await Promise.all([
        ...designationRef.calls.map((call) =>
          Call.findByIdAndUpdate(call, { currentEmployee: null })
        ),
        ...designationRef.clients.map((client) =>
          updateClient(client, "caller")
        ),
        ...designationRef.clientYearlyTaxations.map((data) =>
          updateTaxation(data, "caller")
        ),
        ...designationRef.clientsDocuments.map((data) =>
          updateDocument(data, "caller")
        ),
        ...designationRef.taxReturnDocuments.map((data) =>
          updateDocument(data, "caller")
        ),
      ]);
      break;

    case "Preparer":
      await Promise.all([
        ...designationRef.clients.map((client) =>
          updateClient(client, "preparer")
        ),
        ...designationRef.clientYearlyTaxations.map((data) =>
          updateTaxation(data, "preparer")
        ),
      ]);
      break;
    case "Reviewer":
      await Promise.all([
        ...designationRef.clients.map((client) =>
          updateClient(client, "reviewer")
        ),
        ...designationRef.clientYearlyTaxations.map((data) =>
          updateTaxation(data, "reviewer")
        ),
      ]);
      break;
    case "Final Drafter":
      await Promise.all([
        ...designationRef.clients.map((client) =>
          updateClient(client, "finalDrafter")
        ),
        ...designationRef.clientYearlyTaxations.map((data) =>
          updateTaxation(data, "finalDrafter")
        ),
      ]);
      break;

    // Add cases for other designations (Reviewer, FinalDrafter) if needed

    default:
      break;
  }
};

/**--------------------------------Delete Employee------------------------------------------ */

exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(id, "delete user id");

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid Employee ID.",
      });
    }

    const employee = await Employee.findById(id).populate(["designationRef","userRole"]).exec();
    console.log(employee);

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found.",
      });
    }

    await Promise.all([
      deleteUserRole(employee.userRole.firebaseId),
      Employee.findByIdAndDelete(id),
      deleteEmployeeFromSubAdmins(id),
      removeEmployeeReferences(employee),
    ]);

    return res
      .status(200)
      .json(successResponse(200, true, "Employee deleted successfully"));
  } catch (error) {
    console.error("Error deleting employee:", error);
    res
      .status(500)
      .json(failedResponse(500, false, "Internal Server Error", error.message));
  }
};

/**----------------------------------Assign employee to subAdmins------------------------------- */
exports.assignEmployeeToSubAdmin=  async (req, res) => {
  try {
    const { employeeId, subAdminId } = req.body;

    // Validate employee ID and subadmin ID
    if (!mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(subAdminId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid employee or subadmin ID.",
      });
    }

    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found.",
      });
    }

    // Check if subadmin exists
    const subAdmin = await SubAdmin.findById(subAdminId);
    if (!subAdmin) {
      return res.status(404).json({
        success: false,
        error: "SubAdmin not found.",
      });
    }

    // Check if the employee is already assigned to another subadmin
    if (employee.assignedAdmin) {
     await SubAdmin.findByIdAndUpdate(employee.assignedAdmin,{$pull:{employees:employee._id}});
     
    }

    // Assign employee to the subadmin
    employee.assignedAdmin = subAdminId;
    await employee.save();

    // Update subadmin's employees array
    subAdmin.employees.push(employeeId);
    await subAdmin.save();

    return res.status(200).json(successResponse(200, true, "Employee assigned to SubAdmin successfully"));

  } catch (error) {
    console.error("Error assigning employee to subadmin:", error);
    res.status(500).json(failedResponse(500, false, "Internal Server Error", error.message));

  }
};



