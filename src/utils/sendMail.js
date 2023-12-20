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

const VendorSuccessRegister = async(to, pass, name) => {
    console.log(to, pass, name, "---------");
    const receivers = [
        {
          email: to,
        },
      ];
    
      await tranEmailApi.sendTransacEmail({
        sender,
        to: receivers,
        subject: 'Welcome to EJOYSHOP - Successful Vendor Registration!',
        htmlContent:  `<div style="color:black"><p>Dear ${name} ,</p>

        <p>Congratulations and welcome to EJOYSHOP! We are excited to have you as a vendor on our platform. Your registration process has been successfully completed, and we can't wait to see your products thrive in our marketplace.</p> 
        
        <p>Here are your login credentials:</p> 
        
        <p>Username: ${to}<br/> 
        Password: ${pass}</p> 
        
        <p>Please keep these credentials safe and confidential. They are crucial for accessing and managing your vendor account. In case you forget your password, you can use the "Forgot Password" option on our login page to reset it.</p> 
        
        <p>At EJOYSHOP, we provide you with an intuitive dashboard that enables you to effortlessly add, edit, and manage your product listings. We also offer robust analytics and reporting tools to help you gain insights into your sales performance and customer behaviour.</p> 
        
        <p>Feel free to explore our vendor documentation in our knowledge base to familiarize yourself with all the features and maximize your vendor experience.</p> 
        
        <p>Should you need any assistance or have questions, our support team is here to help. You can reach us through the contact details provided at the end of this email.</p> 
        
        <p>Once again, welcome to EJOYSHOP! We're thrilled to have you join our community of vendors, and we look forward to your success.</p>
        
        <p>Best regards,</br> 
        EJOYSHOP Onboarding Team</p></div>`,
      });
   
}


const VendorRejectionRegister = async(to, name) => {
    console.log(to, name, "---------");

    const receivers = [
      {
        email: to,
      },
    ];
  
    await tranEmailApi.sendTransacEmail({
      sender,
      to: receivers,
      subject:  'Update on Your Vendor Registration Application - Rejection Notice',
      htmlContent: `<div style="color:black"><p>Dear ${name}</p>,

      <p>Thank you for your interest in becoming a vendor at EJOYSHOP. We appreciate the time and effort you put into your application. After careful consideration, we regret to inform you that your vendor registration has not been approved at this time.</p>

      <p>While we understand this may come as disappointing news, please note that our decision is based on various factors and requirements specific to our platform and current vendor capacity. We encourage you to continue pursuing your business goals and exploring other opportunities that align with your products and services.</p>

      <p>Although your application was not successful at this time, we appreciate your interest in EJOYSHOP and the effort you have made to be a part of our vendor community. We sincerely value your interest in our platform.</p>

      <p>If you have any further questions or would like to receive feedback regarding your application, please do not hesitate to reach out to us. We are more than willing to provide additional insights that may help you in future endeavors.</p>

      <p>Thank you once again for considering EJOYSHOP. We wish you the very best in your business ventures, and we hope our paths may cross again in the future.</p>

      <p>Best regards,<br/>
      EJOYSHOP  Onboarding Team</p></div>`
      
    });
}




module.exports = {VendorSuccessRegister, VendorRejectionRegister}
