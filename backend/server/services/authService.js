import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Client from '../models/Client.js';
import { sendEmail } from '../config/mailer.js';

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

        const firstPart = firstName.substring(0, 2);
        const lastPart = lastName.slice(-2);
        tempPassword = `${firstPart}${lastPart}@cottson`;
      } else {
        tempPassword = this.generateRandomPassword();
      }

      // Create user
      const user = await User.create({
        email,
        password: tempPassword,
        role,
        companyId: companyId || null,
        name,
        phoneNumber,
        status: 'active',
        isActive: true
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
      const tempPassword = this.generateRandomPassword();

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
        status: 'active'
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
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.name,
          companyId: user.companyId,
          companyName: user.companyId?.companyName
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Forgot Password - Generate reset token
  async forgotPassword(email) {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        throw new Error('No user found with this email');
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      // Save hashed token and expiry
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
      await user.save();

      // Create reset URL
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

      // Send email
      await this.sendPasswordResetEmail(user.email, resetUrl, user.name);

      return {
        success: true,
        message: 'Password reset link sent to email'
      };
    } catch (error) {
      throw error;
    }
  }

  // Reset Password
  async resetPassword(resetToken, newPassword) {
    try {
      // Hash the token from URL
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      // Find user with valid token
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() }
      });

      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      // Set new password
      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return {
        success: true,
        message: 'Password reset successful'
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

  // Send credentials email
  async sendCredentialsEmail(email, password, role, name) {
    const loginUrl = `${process.env.FRONTEND_URL}/login`;

    const subject = 'Your Account Credentials - CRM Portal';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to CRM Portal</h2>
        <p>Hello ${name || 'User'},</p>
        <p>Your account has been created successfully. Here are your login credentials:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
          <p style="margin: 5px 0;"><strong>Role:</strong> ${role}</p>
        </div>
        
        <p><strong>Important:</strong> Please change your password after first login for security.</p>
        
        <a href="${loginUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Login Now
        </a>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          If you didn't request this account, please contact the administrator.
        </p>
      </div>
    `;

    await sendEmail(email, subject, html);
  }

  // Send password reset email
  async sendPasswordResetEmail(email, resetUrl, name) {
    const subject = 'Password Reset Request - CRM Portal';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>Hello ${name || 'User'},</p>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        
        <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Reset Password
        </a>
        
        <p style="color: #6b7280; font-size: 14px;">
          This link will expire in 30 minutes.
        </p>
        
        <p style="color: #6b7280; font-size: 14px;">
          If you didn't request this, please ignore this email.
        </p>
        
        <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
          Or copy and paste this URL into your browser:<br/>
          ${resetUrl}
        </p>
      </div>
    `;

    await sendEmail(email, subject, html);
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
