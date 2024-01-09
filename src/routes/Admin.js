const express = require("express");
const { createEmployee, fetchEmployees, fetchEmployeeById, updateEmployee, deleteEmployee, assignEmployeeToSubAdmin } = require("../controllers/Employee");
const upload = require("../middlewares/upload");
const { verifyAdmin } = require("../middlewares/Auth");
const { createSubAdmin, getSubAdmins, getSubAdminById, updateSubAdmin, deleteSubAdmin, activeSubAdmins } = require("../controllers/SubAdmin");
const { createCallData, ExcelSheetCallDataUpload, fetchSlotWiseCallData, fetchEmployeeWiseData, assignCalls, migrateCalls, migratePendingCalls, updateStatusAndComment, fetchCalls } = require("../controllers/Call");
const multer = require("multer");
const { fetchActiveCallers } = require("../controllers/Caller");
const { addTaxYear, getTaxYears, getActiveYears } = require("../controllers/TaxYear");
const { addTaxDocument, getTaxDocuments } = require("../controllers/TaxDocument");
const { addTaxReturnDocument, getTaxReturnDocuments, getActiveTaxReturnDocuments } = require("../controllers/TaxReturnDocument");
const { fetchClientDocuments } = require("../controllers/ClientYearlyTaxation");
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
route.post("/employee/assign-subadmin", verifyAdmin, assignEmployeeToSubAdmin);

/**--------------------------------Sub Admin---------------------------------- */
route.post('/subadmin/create',verifyAdmin, upload.fields([{name:"photo",maxCount:1}]), createSubAdmin);
route.get('/subadmin/fetch',verifyAdmin, getSubAdmins);
route.get('/subadmin/active',verifyAdmin, activeSubAdmins);
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
route.get("/call/fetch",verifyAdmin,fetchCalls);



/**-------------------------------------------Caller --------------------------------- */

route.get("/caller/active", verifyAdmin, fetchActiveCallers);


/**------------------------------------------Tax module-------------------------------------- */
route.post("/tax-year/add",verifyAdmin,addTaxYear);
route.get("/tax-year/fetch",verifyAdmin,getTaxYears);
route.post("/tax-doc-type/add",verifyAdmin,addTaxDocument);
route.get("/tax-doc-type/fetch",verifyAdmin,getTaxDocuments);
route.post("/tax-return-doc-type/add",verifyAdmin,addTaxReturnDocument);
route.get("/tax-return-doc-type/fetch",verifyAdmin,getTaxReturnDocuments);

/**-------------------------------Client Yearly Taxation-------------------- */
route.get("/client-documents/fetch",verifyAdmin,fetchClientDocuments);

/**-------------------------------------Tax Return Documents Types-------------------- */
route.get("/tax-return-doc-type/active",verifyAdmin,getActiveTaxReturnDocuments);


/**-----------------------------------------Tax Year------------------------- */
route.get("/tax-year/active",verifyAdmin,getActiveYears);




module.exports = route;
