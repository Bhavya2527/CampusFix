import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Building2,
  CopyCheck,
  ShieldAlert,
  Server
} from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { StatsCard } from '../../components/admin/StatsCard';
import { ComplaintTable } from '../../components/admin/ComplaintTable';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { CategoryBarChart, StatusPieChart } from '../../components/admin/AnalyticsCharts';
import {
  getComplaints,
  getAnalytics,
  getDepartments,
  updateComplaintStatus,
  assignComplaintDepartment
} from './adminApi';
import { detectDuplicateComplaints } from './duplicateHelper';

/**
 * AdminDashboard Page
 * Central Command Hub for University Operations
 */
export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [duplicatePairs, setDuplicatePairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLiveApi, setIsLiveApi] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      const [compRes, analRes, deptRes] = await Promise.all([
        getComplaints(),
        getAnalytics(),
        getDepartments()
      ]);

      const complaintsList = compRes.data || [];
      setComplaints(complaintsList);
      setAnalytics(analRes.data || null);
      setDepartments(deptRes.data || []);
      setIsLiveApi(compRes.isLive);

      // Detect duplicates among open complaints
      const duplicates = detectDuplicateComplaints(complaintsList);
      setDuplicatePairs(duplicates);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleQuickStatusChange = async (id, newStatus) => {
    try {
      await updateComplaintStatus(id, newStatus, `Quick status update from admin overview`);
      await loadDashboardData();
    } catch (err) {
      console.error('Quick status change error:', err);
    }
  };

  const handleQuickAssignDepartment = async (id, department) => {
    try {
      await assignComplaintDepartment(id, department);
      await loadDashboardData();
    } catch (err) {
      console.error('Quick department assignment error:', err);
    }
  };

  // Extract metrics from analytics or compute directly
  const total = analytics?.totalComplaints ?? complaints.length;
  const pending = analytics?.pendingComplaints ?? complaints.filter(c => c.status === 'Pending').length;
  const inProgress = analytics?.inProgressComplaints ?? complaints.filter(c => c.status === 'In Progress').length;
  const resolved = analytics?.resolvedComplaints ?? complaints.filter(c => c.status === 'Resolved').length;

  // Recent 5 complaints sorted by date descending
  const recentComplaints = [...complaints]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // Priority distribution counts
  const urgentCount = complaints.filter(c => c.priority === 'Urgent').length;
  const highCount = complaints.filter(c => c.priority === 'High').length;
  const mediumCount = complaints.filter(c => c.priority === 'Medium').length;
  const lowCount = complaints.filter(c => c.priority === 'Low').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <AdminSidebar
        pendingCount={pending}
        duplicateCount={duplicatePairs.length}
        isApiLive={isLiveApi}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  CampusFix Operations Hub
                </h1>
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                  Central Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time incident dispatch, department SLA tracking, and campus facility monitoring
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {/* API Mode Indicator */}
              <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                <span>Backend:</span>
                <span className={`font-semibold ${isLiveApi ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isLiveApi ? 'http://localhost:8000 (Live)' : 'Mock Fallback Mode'}
                </span>
              </div>

              {/* Refresh Button */}
              <button
                onClick={loadDashboardData}
                disabled={refreshing}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              {/* Quick Link to Complaints */}
              <Link
                to="/admin/complaints"
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
              >
                <span>View All Complaints</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="p-6 space-y-6">
          {/* Duplicate Warnings Banner if duplicates exist */}
          {duplicatePairs.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 shadow-xs">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-700 mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-900">
                      Duplicate Complaint Alert ({duplicatePairs.length} potential duplicate {duplicatePairs.length === 1 ? 'pair' : 'pairs'} detected)
                    </h3>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Text similarity analysis flagged matching open complaints at the same location. Please inspect to prevent double-dispatch.
                    </p>
                  </div>
                </div>
                <Link
                  to="/admin/duplicates"
                  className="inline-flex items-center space-x-1 text-xs font-bold text-amber-900 hover:text-amber-950 underline shrink-0 ml-4"
                >
                  <span>Review Duplicates</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* KPI Stats Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Complaints"
              value={total}
              subtitle="All reported university incidents"
              icon={ClipboardList}
              variant="default"
              trend={{ value: '+8% vs last week', isPositive: true }}
              onClick={() => navigate('/admin/complaints')}
            />

            <StatsCard
              title="Pending Triage"
              value={pending}
              subtitle="Awaiting review or dispatch"
              icon={Clock}
              variant="pending"
              trend={{ value: `${pending} need review`, isPositive: false }}
              onClick={() => navigate('/admin/complaints?status=Pending')}
            />

            <StatsCard
              title="In Progress"
              value={inProgress}
              subtitle="Assigned to department teams"
              icon={Activity}
              variant="inprogress"
              trend={{ value: 'Active maintenance', isPositive: true }}
              onClick={() => navigate('/admin/complaints?status=In Progress')}
            />

            <StatsCard
              title="Resolved"
              value={resolved}
              subtitle="Successfully fixed & closed"
              icon={CheckCircle2}
              variant="resolved"
              trend={{ value: `${total > 0 ? Math.round((resolved / total) * 100) : 0}% success rate`, isPositive: true }}
              onClick={() => navigate('/admin/complaints?status=Resolved')}
            />
          </div>

          {/* Middle Row: Priority Distribution & Quick Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Priority Distribution Widget */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Priority Distribution</h2>
                    <p className="text-xs text-slate-500">Urgency level of recorded campus issues</p>
                  </div>
                  <ShieldAlert className="w-4 h-4 text-slate-400" />
                </div>

                <div className="space-y-3">
                  {/* Urgent */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold text-rose-700 flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        <span>Urgent (Safety Hazards)</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900">{urgentCount}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${total > 0 ? (urgentCount / total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* High */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold text-amber-700 flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>High Priority</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900">{highCount}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${total > 0 ? (highCount / total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Medium */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold text-sky-700 flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-sky-500" />
                        <span>Medium Priority</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900">{mediumCount}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-sky-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${total > 0 ? (mediumCount / total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Low */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold text-slate-600 flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        <span>Low Priority</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900">{lowCount}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-slate-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${total > 0 ? (lowCount / total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between items-center">
                <span>Total Active Urgent: {urgentCount}</span>
                <Link to="/admin/complaints?priority=Urgent" className="text-blue-600 hover:underline font-semibold">
                  Triage Urgent &rarr;
                </Link>
              </div>
            </div>

            {/* Quick Chart 1: Status Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Pipeline Status</h2>
                  <p className="text-xs text-slate-500">Live operational lifecycle</p>
                </div>
                <Link to="/admin/analytics" className="text-xs text-blue-600 hover:underline font-medium">
                  Full Analytics
                </Link>
              </div>
              <StatusPieChart data={analytics?.statusBreakdown || []} height={200} />
            </div>

            {/* Quick Department Allocation Snapshot */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Department Status</h2>
                    <p className="text-xs text-slate-500">Active workload per team</p>
                  </div>
                  <Building2 className="w-4 h-4 text-slate-400" />
                </div>

                <div className="space-y-2.5">
                  {departments.slice(0, 4).map((dept) => {
                    const deptComplaints = complaints.filter(c => c.assignedDepartment === dept.name);
                    const activeForDept = deptComplaints.filter(c => c.status !== 'Resolved').length;
                    return (
                      <div key={dept.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-semibold text-slate-800 truncate">{dept.name}</p>
                          <p className="text-[10px] text-slate-500">Head: {dept.head}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white text-slate-700 border border-slate-200 shrink-0">
                          {activeForDept} active
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <Link
                  to="/admin/departments"
                  className="text-xs text-blue-600 font-semibold hover:underline flex items-center justify-between"
                >
                  <span>Manage All Departments</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Complaints Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Recent Complaints</h2>
                <p className="text-xs text-slate-500">Latest reported incident records submitted across campus</p>
              </div>
              <Link
                to="/admin/complaints"
                className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                <span>View All ({complaints.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <ComplaintTable
              complaints={recentComplaints}
              departments={departments}
              onQuickStatusChange={handleQuickStatusChange}
              onQuickAssignDepartment={handleQuickAssignDepartment}
              isLoading={loading}
              emptyMessage="No recent complaints have been recorded."
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
