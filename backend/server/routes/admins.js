// import express from "express";
// import User from "../../models/User.js";

// const router = express.Router();

// // Get all admins
// router.get("/", async (req, res) => {
//   try {
//     const admins = await User.find({
//       role: { $in: ["admin", "superadmin"] },
//     })
//       .select("-password")
//       .sort({ createdAt: -1 });
//     res.json(admins);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// // Get single admin
// router.get("/:id", async (req, res) => {
//   try {
//     const admin = await User.findById(req.params.id).select("-password");
//     if (!admin) return res.status(404).json({ message: "Admin not found" });
//     res.json(admin);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// // Create new admin
// router.post("/", async (req, res) => {
//   try {
//     const { email } = req.body;

//     // Check if admin with email already exists
//     const existingAdmin = await User.findOne({ email });
//     if (existingAdmin) {
//       return res
//         .status(400)
//         .json({ message: "User with this email already exists" });
//     }

//     const admin = new User(req.body);
//     const savedAdmin = await admin.save();

//     // Return admin without password
//     const adminResponse = savedAdmin.toObject();
//     delete adminResponse.password;

//     res.status(201).json(adminResponse);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// // Update admin
// router.put("/:id", async (req, res) => {
//   try {
//     const updateData = { ...req.body };

//     // If password is being updated, it will be hashed by the pre-save hook
//     // If password is empty, remove it from update
//     if (updateData.password === "") {
//       delete updateData.password;
//     }

//     const admin = await User.findByIdAndUpdate(req.params.id, updateData, {
//       new: true,
//       runValidators: true,
//     }).select("-password");

//     if (!admin) return res.status(404).json({ message: "Admin not found" });
//     res.json(admin);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// // Delete admin
// router.delete("/:id", async (req, res) => {
//   try {
//     const admin = await User.findByIdAndDelete(req.params.id);
//     if (!admin) return res.status(404).json({ message: "Admin not found" });
//     res.json({ message: "Admin deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// // Toggle admin status
// router.patch("/:id/status", async (req, res) => {
//   try {
//     const admin = await User.findById(req.params.id);
//     if (!admin) return res.status(404).json({ message: "Admin not found" });

//     admin.status = admin.status === "active" ? "inactive" : "active";
//     await admin.save();

//     const adminResponse = admin.toObject();
//     delete adminResponse.password;

//     res.json(adminResponse);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// export default router;

/**
 * Admins Routes
 * Routes for managing admin and superadmin users
 * Protected: SuperAdmin only
 */

import express from "express";
import User from "../models/User.js";
import { protect as authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication and superadmin role
router.use(authenticate);
router.use(authorize("superadmin"));

// Get all admins
router.get("/", async (req, res) => {
  try {
    const admins = await User.find({
      role: { $in: ["admin", "superadmin"] },
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch admins",
      error: error.message,
    });
  }
});

// Get single admin
router.get("/:id", async (req, res) => {
  try {
    const admin = await User.findOne({
      _id: req.params.id,
      role: { $in: ["admin", "superadmin"] },
    }).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin",
      error: error.message,
    });
  }
});

// Create new admin (SuperAdmin only)
router.post("/", async (req, res) => {
  try {
    const { email, role } = req.body;

    // Validate role
    if (!["admin", "superadmin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be 'admin' or 'superadmin'",
      });
    }

    // Check if admin with email already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const admin = new User({
      ...req.body,
      status: "active",
    });

    const savedAdmin = await admin.save();

    // Return admin without password
    const adminResponse = savedAdmin.toObject();
    delete adminResponse.password;

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: adminResponse,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to create admin",
      error: error.message,
    });
  }
});

// Update admin
router.put("/:id", async (req, res) => {
  try {
    const updateData = { ...req.body };

    // If password is empty, remove it from update
    if (updateData.password === "") {
      delete updateData.password;
    }

    const admin = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        role: { $in: ["admin", "superadmin"] },
      },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data: admin,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update admin",
      error: error.message,
    });
  }
});

// Delete admin
router.delete("/:id", async (req, res) => {
  try {
    const admin = await User.findOneAndDelete({
      _id: req.params.id,
      role: { $in: ["admin", "superadmin"] },
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete admin",
      error: error.message,
    });
  }
});

// Toggle admin status
router.patch("/:id/status", async (req, res) => {
  try {
    const admin = await User.findOne({
      _id: req.params.id,
      role: { $in: ["admin", "superadmin"] },
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    admin.status = admin.status === "active" ? "inactive" : "active";
    await admin.save();

    const adminResponse = admin.toObject();
    delete adminResponse.password;

    res.status(200).json({
      success: true,
      message: "Admin status updated successfully",
      data: adminResponse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update admin status",
      error: error.message,
    });
  }
});

export default router;
