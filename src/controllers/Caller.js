const express = require("express");
const router = express.Router();
 const Caller = require("../models/Caller");
 const Employee = require("../models/Employee");
 const { successResponse, failedResponse } = require("../utils/message");

 exports.fetchActiveCallers = async (req, res, next) => {
   try {
     console.log(req.body, "active calls data received");
     const pipeline = [
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
         $match: {
           "employeeDetails.status": "active",
         },
       },
       {
         $project: {
           employeeId: "$employeeDetails.id",
           employeeName: "$employeeDetails.name",
         },
       },
     ];

     const activeCallers = await Caller.aggregate(pipeline);

     res
       .status(200)
       .json(
         successResponse(
           200,
           true,
           "Active callers fetched successfully.",
           activeCallers
         )
       );
   } catch (error) {
     console.error("Error fetching active callers:", error);
     res
       .status(500)
       .json(failedResponse(400, false, "Internal Server Error", error));
   }
 };
