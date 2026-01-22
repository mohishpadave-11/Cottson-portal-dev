/**
 * Order Controller
 * Handles all order-related CRUD operations
 */

import Order from "../models/Order.js";
import Company from "../models/Company.js";
import Client from "../models/Client.js";
import Product from "../models/Product.js";
import { uploadFile, deleteFile } from "../services/StorageService.js";
import Notification from "../models/Notification.js";
import EmailService from "../services/EmailService.js";

// Generate unique order number
// Generate unique order number
// Generate unique order number - Moved to Order model
// const generateOrderNumber = async () => { ... }

// Get next order number for UI
export const getNextOrderNumber = async (req, res) => {
  try {
    const orderNumber = await Order.generateOrderNumber();
    res.status(200).json({
      success: true,
      data: orderNumber,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating order number",
      error: error.message,
    });
  }
};

// Get all orders
export const getOrders = async (req, res) => {
  try {
    const {
      companyId,
      clientId,
      paymentStatus,
      orderStatus,
      startDate,
      endDate,
    } = req.query;

    let filter = {};
    if (companyId) filter.companyId = companyId;
    if (clientId) filter.clientId = clientId;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (orderStatus) filter.orderStatus = orderStatus;

    // Security: If user is a client, enforce companyId filter
    if (req.user?.role === 'client') {
      if (!req.user.companyId) {
        return res.status(403).json({
          success: false,
          message: "Client user not associated with a company",
        });
      }
      filter.companyId = req.user.companyId;
    }

    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }

    const orders = await Order.find(filter)
      .populate("companyId", "companyName tradeName")
      .populate("clientId", "name email phoneNumber")
      .populate("productId", "name category basePrice")
      .sort({ orderDate: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    });
  }
};

// Get single order
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .select('-__v')
      .populate("companyId", "companyName tradeName")
      .populate("clientId", "name email phoneNumber")
      .populate("productId", "name category basePrice")
      .populate("activityLog.performedBy", "name firstName lastName");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Security: If user is a client, check if order belongs to their company
    if (req.user?.role === 'client') {
      // Robust comparison on backend too
      const orderCompanyIdString = order.companyId?._id?.toString() || order.companyId?.toString();
      const userCompanyIdString = req.user.companyId?.toString();

      if (orderCompanyIdString !== userCompanyIdString) {
        return res.status(403).json({
          success: false,
          message: "Access forbidden to this order",
        });
      }
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching order",
      error: error.message,
    });
  }
};

// Create order
export const createOrder = async (req, res) => {
  try {
    const {
      companyId,
      clientId,
      productId,
      quantity,
      price,
      discount,
      gstRate,
      expectedDelivery,
      customCharges
    } = req.body;

    // Validate required fields
    if (
      !companyId ||
      !clientId ||
      !productId ||
      !quantity ||
      price === undefined ||
      !expectedDelivery
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Check if references exist
    const [company, client, product] = await Promise.all([
      Company.findById(companyId),
      Client.findById(clientId),
      Product.findById(productId),
    ]);

    if (!company || !client || !product) {
      let missing = [];
      if (!company) missing.push("company");
      if (!client) missing.push("client");
      if (!product) missing.push("product");
      return res.status(404).json({
        success: false,
        message: `Invalid reference(s): ${missing.join(", ")}`,
      });
    }

    // Generate order number if not provided
    if (!req.body.orderNumber) {
      req.body.orderNumber = await Order.generateOrderNumber();
    }

    // Calculate price with GST (Detailed Formula)
    // 1. Subtotal
    const subtotal = Number(price) * Number(quantity);
    // 2. Discount (Flat)
    const discountAmount = Number(discount) || 0;
    // 3. Taxable
    const taxableValue = Math.max(subtotal - discountAmount, 0);
    // 4. GST (5%)
    const gst = taxableValue * 0.05;
    // 5. Custom Charges
    const customChargesTotal = (customCharges || []).reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

    const priceWithGst = taxableValue + gst + customChargesTotal;

    // Create order instance
    const order = new Order({
      ...req.body,
      priceWithGst,
      priceAfterDiscount: taxableValue,
      gstRate: 5, // Force 5%
      amountPaid: 0,
      payments: [],
      createdBy: req.user?._id,
      activityLog: [{
        action: 'Order Created',
        details: `Order #${req.body.orderNumber} created`,
        performedBy: req.user?._id,
        timestamp: new Date()
      }]
    });

    // Handle initial payment
    const initialAmountPaid = Number(req.body.amountPaid) || 0;

    if (initialAmountPaid > 0) {
      order.payments.push({
        amount: initialAmountPaid,
        date: new Date(),
        type: 'Advance',
        notes: 'Initial payment at order creation',
        recordedBy: req.user?._id
      });
      order.amountPaid = initialAmountPaid;
    }

    // Update status
    order.updatePaymentStatus();

    await order.save();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating order",
      error: error.message,
    });
  }
};

