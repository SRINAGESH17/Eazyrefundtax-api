const Call = require("../models/Call");
const yup = require("yup");
const generateId = require("../utils/genRandomId");
const { successResponse, failedResponse } = require("../utils/message");
const XLSX = require("xlsx");
const Caller = require("../models/Caller");
const mongoose = require("mongoose");
const Employee = require("../models/Employee");
const _= require('lodash')

const callSchema = yup.object().shape({
  slotName: yup.string().required("Slot name is required"),
  caller: yup.object().shape({
    name: yup.string(),
    mobileNumber: yup.string(),
    email: yup.string().email("Invalid email format"),
  }),
  comment: yup.string(),
  status: yup
    .string()
    .oneOf(
      [
        "REGISTERED",
        "CALLBACK",
        "WRONGNUMBER",
        "NOTINTERESTED",
        "DUPLICATE",
        "ALREADYFILED",
        "FIRST",
        "FOREIGNER",
        "INTERESTED",
        "MAILSENT",
      ],
      "Invalid status"
    ),
});
const updateCallSchema = yup.object().shape({
  status: yup.string().oneOf(["REGISTERED", "CALLBACK", "WRONGNUMBER", "NOTINTERESTED", "DUPLICATE", "ALREADYFILED", "FIRST", "FOREIGNER", "INTERESTED", "MAILSENT","PENDING"]),
  comment: yup.string(),
});

