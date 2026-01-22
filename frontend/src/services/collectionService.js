import api from '../config/api';

const collectionService = {
    getAll: async (params) => {
        try {
            const response = await api.get('/api/collections', { params });
            return response.data.data;
        } catch (error) {
            console.error('Error fetching collections:', error);
            throw error;
        }
    },

    getById: async (id) => {
        try {
            const response = await api.get(`/api/collections/${id}`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching collection:', error);
            throw error;
        }
    },

    create: async (data) => {
        try {
            const response = await api.post('/api/collections', data);
            return response.data;
        } catch (error) {
            console.error('Error creating collection:', error);
            throw error;
        }
    },

    update: async (id, data) => {
        try {
            const response = await api.put(`/api/collections/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating collection:', error);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            const response = await api.delete(`/api/collections/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting collection:', error);
            throw error;
        }
    }
};

export default collectionService;
