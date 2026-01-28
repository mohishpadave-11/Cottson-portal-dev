import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { endpoints } from '../config/api';
import Loader from '../components/Loader';

const Folders = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data: responseData } = await endpoints.companies.getAll();
      const data = responseData.data || responseData;
      setCompanies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company =>
    (company.companyName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleFolderClick = (companyId, companyName) => {
    navigate(`/folders/${companyId}`, { state: { companyName } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader size="large" text="Loading folders..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Company Folders</h1>
        </div>
        <div className="relative w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search folders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Folders Grid */}
      {filteredCompanies.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-gray-900">No folders found</p>
          <p className="text-sm text-gray-500 mt-1">Try a different search term</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 min-h-[500px]">
          {/* Grid Layout: 5 folders per row on XL screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-12">
            {filteredCompanies.map((company) => (
              <div
                key={company._id}
                className="flex flex-col items-center group cursor-pointer"
                onClick={() => handleFolderClick(company._id, company.companyName)}
              >
                {/* Folder Icon Container */}
                <div className="relative w-28 h-24 mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1">
                  {/* Mac Folder Icon */}
                  <img
                    src="/mac.png"
                    alt="Folder"
                    className="w-full h-full object-contain drop-shadow-lg"
                  />
                </div>

                {/* Folder Name */}
                <div className="text-center px-1 w-full">
                  <p className="text-sm font-semibold text-gray-700 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2 break-words">
                    {company.companyName}
                  </p>

                  {/* Optional: Item Count */}
                  <p className="text-xs text-gray-400 mt-1">
                    {company.totalOrders || 0} items
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Folders;