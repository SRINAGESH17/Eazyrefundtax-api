const GlobalSetting = require("../models/GlobalSetting");
const firebase = require("../../config/firebase");
const moment = require("moment");
const _ = require("lodash");
// Function to check if mobile number exists in Firebase Authentication

async function checkMobileExistsInAuth(mobileNumber) {
  try {
    await firebase.auth().getUserByPhoneNumber(mobileNumber);
    return true; // Mobile number exists
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      return false; // Mobile number doesn't exist
    }
    throw error; // Other errors
  }
}

// Function to check if email exists in Firebase Authentication
async function checkEmailExistsInAuth(email) {
  try {
    await firebase.auth().getUserByEmail(email);
    return true; // Email exists
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      return false; // Email doesn't exist
    }
    throw error; // Other errors
  }
}

async function generateCallId() {
  const currentDate = moment();
  const currentYear = currentDate.format("YY");
  const currentMonth = currentDate.format("MM");

  // Fetch the global settings from the database
  let globalSettings = await GlobalSetting.findOne();

  if (_.isEmpty(globalSettings)) {
    // If there are no global settings, create a new entry
    globalSettings = new GlobalSetting({
      lastCallId: `${currentYear}${currentMonth}000000`,
    });
    await globalSettings.save();
  }

  // Check if the month has changed
  const lastCallId =
    globalSettings.lastCallId || `${currentYear}${currentMonth}000000`;

  const lastMonth = moment(lastCallId.slice(0, 4), "YYMM").format("MM");
  const lastYear = moment(lastCallId.slice(0, 4), "YYMM").format("YY");

  let newCallId;
  if (lastMonth !== currentMonth || lastYear !== currentYear) {
    newCallId = `${currentYear}${currentMonth}000001`;
  } else {
    // Increment the last call ID
    const lastNumber = parseInt(lastCallId.slice(-6), 10);
    console.log(lastNumber);
    newCallId = `${currentYear}${currentMonth}${(lastNumber + 1)
      .toString()
      .padStart(6, "0")}`;
    console.log(newCallId);
  }

  // Update the lastCallId in global settings
  globalSettings.lastCallId = newCallId;
  await globalSettings.save();

  return newCallId;
}

module.exports = {
  checkEmailExistsInAuth,
  checkMobileExistsInAuth,
  generateCallId,
};
