import React from 'react';
import PropTypes from 'prop-types';

const statusStyles = {
    // Order Statuses (Requested)
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    processing: 'bg-blue-100 text-blue-800 border-blue-200',
    shipped: 'bg-purple-100 text-purple-800 border-purple-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',

    // Kanban Stages (Detected in code)
    'order confirmed': 'bg-blue-100 text-blue-700 border-blue-200',
    'fabric purchase': 'bg-purple-100 text-purple-700 border-purple-200',
    'fabric cutting': 'bg-orange-100 text-orange-700 border-orange-200',
    'embroidery/printing': 'bg-pink-100 text-pink-700 border-pink-200',
    'stitching': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'packing': 'bg-green-100 text-green-700 border-green-200',
    'order completed': 'bg-gray-100 text-gray-700 border-gray-200',

    // Product Statuses
    active: 'bg-green-600 text-white shadow-sm',
    inactive: 'bg-red-600 text-white shadow-sm',

    // Default
    default: 'bg-gray-100 text-gray-800 border-gray-200',
};

/**
 * Badge component to display status or state
 */
const StatusBadge = ({ status, label, className = '' }) => {
    const normalizedStatus = (status || '').toString().toLowerCase();
    const styles = statusStyles[normalizedStatus] || statusStyles.default;
    const displayLabel = label || status;

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles} ${className}`}>
            {displayLabel}
        </span>
    );
};

StatusBadge.propTypes = {
    /**
     * The status key which determines the style
     */
    status: PropTypes.string.isRequired,
    /**
     * Optional custom label. If not provided, status is used.
     */
    label: PropTypes.string,
    /**
     * Additional classes
     */
    className: PropTypes.string,
};

export default StatusBadge;
