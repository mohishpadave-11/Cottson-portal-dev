import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config/api';
import Loader from '../components/Loader';

const ClientOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [id, navigate]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/orders/${id}`);

      const userStr = localStorage.getItem('user');

      if (!userStr) {
        navigate('/login');
        return;
      }

      const user = JSON.parse(userStr);
      const orderData = response.data.data;

      // Verify this order belongs to the logged-in user's company
      const orderCompanyId = typeof orderData.companyId === 'object' && orderData.companyId !== null
        ? orderData.companyId._id
        : orderData.companyId;

      const userCompanyId = typeof user.companyId === 'object' && user.companyId !== null
        ? user.companyId._id
        : user.companyId;

      if (orderCompanyId?.toString() !== userCompanyId?.toString()) {
        navigate('/client/orders');
        return;
      }

      setOrder(orderData);
    } catch (error) {
      console.error('Error fetching order details:', error);
      navigate('/client/orders');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentPercentage = () => {
    if (!order) return 0;
    const price = parseFloat(order.priceWithGst) || 0;
    const paid = parseFloat(order.amountPaid) || 0;
    if (price === 0) return 0;
    return Math.min(Math.round((paid / price) * 100), 100);
  };

  const formatActivityTime = (date) => {
    const activityDate = new Date(date);
    const now = new Date();

    const activityDay = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const diffMs = now - activityDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffDays = Math.floor((today - activityDay) / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;

    if (activityDay.getTime() === today.getTime()) {
      const hours = activityDate.getHours();
      const minutes = activityDate.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');
      return `Today at ${displayHours}:${displayMinutes} ${ampm}`;
    }

    if (activityDay.getTime() === yesterday.getTime()) {
      const hours = activityDate.getHours();
      const minutes = activityDate.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');
      return `Yesterday at ${displayHours}:${displayMinutes} ${ampm}`;
    }

    if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }

    return activityDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
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
            'Fabric Purchase': { icon: '🧵', color: 'bg-blue-100' },
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
      order.payments.forEach((payment) => {
        activities.push({
          title: `${payment.type} Payment Received - ₹${payment.amount.toLocaleString()}`,
          time: new Date(payment.date),
          icon: '💰',
          color: 'bg-green-100'
        });
      });
    }

    // Add order creation activity
    if (order.createdAt) {
      activities.push({
        title: 'Order Created',
        time: new Date(order.createdAt),
        icon: '📝',
        color: 'bg-gray-100'
      });
    }

    return activities
      .sort((a, b) => b.time - a.time)
      .slice(0, 5)
      .map(activity => ({
        ...activity,
        time: formatActivityTime(activity.time)
      }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader size="large" text="Loading order details..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Order not found</p>
      </div>
    );
  }

  const paymentPercentage = getPaymentPercentage();
  const recentActivities = getRecentActivities();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/client/orders')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
            <p className="text-sm text-gray-500 mt-1">Order #{order.orderNumber}</p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/client/orders/${id}/timeline`)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>View Timeline</span>
        </button>
      </div>

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
          <p className="text-2xl font-bold text-gray-900">{order.quantity || '0'} Units</p>
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase">Process Phase</span>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{order.timeline || 'Initial Stage'}</p>
        </div>

        {/* Delivery Status */}
        <div className={`bg-white rounded-xl border p-6 transition-colors duration-200 ${order.deliveryStatus === 'Delayed' ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase">Delivery Status</span>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${order.deliveryStatus === 'Delayed' ? 'bg-red-100' : 'bg-green-100'}`}>
              {order.deliveryStatus === 'Delayed' ? (
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
          <div>
            <p className={`text-2xl font-bold ${order.deliveryStatus === 'Delayed' ? 'text-red-600' : 'text-green-600'}`}>
              {order.deliveryStatus || 'On Time'}
            </p>
            {order.delayDays > 0 && (
              <p className="text-sm font-medium text-red-500 mt-1">
                Delayed by {order.delayDays} {order.delayDays === 1 ? 'day' : 'days'}
              </p>
            )}
          </div>
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
          <>
            <p className="text-2xl font-bold text-gray-900">{paymentPercentage}% Paid</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${paymentPercentage}%` }}></div>
            </div>
          </>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Order Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              General Information
            </h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">Order Number</label>
                <p className="text-gray-900 font-bold text-lg">{order.orderNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">Order Date</label>
                <p className="text-gray-900 font-semibold">{new Date(order.orderDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">Expected Delivery</label>
                <p className="text-gray-900 font-semibold">{order.expectedDelivery ? new Date(order.expectedDelivery).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not Set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">Company</label>
                <p className="text-gray-900 font-semibold">{order.companyId?.companyName || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Product Specification
            </h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">Product Name</label>
                <p className="text-gray-900 font-semibold">{order.productId?.productName || order.productId?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">Quantity</label>
                <p className="text-gray-900 font-bold">{order.quantity} Units</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">Fabric Type</label>
                <p className="text-gray-900">{order.fabricType || 'Standard'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">Fabric Color</label>
                <p className="text-gray-900">{order.fabricColor || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">Fabric GSM</label>
                <p className="text-gray-900">{order.fabricGsm || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">Fabric Width</label>
                <p className="text-gray-900">{order.fabricWidth || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          {order.notes && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Instructions & Notes</h2>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <p className="text-gray-700 whitespace-pre-wrap italic">{order.notes}</p>
              </div>
            </div>
          )}

          {/* Payment History */}
          {order.payments && order.payments.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Payment History
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-tight">Date</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-tight">Type</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-500 uppercase tracking-tight">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.payments.map((payment, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-700">{new Date(payment.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${payment.type === 'Advance' ? 'bg-blue-100 text-blue-700' : 'bg-blue-100 text-blue-700'}`}>
                            {payment.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">₹{payment.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Brief */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 z-0"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-6 relative z-10">Financial Overview</h2>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                <span className="text-gray-600">Base Price</span>
                <span className="font-semibold text-gray-900">₹{order.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                <span className="text-gray-600">GST ({order.gstRate || 18}%)</span>
                <span className="font-semibold text-gray-900">₹{(order.priceWithGst - order.price).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-900 font-bold">Total Amount</span>
                <span className="font-bold text-xl text-blue-600">₹{order.priceWithGst.toLocaleString()}</span>
              </div>
              <div className="pt-4 border-t border-gray-100 mt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Paid</span>
                  <span className="text-sm font-bold text-green-600">₹{order.amountPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Balance Due</span>
                  <span className="text-sm font-bold text-red-500">₹{(order.priceWithGst - order.amountPaid).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
            <div className="space-y-6">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`w-8 h-8 ${activity.color} rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border border-white`}>
                      <span className="text-sm">{activity.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 leading-tight">{activity.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <p className="text-sm text-gray-500">Starting production details...</p>
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Attachments</h2>
            <div className="space-y-3">
              {order.documents && (Object.entries(order.documents).filter(([_, v]) => v && (typeof v === 'string' || (Array.isArray(v) && v.length > 0))).length > 0) ? (
                Object.entries(order.documents).map(([key, value]) => {
                  if (Array.isArray(value)) {
                    return value.map((url, i) => (
                      <a
                        key={`${key}-${i}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all border border-gray-100 hover:border-blue-200 group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center text-blue-600 group-hover:bg-white transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="text-sm font-semibold text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()} {value.length > 1 ? i + 1 : ''}</span>
                        </div>
                        <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ));
                  }
                  return value && (
                    <a
                      key={key}
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all border border-gray-100 hover:border-blue-200 group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center text-blue-600 group-hover:bg-white transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="text-sm font-semibold text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  );
                })
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-xs text-gray-500">No documents uploaded yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default ClientOrderDetails;
