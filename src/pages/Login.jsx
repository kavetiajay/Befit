import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dumbbell,
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
        toast.success("Welcome Trainer!");
        navigate("/trainer/dashboard");
        return;
      }

      // Client Login
      if (
        identifier.trim().toLowerCase() === "client@gmail.com" &&
        password === "sharan@03"
      ) {
        toast.success("Welcome Client!");
        navigate("/client/dashboard");
        return;
      }

      toast.error("Invalid email or password.");
      setIsLoading(false);
    }, 1500);
  };
  return (
    <div className="min-h-screen flex bg-gradient-to-tr from-slate-50 via-white to-blue-50/30 text-slate-800 font-sans antialiased overflow-hidden">

      {/* LEFT SIDE: Large Fitness Image & Gradient Overlay (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden select-none">

        {/* Background Fitness Image */}
        <img
          src="/login_fitness_bg.png"
          alt="Premium Fitness Environment"
          className="absolute inset-0 w-full h-full object-cover transform scale-105 hover:scale-100 transition-transform duration-10000 ease-out opacity-80"
        />

        {/* Deep Blue Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700/80 via-blue-600/70 to-cyan-500/60 mix-blend-multiply" />

        {/* Decorative Grid Patterns */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.15))] pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 flex flex-col justify-between p-16 w-full h-full text-white">

          {/* BeFit Top Branding */}
          <div className="flex items-center gap-3.5 backdrop-blur-md bg-white/10 border border-white/15 px-5 py-3 rounded-2xl w-fit shadow-xl shadow-black/5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-white to-blue-50 flex items-center justify-center text-blue-600 shadow-md">
              <Dumbbell className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none text-white">
                BeFit
              </h1>
              <span className="text-[10px] text-blue-100 font-bold uppercase tracking-wider block mt-1">
                Personal Companion
              </span>
            </div>
          </div>

          {/* Welcome Text Block */}
          <div className="space-y-6 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-400/20 border border-cyan-300/35 text-cyan-200 text-xs font-semibold tracking-wide uppercase">
              🚀 Commercial Gym CRM Portal
            </div>
            <h2 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight drop-shadow-sm">
              Transform Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-white">
                Fitness Journey
              </span>
            </h2>
            <p className="text-base text-blue-100/90 leading-relaxed font-medium">
              Manage workouts, diet plans, attendance, and memberships all in one place. Streamline your gym experience and tracking suite.
            </p>
          </div>

          {/* Footer Text */}
          <div className="text-xs text-blue-200/70 font-semibold">
            © {new Date().getFullYear()} BeFit CRM. All rights reserved.
          </div>
        </div>

        {/* Decorative ambient glowing lights */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl" />
      </div>

      {/* RIGHT SIDE: Centered Login Card */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 sm:px-12 py-12 relative">

        {/* Decorative shapes for Light Mode glassmorphism look */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl -z-10 animate-pulse duration-[6000ms]" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-cyan-200/20 rounded-full blur-3xl -z-10 animate-pulse duration-[8000ms]" />

        <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_20px_50px_rgba(59,130,246,0.08)] rounded-3xl p-8 sm:p-10 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(59,130,246,0.12)]">

          {/* Logo brand & Welcome Back */}
          <div className="flex flex-col items-center mb-8">
            <div className="lg:hidden flex items-center gap-2 mb-6 bg-gradient-to-tr from-blue-600 to-cyan-400 text-white px-4 py-2 rounded-2xl shadow-lg shadow-blue-500/10">
              <Dumbbell className="w-5 h-5" />
              <span className="text-base font-black tracking-tight">BeFit</span>
            </div>

            <h3 className="text-2xl font-black text-slate-850 tracking-tight text-center">
              Welcome Back
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-2 text-center">
              Sign in to continue to your account.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Identifier Input (Email / Phone / Member ID) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Email / Phone / Member ID
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Mail className="w-4.5 h-4.5" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter email, phone or ID"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-800 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Password
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-11 pr-12 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-800 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-650 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4.5 h-4.5" />
                  ) : (
                    <Eye className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Checkbox and Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2.5 font-semibold text-slate-600 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 focus:ring-2 cursor-pointer transition"
                />
                <span className="group-hover:text-slate-800 transition-colors">Remember Me</span>
              </label>

              <button
                type="button"
                onClick={() => toast.info("Forgot Password flow needs gym administrator reset.")}
                disabled={isLoading}
                className="font-bold text-blue-600 hover:text-blue-700 transition-colors hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button with subtle Loading Animation */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-2xl text-sm font-black uppercase tracking-wider shadow-lg shadow-blue-500/15 hover:shadow-xl hover:shadow-blue-500/25 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-85 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Need help text */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500 font-semibold text-center">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Need help? Contact your gym administrator.</span>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Login;
