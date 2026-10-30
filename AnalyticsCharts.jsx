import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

// Theme Palette (Deep Navy, Slate, Indigo, Amber, Emerald, Rose)
const PALETTE = {
  navy: '#0f172a',
  blue: '#2563eb',
  indigo: '#4f46e5',
  sky: '#0284c7',
  teal: '#0d9488',
  amber: '#f59e0b',
  emerald: '#10b981',
  rose: '#f43f5e',
  slate: '#64748b'
};

const STATUS_COLORS = {
  'Pending': '#f59e0b',
  'In Progress': '#3b82f6',
  'Resolved': '#10b981',
  'Closed': '#94a3b8'
};

const CATEGORY_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];

/**
 * Custom Dark Navy Tooltip
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 text-white px-3 py-2 rounded-lg shadow-xl text-xs">
        <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1 mb-1">
          {label || payload[0]?.name}
        </p>
        {payload.map((entry, idx) => (
          <div key={`item-${idx}`} className="flex items-center justify-between space-x-4 my-0.5">
            <span className="flex items-center space-x-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              <span>{entry.name || 'Count'}:</span>
            </span>
            <span className="font-bold text-white font-mono">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * 1. Category-Wise Bar Chart
 */
export const CategoryBarChart = ({ data = [], height = 280 }) => {
  if (!data || !data.length) {
    return (
      <div className="h-[280px] flex items-center justify-center text-xs text-slate-400">
        No category data available
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="category" 
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
            interval={0}
            angle={-20}
            textAnchor="end"
          />
          <YAxis 
            allowDecimals={false}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" name="Complaints" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * 2. Complaint Status Donut / Pie Chart
 */
export const StatusPieChart = ({ data = [], height = 280 }) => {
  if (!data || !data.length) {
    return (
      <div className="h-[280px] flex items-center justify-center text-xs text-slate-400">
        No status distribution data available
      </div>
    );
  }

  // Format data
  const formattedData = data.map(item => ({
    name: item.name || item.status,
    value: item.count || item.value || 0,
    color: STATUS_COLORS[item.name || item.status] || '#64748b'
  }));

  const total = formattedData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="w-full relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={formattedData}
            cx="50%"
            cy="46%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
          >
            {formattedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            formatter={(val) => <span className="text-xs text-slate-600 font-medium">{val}</span>}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center total label */}
      <div className="absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none -mt-4">
        <span className="text-2xl font-bold text-slate-800">{total}</span>
        <span className="block text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Total</span>
      </div>
    </div>
  );
};

/**
 * 3. Department-Wise Chart (Stacked / Grouped Bar)
 */
export const DepartmentChart = ({ data = [], height = 300 }) => {
  if (!data || !data.length) {
    return (
      <div className="h-[300px] flex items-center justify-center text-xs text-slate-400">
        No department complaint records available
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data} 
          layout="vertical"
          margin={{ top: 10, right: 20, left: 45, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis 
            type="number" 
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: '#cbd5e1' }}
            allowDecimals={false}
          />
          <YAxis 
            type="category" 
            dataKey="code" 
            tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            height={30}
            formatter={(val) => <span className="text-xs text-slate-600 font-medium">{val}</span>}
          />
          <Bar dataKey="pending" name="Pending" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
          <Bar dataKey="inProgress" name="In Progress" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
          <Bar dataKey="resolved" name="Resolved" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * 4. Location-Wise Complaint Chart
 */
export const LocationChart = ({ data = [], height = 280 }) => {
  if (!data || !data.length) {
    return (
      <div className="h-[280px] flex items-center justify-center text-xs text-slate-400">
        No location breakdown data available
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="location" 
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
            interval={0}
            angle={-15}
            textAnchor="end"
          />
          <YAxis 
            allowDecimals={false}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" name="Complaints" fill="#0f172a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Unified Analytics Grid Component
 */
export const AnalyticsCharts = ({ analyticsData }) => {
  if (!analyticsData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 h-72 animate-pulse" />
        ))}
      </div>
    );
  }

  const {
    categoryBreakdown = [],
    statusBreakdown = [],
    departmentBreakdown = [],
    locationBreakdown = []
  } = analyticsData;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Category Bar Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Complaints by Category</h3>
            <p className="text-xs text-slate-500">Distribution across infrastructure & utilities</p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
            {categoryBreakdown.length} Categories
          </span>
        </div>
        <CategoryBarChart data={categoryBreakdown} height={260} />
      </div>

      {/* 2. Status Pie Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Complaint Status Distribution</h3>
            <p className="text-xs text-slate-500">Pending vs In Progress vs Resolved</p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
            Live Resolution Pipeline
          </span>
        </div>
        <StatusPieChart data={statusBreakdown} height={260} />
      </div>

      {/* 3. Department Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Department Workload & Resolution</h3>
            <p className="text-xs text-slate-500">Breakdown of complaints per operations team</p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            {departmentBreakdown.length} Departments
          </span>
        </div>
        <DepartmentChart data={departmentBreakdown} height={270} />
      </div>

      {/* 4. Location-Wise Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Location Hotspots</h3>
            <p className="text-xs text-slate-500">Frequent complaint origin zones across campus</p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            Top Locations
          </span>
        </div>
        <LocationChart data={locationBreakdown} height={260} />
      </div>
    </div>
  );
};

export default AnalyticsCharts;
