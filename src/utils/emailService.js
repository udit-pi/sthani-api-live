const brevo = require('@getbrevo/brevo');
const senderEmail = process.env.SENDER_EMAIL || "contact@sthani.ae";
const senderName = process.env.SENDER_NAME || "Sthani Store";
const logoUrl = process.env.LOGO_URL ;

const sendEmail = async (toEmail, toName="", subject, content) => {
const htmlContent = generateEmailTemplate(subject, content); // Make sure this function exists and returns valid HTML  

let apiInstance = new brevo.TransactionalEmailsApi();
let apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API;

let sendSmtpEmail = new brevo.SendSmtpEmail();

sendSmtpEmail.subject = subject;
sendSmtpEmail.htmlContent =htmlContent;
sendSmtpEmail.sender = { "name": senderName, "email": senderEmail };
sendSmtpEmail.to = [
  { "email": toEmail, "name": toName || toEmail.split('@')[0] }
];

apiInstance.sendTransacEmail(sendSmtpEmail).then(function (data) {
  console.log('API called successfully. Returned data: ' + JSON.stringify(data));
}, function (error) {
  console.error(error);
});
};


const generateEmailTemplate = (subject, content) => {
  
  const currentYear = new Date().getFullYear(); 
  
  const footerText = `If you have any questions, reply to this email or contact us at <a href="mailto:${senderEmail}">${senderEmail}</a>`;
  const copyrightText = `${senderName} © ${currentYear}. All rights reserved.`;
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Helvetica, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;  }
        h1, h2, h3, p { font-size:16px; color: #141414; }
        h1{ font-size: 22px; }
        .header { background-color: #fff; padding: 10px 10px; text-align: left; }
        .header img { max-width: 120px; }
        .content { padding: 20px 10px; background-color: #fff; margin-top: 10px; color: #141414; }
        .footer { background-color: #fff; padding: 20px 10px; text-align: center; font-size: 12px; border-top:1px solid #efefef; }
        .footer a { color: #333; text-decoration: none; }
        .order_summary_table { width: 100%; max-width:600px; border-collapse: collapse; }
        .order_summary_table th, .order_summary_table td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
        .order_totals_table {width: 100%; max-width:600px; border-collapse: collapse;  }
        .order_totals_table td { text-align:right; padding: 8px; border-bottom: 1px solid #ddd; }
        .order_totals_table tr.totals td { text-align:right !important; border-bottom:1px solid white !important;}
        .order_totals_table tr.totals.grand-total td { font-weight:bold; font-size:20px !important; border-top: 1px solid #ddd; }
        .order_no { font-weight:bold; color:#666;}
        .otp { padding:20px 0; display:block; font-weight:bold; color:black !important; font-size:20px; letter-spacing:10px; }
        .button { background-color: #D93D6E; border-radius:8px; color: white !important;  padding: 10px 20px; text-align: center; display: inline-block; font-size: 16px; margin: 10px 2px; cursor: pointer; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${logoUrl}" alt="Company Logo" />
      </div>
      <div class="content">
        
        <p>${content}</p>
       
       
      </div>
      <div class="footer">
        <p>${footerText}</p>
        <p>${copyrightText}</p>
      </div>
    </body>
    </html>
  `;
};



const generateOrderItemsTable = (order) => {
  const totalsTable = generateTotalSummary(order);
  let rows = order.items.map(item => `
    <tr>
      <td><img src="${item.image ? process.env.MEDIA_URL + item.image : ''}" alt="${item.name}" style="width:50px; height:auto; border-radius:4px;"></td>
      <td>${item.name} ${item.variant?.name} x ${item.quantity}</td>
      
      <td style="text-align:right">AED ${item.price.toFixed(2)}</td>
    </tr>`).join('');

  return `
  <h3>Order Summary</h3>
    <table border="0" cellpadding="5" cellspacing="0" class="order_summary_table">
    <thead>
            <tr>
              <th ></th>
              <th>Quantity</th>
              <th>Price</th>
            </tr>
          </thead>
      <tbody>
        ${rows}
        ${totalsTable}
      </tbody>
    </table>`;
};

const generateTotalSummary = (order) => {

  const shippingLabel = order.shipping === 0 ? "FREE" : `AED ${order.shipping.toFixed(2)}`;

  let discountRow = '';
  if (order.discount && order.discount.amount > 0) {
    discountRow = `
      <tr>
        <td colspan="2" style="text-align:right !important;">Discount (${order.discount.code}):</td>
        <td   style="text-align:right !important;">AED -${order.discount.amount.toFixed(2)}</td>
      </tr>
    `;
  }

  return `
        <tr><td colspan="2"   style="text-align:right !important;">Subtotal:</td><td   style="text-align:right !important;">AED ${order.subtotal.toFixed(2)}</td></tr>
        <tr  ><td  colspan="2"   style="text-align:right !important;">Shipping:</td><td  style="text-align:right !important;">${shippingLabel}</td></tr>
        ${discountRow}
        <tr  ><td  colspan="2"  style="text-align:right !important;" ><strong>Total:</strong></td><td   style="text-align:right !important; font-size:18px !important; font-weight:bold;" ><strong>AED ${order.total.toFixed(2)}</strong></td></tr>
     `;
};

module.exports = {
  sendOrderCreatedEmail: async (order) => {
    const subject = 'Your Order has been created';
    const orderItemsTable = generateOrderItemsTable(order);
    
    const content = `<h1>Thank you for your purchase!</h1>
                    <p>Order #${order.order_no}</p>
                    <p>We're getting your order ready to be shipped. We will notify you when it has been sent.</p>
                     
                     <div style="padding:20px 0;">${orderItemsTable}</div>`;
    await sendEmail(order.customer.email, order.customer.name, subject, content);
  },

  sendPaymentStatusUpdatedEmail: async (order) => {
    const subject = 'Payment Status Updated';
    const orderItemsTable = generateOrderItemsTable(order);
    
    const content = `<h1>Payment Status Update</h1>
                     <p>Your payment status for order ID ${order.order_bo} is now ${order.paymentStatus}</p>
                     <div style="padding:20px 0;">${orderItemsTable}</div>`;
    await sendEmail(order.customer.email, order.customer.name, subject, content);
  },

  sendOrderStatusUpdatedEmail: async (order) => {
    const subject = 'Order Status Updated';
    const orderItemsTable = generateOrderItemsTable(order);
    
    const content = `<h1>Order Status Update</h1>
                     <p>Your order ID ${order._id} status is now ${order.orderStatus}</p>
                     <div style="padding:20px 0;">${orderItemsTable}</div>`;
    await sendEmail(order.customer.email, order.customer.name, subject, content);
  },

  sendOTPEmail: async (toEmail, otp) => {
    const subject = 'Sthani Verification Code';
    
    const content = `<h1>Let's sign you up.</h1>
                    <p>Use this code sign up in Sthani Store App</p>
                    <p class="otp">${otp}</p>`;
    await sendEmail(toEmail, "", subject, content);
  },
};
