/**
 * Email Template Generator for Cottson Clothing
 * Based on design specifications:
 * - Logo centered at top
 * - Navy Blue (#113858) separator line
 * - Professional footer with company details
 */

const BRAND_COLOR = '#113858'; // Navy Blue

/**
 * Generates the email header with centered logo
 */
const getEmailHeader = () => `
  <div style="text-align: center; padding: 30px 0 20px;">
    <img src="https://www.cottson.com/logo.png" alt="Cottson Clothing" style="max-width: 250px; height: auto;" />
  </div>
  <hr style="border: none; border-top: 3px solid ${BRAND_COLOR}; margin: 0 0 30px 0;" />
`;

/**
 * Generates the email footer with Yash Mishra's signature and company details
 */
const getEmailFooter = () => `
  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 40px 0 20px 0;" />
  
  <div style="font-family: Arial, sans-serif; color: #333; font-size: 14px; line-height: 1.6;">
    <p style="margin: 0 0 5px;"><strong>Yash Mishra</strong></p>
    <p style="margin: 0 0 5px; color: #666;">Director</p>
    <p style="margin: 0 0 20px; color: #666;">+91 9892297764</p>
    
    <div style="margin: 20px 0;">
      <img src="https://www.cottson.com/logo.png" alt="Cottson Clothing" style="max-width: 200px; height: auto;" />
    </div>
    
    <p style="margin: 5px 0; color: #666; font-size: 13px;">
      <strong>Registered Office</strong><br/>
      No. 721, Centura Square IT Park,<br/>
      Road No. 27, Wagle Estate, Thane (West) - 400604<br/>
      Maharashtra, India.
    </p>
    
    <p style="margin: 15px 0 0; color: #666; font-size: 13px;">
      <a href="https://www.cottson.com" style="color: ${BRAND_COLOR}; text-decoration: none;">www.cottson.com</a> | 
      022 - 4662 7501 | 
      27GUFPM3357H1ZB
    </p>
  </div>
`;

/**
 * Generates a complete email template
 * @param {string} content - The main HTML content of the email
 * @param {string} title - Optional title for the email
 * @returns {string} Complete HTML email
 */
