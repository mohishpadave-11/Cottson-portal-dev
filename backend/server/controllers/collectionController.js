import Collection from '../models/Collection.js';
import Product from '../models/Product.js';

// Get all collections
export const getCollections = async (req, res) => {
    try {
        const { status, search } = req.query;
        let filter = {};

        if (status) filter.status = status;
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }

        const collections = await Collection.find(filter).sort({ createdAt: -1 });

        // Optional: Get product counts for each collection
        // This might be slow if there are many collections, consider doing it separately or optimising
        const collectionsWithCounts = await Promise.all(collections.map(async (collection) => {
            const productCount = await Product.countDocuments({ collectionId: collection._id });
            return { ...collection.toObject(), productCount };
        }));

        res.status(200).json({
            success: true,
            data: collectionsWithCounts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching collections',
            error: error.message
        });
    }
};

// Get single collection
export const getCollectionById = async (req, res) => {
    try {
        const collection = await Collection.findById(req.params.id);
        if (!collection) {
            return res.status(404).json({
                success: false,
                message: 'Collection not found'
            });
        }
        res.status(200).json({
            success: true,
            data: collection
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching collection',
            error: error.message
        });
    }
};

// Create collection
export const createCollection = async (req, res) => {
    try {
        const { name } = req.body;

        const existingCollection = await Collection.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existingCollection) {
            return res.status(400).json({
                success: false,
                message: 'Collection with this name already exists'
            });
        }

        const collection = new Collection(req.body);
        await collection.save();

        res.status(201).json({
            success: true,
            message: 'Collection created successfully',
            data: collection
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating collection',
            error: error.message
        });
    }
};

// Update collection
export const updateCollection = async (req, res) => {
    try {
        const collection = await Collection.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!collection) {
            return res.status(404).json({
                success: false,
                message: 'Collection not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Collection updated successfully',
            data: collection
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating collection',
            error: error.message
        });
    }
};

// Delete collection
export const deleteCollection = async (req, res) => {
    try {
        const collection = await Collection.findById(req.params.id);
        if (!collection) {
            return res.status(404).json({
                success: false,
                message: 'Collection not found'
            });
        }

        // Check if collection has products
        const productCount = await Product.countDocuments({ collectionId: req.params.id });
        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete collection. It contains ${productCount} products.`
            });
        }

        await Collection.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Collection deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting collection',
            error: error.message
        });
    }
};
