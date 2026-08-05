const { Resend } = require("resend");

// Initialize Resend if API key is provided
let resend;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

/**
 * Send an email notification using Resend
 */
const sendEmail = async ({ to, subject, html }) => {
  if (!resend) {
    console.warn("⚠️ Resend API key missing. Email notification skipped:", subject);
    return null;
  }

  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Ira Fashion <noreply@iras-fashion.com>",
      to: [to],
      subject,
      html,
    });
    return data;
  } catch (error) {
    console.error("❌ Failed to send email via Resend:", error.message);
    return null;
  }
};

/**
 * Format order confirmation template
 */
const sendOrderConfirmationEmail = async (order) => {
  const itemsHtml = order.products
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.title}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity || 1}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${(item.price * (item.quantity || 1)).toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #db2777;">Thank you for your order!</h2>
      <p>Hi ${order.customerName || "Customer"},</p>
      <p>We've received your order and are processing it. Your order total is <strong>$${order.totalPrice.toFixed(2)}</strong>.</p>
      
      <h3 style="margin-top: 20px; border-bottom: 2px solid #db2777; padding-bottom: 5px;">Order Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 8px; text-align: left;">Item</th>
            <th style="padding: 8px; text-align: center;">Qty</th>
            <th style="padding: 8px; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <p style="margin-top: 20px;">We'll notify you as soon as your items ship!</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #666;">Ira's Fashion House, 2026. All rights reserved.</p>
    </div>
  `;

  return sendEmail({
    to: order.email,
    subject: `Order Confirmed - Ira's Fashion House`,
    html: emailHtml,
  });
};

module.exports = {
  sendEmail,
  sendOrderConfirmationEmail,
};
