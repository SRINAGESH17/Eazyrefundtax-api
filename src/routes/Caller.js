const express = require("express");
const { verifyAdmin, verifyCaller } = require("../middlewares/Auth");

const { fetchCalls, updateStatusAndComment, callStats, fetchSlotWiseForCaller } = require("../controllers/Call");
const multer = require("multer");
const { fetchClientTaxations, assignPreparer, fetchClientTaxationById } = require("../controllers/ClientYearlyTaxation");
const { uploadedDocument, getCombinedDocuments } = require("../controllers/Document");
const upload = require("../middlewares/upload");
const { getActiveTaxDocuments } = require("../controllers/TaxDocument");
const route = express.Router();



/**------------------------------------Call------------------------------- */

route.get('/call/fetch',verifyCaller,fetchCalls);
route.put('/call/:callId/update',verifyCaller, updateStatusAndComment);
route.get('/call/stats',verifyCaller, callStats);
route.get('/call/slotwise-calls',verifyCaller, fetchSlotWiseForCaller);

/**--------------------------------------Client taxations------------------------ */
route.get('/client-yearly-taxations/fetch',verifyCaller,fetchClientTaxations);
route.get('/client-yearly-taxations/:clientYearlyTaxationId/fetch',verifyCaller,fetchClientTaxationById);
route.put('/client-yearly-taxations/:clientYearlyTaxationId/assign-preparer',verifyCaller,assignPreparer);

/**-------------------------------------Documents-------------------------------------- */
route.post('/document/upload/:clientYearlyTaxId',verifyCaller,upload.single('doc'),uploadedDocument);
route.get('/document/fetch',verifyCaller,getCombinedDocuments);

/**-----------------------------------------tax document types---------------------------- */
route.get('/tax-doc-type/active',verifyCaller,getActiveTaxDocuments);





module.exports = route;
