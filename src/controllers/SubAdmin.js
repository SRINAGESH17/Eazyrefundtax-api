const yup = require("yup");
const firebase = require("../../config/firebase");
const {
  checkEmailExistsInAuth,
  checkMobileExistsInAuth,
} = require("../utils/helperFunc");
const { VendorSuccessRegister, SubAdminSuccessRegister } = require("../utils/sendMail");
const SubAdmin = require("../models/SubAdmin");
const UserRole = require("../models/UserRole");
const { failedResponse, successResponse } = require("../utils/message");
const generateId = require("../utils/genRandomId");

// Define a Yup schema for request data validation
const createSubAdminSchema = yup.object().shape({
  name: yup.string().required("Name is required"),
  mobileNumber: yup.string().required("Mobile number is required"),
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  password: yup.string().required("Password is required"),
});
const updateSubAdminSchema = yup.object().shape({
  name: yup.string().required("Name is required"),
  mobileNumber: yup.string().required("Mobile number is required"),
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
});

exports.createSubAdmin = async (req, res) => {
  try {
   
    let photo = "";
    if (req.files) {
      if (req.files["photo"]?.length > 0) {
        photo = req.files["photo"][0].location;
      }
    }

    // Validate request data using Yup schema

    console.log(req.body, "create subadmin data received");
    await createSubAdminSchema.validate(req.body, { abortEarly: false });

    const { name, mobileNumber, email, password, permissions, state, zipCode } =
      req.body;
    console.log(req.body);

    const parsedPermissions =
      typeof permissions === "string" ? JSON.parse(permissions) : permissions;

    // Check if email already exists in Firebase Authentication
    const emailExistsInAuth = await checkEmailExistsInAuth(email);
    if (emailExistsInAuth) {
      return res
        .status(400).json(failedResponse(400, false, "Email already exists."));
    }

    // Check if mobile number already exists
    const mobileExistsInAuth = await checkMobileExistsInAuth(mobileNumber);
    if (mobileExistsInAuth) {
      return res
        .status(400).json(failedResponse(400, false, "Mobile number already exists."));
    }

    var randomNum = "";

    async function getUniqueNumber() {
      randomNum = "SA" + generateId(2);

      try {
        const result = await SubAdmin.findOne({ id: randomNum });
        if (result) {
          return getUniqueNumber();
        }
        return randomNum;
      } catch (err) {
        console.log(err)
        throw err;
      }
    }
    getUniqueNumber();


    const newSubAdmin = new SubAdmin({
      id: randomNum,
      name,
      mobileNumber,
      email,
      photo,
      permissions: parsedPermissions,
      state,
      zipCode,
    });
    
    const savedSubAdmin = await newSubAdmin.save();
   
    if (!savedSubAdmin) {
      return res
        .status(500)
        .json(failedResponse(500, false, "Something went wrong"));
    }

    const subAdminCred = await firebase.auth().createUser({
      email: email,
      password,
      mobileNumber,
      photoURL: photo,
      emailVerified: false,
      disabled: false,
    });

    const subAdminCredId = subAdminCred.uid;

    //-------------saving users roles--------------
    const subAdminRole = new UserRole({
      userMongoId: savedSubAdmin._id,
      firebaseId: subAdminCredId,
      "role.subAdmin": true,
      userModel: "sub_admins",
    });
    /**----------------------------------Based on role create designation document---------------------------- */

    const subAdminRoleSaved = await subAdminRole.save();
    if (!subAdminRoleSaved) {
      return res
        .status(500)
        .json(failedResponse(500, false, "Something went wrong"));
    }
    newSubAdmin.userRole = subAdminRoleSaved._id;

    await newSubAdmin.save();

    await SubAdminSuccessRegister(email, password, name);

    return res
      .status(201)
      .json(successResponse(201, true, "SubAdmin employee created successfully"));
  } catch (error) {
    // Handle Yup validation errors
    console.log(error);
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json(failedResponse(400, false, "Validation failed", error.errors));
    }

    // Handle other errors...
    res
      .status(500)
      .json(failedResponse(500, false, "Internal Server Error", error));
  }
};

