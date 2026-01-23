import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../components/Pagination';
import orderService from '../services/orderService';
import companyService from '../services/companyService';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../contexts/ToastContext';

const Orders = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    companyId: '',
    searchQuery: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchCompanies();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, orders]);

  const fetchOrders = async () => {
    try {
      const data = await orderService.getAll();
      const ordersArray = Array.isArray(data) ? data : [];
      setOrders(ordersArray);
      setFilteredOrders(ordersArray);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
      setFilteredOrders([]);
    }
  };

  const fetchCompanies = async () => {
    try {
      const data = await companyService.getAll();
      const companiesArray = Array.isArray(data) ? data : [];
      setCompanies(companiesArray);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    if (filters.startDate) {
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(order => {
        if (!order.orderDate) return false;
        const orderDate = new Date(order.orderDate);
        return orderDate >= start;
      });
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(order => {
        if (!order.orderDate) return false;
        const orderDate = new Date(order.orderDate);
        return orderDate <= end;
      });
    }

    if (filters.companyId) {
      filtered = filtered.filter(order => {
        const orderCompanyId = typeof order.companyId === 'object'
          ? order.companyId?._id
          : order.companyId;
        return orderCompanyId === filters.companyId;
      });
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(order => {
        const orderNumber = order.orderNumber?.toString().toLowerCase() || '';
        const companyName = order.companyId?.companyName?.toLowerCase() || '';
        const clientName = order.clientId?.name?.toLowerCase() || '';
        return orderNumber.includes(query) || companyName.includes(query) || clientName.includes(query);
      });
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const handleDeleteClick = (order) => {
    setOrderToDelete(order);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;

    setIsDeleting(true);
    try {
      const result = await orderService.delete(orderToDelete._id);
      if (result.success) {
        toast.success('Success', 'Order deleted successfully');
        fetchOrders(); // Refresh list
      } else {
        toast.error('Error', result.error || 'Failed to delete order');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Error', 'An unexpected error occurred');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setOrderToDelete(null);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // Calculate stats
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (parseFloat(order.priceWithGst) || 0), 0);
  const pendingOrders = filteredOrders.filter(order => order.paymentStatus !== 'Full Settlement').length;
  const completedOrders = filteredOrders.filter(order => order.paymentStatus === 'Full Settlement').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <button
          onClick={() => navigate('/orders/new')}
          className="btn-primary text-white px-4 py-2 rounded-lg flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Order
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase">Total Orders</span>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{filteredOrders.length}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase">Pending Orders</span>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{pendingOrders}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase">Completed Orders</span>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{completedOrders}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase">Total Revenue</span>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Search</label>
            <input
              type="text"
              placeholder="Order #, Company, Client..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="w-full px-4 py-2 border border-gray-100 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d3858]/10 focus:border-[#0d3858] transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-100 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d3858]/10 focus:border-[#0d3858] transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-100 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d3858]/10 focus:border-[#0d3858] transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Company</label>
            <select
              value={filters.companyId}
              onChange={(e) => setFilters({ ...filters, companyId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-100 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d3858]/10 focus:border-[#0d3858] transition-all"
            >
              <option value="">All Companies</option>
              {companies.map(company => (
                <option key={company._id} value={company._id}>
                  {company.companyName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#0d3858] text-white border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Order Number</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Order Date</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Price with GST</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Order Status</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Payment Status</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {currentItems.map(order => (
                <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900 font-mono">#{order.orderNumber}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(order.orderDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">{order.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">₹{order.priceWithGst?.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${order.timeline === 'Order Completed' ? 'bg-gray-100 text-gray-800' :
                      order.timeline === 'Shipped' ? 'bg-teal-100 text-teal-800' :
                        order.timeline === 'Packing' ? 'bg-green-100 text-green-800' :
                          order.timeline === 'Stitching' ? 'bg-yellow-100 text-yellow-800' :
                            order.timeline === 'Embroidery/Printing' ? 'bg-pink-100 text-pink-800' :
                              order.timeline === 'Fabric Cutting' ? 'bg-orange-100 text-orange-800' :
                                order.timeline === 'Fabric Purchase' ? 'bg-purple-100 text-purple-800' :
                                  'bg-blue-100 text-blue-800'
                      }`}>
                      {order.timeline}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase whitespace-nowrap ${order.paymentStatus === 'Full Settlement' ? 'bg-[#d4edda] text-[#155724]' :
                      order.paymentStatus === 'Advance Pending' ? 'bg-[#f8d7da] text-[#721c24]' :
                        order.paymentStatus === 'Balance Pending' ? 'bg-[#fff3cd] text-[#856404]' :
                          order.paymentStatus === 'Cancelled' ? 'bg-[#721c24] text-white' :
                            'bg-gray-100 text-gray-800'
                      }`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 truncate max-w-[150px]" title={order.companyId?.companyName}>
                      {order.companyId?.companyName || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/orders/${order._id}`)}
                        className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title="View Order"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => navigate(`/orders/${order._id}?tab=timeline`)}
                        className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                        title="View Manufacturing Timeline"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(order)}
                        className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        title="Delete Order"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentItems.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    No orders found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white px-6 py-4 border-t border-gray-100">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Order"
        message={`Are you sure you want to delete order ${orderToDelete?.orderNumber}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Orders;
