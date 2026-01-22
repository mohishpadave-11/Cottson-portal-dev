import { endpoints } from '../config/api';
// import { dummyCompanies } from '../data/dummyData';

class CompanyService {
  async getAll() {
    try {
      const response = await endpoints.companies.getAll();
      const data = response.data;
      // Handle { success: true, data: [...] } structure
      const companies = data.data || data;
      // Ensure we return an array
      return Array.isArray(companies) ? companies : [];
    } catch (error) {
      console.error('Error fetching companies:', error);
      return [];
    }
  }

  async getById(id) {
    try {
      const response = await endpoints.companies.getById(id);
      // Handle { success: true, data: {...} } structure
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching company:', error);
      return null;
    }
  }

  async create(companyData) {
    try {
      const response = await endpoints.companies.create(companyData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating company:', error.response?.data?.message || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create company'
      };
    }
  }

  async update(id, companyData) {
    try {
      const response = await endpoints.companies.update(id, companyData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating company:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update company'
      };
    }
  }

  async delete(id) {
    try {
      await endpoints.companies.delete(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting company:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete company'
      };
    }
  }
}

export default new CompanyService();
