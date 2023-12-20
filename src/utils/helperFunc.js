const firebase = require('../../config/firebase');


// Function to check if mobile number exists in Firebase Authentication


async function checkMobileExistsInAuth(mobileNumber) {
    try {
      await firebase.auth().getUserByPhoneNumber(mobileNumber);
      return true; // Mobile number exists
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
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
      if (error.code === 'auth/user-not-found') {
        return false; // Email doesn't exist
      }
      throw error; // Other errors
    }
  }

  module.exports ={checkEmailExistsInAuth,checkMobileExistsInAuth}