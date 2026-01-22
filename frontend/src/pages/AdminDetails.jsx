import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config/api';
import Loader, { ButtonLoader } from '../components/Loader';
import { useToast } from '../contexts/ToastContext';

const AdminDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        role: '',
        status: ''
    });

    useEffect(() => {
        if (id !== 'new') {
            fetchAdmin();
        } else {
            setLoading(false);
            setIsEditing(true); // Default to editing mode for new admin
        }
    }, [id]);

    const fetchAdmin = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/admins/${id}`);
            const data = response.data.data || response.data;
            setAdmin(data);
            setFormData({
                name: data.name || '',
                email: data.email || '',
                phoneNumber: data.phoneNumber || '',
                role: data.role || '',
                status: data.status || ''
            });
        } catch (error) {
            console.error('Error fetching admin:', error);
            toast.error('Error', 'Failed to fetch admin details');
            navigate('/admins');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);

            if (id === 'new') {
                await api.post('/api/admins', formData);
                toast.success('Success', 'Admin created successfully');
                navigate('/admins');
            } else {
                await api.put(`/api/admins/${id}`, formData);
                toast.success('Success', 'Admin updated successfully');
                // Update local state if staying on page (though standard is usually to navigate or refresh)
                setAdmin({ ...admin, ...formData });
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Error saving admin:', error);
            toast.error('Error', error.response?.data?.message || 'Failed to save admin');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <Loader fullScreen text="Loading admin details..." />;
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-gray-500">
                <button onClick={() => navigate('/admins')} className="hover:text-gray-700">Admins</button>
                <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-900 font-medium">{admin?.name || 'Admin Details'}</span>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <h1 className="text-3xl font-bold text-gray-900">{admin?.name}</h1>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full uppercase shadow-sm ${admin?.status === 'active' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                        {admin?.status}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full uppercase">
                        {admin?.role}
                    </span>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit Admin</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center space-x-2 mb-6">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        disabled={!isEditing}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        disabled={!isEditing}
                                        value={formData.email}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        required
                                        disabled={!isEditing}
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200"
                                    />
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Column - Status/Role Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center space-x-2 mb-6">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Account Status</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Role</p>
                                <p className="font-semibold text-gray-900 capitalize">{admin?.role}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Current Status</p>
                                {isEditing ? (
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                ) : (
                                    <p className="flex items-center">
                                        <span className={`px-2 py-1 text-xs rounded-full shadow-sm font-medium ${admin?.status === 'active' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                            {admin?.status}
                                        </span>
                                    </p>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Last Login</p>
                                <p className="text-gray-900">{admin?.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : 'Never'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Changes Button */}
            {isEditing && (
                <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 -mx-8 -mb-6">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">Unsaved changes</span> - Make sure to save your changes before leaving
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(false);
                                    fetchAdmin(); // Reset form
                                }}
                                disabled={saving}
                                className="px-6 py-2.5 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="btn-primary flex items-center space-x-2 px-6 py-2.5 text-white rounded-lg font-medium"
                            >
                                {saving ? (
                                    <>
                                        <ButtonLoader />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                        </svg>
                                        <span>Save Changes</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDetails;
