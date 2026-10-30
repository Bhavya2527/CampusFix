import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CopyCheck,
  AlertTriangle,
  MapPin,
  Calendar,
  Tag,
  Clock,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Info,
  Sliders,
  Sparkles,
  Link2
} from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { getComplaints } from './adminApi';
import { detectDuplicateComplaints, calculateComplaintSimilarity } from './duplicateHelper';

/**
 * DuplicateDetection Page
 * Text similarity analysis & incident deduplication intelligence
 */
export const DuplicateDetection = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [similarityThreshold, setSimilarityThreshold] = useState(45); // percent
  const [reviewedPairs, setReviewedPairs] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveApi, setIsLiveApi] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const loadComplaints = async () => {
    try {
      setRefreshing(true);
      const res = await getComplaints();
      setComplaints(res.data || []);
      setIsLiveApi(res.isLive);
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  // Compute duplicate pairs using helper
  const allDuplicatePairs = useMemo(() => {
    const rawPairs = detectDuplicateComplaints(complaints);
    return rawPairs.filter(p => p.score >= similarityThreshold);
  }, [complaints, similarityThreshold]);

  // Filter unreviewed vs reviewed
  const pendingDuplicates = allDuplicatePairs.filter(p => !reviewedPairs.has(p.id));

  const handleMarkReviewed = (pairId) => {
    setReviewedPairs(prev => {
      const next = new Set(prev);
      next.add(pairId);
      return next;
    });
  };

  const handleCopyLink = (id) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(iso));
    } catch (e) {
      return iso;
    }
  };

  const openComplaintsCount = complaints.filter(c => c.status !== 'Resolved').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row">
      <AdminSidebar
        pendingCount={complaints.filter(c => c.status === 'Pending').length}
        duplicateCount={pendingDuplicates.length}
        isApiLive={isLiveApi}
      />

      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Duplicate Incident Detection
                </h1>
                <span className="rounded-md bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  <span>NLP Similarity Engine</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Identifies overlapping descriptions, proximate campus locations, and multi-reported complaints
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={loadComplaints}
                disabled={refreshing}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Re-scan Complaints</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 space-y-6">
          {/* Institutional Compliance Rule Card */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700 mt-0.5 shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div className="text-xs text-blue-900 leading-relaxed">
                <strong className="font-semibold block mb-0.5 text-blue-950">
                  Institutional Policy: No Automated Deletion or Merging
                </strong>
                Duplicate detection flags potential overlap based on description semantics and location proximity.
                In accordance with university audit regulations, complaints are never deleted or merged automatically.
                Administrators must inspect candidates, coordinate department response, and reference related IDs.
              </div>
            </div>
          </div>

          {/* Engine Parameters & Controls Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Text Similarity Sensitivity Threshold
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Current filter flags complaints with at least <strong>{similarityThreshold}%</strong> text & location similarity.
              </p>
            </div>

            <div className="flex items-center space-x-4 min-w-[240px]">
              <span className="text-xs font-mono font-bold text-slate-600">40%</span>
              <input
                type="range"
                min="40"
                max="85"
                step="5"
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {similarityThreshold}%
              </span>
            </div>
          </div>

          {/* Summary Metric Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase text-slate-400">Open Incidents Scanned</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{openComplaintsCount}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase text-slate-400">Duplicate Warnings Flagged</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{pendingDuplicates.length}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase text-slate-400">Candidate Pairs Reviewed</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{reviewedPairs.size}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Duplicate Pairs Comparison List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Flagged Duplicate Candidates
              </h2>
              <span className="text-xs text-slate-500">
                Showing {pendingDuplicates.length} unreviewed pairs
              </span>
            </div>

            {pendingDuplicates.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center shadow-xs">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">No duplicate incidents detected</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  All active complaints have distinct descriptions and physical locations, or have already been reviewed.
                </p>
              </div>
            ) : (
              pendingDuplicates.map((pair) => {
                const c1 = pair.primaryComplaint;
                const c2 = pair.duplicateCandidate;

                return (
                  <div
                    key={pair.id}
                    className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition-all space-y-5"
                  >
                    {/* Pair Header Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-bold text-slate-900">
                              Duplicate Incident Warning
                            </h3>
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                              {pair.score}% Match
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Confidence: <strong className="text-slate-800">{pair.confidence}</strong> • Location proximity confirmed
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleMarkReviewed(pair.id)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                        >
                          Mark as Reviewed
                        </button>
                      </div>
                    </div>

                    {/* Side-by-Side Comparison Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Original / Earlier Complaint */}
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                            Original Submission (Primary)
                          </span>
                          <span className="font-mono text-xs font-bold text-blue-600">
                            {c1.id}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{c1.title}</h4>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200/60">
                            {c1.description}
                          </p>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-500 pt-1 border-t border-slate-200">
                          <div className="flex items-center space-x-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-700">{c1.location}</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Logged: {formatDate(c1.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-2 pt-1">
                            <StatusBadge status={c1.status} type="status" size="sm" />
                            <StatusBadge status={c1.priority} type="priority" size="sm" />
                          </div>
                        </div>

                        <div className="pt-2 flex justify-between items-center">
                          <button
                            onClick={() => handleCopyLink(c1.id)}
                            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center space-x-1"
                          >
                            <Link2 className="w-3 h-3" />
                            <span>{copiedId === c1.id ? 'Copied ID!' : 'Copy ID'}</span>
                          </button>
                          <Link
                            to={`/admin/complaints/${c1.id}`}
                            className="text-xs text-blue-600 hover:underline font-semibold flex items-center space-x-1"
                          >
                            <span>Inspect Dossier</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>

                      {/* Right: Potential Duplicate Candidate */}
                      <div className="bg-amber-50/40 rounded-xl p-4 border border-amber-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                            Duplicate Candidate (Later)
                          </span>
                          <span className="font-mono text-xs font-bold text-amber-800">
                            {c2.id}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{c2.title}</h4>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-white p-2.5 rounded-lg border border-amber-200/60">
                            {c2.description}
                          </p>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-500 pt-1 border-t border-amber-200">
                          <div className="flex items-center space-x-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-700">{c2.location}</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Logged: {formatDate(c2.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-2 pt-1">
                            <StatusBadge status={c2.status} type="status" size="sm" />
                            <StatusBadge status={c2.priority} type="priority" size="sm" />
                          </div>
                        </div>

                        <div className="pt-2 flex justify-between items-center">
                          <button
                            onClick={() => handleCopyLink(c2.id)}
                            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center space-x-1"
                          >
                            <Link2 className="w-3 h-3" />
                            <span>{copiedId === c2.id ? 'Copied ID!' : 'Copy ID'}</span>
                          </button>
                          <Link
                            to={`/admin/complaints/${c2.id}`}
                            className="text-xs text-blue-600 hover:underline font-semibold flex items-center space-x-1"
                          >
                            <span>Inspect Dossier</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Shared NLP Tokens Highlight */}
                    {pair.sharedKeywords && pair.sharedKeywords.length > 0 && (
                      <div className="pt-2 flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-[11px] font-semibold text-slate-500">Shared keywords:</span>
                        {pair.sharedKeywords.map((kw, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DuplicateDetection;
