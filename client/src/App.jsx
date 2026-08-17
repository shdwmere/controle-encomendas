import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NavBar } from './components/NavBar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NovaEncomenda } from './pages/NovaEncomenda';
import { Moradores } from './pages/Moradores';


function Layout({ children }) {
  const { token } = useAuth();
  return (
    <>
     {token && <NavBar />}
     <main>{children}</main>
    </>
  );
}

export default function App() {
  return(
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nova"
              element={
                <ProtectedRoute>
                  <NovaEncomenda />
                </ProtectedRoute>
              }
            />
            <Route
              path="/moradores"
              element={
                <ProtectedRoute>
                  <Moradores />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}