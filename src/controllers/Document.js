const Caller = require("../models/Caller");
const TaxReturnDocumentTypes = require("../models/TaxReturnDocumentTypes");
const TaxDocumentTypes = require("../models/TaxDocumentTypes");
const { failedResponse, successResponse } = require("../utils/message");
const ClientYearlyTaxation = require("../models/ClientYearlyTaxation");
const TaxReturnDocument = require("../models/TaxReturnDocument");
const ClientDocument = require("../models/ClientDocument");
const generateId = require("../utils/genRandomId");

exports.uploadedDocument = async (req, res) => {
  try {
    const clientYearlyTaxId = req.params.clientYearlyTaxId;
    const fileType = req.body.fileType;

    console.log(req.body);
    console.log(clientYearlyTaxId);

    // Check if the caller has the necessary permissions
    const callerId = req.userRole.callerId;
    const clientTax = await ClientYearlyTaxation.findById(clientYearlyTaxId);
    if (!clientTax) {
      return res
        .status(400)
        .json(failedResponse(400, false, "ClientTax is not found."));
    }

    // Check if the fileType is found in taxReturnDocumentType or taxDocumentType
    const taxReturnDocumentType = await TaxReturnDocumentTypes.findOne({
      name: fileType,
    });
    const taxDocumentType = await TaxDocumentTypes.findOne({ name: fileType });

    if (!taxReturnDocumentType && !taxDocumentType) {
      return res
        .status(400)
        .json(
          failedResponse(
            400,
            false,
            "Invalid fileType. Document type not found."
          )
        );
    }
    let randomNum = "";
    let documentModel;
    let clientYearlyTaxationField;

    if (taxReturnDocumentType) {
      documentModel = TaxReturnDocument;
      clientYearlyTaxationField = "taxReturnDocuments";
    } else if (taxDocumentType) {
      documentModel = ClientDocument;
      clientYearlyTaxationField = "clientDocuments";
    }

    async function getUniqueNumber() {
      randomNum = "FT" + generateId(6);

      try {
        const result = await documentModel.findOne({ id: randomNum });
        if (result) {
          return getUniqueNumber();
        }
        return randomNum;
      } catch (err) {
        console.log("id-------", err);
        throw err;
      }
    }
    getUniqueNumber();

    // Upload the document to the respective collection
    const documentData = {
      id: randomNum,
      client: clientTax.client, // Assuming caller has clients array, modify accordingly
      fileType: fileType,
      fileName: req.file.originalname,
      taxYear: clientTax.taxYear, // Assuming current year, modify accordingly
      url: req.file.location, // You may save the file to a server and get the URL, or store the file directly in the database as needed
      uploadedBy: {
        refId: callerId,
        refModel: "callers",
      },
      caller: callerId,
      preparer: null,
      reviewer: null,
      finalDrafter: null,
      clientYearlyTaxation: clientYearlyTaxId,
    };

    const uploadedDocument = await documentModel.create(documentData);


    // Update the respective field in clientYearlyTaxation
   const updatedClient= await ClientYearlyTaxation.findByIdAndUpdate(clientYearlyTaxId, {
      $push: { [clientYearlyTaxationField]: uploadedDocument._id },
    });
    console.log(updatedClient,"dlld8888888888888888888888888888888888888888888888888888888888")

    res
      .status(201)
      .json(successResponse(201, true, "Document uploaded successfully."));
  } catch (error) {
    console.error(error);
    res.status(500).json(failedResponse(500, false, "Internal Server Error"));
  }
};
exports.getCombinedDocuments = async (req, res) => {
  try {
    const { page = 1, limit = 10, searchKey } = req.query;
    const { role, callerId } = req.userRole;

    // Build aggregation pipeline for tax_return_documents
    const taxReturnAggregation = [
      {
        $match: {
          caller: callerId,
        },
      },

      {
        $lookup: {
          from: "clients",
          localField: "client",
          foreignField: "_id",
          as: "clientInfo",
        },
      },
      {
        $unwind: "$clientInfo",
      },
      {
        $project: {
          clientId: "$clientInfo.id",
          clientName: "$clientInfo.name",
          clientEmail: "$clientInfo.email",
          fileType: 1,
          fileName: 1,
          taxYear: 1,
          _id: 0,
        },
      },
    ];
    console.log(searchKey, "search key 9");
    if (searchKey) {
      
      taxReturnAggregation.push({
        $match: {
          $or: [
            { fileType: { $regex: searchKey, $options: "i" } },
            { fileName: { $regex: searchKey, $options: "i" } },
            { clientId: { $regex: searchKey, $options: "i" } },
            { clientEmail: { $regex: searchKey, $options: "i" } },
            { clientName: { $regex: searchKey, $options: "i" } },
          ],
        },
      });
    }

    // Execute aggregation pipelines for both collections
    const [taxReturnDocuments, clientDocuments] = await Promise.all([
      TaxReturnDocument.aggregate(taxReturnAggregation),
      ClientDocument.aggregate(taxReturnAggregation),
    ]);

    // Combine and sort the results
    const combinedDocuments = [...taxReturnDocuments, ...clientDocuments].sort(
      (a, b) => b.taxYear - a.taxYear
    );

    // Paginate the combined results
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedDocuments = combinedDocuments.slice(startIndex, endIndex);

    return res.status(200).json(
      successResponse(200, true, "Successfully fetched data", {
        data: paginatedDocuments,
        totalRecords: combinedDocuments.length,
      })
    );
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(failedResponse(500, false, "Internal Server Error", error));
  }
};
