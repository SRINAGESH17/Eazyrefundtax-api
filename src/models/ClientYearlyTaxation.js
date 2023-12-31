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
    status:{
      type:String,
      enum:["PENDING","PREPARED","REVIEWED","FILED"],
      default:"PENDING",
      required:true
    },
    paymentStatus:{
      type:String,
      enum:["PENDING","PAID"],
      default:"PENDING",
      required:true
    },
    clientDocuments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "client_documents",
      },
    ],
    taxReturnDocuments:[
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
    taxSummaries:[
      {
        type:Object
      }
    ]

  },
  { timestamps: true }
);

module.exports = mongoose.model("client_yearly_taxations", documentSchema); // Changed the model name to "Admin" for consistency
