const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    name:{
        type:String,
        required:true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("tax_document_types", documentSchema); // Changed the model name to "Admin" for consistency
