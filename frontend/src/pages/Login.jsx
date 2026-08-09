import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  HelpCircle,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <g transform="matrix(1, 0, 0, 1, 0, 0)">
      <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.6h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.75 21.56,11.4 21.35,11.1z" fill="#4285F4" />
      <path d="M12,20.6c2.43,0 4.47,-0.8 5.96,-2.2l-3.3,-2.6c-0.9,0.6 -2.07,0.98 -3.26,0.98 -2.33,0 -4.3,-1.58 -5,-3.7H3v2.6C4.5,18.7 8,20.6 12,20.6z" fill="#34A853" />
      <path d="M7,13.08c-0.18,-0.54 -0.28,-1.1 -0.28,-1.68s0.1,-1.14 0.28,-1.68V7.1H3C2.36,8.38 2,9.85 2,11.4s0.36,3.02 1,4.3L7,13.08z" fill="#FBBC05" />
      <path d="M12,6.22c1.32,0 2.5,0.45 3.44,1.35l2.58,-2.58C16.46,3.52 14.42,2.6 12,2.6 8,2.6 4.5,4.5 3,7.6v2.6l5,-3.7C8.7,4.32 10.67,6.22 12,6.22z" fill="#EA4335" />
    </g>
  </svg>
);

const Login = () => {
  const navigate = useNavigate();

  // Login States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Validation States
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isEmailTouched, setIsEmailTouched] = useState(false);
  const [isPasswordTouched, setIsPasswordTouched] = useState(false);

  // Forgot Password States
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotEmailError, setForgotEmailError] = useState("");
  const [isForgotEmailTouched, setIsForgotEmailTouched] = useState(false);
  const [isResetSent, setIsResetSent] = useState(false);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  // Validation Helper functions
  const validateEmail = (val) => {
    if (!val) {
      return "Email Address is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) {
      return "Invalid Email Address";
    }
    return "";
  };

  const validatePassword = (val) => {
    if (!val) {
      return "Password Required";
    }
    return "";
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (isEmailTouched) {
      setEmailError(validateEmail(val));
    }
  };

  const handleEmailBlur = () => {
    setIsEmailTouched(true);
    setEmailError(validateEmail(email));
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (isPasswordTouched) {
      setPasswordError(validatePassword(val));
    }
  };

  const handlePasswordBlur = () => {
    setIsPasswordTouched(true);
    setPasswordError(validatePassword(password));
  };

  // Form Validation State
  const isFormValid =
    email.trim() !== "" &&
    password.trim() !== "" &&
    !validateEmail(email) &&
    !validatePassword(password);

  const handleSubmit = (e) => {
    e.preventDefault();

    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);

    if (emailErr || passErr) {
      setEmailError(emailErr);
      setIsEmailTouched(true);
      setPasswordError(passErr);
      setIsPasswordTouched(true);
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Trainer Login
      if (
        email.trim().toLowerCase() === "trainee@gmail.com" &&
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
        email.trim().toLowerCase() === "client@gmail.com" &&
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

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    setTimeout(() => {
      setIsGoogleLoading(false);
      toast.success("Google Authentication Simulated! Future Integration Ready.");
    }, 1500);
  };

  // Forgot Password Helpers
  const handleForgotEmailChange = (e) => {
    const val = e.target.value;
    setForgotEmail(val);
    if (isForgotEmailTouched) {
      setForgotEmailError(validateEmail(val));
    }
  };

  const handleForgotEmailBlur = () => {
    setIsForgotEmailTouched(true);
    setForgotEmailError(validateEmail(forgotEmail));
  };

  const isForgotFormValid =
    forgotEmail.trim() !== "" && !validateEmail(forgotEmail);

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    const error = validateEmail(forgotEmail);
    if (error) {
      setForgotEmailError(error);
      setIsForgotEmailTouched(true);
      return;
    }

    setIsForgotLoading(true);
    setTimeout(() => {
      setIsForgotLoading(false);
      setIsResetSent(true);
    }, 1500);
  };

  const resetForgotModal = () => {
    setForgotEmail("");
    setForgotEmailError("");
    setIsForgotEmailTouched(false);
    setIsResetSent(false);
    setIsForgotLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc] dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 font-sans antialiased overflow-hidden login-page-container">
      
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
        <div className="absolute top-20 right-20 w-80 h-80 bg-blue-100/30 dark:bg-blue-900/10 rounded-full blur-3xl -z-10 animate-pulse duration-[8000ms] login-decor" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-cyan-100/30 dark:bg-cyan-900/10 rounded-full blur-3xl -z-10 animate-pulse duration-[10000ms] login-decor" />

        {/* Center Login Card Container with Fade-in Animation */}
        <div className="w-full max-w-[500px] bg-white dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80 shadow-[0_20px_50px_rgba(59,130,246,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md rounded-[20px] p-8 sm:p-12 animate-in fade-in zoom-in-95 duration-500 transition-all login-card-container">
          
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

            <h3 className="text-2xl font-black text-slate-800 dark:text-zinc-50 tracking-tight text-center login-title">
              Welcome Back
            </h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-bold mt-2 text-center login-subtitle">
              Sign in to continue to your account.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email Address field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block login-label">
                Email Address
              </label>
              
              <div className="relative flex items-center group">
                {/* Icon wrapper - perfectly vertically centered and spaced */}
                <div className="absolute left-[18px] text-slate-400 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors pointer-events-none flex items-center justify-center login-input-icon-wrapper">
                  <Mail className="w-5 h-5" />
                </div>
                
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  disabled={isLoading || isGoogleLoading}
                  style={{ paddingLeft: "56px" }}
                  className={`w-full h-14 pl-[56px] pr-4 bg-white dark:bg-zinc-950 border rounded-[14px] text-slate-800 dark:text-zinc-100 text-sm font-semibold placeholder-slate-400 dark:placeholder-zinc-650 focus:outline-none focus:ring-4 transition-all duration-200 login-input ${
                    emailError && isEmailTouched
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/10 dark:focus:ring-red-500/20"
                      : "border-slate-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-blue-500/10 dark:focus:ring-blue-500/20"
                  }`}
                />
              </div>
              {emailError && isEmailTouched && (
                <p className="text-[11px] font-bold text-red-500 mt-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  {emailError}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block login-label">
                Password
              </label>
              
              <div className="relative flex items-center group">
                {/* Left Lock Icon - perfectly centered */}
                <div className="absolute left-[18px] text-slate-400 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors pointer-events-none flex items-center justify-center login-input-icon-wrapper">
                  <Lock className="w-5 h-5" />
                </div>
                
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  disabled={isLoading || isGoogleLoading}
                  style={{ paddingLeft: "56px", paddingRight: "56px" }}
                  className={`w-full h-14 pl-[56px] pr-[56px] bg-white dark:bg-zinc-950 border rounded-[14px] text-slate-800 dark:text-zinc-100 text-sm font-semibold placeholder-slate-400 dark:placeholder-zinc-650 focus:outline-none focus:ring-4 transition-all duration-200 login-input ${
                    passwordError && isPasswordTouched
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/10 dark:focus:ring-red-500/20"
                      : "border-slate-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-blue-500/10 dark:focus:ring-blue-500/20"
                  }`}
                />
                
                {/* Right Eye toggle - perfectly centered */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || isGoogleLoading}
                  className="absolute right-[18px] text-slate-400 hover:text-slate-650 dark:hover:text-zinc-300 transition-colors flex items-center justify-center cursor-pointer login-password-toggle"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {passwordError && isPasswordTouched && (
                <p className="text-[11px] font-bold text-red-500 mt-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  {passwordError}
                </p>
              )}
            </div>

            {/* Remember Me and Forgot Password in one aligned row */}
            <div className="flex items-center justify-between text-xs font-bold pt-1">
              <label className="flex items-center gap-2.5 text-slate-500 dark:text-zinc-400 cursor-pointer group select-none login-remember-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading || isGoogleLoading}
                  className="w-4 h-4 rounded border-slate-350 dark:border-zinc-750 text-blue-600 focus:ring-blue-500/20 focus:ring-2 cursor-pointer transition-all duration-150"
                />
                <span className="group-hover:text-slate-700 dark:group-hover:text-zinc-200 transition-colors login-remember-text">Remember Me</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  resetForgotModal();
                  setIsForgotOpen(true);
                }}
                disabled={isLoading || isGoogleLoading}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors hover:underline cursor-pointer login-forgot-password"
              >
                Forgot Password?
              </button>
            </div>

            {/* Sign In Button: Blue gradient, height 56px, roundedCorners, white text, arrow, animation */}
            <button
              type="submit"
              disabled={!isFormValid || isLoading || isGoogleLoading}
              className="group w-full h-14 mt-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-[14px] text-sm font-black uppercase tracking-wider shadow-lg shadow-blue-500/15 hover:shadow-xl hover:shadow-blue-500/25 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
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

          {/* Social Logins OR Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100 dark:border-zinc-800/80"></div>
            </div>
            <span className="relative px-3 bg-white dark:bg-zinc-900/60 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500 leading-none">
              OR
            </span>
          </div>

          {/* Google Login button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
            className="w-full h-14 bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-800/60 border border-slate-200 dark:border-zinc-800 rounded-[14px] text-slate-700 dark:text-zinc-200 text-sm font-bold shadow-sm hover:shadow active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-500 dark:text-zinc-400" />
            ) : (
              <GoogleIcon />
            )}
            <span>Continue with Google</span>
          </button>

          {/* Security Information Encrypted */}
          <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-400 dark:text-zinc-500 font-bold text-center leading-none">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/90 dark:text-emerald-450/90 shrink-0" />
            <span>Your information is securely protected and encrypted.</span>
          </div>

          {/* Need help text */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-center gap-2 text-[10px] text-slate-400 dark:text-zinc-500 font-bold text-center login-footer-text">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0 login-footer-icon" />
            <span>Need help? Contact your gym administrator.</span>
          </div>

        </div>

      </div>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur */}
          <div 
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => {
              if (!isForgotLoading) {
                setIsForgotOpen(false);
                resetForgotModal();
              }
            }}
          />
          
          {/* Modal Content Card */}
          <div className="relative w-full max-w-[440px] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 shadow-2xl rounded-[20px] p-8 animate-in fade-in zoom-in-95 duration-300 z-10">
            
            {!isResetSent ? (
              // Reset Form Screen
              <form onSubmit={handleForgotSubmit} className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-800 dark:text-zinc-50 tracking-tight">
                    Reset Password
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 font-bold leading-relaxed">
                    Enter your registered email address. We'll send you a password reset link.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                    Email Address
                  </label>
                  <div className="relative flex items-center group">
                    <div className="absolute left-[18px] text-slate-400 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors pointer-events-none flex items-center justify-center">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={forgotEmail}
                      onChange={handleForgotEmailChange}
                      onBlur={handleForgotEmailBlur}
                      disabled={isForgotLoading}
                      style={{ paddingLeft: "56px" }}
                      className={`w-full h-14 pl-[56px] pr-4 bg-white dark:bg-zinc-950 border rounded-[14px] text-slate-800 dark:text-zinc-100 text-sm font-semibold placeholder-slate-400 dark:placeholder-zinc-650 focus:outline-none focus:ring-4 transition-all duration-200 ${
                        forgotEmailError && isForgotEmailTouched
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/10 dark:focus:ring-red-500/20"
                          : "border-slate-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-blue-500/10 dark:focus:ring-blue-500/20"
                      }`}
                    />
                  </div>
                  {forgotEmailError && isForgotEmailTouched && (
                    <p className="text-[11px] font-bold text-red-500 mt-1 animate-in fade-in slide-in-from-top-1 duration-150">
                      {forgotEmailError}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotOpen(false);
                      resetForgotModal();
                    }}
                    disabled={isForgotLoading}
                    className="flex-1 h-12 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/60 rounded-[12px] text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isForgotFormValid || isForgotLoading}
                    className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-[12px] text-xs font-black uppercase tracking-wider shadow-md shadow-blue-500/15 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isForgotLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Send Reset Link</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              // Success Screen
              <div className="flex flex-col items-center text-center py-4 space-y-6">
                {/* Animated Success Badge */}
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-bounce duration-1000">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-800 dark:text-zinc-50 tracking-tight">
                    Password Reset Link Sent
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 font-bold leading-relaxed max-w-sm">
                    If an account exists with <span className="text-slate-700 dark:text-zinc-200 font-extrabold">{forgotEmail}</span>, a password reset link has been sent.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsForgotOpen(false);
                    resetForgotModal();
                  }}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-[12px] text-xs font-black uppercase tracking-wider shadow-md shadow-blue-500/15 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  Back to Login
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default Login;
