const express = require("express");
const { verifyPreparer } = require("../middlewares/Auth");

const multer = require("multer");

const upload = require("../middlewares/upload");
const { clientTaxStats } = require("../controllers/ClientYearlyTaxation");

const route = express.Router();

/**--------------------------------------Client taxations------------------------ */
route.get("/client-yearly-taxations/stats", verifyPreparer, clientTaxStats);
route.post(
  "/client-yearly-taxations/send-email",
  verifyPreparer,
  upload.fields([{name:"attachments",maxCount:10}]),
  sendClientEmail
);

module.exports = route;
