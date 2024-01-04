const mongoose = require("mongoose");


const clientSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique:true
    },

    name: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      unique:true
    },
    whatsappNumber: {
      type: String,
  
    },

    email: {
      type: String,
      required: true,
      unique:true
    },
    photo: String,
    state: String,
    zipCode: Number,
    callId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "calls",
      
    },

    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "callers",
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "reviewers",
    },
    preparer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "preparers",
    },
    finalDrafter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "final_drafters",
    },
    clientYearlyTaxations:[ {
      type: mongoose.Schema.Types.ObjectId,
      ref: "client_yearly_taxations",
    }],
    referredBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user_roles",
    },
    userRole: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user_roles",
    },
    premimum:{
      type:Boolean,
      default:false,
      required:true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("clients", clientSchema);
