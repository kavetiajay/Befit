import React, { useState, useEffect, useMemo } from "react";
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
  Users,
  Search,
  X,
  Ban,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  Calendar,
  Clock3,
  AlertTriangle,
  Share2
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../services/api";
import { EmptyState, SkeletonLoader } from "../components/FeedbackStates";

const AddClient = () => {
  const navigate = useNavigate();

  // Form states for creating new invitation
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Result state after generating invitation
  const [invitationResult, setInvitationResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Invitations list state
  const [invitations, setInvitations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState(null);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Revocation modal state
  const [revokingInvite, setRevokingInvite] = useState(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // Active view tab: 'invite' (Form) or 'history' (List)
  const [activeTab, setActiveTab] = useState("invite");

  // Fetch invitations on mount
  const fetchInvitations = async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const res = await api.get("/api/invitations");
      if (res && res.success && Array.isArray(res.invitations)) {
        setInvitations(res.invitations);
      } else {
        setInvitations([]);
      }
    } catch (err) {
      console.error("Failed to load invitations:", err);
      setListError(err instanceof Error ? err.message : "Failed to load invitations list.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

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
        toast.success("Invitation link generated successfully!");
        fetchInvitations(); // refresh list
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

  const handleCopyLink = async (url) => {
    const targetUrl = url || invitationResult?.invite_url;
    if (!targetUrl) return;
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      toast.success("Invitation link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy to clipboard. Please copy manually.");
    }
  };

  const handleRevokeConfirm = async () => {
    if (!revokingInvite) return;
    setIsRevoking(true);
    try {
      const res = await api.patch("/api/invitations", {
        id: revokingInvite.id,
        action: "revoke",
      });

      if (res && res.success) {
        toast.success(`Invitation for ${revokingInvite.client_email} has been revoked.`);
        setRevokingInvite(null);
        fetchInvitations();
      } else {
        toast.error(res.message || "Failed to revoke invitation.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke invitation.");
    } finally {
      setIsRevoking(false);
    }
  };

  const handleResend = (inviteEmail) => {
    setEmail(inviteEmail);
    setEmailError("");
    setInvitationResult(null);
    setActiveTab("invite");
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const formatDate = (isoString) => {
    if (!isoString) return "—";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  // Status Counter metrics
  const statusCounts = useMemo(() => {
    let pending = 0;
    let accepted = 0;
    let expired = 0;
    let revoked = 0;

    invitations.forEach((inv) => {
      if (inv.status === "pending") pending++;
      else if (inv.status === "accepted") accepted++;
      else if (inv.status === "expired") expired++;
      else if (inv.status === "revoked") revoked++;
    });

    return {
      all: invitations.length,
      pending,
      accepted,
      expired,
      revoked,
    };
  }, [invitations]);

  // Filtered invitations list
  const filteredInvitations = useMemo(() => {
    let result = [...invitations];

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((inv) => inv.status === statusFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((inv) => (inv.client_email || "").toLowerCase().includes(q));
    }

    return result;
  }, [invitations, statusFilter, searchQuery]);

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    if (status === "accepted") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
          <span>Accepted</span>
        </span>
      );
    }

    if (status === "pending") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Clock3 className="w-3 h-3 text-amber-500 shrink-0" />
          <span>Pending</span>
        </span>
      );
    }

    if (status === "expired") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-600 dark:text-zinc-400 border border-slate-500/20">
          <AlertCircle className="w-3 h-3 text-slate-400 shrink-0" />
          <span>Expired</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
        <Ban className="w-3 h-3 text-rose-500 shrink-0" />
        <span>Revoked</span>
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300 text-left">
      
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/clients")}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>Back to Clients Directory</span>
        </button>

        <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-cyan-400 rounded-full border border-blue-200/60 dark:border-blue-800/40 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
          <span>Secure Client Onboarding</span>
        </span>
      </div>

      {/* Header Banner */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-600/10 text-blue-600 dark:text-cyan-400 text-xs font-black uppercase tracking-wider">
            <UserPlus className="w-3.5 h-3.5 shrink-0" />
            <span>Invitation Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-zinc-50 tracking-tight font-display">
            Client Invitation Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
            Issue cryptographically secure, single-use invitation links. Invited clients complete their account registration and profile details, linking directly to your trainer roster upon activation.
          </p>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("invite")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === "invite"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 rounded-t-2xl"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <UserPlus className="w-4 h-4 shrink-0" />
          <span>Invite New Client</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === "history"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 rounded-t-2xl"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <Clock3 className="w-4 h-4 shrink-0" />
          <span>Invitations History</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
            {invitations.length}
          </span>
        </button>
      </div>

      {/* TAB 1: INVITE CLIENT GENERATOR */}
      {activeTab === "invite" && (
        <div className="space-y-6">
          {invitationResult ? (
            /* SUCCESS STATE CARD */
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
                    Share the single-use invitation link below with your prospective client.
                  </p>
                </div>
              </div>

              {/* Details Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/50 border border-slate-200/80 dark:border-zinc-800/80 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Invited Client Email
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 break-all">
                    {invitationResult.client_email}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/50 border border-slate-200/80 dark:border-zinc-800/80 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Link Expiration
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{formatExpiry(invitationResult.expires_at)}</span>
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
                    onClick={() => handleCopyLink(invitationResult.invite_url)}
                    className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer ${
                      copied
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-95"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 shrink-0" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 shrink-0" />
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

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab("history")}
                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Clock3 className="w-3.5 h-3.5 shrink-0" />
                    <span>View All Invitations</span>
                  </button>
                </div>
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
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 shrink-0" />
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
                    <p className="text-xs text-rose-500 font-semibold flex items-center gap-1.5 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{emailError}</span>
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400">
                    The prospective client will securely set up their login password, fitness goals, and health background.
                  </p>
                </div>

                {/* Optional Internal Note */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider block">
                    Internal Note <span className="text-slate-400 text-[10px] font-normal">(Optional, for your records)</span>
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Inquired via Instagram, interested in strength coaching..."
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
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        <span>Generating Secure Link...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 shrink-0" />
                        <span>Generate Client Invitation</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Workflow Guide */}
              <div className="border-t border-slate-100 dark:border-zinc-800 pt-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>How Client Onboarding Works</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-800/60 space-y-1.5">
                    <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 flex items-center justify-center text-xs font-black">
                      1
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">Send Invitation Link</h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
                      Generate an encrypted, time-limited link for the client's email address.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-800/60 space-y-1.5">
                    <div className="w-7 h-7 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xs font-black">
                      2
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">Client Self-Registration</h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
                      The client sets their password, target metrics, and health background.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-800/60 space-y-1.5">
                    <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">
                      3
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">Auto Roster Assignment</h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
                      Upon account activation, the client is linked to your dashboard automatically.
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-slate-100/60 dark:bg-zinc-950/60 border border-slate-200/50 dark:border-zinc-800/60 flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>
                    Tokens are cryptographically hashed with SHA-256 and single-use. Raw passwords and security tokens are never exposed.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INVITATIONS HISTORY & MANAGEMENT */}
      {activeTab === "history" && (
        <div className="space-y-5">
          
          {/* Status Filter Tabs & Search Bar */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
            
            {/* Status Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100 dark:border-zinc-800">
              {[
                { id: "all", label: "All Invitations", count: statusCounts.all },
                { id: "pending", label: "Pending", count: statusCounts.pending },
                { id: "accepted", label: "Accepted", count: statusCounts.accepted },
                { id: "expired", label: "Expired", count: statusCounts.expired },
                { id: "revoked", label: "Revoked", count: statusCounts.revoked },
              ].map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 rounded-t-xl"
                        : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input & Refresh */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 shrink-0 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by client email address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: "42px", paddingRight: "36px" }}
                  className="w-full py-2.5 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-950/20 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500/50 transition-all placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={fetchInvitations}
                disabled={loadingList}
                className="px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                title="Refresh invitations"
              >
                <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loadingList ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* List Content */}
          {loadingList ? (
            <SkeletonLoader type="table" count={4} />
          ) : listError ? (
            <div className="p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-3xl text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <h3 className="text-sm font-bold text-rose-800 dark:text-rose-200">{listError}</h3>
              <button
                onClick={fetchInvitations}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-soft">
              
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 font-black uppercase tracking-wider text-[10px] bg-slate-50/60 dark:bg-zinc-950/40">
                      <th className="py-4 px-5">Client Email</th>
                      <th className="py-4 px-5">Status</th>
                      <th className="py-4 px-5">Created Date</th>
                      <th className="py-4 px-5">Expiry Date</th>
                      <th className="py-4 px-5">Accepted Date</th>
                      <th className="py-4 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/60 dark:divide-zinc-800/40">
                    {filteredInvitations.length > 0 ? (
                      filteredInvitations.map((inv) => (
                        <tr
                          key={inv.id}
                          className="hover:bg-slate-50/30 dark:hover:bg-zinc-800/30 transition-colors"
                        >
                          {/* Client Email */}
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                                <Mail className="w-4 h-4 shrink-0" />
                              </div>
                              <span className="font-bold text-slate-800 dark:text-zinc-100 text-xs">
                                {inv.client_email}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-5">
                            {renderStatusBadge(inv.status)}
                          </td>

                          {/* Created Date */}
                          <td className="py-3.5 px-5 text-slate-600 dark:text-zinc-400">
                            {formatDate(inv.created_at)}
                          </td>

                          {/* Expiry Date */}
                          <td className="py-3.5 px-5">
                            <span className="text-slate-600 dark:text-zinc-400 block">
                              {formatDate(inv.expires_at)}
                            </span>
                            {inv.status === "pending" && (
                              <span className="text-[9px] font-bold text-amber-500 block">
                                Expires in {Math.max(0, Math.ceil((new Date(inv.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}d
                              </span>
                            )}
                          </td>

                          {/* Accepted Date */}
                          <td className="py-3.5 px-5 text-slate-600 dark:text-zinc-400">
                            {formatDate(inv.accepted_at)}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {inv.status === "pending" && (
                                <button
                                  type="button"
                                  onClick={() => setRevokingInvite(inv)}
                                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                  title="Revoke this invitation"
                                >
                                  <Ban className="w-3 h-3 shrink-0" />
                                  <span>Revoke</span>
                                </button>
                              )}

                              {(inv.status === "expired" || inv.status === "revoked") && (
                                <button
                                  type="button"
                                  onClick={() => handleResend(inv.client_email)}
                                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                  title="Issue a new invitation for this client"
                                >
                                  <RotateCcw className="w-3 h-3 shrink-0" />
                                  <span>Resend</span>
                                </button>
                              )}

                              {inv.status === "accepted" && (
                                <button
                                  type="button"
                                  onClick={() => navigate("/clients")}
                                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                  title="View in Client Directory"
                                >
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                  <span>View Roster</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="p-0 border-none">
                          <EmptyState
                            title="No Invitations Found"
                            description={searchQuery ? "No invitations match your search filter." : "You have not generated any client invitations yet."}
                            actionText={searchQuery ? "Clear Search" : "Invite First Client"}
                            onAction={searchQuery ? () => setSearchQuery("") : () => setActiveTab("invite")}
                            icon={Mail}
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="block md:hidden divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredInvitations.length > 0 ? (
                  filteredInvitations.map((inv) => (
                    <div key={inv.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 dark:text-zinc-100 text-xs block truncate">
                            {inv.client_email}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Created: {formatDate(inv.created_at)}
                          </span>
                        </div>
                        <div className="shrink-0">
                          {renderStatusBadge(inv.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-zinc-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800">
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">Expiry</span>
                          <span className="font-semibold text-slate-700 dark:text-zinc-300 text-[11px] block mt-0.5">
                            {formatDate(inv.expires_at)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">Accepted</span>
                          <span className="font-semibold text-slate-700 dark:text-zinc-300 text-[11px] block mt-0.5">
                            {formatDate(inv.accepted_at)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        {inv.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => setRevokingInvite(inv)}
                            className="flex-1 py-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                          >
                            <Ban className="w-3.5 h-3.5 shrink-0" />
                            <span>Revoke Invite</span>
                          </button>
                        )}

                        {(inv.status === "expired" || inv.status === "revoked") && (
                          <button
                            type="button"
                            onClick={() => handleResend(inv.client_email)}
                            className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                            <span>Resend Invite</span>
                          </button>
                        )}

                        {inv.status === "accepted" && (
                          <button
                            type="button"
                            onClick={() => navigate("/clients")}
                            className="flex-1 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            <span>View in Roster</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4">
                    <EmptyState
                      title="No Invitations Found"
                      description="No client invitations match your filter."
                      actionText="Invite New Client"
                      onAction={() => setActiveTab("invite")}
                      icon={Mail}
                    />
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}

      {/* REVOCATION CONFIRMATION MODAL */}
      {revokingInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 shrink-0" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-zinc-100">
                Revoke Client Invitation?
              </h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
              Are you sure you want to revoke the invitation for <strong className="text-slate-800 dark:text-zinc-200 font-bold">{revokingInvite.client_email}</strong>? The invitation link will immediately be deactivated and cannot be used for registration.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setRevokingInvite(null)}
                disabled={isRevoking}
                className="px-4 py-2 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevokeConfirm}
                disabled={isRevoking}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-70"
              >
                {isRevoking ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span>Revoking...</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-3.5 h-3.5 shrink-0" />
                    <span>Revoke Invitation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AddClient;
