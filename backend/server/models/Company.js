import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      minlength: [3, "Company name must be at least 3 characters"],
    },
    tradeName: {
      type: String,
      required: [true, "Trade name is required"],
      trim: true,
    },
    gstNumber: {
      type: String,
      required: [true, "GST number is required"],
      unique: true,
      uppercase: true,
      match: [
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        "Please provide a valid GST number",
      ],
      //27GSTIN1234F1Z5
    },
    billingAddress: {
      type: String,
      required: [true, "Billing address is required"],
    },
    shippingAddresses: [
      {
        label: { type: String, required: true },
        address: { type: String, required: true }
      }
    ],
    companyId: {
      type: String,
      unique: true,
      trim: true,
    },
    shortCode: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    contactEmail: {
      type: String,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    contactPhone: {
      type: String,
      match: [/^[0-9]{10,}$/, "Please provide a valid phone number"],
    },
    website: String,
    bankDetails: {
      accountHolder: String,
      accountNumber: String,
      bankName: String,
      ifscCode: String,
    },
    notes: String,
  },
  { timestamps: true }
);

// Index for faster queries
companySchema.index({ gstNumber: 1, companyId: 1, shortCode: 1 });

export default mongoose.model("Company", companySchema);
