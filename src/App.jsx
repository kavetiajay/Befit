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

function App() {
  return (
    <CRMProvider>
      <Router>
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/add" element={<AddClient />} />
            <Route path="/clients/:id" element={<ClientProfile />} />
            <Route path="/workouts" element={<WorkoutPlanner />} />
            <Route path="/diet" element={<DietPlanner />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/measurements" element={<Measurements />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </DashboardLayout>
      </Router>
      <Toaster position="top-right" richColors theme="system" />
    </CRMProvider>
  );
}

export default App;
