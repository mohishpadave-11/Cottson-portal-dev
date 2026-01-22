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

// Delete client
router.delete('/:id', async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
