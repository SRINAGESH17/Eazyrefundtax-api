const express = require("express");
const {  verifyEmployee } = require("../middlewares/Auth");

const upload = require("../middlewares/upload");

const multer = require("multer");
const { fetchEmployeeById, updateEmployee } = require("../controllers/Employee");
const route = express.Router();
const upload1 = multer({ dest: "uploads/" });


route.get("/employee/fetch/:id", verifyEmployee, fetchEmployeeById);
route.put(
  "/employee/edit/:id",
  verifyEmployee,
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "_IDURL", maxCount: 1 },
  ]),
  updateEmployee
);




module.exports = route;
