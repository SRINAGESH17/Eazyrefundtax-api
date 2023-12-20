const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    email: {
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
    state:{
      type:String
    },
    zipCode:Number,
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
    userRole: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user_roles", // Assuming "user_roles" is the correct reference model
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema); // Changed the model name to "Admin" for consistency
