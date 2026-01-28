import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Client from '../models/Client.js';
import { sendEmail } from '../config/mailer.js';
import EmailService from './EmailService.js';
import { EmailTemplates } from '../templates/emailTemplate.js';

class AuthService {
  // Generate JWT Token
  generateToken(userId, role) {
    return jwt.sign(
      { id: userId, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
  }

  // Generate random password
  generateRandomPassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  // Register/Create User (by SuperAdmin or Admin)
  async createUser(userData, createdBy) {
    try {
      const { email, role, companyId, name, phoneNumber } = userData;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Generate password
      let tempPassword;
      const cleanRole = role?.toLowerCase() || 'client';

      if (cleanRole === 'admin') {
        // Format: First 2 letters of FirstName + Last 2 letters of LastName + @cottson
        const cleanName = name || '';
        const nameParts = cleanName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : firstName;

        const firstPart = firstName.length >= 2 ? firstName.substring(0, 2) : firstName.padEnd(2, 'x');
        const lastPart = lastName.length >= 2 ? lastName.slice(-2) : lastName.padEnd(2, 'x');
        tempPassword = `${firstPart}${lastPart}@cottson`.toLowerCase();
      } else {
        tempPassword = this.generateRandomPassword();
      }

      // Create user with temporary password
      const user = await User.create({
        email,
        password: tempPassword,
        role,
        companyId: companyId || null,
        name,
        phoneNumber,
        status: 'active',
        isActive: true,
        requiresPasswordChange: true // Force password change on first login
      });

      // Send credentials email
      await this.sendCredentialsEmail(email, tempPassword, role, name);

      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.name
        },
        tempPassword // Return for SuperAdmin to share
      };
    } catch (error) {
      throw error;
    }
  }

  // Create Client User (Active User + Client Profile)
  async createClientUser(clientData, adminId) {
    try {
      const { email, name, phoneNumber, companyId } = clientData;

      // 1. Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // 2. Create User account (Active, with Role Client)
      // Format: First 2 letters of First Part + Last 2 letters of Last Part + @cottson
      const cleanName = name || '';
      const nameParts = cleanName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : firstName;

      const firstPart = firstName.length >= 2 ? firstName.substring(0, 2) : firstName.padEnd(2, 'x');
      const lastPart = lastName.length >= 2 ? lastName.slice(-2) : lastName.padEnd(2, 'x');
      const tempPassword = `${firstPart}${lastPart}@cottson`.toLowerCase(); // Ensure lowercase to match user expectation or keep consistent

      const user = await User.create({
        email,
        password: tempPassword,
        role: 'client',
        companyId: companyId || null,
        name: name, // This maps to 'name' in User schema (for admin/manager), but we populate it for Clients too for consistency
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || '',
        phoneNumber,
        isActive: true,
        status: 'active',
        requiresPasswordChange: true // Force password change on first login
      });

      // 3. Create Client Profile (Linked to User)
      // Check if client profile exists by email (unlikely if unique constraint, but good safety)
      const existingClient = await Client.findOne({ email });
      if (!existingClient) {
        await Client.create({
          name,
          email,
          phoneNumber,
          companyId,
          userId: user._id,
          status: 'active'
        });
      }

      // 4. Send Credentials
      await this.sendCredentialsEmail(email, tempPassword, 'client', name);

      return {
        success: true,
        message: 'Client user created successfully',
        client: {
          id: user._id,
          email: user.email,
          name: user.name,
          companyId: user.companyId
        }
      };

    } catch (error) {
      throw error;
    }
  }

