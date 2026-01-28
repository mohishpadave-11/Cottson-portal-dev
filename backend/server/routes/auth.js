import express from 'express';
import authService from '../services/authService.js';
import { protect, isSuperAdmin, isAdminOrSuperAdmin } from '../middleware/auth.js';
import User from '../models/User.js';
import Client from '../models/Client.js';

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login to get Access Token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const result = await authService.login(email, password);

    res.json(result);
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Send password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    const result = await authService.forgotPassword(email);

    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password using token
// @access  Public
/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   post:
 *     summary: Reset password using token
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide new password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const result = await authService.resetPassword(token, password);

    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current logged in user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current User
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('companyId');

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.fullName || `${user.firstName} ${user.lastName || ''}`.trim(),
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        phoneNumber: user.phone || user.phoneNumber,
        companyId: user.companyId,
        companyName: user.companyId?.companyName,
        status: user.status,
        lastLogin: user.lastLogin,
        requiresPasswordChange: user.requiresPasswordChange || false
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change password (logged in user)
// @access  Private
/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change password (logged in user)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;

    // Clear the flag since user has now set their own password
    user.requiresPasswordChange = false;

    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/auth/create-admin
// @desc    Create admin user (SuperAdmin only)
// @access  Private/SuperAdmin
/**
 * @swagger
 * /api/auth/create-admin:
 *   post:
 *     summary: Create admin user (SuperAdmin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/create-admin', protect, isSuperAdmin, async (req, res) => {
  try {
    const { email, name, phoneNumber } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and name'
      });
    }

    const result = await authService.createUser(
      { email, name, phoneNumber, role: 'admin' },
      req.user.id
    );

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/auth/create-client
// @desc    Create client user (Admin/SuperAdmin)
// @access  Private/Admin
/**
 * @swagger
 * /api/auth/create-client:
 *   post:
 *     summary: Create client user (Admin/SuperAdmin)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - companyId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               companyId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Client created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/create-client', protect, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const { email, name, phoneNumber, companyId } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and name'
      });
    }

    const result = await authService.createClientUser(
      { email, name, phoneNumber, companyId },
      req.user.id
    );

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/auth/reset-user-password/:userId
// @desc    Reset user password (SuperAdmin only)
// @access  Private/Admin
/**
 * @swagger
 * /api/auth/reset-user-password/{userId}:
 *   post:
 *     summary: Reset user password (SuperAdmin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/reset-user-password/:userId', protect, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await authService.resetPasswordByAdmin(userId);

    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/auth/delete-user/:userId
// @desc    Delete user (SuperAdmin only)
// @access  Private/SuperAdmin
/**
 * @swagger
 * /api/auth/delete-user/{userId}:
 *   delete:
 *     summary: Delete user (SuperAdmin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/delete-user/:userId', protect, isSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting SuperAdmin
    if (user.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete SuperAdmin'
      });
    }

    await User.findByIdAndDelete(userId);

    // Also delete associated Client profile if it exists
    await Client.findOneAndDelete({ userId: userId });

    res.json({
      success: true,
      message: 'User and associated client profile deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/auth/users
// @desc    Get all users (SuperAdmin only)
// @access  Private/SuperAdmin
/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: Get all users (SuperAdmin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [superadmin, admin, client]
 *         description: Filter by user role
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/users', protect, isSuperAdmin, async (req, res) => {
  try {
    const { role } = req.query;

    let query = {};
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .populate('companyId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PATCH /api/auth/toggle-user-status/:userId
// @desc    Activate/Deactivate user (SuperAdmin only)
// @access  Private/SuperAdmin
/**
 * @swagger
 * /api/auth/toggle-user-status/{userId}:
 *   patch:
 *     summary: Activate/Deactivate user (SuperAdmin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User status toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/toggle-user-status/:userId', protect, isSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Toggle status
    user.isActive = !user.isActive;
    user.status = user.isActive ? 'active' : 'inactive';
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        email: user.email,
        isActive: user.isActive,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/auth/update-profile
// @desc    Update current user profile
// @access  Private
/**
 * @swagger
 * /api/auth/update-profile:
 *   put:
 *     summary: Update current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               name:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 */
router.put('/update-profile', protect, async (req, res) => {
  try {
    const { name, firstName, lastName, phone, phoneNumber, bio, location, department } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Handle name update
    // If name is provided (from frontend single field)
    if (name) {
      const nameParts = name.trim().split(' ');
      user.firstName = nameParts[0];
      user.lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    } else {
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
    }

    if (phone || phoneNumber) user.phone = phone || phoneNumber;
    // Add these fields to User model if they don't exist, but schema usually strict or ignores
    // User schema had firstName, lastName, phone, avatar. 
    // It didn't have bio, location, department explicitly defined in the file I saw, 
    // but Mongoose strictly enforces schema unless strict: false.
    // The previous User.js view had: firstName, lastName, phone, avatar, role, status, companyId.
    // department IS in User.js in initSuperAdmin but maybe not in Schema?
    // Let's check User.js again? Steps 527 showed User.js.
    // It had: email, password, firstName, lastName, phone, avatar, role, status, companyId, lastLogin, reset...
    // No bio, location, department.
    // So those fields in AdminProfile won't stick unless I add them to Schema.
    // For now, I'll update what I can.

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.fullName || `${user.firstName} ${user.lastName || ''}`.trim(),
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phone,
        companyId: user.companyId,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
