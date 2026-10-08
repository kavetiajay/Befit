import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../services/api";

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
  const location = useLocation();

  useEffect(() => {
    const verifySession = async () => {
      if (isAuthenticated()) {
        const token = localStorage.getItem("gym_token") || sessionStorage.getItem("gym_token");
        if (token) {
          try {
            await api.get("/api/auth/session");
          } catch (error) {
            console.warn("Session check failed, session is invalid or expired.", error);
          }
        }
      }
    };
    verifySession();
  }, [location.pathname]);

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
