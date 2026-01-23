import express from 'express';
import Client from '../models/Client.js';
import User from '../models/User.js';

const router = express.Router();

// Get all clients
router.get('/', async (req, res) => {
  try {
    const clients = await Client.find()
      .populate('companyId')
      .sort({ createdAt: -1 });

    const clientsWithDetails = clients.map(client => ({
      ...client.toObject(),
      companyName: client.companyId?.companyName || 'N/A'
    }));

    res.json(clientsWithDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get client by ID
router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).populate('companyId');

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const clientWithDetails = {
      ...client.toObject(),
      companyName: client.companyId?.companyName || 'N/A'
    };

    res.json(clientWithDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new client
router.post('/', async (req, res) => {
  try {
    const client = new Client(req.body);
    const savedClient = await client.save();
    const populatedClient = await Client.findById(savedClient._id).populate('companyId');
    res.status(201).json(populatedClient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update client
router.put('/:id', async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('companyId');

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(client);

    // Sync email update to User model if linked
    if (req.body.email && client.userId) {
      try {
        await User.findByIdAndUpdate(client.userId, { email: req.body.email });
        console.log(`Synced email update to User model for client: ${client._id}`);
      } catch (err) {
        console.error('Error syncing email to User model:', err);
      }
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete client (and associated user account)
router.delete('/:id', async (req, res) => {
  try {
    // First, find the client to get the userId
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Delete the client profile
    await Client.findByIdAndDelete(req.params.id);

    // Also delete the associated user account if it exists
    if (client.userId) {
      try {
        await User.findByIdAndDelete(client.userId);
        console.log(`Deleted associated user account: ${client.userId}`);
      } catch (userError) {
        console.error('Error deleting associated user:', userError);
        // Continue even if user deletion fails (user might not exist)
      }
    } else if (client.email) {
      // Fallback: Try to find and delete user by email if userId not set
      try {
        await User.findOneAndDelete({ email: client.email });
        console.log(`Deleted user by email: ${client.email}`);
      } catch (emailError) {
        console.error('Error deleting user by email:', emailError);
      }
    }

    res.json({
      message: 'Client and associated user account deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
