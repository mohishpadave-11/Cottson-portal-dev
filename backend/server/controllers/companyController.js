/**
 * Company Controller
 * Handles all company-related CRUD operations
 */

import Company from "../models/Company.js";
import { sendCompanyCreatedEmail } from "../config/mailer.js";

// Get all companies
export const getCompanies = async (req, res) => {
  try {
    const { status, search } = req.query;

    let filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: "i" } },
        { tradeName: { $regex: search, $options: "i" } },
        { gstNumber: { $regex: search, $options: "i" } },
      ];
    }

    // Aggregation to count orders for each company
    const companies = await Company.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "companyId",
          as: "orders"
        }
      },
      {
        $addFields: {
          totalOrders: { $size: "$orders" }
        }
      },
      {
        $project: {
          orders: 0 // Do not send back the full orders array
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.status(200).json({
      success: true,
      count: companies.length,
      data: companies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching companies",
      error: error.message,
    });
  }
};

// Get single company
export const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching company",
      error: error.message,
    });
  }
};

// Create company
export const createCompany = async (req, res) => {
  try {
    const {
      companyName,
      tradeName,
      gstNumber,
      billingAddress,
      companyId,
      contactEmail,
      contactPhone,
    } = req.body;

    // Validate required fields
    if (!companyName || !tradeName || !gstNumber || !billingAddress || !companyId) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Check if company already exists
    const existingCompany = await Company.findOne({ gstNumber });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: "Company with this GST number already exists",
      });
    }

    // Check if company ID already exists
    const existingCompanyId = await Company.findOne({ companyId });
    if (existingCompanyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID already exists",
      });
    }

    const company = new Company(req.body);
    await company.save();

    // Send welcome email if contact email is provided
    if (contactEmail) {
      // Don't await email sending to prevent blocking the response
      sendCompanyCreatedEmail(contactEmail, companyName, companyId).catch(err =>
        console.error('Failed to send company creation email:', err)
      );
    }

    res.status(201).json({
      success: true,
      message: "Company created successfully",
      data: company,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating company",
      error: error.message,
    });
  }
};

// Update company
export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Company updated successfully",
      data: company,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating company",
      error: error.message,
    });
  }
};

// Delete company
export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findByIdAndDelete(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Company deleted successfully",
      data: company,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting company",
      error: error.message,
    });
  }
};
