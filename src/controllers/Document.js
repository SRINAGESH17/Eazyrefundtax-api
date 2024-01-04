const Caller = require("../models/Caller");
const TaxReturnDocumentTypes = require("../models/TaxReturnDocumentTypes");
const TaxDocumentTypes = require("../models/TaxDocumentTypes");
const { failedResponse } = require("../utils/message");
const ClientYearlyTaxation = require("../models/ClientYearlyTaxation");
const TaxReturnDocument = require("../models/TaxReturnDocument");
const ClientDocument = require("../models/ClientDocument");

exports.uploadedDocument= async (req, res) => {
    try {
      const clientYearlyTaxId = req.params.clientYearlyTaxId;
      const fileType = req.body.fileType;
  
      // Check if the caller has the necessary permissions
      const callerId = req.userRole.callerId;
      const clientTax = await ClientYearlyTaxation.findById(clientYearlyTaxId);
      if (clientTax) {
        return res.status(400).json(failedResponse(400,false,"ClientTax is not found." ));
        
      }
    
  
      // Check if the fileType is found in taxReturnDocumentType or taxDocumentType
      const taxReturnDocumentType = await TaxReturnDocumentTypes.findOne({ name: fileType });
      const taxDocumentType = await TaxDocumentTypes.findOne({ name: fileType });
  
      if (!taxReturnDocumentType && !taxDocumentType) {
        return res.status(400).json(failedResponse(400,false,"Invalid fileType. Document type not found." ));
      }
  
      // Upload the document to the respective collection
      const documentData = {
        client: clientTax.client, // Assuming caller has clients array, modify accordingly
        fileType: fileType,
        fileName: req.file.originalname,
        taxYear:clientTax.taxYear, // Assuming current year, modify accordingly
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
  
      let documentModel;
      let clientYearlyTaxationField;
  
      if (taxReturnDocumentType) {
        documentModel = TaxReturnDocument;
        clientYearlyTaxationField = "tax_return_documents";
      } else if (taxDocumentType) {
        documentModel = ClientDocument;
        clientYearlyTaxationField = "client_documents";
      }
  
      const uploadedDocument = await documentModel.create(documentData);
  
      // Update the respective field in clientYearlyTaxation
      await ClientYearlyTaxation.findByIdAndUpdate(clientYearlyTaxId, {
        $push: { [clientYearlyTaxationField]: uploadedDocument._id },
      });
  
      res.json({ success: true, message: "Document uploaded successfully.", document: uploadedDocument });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };