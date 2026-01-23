import { endpoints } from '../config/api';
// import { dummyOrders } from '../data/dummyData';

class OrderService {
  async getAll() {
    try {
      const response = await endpoints.orders.getAll();
      const data = response.data;
      // Handle { success: true, data: [...] } structure
      const orders = data.data || data;
      // Ensure we return an array
      return Array.isArray(orders) ? orders : [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Return empty array as fallback
      return [];
    }
  }

  async getById(id) {
    try {
      const response = await endpoints.orders.getById(id);
      // Backend returns { success: true, data: order }
      // So we need to access response.data.data to get the actual order
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      // Return null as fallback
      return null;
    }
  }

  async create(orderData) {
    try {
      const response = await endpoints.orders.create(orderData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating order:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create order'
      };
    }
  }

  async update(id, orderData) {
    try {
      const response = await endpoints.orders.update(id, orderData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating order:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update order'
      };
    }
  }

  async updateTimeline(id, timeline) {
    try {
      const response = await endpoints.orders.patch(id, { timeline });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating timeline:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update timeline'
      };
    }
  }

  async delete(id) {
    try {
      await endpoints.orders.delete(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting order:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete order'
      };
    }
  }

  async uploadDocument(id, file, docType) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', docType);

      const response = await endpoints.orders.uploadDocument(id, formData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error uploading document:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to upload document'
      };
    }
  }
}

export default new OrderService();
