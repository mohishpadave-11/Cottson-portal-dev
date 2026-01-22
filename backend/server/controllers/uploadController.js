import StorageService from "../services/StorageService.js";
import Order from "../models/Order.js";

const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel" // .xls
];

export const getPresignedUrl = async (req, res) => {
    try {
        const { fileName, fileType, docType } = req.body;

        // Validate inputs
        if (!fileName || !fileType || !docType) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: fileName, fileType, docType"
            });
        }

        // Strict MIME type validation
        if (!ALLOWED_MIME_TYPES.includes(fileType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid file type. Only PDF, JPEG, PNG, and Excel files are allowed."
            });
        }

        // Generate presigned URL
        // Use 'orders' folder as per requirements
        const folder = "orders";

        const { uploadUrl, key, publicUrl } = await StorageService.generatePresignedUrl(fileName, fileType, folder);

        res.status(200).json({
            success: true,
            uploadUrl, // Frontend uses this to PUT the file
            key,       // Frontend sends this back to update DB
            publicUrl, // Optional, can be used for immediate preview if needed
            fileName
        });

    } catch (error) {
        console.error("Presigned URL generation error:", error);
        res.status(500).json({
            success: false,
            message: "Error generating upload URL"
        });
    }
};

export const getOrderPresignedUrl = async (req, res) => {
    try {
        const { id } = req.params;
        const { fileName, fileType, docType } = req.body;

        // Validate inputs
        if (!fileName || !fileType || !docType) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: fileName, fileType, docType"
            });
        }

        // Strict MIME type validation
        if (!ALLOWED_MIME_TYPES.includes(fileType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid file type. Only PDF, JPEG, PNG, and Excel files are allowed."
            });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Sanitize order number
        const orderNumber = order.orderNumber ? order.orderNumber.replace(/[^a-zA-Z0-9-_]/g, '') : 'unknown';

        // Folder path: orders/{orderNumber}
        const folder = `orders/${orderNumber}`;

        const { uploadUrl, key, publicUrl } = await StorageService.generatePresignedUrl(fileName, fileType, folder);

        res.status(200).json({
            success: true,
            uploadUrl,
            key,
            publicUrl,
            fileName
        });

    } catch (error) {
        console.error("Order Presigned URL generation error:", error);
        res.status(500).json({
            success: false,
            message: "Error generating upload URL"
        });
    }
};
