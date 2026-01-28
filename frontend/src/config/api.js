import api from './axios';

// API endpoints
export const endpoints = {
  // Collections
  collections: {
    getAll: (params) => api.get('/collections', { params }),
    getById: (id) => api.get(`/collections/${id}`),
    create: (data) => api.post('/collections', data),
    update: (id, data) => api.put(`/collections/${id}`, data),
    delete: (id) => api.delete(`/collections/${id}`),
  },

  // Authentication
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getMe: () => api.get('/auth/me'),
    verify: () => api.get('/auth/verify'),
    createClient: (data) => api.post('/auth/create-client', data),
    createAdmin: (data) => api.post('/auth/create-admin', data),
    resetUserPassword: (userId, data) => api.post(`/auth/reset-user-password/${userId}`, data),
    forgotPassword: (data) => api.post('/auth/forgot-password', data),
    resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),
    changePassword: (data) => api.post('/auth/change-password', data),
    getUsers: (params) => api.get('/auth/users', { params }),
    deleteUser: (id) => api.delete(`/auth/delete-user/${id}`),
    updateProfile: (data) => api.put('/auth/update-profile', data),
  },

  // Companies
  companies: {
    getAll: (params) => api.get('/companies', { params }),
    getById: (id) => api.get(`/companies/${id}`),
    create: (data) => api.post('/companies', data),
    update: (id, data) => api.put(`/companies/${id}`, data),
    delete: (id) => api.delete(`/companies/${id}`),
    getNextId: (name) => api.get('/companies/next-id', { params: { name } }),
  },

  // Clients
  clients: {
    getAll: (params) => api.get('/clients', { params }),
    getById: (id) => api.get(`/clients/${id}`),
    create: (data) => api.post('/clients', data),
    update: (id, data) => api.put(`/clients/${id}`, data),
    delete: (id) => api.delete(`/clients/${id}`),
    login: (credentials) => api.post('/clients/login', credentials),
  },

  // Products
  products: {
    getAll: (params) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
  },

  // Orders
  orders: {
    getAll: (params) => api.get('/orders', { params }),
    getById: (id) => api.get(`/orders/${id}`),
    create: (data) => api.post('/orders', data),
    update: (id, data) => api.put(`/orders/${id}`, data),
    patch: (id, data) => api.patch(`/orders/${id}`, data),
    updateTimeline: (id, stage) => api.patch(`/orders/${id}`, { timeline: stage }),
    delete: (id) => api.delete(`/orders/${id}`),
    uploadDocument: (id, formData) => api.post(`/orders/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getNextOrderNumber: (companyId) => api.get('/orders/next-number', { params: { companyId } }),
    getUploadUrl: (id, data) => api.post(`/orders/${id}/upload-url`, data),
    syncDocument: (id, data) => api.put(`/orders/${id}/documents`, data),
    addPayment: (id, data) => api.post(`/orders/${id}/payments`, data),
    updatePayment: (id, paymentId, data) => api.put(`/orders/${id}/payments/${paymentId}`, data),
    deletePayment: (id, paymentId) => api.delete(`/orders/${id}/payments/${paymentId}`),
    deleteDocument: (id, docId) => api.delete(`/orders/${id}/documents/${docId}`),
    renameDocument: (id, docId, name) => api.patch(`/orders/${id}/documents/${docId}/rename`, { name }),
    notifyDocument: (id, data) => api.post(`/orders/${id}/documents/notify`, data),
  },

  // Complaints
  complaints: {
    getAll: (params) => api.get('/complaints', { params }),
    getById: (id) => api.get(`/complaints/${id}`),
    create: (data) => api.post('/complaints', data),
    update: (id, data) => api.put(`/complaints/${id}`, data),
    delete: (id) => api.delete(`/complaints/${id}`),
    markAsRead: (id) => api.patch(`/complaints/${id}/mark-as-read`),
  },

  // Stats
  stats: {
    get: () => api.get('/stats'),
    getActiveCompanyStats: () => api.get('/stats/companies/active-stats'),
    getNewCompanyStats: () => api.get('/stats/companies/new-stats'),
    getTotalCompanyStats: () => api.get('/stats/companies/total-stats'),
  },

  // Settings
  settings: {
    getCharges: () => api.get('/settings/charges'),
    updateCharges: (data) => api.post('/settings/charges', data),
  },

  // Search
  search: {
    query: (q) => api.get(`/search?q=${encodeURIComponent(q)}`),
  },

  // Admins (if separate from auth users, but AdminDetails uses /admins)
  admins: {
    getAll: (params) => api.get('/admins', { params }), // Assuming generic listing if needed
    getById: (id) => api.get(`/admins/${id}`),
    create: (data) => api.post('/admins', data),
    update: (id, data) => api.put(`/admins/${id}`, data),
    delete: (id) => api.delete(`/admins/${id}`),
  },

  // Utilities
  utils: {
    uploadToUrl: (url, file, contentType) => api.put(url, file, { headers: { 'Content-Type': contentType } }),
  },
};
