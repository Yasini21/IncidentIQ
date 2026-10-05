import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import AdminDashboard from "./pages/AdminDashboard";
import DeveloperDashboard from "./pages/DeveloperDashboard";
import AnalyticsPage from "./pages/AnalyticsPage";


import CreatePage from "./pages/CreatePage";
import Login from "./pages/Login";
import Register from "./pages/Register";

import { Toaster } from "react-hot-toast";
import { Routes, Route, Navigate } from "react-router-dom";

// Simple protection
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

const RoleRoute = ({ role, children }) => {
  const currentRole = localStorage.getItem("role");

  if (currentRole !== role) {
    return <Navigate to={currentRole === "admin" ? "/admin" : "/"} replace />;
  }

  return children;
};

function App() {
  return (
    <>
      <Toaster position="top-right" />

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
  path="/analytics"
  element={
    <ProtectedRoute>
            <RoleRoute role="admin">
              <Layout>
                <AnalyticsPage />
              </Layout>
            </RoleRoute>
    </ProtectedRoute>
  }
/>
        <Route
         path="/admin"
         element={
       <ProtectedRoute>
        <RoleRoute role="admin">
          <Layout>
            <AdminDashboard />
          </Layout>
        </RoleRoute>
    </ProtectedRoute>
  }
/>
     
<Route
  path="/developer"
  element={
    <ProtectedRoute>
      <RoleRoute role="developer">
        <Layout>
          <DeveloperDashboard />
        </Layout>
      </RoleRoute>
    </ProtectedRoute>
  }
/>


<Route
  path="/analytics"
  element={
    <ProtectedRoute>
      <Layout>
        <AnalyticsPage />
      </Layout>
    </ProtectedRoute>
  }
/>

        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <Layout>
                <CreatePage />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;