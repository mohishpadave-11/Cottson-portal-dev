import transporter, { sendEmail } from "../config/mailer.js";

/**
 * Email Service for specific business logic emails
 */
const EmailService = {
  /**
   * Send Document Upload Notification to Client
   * @param {string} clientEmail - Client's email address
   * @param {string} clientName - Client's name
   * @param {string} docType - Type of document uploaded (e.g., Quotation)
   * @param {string} orderNumber - Order reference number
   * @param {string} docUrl - Optional URL to view the document
   */
  sendDocumentNotification: async (clientEmail, clientName, docType, orderNumber, docUrl) => {
    try {
      const subject = `New Document Available: ${docType} for Order #${orderNumber}`;
      const docLabel = docType.replace(/([A-Z])/g, ' $1').trim(); // e.g. "proformaInvoice" -> "proforma Invoice"

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2c3e50;">New Document Uploaded</h2>
          <p>Hello ${clientName},</p>
          <p>A new document (<strong>${docLabel}</strong>) has been uploaded for your Order <strong>#${orderNumber}</strong>.</p>
          
          <div style="background-color: #f0f0f0; padding: 15px; border-radius: 4px; margin: 20px 0;">
             <p style="margin: 0;"><strong>Document Type:</strong> ${docLabel}</p>
             <p style="margin: 5px 0 0;"><strong>Order Number:</strong> #${orderNumber}</p>
          </div>

          <p>Please log in to your portal to view or download the document.</p>

          ${docUrl ? `
          <p style="text-align: center; margin-top: 30px;">
            <a href="${docUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
              View Document
            </a>
          </p>
          ` : ''}
          
          <hr style="border: 1px solid #eee; margin-top: 30px;" />
          <p style="color: #7f8c8d; font-size: 12px; text-align: center;">Cotton Portal Notifications</p>
        </div>
      `;

      // Use the generic sendEmail function from config/mailer or transporter directly
      // Assuming sendEmail helper handles basic error logging.
      await sendEmail(clientEmail, subject, html);
      return true;
    } catch (error) {
      console.error("EmailService Error:", error);
      return false;
    }
  }
};

export default EmailService;
