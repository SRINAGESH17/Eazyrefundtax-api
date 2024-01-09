const { failedResponse, successResponse } = require("../utils/message");
const Preparer = require("../models/Preparer");
const { default: mongoose } = require("mongoose");
const ClientYearlyTaxation = require("../models/ClientYearlyTaxation");

exports.fetchClientTaxations = async (req, res) => {
  try {
    const { role, callerId } = req.userRole;
    // Extract query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchKey = req.query.searchKey || "";
    const pipeline = [];
    if (role.caller) {
      pipeline.push({
        $match: {
          caller: callerId,
        },
      });
    }
    // Define aggregation pipeline stages
    pipeline.push(...[
      {
        $lookup: {
          from: "clients",
          localField: "client",
          foreignField: "_id",
          as: "clientDetails",
        },
      },
      {
        $unwind: "$clientDetails",
      },

      {
        $match: {
          $or: [
            { "clientDetails.id": { $regex: searchKey, $options: "i" } },
            { "clientDetails.name": { $regex: searchKey, $options: "i" } },
            {
              "clientDetails.mobileNumber": {
                $regex: searchKey,
                $options: "i",
              },
            },
            { "clientDetails.email": { $regex: searchKey, $options: "i" } },
          ],
        },
      },
      {
        $facet: {
          totalData: [{ $count: "count" }],
          limitedData: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              $project: {
                clientId: "$clientDetails.id",
                clientName: "$clientDetails.name",
                clientMobileNumber: "$clientDetails.mobileNumber",
                clientEmail: "$clientDetails.email",
                clientCreatedAt: "$clientDetails.createdAt",
                state: "$clientDetails.state",
                zipCode: "$clientDetails.zipCode",

                preparer: 1,
                taxYear: 1,
              },
            },
          ],
        },
      },
    ]);

    // Execute the aggregation pipeline
    const result = await ClientYearlyTaxation.aggregate(pipeline);

    const totalData = result[0].totalData[0] ? result[0].totalData[0].count : 0;
    const limitedData = result[0].limitedData;

    res
      .status(200)
      .json(
        successResponse(200, true, "Data successfully fetched", {
          totalData,
          limitedData,
        })
      );
  } catch (error) {
    console.error(error);
    res.status(500).json(failedResponse(500, false, "Internal Server Error"));
  }
};

exports.assignPreparer = async (req, res) => {
  try {
    const { role, callerId } = req.userRole;
    const { preparerId } = req.body;
    const { clientYearlyTaxationId } = req.params;

    // Check if preparer exists
    const preparer = await Preparer.findById(preparerId);
    if (!preparer) {
      return res
        .status(404)
        .json(failedResponse(404, false, "Preparer not found."));
    }

    // Check if client yearly taxation record exists
    const clientYearlyTaxation = await ClientYearlyTaxation.findById(
      clientYearlyTaxationId
    );
    if (!clientYearlyTaxation) {
      return res
        .status(404)
        .json(
          failedResponse(404, false, "Client yearly taxation record not found.")
        );
    }

    // Check if caller of client yearly taxation matches with callerId
    if (clientYearlyTaxation.caller !== callerId) {
      return res
        .status(403)
        .json(
          failedResponse(
            403,
            false,
            "Caller does not have permission to assign preparers."
          )
        );
    }

    // Update the client yearly taxation record with the assigned preparer
    const updatedRecord = await ClientYearlyTaxation.findByIdAndUpdate(
      clientYearlyTaxationId,
      { preparer: preparerId },
      { new: true }
    );

    if (!updatedRecord) {
      return res
        .status(500)
        .json(failedResponse(500, false, "Something went wrong."));
    }
    preparer.clientYearlyTaxations.push(clientYearlyTaxationId);
    await preparer.save();

    res
      .status(201)
      .json(successResponse(201, true, "Preparer assigned successfully."));
  } catch (error) {
    console.error(error);
    res.status(500).json(failedResponse(500, false, "Internal Server Error."));
  }
};

exports.fetchClientTaxationById = async (req, res) => {
  try {
    const clientYearlyTaxationId = req.params.id;
    const callerId = req.userRole?.callerId; // Assuming callerId is present in the userRole

    // Check if the caller has the necessary permissions to access client yearly taxation
    if (!mongoose.Types.ObjectId.isValid(clientYearlyTaxationDetails)) {
      return res
        .status(400)
        .json(
          failedResponse(
            400,
            false,
            "Caller does not have permission to access client yearly taxation."
          )
        );
    }
    const taxData = await ClientYearlyTaxation.findById(callerId);
    if (!taxData) {
      return res
        .status(404)
        .json(failedResponse(404, false, "This id doesn't exist."));
    }
    if (role.caller && taxData.caller !== callerId) {
      return res
        .status(403)
        .json(
          failedResponse(
            403,
            false,
            "Caller does not have permission to access client yearly taxation."
          )
        );
    }

    // Use aggregation to fetch the required details
    const clientYearlyTaxationDetails = await ClientYearlyTaxation.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(clientYearlyTaxationId) },
      },
      {
        $lookup: {
          from: "clients",
          localField: "client",
          foreignField: "_id",
          as: "clientDetails",
        },
      },
      {
        $unwind: "$clientDetails",
      },
      {
        $lookup: {
          from: "callers",
          localField: "clientDetails.caller",
          foreignField: "_id",
          as: "caller",
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "caller.employee",
          foreignField: "_id",
          as: "employee",
        },
      },
      {
        $lookup: {
          from: "client_documents",
          localField: "clientDocuments",
          foreignField: "_id",
          as: "clientDocs",
        },
      },
      {
        $lookup: {
          from: "tax_return_documents",
          localField: "taxReturnDocument",
          foreignField: "_id",
          as: "taxDocs",
        },
      },
      {
        $project: {
          "clientDetails.id": 1,
          "employee.name": 1,
          "clientDetails.status": 1,
          "clientDetails.photo": 1,
          "clientDetails.name": 1,
          "clientDetails.mobileNumber": 1,
          "clientDetails.email": 1,
          "clientDetails.createdAt": 1,
          documents: {
            $map: {
              input: {
                $concatArrays: ["$clientDocs", "$taxDocs"]
              },
              as: "doc",
              in: {
                id: "$$doc._id",
                fileType: "$$doc.fileType",
                fileName: "$$doc.fileName",
                url: "$$doc.url",
                createdAt: "$$doc.createdAt",
              },
            },
          },
          taxSummaries: 1,
          status: 1,
          paymentStatus: 1,
          "preparerDetails.name": 1,
          "clientDetails.premium": 1,
        },
      },
    ]);
    

    if (clientYearlyTaxationDetails.length === 0) {
      return res
        .status(404)
        .json(
          failedResponse(404, false, "Client yearly taxation record not found.")
        );
    }

    res
      .status(200)
      .json(
        successResponse(
          200,
          true,
          "Successfully data fetched",
          clientYearlyTaxationDetails[0]
        )
      );
  } catch (error) {
    console.error(error);
    res.status(500).json(failedResponse(500, false, "Internal Server Error"));
  }
};
