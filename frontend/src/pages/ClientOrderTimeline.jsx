import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { endpoints } from '../config/api';
import Loader from '../components/Loader';

const ClientOrderTimeline = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const [visibleIndex, setVisibleIndex] = useState(-1);

  useEffect(() => {
    fetchOrderDetails();
  }, [id, navigate]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await endpoints.orders.getById(id);

      const userStr = localStorage.getItem('user');
      if (!userStr) {
        navigate('/login');
        return;
      }

      const user = JSON.parse(userStr);
      const orderData = response.data.data;

      // Verify this order belongs to the logged-in user's company
      const orderCompanyId = typeof orderData.companyId === 'object' && orderData.companyId !== null
        ? orderData.companyId._id
        : orderData.companyId;

      const userCompanyId = typeof user.companyId === 'object' && user.companyId !== null
        ? user.companyId._id
        : user.companyId;

      if (orderCompanyId?.toString() !== userCompanyId?.toString()) {
        navigate('/client/orders');
        return;
      }

      setOrder(orderData);
    } catch (error) {
      console.error('Error fetching order details:', error);
      navigate('/client/orders');
    } finally {
      setLoading(false);
    }
  };

  const TIMELINE_STEPS = [
    { name: 'Order Confirmed', description: 'Order has been received and confirmed for production.', enumParams: ['Order Confirmed'] },
    { name: 'Fabric Purchase', description: 'Procurement of fabric and essential raw materials is underway.', enumParams: ['Fabric Purchase'] },
    { name: 'Fabric Cutting', description: `Precision cutting of patterns for all ${order?.quantity || 0} units.`, enumParams: ['Fabric Cutting'] },
    { name: 'Embroidery/Printing', description: 'Applying custom designs and branding specifications.', enumParams: ['Embroidery/Printing'] },
    { name: 'Stitching', description: 'Garment assembly with high-quality stitching standards.', enumParams: ['Stitching'] },
    { name: 'Packing & Quality Control', description: 'Final quality inspection and individual units packaging.', enumParams: ['Packing'] },
    { name: 'Logistics & Shipping', description: 'Shipment preparation and dispatch to your location.', enumParams: ['Shipped', 'Delivered'] },
    { name: 'Order Completed', description: 'Successfully delivered and officially closed.', enumParams: ['Order Completed'] }
  ];

  // Calculate target index once order is loaded
  const currentStageIndex = order ? TIMELINE_STEPS.findIndex(s => s.enumParams.includes(order.timeline)) : -1;

  useEffect(() => {
    if (!order || currentStageIndex === -1) return;

    // Start animation
    setVisibleIndex(-1);

    let intervalId = null;
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        setVisibleIndex(prev => {
          if (prev < currentStageIndex) {
            return prev + 1;
          }
          clearInterval(intervalId);
          return prev;
        });
      }, 800);
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [order, currentStageIndex]);

  const getStepStatus = (step, index) => {
    // Determine status based on animation state
    if (index <= visibleIndex) {
      if (index === currentStageIndex) {
        return 'active';
      }
      return 'completed';
    }
    return 'pending';
  };

  const getStepDate = (step, index) => {
    if (index === 0 && order?.orderDate) {
      return new Date(order.orderDate).toLocaleDateString();
    }
    if (order?.timelineStages) {
      const stageInfo = order.timelineStages.find(s => step.enumParams.includes(s.stage));
      if (stageInfo && stageInfo.startDate) {
        return new Date(stageInfo.startDate).toLocaleDateString();
      }
    }
    return '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader size="large" text="Loading order details..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Order not found</p>
        <button onClick={() => navigate('/client/orders')} className="mt-4 text-blue-600 hover:underline">Back to Orders</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/client/orders/${id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manufacturing Journey</h1>
            <p className="text-sm text-gray-500 mt-1">Order #{order.orderNumber}</p>
          </div>
        </div>
      </div>

      {/* Production Progress Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8">
          <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Real-time Production Status</h2>
              <p className="text-gray-500 mt-1">Detailed breakdown of your manufacturing process</p>
            </div>
            <div className="flex items-center bg-blue-50 px-4 py-2 rounded-xl">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-2"></div>
              <span className="text-blue-700 font-bold text-sm uppercase tracking-wider">{order.timeline}</span>
            </div>
          </div>

          <div className="relative">
            {TIMELINE_STEPS.map((step, index) => {
              const status = getStepStatus(step, index);
              const date = getStepDate(step, index);

              return (
                <div key={index} className="flex group">
                  {/* Left Column: Timeline Markers */}
                  <div className="flex flex-col items-center mr-8">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm border-4 ${status === 'completed'
                        ? 'bg-green-500 border-green-100 text-white'
                        : status === 'active'
                          ? 'bg-blue-600 border-blue-100 text-white ring-4 ring-blue-50'
                          : 'bg-white border-gray-100 text-gray-300'
                        }`}
                    >
                      {status === 'completed' ? (
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : status === 'active' ? (
                        <div className="relative">
                          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      ) : (
                        <span className="text-lg font-bold">{index + 1}</span>
                      )}
                    </div>
                    {index < TIMELINE_STEPS.length - 1 && (
                      <div className="w-1 flex-1 my-2 rounded-full bg-gray-100 relative overflow-hidden min-h-[4rem]">
                        <div
                          className="absolute top-0 left-0 w-full bg-green-500 transition-all duration-700 ease-linear"
                          style={{ height: status === 'completed' ? '100%' : '0%' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Right Column: Step Content */}
                  <div className="flex-1 pb-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center">
                        <h3
                          className={`text-xl font-bold transition-colors ${status === 'active' ? 'text-blue-600' : status === 'completed' ? 'text-gray-900' : 'text-gray-400'
                            }`}
                        >
                          {step.name}
                        </h3>
                        {status === 'active' && (
                          <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black rounded-lg uppercase tracking-tight">
                            Current Stage
                          </span>
                        )}
                      </div>
                      {date && (
                        <span className="text-sm font-medium text-gray-400 font-mono">{date}</span>
                      )}
                    </div>
                    <p className={`text-base leading-relaxed ${status === 'active' ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                      {step.description}
                    </p>

                    {status === 'active' && order.delayDays > 0 && (
                      <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100 flex items-center">
                        <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-xs font-bold text-red-700 uppercase">Attention: Production delayed by {order.delayDays} {order.delayDays === 1 ? 'day' : 'days'}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-gray-50 border-t border-gray-100 p-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-gray-100">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">End-to-End Tracking</p>
                <p className="text-xs text-gray-500">Every manufacturing node is verified by QC</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-gray-100">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Estimated Completion</p>
                <p className="text-xs text-gray-500">{order.expectedDelivery ? new Date(order.expectedDelivery).toLocaleDateString() : 'Pending Calculation'}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/client/complaints')}
              className="text-blue-600 text-sm font-bold hover:text-blue-700 transition-colors flex items-center"
            >
              Have a concern? Raise a query
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientOrderTimeline;
