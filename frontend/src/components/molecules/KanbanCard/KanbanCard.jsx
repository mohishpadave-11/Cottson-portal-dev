import React from 'react';
import PropTypes from 'prop-types';
import { getTimeAgo } from '../../../utils/dateUtils';
import StatusBadge from '../../ui/StatusBadge/StatusBadge';

const KanbanCard = ({ order, onClick, onDragStart, onDragEnd }) => {
    const {
        orderNumber,
        orderDate,
        productId,
        companyId,
        clientId,
        expectedDelivery,
        quantity,
        paymentStatus,
        timeline,
    } = order;

    // Calculate progress
    const stages = ['Order Confirmed', 'Fabric Purchase', 'Fabric Cutting', 'Embroidery/Printing', 'Stitching', 'Packing', 'Shipped', 'Order Completed'];
    const currentIndex = stages.indexOf(timeline);
    const percentage = currentIndex >= 0 ? Math.round(((currentIndex + 1) / stages.length) * 100) : 0;

    // Check for delay
    const expectedDate = new Date(expectedDelivery);
    const today = new Date();
    const isDelayed = expectedDate < today && timeline !== 'Order Completed' && timeline !== 'Shipped';

    return (
        <div
            draggable={!!onDragStart}
            onDragStart={(e) => onDragStart && onDragStart(e, order)}
            onDragEnd={onDragEnd}
            onClick={onClick}
            className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-move border border-gray-200 group active:cursor-grabbing text-left"
        >
            {/* Order Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2 flex-1">
                    {/* Drag Handle */}
                    <div className="text-gray-400 group-hover:text-gray-600 cursor-grab active:cursor-grabbing">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                #{orderNumber}
                            </span>
                            <span className="text-xs text-gray-500">
                                {getTimeAgo(orderDate)}
                            </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                            {productId?.name || 'Product Name'}
                        </h4>
                    </div>
                </div>
                <button
                    className="text-gray-400 hover:text-gray-600"
                    onClick={(e) => {
                        e.stopPropagation();
                        // Menu action? For now just prevent propagation of card click
                    }}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                </button>
            </div>

            {/* Company */}
            <p className="text-xs text-gray-600 mb-3">
                Client: <span className="font-medium text-gray-900">{companyId?.companyName || clientId?.name || 'N/A'}</span>
            </p>

            {/* Order Details */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{new Date(expectedDelivery || orderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span>Qty: {quantity}</span>
                </div>
            </div>

            {/* Avatars & Progress */}
            <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                    {clientId?.name && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white flex items-center justify-center text-white text-xs font-semibold" title={clientId.name}>
                            {clientId.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    {paymentStatus === 'Payment Completed' && (
                        <span className="text-xs text-green-600 font-medium">✓ Paid</span>
                    )}
                    {paymentStatus === 'Advance Payment' && (
                        <span className="text-xs text-yellow-600 font-medium">⚠ Partial</span>
                    )}
                    <span className="text-xs text-gray-400">{percentage}% Complete</span>
                </div>
            </div>

            {/* Status Badge (if delayed) */}
            {isDelayed && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <StatusBadge status="Delayed" label="Delayed" className="bg-red-50 text-red-600 border-red-200" />
                </div>
            )}
        </div>
    );
};

KanbanCard.propTypes = {
    order: PropTypes.shape({
        _id: PropTypes.string,
        orderNumber: PropTypes.string,
        orderDate: PropTypes.string,
        productId: PropTypes.shape({ name: PropTypes.string }),
        companyId: PropTypes.shape({ companyName: PropTypes.string }),
        clientId: PropTypes.shape({ name: PropTypes.string }),
        expectedDelivery: PropTypes.string,
        quantity: PropTypes.number,
        paymentStatus: PropTypes.string,
        timeline: PropTypes.string,
    }).isRequired,
    onClick: PropTypes.func,
    onDragStart: PropTypes.func,
    onDragEnd: PropTypes.func,
};

export default KanbanCard;
