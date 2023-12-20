const mongoose = require("mongoose");

const preparerSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employees",
    },
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
  
   
  },
  { timestamps: true }
);

module.exports = mongoose.model("preparers", preparerSchema);
