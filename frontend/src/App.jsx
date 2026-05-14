import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import AdminDashboard from "./pages/AdminDashboard";
import EngineerDashboard from "./pages/EngineerDashboard";
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
      <Layout>
        <AnalyticsPage />
      </Layout>
    </ProtectedRoute>
  }
/>
        <Route
         path="/admin"
         element={
       <ProtectedRoute>
      <Layout>
        <AdminDashboard />
      </Layout>
    </ProtectedRoute>
  }
/>
     
<Route
  path="/engineer"
  element={
    <ProtectedRoute>
      <Layout>
        <EngineerDashboard />
      </Layout>
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