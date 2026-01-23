import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  clientId: { type: String, required: true },
  clientName: { type: String, required: true },
  clientEmail: { type: String, required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
  isReadByAdmin: { type: Boolean, default: false },
  isReadByClient: { type: Boolean, default: false },
  adminResponse: { type: String },
  resolvedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('Complaint', complaintSchema);