exports.createCallData = async (req, res) => {
  try {
    // Validate request data using Yup schema
    const validatedData = await callSchema.validate(req.body, {
      abortEarly: false,
    });

    const { caller, slotName, comment } = validatedData;

    // Check if the caller's email or mobile number already exists in the calls collection
    const existingCaller = await Call.findOne({
      $or: [
        { "caller.mobileNumber": caller.mobileNumber },
        { "caller.email": caller.email },
      ],
    });

    if (existingCaller) {
      return res
        .status(400)
        .json(failedResponse(400, false, "Caller already exists."));
    }

    var randomNum = "";

    async function getUniqueNumber() {
      randomNum = "CALL" + generateId(6);

      try {
        const result = await Call.findOne({ id: randomNum });
        if (result) {
          return getUniqueNumber();
        }
        return randomNum;
      } catch (err) {
        throw err;
      }
    }
    getUniqueNumber();

    const newCall = new Call({
      id: randomNum,
      slotName,
      caller,
      comment,
    });

    await newCall.save();

    return res
      .status(201)
      .json(successResponse(201, true, "Call created successfully"));
  } catch (error) {
    if (error instanceof yup.ValidationError) {
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
exports.ExcelSheetCallDataUpload = async (req, res, next) => {
  try {
    const { path } = req.file;
    const workbook = XLSX.readFile(path);
    const sheetName = workbook.SheetNames[0]; // Changed index to 0 for the first sheet
    const worksheet = workbook.Sheets[sheetName];
    const { slotName } = req.body;

    const data = XLSX.utils.sheet_to_json(worksheet);
 

    const callDataPromises = data.map(async (row, index) => {
      let { email, mobileNumber, name, comment } = row;
      try {
        // Trim and remove unwanted characters
        email = email?.trim().replace(/[,/]/g, "");
        mobileNumber = mobileNumber?.trim().replace(/[,/]/g, "");
        name = name?.trim().replace(/[,/]/g, "");

        // Yup schema for validation
        const schema = yup.object().shape({
          email: yup.string().email("Invalid email"),
          mobileNumber: yup.string(),
          name: yup.string(),
        });

        await schema.validate(
          { email, mobileNumber, name },
          { abortEarly: false }
        );

        // Check for duplicacy in email or mobileNumber
        let existingCall = await Call.findOne({
          $or: [
            { "caller.email": email },
            { "caller.mobileNumber": mobileNumber },
          ],
        });

        if (!_.isEmpty(existingCall)) {
          console.log("existing call", existingCall, email, mobileNumber);
          throw {
            row: index,
            code: 400,
            status: false,
            message: "Duplicate email or mobileNumber.",
            response: [index],
          };
        }
        

        let randomNum="";
        async function getUniqueNumber() {
          randomNum = "CALL" + generateId(6);

          try {
            const result = await Call.findOne({ id: randomNum });
            if (result) {
              return getUniqueNumber();
            }
            return randomNum;
          } catch (err) {
            console.log("id-------", err);
            throw err;
          }
        }
        getUniqueNumber()

        const newCall = new Call({
          id: randomNum,
          slotName,
          caller: { email, mobileNumber, name },
          comment,
        });

        const savedCall = await newCall.save();

        if (!savedCall) {
          console.log("saved call", savedCall);

          throw {
            row: index,
            code: 500,
            status: false,
            message: "Something went wrong with call data.",
          };
        }

        return { success: true, row: index };
      } catch (error) {
        console.log(error);
        return { success: false, email: email, row: index, error: error };
      }
    });

    const callDataUpload = await Promise.all(callDataPromises);

    const errors = callDataUpload.filter((result) => !result.success);
    const success = callDataUpload.filter((result) => result.success);

    return res.status(201).json(
      successResponse(201, true, "Call Data uploaded successfully", {
        errors,
        success,
      })
    );
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json(failedResponse(500, false, "Internal Server Error", error));
  }
};
exports.fetchSlotWiseCallData = async (req, res, next) => {
  try {
    // const callData = await Call.find()

    const callDataBySlot = await Call.aggregate([
      {
        $group: {
          _id: "$slotName",
          totalCalls: { $sum: 1 },
          assignedCalls: {
            $sum: {
              $cond: {
                if: { $ne: [{ $ifNull: ["$currentEmployee", null] }, null] },
                then: 1,
                else: 0,
              },
            },
          },
          unassignedCalls: {
            $sum: {
              $cond: {
                if: { $eq: [{ $ifNull: ["$currentEmployee", null] }, null] },
                then: 1,
                else: 0,
              },
            },
          },
        },
      },
    ]);
    
    

    if (callDataBySlot.length === 0) {
      return res.status(404).json(failedResponse(404, false, "No Data found"));
    }

    res
      .status(200)
      .json(
        successResponse(200, true, "Data Fetched successfully", callDataBySlot)
      );
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json(
        failedResponse(500, false, "Internal Server Error", error?.message)
      );
  }
};
exports.fetchEmployeeWiseData = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const result = await Caller.aggregate([
      {
        $lookup: {
          from: "employees",
          localField: "employee",
          foreignField: "_id",
          as: "employeeDetails",
        },
      },
      {
        $unwind: "$employeeDetails",
      },
     
      {
        $lookup: {
          from: "calls",
          localField: "calls",
          foreignField: "_id",
          as: "calls",
        },
      },
      {
        $unwind: "$calls",
      },
      {
        $group: {
          _id: {
            employee: "$employee",
            employeeDetails: "$employeeDetails",
            status: "$calls.status",
            slotName: "$calls.slotName",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.employee",
          totalAssignedCalls: { $sum: "$count" },
          slotWiseCounts: {
            $push: {
              slotName: "$_id.slotName",
              count: "$count",
            },
          },
          statusWiseCounts: {
            $addToSet: {
              status: "$_id.status",
              count: "$count",
            },
          },
          employeeId: { $first: "$_id.employeeDetails.id" },
          // Assuming "employeeDetails.name" is the correct path, adjust if needed
          employeeName: { $first: "$_id.employeeDetails.name" },
        },
      },
      
      {
        $project: {
          _id: 0,
          employeeId: 1,
          employeeName: 1,
          totalAssignedCalls: 1,
          slotWiseCounts: 1,
          statusWiseCounts:   1,
        },
      },
      // { $skip: skip },
      // { $limit: limit },
    ]);
    
  
    
    
   const newResult=result.map((data)=>{
    const updatedStatusCount= mergeCounts(data.statusWiseCounts,"status");
    const updatedSlotCount= mergeCounts(data.slotWiseCounts,"slotName");
    data.statusWiseCounts=updatedStatusCount;
    data.slotWiseCounts=updatedSlotCount;
    return data;
   })
    console.log(result)
    res
      .status(200)
      .json(successResponse(200, true, "Data Fetched successfully", newResult));
  } catch (error) {
    res
      .status(500)
      .json(
        failedResponse(500, false, "Internal Server Error", error?.message)
      );
  }
};
exports.fetchCalls = async (req, res, next) => {
  try {
    const { searchKey, status, page = 1, limit = 10 } = req.query;
    const { role, callerId } = req.userRole;

    let pipeline = [];
    if (role.employee) {
      pipeline.push({
        $match: {
          currentEmployee: callerId,
        },
      });
    }

    // Match stage for searchKey and status
    const matchStage = {
      $or: [
        { "caller.name": { $regex: new RegExp(searchKey, "i") } },
        { "caller.mobileNumber": { $regex: new RegExp(searchKey, "i") } },
        { "caller.email": { $regex: new RegExp(searchKey, "i") } },
        { comment: { $regex: new RegExp(searchKey, "i") } },
      ],
    };

    if (status) {
      matchStage.status = { $regex: new RegExp(status, "i") };
    }

    pipeline.push({ $match: matchStage });
    pipeline.push({
      $lookup:{
        from:"callers",
        localField:"currentEmployee",
        foreignField:"_id",
        as:"currentEmployee"
      }
    })
    pipeline.push({
      $lookup:{
        from:"employees",
        localField:"currentEmployee.employee",
        foreignField:"_id",
        as:"employee"
      }
    })
    pipeline.push({
      $addFields: {
        employeeMobileNumber: { $arrayElemAt: ["$employee.mobileNumber", 0] },
        employeeName: { $arrayElemAt: ["$employee.name", 0] }
      }
    });
    

    // Add other stages for filtering, if needed

    // Projection stage to include specific fields
    pipeline.push({
      $project: {
        employeeMobileNumber:1,
        employeeName:1,
        callId: "$id",
        callerInfo: "$caller",
        comment: 1,
        status: 1,
        slotName: 1,
      },
    });

    // Count stage to get the total number of documents
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: "totalData" });

    const [totalDataCount] = await Call.aggregate(countPipeline);
    if (!totalDataCount || totalDataCount === 0) {
      return res.status(404).json({
        message: "No Data found",
      });
    }

    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip }, { $limit: parseInt(limit) });

    // Execute the aggregation pipeline
    const limitedData = await Call.aggregate(pipeline);

    const currentPage = parseInt(page) || 1;

    res.status(200).json(
      successResponse(200, true, "Calls fetched successfully", {
        limitedData,
        totalData: totalDataCount ? totalDataCount.totalData : 0,
        currentPage,
      })
    );
  } catch (error) {
    res
      .status(500)
      .json(
        failedResponse(500, false, "Internal Server Error", error?.message)
      );
  }
};

