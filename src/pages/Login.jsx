import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  HelpCircle
} from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!identifier.trim() || !password.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Trainer Login
      if (
        identifier.trim().toLowerCase() === "trainee@gmail.com" &&
        password === "ajay@08"
      ) {
        if (rememberMe) {
          localStorage.setItem("gym_auth", "true");
          localStorage.setItem("gym_role", "trainer");
          sessionStorage.removeItem("gym_auth");
          sessionStorage.removeItem("gym_role");
        } else {
          sessionStorage.setItem("gym_auth", "true");
          sessionStorage.setItem("gym_role", "trainer");
          localStorage.setItem("gym_role", "trainer");
          localStorage.removeItem("gym_auth");
        }
        toast.success("Welcome Trainer!");
        navigate("/trainer/dashboard");
        return;
      }

      // Client Login
      if (
        identifier.trim().toLowerCase() === "client@gmail.com" &&
        password === "sharan@03"
      ) {
        if (rememberMe) {
          localStorage.setItem("gym_auth", "true");
          localStorage.setItem("gym_role", "client");
          sessionStorage.removeItem("gym_auth");
          sessionStorage.removeItem("gym_role");
        } else {
          sessionStorage.setItem("gym_auth", "true");
          sessionStorage.setItem("gym_role", "client");
          localStorage.setItem("gym_role", "client");
          localStorage.removeItem("gym_auth");
        }
        toast.success("Welcome Client!");
        navigate("/client/dashboard");
        return;
      }

      toast.error("Invalid email or password.");
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc] text-slate-800 font-sans antialiased overflow-hidden login-page-container">
      
      {/* LEFT SIDE: Premium blurred Gym Image & soft blue gradient overlay (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden select-none">
        
        {/* Background Gym Image with blur to avoid distraction */}
        <img
          src="/login_fitness_bg.png"
          alt="Premium Fitness Environment"
          className="absolute inset-0 w-full h-full object-cover transform scale-105 hover:scale-100 transition-transform duration-[10000ms] ease-out opacity-75 blur-[2px]"
        />

        {/* Soft Modern Blue/Cyan Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-700/60 via-blue-600/40 to-cyan-500/30 mix-blend-multiply" />

        {/* Deep Ambient Glowing Lights for Premium Polish */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-3xl" />

        {/* Content Box */}
        <div className="relative z-10 flex flex-col justify-between p-16 w-full h-full text-white">
          {/* Logo brand info */}
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

          {/* Inspirational Tagline */}
          <div className="space-y-6 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-100 text-xs font-semibold tracking-wide uppercase">
              ✨ Premium Fitness SaaS Portal
            </div>
            <h2 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight">
              Powering The <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-100 via-cyan-100 to-white">
                Ultimate Gym Experience
              </span>
            </h2>
            <p className="text-base text-blue-100/90 leading-relaxed font-medium">
              A comprehensive suite to manage workouts, plan nutrition, monitor client progress, and run gym operations seamlessly.
            </p>
          </div>

          <div className="text-xs text-blue-100/70 font-semibold">
            © {new Date().getFullYear()} BeFit Inc. All rights reserved.
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Perfectly centered login card */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 sm:px-12 py-12 relative login-right-panel">
        
        {/* Soft background decor for modern depth */}
        <div className="absolute top-20 right-20 w-80 h-80 bg-blue-100/30 rounded-full blur-3xl -z-10 animate-pulse duration-[8000ms] login-decor" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-cyan-100/30 rounded-full blur-3xl -z-10 animate-pulse duration-[10000ms] login-decor" />

        {/* Center Login Card Container with Fade-in Animation */}
        <div className="w-full max-w-[500px] bg-white border border-slate-100 shadow-[0_20px_50px_rgba(59,130,246,0.06)] rounded-[20px] p-8 sm:p-12 animate-in fade-in zoom-in-95 duration-500 transition-all login-card-container">
          
          {/* Header section with emoji logo */}
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

            <h3 className="text-2xl font-black text-slate-800 tracking-tight text-center login-title">
              Welcome Back
            </h3>
            <p className="text-xs text-slate-400 font-bold mt-2 text-center login-subtitle">
              Sign in to continue to your account.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email / Phone / Member ID field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block login-label">
                Email / Phone / Member ID
              </label>
              
              <div className="relative flex items-center group">
                {/* Icon wrapper - perfectly vertically centered and spaced */}
                <div className="absolute left-[18px] text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none flex items-center justify-center login-input-icon-wrapper">
                  <Mail className="w-5 h-5" />
                </div>
                
                {/* Input element - 56px height, 14px border radius, 56px left padding */}
                <input
                  type="text"
                  required
                  placeholder="Enter email, phone or ID"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={isLoading}
                  style={{ paddingLeft: "56px" }}
                  className="w-full h-14 pl-[56px] pr-4 bg-white border border-slate-200 rounded-[14px] text-slate-800 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 login-input"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block login-label">
                Password
              </label>
              
              <div className="relative flex items-center group">
                {/* Left Lock Icon - perfectly centered */}
                <div className="absolute left-[18px] text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none flex items-center justify-center login-input-icon-wrapper">
                  <Lock className="w-5 h-5" />
                </div>
                
                {/* Password Input - 56px height, 14px border radius, 56px left and right padding */}
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  style={{ paddingLeft: "56px", paddingRight: "56px" }}
                  className="w-full h-14 pl-[56px] pr-[56px] bg-white border border-slate-200 rounded-[14px] text-slate-800 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 login-input"
                />
                
                {/* Right Eye toggle - perfectly centered */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-[18px] text-slate-400 hover:text-slate-650 transition-colors flex items-center justify-center cursor-pointer login-password-toggle"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me and Forgot Password in one aligned row */}
            <div className="flex items-center justify-between text-xs font-bold pt-1">
              <label className="flex items-center gap-2.5 text-slate-500 cursor-pointer group select-none login-remember-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 focus:ring-2 cursor-pointer transition-all duration-150"
                />
                <span className="group-hover:text-slate-700 transition-colors login-remember-text">Remember Me</span>
              </label>

              <button
                type="button"
                onClick={() => toast.info("Forgot Password flow needs gym administrator reset.")}
                disabled={isLoading}
                className="text-blue-600 hover:text-blue-700 transition-colors hover:underline cursor-pointer login-forgot-password"
              >
                Forgot Password?
              </button>
            </div>

            {/* Sign In Button: Blue gradient, height 56px, roundedCorners, white text, arrow, animation */}
            <button
              type="submit"
              disabled={isLoading}
              className="group w-full h-14 mt-6 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-[14px] text-sm font-black uppercase tracking-wider shadow-lg shadow-blue-500/15 hover:shadow-xl hover:shadow-blue-500/25 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-85 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </button>
          </form>

          {/* Need help text */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400 font-bold text-center login-footer-text">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 login-footer-icon" />
            <span>Need help? Contact your gym administrator.</span>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Login;
