import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import Loader from '../components/Loader';

import { COMPLAINT_STATUS, PRIORITY_LEVELS } from '../constants/complaintStatus';
import Pagination from '../components/Pagination';

const ClientComplaints = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active'); // active, resolved, new
  const [complaints, setComplaints] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    orderId: '',
    subject: '',
    description: '',
    priority: PRIORITY_LEVELS.MEDIUM
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        navigate('/login');
        return;
      }
      const user = JSON.parse(userStr);

      const [complaintsRes, ordersRes] = await Promise.all([
        api.get('/api/complaints'),
        api.get('/api/orders', { params: { companyId: user.companyId } })
      ]);

      setComplaints(complaintsRes.data);
      setOrders(ordersRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage('');

    try {
      const userStr = localStorage.getItem('user');
      const user = JSON.parse(userStr);

      const complaintData = {
        ...formData,
        clientId: user._id,
        clientName: user.name || (user.firstName + ' ' + user.lastName),
        clientEmail: user.email,
        status: COMPLAINT_STATUS.OPEN
      };

      await api.post('/api/complaints', complaintData);
      setSuccessMessage('Complaint submitted successfully! Our team will review it shortly.');

      // Refresh list
      const res = await api.get('/api/complaints');
      setComplaints(res.data);

      // Reset form
      setFormData({
        orderId: '',
        subject: '',
        description: '',
        priority: PRIORITY_LEVELS.MEDIUM
      });

      setTimeout(() => {
        setSuccessMessage('');
        setActiveTab('active'); // Switch to list view
      }, 2000);

    } catch (error) {
      console.error('Error submitting complaint:', error);
      alert('Failed to submit complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeComplaints = complaints.filter(c =>
    [COMPLAINT_STATUS.OPEN, COMPLAINT_STATUS.IN_PROGRESS].includes(c.status)
  );

  const resolvedComplaints = complaints.filter(c =>
    [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.CLOSED].includes(c.status)
  );

  const getStatusBadge = (status) => {
    let color = 'bg-gray-100 text-gray-800';
    if (status === COMPLAINT_STATUS.OPEN) color = 'bg-blue-100 text-blue-800';
    if (status === COMPLAINT_STATUS.RESOLVED) color = 'bg-green-100 text-green-800';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {status}
      </span>
    );
  };

  if (loading) return <Loader fullScreen text="Loading complaints..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Support & Complaints</h1>
        <button
          onClick={() => setActiveTab('new')}
          className="btn-primary text-white px-4 py-2 rounded-lg flex items-center shadow-sm"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Raise New Complaint
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => { setActiveTab('active'); setCurrentPage(1); }}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'active'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Active Complaints ({activeComplaints.length})
          </button>
          <button
            onClick={() => { setActiveTab('resolved'); setCurrentPage(1); }}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'resolved'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Resolved History
          </button>
          {activeTab === 'new' && (
            <button
              className="whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm border-blue-500 text-blue-600"
            >
              New Complaint
            </button>
          )}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'new' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Complaint Details</h2>
              {successMessage && (
                <div className="mb-4 bg-green-50 text-green-700 p-4 rounded-lg">
                  {successMessage}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Order Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Order <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.orderId}
                    onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose an order...</option>
                    {orders.map(order => (
                      <option key={order._id} value={order._id}>
                        Order #{order.orderNumber} - {new Date(order.orderDate).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.values(PRIORITY_LEVELS).map(priority => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description <span className="text-red-500">*</span></label>
                  <textarea
                    required
                    rows={5}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Provide details..."
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('active')}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          {/* Help Sidebar (Simplified) */}
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-bold text-blue-900 mb-2">Support Policy</h3>
              <p className="text-sm text-blue-800">We aim to respond to all complaints within 24-48 hours. Resolved complaints will be notified via email.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {(() => {
            const currentList = activeTab === 'active' ? activeComplaints : resolvedComplaints;
            const indexOfLastItem = currentPage * itemsPerPage;
            const indexOfFirstItem = indexOfLastItem - itemsPerPage;
            const currentItems = currentList.slice(indexOfFirstItem, indexOfLastItem);
            const totalPages = Math.ceil(currentList.length / itemsPerPage);

            if (currentList.length === 0) {
              return (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <p className="text-gray-500">No {activeTab} complaints found.</p>
                </div>
              );
            }

            return (
              <>
                {currentItems.map(complaint => (
                  <div key={complaint._id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="text-lg font-bold text-gray-900">
                            {complaint.subject}
                          </h3>
                          {getStatusBadge(complaint.status)}
                        </div>
                        <p className="text-sm text-gray-500 font-mono">ID: #{complaint._id.slice(-6).toUpperCase()}</p>
                        <p className="text-sm text-gray-500 mt-1">Submitted on {new Date(complaint.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{complaint.description}</p>
                    </div>

                    {complaint.adminResponse && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="text-sm font-bold text-green-900 mb-2">Admin Resolution:</h4>
                        <p className="text-green-800 whitespace-pre-wrap">{complaint.adminResponse}</p>
                        {complaint.resolvedAt && (
                          <p className="text-xs text-green-600 mt-2">Resolved on {new Date(complaint.resolvedAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {currentList.length > itemsPerPage && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default ClientComplaints;
