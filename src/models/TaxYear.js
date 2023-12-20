const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    year:{
        type:Number,
        required:true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("tax_years", documentSchema); // Changed the model name to "Admin" for consistency