exports.deleteCall = async (req, res) => {
  try {
    const callId = req.params.id;

    // Validate if the provided ID is a valid MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(callId)) {
      return res
        .status(400)
        .json(failedResponse(400, false, "Invalid call ID format"));
    }

    // Find and delete the call by ID
    const deletedCall = await Call.findByIdAndDelete(callId);

    // Check if the call was found and deleted
    if (!deletedCall) {
      return res.status(404).json(failedResponse(404, false, "Call not found"));
    }

    await Caller.findByIdAndUpdate(deletedCall.currentEmployee, {
      $pull: { calls: deletedCall._id },
    });

    res
      .status(200)
      .json(successResponse(200, true, "Call deleted successfully."));
  } catch (error) {
    console.error("Error deleting call:", error);
    res
      .status(500)
      .json(failedResponse(400, false, "Internal Server Error", error));
  }
};
exports.assignCalls = async (req, res) => {
  try {
    let { callerMongoId, numberOfCalls } = req.body;
numberOfCalls= parseInt(numberOfCalls)
    // Validate callerMongoId
    if (!mongoose.Types.ObjectId.isValid(callerMongoId)) {
      return res
        .status(400)
        .json(failedResponse(400, false, "Invalid caller MongoDB ID format"));
    }

    // Validate numberOfCalls
    if (
      (numberOfCalls && !Number.isInteger(numberOfCalls)) ||
      numberOfCalls <= 0
    ) {
      return res
        .status(400)
        .json(
          failedResponse(
            400,
            false,
            "Invalid number of calls. It should be a positive integer."
          )
        );
    }

    // Find the caller by MongoDB ID
    const caller = await Caller.findById(callerMongoId);
    if (!caller) {
      return res
        .status(404)
        .json(failedResponse(404, false, "Caller not found"));
    }

    // Find unassigned calls
    const unassignedCalls = await Call.find({
      currentEmployee: { $exists: false },
    }).limit(numberOfCalls);

    if (numberOfCalls && unassignedCalls.length < numberOfCalls) {
      return res
        .status(400)
        .json(
          failedResponse(400, false, "Not enough unassigned calls available.")
        );
    }

    // Update the calls with the assigned caller and currentEmployee
    const assignedCalls = [];
    const currentDate = new Date();

    for (const call of unassignedCalls) {
      call.assignedEmployees.push({
        employee: caller._id,
        date: currentDate,
      });
      call.currentEmployee = caller._id;
      assignedCalls.push(call._id);
    }

    // Save the changes to the calls
    await Call.updateMany(
      { _id: { $in: assignedCalls } },
      {
        $set: { currentEmployee: caller._id },
        $push: {
          assignedEmployees: { employee: caller._id, date: currentDate },
        },
      }
    );

    // Update the caller's calls
    await Caller.findByIdAndUpdate(caller._id, {
      $push: { calls: { $each: assignedCalls } },
    });

    res
      .status(201)
      .json(successResponse(201, true, "Calls assigned successfully"));
  } catch (error) {
    console.error("Error assigning calls:", error);
    res.status(500).json(failedResponse(500, false, "Internal Server Error"));
  }
};
exports.migrateCalls = async (req, res) => {
  try {
    let { fromCallerId, toCallerId, callType, numberOfCalls } = req.body;
    numberOfCalls=parseInt(numberOfCalls)

    console.log(req.body, "migrate calls received");

    // Validate fromCallerMongoid and toCallerMongoid
    if (
      !mongoose.Types.ObjectId.isValid(fromCallerId) ||
      !mongoose.Types.ObjectId.isValid(toCallerId)
    ) {
      return res
        .status(400)
        .json(failedResponse(400, false, "Invalid caller MongoDB ID format"));
    }

    // Validate numberOfCalls
    if (
      (numberOfCalls && !Number.isInteger(numberOfCalls)) ||
      numberOfCalls <= 0
    ) {
      return res
        .status(400)
        .json(
          failedResponse(
            400,
            false,
            "Invalid number of calls. It should be a positive integer."
          )
        );
    }

    // Find the 'fromCaller' and 'toCaller' by MongoDB ID
    const fromCaller = await Caller.findById(fromCallerId);
    const toCaller = await Caller.findById(toCallerId);

    if (!fromCaller || !toCaller) {
      return res
        .status(404)
        .json(failedResponse(404, false, "Caller not found"));
    }

    // Find calls to transfer
    const callQuery = {
      currentEmployee: fromCaller._id,
    };

    if (callType === "PENDING") {
      callQuery.status = { $exists: false };
    } else {
      callQuery.status = callType;
    }

    const callsToTransfer = await Call.find(callQuery).limit(numberOfCalls);

    if (numberOfCalls && callsToTransfer.length < numberOfCalls) {
      return res
        .status(400)
        .json(
          failedResponse(400, false, "Not enough calls available for transfer.")
        );
    }

    // Update calls with the 'toCaller' information
    const currentDate = new Date();

    for (const call of callsToTransfer) {
      call.assignedEmployees.push({
        employee: toCaller._id,
        date: currentDate,
      });
      call.currentEmployee = toCaller._id;
    }

    // Save the changes to the calls
    await Call.updateMany(
      { _id: { $in: callsToTransfer.map((call) => call._id) } },
      {
        $set: { currentEmployee: toCaller._id },
        $push: {
          assignedEmployees: { employee: toCaller._id, date: currentDate },
        },
      }
    );

    // Update the 'fromCaller' and 'toCaller' with the transferred calls
    await Caller.findByIdAndUpdate(fromCaller._id, {
      $pullAll: { calls: callsToTransfer.map((call) => call._id) },
    });
    await Caller.findByIdAndUpdate(toCaller._id, {
      $push: { calls: { $each: callsToTransfer.map((call) => call._id) } },
    });

    res
      .status(200)
      .json(successResponse(201, true, "Calls transferred successfully"));
  } catch (error) {
    res.status(500).json(failedResponse(500, false, "Internal Server Error"));
  }
};
exports.migratePendingCalls = async (req, res) => {
  try {
    let { toCallerId, callType, numberOfCalls } = req.body;
    numberOfCalls=parseInt(numberOfCalls)

    // Validate fromCallerMongoid and toCallerMongoid
    if (
      !mongoose.Types.ObjectId.isValid(fromCallerId) ||
      !mongoose.Types.ObjectId.isValid(toCallerId)
    ) {
      return res
        .status(400)
        .json(failedResponse(400, false, "Invalid caller MongoDB ID format"));
    }

    // Validate numberOfCalls
    if (
      (numberOfCalls && !Number.isInteger(numberOfCalls)) ||
      numberOfCalls <= 0
    ) {
      return res
        .status(400)
        .json(
          failedResponse(
            400,
            false,
            "Invalid number of calls. It should be a positive integer."
          )
        );
    }

    const toCaller = await Caller.findById(toCallerId);

    if (!toCaller) {
      return res
        .status(404)
        .json(failedResponse(404, false, "Caller not found"));
    }

    // Find calls to transfer
    const callQuery = {};

    if (callType === "PENDING") {
      callQuery.status = { $exists: false };
    } else {
      callQuery.status = callType;
    }

    const callsToTransfer = await Call.find(callQuery).limit(numberOfCalls);

    if (numberOfCalls && callsToTransfer.length < numberOfCalls) {
      return res
        .status(400)
        .json(
          failedResponse(400, false, "Not enough calls available for transfer.")
        );
    }

    // Update calls with the 'toCaller' information
    const currentDate = new Date();

    for (const call of callsToTransfer) {
      call.assignedEmployees.push({
        employee: toCaller._id,
        date: currentDate,
      });
      call.currentEmployee = toCaller._id;
    }

    // Save the changes to the calls
    await Call.updateMany(
      { _id: { $in: callsToTransfer.map((call) => call._id) } },
      {
        $set: { currentEmployee: toCaller._id },
        $push: {
          assignedEmployees: { employee: toCaller._id, date: currentDate },
        },
      }
    );

    await Caller.findByIdAndUpdate(toCaller._id, {
      $push: { calls: { $each: callsToTransfer.map((call) => call._id) } },
    });

    res
      .status(200)
      .json(successResponse(201, true, "Calls transferred successfully"));
  } catch (error) {
    res.status(500).json(failedResponse(500, false, "Internal Server Error"));
  }
};
exports.updateStatusAndComment = async (req, res) => {
  try {
    const { role, callerId } = req.userRole;
    const callId = req.params.callId;

    let call = await Call.findById(callId);

    if (!call) {
      return res.status(404).json({ message: "Call not found" });
    }


    if (role.employee && call.currentEmployee !== callerId ) {
      return res.status(403).json(failedResponse(403,false,"Access denied." ));
      
    }

    // Check if the user has permission to update the call
    await updateCallSchema.validate(req.body, { abortEarly: false });

    // Caller can only update calls assigned to them
    if (req.body.status) {
      // Update status
      if (
        req.body.comment &&
        req.body.comment.toLowerCase().includes("foreigner")
      ) {
        // If comment contains "foreigner", update status to "FOREIGNER"
        call.status = "FOREIGNER";
      } else {
        call.status = req.body.status;
      }
    }

    if (req.body.comment) {
      // Update comment
      call.comment = req.body.comment;
    }

    await call.save();
    res.status(201).json(failedResponse(201,true,"Call successfully updated"));
  } catch (error) {
    if (error instanceof yup.ValidationError) {
    
      return res
        .status(400)
        .json(
          failedResponse(400, false, "Validation failed", validationErrors,error.errors)
        );
    }

    // Handle other errors...
    res
      .status(500)
      .json(failedResponse(500, false, "Internal Server Error", error));
  }
};

function mergeCounts(input, key) {
  const mergedCounts = {};

  input.forEach(({ [key]: keyValue, count }) => {
    if (mergedCounts[keyValue]) {
      mergedCounts[keyValue] += count;
    } else {
      mergedCounts[keyValue] = count;
    }
  });

  const output = Object.entries(mergedCounts).map(([value, count]) => ({
    [key]: value,
    count,
  }));

  return output;
}

