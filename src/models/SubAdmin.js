const mongoose = require("mongoose");

const subAdminSchema = new mongoose.Schema(
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
    mobileNumber:{
      type:String,
      required:true
    },
    state:{
      type:String
    },
    zipCode:Number,
    photo:String,
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
    userRole: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user_roles",
    },
    permissions:{
      employeeData:{
        type:Boolean,
        default:false
      },
      callData:{
        type:Boolean,
        default:false
      },
      document:{
        type:Boolean,
        default:false
      },
      taxType:{
        type:Boolean,
        default:false
      },
      invoice:{
        type:Boolean,
        default:false
      },
      clients:{
        type:Boolean,
        default:false
      },
      sms:{
        type:Boolean,
        default:false
      },
    },
    employees:[
      {
        type:mongoose.Schema.Types.ObjectId,
        ref:"employees"
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("sub_admins", subAdminSchema)


