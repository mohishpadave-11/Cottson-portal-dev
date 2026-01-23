import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import Loader from '../components/Loader';

const ClientNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, orders, complaints
  const [clientInfo, setClientInfo] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(userStr);
    setClientInfo(user);
    fetchNotifications(user);
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filter, notifications]);

  const fetchNotifications = async (user) => {
    try {
      setLoading(true);

      // Fetch orders and complaints in parallel
      const [ordersResponse, complaintsResponse] = await Promise.all([
        api.get('/api/orders', { params: { companyId: user.companyId } }),
        api.get('/api/complaints')
      ]);

      const orders = ordersResponse.data.data;
      const complaints = complaintsResponse.data.filter(c => c.clientId === user._id);

      // Create notifications from orders
      const orderNotifications = orders.map(order => ({
        id: `order-${order._id}`,
        type: 'order',
        title: `Order #${order.orderNumber} Update`,
        message: `Your order status: ${order.currentStatus || 'Processing'}`,
        status: order.currentStatus,
        timestamp: order.updatedAt || order.createdAt,
        orderId: order._id,
        orderNumber: order.orderNumber,
        priority: order.paymentStatus === 'Payment Completed' ? 'low' : 'medium',
        read: false
      }));

      // Create notifications from complaints
      const complaintNotifications = complaints.map(complaint => ({
        id: `complaint-${complaint._id}`,
        type: 'complaint',
        title: `Complaint Update: ${complaint.subject}`,
        message: complaint.status === 'Resolved'
          ? 'Your complaint has been resolved'
          : complaint.status === 'In Progress'
            ? 'Your complaint is being reviewed'
            : 'Your complaint has been received',
        status: complaint.status,
        timestamp: complaint.updatedAt || complaint.createdAt,
        complaintId: complaint._id,
        priority: complaint.priority.toLowerCase(),
        read: complaint.isReadByClient
      }));

      // Combine and sort by timestamp
      const allNotifications = [...orderNotifications, ...complaintNotifications]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setNotifications(allNotifications);
      setFilteredNotifications(allNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    if (filter === 'all') {
      setFilteredNotifications(notifications);
    } else {
      setFilteredNotifications(notifications.filter(n => n.type === filter.replace('s', '')));
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  const handleNotificationClick = async (notification) => {
    markAsRead(notification.id);

    if (notification.type === 'order') {
      navigate(`/client/orders/${notification.orderId}`);
    } else if (notification.type === 'complaint') {
      if (!notification.read) {
        try {
          await api.patch(`/api/complaints/${notification.complaintId}/mark-as-read`);
        } catch (error) {
          console.error('Error marking as read:', error);
        }
      }
      // Could navigate to complaint details if you create that page
      navigate('/client/complaints');
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';

    return 'Just now';
  };

  const getNotificationIcon = (type) => {
    if (type === 'order') {
      return (
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
      );
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-red-500';
      case 'medium': return 'border-l-4 border-yellow-500';
      case 'low': return 'border-l-4 border-green-500';
      default: return 'border-l-4 border-gray-300';
    }
  };

  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    orders: notifications.filter(n => n.type === 'order').length,
    complaints: notifications.filter(n => n.type === 'complaint').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader size="large" text="Loading notifications..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Stay updated with your orders and complaints
          </p>
        </div>
        <button
          onClick={() => fetchNotifications(clientInfo)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase">Total</span>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase">Unread</span>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.unread}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase">Orders</span>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.orders}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase">Complaints</span>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.complaints}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            All Notifications
          </button>
          <button
            onClick={() => setFilter('orders')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'orders'
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            Order Updates
          </button>
          <button
            onClick={() => setFilter('complaints')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'complaints'
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            Complaint Responses
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-lg font-medium text-gray-900">No notifications</p>
            <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? 'bg-purple-50/30' : ''
                  } ${getPriorityColor(notification.priority)}`}
              >
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  {getNotificationIcon(notification.type)}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className={`text-base font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="ml-2 w-2 h-2 bg-purple-600 rounded-full flex-shrink-0 mt-2"></span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{getTimeAgo(notification.timestamp)}</span>
                      </div>

                      {notification.type === 'order' && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                          Order #{notification.orderNumber}
                        </span>
                      )}

                      {notification.status && (
                        <span className={`px-2 py-1 rounded-full font-medium ${notification.status === 'Resolved' || notification.status === 'Dispatched'
                          ? 'bg-green-100 text-green-700'
                          : notification.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                          }`}>
                          {notification.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mark All as Read */}
      {stats.unread > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              setNotifications(notifications.map(n => ({ ...n, read: true })));
            }}
            className="px-6 py-2 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
          >
            Mark all as read
          </button>
        </div>
      )}
    </div>
  );
};

export default ClientNotifications;
