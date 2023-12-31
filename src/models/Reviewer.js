const mongoose = require("mongoose");

const reviewerSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employees",
      required:true,
      unique:true
    },
    clients:[
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
  
   
  },
  { timestamps: true }
);

module.exports = mongoose.model("reviewers", reviewerSchema);