// Update order
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Track changes
    const changes = [];

    // Check Price
    if (updates.price !== undefined && Number(updates.price) !== order.price) {
      changes.push(`Price changed from ${order.price} to ${updates.price}`);
    }

    // Check Discount
    if (updates.discount !== undefined) {
      const oldDiscount = parseFloat(order.discount || 0);
      const newDiscount = parseFloat(updates.discount);

      if (!isNaN(newDiscount) && Math.abs(newDiscount - oldDiscount) > 0.01) {
        changes.push(`Discount changed from ${oldDiscount}% to ${newDiscount}%`);
      }
    }

    // Check Quantity
    if (updates.quantity !== undefined && Number(updates.quantity) !== order.quantity) {
      changes.push(`Quantity changed from ${order.quantity} to ${updates.quantity}`);
    }

    // Check Expected Delivery
    if (updates.expectedDelivery) {
      const newDate = new Date(updates.expectedDelivery).toISOString().split('T')[0];
      const oldDate = order.expectedDelivery ? new Date(order.expectedDelivery).toISOString().split('T')[0] : 'Not Set';
      if (newDate !== oldDate) {
        changes.push(`Expected delivery changed from ${oldDate} to ${newDate}`);
      }
    }

    // Check Order Date
    if (updates.orderDate) {
      const newDate = new Date(updates.orderDate).toISOString().split('T')[0];
      const oldDate = order.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : 'Not Set';
      if (newDate !== oldDate) {
        changes.push(`Order date changed from ${oldDate} to ${newDate}`);
      }
    }

    // Check Status (Timeline)
    if (updates.timeline && updates.timeline !== order.timeline) {
      changes.push(`Status updated: ${updates.timeline}`);
    }

    // Check Payment Status (Explicit update)
    if (updates.paymentStatus && updates.paymentStatus !== order.paymentStatus) {
      changes.push(`Payment status changed to ${updates.paymentStatus}`);
    }

    // Log activities
    if (changes.length > 0) {
      changes.forEach(change => {
        order.activityLog.push({
          action: 'Order Updated',
          details: change,
          performedBy: req.user._id,
          timestamp: new Date()
        });
      });
    }

    // Apply updates (Excluding restricted fields)
    const restrictedFields = ['_id', 'orderNumber', 'createdAt', 'updatedAt', 'activityLog', 'history', 'payments', 'documents'];

    Object.keys(updates).forEach(key => {
      if (!restrictedFields.includes(key)) {
        order[key] = updates[key];
      }
    });

    await order.save();

    // Re-populate for response
    await order.populate([
      { path: "companyId" },
      { path: "clientId" },
      { path: "productId", select: "name category basePrice" },
      { path: "activityLog.performedBy", select: "name firstName lastName" }
    ]);

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      data: order,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(400).json({
      success: false,
      message: "Error updating order",
      error: error.message,
    });
  }
};

// Update order timeline
export const updateOrderTimeline = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, status } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update timeline stage
    order.timeline = stage;

    // Set completedAt timestamp when order is moved to "Order Completed"
    if (stage === "Order Completed" && !order.completedAt) {
      order.completedAt = new Date();
    } else if (stage !== "Order Completed" && order.completedAt) {
      // Clear completedAt if moved away from completed status
      order.completedAt = null;
    }

    // Add to timelineStages
    if (!order.timelineStages) order.timelineStages = [];

    const stageIndex = order.timelineStages.findIndex((s) => s.stage === stage);
    if (stageIndex === -1) {
      order.timelineStages.push({
        stage,
        status: status || "in-progress",
        startDate: new Date(),
      });
    } else {
      order.timelineStages[stageIndex].status = status || "in-progress";
      if (status === "completed") {
        order.timelineStages[stageIndex].endDate = new Date();
      }
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order timeline updated successfully",
      data: order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating timeline",
      error: error.message,
    });
  }
};

