import React from "react";
import { Navigate } from "react-router-dom";

export const isAuthenticated = () => {
  return (
    localStorage.getItem("gym_auth") === "true" ||
    sessionStorage.getItem("gym_auth") === "true"
  );
};

export const getSessionRole = () => {
  return localStorage.getItem("gym_role") || sessionStorage.getItem("gym_role") || "trainer";
};

export const ProtectedRoute = ({ children, role }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const currentRole = getSessionRole();
  if (role && currentRole !== role) {
    if (currentRole === "client") {
      return <Navigate to="/client/dashboard" replace />;
    } else {
      return <Navigate to="/trainer/dashboard" replace />;
    }
  }

  return children;
};

export const PublicRoute = ({ children }) => {
  if (isAuthenticated()) {
    const currentRole = getSessionRole();
    if (currentRole === "client") {
      return <Navigate to="/client/dashboard" replace />;
    } else {
      return <Navigate to="/trainer/dashboard" replace />;
    }
  }

  return children;
};
