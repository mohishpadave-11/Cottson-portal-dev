
import Order from "../models/Order.js";
import { deleteFile } from "../services/StorageService.js";

// Rename document
export const renameDocument = async (req, res) => {
    try {
        const { orderId, docId } = req.params;
        const { name } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Name is required"
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        const doc = order.documents.id(docId);
        if (!doc) {
            return res.status(404).json({
                success: false,
                message: "Document not found",
            });
        }

        // Validation: Cannot rename system docs
        if (doc.isSystem) {
            return res.status(403).json({
                success: false,
                message: "Cannot rename system default documents",
            });
        }

        doc.name = name;
        await order.save();

        res.status(200).json({
            success: true,
            message: "Document renamed successfully",
            data: doc,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error renaming document",
            error: error.message,
        });
    }
};

// Delete document
export const deleteDocument = async (req, res) => {
    try {
        const { orderId, docId } = req.params;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        const doc = order.documents.id(docId);
        if (!doc) {
            return res.status(404).json({
                success: false,
                message: "Document not found",
            });
        }

        // If it's a flexible doc (not system), we fully remove it
        if (!doc.isSystem) {
            // Delete file from R2 if url exists
            if (doc.url) {
                // Extract key or pass full URL if deleteFile handles it. 
                // Looking at orderController.js uses deleteFile(oldUrl).
                await deleteFile(doc.url);
            }

            // Remove subdocument
            doc.deleteOne();
        } else {
            // System doc: Reset slot
            // "Cannot be renamed or deleted (only replaced)."
            // Requirement says: "DELETE ... Check if isSystem === true, return 403"
            // WAIT. Requirement says: "Fixed Docs: Cannot be renamed or deleted (only replaced)."
            // BUT also "DELETE /:orderId/documents/:docId ... Validation: If isSystem === true, return 403 (Forbidden). You cannot delete system docs."

            // So User effectively CANNOT delete a system doc via this API.
            // Wait, "only replaced" implies an upload action replaces it.
            // So deleteDocument should indeed forbid system docs.

            return res.status(403).json({
                success: false,
                message: "Cannot delete system default documents. You can only replace them via upload.",
            });
        }

        await order.save();

        res.status(200).json({
            success: true,
            message: "Document deleted successfully",
            data: order.documents,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting document",
            error: error.message,
        });
    }
};