// Delete order
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting order",
      error: error.message,
    });
  }
};

// Add payment to order
export const addPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, date, type, notes } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Add payment
    order.payments.push({
      amount,
      date: date || new Date(),
      type: type || 'Installment',
      notes,
      recordedBy: req.user._id
    });

    // Update total amount paid
    order.amountPaid = (order.amountPaid || 0) + Number(amount);

    // Update payment status logic
    order.updatePaymentStatus();

    await order.save();

    res.status(200).json({
      success: true,
      message: "Payment recorded successfully",
      data: order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error recording payment",
      error: error.message,
    });
  }
};

// Update payment
export const updatePayment = async (req, res) => {
  try {
    const { id, paymentId } = req.params;
    const { amount, date, type, notes } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const payment = order.payments.id(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Update payment fields
    if (amount) payment.amount = amount;
    if (date) payment.date = date;
    if (type) payment.type = type;
    if (notes !== undefined) payment.notes = notes;

    // Recalculate total amount paid
    order.amountPaid = order.payments.reduce((total, p) => total + p.amount, 0);

    // Update payment status logic
    const totalDue = order.priceWithGst;
    const advanceAmount = totalDue * ((order.advancePercentage || 60) / 100);

    if (order.amountPaid >= totalDue) {
      order.paymentStatus = 'Payment Completed';
    } else if (order.amountPaid >= advanceAmount) {
      order.paymentStatus = 'Advance Payment';
    } else {
      order.paymentStatus = 'Balance Remaining';
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      data: order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating payment",
      error: error.message,
    });
  }
};

// Delete payment
export const deletePayment = async (req, res) => {
  try {
    const { id, paymentId } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Remove payment
    order.payments.pull(paymentId);

    // Recalculate total amount paid
    order.amountPaid = order.payments.reduce((total, p) => total + p.amount, 0);

    // Update payment status logic
    const totalDue = order.priceWithGst;
    const advanceAmount = totalDue * ((order.advancePercentage || 60) / 100);

    if (order.amountPaid >= totalDue) {
      order.paymentStatus = 'Payment Completed';
    } else if (order.amountPaid >= advanceAmount) {
      order.paymentStatus = 'Advance Payment';
    } else {
      order.paymentStatus = 'Balance Remaining';
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Payment deleted successfully",
      data: order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error deleting payment",
      error: error.message,
    });
  }
};

// Upload file to order
// Upload file to order
export const uploadFileToOrder = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file provided",
      });
    }

    const { id } = req.params;

    // Verify order exists
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Store file reference in order
    const { docType } = req.body;

    // Upload to R2
    const fileUrl = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      'orders',
      req.file.mimetype
    );

    // Initialize documents array if undefined
    if (!order.documents) {
      order.documents = [];
    }

    const fixedDocs = ['quotation', 'proformaInvoice', 'manufacturingSheet', 'invoice'];

    if (docType && fixedDocs.includes(docType)) {
      // Find existing fixed doc
      const existingDoc = order.documents.find(d => d.originalName === docType);

      if (existingDoc) {
        // Delete old file if present
        if (existingDoc.url) {
          await deleteFile(existingDoc.url);
        }
        existingDoc.url = fileUrl;
        existingDoc.key = null; // We don't have key from uploadFile currently unless we change it
        existingDoc.fileType = req.file.mimetype;
      } else {
        // Create new fixed doc entry
        order.documents.push({
          name: docType.charAt(0).toUpperCase() + docType.slice(1).replace(/([A-Z])/g, ' $1').trim(), // Simple label
          originalName: docType,
          isSystem: true,
          url: fileUrl,
          fileType: req.file.mimetype
        });
      }

    } else {
      // Flexible 'other' doc
      const otherDocsCount = order.documents.filter(d => !d.isSystem).length;
      if (otherDocsCount >= 2) {
        // Optionally replace the oldest? Or fail? 
        // For direct upload, let's just fail if full, or maybe append?
        // Requirement said "Max 2 distinct files" for other.
        // Let's allow it but warn or fail. 
        // Given "Flexible Docs: Can be renamed ... and fully deleted", implies we add them. 
        // I'll stick to 2 limit.
        return res.status(400).json({
          success: false,
          message: "Maximum 2 additional documents allowed. Please delete one first."
        });
      }

      order.documents.push({
        name: req.file.originalname,
        originalName: 'other',
        isSystem: false,
        url: fileUrl,
        fileType: req.file.mimetype
      });
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      data: {
        fileUrl,
        docType: docType || 'other',
        fileName: req.file.originalname,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error uploading file",
      error: error.message,
    });
  }
};

