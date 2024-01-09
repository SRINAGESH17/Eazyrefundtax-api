const ClientEmail = require("../models/ClientEmail");
const ClientYearlyTaxation = require("../models/ClientYearlyTaxation");
const { failedResponse } = require("../utils/message");
const { ClientTaxEmail } = require("../utils/sendMail");

exports.sendClientEmail = async (req,res)=>{
    try {
        const {role}= req.userRole;
        const {subject,content}= req.body;
        const {id}= req.params;
        if (!id) {
            return res.status(400).json(failedResponse(400,false,"Client Yearly Taxation id is required."));
        }
        const clientTax = await ClientYearlyTaxation.findById(id).populate("client").exec();
        if (!clientTax) {
            return res.status(400).json(failedResponse(400,false,"Client Yearly Taxation does not exist."));
            
        }
        if (!subject) {
            return res.status(400).json(failedResponse(400,false,"Subject is required")); 
        }
        if (!content) {
            return res.status(400).json(failedResponse(400,false,"Content is required")); 
        }
        let attachments;
        if (req.file["attachments"].length>0) {
           attachments= req.file["attachments"].map((attachment)=>{
                  return {name:attachment.originalName,url:attachment.location}
            })
        }
        let sender,senderModel;
        if (role.preparer) {
            sender= req.userRole.preparerId;
            senderModel="preparers"
        } else if(role.reviewer) {
            sender= req.userRole.reviewerId;
            senderModel="reviewers"
            
        }

        const newEmail = new ClientEmail({
            clientYearlyTaxId:id,
            sender,
            senderModel,
            content,
            attachments
        });
        const savedEmail = await newEmail.save();
        const emailRes = await ClientTaxEmail(clientTax.client.email,clientTax.client.name,subject,content,attachments);
        savedEmail.status = "SENT"

    } catch (error) {
         res.status(500).json(failedResponse(500,false,"Internal Server Error")); 
        
    }
}