const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    client:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "clients",
    },
    fileType: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    taxYear: {
        type:Number,
      required: true,
        
    },
   
   
   
    url:{
        type: String,
        required: true,
    },
    uploadedBy:{
        refId:{
        type:mongoose.Schema.Types.ObjectId,
        refPath:"refModel"
        },
        refModel:String
    },
    caller:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"callers"
    },
    reviewer:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"reviewers"
    },
    preparer:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"preparers"
    },
    finalDrafter:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"final_drafters"
    },
    clientYearlyTaxation:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"client_yearly_taxation"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("tax_return_documents", documentSchema); // Changed the model name to "Admin" for consistency
