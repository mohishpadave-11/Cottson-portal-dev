import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../config/api';
import companyService from '../services/companyService';
import { useToast } from '../contexts/ToastContext';

const Onboarding = () => {
    const toast = useToast();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('company'); // company, client, admin
    const [loading, setLoading] = useState(false);
    const [companies, setCompanies] = useState([]);

    // Set active tab from navigation state
    useEffect(() => {
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
        }
    }, [location.state]);

    // Fetch companies for Client form
    useEffect(() => {
        if (activeTab === 'client') {
            fetchCompanies();
        }
    }, [activeTab]);

    const fetchCompanies = async () => {
        try {
            const data = await companyService.getAll();
            setCompanies(data || []);
        } catch (error) {
            console.error('Failed to fetch companies');
            setCompanies([]);
        }
    };

    const [companyForm, setCompanyForm] = useState({
        companyName: '',
        tradeName: '',
        gstNumber: '',
        billingAddress: '',
        companyId: '',
        contactEmail: '',
        contactPhone: ''
    });

    const [clientForm, setClientForm] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        companyId: ''
    });

    const [adminForm, setAdminForm] = useState({
        name: '',
        email: '',
        phoneNumber: ''
    });

    const handleCompanySubmit = async (e) => {
        e.preventDefault();

        // Validate GST Format
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstRegex.test(companyForm.gstNumber)) {
            toast.error('Error', 'GST Number format is wrong');
            return;
        }

        setLoading(true);
        try {
            const result = await companyService.create(companyForm);
            if (result.success) {
                toast.success('Success', 'Company created successfully');
                setCompanyForm({
                    companyName: '',
                    tradeName: '',
                    gstNumber: '',
                    billingAddress: '',
                    companyId: '',
                    contactEmail: '',
                    contactPhone: ''
                });
            } else {
                toast.error('Error', result.error || 'Failed to create company');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error', 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleClientSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Use api instance which handles base URL and auth tokens
            await api.post('/api/auth/create-client', clientForm);
            toast.success('Success', 'Client created & credentials sent');
            setClientForm({ name: '', email: '', phoneNumber: '', companyId: '' });
        } catch (error) {
            toast.error('Error', error.response?.data?.message || 'Failed to create client');
        } finally {
            setLoading(false);
        }
    };

    const handleAdminSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Use api instance which handles base URL and auth tokens
            await api.post('/api/auth/create-admin', adminForm);
            toast.success('Success', 'Admin created & credentials sent');
            setAdminForm({ name: '', email: '', phoneNumber: '' });
        } catch (error) {
            toast.error('Error', error.response?.data?.message || 'Failed to create admin');
        } finally {
            setLoading(false);
        }
    };

    // Check role to show Admin tab
    const [userRole, setUserRole] = useState('');
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserRole(user.role);
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Onboarding</h1>

            {/* Tabs */}
            <div className="bg-gray-100 p-1 rounded-xl inline-flex mb-8">
                <button
                    onClick={() => setActiveTab('company')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'company'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Create Company
                </button>
                <button
                    onClick={() => setActiveTab('client')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'client'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Create Client POC
                </button>
                {userRole === 'superadmin' && (
                    <button
                        onClick={() => setActiveTab('admin')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'admin'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Create Admin
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 w-full">

                {/* Company Form */}
                {activeTab === 'company' && (
                    <form onSubmit={handleCompanySubmit} className="space-y-8 animate-fadeIn">
                        <div className="border-b border-gray-100 pb-6 mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Register New Company</h2>
                            <p className="text-gray-500 text-sm mt-1">Fill in the primary details to register a new manufacturing partner.</p>
                        </div>

                        <div className="space-y-6">
                            {/* Company Name - Full Width */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Company Name *</label>
                                <input
                                    required
                                    type="text"
                                    value={companyForm.companyName}
                                    onChange={e => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-gray-700 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                                    placeholder="e.g. Acme Corp"
                                />
                            </div>

                            {/* Trade Name & GST - Side by Side */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Trade Name *</label>
                                    <input
                                        required
                                        type="text"
                                        value={companyForm.tradeName}
                                        onChange={e => setCompanyForm({ ...companyForm, tradeName: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-gray-700 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                                        placeholder="Official Business Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">GST Number *</label>
                                    <input
                                        required
                                        type="text"
                                        value={companyForm.gstNumber}
                                        onChange={e => setCompanyForm({ ...companyForm, gstNumber: e.target.value.toUpperCase() })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-gray-700 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                                        placeholder="22AAAAA0000A1Z5"
                                    />
                                    <p className="text-[10px] text-blue-400 mt-1 uppercase font-medium tracking-wide">Format: 22AAAAA0000A1Z5</p>
                                </div>
                            </div>

                            {/* Billing Address - Full Width */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Billing Address *</label>
                                <textarea
                                    required
                                    rows="3"
                                    value={companyForm.billingAddress}
                                    onChange={e => setCompanyForm({ ...companyForm, billingAddress: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-gray-700 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none resize-none"
                                    placeholder="Full street address, City, State, ZIP..."
                                />
                            </div>

                            {/* ID & Email - Side by Side */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Company ID (Unique) *</label>
                                    <input
                                        required
                                        type="text"
                                        value={companyForm.companyId}
                                        onChange={e => setCompanyForm({ ...companyForm, companyId: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-gray-700 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                                        placeholder="e.g. ACME-001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Contact Email</label>
                                    <input
                                        type="email"
                                        value={companyForm.contactEmail}
                                        onChange={e => setCompanyForm({ ...companyForm, contactEmail: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg text-gray-700 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                                        placeholder="contact@company.com"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 shadow-md shadow-blue-200"
                            >
                                {loading ? 'Creating...' : 'Create Company'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Client POC Form */}
                {activeTab === 'client' && (
                    <form onSubmit={handleClientSubmit} className="space-y-6 animate-fadeIn">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-blue-800">
                                <span className="font-bold">Note:</span> This will create a user account for the client. They will receive login credentials via email.
                            </p>
                        </div>

                        <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-6">Create Client Point of Contact</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                                <input
                                    required
                                    type="text"
                                    value={clientForm.name}
                                    onChange={e => setClientForm({ ...clientForm, name: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email (Login ID) *</label>
                                <input
                                    required
                                    type="email"
                                    value={clientForm.email}
                                    onChange={e => setClientForm({ ...clientForm, email: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                                <input
                                    required
                                    type="tel"
                                    value={clientForm.phoneNumber}
                                    onChange={e => setClientForm({ ...clientForm, phoneNumber: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Company *</label>
                                <select
                                    required
                                    value={clientForm.companyId}
                                    onChange={e => setClientForm({ ...clientForm, companyId: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    <option value="">Select Company</option>
                                    {companies.map(c => (
                                        <option key={c._id} value={c._id}>{c.companyName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Client User'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Admin Form */}
                {activeTab === 'admin' && (
                    <form onSubmit={handleAdminSubmit} className="space-y-6 animate-fadeIn">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-blue-800">
                                <span className="font-bold">Super Admin Action:</span> Creating a new Admin user with full access to the portal.
                            </p>
                        </div>

                        <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-6">Create New Admin</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Details Name *</label>
                                <input
                                    required
                                    type="text"
                                    value={adminForm.name}
                                    onChange={e => setAdminForm({ ...adminForm, name: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email (Login ID) *</label>
                                <input
                                    required
                                    type="email"
                                    value={adminForm.email}
                                    onChange={e => setAdminForm({ ...adminForm, email: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                                <input
                                    required
                                    type="tel"
                                    value={adminForm.phoneNumber}
                                    onChange={e => setAdminForm({ ...adminForm, phoneNumber: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Admin'}
                            </button>
                        </div>
                    </form>
                )}

            </div>
        </div>
    );
};

export default Onboarding;
