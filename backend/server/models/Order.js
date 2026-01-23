import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: [true, "Order number is required"],
      unique: true,
      trim: true,
    },
    sequence: {
      type: Number,
      required: true,
    },
    orderDate: {
      type: Date,
      required: [true, "Order date is required"],
      default: Date.now,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be positive"],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount must be positive"],
    },
    gstRate: {
      type: Number,
      default: 5,
      enum: [0, 5, 12, 18, 28],
    },
    priceWithGst: {
      type: Number,
      required: [true, "Price with GST is required"],
    },
    priceAfterDiscount: {
      type: Number,
      default: 0
    },
    customCharges: [
      {
        name: String,
        amount: { type: Number, default: 0 }
      }
    ],
    advancePercentage: {
      type: Number,
      default: 60,
      min: [0, "Advance percentage must be positive"],
      max: [100, "Advance percentage cannot exceed 100"],
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: [0, "Amount paid must be positive"],
    },
    payments: [
      {
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        type: { type: String, enum: ['Advance', 'Installment', 'Final'], default: 'Installment' },
        notes: String,
        recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      }
    ],
    paymentStatus: {
      type: String,
      enum: [
        "Advance Pending",
        "Balance Pending",
        "Full Settlement",
        "Cancelled",
      ],
      default: "Advance Pending",
    },
    orderStatus: {
      type: String,
      enum: ["Pending", "Confirmed", "In Progress", "Completed", "Cancelled"],
      default: "Pending",
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company is required"],
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "Client is required"],
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },
    shippingAddress: {
      type: String,
      required: [true, "Shipping address is required"],
    },
    expectedDelivery: {
      type: Date,
      required: [true, "Expected delivery date is required"],
    },
    actualDelivery: Date,
    completedAt: {
      type: Date,
      default: null,
    },
    delayDays: {
      type: Number,
      default: 0,
    },
    deliveryStatus: {
      type: String,
      enum: ["On Time", "Delayed"],
      default: "On Time",
    },
    timeline: {
      type: String,
      enum: [
        "Order Confirmed",
        "Fabric Purchase",
        "Fabric Cutting",
        "Embroidery/Printing",
        "Stitching",
        "Packing",
        "Shipped",
        "Delivered",
        "Order Completed",
        "Order Delayed",
      ],
      default: "Order Confirmed",
    },
    timelineStages: [
      {
        stage: String,
        startDate: Date,
        endDate: Date,
        status: {
          type: String,
          enum: ["pending", "in-progress", "completed"],
          default: "pending",
        },
      },
    ],
    documents: [
      {
        name: { type: String, required: true },
        originalName: { type: String, required: true }, // e.g., 'Quotation', 'Invoice'
        isSystem: { type: Boolean, default: false },
        url: String,
        fileType: String,
        key: String,
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: String,
    internalNotes: String,
    activityLog: [
      {
        action: String,
        details: String,
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Index for faster queries
// orderSchema.index({ orderNumber: 1 });
orderSchema.index({ companyId: 1, clientId: 1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ paymentStatus: 1 });

// Calculate price with GST before saving
orderSchema.pre("save", function (next) {
  // Formula:
  // 1. Subtotal = Price (Per Piece) * Quantity
  // 2. Discount is Flat Amount
  // 3. Taxable = Subtotal - Discount
  // 4. GST = Taxable * 5%
  // 5. Custom Charges = Sum(Charges)
  // 6. Total = Taxable + GST + Custom Charges

  if (this.price !== undefined && this.quantity) {
    const subtotal = this.price * this.quantity;
    const discountAmount = this.discount || 0;

    // Ensure taxable value isn't negative
    const taxableValue = Math.max(subtotal - discountAmount, 0);
    this.priceAfterDiscount = taxableValue;

    const gstAmount = taxableValue * 0.05; // Fixed 5% GST

    const customChargesTotal = (this.customCharges || []).reduce((sum, c) => sum + (c.amount || 0), 0);

    this.priceWithGst = taxableValue + gstAmount + customChargesTotal;
  }
  next();
});


// Update payment status logic (Disabled for manual selection)
orderSchema.methods.updatePaymentStatus = function () {
  // Manual status management requested
  return;
};

// Generate Order Number: CC/ON/{shortCode}/{sequence}
orderSchema.statics.generateOrderNumber = async function (companyId) {
  if (!companyId) {
    throw new Error("companyId is required to generate order number");
  }

  // 1. Get company shortCode
  const Company = mongoose.model("Company");
  const company = await Company.findById(companyId);
  if (!company || !company.shortCode) {
    throw new Error("Company not found or missing shortCode");
  }

  // 2. Find max sequence for this company
  const lastOrder = await this.findOne({ companyId })
    .sort({ sequence: -1 })
    .select("sequence");

  const nextSequence = lastOrder ? (lastOrder.sequence || 0) + 1 : 1;

  // 3. Format order number
  const paddedSequence = String(nextSequence).padStart(2, "0");
  const orderNumber = `CC/ON/${company.shortCode}/${paddedSequence}`;

  return { orderNumber, sequence: nextSequence };
};

export default mongoose.model("Order", orderSchema);
