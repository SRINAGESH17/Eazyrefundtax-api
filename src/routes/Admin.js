const express = require("express");
const { createEmployee } = require("../controllers/Employee");
const upload = require("../middlewares/upload");
const { verifyAdmin } = require("../middlewares/Auth");
const { createSubAdmin } = require("../controllers/SubAdmin");
const { createCallData, ExcelSheetCallDataUpload, fetchSlotWiseCallData, fetchEmployeeWiseData, assignCalls, migrateCalls, migratePendingCalls } = require("../controllers/Call");
const multer = require("multer");
const upload1 = multer({ dest: 'uploads/' });
const route = express.Router();




route.post('/employee/create',verifyAdmin, upload.fields([{name:"photo",maxCount:1},{name:"_IDURL",maxCount:1}]), createEmployee);
route.post('/subadmin/create',verifyAdmin, upload.fields([{name:"photo",maxCount:1}]), createSubAdmin);

/**----------------------------------------------Call------------------------------- */
route.post('/call/create',verifyAdmin, createCallData);
route.post('/call/bulk-upload',verifyAdmin,upload1.single("excelsheet"), ExcelSheetCallDataUpload);
route.get('/call/slot-wise',verifyAdmin,fetchSlotWiseCallData);
route.get('/call/employee-wise',verifyAdmin,fetchEmployeeWiseData);
route.post('/call/assign',verifyAdmin, assignCalls);
route.post('/call/migrate',verifyAdmin, migrateCalls);
route.post('/call/migrate-pending',verifyAdmin, migratePendingCalls);


module.exports = route;
