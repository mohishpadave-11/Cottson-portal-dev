import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config/api';
import Loader from '../components/Loader';

const OrderTimeline = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visibleIndex, setVisibleIndex] = useState(-1);

  const stages = [
    'Order Confirmed',
    'Fabric Purchase',
    'Fabric Cutting',
    'Embroidery/Printing',
    'Stitching',
    'Packing',
    'Shipped'
  ];

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/orders/${id}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStageIndex = () => {
    return stages.indexOf(order?.timeline || 'Order Confirmed');
  };

  const targetIndex = getCurrentStageIndex();

  useEffect(() => {
    if (!order) return;

    // Start animation
    setVisibleIndex(-1);

    let intervalId = null;
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        setVisibleIndex(prev => {
          if (prev < targetIndex) {
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
  }, [order, targetIndex]);

  if (loading) {
    return <Loader fullScreen text="Loading order timeline..." />;
  }

  if (!order) {
    return <div>Order not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Order Timeline - #{order.orderNumber}</h1>
        <button
          onClick={() => navigate(`/orders/${id}`)}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
        >
          Back to Order
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Company:</span>
              <span className="ml-2 font-medium">{order.companyName}</span>
            </div>
            <div>
              <span className="text-gray-500">Order Date:</span>
              <span className="ml-2 font-medium">{new Date(order.orderDate).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-gray-500">Quantity:</span>
              <span className="ml-2 font-medium">{order.quantity}</span>
            </div>
            <div>
              <span className="text-gray-500">Expected Delivery:</span>
              <span className="ml-2 font-medium">{new Date(order.expectedDelivery).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="relative">
          {stages.map((stage, index) => {
            const isCompleted = index <= visibleIndex; // Show green if we've reached this animation step
            const isCurrent = index === visibleIndex && index === targetIndex; // Show blue ONLY if it matches animation AND actual target

            // Special case for intermediate animation: 
            // If animation is at index 2, but target is 5.
            // Index 0, 1 should be green. Index 2 should be green (completed)?
            // Wait, we want "turns green TILL the latest stage".
            // So if target is 5:
            // T=0: 0 turns Green.
            // T=1: 1 turns Green.
            // ...
            // T=5: 5 turns Blue (Latest).
            // So logic:
            // if index < visibleIndex: Green (Completed in history)
            // if index === visibleIndex: 
            //    if visibleIndex === targetIndex: Blue (Current Active)
            //    else: Green (Just completed in animation flow)

            let circleColor = 'bg-gray-300';
            let textColor = 'text-gray-500';
            let statusText = null;

            if (index <= visibleIndex) {
              if (index === targetIndex) {
                // Final target reached
                circleColor = 'bg-blue-500 ring-4 ring-blue-200';
                textColor = 'text-blue-600';
                statusText = "Current Stage";
              } else {
                // History or animating history
                circleColor = 'bg-green-500';
                textColor = 'text-green-600';
                statusText = "Completed";
              }
            }

            return (
              <div key={stage} className="flex items-start mb-8 last:mb-0">
                <div className="flex flex-col items-center mr-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-500 ${circleColor}`}
                  >
                    {circleColor.includes('bg-green-500') ? (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : circleColor.includes('bg-blue-500') ? (
                      // Active State
                      <span className="text-white font-bold">{index + 1}</span>
                    ) : (
                      <span className="text-white font-bold">{index + 1}</span>
                    )}
                  </div>
                  {index < stages.length - 1 && (
                    <div className="w-1 h-16 bg-gray-300 relative overflow-hidden">
                      <div
                        className="absolute top-0 left-0 w-full bg-green-500 transition-all duration-700 ease-linear"
                        style={{ height: index < visibleIndex ? '100%' : '0%' }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex-1 pb-8">
                  <h3 className={`text-lg font-semibold transition-colors duration-500 ${textColor}`}>
                    {stage}
                  </h3>
                  {statusText && (
                    <p className={`text-sm mt-1 transition-opacity duration-500 ${textColor}`}>
                      {statusText}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderTimeline;
