import api from '../config/api';

const productService = {
    getAll: async (params) => {
        try {
            const response = await api.get('/api/products', { params });
            return response.data.data;
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    },

    getById: async (id) => {
        try {
            const response = await api.get(`/api/products/${id}`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching product:', error);
            throw error;
        }
    },

    create: async (data) => {
        try {
            const response = await api.post('/api/products', data);
            return response.data;
        } catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    },

    update: async (id, data) => {
        try {
            const response = await api.put(`/api/products/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            const response = await api.delete(`/api/products/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    }
};

export default productService;
