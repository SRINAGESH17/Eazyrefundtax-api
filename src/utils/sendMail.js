require('dotenv').config();

const Sib = require('sib-api-v3-sdk');
const client = Sib.ApiClient.instance;
const apiKey = client.authentications['api-key'];

apiKey.apiKey = process.env.SENDINBLUE_API_KEY;

const tranEmailApi = new Sib.TransactionalEmailsApi()
const sender = {
  email: process.env.EMAIL_ADD,
  name: 'Eazy Refund',
};

const EmployeeSuccessRegister = async (to, pass, name) => {
  console.log(to, pass, name, "---------");

  const receivers = [
    {
      email: to,
    },
  ];

  await tranEmailApi.sendTransacEmail({
    sender,
    to: receivers,
    subject: 'Welcome to EazyRefundTax - Successful Employee Registration!',
    htmlContent: `<div style="color:black">
        <p>Dear ${name},</p>

        <p>Congratulations and welcome to EazyRefundTax! We are delighted to have you as an employee in our organization. Your registration process has been successfully completed, and we are eager to embark on this journey together.</p> 

        <p>Here are your login credentials:</p> 

        <p>Username: ${to}<br/> 
        Password: ${pass}</p> 

        <p>Please ensure the confidentiality of these credentials, as they are essential for accessing and managing your employee account. If you happen to forget your password, you can use the "Forgot Password" option on our login page to reset it.</p> 

        <p>At EazyRefundTax, we provide you with tools and resources to streamline your work and contribute to our mission. Your dedication and efforts play a crucial role in our success.</p> 

        <p>Explore our internal systems and documentation to familiarize yourself with the workflows and processes. If you have any questions or need assistance, our support team is here to help. You can find the contact details at the end of this email.</p> 

        <p>Once again, welcome to EazyRefundTax! We're excited to have you on board, and we look forward to achieving great things together.</p>

        <p>Best regards,</br> 
        EazyRefundTax HR Team</p>
      </div>`,
  });
};




const SubAdminSuccessRegister = async (to, pass, name) => {
  console.log(to, pass, name, "---------");

  const receivers = [
    {
      email: to,
    },
  ];

  await tranEmailApi.sendTransacEmail({
    sender,
    to: receivers,
    subject: 'Welcome to EazyRefundTax - Successful Sub-Admin Registration!',
    htmlContent: `<div style="color:black">
        <p>Dear ${name},</p>

        <p>Congratulations and welcome to EazyRefundTax! We are thrilled to have you as a Sub-Admin in our organization. Your registration process has been successfully completed, and we look forward to working together to ensure the success of our operations.</p>

        <p>Here are your login credentials:</p>

        <p>Username: ${to}<br/>
        Password: ${pass}</p>

        <p>Please ensure the confidentiality of these credentials, as they are vital for accessing and managing your Sub-Admin account. If you happen to forget your password, you can use the "Forgot Password" option on our login page to reset it.</p>

        <p>As a Sub-Admin, you play a crucial role in the management and oversight of our system. We trust that your skills and expertise will contribute significantly to the success of our organization.</p>

        <p>Feel free to explore our internal systems and documentation to familiarize yourself with your responsibilities and privileges. If you have any questions or need assistance, our support team is here to help. You can find the contact details at the end of this email.</p>

        <p>Once again, welcome to EazyRefundTax! We're excited to have you on board, and we look forward to achieving great milestones together.</p>

        <p>Best regards,<br/>
        EazyRefundTax Admin Team</p>
      </div>`,
  });
};







module.exports = {EmployeeSuccessRegister, SubAdminSuccessRegister}
