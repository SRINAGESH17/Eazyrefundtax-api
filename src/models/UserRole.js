const mongoose = require("mongoose");

const RoleSchema = new mongoose.Schema(
  {
    userMongoId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "userModel",
      unique:true
    },
    userModel: {
      type: String,
      enum: ["admins","sub_admins","employees","clients"],
    },
    firebaseId: {
      type: String,
      required:true,
      unique:true
    },
    role: {
      admin: {
        type: Boolean,
        default: false,
      },
      subAdmin: {
        type: Boolean,
        default: false,
      },
      client: {
        type: Boolean,
        default: false,
      },
      employee: {
        type: Boolean,
        default: false,
      },
    },
    referredTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "clients",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("user_roles", RoleSchema);
