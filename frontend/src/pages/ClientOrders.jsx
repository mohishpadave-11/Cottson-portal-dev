import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { endpoints } from '../config/api';
import Pagination from '../components/Pagination';
import Loader from '../components/Loader';

const ClientOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    paymentStatus: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchOrders();
  }, [navigate]);

  useEffect(() => {
    applyFilters();
  }, [filters, orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Get user info from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        navigate('/login');
        return;
      }

      const user = JSON.parse(userStr);

      // Fetch orders for this client's company
      const response = await endpoints.orders.getAll({
        params: {
          companyId: user.companyId
        }
      });

      setOrders(response.data.data);
      setFilteredOrders(response.data.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    if (filters.startDate) {
      filtered = filtered.filter(order => new Date(order.orderDate) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      filtered = filtered.filter(order => new Date(order.orderDate) <= new Date(filters.endDate));
    }
    if (filters.paymentStatus) {
      filtered = filtered.filter(order => order.paymentStatus === filters.paymentStatus);
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // Calculate stats
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (parseFloat(order.priceWithGst) || 0), 0);
  const pendingOrders = filteredOrders.filter(order => order.paymentStatus !== 'Full Settlement').length;
  const completedOrders = filteredOrders.filter(order => order.paymentStatus === 'Full Settlement').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader size="large" text="Loading your orders..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-500 uppercase">Total Orders</span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{filteredOrders.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-500 uppercase">Pending Orders</span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{pendingOrders}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-500 uppercase">Completed Orders</span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{completedOrders}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-500 uppercase">Total Value</span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d3858]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d3858]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
            <select
              value={filters.paymentStatus}
              onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d3858]"
            >
              <option value="">All Status</option>
              <option value="Advance Pending">Advance Pending</option>
              <option value="Balance Pending">Balance Pending</option>
              <option value="Full Settlement">Full Settlement</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0d3858] text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Order Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Order Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Price with GST</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Payment Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-lg font-medium">No orders found</p>
                    <p className="text-sm mt-1">Your orders will appear here once they are created</p>
                  </td>
                </tr>
              ) : (
                currentItems.map(order => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">₹{order.price.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">₹{order.priceWithGst.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase whitespace-nowrap ${order.paymentStatus === 'Full Settlement' ? 'bg-[#d4edda] text-[#155724]' :
                        order.paymentStatus === 'Advance Pending' ? 'bg-[#f8d7da] text-[#721c24]' :
                          order.paymentStatus === 'Balance Pending' ? 'bg-[#fff3cd] text-[#856404]' :
                            order.paymentStatus === 'Cancelled' ? 'bg-[#721c24] text-white' :
                              'bg-gray-100 text-gray-800'
                        }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => navigate(`/client/orders/${order._id}`)}
                        className="text-purple-600 hover:text-purple-800 font-medium"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => navigate(`/client/orders/${order._id}/timeline`)}
                        className="text-green-600 hover:text-green-800 font-medium"
                      >
                        Timeline
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-200">
          {currentItems.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-lg font-medium">No orders found</p>
              <p className="text-sm mt-1">Your orders will appear here once they are created</p>
            </div>
          ) : (
            currentItems.map(order => (
              <div key={order._id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">Order #{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">{new Date(order.orderDate).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase whitespace-nowrap ${order.paymentStatus === 'Full Settlement' ? 'bg-[#d4edda] text-[#155724]' :
                    order.paymentStatus === 'Advance Pending' ? 'bg-[#f8d7da] text-[#721c24]' :
                      order.paymentStatus === 'Balance Pending' ? 'bg-[#fff3cd] text-[#856404]' :
                        order.paymentStatus === 'Cancelled' ? 'bg-[#721c24] text-white' :
                          'bg-gray-100 text-gray-800'
                    }`}>
                    {order.paymentStatus}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                  <div>
                    <span className="text-gray-500">Quantity:</span>
                    <span className="ml-1 font-medium text-gray-900">{order.quantity}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Price:</span>
                    <span className="ml-1 font-medium text-gray-900">₹{order.price.toLocaleString()}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Total with GST:</span>
                    <span className="ml-1 font-medium text-gray-900">₹{order.priceWithGst.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/client/orders/${order._id}`)}
                    className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => navigate(`/client/orders/${order._id}/timeline`)}
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                  >
                    Timeline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};

export default ClientOrders;
