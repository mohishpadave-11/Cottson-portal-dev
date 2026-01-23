import React, { useState } from 'react';

const CompanyAddressManager = ({ addresses = [], onChange, readOnly = false }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newAddress, setNewAddress] = useState({ label: '', address: '' });

    const handleAdd = () => {
        if (!newAddress.label || !newAddress.address) return;
        onChange([...addresses, newAddress]);
        setNewAddress({ label: '', address: '' });
        setIsAdding(false);
    };

    const handleRemove = (index) => {
        const updated = addresses.filter((_, i) => i !== index);
        onChange(updated);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Shipping Addresses</label>
                {!readOnly && (
                    <button
                        type="button"
                        onClick={() => setIsAdding(!isAdding)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Address
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <input
                        type="text"
                        placeholder="Label (e.g., Warehouse A)"
                        value={newAddress.label}
                        onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3858]/10 focus:border-[#0d3858]"
                    />
                    <textarea
                        placeholder="Full Address"
                        value={newAddress.address}
                        onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3858]/10 focus:border-[#0d3858]"
                        rows="2"
                    />
                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleAdd}
                            disabled={!newAddress.label || !newAddress.address}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            Save
                        </button>
                    </div>
                </div>
            )}

            {addresses.length === 0 && !isAdding && (
                <p className="text-sm text-gray-500 italic">No additional shipping addresses saved.</p>
            )}

            <div className="space-y-2">
                {addresses.map((addr, index) => (
                    <div key={index} className="flex items-start justify-between bg-white border border-gray-200 p-3 rounded-lg group hover:border-blue-300 transition-colors">
                        <div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mb-1">
                                {addr.label}
                            </span>
                            <p className="text-sm text-gray-600 whitespace-pre-line">{addr.address}</p>
                        </div>
                        {!readOnly && (
                            <button
                                type="button"
                                onClick={() => handleRemove(index)}
                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove Address"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CompanyAddressManager;
