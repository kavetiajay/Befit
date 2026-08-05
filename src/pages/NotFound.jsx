import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Compass } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#09090b] text-slate-800 dark:text-zinc-150 flex flex-col justify-center items-center p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-6">
        
        {/* BeFit Premium Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center gap-3 bg-gradient-to-tr from-blue-600 to-cyan-500 text-white px-5 py-3 rounded-2xl shadow-lg shadow-blue-500/10">
            <span className="text-2xl leading-none">🏋️</span>
            <div className="text-left">
              <h1 className="text-base font-black tracking-tight leading-none text-white">
                BEFIT
              </h1>
              <span className="text-[9px] text-blue-100 font-bold uppercase tracking-wider block mt-1">
                Fitness Management System
              </span>
            </div>
          </div>
        </div>

        {/* 404 Illustration and text */}
        <div className="relative">
          <h2 className="text-9xl font-black tracking-tighter text-blue-600/10 dark:text-blue-500/5 select-none leading-none">
            404
          </h2>
          <div className="absolute inset-0 flex flex-col justify-center items-center">
            <Compass className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin duration-[15000ms]" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-850 dark:text-zinc-50 tracking-tight">
            Page Not Found
          </h3>
          <p className="text-xs text-slate-400 dark:text-zinc-550 font-semibold max-w-sm mx-auto leading-relaxed">
            The link you followed may be broken or the page may have been removed. Let's get you back on track!
          </p>
        </div>

        {/* Navigation actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-zinc-850 active:scale-95 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-xs rounded-xl shadow-md shadow-blue-500/10 active:scale-95 transition cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default NotFound;
