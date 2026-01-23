import React from 'react';
import { useEffect } from 'react';

const Toast = ({ id, title, message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose, id]);

  const config = {
    success: {
      // Gradient: Green on left -> White on right
      containerClass: 'bg-gradient-to-r from-green-50 to-white border-green-100',
      iconClass: 'text-green-500 border-green-500',
      titleClass: 'text-gray-800',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    error: {
      // Gradient: Red on left -> White on right
      containerClass: 'bg-gradient-to-r from-red-50 to-white border-red-100',
      iconClass: 'text-red-500 border-red-500',
      titleClass: 'text-gray-800',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    info: {
      // Gradient: Blue on left -> White on right
      containerClass: 'bg-gradient-to-r from-blue-50 to-white border-blue-100',
      iconClass: 'text-blue-500 border-blue-500',
      titleClass: 'text-gray-800',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    warning: {
      // Gradient: Yellow on left -> White on right
      containerClass: 'bg-gradient-to-r from-yellow-50 to-white border-yellow-100',
      iconClass: 'text-yellow-500 border-yellow-500',
      titleClass: 'text-gray-800',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    }
  };

  const currentConfig = config[type] || config.info;

  return (
    <div className="animate-slide-in-right transform transition-all duration-300 hover:scale-[1.02]">
      <div className={`relative overflow-hidden ${currentConfig.containerClass} border rounded-2xl shadow-lg p-4 min-w-[380px] max-w-[450px]`}>
        
        {/* Grid pattern removed as requested */}

        <div className="relative flex items-start space-x-4 z-10">
          {/* Icon - Ring Style */}
          <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full border-2 ${currentConfig.iconClass} bg-transparent mt-0.5`}>
            {currentConfig.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-0.5">
            <h4 className={`${currentConfig.titleClass} font-semibold text-base leading-tight`}>
              {title}
            </h4>
            {message && (
              <p className="text-gray-400 text-sm mt-1 leading-relaxed font-light">
                {message}
              </p>
            )}
          </div>

          {/* Close Button - Subtle */}
          <button
            onClick={() => onClose(id)}
            className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors focus:outline-none"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;