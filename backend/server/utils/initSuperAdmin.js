import bcrypt from "bcryptjs";
import User from "../models/User.js";

/**
 * Initialize SuperAdmin on first server start
 * This runs automatically when the server starts
 */
const initSuperAdmin = async () => {
  try {
    // Check if SuperAdmin already exists
    const existingSuperAdmin = await User.findOne({ role: "superadmin" });

    if (existingSuperAdmin) {
      return;
    }

    // Create SuperAdmin with hardcoded credentials
    const hashedPassword = await bcrypt.hash("Cottson@2026", 10);

    const superAdmin = new User({
      name: "Yash Mishra",
      email: "yash.mishra@cottson.com",
      password: hashedPassword,
      role: "superadmin",
      status: "active",
      isActive: true,
      phone: "+1234567890",
      department: "Administration",
    });
    await superAdmin.save();
  } catch (error) {
    console.error("❌ Error initializing SuperAdmin:", error.message);
  }
};

export default initSuperAdmin;
