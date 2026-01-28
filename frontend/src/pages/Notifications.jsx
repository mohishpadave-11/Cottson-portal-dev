import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { endpoints } from '../config/api';
import Loader from '../components/Loader';

const Notifications = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // We are treating "Open" or "Unresolved" complaints as notifications
      const response = await endpoints.complaints.getAll();
      const data = Array.isArray(response.data) ? response.data : (response.data.data || []);

      // Filter for new/open complaints and sort by newest first
      // You might want to filter only 'Open' status if resolved ones shouldn't appear
      const newComplaints = data
        .filter(c => c.status === 'Open' || c.status === 'In Progress')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setNotifications(newComplaints);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
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

  const handleNotificationClick = async (complaintId, isRead) => {
    try {
      if (!isRead) {
        await endpoints.complaints.markAsRead(complaintId);
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
    // Navigate to the full complaints dashboard
    navigate('/complaints');
  };

  if (loading) return <Loader fullScreen text="Loading notifications..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">Updates on client complaints and issues</p>
        </div>
        <button
          onClick={fetchNotifications}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          title="Refresh"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p>No new notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => handleNotificationClick(notification._id, notification.isReadByAdmin)}
                className={`group p-4 hover:bg-blue-50 transition-colors cursor-pointer flex items-start space-x-4 ${!notification.isReadByAdmin ? 'bg-blue-50/50' : ''}`}
              >
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700">
                      New Complaint Received #{notification._id.slice(-6).toUpperCase()}
                    </h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {getTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 truncate">
                    Subject: <span className="font-medium">{notification.subject}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    From: {notification.clientName}
                  </p>
                </div>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${notification.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {notification.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