  // Login
  async login(email, password) {
    try {
      // Find user with password field
      const user = await User.findOne({ email }).select('+password').populate('companyId');

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check if user is active (skip for superadmin)
      if (user.role !== 'superadmin' && (!user.isActive || user.status !== 'active')) {
        throw new Error('Account is inactive. Please contact administrator.');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = this.generateToken(user._id, user.role);

      return {
        success: true,
        token,
        requiresPasswordChange: user.requiresPasswordChange || false, // Flag for first-time login
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.fullName || `${user.firstName} ${user.lastName || ''}`.trim(),
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          companyId: user.companyId,
          companyName: user.companyId?.companyName
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Forgot Password - Generate reset token (Email Link Flow)
  async forgotPassword(email) {
    try {
      const user = await User.findOne({ email });

      // Generic response to prevent email enumeration attacks
      const genericResponse = {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      };

      if (!user) {
        // Return success even if user not found (prevent email scraping)
        return genericResponse;
      }

      // Generate secure random reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      // Save hashed token and expiry (10 minutes)
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
      await user.save();

      // Create reset URL with the unhashed token
      const resetUrl = `${process.env.FRONTEND_URL || 'https://portal.cottson.com'}/reset-password/${resetToken}`;

      // Send email using branded template
      await EmailService.sendPasswordResetEmail(user.email, user.name || user.firstName, resetUrl);

      return genericResponse;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw new Error('Unable to process password reset request. Please try again.');
    }
  }

  // Reset Password using token from email (Forgot Password Flow)
  async resetPassword(resetToken, newPassword) {
    try {
      // Hash the token from URL to match database
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      // Find user with valid token and not expired
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() }
      });

      if (!user) {
        throw new Error('Invalid or expired reset token. Please request a new password reset link.');
      }

      // Set new password (will be hashed by pre-save hook)
      user.password = newPassword;

      // Clear reset token fields
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      // User picked a valid password, so no need to force change
      user.requiresPasswordChange = false;

      await user.save();

      return {
        success: true,
        message: 'Password reset successful. You can now log in with your new password.'
      };
    } catch (error) {
      throw error;
    }
  }

  // Reset Password by SuperAdmin
  async resetPasswordByAdmin(userId) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      // Generate new password
      const newPassword = this.generateRandomPassword();

      // Update password
      user.password = newPassword;
      await user.save();

      // Send new credentials
      await this.sendCredentialsEmail(user.email, newPassword, user.role, user.name);

      return {
        success: true,
        message: 'Password reset successful',
        tempPassword: newPassword
      };
    } catch (error) {
      throw error;
    }
  }

  // Send credentials email with branded template
  async sendCredentialsEmail(email, password, role, name) {
    const BRAND_COLOR = '#113858';

    // Determine login URL based on role
    let loginUrl = 'https://portal.cottson.com';
    if (role === 'client') {
      loginUrl = 'https://portal.cottson.com/client/login';
    } else if (role === 'admin') {
      loginUrl = 'https://portal.cottson.com/admin/login';
    } else if (role === 'superadmin') {
      loginUrl = 'https://portal.cottson.com/superadmin/login';
    }

    const subject = `Welcome to Cottson Clothing - Your Account Credentials`;

    // Create content with credentials
    const content = `
      <h2 style="color: ${BRAND_COLOR}; margin-top: 0;">Welcome to Cottson Clothing</h2>
      <p>Hello ${name || 'User'},</p>
      <p>Your account has been successfully created. We're excited to have you on board!</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid ${BRAND_COLOR};">
        <p style="margin: 0 0 15px; font-size: 15px;"><strong>Your Login Credentials:</strong></p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 5px 0;"><strong>Password:</strong> <code style="background-color: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${password}</code></p>
        <p style="margin: 5px 0;"><strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
      </div>

      <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; border-radius: 4px; margin: 25px 0;">
        <p style="margin: 0; color: #856404; font-size: 14px;">
          <strong>⚠️ Important:</strong> For security reasons, please change your password immediately after your first login.
        </p>
      </div>

      <p>You can now access the portal to:</p>
      
      <ul style="color: #666; line-height: 2;">
        ${role === 'client' ? `
          <li>Track your orders in real-time</li>
          <li>View and download documents</li>
          <li>Monitor manufacturing timeline</li>
          <li>Submit queries and complaints</li>
        ` : `
          <li>Manage orders and clients</li>
          <li>Upload documents and track progress</li>
          <li>View analytics and reports</li>
          <li>Handle customer queries</li>
        `}
      </ul>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" style="background-color: ${BRAND_COLOR}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          Access Portal
        </a>
      </div>

      <p style="color: #666; font-size: 13px; margin-top: 30px;">
        If you have any questions or need assistance, feel free to contact us.
      </p>
    `;

    const html = EmailTemplates.generateEmailTemplate(content, 'Welcome to Cottson Clothing');
    await sendEmail(email, subject, html);
  }

  // Send password reset email using branded template
  async sendPasswordResetEmail(email, resetUrl, name) {
    await EmailService.sendPasswordResetEmail(email, name, resetUrl);
  }

  // Verify token
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}

export default new AuthService();
