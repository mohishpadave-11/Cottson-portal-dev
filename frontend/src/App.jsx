import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import ClientLayout from './components/ClientLayout';
import Home from './pages/Home';
import Companies from './pages/Companies';
import CompanyDetails from './pages/CompanyDetails';
import Clients from './pages/Clients';
import ClientDetails from './pages/ClientDetails';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import OrderTimeline from './pages/OrderTimeline';
import Products from './pages/Products';
import Folders from './pages/Folders';
import FolderDetails from './pages/FolderDetails';
import Onboarding from './pages/Onboarding';
import Admins from './pages/Admins';
import AdminDetails from './pages/AdminDetails';
import AdminProfile from './pages/AdminProfile';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ClientOrders from './pages/ClientOrders';
import ClientOrderDetails from './pages/ClientOrderDetails';
import ClientOrderTimeline from './pages/ClientOrderTimeline';
import ClientComplaints from './pages/ClientComplaints';
import ClientNotifications from './pages/ClientNotifications';
import Logout from './pages/Logout';
import Error from './components/Error';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Logout Route - Standalone */}
            <Route path="/logout" element={<Logout />} />

            {/* Client Portal Routes */}
            <Route path="/client/*" element={
              <ProtectedRoute allowedRoles={['client']}>
                <ClientLayout>
                  <Routes>
                    <Route path="orders" element={<ClientOrders />} />
                    <Route path="orders/:id" element={<ClientOrderDetails />} />
                    <Route path="orders/:id/timeline" element={<ClientOrderTimeline />} />
                    <Route path="notifications" element={<ClientNotifications />} />
                    <Route path="complaints" element={<ClientComplaints />} />
                    <Route path="*" element={<Error />} />
                  </Routes>
                </ClientLayout>
              </ProtectedRoute>
            } />

            {/* Admin Portal Routes */}
            <Route path="/*" element={
              <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/companies" element={<Companies />} />
                    <Route path="/companies/:id" element={<CompanyDetails />} />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/clients/:id" element={<ClientDetails />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/orders/:id" element={<OrderDetails />} />
                    <Route path="/orders/:id/timeline" element={<OrderTimeline />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/folders" element={<Folders />} />
                    <Route path="/folders/:id" element={<FolderDetails />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/admins" element={<Admins />} />
                    <Route path="/admins/:id" element={<AdminDetails />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/admin/profile" element={<AdminProfile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Error />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
