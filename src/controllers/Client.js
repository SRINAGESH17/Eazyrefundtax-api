const Admin = require("../models/Admin");
const Caller = require("../models/Caller");
const Client = require("../models/Client");
const Call = require("../models/Call");
const ClientYearlyTaxation = require("../models/ClientYearlyTaxation");
const UserRole = require("../models/UserRole");
const generateId = require("../utils/genRandomId");
const {
  checkEmailExistsInAuth,
  checkMobileExistsInAuth,
} = require("../utils/helperFunc");
const { failedResponse, successResponse } = require("../utils/message");
const { ClientSuccessRegister } = require("../utils/sendMail");
const yup= require('yup');
const firebase = require('../../config/firebase');
const moment = require('moment')


const clientSchema = yup.object().shape({
  name: yup.string().required("Name is required"),
  mobileNumber: yup.string().required("Mobile number is required"),
  whatsappNumber: yup.string(),
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  password: yup.string().required("Password is required"),
  referrenceType: yup
    .string()
    .oneOf(["CallId", "ReferredBy"], "Invalid referrenceType")
    .required("Referrence type is required"),
  callId: yup.string().when("referrenceType", {
    is: "CallId",
    then: yup
      .string()
      .required("callId is required when referrenceType is CallId"),
    otherwise: yup.string(),
  }),
  referralId: yup.string(),
});

// API Endpoint
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
    if (error.name === "ValidationError") {
      return res.status(400).json(failedResponse(400, false, error.message));
    }
    console.error(error);
    return res
      .status(500)
      .json(failedResponse(500, false, "Internal Server Error", error));
  }
};

async function getUniqueNumber() {
  let randomNum = "C" + generateId(6);

  try {
    const result = await Client.findOne({ id: randomNum });
    if (result) {
      return getUniqueNumber();
    }
    return randomNum;
  } catch (err) {
    throw err;
  }
}

exports.getActiveClientYearlyTaxations = async (req, res) => {
  try {
    const { searchKey } = req.query;

    const aggregationPipeline = [
    
      {
        $lookup: {
          from: 'clients',
          localField: 'client',
          foreignField: '_id',
          as: 'clientInfo',
        },
      },
      {
        $unwind: '$clientInfo',
      },
      {
        $project: {
          _id: 1,
          clientId: '$clientInfo.id',
          clientName: '$clientInfo.name',
          clientEmail: '$clientInfo.email',
          
        },
      },
    ];
    if (searchKey) {
      aggregationPipeline.push(  {
        $match: {
          $or: [
            { 'clientInfo.id': { $regex: searchKey, $options: 'i' } },
            { 'clientInfo.email': { $regex: searchKey, $options: 'i' } },
            { 'clientInfo.name': { $regex: searchKey, $options: 'i' } },
          ],
        },
      },)
    }

    const taxations = await ClientYearlyTaxation.aggregate(aggregationPipeline);

    return res.status(200).json(successResponse(200,true,"Successfully data fetched",taxations));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(failedResponse(500, false, 'Internal Server Error', error));
  }
};

