const mongoose = require("mongoose");

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
];

const callSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique:true
    },
    slotName: {
      type: String,
      required: true,
    },
    caller: {
      name: String,
      mobileNumber: {type:String,unique:true},
      email: {type:String,unique:true},
    },
    comment: String,
    status: {
      type: String,
      enum: statuses,
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
