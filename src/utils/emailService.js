const SibApiV3Sdk = require('@getbrevo/brevo');
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API);

const generateEmailTemplate = (subject, content) => {
  const logoUrl = process.env.LOGO_URL;
  const footerText = "Sthani © 2024. All rights reserved.";
  const contactEmail = "contact@sthani.ae";
  const websiteUrl = "https://sthani.ae";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
        .header { background-color: #f7f7f7; padding: 20px; text-align: center; }
        .header img { max-width: 150px; }
        .content { padding: 20px; }
        .footer { background-color: #f7f7f7; padding: 20px; text-align: center; }
        .footer a { color: #333; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${logoUrl}" alt="Company Logo" />
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>${footerText}</p>
        <p><a href="mailto:${contactEmail}">${contactEmail}</a> | <a href="${websiteUrl}">${websiteUrl}</a></p>
      </div>
    </body>
    </html>
  `;
};

const sendEmail = async (to, subject, content) => {
  const htmlContent = generateEmailTemplate(subject, content);
  const senderEmail = process.env.SENDER_EMAIL;
  const senderName = process.env.SENDER_NAME;

  console.log(`Sending email to: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Sender: ${senderEmail}, ${senderName}`);
  console.log(`HTML Content: ${htmlContent}`);

  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail({
      to: [{ email: to, name: "Recipient Name" }],
      sender: { "email": senderEmail, "name": senderName },
      subject: subject,
      htmlContent: htmlContent,
    });

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent successfully', data);
  } catch (error) {
    console.error('Error sending email', error.response ? error.response.body : error);
  }
};

const generateOrderItemsTable = (items) => {
  let rows = items.map(item => `
    <tr>
      <td><img src="${item.image ? process.env.MEDIA_URL + item.image : ''}" alt="${item.name}" width="50"></td>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${item.price}</td>
    </tr>`).join('');

  return `
    <table border="1" cellpadding="5" cellspacing="0">
      <thead>
        <tr>
          <th>Image</th>
          <th>Name</th>
          <th>Quantity</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>`;
};

module.exports = {
  sendOrderCreatedEmail: async (order) => {
    const subject = 'Your Order has been created';
    const orderItemsTable = generateOrderItemsTable(order.items);
    const content = `<h1>Order Confirmation</h1>
                     <p>Thank you for your order. Your order ID is ${order._id}</p>
                     ${orderItemsTable}`;
    await sendEmail(order.customer.email, subject, content);
  },

  sendPaymentStatusUpdatedEmail: async (order) => {
    const subject = 'Payment Status Updated';
    const orderItemsTable = generateOrderItemsTable(order.items);
    const content = `<h1>Payment Status Update</h1>
                     <p>Your payment status for order ID ${order._id} is now ${order.paymentStatus}</p>
                     ${orderItemsTable}`;
    await sendEmail(order.customer.email, subject, content);
  },

  sendOrderStatusUpdatedEmail: async (order) => {
    const subject = 'Order Status Updated';
    const orderItemsTable = generateOrderItemsTable(order.items);
    const content = `<h1>Order Status Update</h1>
                     <p>Your order ID ${order._id} status is now ${order.orderStatus}</p>
                     ${orderItemsTable}`;
    await sendEmail(order.customer.email, subject, content);
  },
};
