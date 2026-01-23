import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    // User basic info (common to all roles)
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't return password by default
    },

    // Role and status
    role: {
      type: String,
      enum: ["superadmin", "admin", "client"],
      default: "client",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // User metadata
    lastLogin: Date,
    permissions: [String],
    notes: String,

    // Password reset
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    requiresPasswordChange: {
      type: Boolean,
      default: false,
    },

    // Fields for admin/manager role
    name: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    profileImage: String,
    avatar: String,

    // Fields for regular users
    firstName: {
      type: String,
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
    },
    lastName: {
      type: String,
      trim: true,
      minlength: [2, "Last name must be at least 2 characters"],
    },

    // Fields for client role
    phoneNumber: {
      type: String,
      match: [/^[0-9]{10,}$/, "Please provide a valid phone number"],
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
// userSchema.index({ email: 1 });
userSchema.index({ companyId: 1 });
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Generate avatar initials if name provided and avatar not set
userSchema.pre("save", function (next) {
  if (!this.avatar) {
    if (this.name) {
      this.avatar = this.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    } else if (this.firstName && this.lastName) {
      this.avatar = (this.firstName[0] + this.lastName[0]).toUpperCase();
    }
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
