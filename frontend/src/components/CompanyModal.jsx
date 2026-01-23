import React from 'react';
import CompanyAddressManager from './CompanyAddressManager';

const CompanyModal = ({ company, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    tradeName: '',
    gstNumber: '',
    billingAddress: '',
    companyId: '',
    shippingAddresses: []
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (company) {
      setFormData({
        ...company,
        shippingAddresses: company.shippingAddresses || []
      });
    }
  }, [company]);

  useEffect(() => {
    if (!company && formData.companyName) {
      const timer = setTimeout(() => {
        fetchNextId(formData.companyName);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.companyName, company]);

  const fetchNextId = async (name) => {
    try {
      const response = await api.get(`/api/companies/next-id?name=${encodeURIComponent(name)}`);
      if (response.data.success) {
        setFormData(prev => ({ ...prev, companyId: response.data.nextId }));
      }
    } catch (error) {
      console.error('Error fetching next ID:', error);
    }
  };
  // ... existing code ...


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (company) {
        await axios.put(`/api/companies/${company._id}`, formData);
      } else {
        await axios.post('/api/companies', formData);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving company:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {company ? 'Edit Company' : 'Add New Company'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {company ? 'Update company information' : 'Enter company details to create a new partnership'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={saving}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8">
          <div className="space-y-6">
            {/* Company Information Section */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Company Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={saving}
                    value={formData.companyName}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^[a-zA-Z\s]+$/.test(val)) {
                        setFormData({ ...formData, companyName: val });
                      }
                    }}
                    placeholder="Enter company name"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d3858]/10 focus:border-[#0d3858] disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trade Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={saving}
                    value={formData.tradeName}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^[a-zA-Z\s]+$/.test(val)) {
                        setFormData({ ...formData, tradeName: val });
                      }
                    }}
                    placeholder="Enter trade name"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d3858]/10 focus:border-[#0d3858] disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GST Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={saving}
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    placeholder="e.g., 22AAAAA0000A1Z5"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d3858]/10 focus:border-[#0d3858] disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={saving}
                    readOnly
                    value={formData.companyId}
                    placeholder="Generating ID..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    disabled={saving}
                    value={formData.billingAddress}
                    onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                    placeholder="Enter complete billing address"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d3858]/10 focus:border-[#0d3858] disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 resize-none"
                    rows="3"
                  />
                </div>
              </div>

              {/* Address Book Section */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Address Book</h3>
                </div>
                <CompanyAddressManager
                  addresses={formData.shippingAddresses}
                  onChange={(updatedAddresses) => setFormData({ ...formData, shippingAddresses: updatedAddresses })}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              <span className="text-red-500">*</span> Required fields
            </p>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-6 py-2.5 border-2 border-gray-300 bg-white rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex items-center space-x-2 px-6 py-2.5 text-white rounded-lg font-medium transition-colors"
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
                    <span>{company ? 'Update Company' : 'Create Company'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyModal;
