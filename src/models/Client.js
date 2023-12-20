const mongoose = require("mongoose");
const designations = ["Caller", "Preparer", "Reviewer", "Final Drafter"];

const empSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
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
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("employees", empSchema);
