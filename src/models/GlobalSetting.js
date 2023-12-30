const mongoose = require("mongoose");



const globalSettingSchema = new mongoose.Schema(
  {
    lastCallId: {
      type: String
    }
    
  },
  { timestamps: true }
);

module.exports = mongoose.model("global_settings", globalSettingSchema);
