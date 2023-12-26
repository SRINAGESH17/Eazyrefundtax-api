const mongoose = require("mongoose");

const finalDrafterSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employees",
      required:true
    },
    clientYearlyTaxations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "client_yearly_taxations",
        unique:true
      },
    ],
  
   
  },
  { timestamps: true }
);

module.exports = mongoose.model("final_drafters", finalDrafterSchema);
