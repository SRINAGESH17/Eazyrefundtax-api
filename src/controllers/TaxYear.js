const TaxYear = require('../models/TaxYear');
const { successResponse, failedResponse } = require('../utils/message');
exports.addTaxYear = async (req, res) => {
    try {
      const { year } = req.body;
      console.log(year)
  
      // Check if the tax year already exists
      const existingTaxYear = await TaxYear.findOne({ year });
  
      if (existingTaxYear) {
        return res
          .status(400)
          .json(failedResponse(400, false, 'Tax year already exists.'));
      }
  
      // Create a new tax year
      const newTaxYear = new TaxYear({ year });
      const savedTaxYear = await newTaxYear.save();
  
      return res
        .status(201).json(successResponse(201, true, 'Tax year added successfully'));
    } catch (error) {
      console.error(error);
  
      // Handle validation errors
      if (error.name === 'ValidationError') {
        return res.status(400).json(failedResponse(400, false, error.message));
      }
  
      return res
        .status(500)
        .json(failedResponse(500, false, 'Internal Server Error', error));
    }
  };

 
  exports.getTaxYears = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
  
      // Calculate skip based on pagination parameters
      const skip = (page - 1) * limit;
  
      // Fetch tax years with pagination
      const taxYears = await TaxYear.find()
        .skip(skip)
        .limit(limit)
        .sort({ year: 'desc' }); // You can adjust sorting based on your requirements
  
      // Count total number of tax years (for total pages calculation)
      const totalTaxYears = await TaxYear.countDocuments();
  
      return res.status(200).json(successResponse(200,true,{
        data:taxYears,
        totalRecords:totalTaxYears ,})
      );
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json(failedResponse(500, false, 'Internal Server Error', error));
    }
  };
  
  exports.getActiveYears = async (req, res) => {
    try {
      
      const taxDocs = await TaxYear.find().select("year")
  
      return res.status(200).json(successResponse(200,true,taxDocs)
      );
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json(failedResponse(500, false, 'Internal Server Error', error));
    }
  };

  