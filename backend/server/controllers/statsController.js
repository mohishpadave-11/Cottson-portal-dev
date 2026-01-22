/**
 * Stats Controller
 * Handles dashboard statistics
 */

import Order from "../models/Order.js";
import Company from "../models/Company.js";
import User from "../models/User.js";

// Get dashboard stats
export const getStats = async (req, res) => {
  try {
    const [
      totalCompanies,
      totalClients,
      totalOrders,
      pendingOrders,
      completedOrders,
    ] = await Promise.all([
      Company.countDocuments({ status: "active" }),
      User.countDocuments({ role: "client", status: "active" }),
      Order.countDocuments({}),
      Order.countDocuments({ paymentStatus: { $ne: "Payment Completed" } }),
      Order.countDocuments({ paymentStatus: "Payment Completed" }),
    ]);

    // Calculate total revenue
    const revenueData = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$priceWithGst" },
        },
      },
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    res.status(200).json({
      success: true,
      data: {
        totalCompanies,
        totalClients,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
};

// Get revenue by month
export const getRevenueByMonth = async (req, res) => {
  try {
    const revenueData = await Order.aggregate([
      {
        $group: {
          _id: {
            month: { $month: "$orderDate" },
            year: { $year: "$orderDate" },
          },
          revenue: { $sum: "$priceWithGst" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: revenueData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching revenue data",
      error: error.message,
    });
  }
};

// Get orders by status
export const getOrdersByStatus = async (req, res) => {
  try {
    const statusData = await Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: statusData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching status data",
      error: error.message,
    });
  }
};

// Get top performing companies
export const getTopCompanies = async (req, res) => {
  try {
    const topCompanies = await Order.aggregate([
      {
        $group: {
          _id: "$companyId",
          totalRevenue: { $sum: "$priceWithGst" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "companies",
          localField: "_id",
          foreignField: "_id",
          as: "company",
        },
      },
      { $unwind: "$company" },
      {
        $project: {
          _id: 0,
          companyName: "$company.companyName",
          totalRevenue: 1,
          orderCount: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: topCompanies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching top companies",
      error: error.message,
    });
  }
};
// Get active company stats (last 6 months vs previous 6 months)
export const getActiveCompanyStats = async (req, res) => {
  try {
    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    const twelveMonthsAgo = new Date(today);
    twelveMonthsAgo.setMonth(today.getMonth() - 12);

    // Get unique company IDs for current period (last 6 months)
    const currentPeriodCompanies = await Order.distinct("companyId", {
      orderDate: { $gte: sixMonthsAgo, $lte: today },
    });

    // Get unique company IDs for previous period (6-12 months ago)
    const previousPeriodCompanies = await Order.distinct("companyId", {
      orderDate: { $gte: twelveMonthsAgo, $lt: sixMonthsAgo },
    });

    const currentCount = currentPeriodCompanies.length;
    const previousCount = previousPeriodCompanies.length;

    let percentageChange = 0;
    if (previousCount > 0) {
      percentageChange = ((currentCount - previousCount) / previousCount) * 100;
    } else if (currentCount > 0) {
      percentageChange = 100; // 100% increase if previous was 0
    }

    res.status(200).json({
      success: true,
      data: {
        count: currentCount,
        change: Math.round(percentageChange),
        isPositive: percentageChange > 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching active company stats",
      error: error.message,
    });
  }
};

// Get newly created company stats (current month vs last month)
export const getNewCompanyStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    // Count companies created this month
    const currentMonthCount = await Company.countDocuments({
      createdAt: { $gte: startOfCurrentMonth },
    });

    // Count companies created last month
    const lastMonthCount = await Company.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lt: startOfCurrentMonth },
    });

    let percentageChange = 0;
    if (lastMonthCount > 0) {
      percentageChange = ((currentMonthCount - lastMonthCount) / lastMonthCount) * 100;
    } else if (currentMonthCount > 0) {
      percentageChange = 100; // 100% increase if previous was 0
    }

    res.status(200).json({
      success: true,
      data: {
        count: currentMonthCount,
        change: Math.round(percentageChange),
        isPositive: percentageChange > 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching new company stats",
      error: error.message,
    });
  }
};

// Get total company stats (current total vs total last month)
export const getTotalCompanyStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Current total companies
    const currentTotal = await Company.countDocuments({});

    // Total companies at the start of the month (effectively total at end of last month)
    const lastMonthTotal = await Company.countDocuments({
      createdAt: { $lt: startOfCurrentMonth },
    });

    let percentageChange = 0;
    if (lastMonthTotal > 0) {
      percentageChange = ((currentTotal - lastMonthTotal) / lastMonthTotal) * 100;
    } else if (currentTotal > 0) {
      percentageChange = 100; // 100% increase if previous was 0
    }

    res.status(200).json({
      success: true,
      data: {
        count: currentTotal,
        change: Math.round(percentageChange),
        isPositive: percentageChange > 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching total company stats",
      error: error.message,
    });
  }
};
