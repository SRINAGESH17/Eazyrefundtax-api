
const _ = require("lodash");
const firebase = require('../../config/firebase');
const { failedResponse, successResponse } = require("../utils/message");
const Admin = require("../models/Admin");
const generateId = require("../utils/genRandomId");
const yup = require('yup');
const UserRole = require("../models/UserRole");


exports.getRole = async (req, res) => {
  const firebaseId = req.currUser.uid;

  if (_.isEmpty(firebaseId)) {
    return res.status(400).json(failedResponse(400, false, "User not found."));
  }
  const user = await UserRole.findOne({ firebaseId })

  if (_.isEmpty(user)) {
    return res.status(400).json(failedResponse(400, false, "User not found."));
  }
  const role = user.role;

  const refValue =  role.vendor
  ? "vendors"
  : role.customer
  ? "customers"
  : role?.admin
  ? "admins"
  : role?.employee
  ? "employees"
  : "";

  try {
    const pipeline = [
      {
        $match: {
          firebaseId,
        },
      },
      {
        $lookup: {
          from:refValue,
          localField: "userId",
          foreignField: "_id",
          as: "users",
        },
      },
      {
        $addFields: {
          userId: {
            $arrayElemAt: [
              `$users.${
                role.vendor
                  ? "vendorId"
                  : role.customer
                  ? "customerId"
                  : role?.admin
                  ? "adminId"
                  : role?.employee
                  ? "empId"
                  : ""
              }`,
              0
            ],
          },
        },
      },{
        $project:{
          users:0
        }
      }
      
    ];

    
    const Role = await UserRole.aggregate(pipeline);

    if (_.isEmpty(Role)) {
      return res
        .status(400)
        .json(failedResponse(400, false, "Role not found."));
    }
    console.log("Role-------------------",Role[0]);

    return res
      .status(201)
      .json(successResponse(201, true, "Fetch Role successfully", Role[0]));
  } catch (error) {
    res.status(400).json(failedResponse(400, false, "Fetch Role failed"));
  }
};

exports.createAdmin = async (req, res, next) => {
  try {
    const schema = yup.object().shape({
      name: yup.string().transform((value) => (value === null ? "" : value)).required("Name is required."),
      email: yup.string().transform((value) => (value === null ? "" : value)).email("Invalid email-id.").required("Email is required."),
      mobileNumber: yup.string().transform((value) => (value === null ? "" : value)).required("Mobile number is required."),
      password: yup.string().transform((value) => (value === null ? "" : value)).required("Password is required.").matches(/^\S*$/, "Password should not contain spaces."),
    });

    const { name, email, mobileNumber, password,state,zipCode } = await schema.validate(req.body);

    let isEmailExists, isMobileNumberExists;

    try {
      isEmailExists = await firebase.auth().getUserByEmail(email);
    } catch (emailError) {
      if (emailError.code !== "auth/user-not-found") {
        return res.status(400).json(failedResponse(400, false, `Email error: ${emailError.code}`));
      }
    }

    try {
      isMobileNumberExists = await firebase.auth().getUserByPhoneNumber(mobileNumber);
    } catch (phoneError) {
      if (phoneError.code !== "auth/user-not-found") {
        return res.status(400).json(failedResponse(400, false, `Phone error: ${phoneError.code}`));
      }
    }

    if (isEmailExists) {
      return res.status(400).json(failedResponse(400, false, "Email already in use by another account."));
    }

    if (isMobileNumberExists) {
      return res.status(400).json(failedResponse(400, false, "Mobile number already in use by another account."));
    }

    const firebaseInfo = await firebase.auth().createUser({
      email,
      emailVerified: false,
      displayName: name,
      phoneNumber: mobileNumber,
      password,
      phoneNumberVerified: true,
      disabled: false,
    });

    let randomNum = "";

    const getUniqueNumber = async () => {
      randomNum = "A" + generateId(2);

        const result = await Admin.findOne({ id: randomNum });
        if (result) {
          return getUniqueNumber();
        }
        return randomNum;
     
    };

    await getUniqueNumber();

    const adminInstance = new Admin({
      id: randomNum,
      name,
      email,
      mobileNumber,
      state,
      zipCode
    });

   
    const savedAdminInstance = await adminInstance.save();
  

    if (_.isEmpty(savedAdminInstance)) {
      return res.status(500).json(failedResponse(500, false, "Error while signup."));
    }

    const rawData = {
      userMongoId: savedAdminInstance._id,
      firebaseId: firebaseInfo.uid,
      role: { admin: true },
      userModel: "admins",
    };

    const newUserRole = new UserRole(rawData);
    const savedUserRole = await newUserRole.save();

    if (_.isEmpty(savedUserRole)) {
      return res.status(500).json(failedResponse(500, false, "Error while signup."));
    }

    savedAdminInstance.userRole = savedUserRole._id;
    await savedAdminInstance.save();

    return res.status(201).json(successResponse(201, true, "Admin's signup successfully done.", {}));

  } catch (error) {
  
    if (error.errors) {
      return res.status(400).json(failedResponse(400, false, "Validation error", error.errors));
    } else {
      return res.status(500).json(failedResponse(500, false, "Internal Server Error", error));
    }
  }
};
