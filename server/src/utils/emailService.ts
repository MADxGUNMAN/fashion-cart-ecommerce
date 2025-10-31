import nodemailer from 'nodemailer';

// Create transporter using Gmail only if credentials are available
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email credentials not configured - email service disabled');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const transporter = createTransporter();

// Verify transporter configuration only if transporter exists
if (transporter) {
  // Skip verification to prevent timeout on startup
  console.log('Email transporter configured - verification skipped');
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    if (!transporter) {
      console.log('Email service not configured - skipping email send');
      return false;
    }

    const mailOptions = {
      from: `"Your E-commerce Store" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Order confirmation email template
export const generateOrderConfirmationEmail = (orderData: any) => {
  const { order, user, items } = orderData;
  
  const itemsHtml = items.map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong>${item.productName}</strong><br>
        <small>Size: ${item.size || 'N/A'} | Color: ${item.color || 'N/A'}</small>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        ₹${item.price.toFixed(2)}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        ₹${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');

  const paymentMethodDisplay = order.paymentMethod === 'CASH_ON_DELIVERY' 
    ? 'Cash on Delivery' 
    : order.paymentMethod.replace(/_/g, ' ');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50;">Order Confirmation</h1>
          <p style="font-size: 18px; color: #27ae60;">Thank you for your order!</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin-top: 0;">Order Details</h2>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p><strong>Payment Method:</strong> ${paymentMethodDisplay}</p>
          <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
          ${order.paymentMethod === 'CASH_ON_DELIVERY' ? 
            '<p style="color: #e67e22;"><strong>Note:</strong> Please keep the exact amount ready for payment on delivery.</p>' : 
            ''}
        </div>

        <div style="margin-bottom: 20px;">
          <h2>Items Ordered</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #34495e; color: white;">
                <th style="padding: 12px; text-align: left;">Product</th>
                <th style="padding: 12px; text-align: center;">Qty</th>
                <th style="padding: 12px; text-align: right;">Price</th>
                <th style="padding: 12px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <div style="text-align: right;">
            <h3 style="margin: 0; font-size: 20px;">Total: ₹${order.total.toFixed(2)}</h3>
          </div>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3>Shipping Address</h3>
          <p>
            <strong>${order.address?.name}</strong><br>
            ${order.address?.address}<br>
            ${order.address?.city}, ${order.address?.country}<br>
            ${order.address?.postalCode}<br>
            Phone: ${order.address?.phone}
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p>Thank you for shopping with us!</p>
          <p style="color: #7f8c8d; font-size: 14px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Admin notification email template
export const generateAdminOrderNotificationEmail = (orderData: any) => {
  const { order, user, items } = orderData;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Order Notification</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #e74c3c;">New Order Received!</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2>Order Information</h2>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Customer:</strong> ${user.name} (${user.email})</p>
          <p><strong>Payment Method:</strong> ${order.paymentMethod.replace(/_/g, ' ')}</p>
          <p><strong>Total Amount:</strong> ₹${order.total.toFixed(2)}</p>
          <p><strong>Items Count:</strong> ${items.length}</p>
          
          ${order.paymentMethod === 'CASH_ON_DELIVERY' ? 
            '<p style="color: #e67e22; font-weight: bold;">⚠️ Cash on Delivery Order - Payment Pending</p>' : 
            ''}
        </div>
      </div>
    </body>
    </html>
  `;
};
