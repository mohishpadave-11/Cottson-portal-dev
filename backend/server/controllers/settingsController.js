import Settings from '../models/Settings.js';

// Get Custom Charge Types
export const getCustomCharges = async (req, res) => {
    try {
        let setting = await Settings.findOne({ key: 'customChargeTypes' });

        // Default charges if not found
        if (!setting) {
            const defaultCharges = ['Shipping', 'Packaging', 'Rush Fee', 'Design Fee'];
            setting = await Settings.create({
                key: 'customChargeTypes',
                value: defaultCharges
            });
        }

        res.status(200).json({
            success: true,
            data: setting.value
        });
    } catch (error) {
        console.error('Error fetching custom charges:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch custom charges',
            error: error.message
        });
    }
};

// Update Custom Charge Types
export const updateCustomCharges = async (req, res) => {
    try {
        const { charges } = req.body;

        if (!Array.isArray(charges)) {
            return res.status(400).json({
                success: false,
                message: 'Charges must be an array of strings'
            });
        }

        const setting = await Settings.findOneAndUpdate(
            { key: 'customChargeTypes' },
            { value: charges },
            { new: true, upsert: true } // Create if doesn't exist
        );

        res.status(200).json({
            success: true,
            message: 'Custom charges updated successfully',
            data: setting.value
        });
    } catch (error) {
        console.error('Error updating custom charges:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update custom charges',
            error: error.message
        });
    }
};
