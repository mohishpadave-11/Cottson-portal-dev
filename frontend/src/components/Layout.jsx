import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../config/api';
import Footer from './Footer';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(storedUser);
    } catch (e) {
      console.error('Error parsing user data', e);
    }

    const token = localStorage.getItem('token');

    if (token) {
      fetchUnreadCount();
      checkAuthStatus(); // Initial check

      // Poll for new notifications and check auth status every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
        checkAuthStatus();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/api/complaints');
      // Count complaints not read by admin
      const unread = response?.data?.filter(c => !c.isReadByAdmin).length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const checkAuthStatus = async () => {
    try {
      // Use global timeout (60s) for status checks to handle cold starts
      await api.get('/api/auth/me');
    } catch (error) {
      // If 401/403, the interceptor in api.js will handle the redirect
      // But we can double check here
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const navItems = [
    {
      path: '/home',
      label: 'Home',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      path: '/companies',
      label: 'Companies',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      path: '/clients',
      label: 'Clients',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      path: '/complaints',
      label: 'Complaints',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      )
    },
    {
      path: '/orders',
      label: 'Orders',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      path: '/products',
      label: 'Products',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      path: '/folders',
      label: 'Folders',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      )
    },
    {
      path: '/onboarding',
      label: 'Onboarding',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      )
    }
  ];

  if (user?.role === 'superadmin') {
    navItems.push({
      path: '/admins',
      label: 'Admin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    });
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop: Auto Expand on Hover, Mobile: Slide-in Menu */}
      <aside
        className={`
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
          fixed lg:static inset-y-0 left-0 z-50
          w-64
          bg-gradient-to-b from-[#0f172a] to-[#1e293b] 
          flex flex-col shadow-xl 
          transition-all duration-500 ease-in-out
        `}
        onMouseEnter={() => !mobileMenuOpen && setSidebarCollapsed(false)}
        onMouseLeave={() => !mobileMenuOpen && setSidebarCollapsed(true)}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-700">
          <div className="lg:hidden absolute top-4 right-4">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {(sidebarCollapsed && !mobileMenuOpen) ? (
            <div className="flex items-center justify-center">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-[#0f172a]">C</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center bg-white rounded-lg p-3">
              <img
                src="/logo (1).png"
                alt="TextileAdmin Logo"
                className="h-12 w-auto object-contain"
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center ${(sidebarCollapsed && !mobileMenuOpen) ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${location.pathname === item.path
                ? 'nav-active text-white'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              title={(sidebarCollapsed && !mobileMenuOpen) ? item.label : ''}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {(!sidebarCollapsed || mobileMenuOpen) && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-700">
          <div
            onClick={() => navigate('/admin/profile')}
            className={`flex items-center ${(sidebarCollapsed && !mobileMenuOpen) ? 'justify-center' : 'space-x-3'} px-2 py-2 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors`}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg flex-shrink-0">
              {getUserInitials(user?.name)}
            </div>
            {(!sidebarCollapsed || mobileMenuOpen) && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-slate-400 capitalize truncate">{user?.role || 'Guest'}</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          {(!sidebarCollapsed || mobileMenuOpen) && (
            <button
              onClick={() => navigate('/logout')}
              className="w-full mt-2 px-4 py-2 text-sm text-slate-300 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex-1 lg:flex-none">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                Welcome back, {user?.name || 'User'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 hidden sm:block">
                {location.pathname === '/' && `${getGreeting()}! Here's what's happening with your orders today.`}
                {location.pathname === '/companies' && `${getGreeting()}! Manage your company partnerships here.`}
                {location.pathname === '/clients' && `${getGreeting()}! View and manage your client relationships.`}
                {location.pathname === '/orders' && `${getGreeting()}! Track and manage all your orders.`}
                {location.pathname === '/notifications' && `${getGreeting()}! Review and respond to client complaints.`}
                {location.pathname === '/folders' && `${getGreeting()}! Browse company folders and documents.`}
                {location.pathname.startsWith('/orders/') && !location.pathname.includes('/timeline') && `${getGreeting()}! View and edit order details.`}
                {location.pathname.includes('/timeline') && `${getGreeting()}! Track order production timeline.`}
                {location.pathname.startsWith('/companies/') && `${getGreeting()}! Manage company details.`}
                {location.pathname.startsWith('/clients/') && `${getGreeting()}! Manage client information.`}
                {location.pathname.startsWith('/folders/') && `${getGreeting()}! View company orders and documents.`}
              </p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Search - Hidden on mobile */}
              <div className="relative hidden md:block">
                <input
                  type="text"
                  placeholder="Search orders, clients, or fabrics..."
                  className="w-48 lg:w-96 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Notifications */}
              <button
                onClick={() => navigate('/notifications')}
                className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Settings */}
              <button
                onClick={() => navigate('/settings')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg hidden sm:block"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* New Order Button - Only on Home Page, Hidden on mobile */}
              {location.pathname === '/home' && (
                <button
                  onClick={() => navigate('/orders/new')}
                  className="btn-primary hidden sm:flex items-center space-x-2 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New Order</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* Footer */}
        <Footer variant="admin" />
      </div>
    </div>
  );
};

export default Layout;
