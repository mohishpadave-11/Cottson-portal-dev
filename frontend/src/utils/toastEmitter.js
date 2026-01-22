// Simple event emitter for toast notifications from non-React files
class ToastEmitter {
    constructor() {
        this.listeners = new Set();
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    emit(event) {
        this.listeners.forEach(listener => listener(event));
    }

    // Helper methods matching ToastContext interface
    success(title, message, duration, id) {
        this.emit({ type: 'success', title, message, duration, id });
    }

    error(title, message, duration, id) {
        this.emit({ type: 'error', title, message, duration, id });
    }

    info(title, message, duration, id) {
        this.emit({ type: 'info', title, message, duration, id });
    }

    warning(title, message, duration, id) {
        this.emit({ type: 'warning', title, message, duration, id });
    }
}

export const toast = new ToastEmitter();
