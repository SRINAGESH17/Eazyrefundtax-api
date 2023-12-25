const mongoose = require("mongoose");

const callerSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employees",
      required:true,
      unique:true
    },
    calls: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "calls",
        unique:true
      },
    ],

    clients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "clients",
        unique:true
      },
    ],
    clientYearlyTaxations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "client_yearly_taxations",
        unique:true
      },
    ],

    clientsDocuments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "client_documents",
        unique:true
      },
    ],
    taxReturnDocuments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tax_return_documents",
        unique:true
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("callers", callerSchema);
