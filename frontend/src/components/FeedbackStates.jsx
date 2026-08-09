import React from "react";
import { Link } from "react-router-dom";
import { AlertOctagon, RotateCcw, Home, Inbox } from "lucide-react";

export const SkeletonLoader = ({ type = "card", count = 1 }) => {
  const skeletons = Array.from({ length: count });

  if (type === "table") {
    return (
      <div className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-soft animate-pulse">
        <div className="bg-slate-50 dark:bg-zinc-950 px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex justify-between gap-4">
          <div className="h-4 bg-slate-200 dark:bg-zinc-805 rounded-full w-24"></div>
          <div className="h-4 bg-slate-200 dark:bg-zinc-805 rounded-full w-32"></div>
          <div className="h-4 bg-slate-200 dark:bg-zinc-805 rounded-full w-20"></div>
          <div className="h-4 bg-slate-200 dark:bg-zinc-805 rounded-full w-16"></div>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-zinc-850">
          {skeletons.map((_, i) => (
            <div key={i} className="px-6 py-5 flex justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-zinc-800"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded-full w-28"></div>
                  <div className="h-2.5 bg-slate-150 dark:bg-zinc-850 rounded-full w-20"></div>
                </div>
              </div>
              <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded-full w-32"></div>
              <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded-full w-20"></div>
              <div className="w-12 h-6 rounded-full bg-slate-200 dark:bg-zinc-800"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "chart") {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-soft animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded-full w-36"></div>
            <div className="h-3 bg-slate-150 dark:bg-zinc-850 rounded-full w-24"></div>
          </div>
          <div className="h-8 bg-slate-150 dark:bg-zinc-850 rounded-xl w-24"></div>
        </div>
        <div className="h-64 flex items-end gap-3 pt-6 border-b border-l border-slate-150 dark:border-zinc-800 px-4">
          <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-t-lg h-3/4"></div>
          <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-t-lg h-1/2"></div>
          <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-t-lg h-5/6"></div>
          <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-t-lg h-2/3"></div>
          <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-t-lg h-4/5"></div>
          <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-t-lg h-1/3"></div>
        </div>
      </div>
    );
  }

  if (type === "profile") {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-soft animate-pulse space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-slate-100 dark:border-zinc-800">
          <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-zinc-800 shrink-0"></div>
          <div className="space-y-3 text-center md:text-left w-full">
            <div className="h-5 bg-slate-200 dark:bg-zinc-800 rounded-full w-48 mx-auto md:mx-0"></div>
            <div className="h-3.5 bg-slate-150 dark:bg-zinc-850 rounded-full w-36 mx-auto md:mx-0"></div>
            <div className="flex justify-center md:justify-start gap-2">
              <div className="h-6 bg-slate-150 dark:bg-zinc-850 rounded-full w-20"></div>
              <div className="h-6 bg-slate-150 dark:bg-zinc-850 rounded-full w-24"></div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-850 space-y-2">
              <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded-full w-16"></div>
              <div className="h-5 bg-slate-200 dark:bg-zinc-800 rounded-full w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Card list default fallback
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
      {skeletons.map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-soft space-y-4 text-left"
        >
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-zinc-800"></div>
            <div className="w-16 h-5 rounded-full bg-slate-150 dark:bg-zinc-850"></div>
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded-full w-3/4"></div>
            <div className="h-3.5 bg-slate-150 dark:bg-zinc-850 rounded-full w-1/2"></div>
          </div>
          <div className="border-t border-slate-100 dark:border-zinc-800 pt-4 flex justify-between">
            <div className="w-12 h-3.5 bg-slate-150 dark:bg-zinc-850 rounded-full"></div>
            <div className="w-20 h-3.5 bg-slate-150 dark:bg-zinc-850 rounded-full"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const EmptyState = ({
  title,
  description,
  actionText,
  onAction,
  icon: Icon = Inbox
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-850 rounded-3xl shadow-soft min-h-[350px]">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-5 border border-blue-100/30">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100 tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium max-w-sm mt-2 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export const ErrorState = ({ message = "Something went wrong. Please try again.", onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-zinc-900 border border-rose-100 dark:border-rose-950/20 rounded-3xl shadow-soft min-h-[400px]">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/10 flex items-center justify-center text-rose-500 mb-5 border border-rose-100/30">
        <AlertOctagon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100 tracking-tight">
        Oops! System Interruption
      </h3>
      <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium max-w-sm mt-2 leading-relaxed">
        {message}
      </p>
      <div className="flex items-center gap-3 mt-8">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 dark:bg-zinc-800 hover:bg-slate-900 dark:hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry Operation</span>
          </button>
        )}
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Go to Home</span>
        </Link>
      </div>
    </div>
  );
};
