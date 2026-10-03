import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { AgentDashboard } from './pages/AgentDashboard';
import { TeamLeadDashboard } from './pages/TeamLeadDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { CreateTicket } from './pages/CreateTicket';
import { TicketDetail } from './pages/TicketDetail';
import { OrdersList } from './pages/OrdersList';

const HomeRouter: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'SUPPORT_AGENT':
      return <AgentDashboard />;
    case 'TEAM_LEAD':
      return <TeamLeadDashboard />;
    case 'ADMIN':
      return <AdminDashboard />;
    case 'CUSTOMER':
    default:
      return <CustomerDashboard />;
  }
};

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 font-medium">Initializing Resolvify System...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {user && <Sidebar />}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/"
            element={
              <MainLayout>
                <HomeRouter />
              </MainLayout>
            }
          />
          <Route
            path="/tickets/new"
            element={
              <MainLayout>
                <CreateTicket />
              </MainLayout>
            }
          />
          <Route
            path="/tickets/:id"
            element={
              <MainLayout>
                <TicketDetail />
              </MainLayout>
            }
          />
          <Route
            path="/orders"
            element={
              <MainLayout>
                <OrdersList />
              </MainLayout>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
