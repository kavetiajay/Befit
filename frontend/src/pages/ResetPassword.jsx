import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  Loader2,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../services/api";

const ResetPassword = () => {
  const navigate = useNavigate();

  // State variables
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [tokenError, setTokenError] = useState(false);

  // Field validation states
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isPasswordTouched, setIsPasswordTouched] = useState(false);
  const [isConfirmPasswordTouched, setIsConfirmPasswordTouched] = useState(false);

  // Helper to extract access_token from URL query parameters or hash fragment
  const getAccessTokenFromURL = () => {
    const href = window.location.href;
    const match = href.match(/[#?&]access_token=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  };

  useEffect(() => {
    const parsedToken = getAccessTokenFromURL();
    if (parsedToken) {
      setToken(parsedToken);
      setTokenError(false);
    } else {
      setTokenError(true);
      toast.error("Invalid or expired password reset link.");
    }
  }, []);

  const validatePassword = (val) => {
    if (!val) {
      return "Password is required";
    }
    if (val.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return "";
  };

  const validateConfirmPassword = (val, pass) => {
    if (!val) {
      return "Confirm Password is required";
    }
    if (val !== pass) {
      return "Passwords do not match";
    }
    return "";
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (isPasswordTouched) {
      setPasswordError(validatePassword(val));
    }
    if (isConfirmPasswordTouched) {
      setConfirmPasswordError(validateConfirmPassword(confirmPassword, val));
    }
  };

  const handlePasswordBlur = () => {
    setIsPasswordTouched(true);
    setPasswordError(validatePassword(password));
  };

  const handleConfirmPasswordChange = (e) => {
    const val = e.target.value;
    setConfirmPassword(val);
    if (isConfirmPasswordTouched) {
      setConfirmPasswordError(validateConfirmPassword(val, password));
    }
  };

  const handleConfirmPasswordBlur = () => {
    setIsConfirmPasswordTouched(true);
    setConfirmPasswordError(validateConfirmPassword(confirmPassword, password));
  };

  const isFormValid =
    password.trim() !== "" &&
    confirmPassword.trim() !== "" &&
    !validatePassword(password) &&
    !validateConfirmPassword(confirmPassword, password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const passErr = validatePassword(password);
    const confErr = validateConfirmPassword(confirmPassword, password);

    if (passErr || confErr) {
      setPasswordError(passErr);
      setIsPasswordTouched(true);
      setConfirmPasswordError(confErr);
      setIsConfirmPasswordTouched(true);
      return;
    }

    if (!token) {
      toast.error("Recovery token is missing. Please request a new link.");
      setTokenError(true);
      return;
    }

    setIsLoading(true);

    try {
      await api.post(
        "/api/auth/reset-password",
        { password },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Password reset successful! Please log in.");
      navigate("/login");
    } catch (err) {
      console.error("Password reset error:", err);
      // Backend status code errors are centrally toasted inside api.ts
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc] dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 font-sans antialiased overflow-hidden login-page-container">
      
      {/* LEFT SIDE: Premium blurred Gym Image & soft blue gradient overlay (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden select-none">
        
        {/* Background Gym Image with blur */}
        <img
          src="/login_fitness_bg.png"
          alt="Premium Fitness Environment"
          className="absolute inset-0 w-full h-full object-cover transform scale-105 hover:scale-100 transition-transform duration-[10000ms] ease-out opacity-75 blur-[2px]"
        />

        {/* Soft Modern Blue/Cyan Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-700/60 via-blue-600/40 to-cyan-500/30 mix-blend-multiply" />

        {/* Glowing Lights */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-3xl" />

        {/* Content Box */}
        <div className="relative z-10 flex flex-col justify-between p-16 w-full h-full text-white">
          <div className="flex items-center gap-3 backdrop-blur-md bg-white/10 border border-white/15 px-5 py-3 rounded-2xl w-fit shadow-xl shadow-black/5">
            <span className="text-2xl">🏋️</span>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none text-white">
                BEFIT
              </h1>
              <span className="text-[10px] text-blue-100 font-bold uppercase tracking-wider block mt-1">
                Fitness Management System
              </span>
            </div>
          </div>

          <div className="space-y-6 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-100 text-xs font-semibold tracking-wide uppercase">
              ✨ Premium Fitness SaaS Portal
            </div>
            <h2 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight">
              Secure Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-100 via-cyan-100 to-white">
                Workout Account
              </span>
            </h2>
            <p className="text-base text-blue-100/90 leading-relaxed font-medium">
              We care about your privacy and account security. Enter your new credential details below to regain access.
            </p>
          </div>

          <div className="text-xs text-blue-100/70 font-semibold">
            © {new Date().getFullYear()} BeFit Inc. All rights reserved.
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Center login card */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 sm:px-12 py-12 relative login-right-panel">
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-80 h-80 bg-blue-100/30 dark:bg-blue-900/10 rounded-full blur-3xl -z-10 animate-pulse duration-[8000ms] login-decor" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-cyan-100/30 dark:bg-cyan-900/10 rounded-full blur-3xl -z-10 animate-pulse duration-[10000ms] login-decor" />

        {/* Form Container Card */}
        <div className="w-full max-w-[500px] bg-white dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80 shadow-[0_20px_50px_rgba(59,130,246,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md rounded-[20px] p-8 sm:p-12 animate-in fade-in zoom-in-95 duration-500 transition-all login-card-container">
          
          {/* Logo brand info */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-3 mb-6 bg-gradient-to-tr from-blue-600 to-cyan-500 text-white px-5 py-3 rounded-2xl shadow-lg shadow-blue-500/10">
              <span className="text-2xl leading-none">🏋️</span>
              <div>
                <h1 className="text-base font-black tracking-tight leading-none text-white">
                  BEFIT
                </h1>
                <span className="text-[9px] text-blue-100 font-bold uppercase tracking-wider block mt-1">
                  Fitness Management System
                </span>
              </div>
            </div>

            <h3 className="text-2xl font-black text-slate-800 dark:text-zinc-50 tracking-tight text-center login-title">
              Reset Password
            </h3>
            <p className="text-sm font-semibold text-slate-400 dark:text-zinc-400 mt-2 text-center">
              Please enter your new password below.
            </p>
          </div>

          {tokenError ? (
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-xl border border-red-100 dark:border-red-950/40 bg-red-50/50 dark:bg-red-950/10 text-red-600 dark:text-red-400">
                <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm">Recovery Link Invalid or Expired</h4>
                  <p className="text-xs leading-relaxed opacity-90">
                    The link you followed is missing a valid security signature or may have expired. Please go back to the login screen and request a new password reset link.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full h-[52px] bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-sm font-black rounded-xl transition-all shadow-md shadow-slate-950/5 flex items-center justify-center gap-2 group cursor-pointer"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Password field */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 flex items-center justify-center pointer-events-none">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={handlePasswordBlur}
                    placeholder="••••••••"
                    className={`w-full h-[52px] pl-12 pr-12 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border ${
                      passwordError
                        ? "border-red-500 focus:ring-red-200 dark:focus:ring-red-950"
                        : "border-slate-100 dark:border-zinc-800/80 focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                    } text-sm text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-4 transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 focus:outline-none cursor-pointer flex items-center justify-center"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs text-red-500 font-semibold">{passwordError}</p>
                )}
              </div>

              {/* Confirm Password field */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 flex items-center justify-center pointer-events-none">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    onBlur={handleConfirmPasswordBlur}
                    placeholder="••••••••"
                    className={`w-full h-[52px] pl-12 pr-12 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border ${
                      confirmPasswordError
                        ? "border-red-500 focus:ring-red-200 dark:focus:ring-red-950"
                        : "border-slate-100 dark:border-zinc-800/80 focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                    } text-sm text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-4 transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 focus:outline-none cursor-pointer flex items-center justify-center"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPasswordError && (
                  <p className="text-xs text-red-500 font-semibold">{confirmPasswordError}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !isFormValid}
                className="w-full h-[52px] bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 disabled:from-slate-100 disabled:to-slate-100 dark:disabled:from-zinc-800 dark:disabled:to-zinc-800 text-white disabled:text-slate-400 dark:disabled:text-zinc-600 text-sm font-black rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 group cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Back Link */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate("/login")}
              className="text-xs font-black text-blue-600 dark:text-cyan-400 hover:underline focus:outline-none cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
