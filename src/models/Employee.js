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
      enum: ["active", "suspended"],
      default: "active",
    },
    userRole: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user_roles",
    },
    assignedAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "sub_admins",
    },
    designationRef:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "designationModel",
    },
    designationModel:{
      type:String
    }
   
  },
  { timestamps: true }
);

module.exports = mongoose.model("employees", empSchema);
