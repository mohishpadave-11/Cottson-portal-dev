import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { endpoints } from '../config/api';
import axios from 'axios';
import Loader, { ButtonLoader } from '../components/Loader';
import PaymentModal from '../components/PaymentModal';
import ConfirmationModal from '../components/ConfirmationModal';
import OrderDocumentManager from '../components/OrderDocumentManager';
import ManufacturingTimeline from '../components/ManufacturingTimeline';
import AddressSelector from '../components/AddressSelector';
import { useToast } from '../contexts/ToastContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const OrderDetails = () => {
  const { id } = useParams();



  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  // Staged Documents State (for new orders)
  const [stagedDocuments, setStagedDocuments] = useState([]);
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({ total: 0, current: 0 });

  const [order, setOrder] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [chargeTypes, setChargeTypes] = useState([]); // Available charge types
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(id === 'new');
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'timeline'
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isDeletePaymentModalOpen, setIsDeletePaymentModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [showAllActivities, setShowAllActivities] = useState(false);



  const [formData, setFormData] = useState({
    orderNumber: '',
    orderDate: '',
    quantity: '',
    price: '',
    discount: 0,
    discountPercentage: 0,
    priceWithGst: '',
    priceAfterDiscount: '',
    shippingAddress: '', // New Field
    customCharges: [], // Array of { name, amount }
    advancePercentage: 60,
    amountPaid: 0,
    paymentStatus: 'Advance Pending',
    companyId: '',
    clientId: '',
    productId: '',
    expectedDelivery: '',
    notes: '',
    timeline: 'Order Confirmed',
    gstRate: 5 // Default fixed 5%
  });

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  // Handle tab query parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'timeline' && id !== 'new') {
      setActiveTab('timeline');
    }
  }, [searchParams, id]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchCompanies(),
        fetchClients(),
        fetchProducts(),
        fetchChargeTypes(),
        id !== 'new' ? fetchOrder() : Promise.resolve()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrder = async () => {
    try {
      const response = await endpoints.orders.getById(id);
      const orderData = response.data.data;
      setOrder(orderData);

      // Format dates for input fields
      const formattedData = {
        ...orderData,
        orderDate: orderData.orderDate ? new Date(orderData.orderDate).toISOString().split('T')[0] : '',
        expectedDelivery: orderData.expectedDelivery ? new Date(orderData.expectedDelivery).toISOString().split('T')[0] : '',
        // Flatten populated fields to IDs for form compatibility
        companyId: orderData.companyId?._id || orderData.companyId,
        clientId: orderData.clientId?._id || orderData.clientId,
        productId: orderData.productId?._id || orderData.productId,
        customCharges: orderData.customCharges || [],
        discountPercentage: orderData.price && orderData.quantity && orderData.discount
          ? ((orderData.discount / (orderData.price * orderData.quantity)) * 100).toFixed(2)
          : 0
      };

      setFormData(formattedData);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Error', 'Failed to fetch order details');
    }
  };

  const fetchChargeTypes = async () => {
    try {
      const response = await endpoints.settings.getCharges();
      setChargeTypes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching charge types:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data: responseData } = await endpoints.companies.getAll();
      const data = responseData.data || responseData;
      setCompanies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    }
  };

  const fetchClients = async () => {
    try {
      const { data: responseData } = await endpoints.clients.getAll();
      const data = responseData.data || responseData;
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await endpoints.products.getAll();
      // Handle both direct array and nested data structure
      const data = response.data.data || response.data;
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const fetchNextOrderNumber = async (companyId) => {
    if (!companyId) return;
    try {
      const response = await endpoints.orders.getNextOrderNumber(companyId);
      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          orderNumber: response.data.data
        }));
      }
    } catch (error) {
      console.error('Error fetching next order number:', error);
    }
  };

  // Cleanup Object URLs on unmount
  useEffect(() => {
    return () => {
      stagedDocuments.forEach(doc => {
        if (doc.previewUrl) URL.revokeObjectURL(doc.previewUrl);
      });
    };
  }, [stagedDocuments]);

  // Handle Staging File
  const handleStageFile = (docType, file) => {
    const tempId = 'temp-' + Date.now() + Math.random();
    const previewUrl = URL.createObjectURL(file);

    setStagedDocuments(prev => [...prev, {
      file,
      docType,
      tempId,
      previewUrl
    }]);
  };

  // Handle Unstaging File
  const handleUnstageFile = (tempId) => {
    setStagedDocuments(prev => {
      const doc = prev.find(d => d.tempId === tempId);
      if (doc && doc.previewUrl) {
        URL.revokeObjectURL(doc.previewUrl);
      }
      return prev.filter(d => d.tempId !== tempId);
    });
  };

  const validateForm = () => {
    const missingFields = [];
    // Only check Order Number if not new (or if new and manual? usually auto-generated)
    // if (!formData.orderNumber) missingFields.push('Order Number'); 

    // Basic validation
    if (!formData.companyId) missingFields.push('Company');
    if (!formData.clientId) missingFields.push('Client');
    if (!formData.productId) missingFields.push('Product Line');
    if (!formData.price) missingFields.push('Price');

    if (missingFields.length > 0) {
      toast.error('Validation Error', `Please fill in: ${missingFields.join(', ')}`);
      return false;
    }

    if (!formData.quantity || formData.quantity <= 0) {
      toast.error('Validation Error', 'Quantity must be greater than 0');
      return false;
    }

    return true;
  };

  const uploadSingleFile = async (orderId, doc) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    let lastError;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // 1. Get Presigned URL
        const signResponse = await endpoints.orders.getUploadUrl(orderId, {
          fileName: doc.file.name,
          fileType: doc.file.type,
          docType: doc.docType
        });

        const { uploadUrl, publicUrl, key } = signResponse.data;

        // 2. Upload to R2 directly (Use axios to avoid api instance headers on presigned URL)
        await axios.put(uploadUrl, doc.file, {
          headers: {
            'Content-Type': doc.file.type
          }
        });

        // 3. Sync with Backend
        await endpoints.orders.syncDocument(orderId, {
          docType: doc.docType,
          newUrl: publicUrl,
          newKey: key,
          fileName: doc.file.name,
          fileType: doc.file.type
        });

        return doc.tempId; // Success
      } catch (error) {
        console.error(`Upload attempt ${attempt} failed for ${doc.file.name}:`, error);
        lastError = error;

        // Don't retry if it's a client error (e.g. valid file check fail, or 403) unless it's 429
        if (error.response && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429) {
          throw error; // Fail immediately on client errors (like validation)
        }

        if (attempt < MAX_RETRIES) {
          await delay(RETRY_DELAY);
        }
      }
    }

    throw lastError;
  };

  const processStagedUploads = async (targetOrderId) => {
    if (stagedDocuments.length === 0) {
      navigate('/orders');
      return;
    }

    setSaving(true);
    setUploadProgress({ total: stagedDocuments.length, current: 0 });

    // Create promises
    // Process uploads sequentially to avoid VersionError on backend
    const successfulTempIds = [];
    const failedDocs = [];

    for (let i = 0; i < stagedDocuments.length; i++) {
      const doc = stagedDocuments[i];
      try {
        const tempId = await uploadSingleFile(targetOrderId, doc);
        successfulTempIds.push(tempId);
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
        console.error(`Failed to upload ${doc.file.name}:`, errorMessage);
        failedDocs.push({ ...doc, error: errorMessage });
      }
      // Update progress
      setUploadProgress(prev => ({ ...prev, current: i + 1 }));
    }

    // Results processing is now done during the loop
    // results variable is no longer needed

    // Remove successful ones
    setStagedDocuments(prev => prev.filter(d => !successfulTempIds.includes(d.tempId)));

    setSaving(false);

    if (failedDocs.length === 0) {
      toast.success('All documents uploaded');
      navigate('/orders');
    } else {
      const errorDetails = failedDocs.map(d => `${d.file.name}: ${d.error}`).join('\n');
      toast.error('Upload Error', `${failedDocs.length} files failed to upload.\n${errorDetails}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);

      let targetId = id;

      if (id === 'new') {
        // If we already created it (retry scenario), don't create again
        if (createdOrderId) {
          await processStagedUploads(createdOrderId);
          return;
        }

        const response = await endpoints.orders.create(formData);
        const newOrderId = response.data.data._id;

        setCreatedOrderId(newOrderId);
        targetId = newOrderId;

        toast.success('Order Created', 'Uploading documents now...');

        // Now process uploads
        await processStagedUploads(newOrderId);

      } else {
        await endpoints.orders.update(id, formData);
        toast.success('Success', 'Order updated successfully');
        navigate('/orders'); // Added navigation for update success
        setSaving(false);
      }

    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Error', error.response?.data?.message || 'Failed to save order');
      setSaving(false);
    }
  };


  const handleFileUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataFile = new FormData();
    formDataFile.append('file', file);
    formDataFile.append('docType', docType);

    try {
      await endpoints.orders.uploadDocument(id, formDataFile);
      fetchOrder();
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handlePayment = async (paymentData) => {
    try {
      if (selectedPayment) {
        await endpoints.orders.updatePayment(id, selectedPayment._id, paymentData);
        toast.success('Success', 'Payment updated successfully');
      } else {
        await endpoints.orders.addPayment(id, paymentData);
        toast.success('Success', 'Payment recorded successfully');
      }
      setShowPaymentModal(false);
      setSelectedPayment(null);
      fetchOrder(); // Refresh data
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Error', error.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleDeletePayment = async (paymentId) => {
    setPaymentToDelete(paymentId);
    setIsDeletePaymentModalOpen(true);
  };

  const handleConfirmDeletePayment = async () => {
    if (!paymentToDelete) return;

    try {
      await endpoints.orders.deletePayment(id, paymentToDelete);
      toast.success('Success', 'Payment deleted successfully');
      fetchOrder();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Error', 'Failed to delete payment');
    } finally {
      setIsDeletePaymentModalOpen(false);
      setPaymentToDelete(null);
    }
  };

  // Live Pricing Calculation
  useEffect(() => {
    if (isEditing) {
      calculateTotal();
    }
  }, [
    formData.price,
    formData.quantity,
    formData.discount,
    formData.customCharges,
    isEditing
  ]);

  const calculateTotal = () => {
    const pricePerPiece = parseFloat(formData.price) || 0;
    const quantity = parseFloat(formData.quantity) || 0;
    const discount = parseFloat(formData.discount) || 0;

    // 1. Subtotal
    const subtotal = pricePerPiece * quantity;

    // 2. Taxable Value (Subtotal - Flat Discount)
    const taxableValue = Math.max(subtotal - discount, 0);

    // 3. GST (Fixed 5%)
    const gstRate = 5;
    const gstAmount = taxableValue * (gstRate / 100);

    // 4. Custom Charges
    const customChargesTotal = (formData.customCharges || []).reduce(
      (sum, charge) => sum + (parseFloat(charge.amount) || 0),
      0
    );

    // 5. Final Total
    const total = taxableValue + gstAmount + customChargesTotal;

    const currentPercentage = subtotal > 0 ? (discount / subtotal) * 100 : 0;

    setFormData(prev => ({
      ...prev,
      priceWithGst: total.toFixed(2),
      priceAfterDiscount: taxableValue.toFixed(2),
      discountPercentage: currentPercentage.toFixed(2)
    }));
  };

  // Helper to manage custom charges
  const addCustomCharge = () => {
    setFormData({
      ...formData,
      customCharges: [...formData.customCharges, { name: '', amount: '' }]
    });
  };

  const removeCustomCharge = (index) => {
    const newCharges = [...formData.customCharges];
    newCharges.splice(index, 1);
    setFormData({ ...formData, customCharges: newCharges });
  };

  const updateCustomCharge = (index, field, value) => {
    const newCharges = [...formData.customCharges];
    newCharges[index][field] = value;
    setFormData({ ...formData, customCharges: newCharges });
  };

  const getSelectedClient = () => {
    // Priority 1: Check if the populated order data matches the selected ID
    if (order?.clientId?._id && order.clientId._id === formData.clientId) {
      return order.clientId;
    }
    // Priority 2: Look up in the clients list
    return clients.find(c => c._id === formData.clientId);
  };

  const getPaymentPercentage = () => {
    const price = parseFloat(formData.priceWithGst) || 0;
    const paid = parseFloat(formData.amountPaid) || 0;
    if (price === 0) return 0;
    return Math.min(Math.round((paid / price) * 100), 100);
  };

  const getInitialPayment = () => {
    if (id === 'new') return formData.amountPaid || 0;
    // Try to find the first Advance payment
    const advancePayment = order?.payments?.find(p => p.type === 'Advance');
    if (advancePayment) return advancePayment.amount;
    // If no Advance payment, check if there's any first payment
    if (order?.payments && order.payments.length > 0) {
      return order.payments[0].amount;
    }
    // Fallback to formData if no payments found
    return formData.amountPaid || 0;
  };

  const getOrdinal = (num) => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  };

  const getPaymentFields = () => {
    if (id === 'new' || !order?.payments || order.payments.length === 0) return [];
    return order.payments.map((payment, index) => ({
      label: index === 0 ? 'Initial Amount Paid' : `${getOrdinal(index + 1)} Installment`,
      amount: payment.amount,
      date: payment.date,
      type: payment.type
    }));
  };

  const getTotalPaid = () => {
    if (id === 'new') return formData.amountPaid || 0;
    if (!order?.payments) return 0;
    return order.payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  };

  const getRecentActivities = () => {
    if (!order) return [];

    const activities = [];

    // Add timeline stage activities
    if (order.timelineStages && order.timelineStages.length > 0) {
      order.timelineStages.forEach(stage => {
        if (stage.startDate) {
          const stageIcons = {
            'Order Confirmed': { icon: '✅', color: 'bg-green-100' },
            'Fabric Purchase': { icon: '🧵', color: 'bg-purple-100' },
            'Fabric Cutting': { icon: '✂️', color: 'bg-blue-100' },
            'Embroidery/Printing': { icon: '🎨', color: 'bg-pink-100' },
            'Stitching': { icon: '🪡', color: 'bg-indigo-100' },
            'Packing': { icon: '📦', color: 'bg-orange-100' },
            'Shipped': { icon: '🚚', color: 'bg-yellow-100' },
            'Delivered': { icon: '🎉', color: 'bg-green-100' }
          };

          const stageInfo = stageIcons[stage.stage] || { icon: '📋', color: 'bg-gray-100' };
          activities.push({
            title: `${stage.stage} ${stage.status === 'completed' ? 'Completed' : 'Started'}`,
            time: new Date(stage.startDate),
            icon: stageInfo.icon,
            color: stageInfo.color
          });
        }
      });
    }

    // Add payment activities
    if (order.payments && order.payments.length > 0) {
      order.payments.forEach((payment, index) => {
        const paymentDate = new Date(payment.date);

        // Format date without time (since payments are stored at midnight UTC)
        const formattedDate = paymentDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        activities.push({
          title: `${payment.type} Payment Received - ₹${payment.amount.toLocaleString()}`,
          time: paymentDate,
          displayTime: formattedDate, // Use formatted date instead of time
          icon: '💰',
          color: 'bg-green-100'
        });
      });
    }

    // Synthetic "Order Created" removed in favor of DB log
    // Only add if not present in activityLog (backwards compatibility)
    const hasCreationLog = order.activityLog && order.activityLog.some(a => a.action === 'Order Created');

    if (order.createdAt && !hasCreationLog) {
      activities.push({
        title: 'Order Created',
        subtitle: 'Created by System',
        time: new Date(order.createdAt),
        icon: '📝',
        color: 'bg-gray-100'
      });
    }

    // Add generic activity logs (including documents)
    if (order.activityLog && order.activityLog.length > 0) {
      order.activityLog.forEach(log => {
        let icon = '📋';
        let color = 'bg-gray-100';

        if (log.action === 'Document Uploaded') {
          icon = 'huawei'; // Placeholder, will fix below
          // Actually, let's use standard icons
          icon = 'pw-office'; // Placeholder
          icon = '📂';
          color = 'bg-blue-100';
        } else if (log.action === 'Status Changed' || log.action === 'Order Updated') {
          icon = '✏️';
          color = 'bg-orange-100';
        } else if (log.action === 'Order Created') {
          icon = '📝';
          color = 'bg-green-100';
        }

        let performerName = 'Admin';
        if (log.performedBy) {
          if (log.performedBy.name) performerName = log.performedBy.name;
          else if (log.performedBy.firstName) performerName = `${log.performedBy.firstName} ${log.performedBy.lastName || ''}`.trim();
        }

        activities.push({
          title: log.action,
          subtitle: `${log.details} - by ${performerName}`,
          time: new Date(log.timestamp),
          icon: icon,
          color: color
        });
      });
    }

    // Filter out Order Created to handle it separately
    const orderCreatedActivity = activities.find(a => a.title === 'Order Created');
    const otherActivities = activities.filter(a => a.title !== 'Order Created');

    // Sort other activities by time (Oldest first)
    const sortedOthers = otherActivities.sort((a, b) => a.time - b.time);

    // Combine: Order Created first, then others
    const finalActivities = orderCreatedActivity ? [orderCreatedActivity, ...sortedOthers] : sortedOthers;

    // Return all activities
    return finalActivities.map(activity => ({
      ...activity,
      time: activity.displayTime || formatActivityTime(activity.time)
    }));
  };

  const formatActivityTime = (date) => {
    const activityDate = new Date(date);
    const now = new Date();

    // Reset time to midnight for accurate day comparison
    const activityDay = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const diffMs = now - activityDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor((today - activityDay) / 86400000);

    // For very recent activities (less than 1 minute)
    if (diffMins < 1) return 'Just now';

    // For activities within the last hour
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;

    // For activities today (show time)
    if (activityDay.getTime() === today.getTime()) {
      const hours = activityDate.getHours();
      const minutes = activityDate.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');
      return `Today at ${displayHours}:${displayMinutes} ${ampm}`;
    }

    // For activities yesterday
    if (activityDay.getTime() === yesterday.getTime()) {
      const hours = activityDate.getHours();
      const minutes = activityDate.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');
      return `Yesterday at ${displayHours}:${displayMinutes} ${ampm}`;
    }

    // For activities within the last 7 days
    if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }

    // For older activities, show full date
    return activityDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return <Loader fullScreen text="Loading order details..." />;
  }

  const selectedClient = getSelectedClient();
  const paymentPercentage = getPaymentPercentage();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500">
        <button onClick={() => navigate('/orders')} className="hover:text-gray-700">Orders</button>
        <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium">
          {id === 'new' ? 'New Order' : `ORD-${formData.orderNumber}`}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900">
              {id === 'new' ? 'New Order' : formData.orderNumber}
            </h1>
            {id !== 'new' && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full uppercase">
                {formData.timeline || 'Manufacturing'}
              </span>
            )}
          </div>
          {id !== 'new' && (
            <p className="text-sm text-gray-500 mt-1">
              Current Status: <span className="font-medium text-gray-700">{formData.timeline}</span>
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {id !== 'new' && !isEditing && (
            <>

              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit Order</span>
              </button>

            </>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      {id !== 'new' && (
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'details'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Order Details</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'timeline'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>Manufacturing Journey</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Activity History</span>
              </div>
            </button>
          </nav>
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'details' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Quantity */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-500 uppercase">Total Quantity</span>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val < 0) return; // Prevent negative input
                      setFormData({ ...formData, quantity: val });
                    }}
                    className="text-2xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none w-20"
                    placeholder="0"
                  />
                  <span className="text-2xl font-bold text-gray-900">Units</span>
                </div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{formData.quantity || '0'} Units</p>
              )}
            </div>

            {/* Order Status */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-500 uppercase">Order Status</span>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              {isEditing ? (
                <div className="relative">
                  <select
                    required
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                    className="w-full text-lg font-bold text-gray-900 bg-white border-2 border-blue-500 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                  >
                    <option value="Order Confirmed">Order Confirmed</option>
                    <option value="Fabric Purchase">Fabric Purchase</option>
                    <option value="Fabric Cutting">Fabric Cutting</option>
                    <option value="Embroidery/Printing">Embroidery/Printing</option>
                    <option value="Stitching">Stitching</option>
                    <option value="Packing">Packing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Order Completed">Order Completed</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{formData.timeline || 'Order Confirmed'}</p>
              )}

            </div>

            {/* Delivery Status */}
            <div className={`bg-white rounded-xl border p-6 transition-colors duration-200 ${formData.deliveryStatus === 'Delayed' ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-500 uppercase">Delivery Status</span>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${formData.deliveryStatus === 'Delayed' ? 'bg-red-100' : 'bg-green-100'}`}>
                  {formData.deliveryStatus === 'Delayed' ? (
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="relative">
                    <select
                      value={formData.deliveryStatus || 'On Time'}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        const updates = { deliveryStatus: newStatus };
                        if (newStatus === 'On Time') {
                          // If switching back to On Time, subtract any previous delay
                          const currentDelivery = new Date(formData.expectedDelivery);
                          if (!isNaN(currentDelivery.getTime()) && formData.delayDays > 0) {
                            currentDelivery.setDate(currentDelivery.getDate() - formData.delayDays);
                            updates.expectedDelivery = currentDelivery.toISOString().split('T')[0];
                          }
                          updates.delayDays = 0;
                        }
                        setFormData({ ...formData, ...updates });
                      }}
                      className={`w-full text-lg font-bold rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 appearance-none cursor-pointer border-2 ${formData.deliveryStatus === 'Delayed'
                        ? 'text-red-900 bg-white border-red-500 focus:ring-red-500'
                        : 'text-gray-900 bg-white border-blue-500 focus:ring-blue-500'
                        }`}
                    >
                      <option value="On Time">On Time</option>
                      <option value="Delayed">Delayed</option>
                    </select>
                    <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${formData.deliveryStatus === 'Delayed' ? 'text-red-600' : 'text-blue-600'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {formData.deliveryStatus === 'Delayed' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="block text-xs font-semibold text-red-600 uppercase mb-1 tracking-wider">Delayed by (days)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.delayDays || ''}
                        onChange={(e) => {
                          const days = parseInt(e.target.value) || 0;
                          const prevDays = formData.delayDays || 0;
                          const diff = days - prevDays;

                          const currentDelivery = new Date(formData.expectedDelivery);
                          if (!isNaN(currentDelivery.getTime())) {
                            currentDelivery.setDate(currentDelivery.getDate() + diff);
                            setFormData({
                              ...formData,
                              delayDays: days,
                              expectedDelivery: currentDelivery.toISOString().split('T')[0]
                            });
                          }
                        }}
                        className="w-full text-lg font-bold text-red-900 bg-red-50 border-2 border-red-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Enter days"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className={`text-2xl font-bold ${formData.deliveryStatus === 'Delayed' ? 'text-red-600' : 'text-green-600'}`}>
                    {formData.deliveryStatus || 'On Time'}
                  </p>
                  {formData.delayDays > 0 && (
                    <p className="text-sm font-medium text-red-500 mt-1">
                      Delayed by {formData.delayDays} {formData.delayDays === 1 ? 'day' : 'days'}
                    </p>
                  )}
                </div>
              )}
            </div>



            {/* Payment Status */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-500 uppercase">Payment Status</span>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
              </div>
              {isEditing ? (
                <div className="relative mt-2">
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                    className="w-full text-lg font-bold text-gray-900 bg-white border-2 border-blue-500 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="Advance Pending">Advance Pending</option>
                    <option value="Balance Pending">Balance Pending</option>
                    <option value="Full Settlement">Full Settlement</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              ) : (
                <>
                  <p className={`text-2xl font-bold ${formData.paymentStatus === 'Full Settlement' ? 'text-green-600' :
                    formData.paymentStatus === 'Cancelled' ? 'text-red-900' :
                      formData.paymentStatus === 'Advance Pending' ? 'text-red-600' :
                        'text-yellow-600'
                    }`}>
                    {formData.paymentStatus}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{paymentPercentage}% Paid</p>
                </>
              )}
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* General Information */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">General Information</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Order Number</label>
                      <input
                        type="text"
                        required
                        disabled={true} // Auto-generated, cannot be edited
                        value={formData.orderNumber}
                        onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                        placeholder="Enter order number"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Order Date</label>
                      <div className="w-full">
                        <DatePicker
                          selected={formData.orderDate ? new Date(formData.orderDate) : null}
                          onChange={(date) => {
                            if (date) {
                              // Adjust for timezone offset to prevent date shifting
                              const offset = date.getTimezoneOffset();
                              const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
                              setFormData({ ...formData, orderDate: adjustedDate.toISOString().split('T')[0] });
                            } else {
                              setFormData({ ...formData, orderDate: '' });
                            }
                          }}
                          dateFormat="MMMM d, yyyy"
                          disabled={!isEditing}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                          placeholderText="Select order date"
                          wrapperClassName="w-full"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expected Delivery Date <span className="text-red-500">*</span></label>
                      <div className="w-full">
                        <DatePicker
                          selected={formData.expectedDelivery ? new Date(formData.expectedDelivery) : null}
                          onChange={(date) => {
                            if (date) {
                              // Adjust for timezone offset to prevent date shifting
                              const offset = date.getTimezoneOffset();
                              const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
                              setFormData({ ...formData, expectedDelivery: adjustedDate.toISOString().split('T')[0] });
                            } else {
                              setFormData({ ...formData, expectedDelivery: '' });
                            }
                          }}
                          dateFormat="MMMM d, yyyy"
                          minDate={new Date()}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                          placeholderText="Select delivery date"
                          wrapperClassName="w-full"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select
                          required
                          disabled={!isEditing}
                          value={formData.companyId}
                          onChange={(e) => {
                            const selectedCompanyId = e.target.value;
                            setFormData({
                              ...formData,
                              companyId: selectedCompanyId,
                              clientId: '' // Reset client when company changes
                            });
                            if (id === 'new' && selectedCompanyId) {
                              fetchNextOrderNumber(selectedCompanyId);
                            }
                          }}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 appearance-none cursor-pointer bg-white"
                        >
                          <option value="">Select Company</option>
                          {companies.map(company => (
                            <option key={company._id} value={company._id}>
                              {company.companyName}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Client (Point of Contact)</label>
                      <div className="relative">
                        <select
                          required
                          disabled={!isEditing || !formData.companyId}
                          value={formData.clientId}
                          onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 appearance-none cursor-pointer bg-white"
                        >
                          <option value="">Select Client</option>
                          {clients
                            .filter(client => {
                              const cId = typeof client.companyId === 'object' ? client.companyId?._id : client.companyId;
                              return String(cId || '') === String(formData.companyId || '');
                            })
                            .map(client => (
                              <option key={client._id} value={client._id}>
                                {client.name}
                              </option>
                            ))
                          }
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Shipping Address <span className="text-red-500">*</span>
                      </label>
                      <AddressSelector
                        company={companies.find(c => c._id === formData.companyId)}
                        onSelect={(addr) => setFormData({ ...formData, shippingAddress: addr })}
                        disabled={!isEditing}
                      />
                      <textarea
                        required
                        disabled={!isEditing}
                        value={formData.shippingAddress}
                        onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                        placeholder="Enter full shipping address"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 resize-none"
                        rows="3"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Product Line</label>
                      <div className="relative">
                        <select
                          required
                          disabled={!isEditing}
                          value={formData.productId}
                          onChange={(e) => {
                            const selectedProductId = e.target.value;
                            const selectedProduct = products.find(p => p._id === selectedProductId);
                            setFormData({
                              ...formData,
                              productId: selectedProductId,
                              price: selectedProduct ? selectedProduct.basePrice : formData.price
                            });
                          }}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 appearance-none cursor-pointer bg-white"
                        >
                          <option value="">Select Product</option>
                          {products.map(product => (
                            <option key={product._id} value={product._id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price Per Piece</label>
                      <div className="relative">
                        <span className="absolute left-4 top-3.5 text-gray-500 font-medium">₹</span>
                        <input
                          type="number"
                          required
                          disabled={!isEditing}
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="0.00"
                          className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Discount (%)</label>
                        <div className="relative">
                          <span className="absolute right-4 top-3.5 text-gray-500 font-medium">%</span>
                          <input
                            type="number"
                            disabled={!isEditing}
                            value={formData.discountPercentage}
                            onChange={(e) => {
                              const val = e.target.value;
                              const percentage = parseFloat(val) || 0;
                              const price = parseFloat(formData.price) || 0;
                              const quantity = parseFloat(formData.quantity) || 0;
                              const subtotal = price * quantity;

                              const flatAmount = (subtotal * percentage) / 100;

                              setFormData({
                                ...formData,
                                discountPercentage: val, // Keep string to allow typing decimals
                                discount: flatAmount.toFixed(2) // Update flat amount
                              });
                            }}
                            placeholder="0"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Discount (₹)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-gray-500 font-medium">₹</span>
                          <input
                            type="number"
                            disabled={!isEditing}
                            value={formData.discount}
                            onChange={(e) => {
                              const val = e.target.value;
                              const flatAmount = parseFloat(val) || 0;
                              const price = parseFloat(formData.price) || 0;
                              const quantity = parseFloat(formData.quantity) || 0;
                              const subtotal = price * quantity;

                              let percentage = 0;
                              if (subtotal > 0) {
                                percentage = (flatAmount / subtotal) * 100;
                              }

                              setFormData({
                                ...formData,
                                discount: val, // Keep string for typing
                                discountPercentage: percentage.toFixed(2)
                              });
                            }}
                            placeholder="0"
                            className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Taxable Value (After Discount)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-3.5 text-gray-500 font-medium">₹</span>
                        <input
                          type="number"
                          disabled
                          value={formData.priceAfterDiscount || 0}
                          className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">GST Rate (Fixed)</label>
                      <div className="relative">
                        <span className="absolute right-4 top-3.5 text-gray-500 font-medium">%</span>
                        <input
                          type="number"
                          disabled
                          value={5}
                          className="w-full pl-4 pr-8 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                        />
                      </div>
                    </div>

                    {/* Custom Charges Section - Spans 2 columns */}
                    <div className="md:col-span-2 bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-center mb-4">
                        <label className="block text-sm font-medium text-gray-900">Custom Charges (Shipping, Packaging, etc.)</label>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={addCustomCharge}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Charge
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        {formData.customCharges.map((charge, index) => (
                          <div key={index} className="flex gap-4 items-center">
                            <div className="flex-1">
                              {/* Charge Type Dropdown */}
                              <div className="relative">
                                <select
                                  required
                                  disabled={!isEditing}
                                  value={charge.name}
                                  onChange={(e) => updateCustomCharge(index, 'name', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white cursor-pointer"
                                >
                                  <option value="">Select Charge Type</option>
                                  {chargeTypes.map((type, i) => (
                                    <option key={i} value={type}>
                                      {type}
                                    </option>
                                  ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                            </div>

                            {/* Amount Input - Only visible if name is selected */}
                            {charge.name && (
                              <div className="w-40 relative fade-in">
                                <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                <input
                                  type="number"
                                  disabled={!isEditing}
                                  value={charge.amount}
                                  onChange={(e) => updateCustomCharge(index, 'amount', e.target.value)}
                                  placeholder="Amount"
                                  className="w-full pl-6 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            )}

                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => removeCustomCharge(index)}
                                className="text-red-500 hover:text-red-700 p-2"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                        {formData.customCharges.length === 0 && (
                          <p className="text-sm text-gray-500 italic text-center py-2">No custom charges added</p>
                        )}
                      </div>
                    </div>




                    {/* For new orders, show editable Initial Amount Paid */}
                    {id === 'new' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Initial Amount Paid</label>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-gray-500 font-medium">₹</span>
                          <input
                            type="number"
                            value={formData.amountPaid === 0 ? '' : formData.amountPaid}
                            onChange={(e) => {
                              const val = e.target.value;

                              // If empty, set to 0 or empty string in state, but display empty
                              if (val === '') {
                                setFormData({
                                  ...formData,
                                  amountPaid: 0,
                                  advancePercentage: 0
                                });
                                return;
                              }

                              let amount = parseFloat(val);
                              if (isNaN(amount)) amount = 0;

                              const price = parseFloat(formData.priceWithGst) || 0;

                              if (price > 0 && amount > price) {
                                amount = price;
                                toast.error('Limit Reached', 'Initial payment cannot exceed total amount.');
                              }

                              let newPercentage = formData.advancePercentage;

                              if (price > 0) {
                                newPercentage = ((amount / price) * 100).toFixed(2);
                              }

                              setFormData({
                                ...formData,
                                amountPaid: amount,
                                advancePercentage: newPercentage
                              });
                            }}
                            placeholder="0.00"
                            className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* For existing orders, show all payment installments as read-only */}
                    {id !== 'new' && getPaymentFields().map((payment, index) => (
                      <div key={index}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{payment.label}</label>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-gray-500 font-medium">₹</span>
                          <input
                            type="number"
                            disabled
                            value={payment.amount}
                            className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                          />
                        </div>
                      </div>
                    ))}

                    {/* Total Amount Paid - shown for existing orders */}
                    {id !== 'new' && order?.payments && order.payments.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount Paid</label>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-gray-500 font-medium">₹</span>
                          <input
                            type="number"
                            disabled
                            value={getTotalPaid()}
                            className="w-full pl-8 pr-4 py-3 border-2 border-blue-200 rounded-lg bg-blue-50 text-blue-700 font-semibold"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      disabled={!isEditing}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Enter special handling or manufacturing instructions..."
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 resize-none"
                      rows="4"
                    />
                  </div>
                </form>
              </div>

              {/* Documents & Attachments */}
              {id === 'new' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <OrderDocumentManager
                    orderId={id}
                    documents={order?.documents}
                    onUpdate={fetchOrder}
                    isEditing={true} // Always allow editing on creation
                    stagedDocuments={stagedDocuments}
                    onStageFile={handleStageFile}
                    onUnstageFile={handleUnstageFile}
                  />
                </div>
              )}

              {id !== 'new' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <OrderDocumentManager
                    orderId={id}
                    documents={order?.documents}
                    onUpdate={fetchOrder}
                    isEditing={isEditing}
                    stagedDocuments={stagedDocuments}
                    onStageFile={handleStageFile}
                    onUnstageFile={handleUnstageFile}
                  />
                </div>
              )}
            </div>

            {/* Right Column - Client & Financial */}
            <div className="space-y-6">
              {/* Client & POC */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Client & POC</h2>
                </div>

                {selectedClient ? (
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {selectedClient.name?.charAt(0) || 'M'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedClient.name || 'Modern Threads LLC'}</h3>
                        <p className="text-sm text-gray-500">Premium Retailer</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Primary Contact</div>
                      <div>
                        <p className="font-medium text-gray-900">{selectedClient.name || 'Robert D. Vance'}</p>
                        <div className="flex items-center space-x-2 mt-2 text-sm text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>{selectedClient.email || 'r.vance@modernthreads.com'}</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1 text-sm text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{selectedClient.phoneNumber || '+1 (555) 902-3411'}</span>
                        </div>
                      </div>

                      {id !== 'new' && (
                        <div className="flex space-x-2 pt-4">
                          <button
                            onClick={() => {
                              if (selectedClient?.email) {
                                window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${selectedClient.email}`, '_blank');
                              }
                            }}
                            disabled={!selectedClient?.email}
                            className={`btn-primary flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium ${!selectedClient?.email ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            Message
                          </button>
                          <button
                            onClick={() => navigate(`/clients/${formData.clientId}`)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                          >
                            View Profile
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm mb-3">No client selected</p>
                    <p className="text-xs text-gray-400 mb-4">Select a client from the form to view details</p>
                  </div>
                )}
              </div>

              {/* Financial Status */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Financial Status</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Contract Value</span>
                    <span className="text-lg font-bold text-gray-900">₹{parseFloat(formData.priceWithGst || 0).toFixed(2)}</span>
                  </div>



                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Amount Paid</span>
                      <span className="text-sm font-semibold text-blue-600">
                        ₹{parseFloat(formData.amountPaid || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${formData.priceWithGst > 0 ? Math.min((formData.amountPaid / formData.priceWithGst) * 100, 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Balance Due</span>
                      <span className="text-sm font-semibold text-orange-600">
                        ₹{Math.max((formData.priceWithGst - formData.amountPaid), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Payment History Table */}
                  {order?.payments?.length > 0 && (
                    <div className="border-t border-gray-200 mt-6 pt-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-3">Payment History</h3>
                      <div className="overflow-x-auto rounded-xl border border-gray-100">
                        <table className="min-w-full">
                          <thead className="bg-[#0d3858] text-white">
                            <tr>
                              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider">Date</th>
                              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider">Amount</th>
                              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider">Type</th>
                              <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {order.payments.map((payment) => (
                              <tr key={payment._id}>
                                <td className="px-3 py-2 text-xs text-gray-900">
                                  {new Date(payment.date).toLocaleDateString()}
                                </td>
                                <td className="px-3 py-2 text-xs font-medium text-gray-900">
                                  ₹{payment.amount.toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-500">
                                  {payment.type}
                                </td>
                                <td className="px-3 py-2 text-xs text-right space-x-2">
                                  <button
                                    onClick={() => {
                                      setSelectedPayment(payment);
                                      setShowPaymentModal(true);
                                    }}
                                    disabled={!isEditing}
                                    className={`text-blue-600 hover:text-blue-900 ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeletePayment(payment._id)}
                                    disabled={!isEditing}
                                    className={`text-red-600 hover:text-red-900 ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {id !== 'new' && (
                    <div className="border-t border-gray-200 mt-4 pt-4">
                      <button
                        onClick={() => {
                          setSelectedPayment(null);
                          setShowPaymentModal(true);
                        }}
                        disabled={!isEditing}
                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center justify-center space-x-2 ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Record New Payment</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              {id !== 'new' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
                    <button
                      onClick={() => fetchOrder()}
                      className="text-gray-400 hover:text-gray-600"
                      title="Refresh activities"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(() => {
                      const allActivities = getRecentActivities();
                      // Show only top 3 recent activities in the card
                      const displayedActivities = allActivities.slice(0, 3);

                      if (allActivities.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </div>
                            <p className="text-gray-500 text-sm">No recent activity</p>
                          </div>
                        );
                      }

                      return (
                        <>
                          {displayedActivities.map((activity, index) => (
                            <div key={index} className="flex items-start space-x-3">
                              <div className={`w-8 h-8 ${activity.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                <span className="text-sm">{activity.icon}</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                                {activity.subtitle && <p className="text-xs text-gray-600 mb-0.5">{activity.subtitle}</p>}
                                <p className="text-xs text-gray-500">{activity.time}</p>
                              </div>
                            </div>
                          ))}

                          {allActivities.length > 3 && (
                            <button
                              onClick={() => {
                                setActiveTab('history');
                                window.scrollTo(0, 0);
                              }}
                              className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium mt-4 pt-2 border-t border-gray-100"
                            >
                              View Full History
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : activeTab === 'history' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Activity History</h2>
                <p className="text-sm text-gray-500">Full chronology of changes and updates</p>
              </div>
            </div>

            <div className="space-y-6">
              {getRecentActivities().map((activity, index) => (
                <div key={index} className="flex items-start space-x-4 pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className={`w-10 h-10 ${activity.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <span className="text-lg">{activity.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="text-base font-medium text-gray-900">{activity.title}</h3>
                      <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{activity.time}</span>
                    </div>
                    {activity.subtitle && <p className="text-sm text-gray-600 mt-1">{activity.subtitle}</p>}
                  </div>
                </div>
              ))}
              {getRecentActivities().length === 0 && (
                <p className="text-center text-gray-500">No activity recorded for this order.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Timeline View - Manufacturing Journey */}
          {/* Timeline Header */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Manufacturing Journey</h2>
            </div>
            <p className="text-sm text-gray-600">
              Track the complete production lifecycle of {formData.orderNumber}
            </p>
          </div>

          <ManufacturingTimeline
            timeline={formData.timeline}
            timelineStages={formData.timelineStages} // Ensure this is available in formData
            orderDate={formData.orderDate}
            delayDays={formData.delayDays}
            quantity={formData.quantity}
          />
        </div>
      )}

      {/* Save Changes Button - Below Form */}
      {
        isEditing && (
          <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 -mx-8 -mb-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Unsaved changes</span> - Make sure to save your changes before leaving
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    if (id === 'new') {
                      navigate('/orders');
                    } else {
                      setIsEditing(false);
                      fetchOrder(); // Reset form data
                    }
                  }}
                  disabled={saving}
                  className="px-6 py-2.5 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="btn-primary flex items-center space-x-2 px-6 py-2.5 text-white rounded-lg font-medium"
                >
                  {saving ? (
                    <>
                      <ButtonLoader />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      }
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedPayment(null);
        }}
        onConfirm={handlePayment}
        totalDue={Math.max((formData.priceWithGst - formData.amountPaid) + (selectedPayment ? selectedPayment.amount : 0), 0)}
        title={selectedPayment ? "Edit Payment" : "Record Payment"}
        initialPayment={selectedPayment}
      />
      <ConfirmationModal
        isOpen={isDeletePaymentModalOpen}
        onClose={() => {
          setIsDeletePaymentModalOpen(false);
          setPaymentToDelete(null);
        }}
        onConfirm={handleConfirmDeletePayment}
        title="Delete Payment"
        message="Are you sure you want to delete this payment record? This action cannot be undone."
        variant="danger"
      />
    </div >
  );
};

export default OrderDetails;

