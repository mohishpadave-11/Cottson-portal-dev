import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    // === AUTHENTICATION ===
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"], // Simplified regex
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    // === IDENTITY ===
    // Unified Name Strategy: Everyone uses firstName/lastName
    firstName: {
      type: String,
      trim: true,
      required: [true, "First Name is required"],
    },
    lastName: {
      type: String,
      trim: true,
    },
    // Unified Phone Strategy
    phone: {
      type: String,
      trim: true,
    },
    avatar: String,
    department: String,
    location: String,
    bio: String,

    // === ROLES & PERMISSIONS ===
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
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      // Only required if role is 'client' - can be enforced in controller
    },

    // === METADATA ===
    lastLogin: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // Ensure virtuals are sent to frontend
    toObject: { virtuals: true }
  }
);

// Virtual for Full Name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName || ''}`.trim();
});

// Indexes
// Indexes
userSchema.index({ companyId: 1 }); // Critical for filtering clients

// Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Auto-generate avatar
userSchema.pre("save", function (next) {
  if (!this.avatar && this.firstName) {
    const lastInitial = this.lastName ? this.lastName[0] : "";
    this.avatar = (this.firstName[0] + lastInitial).toUpperCase();
  }
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);