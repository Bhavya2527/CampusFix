import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  CheckCircle2,
  Clock,
  Activity,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Mail,
  Phone,
  AlertCircle,
  Tag,
  Check
} from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { StatusBadge } from '../../components/admin/StatusBadge';
import {
  getDepartments,
  getComplaints,
  assignComplaintDepartment,
  updateComplaintStatus
} from './adminApi';
import { detectDuplicateComplaints } from './duplicateHelper';

/**
 * DepartmentManagement Page
 * University Division Dispatch & Operations Control
 */
export const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveApi, setIsLiveApi] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [deptRes, compRes] = await Promise.all([
        getDepartments(),
        getComplaints()
      ]);

      setDepartments(deptRes.data || []);
      setComplaints(compRes.data || []);
      setIsLiveApi(deptRes.isLive);
    } catch (err) {
      console.error('Error loading department data:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssign = async (complaintId, departmentName) => {
    try {
      setActionSuccess('');
      const res = await assignComplaintDepartment(complaintId, departmentName);
      setActionSuccess(`Complaint ${complaintId} assigned to ${departmentName}`);
      await loadData();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      alert(`Assignment failed: ${err.message}`);
    }
  };

  // Find unassigned complaints
  const unassignedComplaints = complaints.filter(
    c => !c.assignedDepartment || c.assignedDepartment === 'Unassigned'
  );

  // Filtered complaints based on department tab
  const displayedComplaints = complaints.filter(c => {
    if (selectedDeptFilter === 'ALL') return true;
    if (selectedDeptFilter === 'UNASSIGNED') {
      return !c.assignedDepartment || c.assignedDepartment === 'Unassigned';
    }
    return c.assignedDepartment === selectedDeptFilter;
  });

  const pendingCount = complaints.filter(c => c.status === 'Pending').length;
  const duplicateCount = detectDuplicateComplaints(complaints).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row">
      <AdminSidebar
        pendingCount={pendingCount}
        duplicateCount={duplicateCount}
        isApiLive={isLiveApi}
      />

      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Department Operations & Allocation
                </h1>
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                  Authorized Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign incident tickets, track department-wise complaint metrics, and manage facilities workloads
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={loadData}
                disabled={refreshing}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 space-y-6">
          {actionSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* Unassigned Triage Notice if unassigned exist */}
          {unassignedComplaints.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-700 mt-0.5">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-900">
                      Unassigned Complaints Triage Queue ({unassignedComplaints.length})
                    </h3>
                    <p className="text-xs text-amber-800 mt-0.5">
                      New complaints have been reported without a department assignment. Assign them to trigger technician dispatch.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedDeptFilter('UNASSIGNED')}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 shadow-xs shrink-0 ml-4"
                >
                  View Unassigned Queue
                </button>
              </div>
            </div>
          )}

          {/* Department Cards Grid (Section 6) */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">
              Campus Operations Divisions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {departments.map((dept) => {
                const deptComplaints = complaints.filter(c => c.assignedDepartment === dept.name);
                const totalDept = deptComplaints.length;
                const activeDept = deptComplaints.filter(c => c.status !== 'Resolved').length;
                const resolvedDept = deptComplaints.filter(c => c.status === 'Resolved').length;
                const resRate = totalDept > 0 ? Math.round((resolvedDept / totalDept) * 100) : 100;

                const isSelected = selectedDeptFilter === dept.name;

                return (
                  <div
                    key={dept.id}
                    onClick={() => setSelectedDeptFilter(isSelected ? 'ALL' : dept.name)}
                    className={`bg-white rounded-xl border p-5 shadow-xs cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-500/30'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{dept.name}</h3>
                          <span className="font-mono text-[10px] font-semibold text-slate-400">
                            {dept.code} • SLA {dept.slaHours || 24}h
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        activeDept > 0
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {activeDept} Active
                      </span>
                    </div>

                    {/* Department Head & Contact */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center space-x-2">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Lead: <strong className="text-slate-800">{dept.head}</strong></span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{dept.email}</span>
                      </div>
                    </div>

                    {/* Department Metrics Counts */}
                    <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                      <div>
                        <span className="block text-slate-400 text-[10px] uppercase font-semibold">Total</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">{totalDept}</span>
                      </div>
                      <div>
                        <span className="block text-amber-600 text-[10px] uppercase font-semibold">Active</span>
                        <span className="font-mono font-bold text-amber-700 text-sm">{activeDept}</span>
                      </div>
                      <div>
                        <span className="block text-emerald-600 text-[10px] uppercase font-semibold">Resolved</span>
                        <span className="font-mono font-bold text-emerald-700 text-sm">{resolvedDept}</span>
                      </div>
                    </div>

                    {/* Resolution Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                        <span>Resolution Rate</span>
                        <span className="font-bold text-slate-700">{resRate}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${resRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Incident Assignment Registry */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedDeptFilter === 'ALL'
                    ? 'All Department Complaints'
                    : selectedDeptFilter === 'UNASSIGNED'
                      ? 'Unassigned Complaints (Requires Allocation)'
                      : `Complaints Assigned to: ${selectedDeptFilter}`}
                </h3>
                <p className="text-xs text-slate-500">
                  Assign complaints directly or reassign to other departments
                </p>
              </div>

              {/* Department Filter Tabs */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setSelectedDeptFilter('ALL')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                    selectedDeptFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  All ({complaints.length})
                </button>
                <button
                  onClick={() => setSelectedDeptFilter('UNASSIGNED')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                    selectedDeptFilter === 'UNASSIGNED'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  Unassigned ({unassignedComplaints.length})
                </button>
              </div>
            </div>

            {/* Assignment Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-600">
                    <th className="px-4 py-3.5">ID</th>
                    <th className="px-4 py-3.5">Title</th>
                    <th className="px-4 py-3.5">Location</th>
                    <th className="px-4 py-3.5">Priority</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Current Department</th>
                    <th className="px-4 py-3.5">Reassign To Department</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {displayedComplaints.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        No complaints in this department view.
                      </td>
                    </tr>
                  ) : (
                    displayedComplaints.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3.5 font-mono font-bold text-blue-600">
                          {item.id}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-900 line-clamp-1">{item.title}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{item.description}</p>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                          {item.location}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusBadge status={item.priority} type="priority" size="sm" />
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusBadge status={item.status} type="status" size="sm" />
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusBadge status={item.assignedDepartment} type="department" size="sm" />
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <select
                            value={item.assignedDepartment || ''}
                            onChange={(e) => handleAssign(item.id, e.target.value)}
                            className="text-xs py-1 px-2 border border-slate-300 rounded-lg bg-white text-slate-800 font-medium hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="" disabled>Select Department...</option>
                            {departments.map((dept) => (
                              <option key={dept.id} value={dept.name}>{dept.name}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DepartmentManagement;
