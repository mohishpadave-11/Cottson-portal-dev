import transporter, { sendEmail } from "../config/mailer.js";
import { EmailTemplates } from "../templates/emailTemplate.js";

/**
 * Email Service for specific business logic emails
 * Uses branded email templates with Cottson styling
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
      const html = EmailTemplates.documentNotification(clientName, docType, orderNumber, docUrl);

      await sendEmail(clientEmail, subject, html);
      return true;
    } catch (error) {
      console.error("EmailService Error:", error);
      return false;
    }
  },

  /**
   * Send Order Status Update to Client
   * @param {string} clientEmail - Client's email address
   * @param {string} clientName - Client's name
   * @param {string} orderNumber - Order reference number
   * @param {string} status - New order status
   * @param {string} message - Optional additional message
   */
  sendOrderStatusUpdate: async (clientEmail, clientName, orderNumber, status, message) => {
    try {
      const subject = `Order Update: #${orderNumber} - ${status}`;
      const html = EmailTemplates.orderStatusUpdate(clientName, orderNumber, status, message);

      await sendEmail(clientEmail, subject, html);
      return true;
    } catch (error) {
      console.error("EmailService Error:", error);
      return false;
    }
  },

  /**
   * Send Welcome Email to New Client
   * @param {string} clientEmail - Client's email address
   * @param {string} clientName - Client's name
   * @param {string} loginUrl - Optional custom login URL
   */
  sendWelcomeEmail: async (clientEmail, clientName, loginUrl) => {
    try {
      const subject = "Welcome to Cottson Clothing";
      const html = EmailTemplates.welcome(clientName, loginUrl);

      await sendEmail(clientEmail, subject, html);
      return true;
    } catch (error) {
      console.error("EmailService Error:", error);
      return false;
    }
  },

  /**
   * Send Password Reset Email
   * @param {string} userEmail - User's email address
   * @param {string} userName - User's name
   * @param {string} resetUrl - Password reset URL with token
   */
  sendPasswordResetEmail: async (userEmail, userName, resetUrl) => {
    try {
      const subject = "Password Reset Request - Cottson Clothing";
      const html = EmailTemplates.passwordReset(userName, resetUrl);

      await sendEmail(userEmail, subject, html);
      return true;
    } catch (error) {
      console.error("EmailService Error:", error);
      return false;
    }
  },

  /**
   * Send Generic Notification Email
   * @param {string} userEmail - User's email address
   * @param {string} userName - User's name
   * @param {string} title - Email title
   * @param {string} message - Email message (can include HTML)
   * @param {string} actionUrl - Optional action button URL
   * @param {string} actionText - Optional action button text
   */
  sendNotification: async (userEmail, userName, title, message, actionUrl, actionText) => {
    try {
      const subject = title;
      const html = EmailTemplates.notification(userName, title, message, actionUrl, actionText);

      await sendEmail(userEmail, subject, html);
      return true;
    } catch (error) {
      console.error("EmailService Error:", error);
      return false;
    }
  },

  /**
   * Send Admin Welcome Email with Credentials
   * @param {string} email - Admin email
   * @param {string} name - Admin name
   * @param {string} password - Generated password
   */
  sendAdminWelcome: async (email, name, password) => {
    try {
      const subject = "Welcome to Cottson Admin Portal";
      const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
      const html = EmailTemplates.adminWelcome(name, email, password, loginUrl);

      await sendEmail(email, subject, html);
      return true;
    } catch (error) {
      console.error("EmailService Error:", error);
      return false;
    }
  }
};

export default EmailService;
