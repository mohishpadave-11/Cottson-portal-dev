import React from 'react';
import { useState, useEffect } from 'react';
import { endpoints } from '../config/api';
import Loader, { ButtonLoader } from '../components/Loader';
import { useToast } from '../contexts/ToastContext';
import { COMPLAINT_STATUS, PRIORITY_LEVELS } from '../constants/complaintStatus';
import Pagination from '../components/Pagination';

const AdminComplaints = () => {
    const toast = useToast();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Active'); // Active, Resolved
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Resolution Modal
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [adminResponse, setAdminResponse] = useState('');
    const [isResolving, setIsResolving] = useState(false);

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const { data: responseData } = await endpoints.complaints.getAll();
            setComplaints(responseData.data || responseData);
        } catch (error) {
            console.error('Error fetching complaints:', error);
            toast.error('Error', 'Failed to load complaints');
        } finally {
            setLoading(false);
        }
    };

    const handleResolveSubmit = async (e) => {
        e.preventDefault();
        if (!selectedComplaint) return;

        try {
            setIsResolving(true);
            const updatedComplaint = {
                status: COMPLAINT_STATUS.RESOLVED,
                adminResponse: adminResponse,
                resolvedAt: new Date().toISOString()
            };

            await endpoints.complaints.update(selectedComplaint._id, updatedComplaint);

            toast.success('Success', 'Complaint resolved and client notified');
            fetchComplaints(); // Refresh list
            setSelectedComplaint(null);
            setAdminResponse('');
        } catch (error) {
            console.error('Error resolving complaint:', error);
            toast.error('Error', 'Failed to resolve complaint');
        } finally {
            setIsResolving(false);
        }
    };

    // Pagination Reset on Filter Change
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, searchTerm]);

    const filteredComplaints = complaints.filter(c => {
        // Status Filter
        const isActive = [COMPLAINT_STATUS.OPEN, COMPLAINT_STATUS.IN_PROGRESS].includes(c.status);
        const isResolved = [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.CLOSED].includes(c.status);

        if (filter === 'Active' && !isActive) return false;
        if (filter === 'Resolved' && !isResolved) return false;

        // Search Filter
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            return (
                c.subject.toLowerCase().includes(lowerSearch) ||
                c.clientName.toLowerCase().includes(lowerSearch) ||
                c._id.toLowerCase().includes(lowerSearch)
            );
        }

        return true;
        return true;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentComplaints = filteredComplaints.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);

    const getPriorityColor = (priority) => {
        switch (priority) {
            case PRIORITY_LEVELS.HIGH: return 'bg-red-100 text-red-800';
            case PRIORITY_LEVELS.MEDIUM: return 'bg-yellow-100 text-yellow-800';
            case PRIORITY_LEVELS.LOW: return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case COMPLAINT_STATUS.OPEN: return 'bg-blue-100 text-blue-800';
            case COMPLAINT_STATUS.RESOLVED: return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) return <Loader fullScreen text="Loading complaints..." />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900">Complaints Management</h1>

                {/* Filter Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setFilter('Active')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'Active' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setFilter('Resolved')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'Resolved' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Resolved
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <input
                    type="text"
                    placeholder="Search by subject, client name, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d3858]"
                />
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#0d3858] text-white border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold uppercase">Complaint ID</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase">Client</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase">Subject</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase">Priority</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {currentComplaints.length > 0 ? (
                                currentComplaints.map((complaint) => (
                                    <tr key={complaint._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                                            #{complaint._id.slice(-6).toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{complaint.clientName}</div>
                                            <div className="text-xs text-gray-500">{complaint.clientEmail}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 font-medium truncate max-w-xs" title={complaint.subject}>
                                                {complaint.subject}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate max-w-xs mt-1" title={complaint.description}>
                                                {complaint.description}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                                                {complaint.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                                                {complaint.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(complaint.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {filter === 'Active' && (
                                                <button
                                                    onClick={async () => {
                                                        setSelectedComplaint(complaint);
                                                        setAdminResponse('');
                                                        // Mark as read if not already read
                                                        if (!complaint.isReadByAdmin) {
                                                            try {
                                                                await endpoints.complaints.markAsRead(complaint._id);
                                                                fetchComplaints(); // Refresh to update read status locally
                                                            } catch (err) {
                                                                console.error('Failed to mark complaint as read:', err);
                                                            }
                                                        }
                                                    }}
                                                    className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors"
                                                >
                                                    View
                                                </button>
                                            )}
                                            {filter === 'Resolved' && (
                                                <span className="text-gray-400 text-sm">Resolved</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        No complaints found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedComplaint && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Complaint Details</h2>
                                <button
                                    onClick={() => setSelectedComplaint(null)}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="mb-6 space-y-4">
                                {/* Header Info */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedComplaint.subject}</h3>
                                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                                            <span>#{selectedComplaint._id.slice(-6).toUpperCase()}</span>
                                            <span>•</span>
                                            <span>{new Date(selectedComplaint.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedComplaint.priority)}`}>
                                            {selectedComplaint.priority}
                                        </span>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedComplaint.status)}`}>
                                            {selectedComplaint.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
                                    <p className="text-gray-900 whitespace-pre-wrap">{selectedComplaint.description}</p>
                                </div>

                                {/* Client Info */}
                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Client</label>
                                        <p className="text-gray-900 font-medium">{selectedComplaint.clientName}</p>
                                        <p className="text-gray-500 text-sm">{selectedComplaint.clientEmail}</p>
                                    </div>
                                    {selectedComplaint.orderId && (
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Related Order</label>
                                            <p className="text-gray-900 font-medium font-mono">
                                                #{typeof selectedComplaint.orderId === 'object'
                                                    ? selectedComplaint.orderId._id.slice(-6).toUpperCase()
                                                    : selectedComplaint.orderId?.slice(-6).toUpperCase() || 'N/A'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <form onSubmit={handleResolveSubmit}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Admin Response (Sent to Client) <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        required
                                        rows={5}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter the resolution details..."
                                        value={adminResponse}
                                        onChange={(e) => setAdminResponse(e.target.value)}
                                    />
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedComplaint(null)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isResolving}
                                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                                    >
                                        {isResolving ? (
                                            <>
                                                <ButtonLoader />
                                                <span>Resolving...</span>
                                            </>
                                        ) : (
                                            <span>Mark as Resolved</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminComplaints;
