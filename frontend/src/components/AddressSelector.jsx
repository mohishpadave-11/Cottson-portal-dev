import React from 'react';

const AddressSelector = ({ company, onSelect, disabled }) => {
    // Safe Guard: "The Undefined Crash Protection"
    if (!company || !company.shippingAddresses || company.shippingAddresses.length === 0) {
        return null;
    }

    const handleChange = (e) => {
        const selectedLabel = e.target.value;
        if (!selectedLabel) return;

        const selectedAddr = company.shippingAddresses.find(addr => addr.label === selectedLabel);
        if (selectedAddr) {
            onSelect(selectedAddr.address);
        }
    };

    return (
        <div className={`mb-2 flex items-center justify-between px-3 py-2 rounded-lg border ${disabled ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-100'}`}>
            <div className={`flex items-center space-x-2 ${disabled ? 'text-gray-400' : 'text-blue-700'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium">Auto-fill Address</span>
            </div>
            <div className="relative">
                <select
                    disabled={disabled}
                    onChange={handleChange}
                    className="block w-full pl-3 pr-10 py-1 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white shadow-sm cursor-pointer disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                    defaultValue=""
                >
                    <option value="" disabled>Select a location...</option>
                    {company.shippingAddresses.map((addr, index) => (
                        <option key={index} value={addr.label}>
                            {addr.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default AddressSelector;
