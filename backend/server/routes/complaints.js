import express from 'express';
import Complaint from '../models/Complaint.js';
import { protect as authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all complaints
/**
 * @swagger
 * /api/complaints:
 *   get:
 *     summary: Get all complaints
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of complaints
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Complaint'
 *       500:
 *         description: Server error
 */
router.get('/', authenticate, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'client') {
      filter.clientId = req.user._id.toString();
    }

    const complaints = await Complaint.find(filter)
      .populate('orderId')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get complaint by ID
/**
 * @swagger
 * /api/complaints/{id}:
 *   get:
 *     summary: Get complaint by ID
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Complaint ID
 *     responses:
 *       200:
 *         description: Complaint details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Complaint'
 *       404:
 *         description: Complaint not found
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate('orderId');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Security check for clients
    if (req.user.role === 'client' && complaint.clientId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access forbidden to this complaint' });
    }

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

import User from '../models/User.js';
import { sendEmail } from '../config/mailer.js';

// ... existing imports

// Create new complaint
/**
 * @swagger
 * /api/complaints:
 *   post:
 *     summary: Create new complaint
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Complaint'
 *     responses:
 *       201:
 *         description: Complaint created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Complaint'
 *       400:
 *         description: Error
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const complaintData = { ...req.body };

    // Security: override clientId if user is a client
    if (req.user.role === 'client') {
      complaintData.clientId = req.user._id.toString();
    }

    const complaint = new Complaint(complaintData);
    const savedComplaint = await complaint.save();

    // Notify SuperAdmin
    try {
      const superAdmin = await User.findOne({ role: 'superadmin' });
      if (superAdmin) {
        const adminUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/complaints`;
        await sendEmail(
          superAdmin.email,
          `New Complaint #${savedComplaint._id.toString().slice(-6).toUpperCase()}`,
          `
            <h2>New Complaint Received</h2>
            <p><strong>Subject:</strong> ${savedComplaint.subject}</p>
            <p><strong>Priority:</strong> ${savedComplaint.priority}</p>
            <p><strong>Client:</strong> ${savedComplaint.clientName}</p>
            <p><strong>Description:</strong><br/>${savedComplaint.description}</p>
            <p><a href="${adminUrl}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Complaint</a></p>
          `
        );
      }
    } catch (emailError) {
      console.error('Failed to notify superadmin:', emailError);
    }

    res.status(201).json(savedComplaint);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update complaint
/**
 * @swagger
 * /api/complaints/{id}:
 *   put:
 *     summary: Update complaint
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Complaint ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Complaint'
 *     responses:
 *       200:
 *         description: Complaint updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Complaint'
 *       404:
 *         description: Complaint not found
 */
router.put('/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Notify Client if resolved
    if (req.body.status === 'Resolved' && complaint.clientEmail) {
      try {
        await sendEmail(
          complaint.clientEmail,
          `Complaint Resolved: ${complaint.subject}`,
          `
            <h2>Your Complaint Has Been Resolved</h2>
            <p><strong>Complaint ID:</strong> #${complaint._id.toString().slice(-6).toUpperCase()}</p>
            <p><strong>Status:</strong> <span style="color: green;">Resolved</span></p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Response from Admin:</strong></p>
              <p>${complaint.adminResponse || 'No specific response provided.'}</p>
            </div>
            <p>If you have further issues, please reach out to us.</p>
          `
        );
      } catch (emailError) {
        console.error('Failed to notify client:', emailError);
      }
    }

    res.json(complaint);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark complaint as read
/**
 * @swagger
 * /api/complaints/{id}/mark-as-read:
 *   patch:
 *     summary: Mark complaint as read
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Complaint ID
 *     responses:
 *       200:
 *         description: Complaint marked as read
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Complaint'
 *       404:
 *         description: Complaint not found
 */
router.patch('/:id/mark-as-read', authenticate, async (req, res) => {
  try {
    const { role } = req.user;
    const updateField = role === 'client' ? { isReadByClient: true } : { isReadByAdmin: true };

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      updateField,
      { new: true }
    );

    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete complaint
/**
 * @swagger
 * /api/complaints/{id}:
 *   delete:
 *     summary: Delete complaint
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Complaint ID
 *     responses:
 *       200:
 *         description: Complaint deleted
 *       404:
 *         description: Complaint not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json({ message: 'Complaint deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
