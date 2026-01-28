import Order from "../models/Order.js";
import Client from "../models/Client.js";
import Company from "../models/Company.js";
import Product from "../models/Product.js";

/**
 * Global Search
 * GET /api/search?q=query
 */
export const globalSearch = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ success: false, message: "Query is required" });
        }

        const regex = new RegExp(q, "i");
        const user = req.user;
        const results = {
            orders: [],
            clients: [],
            companies: [],
            products: []
        };

        // 1. Search Orders (Accessible to all, but filtered)
        const orderFilter = {
            $or: [
                { orderNumber: regex },
                // { 'client.name': regex } // requires aggregate/populate lookup, skip for simple regex or use separate client search
            ]
        };

        if (user.role === 'client') {
            orderFilter.companyId = user.companyId;
        }

        results.orders = await Order.find(orderFilter)
            .populate('clientId', 'name email')
            .populate('companyId', 'companyName')
            .limit(5);

        // 2. Search Clients (Admin/Superadmin only)
        if (['admin', 'superadmin'].includes(user.role)) {
            results.clients = await Client.find({
                $or: [
                    { name: regex },
                    { email: regex },
                    { phoneNumber: regex }
                ]
            }).limit(5);
        }

        // 3. Search Companies (Admin/Superadmin only)
        if (['admin', 'superadmin'].includes(user.role)) {
            results.companies = await Company.find({
                $or: [
                    { companyName: regex },
                    { tradeName: regex }
                ]
            }).limit(5);
        }

        // 4. Search Products (Admin/Superadmin only)
        if (['admin', 'superadmin'].includes(user.role)) {
            results.products = await Product.find({
                $or: [
                    { name: regex },
                    { styleId: regex }
                ]
            }).limit(5);
        }

        res.status(200).json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({
            success: false,
            message: "Search failed",
            error: error.message
        });
    }
};
