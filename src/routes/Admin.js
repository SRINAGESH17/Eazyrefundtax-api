const express = require("express");
const { createEmployee, fetchEmployees, fetchEmployeeById, updateEmployee, deleteEmployee } = require("../controllers/Employee");
const upload = require("../middlewares/upload");
const { verifyAdmin } = require("../middlewares/Auth");
const { createSubAdmin, getSubAdmins, getSubAdminById, updateSubAdmin, deleteSubAdmin } = require("../controllers/SubAdmin");
const { createCallData, ExcelSheetCallDataUpload, fetchSlotWiseCallData, fetchEmployeeWiseData, assignCalls, migrateCalls, migratePendingCalls, updateStatusAndComment } = require("../controllers/Call");
const multer = require("multer");
const { fetchActiveCallers } = require("../controllers/Caller");
const upload1 = multer({ dest: "uploads/" });
const route = express.Router();

/**------------------------------------employee--------------------------------------- */

route.post(
  "/employee/create",
  verifyAdmin,
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "_IDURL", maxCount: 1 },
  ]),
  createEmployee
);
route.get("/employee/fetch", verifyAdmin, fetchEmployees);
route.get("/employee/fetch/:id", verifyAdmin, fetchEmployeeById);
route.put(
  "/employee/edit/:id",
  verifyAdmin,
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "_IDURL", maxCount: 1 },
  ]),
  updateEmployee
);
route.delete("/employee/:id", verifyAdmin, deleteEmployee);

/**--------------------------------Sub Admin---------------------------------- */
route.post('/subadmin/create',verifyAdmin, upload.fields([{name:"photo",maxCount:1}]), createSubAdmin);
route.get('/subadmin/fetch',verifyAdmin, getSubAdmins);
route.get('/subadmin/fetch/:id',verifyAdmin, getSubAdminById);
route.put('/subadmin/edit/:id',verifyAdmin,upload.fields([{name:"photo",maxCount:1}]), updateSubAdmin);
route.delete('/subadmin/delete/:id',verifyAdmin, deleteSubAdmin);

/**----------------------------------------------Call------------------------------- */
route.post('/call/create',verifyAdmin, createCallData);
route.post('/call/bulk-upload',verifyAdmin,upload1.single("excelsheet"), ExcelSheetCallDataUpload);
route.get('/call/slot-wise',verifyAdmin,fetchSlotWiseCallData);
route.get('/call/employee-wise',verifyAdmin,fetchEmployeeWiseData);
route.post('/call/assign',verifyAdmin, assignCalls);
route.post('/call/migrate',verifyAdmin, migrateCalls);
route.post('/call/migrate-pending',verifyAdmin, migratePendingCalls);
route.put('/call/:callId/update',verifyAdmin, updateStatusAndComment);



/**-------------------------------------------Caller --------------------------------- */

route.get("/caller/active", verifyAdmin, fetchActiveCallers);




module.exports = route;
