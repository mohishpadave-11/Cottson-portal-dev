import React, { useState, useEffect } from 'react';

const ManufacturingTimeline = ({ timeline, timelineStages, orderDate, delayDays = 0, quantity = 0 }) => {
    const [visibleIndex, setVisibleIndex] = useState(-1);

    const TIMELINE_STEPS = [
        { name: 'Order Confirmed', description: 'Order has been received and confirmed for production.', enumParams: ['Order Confirmed'] },
        { name: 'Fabric Purchase', description: 'Procurement of fabric and essential raw materials is underway.', enumParams: ['Fabric Purchase'] },
        { name: 'Fabric Cutting', description: `Precision cutting of patterns for all ${quantity || 0} units.`, enumParams: ['Fabric Cutting'] },
        { name: 'Embroidery/Printing', description: 'Applying custom designs and branding specifications.', enumParams: ['Embroidery/Printing'] },
        { name: 'Stitching', description: 'Garment assembly with high-quality stitching standards.', enumParams: ['Stitching'] },
        { name: 'Packing & Quality Control', description: 'Final inspection and packaging.', enumParams: ['Packing'] },
        { name: 'Logistics & Shipping', description: 'Shipment preparation and dispatch to your location.', enumParams: ['Shipped', 'Delivered'] },
        { name: 'Order Completed', description: 'Successfully delivered and officially closed.', enumParams: ['Order Completed'] }
    ];

    // Calculate target index
    const currentStageIndex = TIMELINE_STEPS.findIndex(s => s.enumParams.includes(timeline));

    useEffect(() => {
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
            }, 400);
        }, 500);

        return () => {
            clearTimeout(timeoutId);
            if (intervalId) clearInterval(intervalId);
        };
    }, [timeline, currentStageIndex]);

    const getStepStatus = (index) => {
        if (index <= visibleIndex) {
            if (index === currentStageIndex) {
                return 'active';
            }
            return 'completed';
        }
        return 'pending';
    };

    const getStepDate = (step, index) => {
        if (index === 0 && orderDate) {
            return new Date(orderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
        if (timelineStages) {
            const stageInfo = timelineStages.find(s => step.enumParams.includes(s.stage));
            if (stageInfo && stageInfo.startDate) {
                return new Date(stageInfo.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            }
        }
        return '';
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="relative">
                {TIMELINE_STEPS.map((step, index) => {
                    const status = getStepStatus(index);
                    const date = getStepDate(step, index);

                    return (
                        <div key={index} className="flex items-start mb-8 last:mb-0">
                            {/* Left Column: Timeline Markers */}
                            <div className="flex flex-col items-center mr-6">
                                <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${status === 'completed'
                                        ? 'bg-green-500 text-white'
                                        : status === 'active'
                                            ? 'bg-navy-900 ring-4 ring-navy-900/20 text-white' // Assuming navy-900 is meant to be blue-600 logic from before, but let's stick to consistent colors
                                            : 'bg-gray-300 text-white'
                                        }`}
                                    // Override custom class for active to match previous blue style if needed, or keep navy if defined
                                    // Let's use standard tailwind colors to be safe:
                                    style={status === 'active' ? { backgroundColor: '#1e40af' } : {}} // blue-800
                                >
                                    {status === 'completed' ? (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : status === 'active' ? (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    ) : (
                                        <span className="font-bold">{index + 1}</span>
                                    )}
                                </div>
                                {index < TIMELINE_STEPS.length - 1 && (
                                    <div className="w-1 h-20 bg-gray-300 relative overflow-hidden">
                                        {/* The filling effect */}
                                        <div
                                            className="absolute top-0 left-0 w-full bg-green-500 transition-all duration-700 ease-linear"
                                            style={{ height: index < visibleIndex ? '100%' : '0%' }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Content */}
                            <div className="flex-1 pb-8">
                                <div className="flex items-center justify-between mb-2">
                                    <h3
                                        className={`text-lg font-semibold ${status === 'active' ? 'text-blue-600' : status === 'completed' ? 'text-green-600' : 'text-gray-500'
                                            }`}
                                    >
                                        {step.name}
                                        {status === 'active' && (
                                            <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded uppercase">
                                                Active Now
                                            </span>
                                        )}
                                    </h3>
                                    <span className="text-sm text-gray-500">{date}</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                            </div>
                        </div>
                    );
                })}

                {delayDays > 0 && (
                    <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-red-700 font-bold uppercase tracking-wide text-sm">Order delayed by {delayDays} {delayDays === 1 ? 'day' : 'days'}</p>
                            <p className="text-red-600 text-xs">The expected delivery date has been adjusted accordingly.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManufacturingTimeline;
