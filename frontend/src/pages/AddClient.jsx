import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Send,
  CheckCircle2,
  Copy,
  Check,
  ArrowLeft,
  ShieldCheck,
  UserPlus,
  Clock,
  Sparkles,
  AlertCircle,
  Loader2,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../services/api";

const AddClient = () => {
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Result state after generating invitation
  const [invitationResult, setInvitationResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Email format validator
  const validateEmail = (val) => {
    const trimmed = val.trim();
    if (!trimmed) {
      return "Client email address is required.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return "Please enter a valid email address.";
    }
    return "";
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (emailError) {
      setEmailError(validateEmail(val));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      toast.error(err);
      return;
    }

    setIsLoading(true);
    setEmailError("");

    try {
      const res = await api.post("/api/invitations", {
        client_email: email.trim().toLowerCase(),
      });

      if (res.success && res.invitation) {
        setInvitationResult(res.invitation);
        toast.success("Invitation created successfully!");
      } else {
        const errorMsg = res.message || "Failed to generate invitation link.";
        toast.error(errorMsg);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while generating invitation.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!invitationResult?.invite_url) return;
    try {
      await navigator.clipboard.writeText(invitationResult.invite_url);
      setCopied(true);
      toast.success("Invitation link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy to clipboard. Please copy manually.");
    }
  };

  const handleReset = () => {
    setEmail("");
    setNote("");
    setEmailError("");
    setInvitationResult(null);
    setCopied(false);
  };

  const formatExpiry = (isoString) => {
    if (!isoString) return "7 days from now";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/clients")}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Clients</span>
        </button>

        <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-cyan-400 rounded-full border border-blue-200/60 dark:border-blue-800/40">
          Secure Onboarding
        </span>
      </div>

      {/* Header Banner */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-600/10 text-blue-600 dark:text-cyan-400 text-xs font-black uppercase tracking-wider">
            <UserPlus className="w-3.5 h-3.5" />
            Trainer Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">
            Invite New Client
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
            Generate a secure, single-use invitation link. Your client will complete their own profile, baseline metrics, and medical background, automatically linking to your trainer account upon registration.
          </p>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* SUCCESS STATE CARD */}
      {invitationResult ? (
        <div className="bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800/50 rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-500/5 space-y-6 animate-in zoom-in-95 duration-200">
          
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-zinc-100">
                Invitation Created Successfully
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Share the secure invitation link below with your client.
              </p>
            </div>
          </div>

          {/* Details Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/50 border border-slate-200/80 dark:border-zinc-800/80 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Invited Client Email
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 break-all">
                {invitationResult.client_email}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/50 border border-slate-200/80 dark:border-zinc-800/80 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Link Expiration
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                {formatExpiry(invitationResult.expires_at)}
              </p>
            </div>
          </div>

          {/* Invitation URL Box */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              Invitation Link
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 min-w-0 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-slate-700 dark:text-zinc-300 break-all select-all">
                {invitationResult.invite_url}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer ${
                  copied
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-95"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Invite Another Client
            </button>

            <button
              type="button"
              onClick={() => navigate("/clients")}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>View All Clients</span>
            </button>
          </div>

        </div>
      ) : (
        /* INVITATION GENERATION FORM */
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider block">
                Client Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="client.name@example.com"
                  disabled={isLoading}
                  className={`w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border ${
                    emailError
                      ? "border-rose-500 focus:ring-rose-100"
                      : "border-slate-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-blue-100"
                  } text-sm font-medium focus:outline-none focus:ring-4 transition-all text-slate-900 dark:text-zinc-100`}
                />
              </div>
              {emailError && (
                <p className="text-xs text-rose-500 font-semibold flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {emailError}
                </p>
              )}
              <p className="text-[11px] text-slate-400">
                The client will register their password and personal details securely using this email.
              </p>
            </div>

            {/* Optional Trainer Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider block">
                Internal Note <span className="text-slate-400 text-[10px] font-normal">(Optional, for your records)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Referred by member Alex, interested in strength coaching..."
                rows={2}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:border-blue-500 transition text-slate-900 dark:text-zinc-100"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-8 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating invitation...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Invitation</span>
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Feature Pillars / Workflow Guide */}
          <div className="border-t border-slate-100 dark:border-zinc-800 pt-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              How Client Onboarding Works
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-800/60 space-y-1.5">
                <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 flex items-center justify-center text-xs font-black">
                  1
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">Send Invitation</h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
                  You generate an invitation link for the client's email address.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-800/60 space-y-1.5">
                <div className="w-7 h-7 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xs font-black">
                  2
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">Client Self-Registration</h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
                  The client fills out their password, phone, fitness goals, and health background.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-800/60 space-y-1.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">
                  3
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">Auto Roster Assignment</h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
                  Upon account activation, the athlete is linked to your dashboard automatically.
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-100/60 dark:bg-zinc-950/60 border border-slate-200/50 dark:border-zinc-800/60 flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                Tokens are cryptographically hashed with SHA-256 and single-use. Raw credentials and passwords are never exposed.
              </span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default AddClient;
