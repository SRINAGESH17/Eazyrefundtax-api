const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    taxYear: {
      type: Number,
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "clients",
    },
    clientDocuments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "client_documents",
      },
    ],
    taxReturnDocument:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "tax_return_documents",
          },
    ],
    caller:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "callers",
    },
    preparer:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "preparers",
    },
    reviewer:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "reviewers",
    },
    finalDrafter:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "final_drafers",
    },

  },
  { timestamps: true }
);

module.exports = mongoose.model("client_yearly_taxations", documentSchema); // Changed the model name to "Admin" for consistency
