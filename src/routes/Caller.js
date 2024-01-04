const express = require("express");
const { verifyAdmin, verifyCaller } = require("../middlewares/Auth");

const { fetchCalls, updateStatusAndComment, callStats, fetchSlotWiseForCaller } = require("../controllers/Call");
const multer = require("multer");
const { fetchClientTaxations, assignPreparer } = require("../controllers/ClientYearlyTaxation");
const route = express.Router();



/**------------------------------------Call------------------------------- */

route.get('/call/fetch',verifyCaller,fetchCalls);
route.put('/call/:callId/update',verifyCaller, updateStatusAndComment);
route.get('/call/stats',verifyCaller, callStats);
route.get('/call/slotwise-calls',verifyCaller, fetchSlotWiseForCaller);

/**--------------------------------------Client taxations------------------------ */
route.get('/client-yearly-taxations/fetch',verifyCaller,fetchClientTaxations);
route.put('/client-yearly-taxations/:clientYearlyTaxationId/assign-preparer',verifyCaller,assignPreparer);




module.exports = route;
