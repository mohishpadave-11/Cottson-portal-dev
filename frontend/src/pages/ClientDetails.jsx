import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config/api';
import Loader, { ButtonLoader } from '../components/Loader';
import { useToast } from '../contexts/ToastContext';

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [client, setClient] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(id === 'new');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    companyId: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchCompanies(),
        id !== 'new' && fetchClient()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClient = async () => {
    try {
      const response = await api.get(`/api/clients/${id}`);
      const data = response.data.data || response.data;
      setClient(data);
      setFormData({
        ...data,
        companyId: data.companyId?._id || data.companyId
      });
    } catch (error) {
      console.error('Error fetching client:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/api/companies');
      setCompanies(response.data.data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (id === 'new') {
        await api.post('/api/clients', formData);
        toast.success('Success', 'Client created successfully');
      } else {
        await api.put(`/api/clients/${id}`, formData);
        toast.success('Success', 'Client updated successfully');
      }
      navigate('/clients');
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error('Error', error.response?.data?.message || 'Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  const getSelectedCompany = () => {
    const id = typeof formData.companyId === 'object' ? formData.companyId?._id : formData.companyId;
    if (!id) return null;

    // Try to find in loaded companies list first
    const foundInList = companies.find(c => c._id === id);
    if (foundInList) return foundInList;

    // Fallback to populated data from client fetch if available and matching
    if (client?.companyId && typeof client.companyId === 'object' && client.companyId._id === id) {
      return client.companyId;
    }

    return null;
  };

  if (loading) {
    return <Loader fullScreen text="Loading client details..." />;
  }

  const selectedCompany = getSelectedCompany();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500">
        <button onClick={() => navigate('/clients')} className="hover:text-gray-700">Clients</button>
        <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium">
          {id === 'new' ? 'New Client' : formData.name}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900">
              {id === 'new' ? 'New Client' : formData.name}
            </h1>
            {id !== 'new' && (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full uppercase">
                Active
              </span>
            )}
          </div>
          {id !== 'new' && selectedCompany && (
            <p className="text-sm text-gray-500 mt-1">
              Point of Contact at <span className="font-medium text-gray-700">{selectedCompany.companyName}</span>
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {id !== 'new' && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit Client</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Name */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase">Full Name</span>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          {isEditing ? (
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="text-2xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none w-full"
              placeholder="Enter name"
            />
          ) : (
            <p className="text-2xl font-bold text-gray-900">{formData.name || 'Not Set'}</p>
          )}
        </div>

        {/* Email */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase">Email</span>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          {isEditing ? (
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="text-lg font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none w-full"
              placeholder="Email"
            />
          ) : (
            <p className="text-lg font-bold text-gray-900 break-all">{formData.email || 'Not Set'}</p>
          )}
        </div>

        {/* Phone */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase">Phone Number</span>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
          </div>
          {isEditing ? (
            <input
              type="tel"
              required
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="text-lg font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none w-full"
              placeholder="Phone"
            />
          ) : (
            <p className="text-lg font-bold text-gray-900">{formData.phoneNumber || 'Not Set'}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Contact Information</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    disabled={!isEditing}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    disabled={!isEditing}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    required
                    disabled={!isEditing}
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Associated Company</label>
                  <div className="relative">
                    <select
                      required
                      disabled={!isEditing}
                      value={formData.companyId}
                      onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
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
              </div>
            </form>
          </div>
        </div>

        {/* Right Column - Company Info */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Company Details</h2>
            </div>

            {selectedCompany ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Company Name</p>
                  <p className="font-semibold text-gray-900">{selectedCompany.companyName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Trade Name</p>
                  <p className="font-semibold text-gray-900">{selectedCompany.tradeName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">GST Number</p>
                  <p className="font-semibold text-gray-900">{selectedCompany.gstNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Billing Address</p>
                  <p className="text-sm text-gray-700">{selectedCompany.billingAddress}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">No company selected</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Changes Button */}
      {isEditing && (
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
                    navigate('/clients');
                  } else {
                    setIsEditing(false);
                    fetchClient();
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
      )}
    </div>
  );
};

export default ClientDetails;
