import User from "../models/User.js";

const initSuperAdmin = async () => {
  try {
    const email = "yash.mishra@cottson.com";
    const password = "Cottson@2026";
    const phone = "+919892297764";

    // Check if SuperAdmin exists
    let superAdmin = await User.findOne({ email });

    if (superAdmin) {
      console.log("⚠️ SuperAdmin found. Updating credentials to ensure access...");

      // Force update the password (triggers pre-save hashing)
      superAdmin.password = password;
      superAdmin.role = "superadmin"; // Ensure role is correct
      superAdmin.firstName = "Yash";
      superAdmin.lastName = "Mishra";

      await superAdmin.save();
      console.log("✅ SuperAdmin credentials UPDATED successfully.");
    } else {
      console.log("⚙️ Creating new SuperAdmin...");

      superAdmin = new User({
        firstName: "Yash",
        lastName: "Mishra",
        email: email,
        password: password, // Plain text (will be hashed by model)
        role: "superadmin",
        status: "active",
        isActive: true,
        phone: phone,
        department: "Administration",
      });

      await superAdmin.save();
      console.log("✅ New SuperAdmin CREATED successfully.");
    }

    console.log(`👉 Login with: ${email} | ${password}`);

  } catch (error) {
    console.error("❌ Error initializing SuperAdmin:", error.message);
  }
};

export default initSuperAdmin;