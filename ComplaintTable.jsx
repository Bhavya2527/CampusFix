import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, 
  MapPin, 
  Calendar, 
  Building2, 
  ChevronRight, 
  User, 
  Tag, 
  MoreVertical,
  CheckCircle,
  Clock,
  Activity,
  AlertTriangle,
  ArrowUpDown
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';

/**
 * ComplaintTable Component
 * High-density, professional university operations table
 */
export const ComplaintTable = ({
  complaints = [],
  onSelectComplaint,
  onQuickStatusChange,
  onQuickAssignDepartment,
  departments = [],
  isLoading = false,
  emptyMessage = "No complaints found matching current filters."
}) => {
  const navigate = useNavigate();
  const [activeActionMenu, setActiveActionMenu] = useState(null);

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(d);
    } catch (e) {
      return isoString;
    }
  };

  const handleRowClick = (complaint) => {
    if (onSelectComplaint) {
      onSelectComplaint(complaint);
    } else {
      navigate(`/admin/complaints/${complaint.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden p-8 text-center shadow-sm">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-blue-50 text-blue-600 mb-3 animate-spin">
          <Activity className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-slate-700">Loading complaints registry...</p>
        <p className="text-xs text-slate-400 mt-1">Fetching live data from CampusFix API</p>
      </div>
    );
  }

  if (!complaints.length) {
    return (
      <div className="w-full bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center shadow-sm">
        <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">No records to display</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap">ID</th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap">Student</th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap min-w-[220px]">Title & Description</th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap">Category</th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap">Location</th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap">Priority</th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap">Assigned Department</th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap">Status</th>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap">Date</th>
              <th scope="col" className="px-4 py-3.5 text-right whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {complaints.map((item) => {
              const studentName = typeof item.student === 'object' ? item.student?.name : item.student || 'Anonymous';
              const studentId = typeof item.student === 'object' ? item.student?.id : '';
              const studentAvatar = typeof item.student === 'object' ? item.student?.avatar : null;

              return (
                <tr
                  key={item.id}
                  onClick={() => handleRowClick(item)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors duration-150 group"
                >
                  {/* ID */}
                  <td className="px-4 py-3.5 whitespace-nowrap font-mono text-xs font-bold text-blue-600">
                    {item.id}
                  </td>

                  {/* Student */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center space-x-2.5">
                      {studentAvatar ? (
                        <img
                          src={studentAvatar}
                          alt={studentName}
                          className="h-7 w-7 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                          {studentName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-slate-900 leading-tight text-xs">
                          {studentName}
                        </div>
                        {studentId && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {studentId}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Title & Description */}
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 text-xs">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 max-w-xs">
                      {item.description}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {item.category || 'General'}
                    </span>
                  </td>

                  {/* Location */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[140px]" title={item.location}>
                        {item.location}
                      </span>
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <StatusBadge status={item.priority} type="priority" size="sm" />
                  </td>

                  {/* Assigned Department */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <StatusBadge status={item.assignedDepartment} type="department" size="sm" />
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <StatusBadge status={item.status} type="status" size="sm" />
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-[11px] text-slate-500">
                    {formatDate(item.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => handleRowClick(item)}
                        title="View Full Details"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Quick Department Assign dropdown */}
                      {onQuickAssignDepartment && departments.length > 0 && (
                        <select
                          value={item.assignedDepartment || ''}
                          onChange={(e) => onQuickAssignDepartment(item.id, e.target.value)}
                          className="text-[11px] py-1 px-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          title="Quick Assign Department"
                        >
                          <option value="" disabled>Assign Dept...</option>
                          {departments.map((d) => (
                            <option key={d.id} value={d.name}>{d.name}</option>
                          ))}
                        </select>
                      )}

                      {/* Quick Status toggle dropdown */}
                      {onQuickStatusChange && (
                        <select
                          value={item.status}
                          onChange={(e) => onQuickStatusChange(item.id, e.target.value)}
                          className="text-[11px] py-1 px-1.5 border border-slate-200 rounded-lg bg-white font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          title="Quick Status Change"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span>Showing {complaints.length} complaint records</span>
        <span className="text-[11px] text-slate-400">Click any row to open complaint inspection dossier</span>
      </div>
    </div>
  );
};

export default ComplaintTable;
