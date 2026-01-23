import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ButtonLoader } from '../components/Loader';
import api from '../config/axios';

const Settings = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const [chargeTypes, setChargeTypes] = useState([]);
  const [newCharge, setNewCharge] = useState('');

  // Fetch initial data
  useEffect(() => {
    fetchCustomCharges();
  }, []);

  const fetchCustomCharges = async () => {
    try {
      const response = await api.get('/api/settings/charges');
      setChargeTypes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching charges:', error);
      // Optional: don't block main UI if this fails
    }
  };

  const handleAddCharge = async (e) => {
    e.preventDefault();
    if (!newCharge.trim()) return;

    try {
      setSaving(true);
      const updatedCharges = [...chargeTypes, newCharge.trim()];
      // Optimistic update
      setChargeTypes(updatedCharges);
      setNewCharge('');

      await api.post('/api/settings/charges', { charges: updatedCharges });
    } catch (error) {
      console.error('Error adding charge:', error);
      setChargeTypes(chargeTypes); // Revert
      alert('Failed to add charge type');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCharge = async (chargeToRemove) => {
    if (!window.confirm(`Remove "${chargeToRemove}" from available charges?`)) return;

    try {
      const updatedCharges = chargeTypes.filter(c => c !== chargeToRemove);
      setChargeTypes(updatedCharges);

      await api.post('/api/settings/charges', { charges: updatedCharges });
    } catch (error) {
      console.error('Error removing charge:', error);
      setChargeTypes(chargeTypes); // Revert
      alert('Failed to remove charge type');
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500">
        <button onClick={() => navigate('/home')} className="hover:text-gray-700">Home</button>
        <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium">Settings</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage system configurations</p>
        </div>
      </div>

      {/* Order Settings Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Order Settings</h2>

        <div className="mb-0">
          <h3 className="text-md font-semibold text-gray-800 mb-4">Custom Charge Types</h3>
          <p className="text-sm text-gray-500 mb-4">
            Define the types of optional extra charges (e.g., Shipping, Packaging) available when creating orders.
          </p>

          {/* List of Charges */}
          <div className="flex flex-wrap gap-2 mb-6">
            {chargeTypes.map((charge, index) => (
              <div key={index} className="flex items-center bg-gray-100 rounded-full px-4 py-2">
                <span className="text-sm font-medium text-gray-800 mr-2">{charge}</span>
                <button
                  onClick={() => handleRemoveCharge(charge)}
                  className="text-gray-500 hover:text-red-500 focus:outline-none"
                  title="Remove"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {chargeTypes.length === 0 && (
              <p className="text-sm text-gray-400 italic">No custom charges defined.</p>
            )}
          </div>

          {/* Add New Charge */}
          <form onSubmit={handleAddCharge} className="flex gap-4 items-end max-w-md">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Add New Charge Type</label>
              <input
                type="text"
                value={newCharge}
                onChange={(e) => setNewCharge(e.target.value)}
                placeholder="e.g. Express Delivery"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={!newCharge.trim() || saving}
              className="btn-primary flex items-center px-4 py-2.5 bg-gray-900 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <ButtonLoader />
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
