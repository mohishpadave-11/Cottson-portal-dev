import { useState, useEffect } from 'react';
import KanbanBoard from '../components/KanbanBoard';
import Loader, { CardLoader } from '../components/Loader';
import { endpoints } from '../config/api';
// import { dummyStats } from '../data/dummyData';

const Home = () => {
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalClients: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await endpoints.stats.get();
      if (response.data) {
        setStats(response.data.data || response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Use empty stats as fallback
      setStats({
        totalCompanies: 0,
        totalClients: 0,
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalRevenue: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Orders',
      // FIX: Added safety check. If stats is null or totalOrders is undefined, use 0.
      value: (stats?.totalOrders || 0).toLocaleString(),
      change: '+12%',
      changeLabel: 'from last month',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      positive: true
    },
    {
      label: 'Active Clients',
      // FIX: Added safety check here as well
      value: (stats?.totalClients || 0).toLocaleString(),
      change: '+5%',
      changeLabel: 'from last month',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      positive: true
    },
    {
      label: 'Monthly Revenue',
      // FIX: Added safety check here as well
      value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`,
      change: '+8.2%',
      changeLabel: 'from last month',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      positive: true
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardLoader />
          <CardLoader />
          <CardLoader />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <Loader size="large" text="Loading dashboard..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</h3>
                <div className="flex items-center space-x-1">
                  <svg className={`w-4 h-4 ${stat.positive ? 'text-green-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.positive ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                  </svg>
                  <span className={`text-sm font-semibold ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500">{stat.changeLabel}</span>
                </div>
              </div>
              <div className={`${stat.iconBg} ${stat.iconColor} p-3 rounded-lg`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Order Production Timeline</h2>
          </div>
        </div>
        <div className="p-6">
          <KanbanBoard />
        </div>
      </div>
    </div>
  );
};

export default Home;