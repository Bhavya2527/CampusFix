import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  X,
  SlidersHorizontal,
  ChevronDown,
  Building2,
  AlertCircle
} from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { ComplaintTable } from '../../components/admin/ComplaintTable';
import {
  getComplaints,
  getDepartments,
  updateComplaintStatus,
  assignComplaintDepartment
} from './adminApi';
import { detectDuplicateComplaints } from './duplicateHelper';

/**
 * ComplaintManagement Page
 * Comprehensive operations registry with multi-facet filters & search
 */
export const ComplaintManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveApi, setIsLiveApi] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'ALL');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'ALL');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [departmentFilter, setDepartmentFilter] = useState(searchParams.get('department') || 'ALL');

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [compRes, deptRes] = await Promise.all([
        getComplaints(),
        getDepartments()
      ]);

      const complaintsList = compRes.data || [];
      setComplaints(complaintsList);
      setDepartments(deptRes.data || []);
      setIsLiveApi(compRes.isLive);

      const dups = detectDuplicateComplaints(complaintsList);
      setDuplicateCount(dups.length);
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync state with URL params
  useEffect(() => {
    const statusParam = searchParams.get('status');
    const priorityParam = searchParams.get('priority');
    const categoryParam = searchParams.get('category');
    const departmentParam = searchParams.get('department');
    const qParam = searchParams.get('q');

    if (statusParam) setStatusFilter(statusParam);
    if (priorityParam) setPriorityFilter(priorityParam);
    if (categoryParam) setCategoryFilter(categoryParam);
    if (departmentParam) setDepartmentFilter(departmentParam);
    if (qParam !== null) setSearchTerm(qParam);
  }, [searchParams]);

  // Update URL params when filters change
  const updateParams = (newParams) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (!v || v === 'ALL') {
        next.delete(k);
      } else {
        next.set(k, v);
      }
    });
    setSearchParams(next);
  };

  const handleQuickStatusChange = async (id, status) => {
    try {
      await updateComplaintStatus(id, status);
      await loadData();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleQuickAssignDepartment = async (id, dept) => {
    try {
      await assignComplaintDepartment(id, dept);
      await loadData();
    } catch (err) {
      console.error('Failed to assign department:', err);
    }
  };

  // Extract unique categories from data
  const availableCategories = useMemo(() => {
    const cats = new Set(complaints.map(c => c.category).filter(Boolean));
    return Array.from(cats);
  }, [complaints]);

  // Filtered dataset
  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      // Search Term (ID, Title, Student name, Location, Description)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const idMatch = (item.id || '').toLowerCase().includes(term);
        const titleMatch = (item.title || '').toLowerCase().includes(term);
        const descMatch = (item.description || '').toLowerCase().includes(term);
        const locMatch = (item.location || '').toLowerCase().includes(term);
        const studentName = typeof item.student === 'object' ? item.student?.name : item.student;
        const studentMatch = (studentName || '').toLowerCase().includes(term);

        if (!idMatch && !titleMatch && !descMatch && !locMatch && !studentMatch) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'ALL' && item.priority !== priorityFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      // Department filter
      if (departmentFilter !== 'ALL') {
        if (departmentFilter === 'UNASSIGNED') {
          if (item.assignedDepartment && item.assignedDepartment !== 'Unassigned') {
            return false;
          }
        } else if (item.assignedDepartment !== departmentFilter) {
          return false;
        }
      }

      return true;
    });
  }, [complaints, searchTerm, categoryFilter, priorityFilter, statusFilter, departmentFilter]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setCategoryFilter('ALL');
    setPriorityFilter('ALL');
    setStatusFilter('ALL');
    setDepartmentFilter('ALL');
    setSearchParams({});
  };

  const hasActiveFilters = searchTerm || categoryFilter !== 'ALL' || priorityFilter !== 'ALL' || statusFilter !== 'ALL' || departmentFilter !== 'ALL';

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredComplaints.length) return;

    const headers = ['Complaint ID', 'Student Name', 'Student ID', 'Title', 'Category', 'Location', 'Priority', 'Assigned Department', 'Status', 'Date'];
    const rows = filteredComplaints.map(c => [
      `"${c.id}"`,
      `"${typeof c.student === 'object' ? c.student?.name : c.student}"`,
      `"${typeof c.student === 'object' ? c.student?.id : ''}"`,
      `"${(c.title || '').replace(/"/g, '""')}"`,
      `"${c.category || ''}"`,
      `"${(c.location || '').replace(/"/g, '""')}"`,
      `"${c.priority || ''}"`,
      `"${c.assignedDepartment || 'Unassigned'}"`,
      `"${c.status || ''}"`,
      `"${c.createdAt || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `campusfix_complaints_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pendingCount = complaints.filter(c => c.status === 'Pending').length;

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
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Complaint Registry & Triage
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized registry of all student and campus utility complaints
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

              <button
                onClick={handleExportCSV}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 space-y-5">
          {/* Filter & Search Bar Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
            {/* Search Input Row */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    updateParams({ q: e.target.value });
                  }}
                  placeholder="Search by Complaint ID (#CMP), Title, Student Name, Location..."
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      updateParams({ q: '' });
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Quick Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
                {['ALL', 'Pending', 'In Progress', 'Resolved'].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setStatusFilter(st);
                      updateParams({ status: st });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      statusFilter === st
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'ALL' ? 'All Statuses' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Faceted Dropdowns Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
              {/* Category Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    updateParams({ category: e.target.value });
                  }}
                  className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Categories</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Priority
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => {
                    setPriorityFilter(e.target.value);
                    updateParams({ priority: e.target.value });
                  }}
                  className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Assigned Department
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => {
                    setDepartmentFilter(e.target.value);
                    updateParams({ department: e.target.value });
                  }}
                  className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Departments</option>
                  <option value="UNASSIGNED">Unassigned Only</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>

              {/* Reset Action */}
              <div className="flex items-end">
                {hasActiveFilters ? (
                  <button
                    onClick={clearAllFilters}
                    className="w-full py-1.5 px-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Clear Filters</span>
                  </button>
                ) : (
                  <div className="w-full py-1.5 px-3 text-center text-[11px] text-slate-400">
                    Filters default
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Filter Tags */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Active filters:</span>
              {searchTerm && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  Search: "{searchTerm}"
                  <button onClick={() => { setSearchTerm(''); updateParams({ q: '' }); }} className="ml-1 text-blue-500 hover:text-blue-700">&times;</button>
                </span>
              )}
              {statusFilter !== 'ALL' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  Status: {statusFilter}
                  <button onClick={() => { setStatusFilter('ALL'); updateParams({ status: 'ALL' }); }} className="ml-1 text-blue-500 hover:text-blue-700">&times;</button>
                </span>
              )}
              {priorityFilter !== 'ALL' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  Priority: {priorityFilter}
                  <button onClick={() => { setPriorityFilter('ALL'); updateParams({ priority: 'ALL' }); }} className="ml-1 text-blue-500 hover:text-blue-700">&times;</button>
                </span>
              )}
              {categoryFilter !== 'ALL' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  Category: {categoryFilter}
                  <button onClick={() => { setCategoryFilter('ALL'); updateParams({ category: 'ALL' }); }} className="ml-1 text-blue-500 hover:text-blue-700">&times;</button>
                </span>
              )}
              {departmentFilter !== 'ALL' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  Dept: {departmentFilter === 'UNASSIGNED' ? 'Unassigned' : departmentFilter}
                  <button onClick={() => { setDepartmentFilter('ALL'); updateParams({ department: 'ALL' }); }} className="ml-1 text-blue-500 hover:text-blue-700">&times;</button>
                </span>
              )}
            </div>
          )}

          {/* Results Table */}
          <ComplaintTable
            complaints={filteredComplaints}
            departments={departments}
            onQuickStatusChange={handleQuickStatusChange}
            onQuickAssignDepartment={handleQuickAssignDepartment}
            isLoading={isLoading}
            emptyMessage={hasActiveFilters ? "No complaints matched your search & filter criteria. Try adjusting your parameters." : "No complaints recorded yet."}
          />
        </main>
      </div>
    </div>
  );
};

export default ComplaintManagement;
