import React from 'react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const ClientLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/clients/login', formData);

      // Store client info in localStorage - Using standard keys to match main login
      localStorage.setItem('user', JSON.stringify(response.data.client));
      localStorage.setItem('token', response.data.token || 'client-authenticated');

      // Redirect to client orders page
      navigate('/client/orders');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d3858] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-2xl p-4 shadow-xl mb-4">
            <img
              src="/logo (1).png"
              alt="Client Portal Logo"
              className="h-16 w-auto object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Client Portal</h1>
          <p className="text-slate-300">Please enter your credentials to access the client portal</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your phone number"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0d3858] text-white py-3 rounded-lg font-medium hover:bg-[#0a2c46] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link to="/forgot-password?from=client" className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                Forgot Password?
              </Link>
            </div>
            <p className="text-sm text-gray-600">
              Contact <a href="mailto:support@cottson.com" className="text-blue-600 hover:underline">Support</a>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-semibold text-blue-900 mb-2">Demo Credentials:</p>
            <div className="text-xs text-blue-800 space-y-1">
              <p><span className="font-medium">Email:</span> demo@client.com</p>
              <p><span className="font-medium">Phone:</span> 9876543210</p>
            </div>
          </div>
        </div>

        {/* Admin Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-slate-300 hover:text-white text-sm transition-colors"
          >
            Admin Portal →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientLogin;
