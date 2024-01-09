const Preparer = require("../models/Preparer");
const { successResponse } = require("../utils/message");

exports.getActivePreparers = async (req, res) => {
    try {
        
      const aggregationPipeline = [
        {
          $lookup: {
            from: 'employees',
            localField: 'employee',
            foreignField: '_id',
            as: 'employeeDetails',
          },
        },
        {
          $unwind: '$employeeDetails',
        },
        {
          $project: {
            employeeId: '$employeeDetails.id',
            employeeName: '$employeeDetails.name',
            
          },
        },
      ];
  
      const preparers = await Preparer.aggregate(aggregationPipeline);
    
  
      return res.status(200).json(successResponse(200,true,"Successfully data fetched",preparers));
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json(failedResponse(500, false, 'Internal Server Error', error));
    }
  };