export const generateEmailTemplate = (content, title = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Cottson Clothing'}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 0 40px 40px;">
              ${getEmailHeader()}
              
              <div style="font-family: Arial, sans-serif; color: #333; font-size: 14px; line-height: 1.6;">
                ${content}
              </div>
              
              ${getEmailFooter()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Pre-built email templates for common scenarios
 */
export const EmailTemplates = {
  /**
   * Document Upload Notification
   */
  documentNotification: (clientName, docType, orderNumber, docUrl) => {
    const docLabel = docType.replace(/([A-Z])/g, ' $1').trim();
    const content = `
      <h2 style="color: ${BRAND_COLOR}; margin-top: 0;">New Document Uploaded</h2>
      <p>Hello ${clientName},</p>
      <p>A new document (<strong>${docLabel}</strong>) has been uploaded for your Order <strong>#${orderNumber}</strong>.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid ${BRAND_COLOR};">
        <p style="margin: 0 0 10px;"><strong>Document Type:</strong> ${docLabel}</p>
        <p style="margin: 0;"><strong>Order Number:</strong> #${orderNumber}</p>
      </div>

      <p>Please log in to your portal to view or download the document.</p>

      ${docUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${docUrl}" style="background-color: ${BRAND_COLOR}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          View Document
        </a>
      </div>
      ` : ''}
    `;
    return generateEmailTemplate(content, `New Document - Order #${orderNumber}`);
  },

  /**
   * Order Status Update
   */
  orderStatusUpdate: (clientName, orderNumber, status, message) => {
    const content = `
      <h2 style="color: ${BRAND_COLOR}; margin-top: 0;">Order Status Update</h2>
      <p>Hello ${clientName},</p>
      <p>Your order <strong>#${orderNumber}</strong> has been updated.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid ${BRAND_COLOR};">
        <p style="margin: 0 0 10px;"><strong>Order Number:</strong> #${orderNumber}</p>
        <p style="margin: 0;"><strong>New Status:</strong> ${status}</p>
      </div>

      ${message ? `<p>${message}</p>` : ''}

      <p>You can track your order progress in the client portal.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_PORTAL_URL || 'https://portal.cottson.com'}/client/orders/${orderNumber}" style="background-color: ${BRAND_COLOR}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          View Order
        </a>
      </div>
    `;
    return generateEmailTemplate(content, `Order Update - #${orderNumber}`);
  },

  /**
   * Welcome Email
   */
  welcome: (clientName, loginUrl) => {
    const content = `
      <h2 style="color: ${BRAND_COLOR}; margin-top: 0;">Welcome to Cottson Clothing</h2>
      <p>Hello ${clientName},</p>
      <p>Welcome to Cottson Clothing! We're excited to have you as our valued client.</p>
      
      <p>Your account has been successfully created. You can now access our client portal to:</p>
      
      <ul style="color: #666; line-height: 2;">
        <li>Track your orders in real-time</li>
        <li>View and download documents</li>
        <li>Manage your profile and preferences</li>
        <li>Submit complaints or queries</li>
      </ul>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl || 'https://portal.cottson.com'}" style="background-color: ${BRAND_COLOR}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          Access Portal
        </a>
      </div>

      <p style="color: #666; font-size: 13px; margin-top: 30px;">
        If you have any questions, feel free to reach out to us.
      </p>
    `;
    return generateEmailTemplate(content, 'Welcome to Cottson Clothing');
  },

  /**
   * Password Reset
   */
  passwordReset: (userName, resetUrl) => {
    const content = `
      <h2 style="color: ${BRAND_COLOR}; margin-top: 0;">Password Reset Request</h2>
      <p>Hello ${userName},</p>
      <p>We received a request to reset your password for your Cottson Clothing account.</p>
      
      <p>Click the button below to reset your password:</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: ${BRAND_COLOR}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          Reset Password
        </a>
      </div>

      <p style="color: #666;">This link will expire in 1 hour for security reasons.</p>
      
      <p style="color: #666; font-size: 13px; margin-top: 30px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
        <strong>Note:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
      </p>
    `;
    return generateEmailTemplate(content, 'Password Reset Request');
  },

  /**
   * Admin Welcome with Credentials
   */
  adminWelcome: (name, email, password, loginUrl) => {
    const content = `
      <h2 style="color: ${BRAND_COLOR}; margin-top: 0;">Welcome to Cottson Admin Portal</h2>
      <p>Hello ${name},</p>
      <p>An administrator account has been created for you at Cottson Clothing.</p>
      
      <p>Here are your login credentials:</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid ${BRAND_COLOR};">
        <p style="margin: 0 0 10px;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 0 0 10px;"><strong>Password:</strong> <code style="background-color: #e9ecef; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 14px;">${password}</code></p>
        <p style="margin: 0;"><strong>Role:</strong> Administrator</p>
      </div>

      <p>Please log in and change your password immediately.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl || 'https://portal.cottson.com'}" style="background-color: ${BRAND_COLOR}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          Access Admin Portal
        </a>
      </div>
      
      <p style="color: #666; font-size: 13px;">
        Note: If you have trouble logging in, please contact the superadmin.
      </p>
    `;
    return generateEmailTemplate(content, 'Welcome to Admin Portal');
  },

  /**
   * Generic Notification
   */
  notification: (userName, title, message, actionUrl, actionText) => {
    const content = `
      <h2 style="color: ${BRAND_COLOR}; margin-top: 0;">${title}</h2>
      <p>Hello ${userName},</p>
      ${message}

      ${actionUrl && actionText ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${actionUrl}" style="background-color: ${BRAND_COLOR}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          ${actionText}
        </a>
      </div>
      ` : ''}
    `;
    return generateEmailTemplate(content, title);
  },

  /**
   * Generate custom email with branded template
   */
  generateEmailTemplate
};

export default EmailTemplates;
