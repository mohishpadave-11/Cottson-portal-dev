import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../config/api';
import Footer from './Footer';

const ClientLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clientInfo, setClientInfo] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setClientInfo(user);
      fetchUnreadCount(user);

      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => fetchUnreadCount(user), 30000);
      return () => clearInterval(interval);
    }
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const fetchUnreadCount = async (user) => {
    try {
      const [ordersResponse, complaintsResponse] = await Promise.all([
        api.get('/api/orders', { params: { companyId: user.companyId } }),
        api.get('/api/complaints')
      ]);

      const recentOrders = ordersResponse.data.data.filter(order => {
        const daysSinceUpdate = (new Date() - new Date(order.updatedAt || order.createdAt)) / (1000 * 60 * 60 * 24);
        return daysSinceUpdate <= 7; // Orders updated in last 7 days
      }).length;

      const activeComplaints = complaintsResponse.data.filter(c =>
        c.clientId === user._id && !c.isReadByClient
      ).length;

      setUnreadCount(recentOrders + activeComplaints);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleLogout = () => {
    navigate('/logout');
  };

  const navItems = [
    {
      path: '/client/orders',
      label: 'My Orders',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      path: '/client/complaints',
      label: 'Complaints',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    }
  ];

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

          {sidebarCollapsed && !mobileMenuOpen ? (
            <div className="flex items-center justify-center">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-[#0f172a]">C</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center bg-white rounded-lg p-3">
              <img
                src="/logo (1).png"
                alt="Client Portal Logo"
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
              className={`flex items-center ${(sidebarCollapsed && !mobileMenuOpen) ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${location.pathname === item.path || location.pathname.startsWith(item.path)
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
          <div className={`flex items-center ${(sidebarCollapsed && !mobileMenuOpen) ? 'justify-center' : 'space-x-3'} px-2 py-2 rounded-lg`}>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg flex-shrink-0">
              {clientInfo?.name?.charAt(0).toUpperCase() || 'C'}
            </div>
            {(!sidebarCollapsed || mobileMenuOpen) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{clientInfo?.name || 'Client'}</p>
                <p className="text-xs text-slate-400 truncate">Client Portal</p>
              </div>
            )}
          </div>
          {(!sidebarCollapsed || mobileMenuOpen) && (
            <button
              onClick={handleLogout}
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
                Welcome back, {clientInfo?.name || 'Client'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 hidden sm:block">
                {location.pathname === '/client/orders' && `${getGreeting()}! View and track all your orders here.`}
                {location.pathname === '/client/notifications' && `${getGreeting()}! Stay updated with your order and complaint status.`}
                {location.pathname === '/client/complaints' && `${getGreeting()}! Raise or view your complaints here.`}
                {location.pathname.startsWith('/client/orders/') && !location.pathname.includes('/timeline') && `${getGreeting()}! View your order details.`}
                {location.pathname.includes('/timeline') && `${getGreeting()}! Track your order production timeline.`}
              </p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Search - Hidden on mobile */}
              <div className="relative hidden md:block">
                <input
                  type="text"
                  placeholder="Search your orders..."
                  className="w-48 lg:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Notifications */}
              <button
                onClick={() => navigate('/client/notifications')}
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
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* Footer */}
        <Footer variant="client" />
      </div>
    </div>
  );
};

export default ClientLayout;
