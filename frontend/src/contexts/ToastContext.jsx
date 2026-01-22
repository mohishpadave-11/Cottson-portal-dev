import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import Toast from '../components/Toast';
import { toast as toastEmitter } from '../utils/toastEmitter';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const activeToastIds = useRef(new Set());
  const activeToastSignatures = useRef(new Set());
  const toastIdToSignature = useRef(new Map());

  const addToast = useCallback(({ title, message, type = 'info', duration = 4000, id }) => {
    // 1. Deduplication by ID (if provided)
    if (id) {
      if (activeToastIds.current.has(id)) {
        return id;
      }
      activeToastIds.current.add(id);
    }

    // 2. Deduplication by Content (Title + Message + Type)
    const signature = `${title}|${message}|${type}`;
    if (activeToastSignatures.current.has(signature)) {
      // Find the existing ID for this signature if we needed to return it, 
      // but for now just returning null or an existing ID if we had it is fine.
      // To be safe, we just ignore this request.
      return null;
    }
    activeToastSignatures.current.add(signature);

    const toastId = id || (Date.now() + Math.random());

    // Store mapping for removal
    toastIdToSignature.current.set(toastId, signature);

    setToasts(prev => [...prev, { id: toastId, title, message, type, duration }]);
    return toastId;
  }, []);

  // Subscribe to external events
  useEffect(() => {
    const unsubscribe = toastEmitter.subscribe((event) => {
      addToast(event);
    });
    return unsubscribe;
  }, [addToast]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));

    // Cleanup ID Ref
    activeToastIds.current.delete(id);

    // Cleanup Signature
    const signature = toastIdToSignature.current.get(id);
    if (signature) {
      activeToastSignatures.current.delete(signature);
      toastIdToSignature.current.delete(id);
    }
  }, []);

  // Convenience methods
  const success = useCallback((title, message, duration, id) => {
    return addToast({ title, message, type: 'success', duration, id });
  }, [addToast]);

  const error = useCallback((title, message, duration, id) => {
    return addToast({ title, message, type: 'error', duration, id });
  }, [addToast]);

  const info = useCallback((title, message, duration, id) => {
    return addToast({ title, message, type: 'info', duration, id });
  }, [addToast]);

  const warning = useCallback((title, message, duration, id) => {
    return addToast({ title, message, type: 'warning', duration, id });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info, warning }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
        <div className="pointer-events-auto space-y-3">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              id={toast.id}
              title={toast.title}
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={removeToast}
            />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};
