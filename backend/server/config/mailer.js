import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

/**
 * Email Service Configuration
 * Using SendGrid for sending emails
 */

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn("SENDGRID_API_KEY is not set in environment variables.");
}

const SENDER = {
  email: process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_EMAIL,
  name: 'Cottson Clothing Support'
};

/**
 * Send Password Reset Email
 * @param {string} email - User email address
 * @param {string} resetToken - Password reset token
 * @param {string} frontendUrl - Frontend base URL for reset link
 */
export const sendPasswordResetEmail = async (
  email,
  resetToken,
  frontendUrl = "http://localhost:5173"
) => {
  try {
    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

    const msg = {
      to: email,
      from: SENDER,
      subject: "Password Reset Request - Admin Portal",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Password Reset Request</h2>
          <p>You requested a password reset for your Admin Portal account.</p>
          <p>Click the link below to reset your password. This link will expire in 1 hour.</p>
          <p>
            <a href="${resetLink}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p>Or copy this link: <code>${resetLink}</code></p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr />
          <p style="color: #7f8c8d; font-size: 12px;">Admin Portal © 2026</p>
        </div>
      `,
    };

    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    if (error.response) {
      console.error(error.response.body);
    }
    throw new Error("Failed to send password reset email");
  }
};

/**
 * Send User Credentials Email
 * @param {string} email - User email address
 * @param {string} username - Username
 * @param {string} password - Temporary password
 * @param {string} role - User role
 */
export const sendCredentialsEmail = async (email, username, password, role) => {
  try {
    const msg = {
      to: email,
      from: SENDER,
      subject: "Your Admin Portal Account Created",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Welcome to Admin Portal</h2>
          <p>Your account has been created by an administrator.</p>
          <div style="background-color: #ecf0f1; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> <code>${password}</code></p>
            <p><strong>Role:</strong> ${role}</p>
          </div>
          <p><strong>Important:</strong> Please change your password on first login.</p>
          <p>
            <a href="http://localhost:5173/login" style="background-color: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Login to Your Account
            </a>
          </p>
          <hr />
          <p style="color: #7f8c8d; font-size: 12px;">Admin Portal © 2026</p>
        </div>
      `,
    };

    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error("Error sending credentials email:", error);
    if (error.response) {
      console.error(error.response.body);
    }
    throw new Error("Failed to send credentials email");
  }
};

/**
 * Send Company Created Email
 * @param {string} email - User email address
 * @param {string} companyName - Company name
 * @param {string} companyId - Company ID
 */
export const sendCompanyCreatedEmail = async (
  email,
  companyName,
  companyId
) => {
  try {
    const msg = {
      to: email,
      from: SENDER,
      subject: "Company Created - Admin Portal",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Company Successfully Created</h2>
          <p>Your company has been registered in the Admin Portal.</p>
          <div style="background-color: #ecf0f1; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Company Name:</strong> ${companyName}</p>
            <p><strong>Company ID:</strong> ${companyId}</p>
          </div>
          <p>You can now log in and start using the portal.</p>
          <p>
            <a href="http://localhost:5173/login" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Go to Portal
            </a>
          </p>
          <hr />
          <p style="color: #7f8c8d; font-size: 12px;">Admin Portal © 2026</p>
        </div>
      `,
    };

    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error("Error sending company created email:", error);
    if (error.response) {
      console.error(error.response.body);
    }
    throw new Error("Failed to send company created email");
  }
};

/**
 * Generic Send Email Function
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 */
export const sendEmail = async (to, subject, html) => {
  try {
    const msg = {
      to,
      from: SENDER,
      subject,
      html
    };

    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    if (error.response) {
      console.error(error.response.body);
    }
    return false;
  }
};

// Default export for compatibility if something imports transporter indiscriminately
export default sgMail;