exports.updateSubAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(id, "data received ", req.body);

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "SubAdmin ID is required.",
      });
    }
    

    let photo = "";
    if (req.files) {
      if (req.files["photo"]?.length > 0) {
        photo = req.files["photo"][0].location;
      }
    }

    // Validate request data using Yup schema
    // Update the schema as needed for the update operation
    // Assuming you have an updateSubAdminSchema for validation
    // You can adjust it based on the fields that can be updated
    await updateSubAdminSchema.validate(req.body, { abortEarly: false });

    const { name, mobileNumber, email, state,zipCode, permissions } = req.body;
    const parsedPermissions =
      typeof permissions === "string" ? JSON.parse(permissions) : permissions;

    // Find the SubAdmin by ID
    const subAdmin = await SubAdmin.findById(id).populate("userRole").exec();
    
    console.log(subAdmin)

    if (!subAdmin) {
      return res.status(404).json({
        success: false,
        error: "SubAdmin not found.",
      });
    }

    // Check if the updated email is already associated with another SubAdmin or user account
    if (email !== subAdmin.email) {
      const emailExistsInSubAdmins = await SubAdmin.findOne({ email });
      if (emailExistsInSubAdmins) {
        return res
          .status(400)
          .json(failedResponse(400, false, "Email already exists."));
      }

      const emailExistsInAuth = await checkEmailExistsInAuth(email);
      if (emailExistsInAuth) {
        return res
          .status(400)
          .json(failedResponse(400, false, "Email already exists."));
      }
      await firebase.auth().updateUser(subAdmin.userRole.firebaseId, { email });
    }

    // Check if the updated mobile number is already associated with another SubAdmin or user account
    if (mobileNumber !== subAdmin.mobileNumber) {
      const mobileExistsInSubAdmins = await SubAdmin.findOne({ mobileNumber });
      if (mobileExistsInSubAdmins) {
        return res
          .status(400)
          .json(failedResponse(400, false, "Mobile number already exists."));
      }

      const mobileExistsInAuth = await checkMobileExistsInAuth(mobileNumber);
      if (mobileExistsInAuth) {
        return res
          .status(400)
          .json(failedResponse(400, false, "Mobile number already exists."));
      }
      await firebase
        .auth()
        .updateUser(subAdmin.userRole.firebaseId, {
          phoneNumber: mobileNumber,
        });
    }

    // Update SubAdmin fields
    subAdmin.name = name;
    subAdmin.mobileNumber = mobileNumber;
    subAdmin.email = email;
    subAdmin.state = state;
    subAdmin.zipCode = zipCode;
    subAdmin.permissions = parsedPermissions;
    console.log(subAdmin,"above")
    if (photo) {
      await firebase
        .auth()
        .updateUser(subAdmin.userRole.firebaseId, { photoURL: photo });
      console.log(photo, "photo received");
      subAdmin.photo = photo;
    }

    console.log(subAdmin, "a");

    if (photo) {
     subAdmin.photo=photo 
     await firebase.auth().updateUser(subAdmin.userRole.firebaseId, { photoURL:photo });
    }

    // Save the updated SubAdmin
    const updatedSubAdmin = await subAdmin.save();

    return res
      .status(201)
      .json(
        successResponse(
          201,
          true,
          "SubAdmin updated successfully",
          updatedSubAdmin
        )
      );
  } catch (error) {
    // Handle Yup validation errors
    if (error.name === "ValidationError") {
      const validationErrors = error.errors.reduce((acc, curr) => {
        acc[curr.path] = curr.message;
        return acc;
      }, {});
      return res
        .status(400)
        .json(
          failedResponse(400, false, "Validation failed", validationErrors)
        );
    }

    // Handle other errors...
    console.error("Error updating SubAdmin:", error);
    res
      .status(500)
      .json(failedResponse(500, false, "Internal Server Error", error));
  }
};

exports.getSubAdmins = async (req, res) => {
  try {
    const { searchKey, page, limit, downloadable } = req.query;

    console.log(req.query);

    const pipeline = [];

    // Add match stage for search query if searchKey is provided
    if (searchKey) {
      const searchRegex = new RegExp(searchKey, "i");
      pipeline.push({
        $match: {
          $or: [
            { name: searchRegex },
            { id: searchRegex },
            { email: searchRegex },
            { mobileNumber: searchRegex },
            { address: searchRegex },
          ],
        },
      });
    }

    // Add pagination stages
    if (Boolean(downloadable?.toLowerCase() !== "true")) {
      const currentPage = parseInt(page, 10) || 1;
      const itemsPerPage = parseInt(limit, 10) || 10;
      const skip = (currentPage - 1) * itemsPerPage;

      pipeline.push({ $skip: skip }, { $limit: itemsPerPage });
    }

    // Execute aggregation pipeline
    const subAdmins = await SubAdmin.aggregate(pipeline);

    const totalData = await SubAdmin.countDocuments(pipeline[0]?.["$match"] || {});

    console.log(subAdmins);

    return res.status(200).json(
      successResponse(200, true, "Employee Fetched successfully", {
        limitedData: subAdmins,
        totalData,
        currentPage: parseInt(page, 10) || 1,
      })
    );
  } catch (error) {
    console.error("Error fetching SubAdmins:", error);
    res
      .status(500)
      .json(failedResponse(500, false, "Internal Server Error", error));
  }
};

exports.getSubAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(id, "id received");

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "SubAdmin ID is required.",
      });
    }

    const subAdmin = await SubAdmin.findById(id);

    if (!subAdmin) {
      return res.status(404).json({
        success: false,
        error: "SubAdmin not found.",
      });
    }

    return res
      .status(200)
      .json(
        successResponse(
          200,
          true,
          "SubAdmin data fetched successfully",
          subAdmin
        )
      );
  } catch (error) {
    console.error("Error fetching SubAdmin by ID:", error);
    res
      .status(500)
      .json(failedResponse(500, false, "Internal Server Error", error));
  }
};

exports.deleteSubAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(id, "delete id subadmin");

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "SubAdmin ID is required.",
      });
    }

    // Find the SubAdmin by ID
    const subAdmin = await SubAdmin.findById(id).populate("userRole").exec();

    if (!subAdmin) {
      return res.status(404).json({
        success: false,
        error: "SubAdmin not found.",
      });
    }

    console.log(subAdmin, "subadmin ");

    // Delete the SubAdmin's Firebase Authentication account
    await firebase.auth().deleteUser(subAdmin.userRole.firebaseId);

    // Delete the SubAdmin from the SubAdmins collection
    await SubAdmin.findByIdAndDelete(id);

    // Delete the SubAdmin's UsersRoles entry
    await UserRole.findByIdAndDelete(subAdmin.userRole._id);

    return res
      .status(200)
      .json(successResponse(200, true, "SubAdmin deleted successfully"));
  } catch (error) {
    console.log(error)
    res
      .status(500)
      .json(failedResponse(500, false, "Internal Server Error", error));
  }
};

exports.activeSubAdmins= async (req, res) => {
  try {
    const subAdmins = await SubAdmin.find({status:"active"}, { id: 1, name: 1, _id: 1 });

    return res.status(200).json(
      successResponse(200, true, "SubAdmins Fetched successfully", subAdmins)
    );
  } catch (error) {
    console.error("Error fetching SubAdmins:", error);
    res
      .status(500)
      .json(failedResponse(500, false, "Internal Server Error", error));
  }
}