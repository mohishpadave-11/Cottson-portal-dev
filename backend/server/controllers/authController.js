/**
 * Authentication Controller
 * Handles login, forgot password, reset password, and account creation
 */

import User from "../models/User.js";
import Client from "../models/Client.js";
import { generateToken, verifyToken } from "../middleware/auth.js";
import crypto from "crypto";
import { sendEmail } from "../config/mailer.js";
import {
  sendPasswordResetEmail,
  sendCredentialsEmail,
} from "../config/mailer.js";
import { createUser as createUserService } from "../services/userService.js";
import EmailService from "../services/EmailService.js";

/**
 * User Login
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Check if user exists and get password field
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Contact admin.",
      });
    }

    // Compare password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

/**
 * Forgot Password - Send reset token via email
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide an email address",
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Store hashed token and expiry in database
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    // Create reset URL (frontend will use this)
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"
      }/reset-password?token=${resetToken}&email=${email}`;

    try {
      const userName = user.name || (user.firstName + ' ' + user.lastName) || 'User';
      const emailSent = await EmailService.sendPasswordResetEmail(
        user.email,
        userName,
        resetUrl
      );

      if (!emailSent) {
        throw new Error("Failed to send email");
      }

      res.status(200).json({
        success: true,
        message: "Password reset link sent to your email",
      });
    } catch (emailError) {
      // Reset token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: "Email could not be sent. Please try again.",
        error: emailError.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Forgot password request failed",
      error: error.message,
    });
  }
};

/**
 * Reset Password
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword, confirmPassword } = req.body;

    // Validation
    if (!token || !email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Hash the token
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user and validate token
    const user = await User.findOne({
      email,
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message:
        "Password reset successful. Please login with your new password.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Password reset failed",
      error: error.message,
    });
  }
};

/**
 * Verify Reset Token
 * POST /api/auth/verify-reset-token
 */
export const verifyResetToken = async (req, res) => {
  try {
    const { token, email } = req.body;

    if (!token || !email) {
      return res.status(400).json({
        success: false,
        message: "Please provide token and email",
      });
    }

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      email,
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    res.status(200).json({
      success: true,
      message: "Token is valid",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Token verification failed",
      error: error.message,
    });
  }
};

/**
 * Change Password (for logged-in users)
 * POST /api/auth/change-password
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select("+password");

    // Verify current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Check if new password is same as current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as current password",
      });
    }

    // Update password
    user.password = newPassword;
    user.requiresPasswordChange = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Password change failed",
      error: error.message,
    });
  }
};

/**
 * Get Current User
 * GET /api/auth/me
 */
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error.message,
    });
  }
};

/**
 * ADMIN LOGIN
 * POST /api/auth/admin-login
 */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find admin and select password field
    const admin = await User.findOne({ email }).select("+password");
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if admin is active
    if (admin.status === "inactive" || admin.status === "suspended") {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated",
      });
    }

    // Compare password
    const isPasswordCorrect = await admin.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate token
    const token = generateToken(admin._id);

    // Return admin without password
    const adminResponse = admin.toObject();
    delete adminResponse.password;

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      admin: adminResponse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Admin login failed",
      error: error.message,
    });
  }
};

/**
 * CREATE USER (Admin/SuperAdmin only)
 * POST /api/auth/create-user
 */
export const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, role } = req.body;
    const adminId = req.admin?._id || req.user?._id;

    // Check authorization
    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Admin access required.",
      });
    }

    // Validation
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: "Please provide firstName, lastName, and email",
      });
    }

    // Use User Service
    const userResponse = await createUserService({
      firstName,
      lastName,
      email,
      role
    });

    res.status(201).json({
      success: true,
      message: "User created successfully. Credentials sent to email.",
      user: userResponse,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * CREATE ADMIN (SuperAdmin only)
 * POST /api/auth/create-admin
 */
export const createAdmin = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const superAdminId = req.user?._id;

    // Check if requester is SuperAdmin
    const admin = await User.findById(superAdminId);
    if (!admin || admin.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only SuperAdmin can create new admins",
      });
    }

    // Validation
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Please provide name and email",
      });
    }

    // Use User Service
    const adminResponse = await createUserService({
      name,
      email,
      role: role || 'admin',
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: "Admin created successfully. Credentials sent to email.",
      admin: adminResponse,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