// Update order documents (Sync DB after direct upload)
// Update order documents (Sync DB after direct upload)
export const updateOrderDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const { docType, newUrl, newKey, fileName, fileType } = req.body;

    if (!docType || !newUrl) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: docType, newUrl"
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (!order.documents) {
      order.documents = [];
    }

    const fixedDocs = ['quotation', 'proformaInvoice', 'manufacturingSheet', 'invoice'];
    const getLabel = (key) => {
      switch (key) {
        case 'quotation': return 'Quotation';
        case 'proformaInvoice': return 'Proforma Invoice';
        case 'manufacturingSheet': return 'Manufacturing Sheet';
        case 'invoice': return 'Invoice';
        default: return key;
      }
    };

    if (fixedDocs.includes(docType)) {
      const existingDoc = order.documents.find(d => d.originalName === docType);

      if (existingDoc) {
        // Delete old file if present matches condition
        if (existingDoc.url && existingDoc.url !== newUrl) {
          await deleteFile(existingDoc.url);
        }
        // Update
        existingDoc.url = newUrl;
        existingDoc.key = newKey;
        existingDoc.fileType = fileType;
        // We do NOT reset the name here, assuming user might have renamed it? 
        // Ah, Fixed docs "Cannot be renamed". So name is static-ish.
        // But let's verify if name should be set.
        if (!existingDoc.name) existingDoc.name = getLabel(docType);
      } else {
        // Create
        order.documents.push({
          name: getLabel(docType),
          originalName: docType,
          isSystem: true,
          url: newUrl,
          key: newKey,
          fileType: fileType
        });
      }
    } else if (docType === 'other') {
      const otherDocsCount = order.documents.filter(d => !d.isSystem).length;
      if (otherDocsCount >= 2) {
        return res.status(400).json({
          success: false,
          message: "Maximum 2 optional documents allowed"
        });
      }

      order.documents.push({
        name: fileName || 'New Document',
        originalName: 'other',
        isSystem: false,
        url: newUrl,
        key: newKey,
        fileType: fileType
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid document type"
      });
    }

    // Add to activity log
    order.activityLog.push({
      action: "Document Uploaded",
      details: `${fileName} uploaded as ${docType}`,
      performedBy: req.user._id,
      timestamp: new Date()
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: "Documents updated successfully",
      data: order.documents
    });

  } catch (error) {
    console.error("Error updating order documents:", error);
    res.status(500).json({
      success: false,
      message: "Error updating documents",
      error: error.message
    });
  }
};

// Notify Client about document upload
export const notifyClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { docType, docUrl } = req.body;

    const order = await Order.findById(id).populate('clientId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (!order.clientId) {
      return res.status(400).json({
        success: false,
        message: "Order has no assigned client"
      });
    }

    const client = order.clientId;

    // 1. Send Email
    // Checking if client has email, assuming client model has email field
    if (client.email) {
      await EmailService.sendDocumentNotification(
        client.email,
        client.name || 'Valued Client',
        docType,
        order.orderNumber,
        docUrl
      );
    }

    // 2. Create In-App Notification
    const notification = new Notification({
      recipient: client._id,
      orderId: order._id,
      message: `New document (${docType}) available for Order #${order.orderNumber}`,
      type: 'document'
    });

    await notification.save();

    res.status(200).json({
      success: true,
      message: "Client notified via Email and In-App"
    });

  } catch (error) {
    console.error("Notify Client Error:", error);
    res.status(500).json({
      success: false,
      message: "Error notifying client",
      error: error.message
    });
  }
};
