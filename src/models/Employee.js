const { truncate } = require("lodash");
const mongoose = require("mongoose");
const designations = ["Caller", "Preparer", "Reviewer", "Final Drafter"];

const empSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },
    photo: String,
    state: String,
    zipCode: Number,
    designation: {
      type: String,
      enum: designations,
      required: true,
    },
    identity: {
      _IDType: {
        type: String,
      },
      _IDNumber: String,
      url: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      required: true,
    },
    userRole: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user_roles",
    },
    assignedAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "sub_admins",
    },
    designationRef: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "designationModel",
    },
    designationModel: {
      type: String,
      enum: ["callers", "preparers", "reviewers", "final_drafters"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("employees", empSchema);
