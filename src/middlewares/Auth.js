const firebase = require("../../config/firebase");
var _ = require("lodash");

const { failedResponse } = require("../utils/message");
const UserRole = require("../models/UserRole");
const Caller = require("../models/Caller");
const Preparer = require("../models/Preparer");

const getAuthToken = (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    req.authToken = req.headers.authorization.split(" ")[1];
  } else {
    req.authToken = null;
  }
  next();
};

const isAuth = (req, res, next) => {
  getAuthToken(req, res, async () => {
    try {
      const { authToken } = req;

      if (_.isEmpty(authToken)) {
        return res
          .status(401)
          .json(
            failedResponse(
              401,
              false,
              "Token is missing from the headers",
              {},
              errorTypes.AUTH_TOKEN_MISSING
            )
          );
      }
      const userInfo = await firebase.auth().verifyIdToken(authToken);
      console.log(userInfo);
      req.authId = userInfo.uid;
      req.phone_number = userInfo.phone_number;
      req.currUser = userInfo;

      return next();
    } catch (e) {
      console.log(e.message);
      if (e) {
        return res
          .status(400)
          .send(
            failedResponse(
              400,
              false,
              e.codePrefix,
              { code: e.code, message: e.message },
              e.code
            )
          );
      }
    }
  });
};

const getUserRole = async (req, res, next) => {
  const fireBaseId = req.currUser.uid;

  if (_.isEmpty(fireBaseId)) {
    return res
      .status(400)
      .json(failedResponse(400, false, "User not found.", {}));
  }
  try {
    const Role = await UserRole.findOne({ firebaseId: fireBaseId });

    if (_.isEmpty(Role)) {
      return res
        .status(400)
        .json(failedResponse(400, false, "Role not found."));
    }
// Convert Mongoose document to a plain JavaScript object
const roleObject = Role.toObject();
console.log(roleObject,"idiieiieiieeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");

    req.userRole = roleObject;

    next();
  } catch (error) {
    return res
      .status(500)
      .json(failedResponse(500, false, "Something went wrong", error));
  }
};

const verifyAdmin = (req, res, next) => {
  isAuth(req, res, async () => {
    getUserRole(req, res, async () => {
      if (req?.userRole?.role?.admin) {
        next();
      } else {
        return res
          .status(403)
          .json(failedResponse(403, false, "you are not authorized User", {}));
      }
    });
  });
};
const verifyEmployee = (req, res, next) => {
  isAuth(req, res, async () => {
    getUserRole(req, res, async () => {
      if (req?.userRole?.role?.employee) {
        next();
      } else {
        return res
          .status(403)
          .json(failedResponse(403, false, "you are not authorized User", {}));
      }
    });
  });
};
const verifyCaller = (req, res, next) => {
  isAuth(req, res, async () => {
    getUserRole(req, res, async () => {
      const caller = await Caller.findOne({employee:req.userRole.userMongoId})
      console.log(caller,"88888888")
      if (req?.userRole?.role?.employee && !_.isEmpty(caller)) {
        req.userRole.role.caller = true;
        req.userRole.callerId = caller._id
        next();
      } else {
        return res
          .status(403)
          .json(failedResponse(403, false, "you are not authorized User", {}));
      }
    });
  });
};
const verifyPreparer = (req, res, next) => {
  isAuth(req, res, async () => {
    getUserRole(req, res, async () => {
      const preparer = await Preparer.findOne({employee:req.userRole.userMongoId})
     
      if (req?.userRole?.role?.employee && !_.isEmpty(preparer)) {
        req.userRole.role.preparer = true;
        req.userRole.preparerId = preparer._id
        next();
      } else {
        return res
          .status(403)
          .json(failedResponse(403, false, "you are not authorized User", {}));
      }
    });
  });
};

module.exports = { isAuth, getUserRole, verifyAdmin,verifyCaller,verifyEmployee,verifyPreparer };
