// /**
//  * Admin Controller
//  * Admin-only operations like creating users, managing roles, etc.
//  */

// import User from "../models/User.js";
// import sendEmail from "../utils/sendEmail.js";
// import crypto from "crypto";

// /**
//  * Create User Account (Admin only)
//  * POST /api/admin/users
//  * Admin creates an account for a client and sends credentials
//  */
// export const createUserAccount = async (req, res) => {
//   try {
//     const { firstName, lastName, email, role = "client" } = req.body;

//     // Validation
//     if (!firstName || !lastName || !email) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide firstName, lastName, and email",
//       });
//     }

//     // Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: "User with this email already exists",
//       });
//     }

//     // Generate temporary password
//     const tempPassword = crypto.randomBytes(6).toString("hex").toUpperCase();

//     // Create user
//     const user = new User({
//       firstName,
//       lastName,
//       email,
//       password: tempPassword,
//       role,
//     });

//     await user.save();

//     // Send credentials email
//     const message = `
//       <h2>Your Account Created Successfully</h2>
//       <p>Hello ${firstName} ${lastName},</p>
//       <p>An admin has created your account. Here are your login credentials:</p>
//       <p style="background-color: #f0f0f0; padding: 15px; border-radius: 4px; font-family: monospace;">
//         <strong>Email:</strong> ${email}<br/>
//         <strong>Temporary Password:</strong> ${tempPassword}
//       </p>
//       <p><strong>Important:</strong> Please change your password immediately after first login.</p>
//       <p><a href="${
//         process.env.FRONTEND_URL || "http://localhost:5173"
//       }/login" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Login Here</a></p>
//     `;

//     try {
//       await sendEmail({
//         email,
//         subject: "Your Account Has Been Created",
//         message,
//       });
//     } catch (emailError) {
//       console.error("Email sending error:", emailError);
//       // Don't fail the account creation if email fails
//     }

//     res.status(201).json({
//       success: true,
//       message: "User account created successfully. Credentials sent to email.",
//       user: {
//         id: user._id,
//         firstName: user.firstName,
//         lastName: user.lastName,
//         email: user.email,
//         role: user.role,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to create user account",
//       error: error.message,
//     });
//   }
// };

// /**
//  * Get All Users (Admin only)
//  * GET /api/admin/users
//  */
// export const getAllUsers = async (req, res) => {
//   try {
//     const { role, status, search } = req.query;

//     let filter = {};
//     if (role) filter.role = role;
//     if (status !== undefined) filter.isActive = status === "active";
//     if (search) {
//       filter.$or = [
//         { firstName: { $regex: search, $options: "i" } },
//         { lastName: { $regex: search, $options: "i" } },
//         { email: { $regex: search, $options: "i" } },
//       ];
//     }

//     const users = await User.find(filter).sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       count: users.length,
//       data: users,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch users",
//       error: error.message,
//     });
//   }
// };

// /**
//  * Get User by ID (Admin only)
//  * GET /api/admin/users/:id
//  */
// export const getUserById = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: user,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch user",
//       error: error.message,
//     });
//   }
// };

// /**
//  * Update User (Admin only)
//  * PUT /api/admin/users/:id
//  */
// export const updateUser = async (req, res) => {
//   try {
//     const { firstName, lastName, role, isActive, permissions, notes } =
//       req.body;

//     let updateData = {};
//     if (firstName) updateData.firstName = firstName;
//     if (lastName) updateData.lastName = lastName;
//     if (role) updateData.role = role;
//     if (isActive !== undefined) updateData.isActive = isActive;
//     if (permissions) updateData.permissions = permissions;
//     if (notes) updateData.notes = notes;

//     const user = await User.findByIdAndUpdate(req.params.id, updateData, {
//       new: true,
//       runValidators: true,
//     });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "User updated successfully",
//       data: user,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to update user",
//       error: error.message,
//     });
//   }
// };

// /**
//  * Deactivate User (Admin only)
//  * PATCH /api/admin/users/:id/deactivate
//  */
// export const deactivateUser = async (req, res) => {
//   try {
//     const user = await User.findByIdAndUpdate(
//       req.params.id,
//       { isActive: false },
//       { new: true }
//     );

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "User deactivated successfully",
//       data: user,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to deactivate user",
//       error: error.message,
//     });
//   }
// };

