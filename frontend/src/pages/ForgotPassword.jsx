import React from 'react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../config/api';

const ForgotPassword = () => {
    const [searchParams] = useSearchParams();
    const from = searchParams.get('from');

    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const loginLink = from === 'client' ? '/client/login' : '/login';
    const loginText = from === 'client' ? 'Back to Client Login' : 'Back to Login';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            const response = await api.post('/api/auth/forgot-password', { email });
            setStatus('success');
            setMessage(response.data.message || 'Password reset link sent to your email.');
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Failed to send reset email. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex selection:bg-blue-100 selection:text-blue-900 overflow-hidden bg-white">
            {/* Left Side - Image & Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#0f172a] text-white flex-col justify-end p-12 lg:p-16 overflow-hidden">
                <div className="absolute inset-0">
                    <img src="/login.JPG" alt="Background" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-[#0d3858] opacity-90"></div>
                </div>

                <div className="relative z-10 w-full max-w-lg">
                    {/* Decorative Line */}
                    <div className="w-12 h-1 bg-white/30 mb-8 rounded-full"></div>

                    <h1 className="text-4xl lg:text-5xl font-light tracking-tight mb-6">
                        Excellence in <span className="font-serif italic font-medium">Textiles</span>
                    </h1>

                    <p className="text-lg text-gray-300 font-light leading-relaxed mb-12">
                        Sign in to workwear crafted for comfort and built for performance.
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-white relative">
                <div className="w-full max-w-md space-y-8">
                    {/* Header */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-center mb-8">
                            <img
                                src="/logo.png"
                                alt="Cottson Logo"
                                className="h-16 w-auto object-contain"
                            />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
                            <p className="mt-2 text-sm text-gray-500">
                                Enter your institutional email to receive reset instructions.
                            </p>
                        </div>
                    </div>

                    {status === 'success' ? (
                        <div className="text-center animate-fade-in">
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Check your email</h3>
                            <p className="text-gray-500 mb-8">{message}</p>
                            <Link
                                to={loginLink}
                                className="inline-block w-full bg-blue-800 text-white py-3.5 rounded-lg font-bold hover:bg-blue-900 transition-all duration-200"
                            >
                                {loginText}
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {status === 'error' && (
                                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-100 flex items-center">
                                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {message}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Institutional Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full px-4 py-3 text-gray-900 border border-gray-200 rounded-lg placeholder-gray-300 focus:outline-none focus:border-[#0d3858] focus:ring-1 focus:ring-[#0d3858] transition-colors bg-white hover:border-gray-300"
                                    placeholder="name@cottson.com"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#0d3858] hover:bg-[#0a2c46] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0d3858] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {status === 'loading' ? (
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : 'Send Reset Instructions'}
                            </button>

                            <div className="text-center">
                                <Link to={loginLink} className="text-sm font-semibold text-gray-500 hover:text-blue-800 transition-colors flex items-center justify-center group">
                                    <svg className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    {loginText}
                                </Link>
                            </div>
                        </form>
                    )}

                    {/* Footer */}
                    <div className="pt-8 mt-8 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-medium uppercase tracking-wider">
                        <p>&copy; 2026 Cottson Group</p>
                        <div className="space-x-4">
                            <a href="mailto:contact@cottson.com" className="hover:text-gray-600">Contact Us</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
