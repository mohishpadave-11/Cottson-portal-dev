import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { useToast } from '../contexts/ToastContext';
import { endpoints } from '../config/api';
import KanbanCard from './molecules/KanbanCard/KanbanCard';

const KanbanBoard = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedOrder, setDraggedOrder] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  const stages = [
    {
      name: 'Order Confirmed',
      color: 'blue',
      icon: '📋'
    },
    {
      name: 'Fabric Purchase',
      color: 'purple',
      icon: '🛒'
    },
    {
      name: 'Fabric Cutting',
      color: 'orange',
      icon: '✂️'
    },
    {
      name: 'Embroidery/Printing',
      color: 'pink',
      icon: '🎨'
    },
    {
      name: 'Stitching',
      color: 'yellow',
      icon: '🧵'
    },
    {
      name: 'Packing',
      color: 'green',
      icon: '📦'
    },
    {
      name: 'Shipped',
      color: 'teal',
      icon: '🚚'
    },
    {
      name: 'Order Completed',
      color: 'gray',
      icon: '✅'
    }
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await endpoints.orders.getAll();
      const data = response.data.data || response.data;
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getOrdersByStage = (stage) => {
    // FIX: Add (orders || []) safety check to prevent crash if orders is null
    const stageOrders = (orders || []).filter(order => order.timeline === stage);

    // Filter out orders that have been in "Order Completed" for more than 24 hours
    if (stage === 'Order Completed') {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      return stageOrders.filter(order => {
        // If no completedAt timestamp, show the order (shouldn't happen but safety first)
        if (!order.completedAt) return true;

        // Hide if completed more than 24 hours ago
        const completedDate = new Date(order.completedAt);
        return completedDate > twentyFourHoursAgo;
      });
    }

    return stageOrders;
  };

  const getStatusColor = (status) => {
    if (status === 'Delayed') return 'bg-red-50 text-red-600 border-red-200';
    if (status === 'On Track') return 'bg-green-50 text-green-600 border-green-200';
    return 'bg-gray-50 text-gray-600 border-gray-200';
  };



  // Drag and Drop Handlers
  const handleDragStart = (e, order) => {
    setDraggedOrder(order);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedOrder(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e, stageName) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageName);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverStage(null);
  };

  const handleDrop = async (e, newStage) => {
    e.preventDefault();
    setDragOverStage(null);

    if (!draggedOrder || draggedOrder.timeline === newStage) {
      return;
    }

    const oldStage = draggedOrder.timeline;

    // Optimistically update UI
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order._id === draggedOrder._id
          ? { ...order, timeline: newStage }
          : order
      )
    );

    // Update order timeline in backend
    try {
      await endpoints.orders.updateTimeline(draggedOrder._id, newStage);

      // Show success notification
      toast.success(
        'Order status updated',
        `Order #${draggedOrder.orderNumber} moved to ${newStage}`
      );
    } catch (error) {
      // Revert optimistic update on error
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === draggedOrder._id
            ? { ...order, timeline: oldStage }
            : order
        )
      );

      // Show error notification
      toast.error(
        'Update failed',
        error.response?.data?.message || 'Failed to update order status. Please try again.'
      );
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <Loader size="large" text="Loading orders..." />
      </div>
    );
  }



  return (
    <div className="overflow-x-auto">
      <div className="flex space-x-4 min-w-max pb-4">
        {stages.map(stage => {
          const stageOrders = getOrdersByStage(stage.name);
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-700 border-blue-200',
            purple: 'bg-purple-100 text-purple-700 border-purple-200',
            orange: 'bg-orange-100 text-orange-700 border-orange-200',
            pink: 'bg-pink-100 text-pink-700 border-pink-200',
            yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            green: 'bg-green-100 text-green-700 border-green-200',
            teal: 'bg-teal-100 text-teal-700 border-teal-200',
            gray: 'bg-gray-100 text-gray-700 border-gray-200'
          };

          return (
            <div
              key={stage.name}
              className="flex-shrink-0 w-80"
              onDragOver={(e) => handleDragOver(e, stage.name)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.name)}
            >
              <div className={`bg-gray-50 rounded-xl p-4 border-2 transition-all ${dragOverStage === stage.name
                ? 'border-blue-400 bg-blue-50 shadow-lg'
                : 'border-gray-200'
                }`}>
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold border ${colorClasses[stage.color]}`}>
                      {stage.icon}
                    </span>
                    <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                      {stage.name}
                    </h3>
                  </div>
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${colorClasses[stage.color]}`}>
                    {stageOrders.length}
                  </span>
                </div>

                {/* Orders */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {stageOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <div className={`transition-all ${dragOverStage === stage.name
                        ? 'text-blue-600 scale-110'
                        : 'text-gray-400'
                        }`}>
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm font-medium">
                          {dragOverStage === stage.name ? 'Drop here' : 'No orders'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    stageOrders.map(order => (
                      <KanbanCard
                        key={order._id}
                        order={order}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onClick={() => navigate(`/orders/${order._id}`)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanBoard;