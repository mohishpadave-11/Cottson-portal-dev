import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [3, "Product name must be at least 3 characters"],
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Apparel",
        "Accessories",
        "Home Textiles",
        "Corporate Gifts",
        "Other",
      ],
      default: "Apparel",
    },
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection',
      required: false
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "discontinued"],
      default: "active",
    },
    basePrice: {
      type: Number,
      required: [true, "Base price is required"],
      min: [0, "Price must be positive"],
    },
    unit: {
      type: String,
      enum: ["piece", "meter", "kg", "box"],
      default: "piece",
    },
    specifications: {
      material: String,
      color: String,
      size: String,
      weight: String,
    },
    imageUrl: String,
    notes: String,
  },
  { timestamps: true }
);

// Index for faster queries
productSchema.index({ category: 1, status: 1 });
// productSchema.index({ sku: 1 });

export default mongoose.model("Product", productSchema);
