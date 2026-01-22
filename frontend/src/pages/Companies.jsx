import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import Pagination from '../components/Pagination';
import { TableLoader } from '../components/Loader';
import companyService from '../services/companyService';
import { useToast } from '../contexts/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';

const Companies = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStats, setActiveStats] = useState({ count: 0, change: 0, isPositive: true });
  const [newCompanyStats, setNewCompanyStats] = useState({ count: 0, change: 0, isPositive: true });
  const [totalStats, setTotalStats] = useState({ count: 0, change: 0, isPositive: true });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  // Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCompanies();
    fetchActiveStats();
    fetchNewStats();
    fetchTotalStats();
  }, []);

  useEffect(() => {
    const filtered = companies.filter(company =>
      (company.companyName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (company.tradeName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (company.gstNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (company.billingAddress?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (String(company.companyId || '').toLowerCase()).includes(searchTerm.toLowerCase())
    );
    setFilteredCompanies(filtered);
    setCurrentPage(1);
  }, [searchTerm, companies]);

  const fetchActiveStats = async () => {
    try {
      const response = await api.get('/api/stats/companies/active-stats');
      if (response.data?.success) {
        setActiveStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching active stats:', error);
    }
  };

  const fetchNewStats = async () => {
    try {
      const response = await api.get('/api/stats/companies/new-stats');
      if (response.data?.success) {
        setNewCompanyStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching new company stats:', error);
    }
  };

  const fetchTotalStats = async () => {
    try {
      const response = await api.get('/api/stats/companies/total-stats');
      if (response.data?.success) {
        setTotalStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching total company stats:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const data = await companyService.getAll();
      setCompanies(data);
      setFilteredCompanies(data);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Error', 'Failed to load companies');
      // Set empty array on error
      setCompanies([]);
      setFilteredCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (company) => {
    setCompanyToDelete(company);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!companyToDelete) return;

    try {
      setIsDeleting(true);
      const result = await companyService.delete(companyToDelete._id);
      if (result.success) {
        toast.success('Success', 'Company deleted successfully');
        fetchCompanies();
        setDeleteModalOpen(false);
        setCompanyToDelete(null);
      } else {
        toast.error('Error', result.error);
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Error', 'An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (company) => {
    navigate(`/companies/${company._id}`);
  };

  const handleAdd = () => {
    navigate('/onboarding');
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCompanies.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
        <button
          onClick={handleAdd}
          className="btn-primary text-white px-4 py-2 rounded-lg flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Company
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase mb-1">Total Companies</p>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{totalStats.count}</h3>
              <div className="flex items-center space-x-1">
                <svg className={`w-4 h-4 ${totalStats.isPositive ? 'text-green-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={totalStats.isPositive ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                </svg>
                <span className={`text-sm font-semibold ${totalStats.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {totalStats.isPositive ? '+' : ''}{totalStats.change}%
                </span>
                <span className="text-sm text-gray-500">from last month</span>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${totalStats.isPositive ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase mb-1">Active Companies</p>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{activeStats.count}</h3>
              <div className="flex items-center space-x-1">
                <svg className={`w-4 h-4 ${activeStats.isPositive ? 'text-green-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={activeStats.isPositive ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                </svg>
                <span className={`text-sm font-semibold ${activeStats.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {activeStats.isPositive ? '+' : ''}{activeStats.change}%
                </span>
                <span className="text-sm text-gray-500">from last 6 months</span>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${activeStats.isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase mb-1">New Companies</p>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{newCompanyStats.count}</h3>
              <div className="flex items-center space-x-1">
                <svg className={`w-4 h-4 ${newCompanyStats.isPositive ? 'text-green-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={newCompanyStats.isPositive ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                </svg>
                <span className={`text-sm font-semibold ${newCompanyStats.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {newCompanyStats.isPositive ? '+' : ''}{newCompanyStats.change}%
                </span>
                <span className="text-sm text-gray-500">from last month</span>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${newCompanyStats.isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <TableLoader rows={10} columns={6} />
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trade Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GST Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Billing Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentItems.map(company => (
                  <tr key={company._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{company.companyName}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{company.tradeName}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{company.gstNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{company.billingAddress}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{company.companyId}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleEdit(company)}
                          className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                          title="View Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(company)}
                          className="text-red-600 hover:text-red-800 flex items-center space-x-1"
                          title="Delete Company"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Company"
        message={`Are you sure you want to delete ${companyToDelete?.companyName}? This action cannot be undone.`}
        confirmText="Delete Company"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
};

export default Companies;
