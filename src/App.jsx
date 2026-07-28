import React from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { CRMProvider } from "./context/CRMContext";
import DashboardLayout from "./layouts/DashboardLayout";
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

function App() {
  return (
    <CRMProvider>
      <Router>
        <Routes>
          {/* Client Dashboard Root */}
          <Route path="/client" element={<ClientDashboard />} />
          <Route path="/client/dashboard" element={<ClientDashboard />} />

          {/* Trainer Portal routes wrapped in DashboardLayout */}
          <Route path="/" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
          <Route path="/trainer/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
          <Route path="/clients" element={<DashboardLayout><Clients /></DashboardLayout>} />
          <Route path="/clients/add" element={<DashboardLayout><AddClient /></DashboardLayout>} />
          <Route path="/clients/:id" element={<DashboardLayout><ClientProfile /></DashboardLayout>} />
          <Route path="/workouts" element={<DashboardLayout><WorkoutPlanner /></DashboardLayout>} />
          <Route path="/diet" element={<DashboardLayout><DietPlanner /></DashboardLayout>} />
          <Route path="/attendance" element={<DashboardLayout><Attendance /></DashboardLayout>} />
          <Route path="/measurements" element={<DashboardLayout><Measurements /></DashboardLayout>} />
          <Route path="/payments" element={<DashboardLayout><Payments /></DashboardLayout>} />
          <Route path="/reports" element={<DashboardLayout><Reports /></DashboardLayout>} />
          <Route path="/notifications" element={<DashboardLayout><Notifications /></DashboardLayout>} />
          <Route path="/settings" element={<DashboardLayout><Settings /></DashboardLayout>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
      <Toaster position="top-right" richColors theme="system" />
    </CRMProvider>
  );
}

export default App;
