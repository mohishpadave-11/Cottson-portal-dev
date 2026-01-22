import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { useToast } from '../contexts/ToastContext';
import Pagination from '../components/Pagination';
import { TableLoader } from '../components/Loader';
import ConfirmationModal from '../components/ConfirmationModal';

const Admins = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal States
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [adminToDelete, setAdminToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [resetModalOpen, setResetModalOpen] = useState(false);
    const [adminToReset, setAdminToReset] = useState(null);
    const [isResetting, setIsResetting] = useState(false);

    // Fetch Admins
    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/auth/users?role=admin');
            setAdmins(response.data.users || []);
        } catch (error) {
            console.error('Error fetching admins:', error);
        } finally {
            setLoading(false);
        }
    };

    // Delete Handlers
    const handleDeleteClick = (admin) => {
        setAdminToDelete(admin);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!adminToDelete) return;

        try {
            setIsDeleting(true);
            await api.delete(`/api/auth/delete-user/${adminToDelete._id}`);
            toast.success('Success', 'Admin deleted successfully');
            fetchAdmins();
            setDeleteModalOpen(false);
            setAdminToDelete(null);
        } catch (error) {
            toast.error('Error', error.response?.data?.message || 'Failed to delete admin');
        } finally {
            setIsDeleting(false);
        }
    };

    // Reset Password Handlers
    const handleResetClick = (admin) => {
        setAdminToReset(admin);
        setResetModalOpen(true);
    };

    const handleConfirmReset = async () => {
        if (!adminToReset) return;

        try {
            setIsResetting(true);
            await api.post(`/api/auth/reset-user-password/${adminToReset._id}`, {});
            toast.success('Success', 'New credentials sent to admin');
            setResetModalOpen(false);
            setAdminToReset(null);
        } catch (error) {
            toast.error('Error', 'Failed to reset password');
        } finally {
            setIsResetting(false);
        }
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = admins.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(admins.length / itemsPerPage);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Admins Management</h1>
                <button
                    onClick={() => navigate('/onboarding', { state: { tab: 'admin' } })}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Admin</span>
                </button>
            </div>

            <div className="bg-white rounded-lg shadow">
                {loading ? (
                    <TableLoader rows={5} columns={4} />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {currentItems.length > 0 ? currentItems.map(admin => (
                                        <tr key={admin._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{admin.name || 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{admin.email}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-2 py-1 text-xs rounded-full shadow-sm font-medium ${admin.status === 'active' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                                    {admin.status || 'Active'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex items-center space-x-3">
                                                    <button
                                                        onClick={() => navigate(`/admins/${admin._id}`)}
                                                        className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                                        title="View & Edit Admin"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                        <span>View</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleResetClick(admin)}
                                                        className="text-orange-600 hover:text-orange-900 flex items-center space-x-1"
                                                        title="Reset Password"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 16l-.707.707-.707.707H8.536v-1.536l-.707-.707-.707-.707.707-.707L9.293 12.293a6 6 0 010-8.486 6 6 0 018.486 0zM17 19a2 2 0 11-4 0 2 2 0 014 0z" />
                                                        </svg>
                                                        <span>Reset</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(admin)}
                                                        className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                                                        title="Delete Admin"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        <span>Delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                                No admins found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Admin"
                message={`Are you sure you want to delete ${adminToDelete?.name || 'this admin'}? This action cannot be undone.`}
                confirmText="Delete Admin"
                isLoading={isDeleting}
                variant="danger"
            />

            {/* Reset Password Confirmation Modal */}
            <ConfirmationModal
                isOpen={resetModalOpen}
                onClose={() => setResetModalOpen(false)}
                onConfirm={handleConfirmReset}
                title="Reset Password"
                message={`Are you sure you want to reset the password for ${adminToReset?.name || 'this admin'}? They will receive an email with new credentials.`}
                confirmText="Reset Password"
                isLoading={isResetting}
                variant="warning"
            />
        </div>
    );
};

export default Admins;
