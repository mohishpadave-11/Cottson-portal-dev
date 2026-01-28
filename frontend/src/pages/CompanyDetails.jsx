import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Loader, { ButtonLoader } from '../components/Loader';
import CompanyAddressManager from '../components/CompanyAddressManager';
import { endpoints } from '../config/api';
import { useToast } from '../contexts/ToastContext';

const CompanyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(id === 'new');
  const [formData, setFormData] = useState({
    companyName: '',
    tradeName: '',
    gstNumber: '',
    billingAddress: '',
    shippingAddresses: [],
    companyId: ''
  });

  useEffect(() => {
    if (id !== 'new') {
      fetchCompany();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const response = await endpoints.companies.getById(id);
      const data = response.data.data || response.data;
      setCompany(data);
      setFormData(data);
    } catch (error) {
      console.error('Error fetching company:', error);
      toast.error('Error', 'Failed to load company details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.companyName || !formData.tradeName || !formData.gstNumber || !formData.billingAddress || !formData.companyId) {
      toast.warning('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);

      if (id === 'new') {
        await endpoints.companies.create(formData);
      } else {
        await endpoints.companies.update(id, formData);
      }

      toast.success(
        'Success',
        id === 'new' ? 'Company created successfully' : 'Company updated successfully'
      );
      navigate('/companies');

    } catch (error) {
      console.error('Error saving company:', error);
      toast.error('Error', error.response?.data?.message || 'Failed to save company');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader fullScreen text="Loading company details..." />;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500">
        <button onClick={() => navigate('/companies')} className="hover:text-gray-700">Companies</button>
        <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium">
          {id === 'new' ? 'New Company' : formData.companyName}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900">
              {id === 'new' ? 'New Company' : formData.companyName}
            </h1>
            {id !== 'new' && (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full uppercase">
                Active
              </span>
            )}
          </div>
          {id !== 'new' && (
            <p className="text-sm text-gray-500 mt-1">
              Company ID: <span className="font-medium text-gray-700">{formData.companyId}</span>
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
              <span>Edit Company</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Company ID */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase">Company ID</span>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
          {isEditing ? (
            <input
              type="text"
              required
              value={formData.companyId}
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
              className="text-2xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none w-full"
              placeholder="Enter ID"
            />
          ) : (
            <p className="text-2xl font-bold text-gray-900">{formData.companyId || 'Not Set'}</p>
          )}
        </div>

        {/* GST Number */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase">GST Number</span>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          {isEditing ? (
            <input
              type="text"
              required
              value={formData.gstNumber}
              onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
              className="text-lg font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none w-full"
              placeholder="GST Number"
            />
          ) : (
            <p className="text-lg font-bold text-gray-900">{formData.gstNumber || 'Not Set'}</p>
          )}
        </div>

        {/* Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase">Status</span>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600">Active</p>
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900">Company Information</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <input
                type="text"
                required
                disabled={!isEditing}
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Enter company name"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trade Name</label>
              <input
                type="text"
                required
                disabled={!isEditing}
                value={formData.tradeName}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                placeholder="Enter trade name"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Billing Address</label>
              <textarea
                required
                disabled={!isEditing}
                value={formData.billingAddress}
                onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                placeholder="Enter complete billing address"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 resize-none"
                rows="4"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Address Book Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900">Address Book</h2>
        </div>
        <CompanyAddressManager
          addresses={formData.shippingAddresses}
          onChange={(updatedAddresses) => setFormData({ ...formData, shippingAddresses: updatedAddresses })}
          readOnly={!isEditing}
        />
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
                    navigate('/companies');
                  } else {
                    setIsEditing(false);
                    fetchCompany();
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

export default CompanyDetails;
