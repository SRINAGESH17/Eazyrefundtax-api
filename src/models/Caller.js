const mongoose = require("mongoose");

const callerSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employees",
    },
    calls: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "calls",
      },
    ],

    clients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "clients",
      },
    ],
    clientYearlyTaxations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "client_yearly_taxations",
      },
    ],

    clientsDocuments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "client_documents",
      },
    ],
    taxReturnDocuments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tax_return_documents",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("callers", callerSchema);