// /**
//  * Activate User (Admin only)
//  * PATCH /api/admin/users/:id/activate
//  */
// export const activateUser = async (req, res) => {
//   try {
//     const user = await User.findByIdAndUpdate(
//       req.params.id,
//       { isActive: true },
//       { new: true }
//     );

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "User activated successfully",
//       data: user,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to activate user",
//       error: error.message,
//     });
//   }
// };

// /**
//  * Reset User Password (Admin only)
//  * POST /api/admin/users/:id/reset-password
//  */
// export const resetUserPassword = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     // Generate temporary password
//     const tempPassword = crypto.randomBytes(6).toString("hex").toUpperCase();

//     // Update password
//     user.password = tempPassword;
//     await user.save();

//     // Send new password email
//     const message = `
//       <h2>Your Password Has Been Reset</h2>
//       <p>Hello ${user.firstName} ${user.lastName},</p>
//       <p>An admin has reset your password. Here is your new temporary password:</p>
//       <p style="background-color: #f0f0f0; padding: 15px; border-radius: 4px; font-family: monospace;">
//         <strong>Temporary Password:</strong> ${tempPassword}
//       </p>
//       <p><strong>Important:</strong> Please change your password immediately after login.</p>
//       <p><a href="${
//         process.env.FRONTEND_URL || "http://localhost:5173"
//       }/login" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Login Here</a></p>
//     `;

//     try {
//       await sendEmail({
//         email: user.email,
//         subject: "Your Password Has Been Reset",
//         message,
//       });
//     } catch (emailError) {
//       console.error("Email sending error:", emailError);
//     }

//     res.status(200).json({
//       success: true,
//       message: "Password reset email sent to user",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to reset user password",
//       error: error.message,
//     });
//   }
// };

// /**
//  * Delete User (Admin only - Hard delete)
//  * DELETE /api/admin/users/:id
//  */
// export const deleteUser = async (req, res) => {
//   try {
//     const user = await User.findByIdAndDelete(req.params.id);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "User deleted successfully",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to delete user",
//       error: error.message,
//     });
//   }
// };

import User from "../models/User.js";
import Company from "../models/Company.js";
import Client from "../models/Client.js";
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";

// =====================================================
// USER MANAGEMENT (All Roles)
// =====================================================

/**
 * Get All Users (Admin only)
 * GET /api/admin/users
 * Can filter by role, status, search
 */
