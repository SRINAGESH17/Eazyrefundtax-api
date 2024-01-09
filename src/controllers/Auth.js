
const _ = require("lodash");
const firebase = require('../../config/firebase');
const { failedResponse, successResponse } = require("../utils/message");
const Admin = require("../models/Admin");
const generateId = require("../utils/genRandomId");
const yup = require('yup');
const UserRole = require("../models/UserRole");




exports.getRole = async (req, res) => {
   const firebaseId =req.currUser.uid;

  if (_.isEmpty(firebaseId)) {
    return res.status(400).json(failedResponse(400, false, "User not found."));
  }

  try {
    const user = await UserRole.findOne({ firebaseId});
    console.log(user)

    if (_.isEmpty(user)) {
     return res.status(400).json(failedResponse(400, false, "User not found."));
    }

    const role = user.role;

    const refValue = role.client
      ? "clients"
      : role.subAdmin
      ? "sub_admins"
      : role?.admin
      ? "admins"
      : role?.employee
      ? "employees"
      : "";

    const pipeline = [
      {
        $match: {
          firebaseId,
        },
      },
      {
        $lookup: {
          from: refValue,
          localField: "userMongoId",
          foreignField: "_id",
          as: "users",
        },
      },
      {
        $addFields: {
          userId: {
            $arrayElemAt: ["$users.id", 0],
          },
          designation: {
            $arrayElemAt: ["$users.designation", 0],
          },
          name:{
            $arrayElemAt: ["$users.name", 0],
          },
          email:{
            $arrayElemAt: ["$users.email", 0],
          },
          photo:{
            $arrayElemAt: ["$users.photo", 0],

          }
        },
      },
      {
        $project: {
          users: 0,
        },
      },
    ];

    const Role = await UserRole.aggregate(pipeline);

    if (_.isEmpty(Role)) {
      return res.status(400).json(failedResponse(400, false, "Role not found."));
    }

    if (role.employee) {
      let newObj = {};
      switch (Role[0].designation) {
        case "Caller":
          newObj = { caller: true };
          break;
        case "Preparer":
          newObj = { preparer: true };
          break;
        case "Reviewer":
          newObj = { reviewer: true };
          break;
        case "Final Drafter":
          newObj = { finalDrafter: true };
          break;
        default:
          break;
      }
      Role[0].role = {...(Role[0].role || []), ...newObj};

    }
    console.log(Role[0])

    return res
      .status(201)
      .json(successResponse(201, true, "Fetch Role successfully", Role[0]));
  } catch (error) {
    console.log(error)
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


exports.createClient = async (req, res) => {
  try {
    const {
      name,
      mobileNumber,
      whatsappNumber,
      email,
      password,
      referrenceType,
      callId,
      referralId,
    } = req.body;

    console.log(req.body, "registration details received");

    let referredBy, caller,call;

    if (referrenceType === "CallId") {
      call=await Call.findOneAndUpdate({id:callId}, { status: "REGISTERED" });
      const callData = await Call.findOne({id:callId}).select("currentEmployee");
      if (callData && callData.currentEmployee) {
        referredBy = callData.currentEmployee;
        caller = callData.currentEmployee;
      }
    } else if (referrenceType === "ReferredBy") {
      let user;
      user = await Admin.findOne({ id: referralId });
      if (_.isEmpty(user)) {
        user = await Employee.findOne({ id: referralId });
      }
      if (_.isEmpty(user)) {
        user = await Client.findOne({ id: referralId });
      }
      if (_.isEmpty(user)) {
        user = await SubAdmin.findOne({ id: referralId });
      }
      if (!user) {
        return res
          .status(400)
          .json(failedResponse(400, false, "Invalid referralId"));
      }

      referredBy = user.userRole;
    } else {
      return res
        .status(400)
        .json(failedResponse(400, false, "Invalid referrenceType"));
    }

    const isEmailExist = await Client.exists({ email });
    const emailExistsInAuth = await checkEmailExistsInAuth(email);
    if (emailExistsInAuth || isEmailExist) {
      return res
        .status(400)
        .json(failedResponse(400, false, "Email already exists."));
    }

    const isMobExist = await Client.exists({ mobileNumber });
    const mobileExistsInAuth = await checkMobileExistsInAuth(mobileNumber);
    if (mobileExistsInAuth || isMobExist) {
      return res
        .status(400)
        .json(failedResponse(400, false, "Mobile number already exists."));
    }

    const randomNum = await getUniqueNumber();

    const newClient = new Client({
      id: randomNum,
      name,
      mobileNumber,
      whatsappNumber,
      email,
      password,
      referredBy,
      callId:call._id,
      caller,
    });

    const savedClient = await newClient.save();

    const clientCred = await firebase.auth().createUser({
      email,
      password,
      mobileNumber,
      emailVerified: false,
      disabled: false,
    });

    const clientCredId = clientCred.uid;

    const clientRole = new UserRole({
      userMongoId: savedClient._id,
      firebaseId: clientCredId,
      "role.client": true,
      userModel: "clients",
    });

    const clientRoleSaved = await clientRole.save();
    if (!clientRoleSaved) {
      return res
        .status(500)
        .json(failedResponse(500, false, "Something went wrong"));
    }

    const newClientYearlyTax = new ClientYearlyTaxation({
        taxYear:moment().format("YYYY"),
        client:savedClient._id,
        caller
    });
    const savedClientYearlyTax = await newClientYearlyTax.save();
    if (caller) {
      await Caller.findByIdAndUpdate(caller, {
        $push: { clients: savedClient._id,clientYearlyTaxations:savedClientYearlyTax._id },
      });
    }
    await UserRole.findByIdAndUpdate(referredBy, {
      $push: { referredTo: clientRoleSaved._id },
    });
    newClient.userRole = clientRoleSaved._id;
    newClient.clientYearlyTaxations.push(savedClientYearlyTax._id)
    await newClient.save();
    
    await ClientSuccessRegister(email, password, name);

    return res
      .status(201)
      .json(successResponse(201, true, "Client created successfully"));
  } catch (error) {
    console.log(error)
    if (error.name === "ValidationError") {
      return res.status(400).json(failedResponse(400, false, error.message));
    }
    console.error(error);
    return res
      .status(500)
      .json(failedResponse(500, false, "Internal Server Error", error));
  }
};

exports.updatePassword=async (req, res) => {
  try {
    const {uid}= req.currUser;
    const { oldPassword, newPassword} = req.body;

    // Authenticate user with Firebase
    const user = await firebase.auth().getUser(uid);

    // Verify old password
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, oldPassword);


    try {
      await firebase.auth().reauthenticateWithCredential(credential);
    } catch (reauthError) {
   
      res.status(401).json(failedResponse(401,false,"Invalid old password"));
      return;
    }

    // Update password
    await firebase.auth().updateUser(uid, {
      password: newPassword,
    });

    res.status(201).json(successResponse(201,true,"Password updated successfully" ));
  } catch (error) {
    console.error(error);
    res.status(500).json(failedResponse(500,false,"Internal Server Error" ));
  }
}