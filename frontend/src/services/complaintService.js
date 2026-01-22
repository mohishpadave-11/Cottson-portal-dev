import { endpoints } from '../config/api';
// import { dummyComplaints } from '../data/dummyData';

class ComplaintService {
  async getAll() {
    try {
      const response = await endpoints.complaints.getAll();
      const data = response.data;
      // Handle { success: true, data: [...] } structure
      const complaints = data.data || data;
      return Array.isArray(complaints) ? complaints : [];
    } catch (error) {
      console.error('Error fetching complaints:', error);
      return [];
    }
  }

  async getById(id) {
    try {
      const response = await endpoints.complaints.getById(id);
      return response.data;
    } catch (error) {
      console.error('Error fetching complaint:', error);
      return null;
    }
  }

  async create(complaintData) {
    try {
      const response = await endpoints.complaints.create(complaintData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating complaint:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create complaint'
      };
    }
  }

  async update(id, complaintData) {
    try {
      const response = await endpoints.complaints.update(id, complaintData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating complaint:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update complaint'
      };
    }
  }

  async delete(id) {
    try {
      await endpoints.complaints.delete(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting complaint:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete complaint'
      };
    }
  }
}

export default new ComplaintService();
