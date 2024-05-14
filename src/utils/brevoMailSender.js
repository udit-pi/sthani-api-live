const SibApiV3Sdk = require('@getbrevo/brevo');

const sendBrevoEmail = async (email, otp) => {
  try {
    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    let apiKey = apiInstance.authentications['apiKey'];
     apiKey.apiKey = process.env.BREVO_API_SECRET

    // let apiInstance = new brevo.TransactionalEmailsApi();
    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.subject = 'Verification Email';
    sendSmtpEmail.htmlContent = `<h1>Please confirm your OTP</h1><p>Here is your OTP code: ${otp}</p>`;
    sendSmtpEmail.sender = { name: 'Sthani Ecommerce', email: 'support@sthani.com' };
    sendSmtpEmail.to = [{ email: email }];
    // sendSmtpEmail.replyTo = { email: 'example@brevo.com', name: 'sample-name' };
    // sendSmtpEmail.headers = { 'Some-Custom-Name': 'unique-id-1234' };
    // sendSmtpEmail.params = { parameter: 'My param value', subject: 'common subject' };

    apiInstance.sendTransacEmail(sendSmtpEmail).then(
      function (data) {
        console.log('API called successfully. Returned data: ' + JSON.stringify(data));
        return data;
      },
      function (error) {
        console.error(error);
      }
    );
  } catch (err) {
    throw err;
  }
};

const sendBrevoSMS = async (mobile, otp) => {
  try {
    console.log('Mobile: ' + mobile )
    // const SibApiV3Sdk = require('sib-api-v3-sdk');
    // const defaultClient = SibApiV3Sdk.ApiClient.instance;

   

    let apiInstance = new SibApiV3Sdk.TransactionalSMSApi();

    let apiKey = apiInstance.authentications['apiKey'];
     apiKey.apiKey = process.env.BREVO_API;

    let sendTransacSms = new SibApiV3Sdk.SendTransacSms();

    sendTransacSms = {
      sender: 'Sthani Ecommerce',
      recipient: mobile,
      content:`Verifcation Code: ${otp}. Valid for 1 minute `
      
    };

    apiInstance.sendTransacSms(sendTransacSms).then(
      function (data) {
        console.log('API called successfully. Returned data: ' + JSON.stringify(data));
        return data
      },
      function (error) {
        console.error('Error: ' +error);
      }
    );
  } catch (err) {
    throw err;
  }
};

module.exports = {
  sendBrevoEmail,
  sendBrevoSMS
};
