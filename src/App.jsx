import React from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { CRMProvider } from "./context/CRMContext";
import { ProtectedRoute, PublicRoute } from "./context/AuthGuard";

import DashboardLayout from "./layouts/DashboardLayout";

import Login from "./pages/Login";

import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import AddClient from "./pages/AddClient";
import ClientProfile from "./pages/ClientProfile";
import WorkoutPlanner from "./pages/WorkoutPlanner";
import DietPlanner from "./pages/DietPlanner";
import Attendance from "./pages/Attendance";
import Measurements from "./pages/Measurements";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import ClientDashboard from "./pages/client/ClientDashboard";

import NotFound from "./pages/NotFound";

function App() {
  return (
    <CRMProvider>
      <Router>
        <Routes>

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Login */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

          {/* Client */}
          <Route path="/client" element={<ProtectedRoute role="client"><ClientDashboard /></ProtectedRoute>} />
          <Route path="/client/dashboard" element={<ProtectedRoute role="client"><ClientDashboard /></ProtectedRoute>} />

          {/* Trainer */}
          <Route
            path="/trainer/dashboard"
            element={
              <ProtectedRoute role="trainer">
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route path="/clients" element={<ProtectedRoute role="trainer"><DashboardLayout><Clients /></DashboardLayout></ProtectedRoute>} />
          <Route path="/clients/add" element={<ProtectedRoute role="trainer"><DashboardLayout><AddClient /></DashboardLayout></ProtectedRoute>} />
          <Route path="/clients/:id" element={<ProtectedRoute role="trainer"><DashboardLayout><ClientProfile /></DashboardLayout></ProtectedRoute>} />
          <Route path="/workouts" element={<ProtectedRoute role="trainer"><DashboardLayout><WorkoutPlanner /></DashboardLayout></ProtectedRoute>} />
          <Route path="/diet" element={<ProtectedRoute role="trainer"><DashboardLayout><DietPlanner /></DashboardLayout></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute role="trainer"><DashboardLayout><Attendance /></DashboardLayout></ProtectedRoute>} />
          <Route path="/measurements" element={<ProtectedRoute role="trainer"><DashboardLayout><Measurements /></DashboardLayout></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute role="trainer"><DashboardLayout><Payments /></DashboardLayout></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute role="trainer"><DashboardLayout><Reports /></DashboardLayout></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute role="trainer"><DashboardLayout><Notifications /></DashboardLayout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute role="trainer"><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>} />

          {/* Catch all */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </Router>

      <Toaster position="top-right" richColors theme="system" />
    </CRMProvider>
  );
}

export default App;