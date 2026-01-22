import { endpoints } from '../config/api';
// import { dummyClients } from '../data/dummyData';

class ClientService {
  async getAll() {
    try {
      const response = await endpoints.clients.getAll();
      const data = response.data;
      // Handle { success: true, data: [...] } structure
      const clients = data.data || data;
      return Array.isArray(clients) ? clients : [];
    } catch (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
  }

  async getById(id) {
    try {
      const response = await endpoints.clients.getById(id);
      return response.data;
    } catch (error) {
      console.error('Error fetching client:', error);
      return null;
    }
  }

  async create(clientData) {
    try {
      const response = await endpoints.clients.create(clientData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating client:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create client'
      };
    }
  }

  async update(id, clientData) {
    try {
      const response = await endpoints.clients.update(id, clientData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating client:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update client'
      };
    }
  }

  async delete(id) {
    try {
      await endpoints.clients.delete(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting client:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete client'
      };
    }
  }
}

export default new ClientService();