export const getAllUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;

    let filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .populate("companyId", "companyName tradeName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

/**
 * Get User by ID (Admin only)
 * GET /api/admin/users/:id
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "companyId",
      "companyName tradeName gstNumber"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error.message,
    });
  }
};

/**
 * Create User Account (Admin only)
 * POST /api/admin/users
 * Can create admin, client, or other role users
 */
export const createUserAccount = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      role = "client",
      phoneNumber,
      companyId,
      designation,
      department,
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: "Please provide firstName, lastName, and email",
      });
    }

    // If creating a client, companyId is required
    if (role === "client" && !companyId) {
      return res.status(400).json({
        success: false,
        message: "Company is required for client users",
      });
    }

    // Check if company exists (for clients)
    if (companyId) {
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({
          success: false,
          message: "Company not found",
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Generate temporary password
    let tempPassword;
    const cleanRole = role?.toLowerCase() || "client";

    if (cleanRole === "admin") {
      // Format: First 2 letters of firstName + Last 2 letters of lastName + @cottson
      const cleanFirstName = firstName.trim();
      const cleanLastName = lastName.trim();

      const firstPart = cleanFirstName.substring(0, 2);
      const lastPart = cleanLastName.slice(-2);
      tempPassword = `${firstPart}${lastPart}@cottson`;
    } else {
      // Random password for other roles
      tempPassword = crypto.randomBytes(6).toString("hex").toUpperCase();
    }

    // Create user
    const user = new User({
      firstName,
      lastName,
      email,
      phoneNumber,
      companyId,
      designation,
      department,
      password: tempPassword,
      role,
      status: "active",
    });

    await user.save();

    // Send credentials email
    const roleLabel =
      role === "client" ? "Client" : role === "admin" ? "Admin" : "User";
    const message = `
      <h2>Your ${roleLabel} Account Created Successfully</h2>
      <p>Hello ${firstName} ${lastName},</p>
      <p>An admin has created your account. Here are your login credentials:</p>
      <p style="background-color: #f0f0f0; padding: 15px; border-radius: 4px; font-family: monospace;">
        <strong>Email:</strong> ${email}<br/>
        <strong>Temporary Password:</strong> ${tempPassword}
      </p>
      <p><strong>Important:</strong> Please change your password immediately after first login.</p>
      <p><a href="${process.env.FRONTEND_URL || "http://localhost:5173"
      }/login" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Login Here</a></p>
    `;

    try {
      await sendEmail({
        email,
        subject: `Your ${roleLabel} Account Has Been Created`,
        message,
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      // Don't fail the account creation if email fails
    }

    res.status(201).json({
      success: true,
      message: "User account created successfully. Credentials sent to email.",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create user account",
      error: error.message,
    });
  }
};

/**
 * Update User (Admin only)
 * PUT /api/admin/users/:id
 */
export const updateUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      role,
      status,
      phoneNumber,
      companyId,
      designation,
      department,
      permissions,
      notes,
    } = req.body;

    let updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (companyId) updateData.companyId = companyId;
    if (designation) updateData.designation = designation;
    if (department) updateData.department = department;
    if (permissions) updateData.permissions = permissions;
    if (notes) updateData.notes = notes;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate("companyId", "companyName tradeName");

    // Sync with Client model if user is a client and email is updated
    if (user.role === 'client' && email) {
      // Find client associated with this user
      const client = await Client.findOne({ userId: user._id });

      if (client) {
        client.email = email;
        await client.save();
        console.log(`Synced email update to Client model for user: ${user._id}`);
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    });
  }
};

/**
 * Deactivate User (Admin only)
 * PATCH /api/admin/users/:id/deactivate
 */
export const deactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "inactive" },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deactivated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to deactivate user",
      error: error.message,
    });
  }
};

/**
 * Activate User (Admin only)
 * PATCH /api/admin/users/:id/activate
 */
export const activateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User activated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to activate user",
      error: error.message,
    });
  }
};

/**
 * Reset User Password (Admin only)
 * POST /api/admin/users/:id/reset-password
 */
export const resetUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(6).toString("hex").toUpperCase();

    // Update password
    user.password = tempPassword;
    await user.save();

    // Send new password email
    const message = `
      <h2>Your Password Has Been Reset</h2>
      <p>Hello ${user.firstName} ${user.lastName},</p>
      <p>An admin has reset your password. Here is your new temporary password:</p>
      <p style="background-color: #f0f0f0; padding: 15px; border-radius: 4px; font-family: monospace;">
        <strong>Temporary Password:</strong> ${tempPassword}
      </p>
      <p><strong>Important:</strong> Please change your password immediately after login.</p>
      <p><a href="${process.env.FRONTEND_URL || "http://localhost:5173"
      }/login" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Login Here</a></p>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: "Your Password Has Been Reset",
        message,
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
    }

    res.status(200).json({
      success: true,
      message: "Password reset email sent to user",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to reset user password",
      error: error.message,
    });
  }
};

/**
 * Delete User (Admin only - Hard delete)
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

// =====================================================
// CLIENT-SPECIFIC OPERATIONS (Convenience endpoints)
// =====================================================

/**
 * Get All Clients (Admin only)
 * GET /api/admin/clients
 * Filtered specifically for role="client"
 */
export const getAllClients = async (req, res) => {
  try {
    const { companyId, status, search } = req.query;

    let filter = { role: "client" };

    if (companyId) filter.companyId = companyId;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }

    const clients = await User.find(filter)
      .populate("companyId", "companyName tradeName gstNumber")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: clients.length,
      data: clients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching clients",
      error: error.message,
    });
  }
};

/**
 * Get Client by ID (Admin only)
 * GET /api/admin/clients/:id
 */
export const getClientById = async (req, res) => {
  try {
    const client = await User.findOne({
      _id: req.params.id,
      role: "client",
    }).populate("companyId", "companyName tradeName gstNumber");

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching client",
      error: error.message,
    });
  }
};
