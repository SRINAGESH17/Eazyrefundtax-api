const mongoose = require("mongoose");

const callSchema = new mongoose.Schema(
  {
    clientYearlyTaxId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "client_yearly_taxations",
    },
    subject: {
      type: String,
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "senderModel",
    },
    senderModel: {
      type: String,
    },
    content: {
      type: String,
    },
    attachments: [
        {
            url:String,
            name:String
        }
    ],
    status: {
      type: String,
    
      default: "PENDING",
    },
   
  },
  { timestamps: true }
);

module.exports = mongoose.model("calls", callSchema);
