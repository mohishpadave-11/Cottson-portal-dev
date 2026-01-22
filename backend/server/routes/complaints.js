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
    res.json(complaint);
  } catch (error) {
    res.status(400).json({ message: error.message });
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
