import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from 'antd';
import { Header } from './components/Header';
import logo from './logo.svg';
import './App.css';
import { AuthProvider } from './components/auth/AuthContext';
import { useAuth } from './components/auth/AuthContext';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import Dashboard from './components/Dashboard';
import { Sidebar } from './components/Sidebar';
import Profile from './components/Profile';
import api from './api'; // Assuming you have an api module

interface File {
  id: number;
  file: string;
  file_type: string;
  file_size: number;
  upload_date: string;
  description: string;
}

const { Content } = Layout;

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [files, setFiles] = React.useState<File[]>([]);

  // Only fetch files when user is authenticated
  React.useEffect(() => {
    if (user) {
      const fetchFiles = async () => {
        try {
          const response = await api.get<File[]>("/api/files/");
          setFiles(response.data);
        } catch (err) {
          console.error("Failed to fetch files:", err);
        }
      };

      fetchFiles();
    }
  }, [user]);

  const handleLogout = () => {
    setFiles([]);
    logout();
    navigate("/login");
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {location.pathname !== "/login" && location.pathname !== "/register" && (
        <Sidebar onLogout={handleLogout} />
      )}
      <Layout>
        {location.pathname !== "/login" && location.pathname !== "/register" && (
          <Header onLogout={handleLogout} />
        )}
        <Layout.Content
          style={{ 
            padding: "24px", 
            background: location.pathname === "/login" || location.pathname === "/register" ? "#fff" : "#f0f2f5",
            minHeight: "100vh",
            marginLeft: location.pathname !== "/login" && location.pathname !== "/register" ? "200px" : 0
          }}
        >
          {location.pathname === "/login" || location.pathname === "/register" ? (
            <div className="auth-header" style={{
              position: "fixed",
              top: 0,
              left: 0,
              padding: "24px",
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              gap: "1rem"
            }}>
              <img 
                src="/logo.png" 
                alt="DocuVault" 
                style={{ 
                  height: "48px",
                  width: "auto",
                  verticalAlign: "middle"
                }} 
              />
              <h2 className="text-2xl font-bold m-0" style={{
                display: "inline-block",
                verticalAlign: "middle",
                color: "#2C3E50"
              }}>DocuVault</h2>
            </div>
          ) : null}
          <Routes>
            <Route path="/login" element={<LoginForm onToggleForm={() => navigate('/register')} />} />
            <Route path="/register" element={<RegisterForm onToggleForm={() => navigate('/login')} />} />
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard files={files} onFilesUpdated={setFiles} />
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="*" element={
              user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            } />
          </Routes>
        </Layout.Content>
      </Layout>
    </Layout>
  );
}

// --- PrivateRoute Component ---
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const navigate = useNavigate();

  // Show loading state while checking auth
  if (loading) {
    return <div>Loading...</div>;
  }

  // If we have a token but no user data yet, fetch it
  const token = localStorage.getItem('access_token');
  if (!user && token) {
    // This will trigger the useEffect in AuthContext to fetch user data
    return <div>Loading user data...</div>;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppWrapper() {
  return <App />;
}

export default AppWrapper;
