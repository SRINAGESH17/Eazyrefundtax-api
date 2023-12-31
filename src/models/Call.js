const mongoose = require("mongoose");
const shortid = require('shortid');

const statuses = [
  "REGISTERED",
  "CALLBACK",
  "WRONGNUMBER",
  "NOTINTERESTED",
  "DUPLICATE",
  "ALREADYFILED",
  "FIRST",
  "FOREIGNER",
  "INTERESTED",
  "MAILSENT",
  "PENDING"
];

const callSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique:true,
   
    },
    slotName: {
      type: String,
      required: true,
    },
    caller: {
      name: String,
      mobileNumber: {type:String},
      email: {type:String},
    },
    comment: String,
    status: {
      type: String,
      enum: statuses,
      default:"PENDING"
    },
    assignedEmployees: [
      {
        employee: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "callers",
        },
        date: Date,
      },
    ],
    currentEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "callers",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("calls", callSchema);
