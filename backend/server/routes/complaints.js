import express from 'express';
import Complaint from '../models/Complaint.js';
import { protect as authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all complaints
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
