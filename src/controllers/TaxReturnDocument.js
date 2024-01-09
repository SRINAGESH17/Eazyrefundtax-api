const TaxReturnDocumentTypes = require("../models/TaxReturnDocumentTypes");
const { successResponse, failedResponse } = require("../utils/message");
exports.addTaxReturnDocument = async (req, res) => {
  try {
    const { name } = req.body;

    // Check if the tax year already exists
    const existingTaxDoc = await TaxReturnDocumentTypes.findOne({ name });

    if (existingTaxDoc) {
      return res
        .status(400)
        .json(failedResponse(400, false, "Tax Document name already exists."));
    }

    // Create a new tax year
    const newTaxDoc = new TaxReturnDocumentTypes({ name });
    const savedTaxDoc = await newTaxDoc.save();

    return res
      .status(201)
      .json(successResponse(201, true, "Tax doc added successfully"));
  } catch (error) {
    console.error(error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json(failedResponse(400, false, error.message));
    }

    return res
      .status(500)
      .json(failedResponse(500, false, "Internal Server Error", error));
  }
};
exports.getTaxReturnDocuments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate skip based on pagination parameters
    const skip = (page - 1) * limit;

    // Fetch tax years with pagination
    const taxReturnDocs = await TaxReturnDocumentTypes.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // You can adjust sorting based on your requirements

    // Count total number of tax years (for total pages calculation)
    const totalTaxReturnDocs = await TaxReturnDocumentTypes.countDocuments();

    return res.status(200).json(
      successResponse(200, true, {
        data: taxReturnDocs,
        totalRecords: totalTaxReturnDocs,
      })
    );
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(failedResponse(500, false, "Internal Server Error", error));
  }
};
exports.getActiveTaxReturnDocuments = async (req, res) => {
  try {
    
    const taxDocs = await TaxReturnDocumentTypes.find().select("name")

    return res.status(200).json(successResponse(200,true,taxDocs)
    );
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(failedResponse(500, false, 'Internal Server Error', error));
  }
};