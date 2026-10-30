import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Tag,
  Building2,
  CheckCircle2,
  Clock,
  Activity,
  AlertTriangle,
  User,
  Mail,
  Phone,
  FileText,
  Send,
  AlertCircle,
  ExternalLink,
  Save,
  ShieldAlert,
  HelpCircle,
  Copy
} from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { StatusBadge } from '../../components/admin/StatusBadge';
import {
  getComplaintById,
  getComplaints,
  getDepartments,
  updateComplaintStatus,
  assignComplaintDepartment
} from './adminApi';
import { findDuplicatesForComplaint, detectDuplicateComplaints } from './duplicateHelper';

/**
 * ComplaintDetails Page
 * In-depth inspection dossier, status workflow & department dispatch
 */
export const ComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [allComplaints, setAllComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [duplicateMatches, setDuplicateMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiveApi, setIsLiveApi] = useState(true);

  // Status Action Form State
  const [selectedStatus, setSelectedStatus] = useState('Pending');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
  const [statusSuccessMessage, setStatusSuccessMessage] = useState('');

  // Department Assignment Form State
  const [selectedDept, setSelectedDept] = useState('');
  const [isSubmittingDept, setIsSubmittingDept] = useState(false);
  const [deptSuccessMessage, setDeptSuccessMessage] = useState('');

  const loadComplaintData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [allCompRes, deptRes] = await Promise.all([
        getComplaints(),
        getDepartments()
      ]);

      const complaintsList = allCompRes.data || [];
      setAllComplaints(complaintsList);
      setDepartments(deptRes.data || []);
      setIsLiveApi(allCompRes.isLive);

      // Identify target complaint by id or take first if id missing
      const targetId = id || (complaintsList[0]?.id);
      const match = complaintsList.find(c => String(c.id) === String(targetId));

      if (match) {
        setComplaint(match);
        setSelectedStatus(match.status);
        setSelectedDept(match.assignedDepartment || '');
        setResolutionNotes(match.resolutionNotes || '');

        // Check for duplicates
        const duplicates = findDuplicatesForComplaint(match, complaintsList);
        setDuplicateMatches(duplicates);
      } else {
        setError(`Complaint #${targetId} not found in the operations registry.`);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve complaint data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaintData();
  }, [id]);

  // Handle Status Update (Section 7)
  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!complaint) return;

    try {
      setIsSubmittingStatus(true);
      setStatusSuccessMessage('');
      const res = await updateComplaintStatus(complaint.id, selectedStatus, resolutionNotes);
      
      if (res.data) {
        setComplaint(res.data);
      }
      setStatusSuccessMessage(`Status successfully updated to ${selectedStatus}`);
      setTimeout(() => setStatusSuccessMessage(''), 4000);
    } catch (err) {
      alert(`Error updating status: ${err.message}`);
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  // Handle Department Assignment (Section 6 & 10)
  const handleAssignDepartment = async (e) => {
    e.preventDefault();
    if (!complaint || !selectedDept) return;

    try {
      setIsSubmittingDept(true);
      setDeptSuccessMessage('');
      const res = await assignComplaintDepartment(complaint.id, selectedDept);
      
      if (res.data) {
        setComplaint(res.data);
      }
      setDeptSuccessMessage(`Assigned to ${selectedDept}`);
      setTimeout(() => setDeptSuccessMessage(''), 4000);
    } catch (err) {
      alert(`Error assigning department: ${err.message}`);
    } finally {
      setIsSubmittingDept(false);
    }
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

  const studentName = typeof complaint?.student === 'object' ? complaint.student?.name : complaint?.student || 'Student';
  const studentId = typeof complaint?.student === 'object' ? complaint.student?.id : '2024CS0000';
  const studentEmail = typeof complaint?.student === 'object' ? complaint.student?.email : 'student@campus.edu';
  const studentAvatar = typeof complaint?.student === 'object' ? complaint.student?.avatar : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row">
      <AdminSidebar
        pendingCount={allComplaints.filter(c => c.status === 'Pending').length}
        duplicateCount={detectDuplicateComplaints(allComplaints).length}
        isApiLive={isLiveApi}
      />

      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/admin/complaints')}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs"
                title="Back to Complaints"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-bold text-slate-900">
                    Incident Dossier
                  </h1>
                  {complaint && (
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {complaint.id}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Campus Facilities & Student Services Incident Inspection
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Link
                to="/admin/complaints"
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
              >
                All Complaints
              </Link>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6">
          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
              <Activity className="w-8 h-8 text-blue-600 mx-auto animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-700">Loading complaint record...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl border border-rose-200 p-8 text-center shadow-xs">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900">{error}</h3>
              <p className="text-xs text-slate-500 mt-1">Please select an existing complaint from the registry.</p>
              <button
                onClick={() => navigate('/admin/complaints')}
                className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Return to Registry
              </button>
            </div>
          ) : complaint ? (
            <div className="space-y-6">
              {/* Duplicate Warning Alert if matched */}
              {duplicateMatches.length > 0 && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 shadow-xs">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-amber-200 text-amber-800 mt-0.5">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-bold text-amber-900">
                            Potential Duplicate Warning
                          </h3>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                            {duplicateMatches[0].confidence} Similarity
                          </span>
                        </div>
                        <p className="text-xs text-amber-800 mt-1">
                          This issue has very high text or location overlap with existing open complaint{' '}
                          <Link
                            to={`/admin/complaints/${duplicateMatches[0].relatedId}`}
                            className="font-mono font-bold underline text-amber-950"
                          >
                            {duplicateMatches[0].relatedId}
                          </Link>
                          . Check before initiating redundant technician dispatches.
                        </p>
                        <p className="text-[11px] text-amber-700 mt-2 italic">
                          Note: Per university policy, complaints are flagged for review and never automatically deleted or merged.
                        </p>
                      </div>
                    </div>

                    <Link
                      to="/admin/duplicates"
                      className="shrink-0 ml-4 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-xs font-bold text-amber-900 hover:bg-amber-100 shadow-xs flex items-center space-x-1"
                    >
                      <span>Compare Side-by-Side</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Top Summary Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={complaint.status} type="status" size="lg" />
                      <StatusBadge status={complaint.priority} type="priority" size="lg" />
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <Tag className="w-3 h-3 mr-1 text-slate-400" />
                        {complaint.category}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      {complaint.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center space-x-1.5">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-700">{complaint.location}</span>
                      </span>
                      <span className="flex items-center space-x-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>Submitted on {formatDate(complaint.createdAt)}</span>
                      </span>
                      <span className="flex items-center space-x-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>Last updated {formatDate(complaint.updatedAt)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Department Assignment Pill */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 min-w-[220px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Assigned Department
                    </span>
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-slate-900">
                        {complaint.assignedDepartment || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description Body */}
                <div className="pt-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Detailed Complaint Description
                  </h3>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm text-slate-800 leading-relaxed font-sans">
                    {complaint.description}
                  </div>
                </div>
              </div>

              {/* Two Column Layout: Student Details & Operational Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Student & Timeline */}
                <div className="space-y-6">
                  {/* Student Details Card */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 mb-3">
                      Complainant Student Profile
                    </h3>

                    <div className="flex items-center space-x-3 mb-4">
                      {studentAvatar ? (
                        <img
                          src={studentAvatar}
                          alt={studentName}
                          className="w-12 h-12 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-base">
                          {studentName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{studentName}</h4>
                        <p className="text-xs font-mono text-slate-500">ID: {studentId}</p>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs text-slate-600">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{studentEmail}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>+91 98765 43210</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Hostel Resident • Block B</span>
                      </div>
                    </div>
                  </div>

                  {/* Audit Timeline */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 mb-4">
                      Audit Trail & State History
                    </h3>

                    <div className="space-y-4">
                      {(complaint.history || [
                        { status: 'Pending', timestamp: complaint.createdAt, note: 'Initial submission' }
                      ]).map((step, idx) => (
                        <div key={idx} className="flex items-start space-x-3 text-xs">
                          <div className="mt-0.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 block ring-4 ring-blue-50" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">{step.status}</span>
                              <span className="text-[10px] text-slate-400">{formatDate(step.timestamp)}</span>
                            </div>
                            <p className="text-slate-600 mt-0.5">{step.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Actions (Status Update & Department Assignment) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Status Management Box (Section 7) */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Status Transition & Resolution Management
                        </h3>
                        <p className="text-xs text-slate-500">
                          Update status and document engineering resolution notes
                        </p>
                      </div>
                      <StatusBadge status={complaint.status} type="status" size="sm" />
                    </div>

                    {statusSuccessMessage && (
                      <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{statusSuccessMessage}</span>
                      </div>
                    )}

                    <form onSubmit={handleSaveStatus} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                          Select Action Status
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {['Pending', 'In Progress', 'Resolved'].map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setSelectedStatus(st)}
                              className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                                selectedStatus === st
                                  ? st === 'Resolved'
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                    : st === 'In Progress'
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                      : 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {st === 'Resolved' && <CheckCircle2 className="w-4 h-4" />}
                              {st === 'In Progress' && <Activity className="w-4 h-4" />}
                              {st === 'Pending' && <Clock className="w-4 h-4" />}
                              <span>{st}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Resolution & Maintenance Notes
                        </label>
                        <p className="text-[11px] text-slate-400 mb-2">
                          Provide technical description of parts replaced, inspection findings, or actions taken.
                        </p>
                        <textarea
                          rows={4}
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          placeholder="e.g. Electrician team repaired main line neutral fault. Verified voltage stability with multimeter."
                          className="w-full text-xs rounded-xl border border-slate-200 p-3 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={isSubmittingStatus}
                          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          <span>{isSubmittingStatus ? 'Saving Status...' : 'Commit Status Update'}</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Department Assignment Box (Section 6 & 10) */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                    <div className="border-b border-slate-100 pb-3 mb-4">
                      <h3 className="text-sm font-bold text-slate-900">
                        Department Dispatch & SLA Allocation
                      </h3>
                      <p className="text-xs text-slate-500">
                        Assign or reassign this incident to responsible university division
                      </p>
                    </div>

                    {deptSuccessMessage && (
                      <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800 flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        <span>{deptSuccessMessage}</span>
                      </div>
                    )}

                    <form onSubmit={handleAssignDepartment} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Target Department Division
                        </label>
                        <select
                          value={selectedDept}
                          onChange={(e) => setSelectedDept(e.target.value)}
                          className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- Choose Department --</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.name}>
                              {dept.name} ({dept.code}) — Head: {dept.head}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-[11px] text-slate-400">
                          Dispatches notification to department supervisor
                        </span>
                        <button
                          type="submit"
                          disabled={isSubmittingDept || !selectedDept}
                          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                        >
                          <Building2 className="w-4 h-4" />
                          <span>{isSubmittingDept ? 'Assigning...' : 'Assign Department'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default ComplaintDetails;
