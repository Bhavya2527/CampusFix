/**
 * CampusFix Admin API Service
 * Base URL: http://localhost:8000/api
 *
 * Implements endpoints:
 * - GET /complaints
 * - GET /analytics
 * - GET /departments
 * - PATCH /complaints/{id}/status
 * - PATCH /complaints/{id}/assign
 *
 * Includes graceful offline fallback with realistic university data
 * to guarantee interactive testing when the backend server is starting.
 */

const DEFAULT_BASE_URL = 'http://localhost:8000/api';

export const getApiBaseUrl = () => {
  if (typeof process !== 'undefined' && process.env?.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  try {
    // Vite environment
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
      return import.meta.env.VITE_API_BASE_URL;
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_BASE_URL;
};

// Seeded department dataset
export const INITIAL_DEPARTMENTS = [
  {
    id: 'dept-plumbing',
    name: 'Plumbing & Water Works',
    code: 'PLUMB',
    head: 'Dr. Ramesh Kumar',
    email: 'plumbing@campusfix.edu',
    phone: '+91 98110 22341',
    staffCount: 12,
    activeCount: 9,
    resolvedCount: 64,
    slaHours: 24,
    capacity: '85%'
  },
  {
    id: 'dept-electrical',
    name: 'Electrical & Power Grid',
    code: 'ELEC',
    head: 'Er. Sunita Sharma',
    email: 'electrical@campusfix.edu',
    phone: '+91 98110 22342',
    staffCount: 15,
    activeCount: 14,
    resolvedCount: 92,
    slaHours: 12,
    capacity: '92%'
  },
  {
    id: 'dept-it',
    name: 'IT & Campus Wi-Fi Network',
    code: 'ITNET',
    head: 'Prof. Ankit Mehta',
    email: 'it-support@campusfix.edu',
    phone: '+91 98110 22343',
    staffCount: 10,
    activeCount: 7,
    resolvedCount: 110,
    slaHours: 8,
    capacity: '70%'
  },
  {
    id: 'dept-civil',
    name: 'Civil Works & Infrastructure',
    code: 'CIVIL',
    head: 'Er. Vikram Joshi',
    email: 'civil@campusfix.edu',
    phone: '+91 98110 22344',
    staffCount: 18,
    activeCount: 11,
    resolvedCount: 45,
    slaHours: 48,
    capacity: '65%'
  },
  {
    id: 'dept-sanitation',
    name: 'Sanitation & Housekeeping',
    code: 'SANIT',
    head: 'Mrs. Geeta Patel',
    email: 'sanitation@campusfix.edu',
    phone: '+91 98110 22345',
    staffCount: 22,
    activeCount: 5,
    resolvedCount: 138,
    slaHours: 6,
    capacity: '55%'
  },
  {
    id: 'dept-security',
    name: 'Campus Safety & Access Control',
    code: 'SEC',
    head: 'Capt. R. S. Randhawa',
    email: 'security@campusfix.edu',
    phone: '+91 98110 22346',
    staffCount: 14,
    activeCount: 2,
    resolvedCount: 31,
    slaHours: 4,
    capacity: '40%'
  }
];

// Seeded complaint dataset for realistic demo and resilient testing
export const INITIAL_COMPLAINTS = [
  {
    id: 'CMP-2026-1041',
    student: {
      name: 'Aarav Sharma',
      id: '2024CS0142',
      email: 'aarav.sharma@campus.edu',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60'
    },
    title: 'Severe water leakage in 3rd floor washroom ceiling',
    description: 'Continuous water dripping from the ceiling pipe in 3rd floor washroom near room 304. Water is accumulating near electric switches and creating slippery floor hazard.',
    category: 'Plumbing',
    location: 'Hostel Block B, Floor 3',
    priority: 'Urgent',
    assignedDepartment: 'Plumbing & Water Works',
    status: 'In Progress',
    createdAt: '2026-10-28T09:15:00Z',
    updatedAt: '2026-10-29T11:30:00Z',
    resolutionNotes: 'Inspection team dispatched. Main valve closed temporarily. Gasket replacement in progress.',
    history: [
      { status: 'Pending', timestamp: '2026-10-28T09:15:00Z', note: 'Complaint logged by student' },
      { status: 'In Progress', timestamp: '2026-10-29T11:30:00Z', note: 'Assigned to Plumbing & Water Works. Technician on site.' }
    ]
  },
  {
    id: 'CMP-2026-1042',
    student: {
      name: 'Sneha Patel',
      id: '2023EE0089',
      email: 'sneha.patel@campus.edu',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60'
    },
    title: 'Water leaking from pipe in 3rd floor bathroom',
    description: 'Water dripping continuously from ceiling pipe in third floor washroom. Floor is flooded and damp.',
    category: 'Plumbing',
    location: 'Hostel Block B, 3rd Floor',
    priority: 'High',
    assignedDepartment: 'Plumbing & Water Works',
    status: 'Pending',
    createdAt: '2026-10-28T10:45:00Z',
    updatedAt: '2026-10-28T10:45:00Z',
    resolutionNotes: '',
    history: [
      { status: 'Pending', timestamp: '2026-10-28T10:45:00Z', note: 'Complaint logged by student' }
    ]
  },
  {
    id: 'CMP-2026-1043',
    student: {
      name: 'Rohan Verma',
      id: '2024ME0211',
      email: 'rohan.verma@campus.edu',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=60'
    },
    title: 'Wi-Fi Access Point offline in Central Library 2nd Floor',
    description: 'The primary access point AP-LIB-204 is displaying a solid red light. No student can connect to the eduroam network in the silent reading section.',
    category: 'IT & Wi-Fi',
    location: 'Central Library, 2nd Floor Reading Hall',
    priority: 'High',
    assignedDepartment: 'IT & Campus Wi-Fi Network',
    status: 'Pending',
    createdAt: '2026-10-29T08:00:00Z',
    updatedAt: '2026-10-29T08:00:00Z',
    resolutionNotes: '',
    history: [
      { status: 'Pending', timestamp: '2026-10-29T08:00:00Z', note: 'Complaint logged by student' }
    ]
  },
  {
    id: 'CMP-2026-1044',
    student: {
      name: 'Pooja Iyer',
      id: '2025CS0304',
      email: 'pooja.iyer@campus.edu',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=60'
    },
    title: 'Short circuit sparks observed in Classroom 108 switchboard',
    description: 'Sparks and burning smell observed when turning on projector switch in Classroom 108. Breaker did not trip immediately. High danger risk.',
    category: 'Electrical',
    location: 'Academic Complex 1, Room 108',
    priority: 'Urgent',
    assignedDepartment: 'Electrical & Power Grid',
    status: 'In Progress',
    createdAt: '2026-10-29T14:20:00Z',
    updatedAt: '2026-10-29T14:45:00Z',
    resolutionNotes: 'Classroom temporarily locked for safety. Emergency electrician team dispatched.',
    history: [
      { status: 'Pending', timestamp: '2026-10-29T14:20:00Z', note: 'Complaint logged by student' },
      { status: 'In Progress', timestamp: '2026-10-29T14:45:00Z', note: 'Urgent response initiated' }
    ]
  },
  {
    id: 'CMP-2026-1045',
    student: {
      name: 'Aditya Rao',
      id: '2022CE0045',
      email: 'aditya.rao@campus.edu',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60'
    },
    title: 'Broken window latch and cracked glass panel in seminar hall',
    description: 'During yesterday high wind storm, the top glass pane in Seminar Hall 2 cracked. The latch mechanism is bent and won’t lock securely.',
    category: 'Infrastructure',
    location: 'Science Block, Seminar Hall 2',
    priority: 'Medium',
    assignedDepartment: 'Civil Works & Infrastructure',
    status: 'Resolved',
    createdAt: '2026-10-25T11:00:00Z',
    updatedAt: '2026-10-27T16:30:00Z',
    resolutionNotes: 'Replaced cracked pane with tempered glass. Installed new heavy-duty brass latch. Inspected adjacent windows.',
    history: [
      { status: 'Pending', timestamp: '2026-10-25T11:00:00Z', note: 'Complaint logged' },
      { status: 'In Progress', timestamp: '2026-10-26T09:00:00Z', note: 'Glazier assigned' },
      { status: 'Resolved', timestamp: '2026-10-27T16:30:00Z', note: 'Repair completed and signed off' }
    ]
  },
  {
    id: 'CMP-2026-1046',
    student: {
      name: 'Kavita Menon',
      id: '2024BT0118',
      email: 'kavita.m@campus.edu',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=60'
    },
    title: 'Garbage bins overflowing near Dining Hall entrance',
    description: 'Sanitary bins outside Mess 1 have not been cleared for 2 days. Foul odor and stray animals gathering near dining entry.',
    category: 'Sanitation',
    location: 'Central Dining Hall, Gate 1',
    priority: 'Medium',
    assignedDepartment: 'Sanitation & Housekeeping',
    status: 'Resolved',
    createdAt: '2026-10-27T08:30:00Z',
    updatedAt: '2026-10-27T14:00:00Z',
    resolutionNotes: 'Special clearing drive conducted. Bins disinfected and schedule reset to twice daily.',
    history: [
      { status: 'Pending', timestamp: '2026-10-27T08:30:00Z', note: 'Complaint logged' },
      { status: 'Resolved', timestamp: '2026-10-27T14:00:00Z', note: 'Housekeeping cleared and sanitized area' }
    ]
  },
  {
    id: 'CMP-2026-1047',
    student: {
      name: 'Nikhil Desai',
      id: '2023CS0190',
      email: 'nikhil.desai@campus.edu',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60'
    },
    title: 'Ceiling fan making screeching noise and wobbling',
    description: 'Ceiling fan #2 in Room 214 vibrates vigorously and generates high pitched metallic screeching. Student concerned it may detach.',
    category: 'Electrical',
    location: 'Hostel Block A, Room 214',
    priority: 'Low',
    assignedDepartment: 'Electrical & Power Grid',
    status: 'Pending',
    createdAt: '2026-10-30T07:10:00Z',
    updatedAt: '2026-10-30T07:10:00Z',
    resolutionNotes: '',
    history: [
      { status: 'Pending', timestamp: '2026-10-30T07:10:00Z', note: 'Complaint logged' }
    ]
  },
  {
    id: 'CMP-2026-1048',
    student: {
      name: 'Meera Sen',
      id: '2024EC0112',
      email: 'meera.sen@campus.edu',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=60'
    },
    title: 'Library 2nd floor eduroam connection down',
    description: 'Cannot connect to Wi-Fi on second floor library. Network shows no internet access.',
    category: 'IT & Wi-Fi',
    location: 'Central Library, 2nd Floor',
    priority: 'Medium',
    assignedDepartment: 'IT & Campus Wi-Fi Network',
    status: 'Pending',
    createdAt: '2026-10-29T11:15:00Z',
    updatedAt: '2026-10-29T11:15:00Z',
    resolutionNotes: '',
    history: [
      { status: 'Pending', timestamp: '2026-10-29T11:15:00Z', note: 'Complaint logged' }
    ]
  },
  {
    id: 'CMP-2026-1049',
    student: {
      name: 'Tanya Banerjee',
      id: '2025ME0033',
      email: 'tanya.b@campus.edu',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60'
    },
    title: 'Main Gate turnstile biometric scanner not registering cards',
    description: 'RFID reader on turnstile #3 fails to read student cards during peak 9 AM rush, causing 50+ student bottleneck outside campus.',
    category: 'Security',
    location: 'Main Campus Gate 1',
    priority: 'High',
    assignedDepartment: 'Campus Safety & Access Control',
    status: 'In Progress',
    createdAt: '2026-10-29T09:20:00Z',
    updatedAt: '2026-10-29T10:00:00Z',
    resolutionNotes: 'Firmware reset attempted. Vendor technician called for hardware sensor replacement.',
    history: [
      { status: 'Pending', timestamp: '2026-10-29T09:20:00Z', note: 'Reported by gate guard and student' },
      { status: 'In Progress', timestamp: '2026-10-29T10:00:00Z', note: 'Assigned to Security IT team' }
    ]
  },
  {
    id: 'CMP-2026-1050',
    student: {
      name: 'Arjun Singhal',
      id: '2023CS0077',
      email: 'arjun.s@campus.edu',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=60'
    },
    title: 'Potable water cooler dispensing warm discolored water',
    description: 'Water dispenser on 1st floor of Academic Block 2 produces brownish water and cooling compressor is non-functional.',
    category: 'Plumbing',
    location: 'Academic Complex 2, Floor 1 Corridor',
    priority: 'Urgent',
    assignedDepartment: null, // intentionally unassigned to test department assignment
    status: 'Pending',
    createdAt: '2026-10-30T08:45:00Z',
    updatedAt: '2026-10-30T08:45:00Z',
    resolutionNotes: '',
    history: [
      { status: 'Pending', timestamp: '2026-10-30T08:45:00Z', note: 'Complaint logged' }
    ]
  }
];

// Persistent state cache for seamless offline fallback
const STORAGE_KEY_COMPLAINTS = 'campusfix_admin_complaints_v1';
const STORAGE_KEY_DEPARTMENTS = 'campusfix_admin_departments_v1';

const getStoredComplaints = () => {
  if (typeof window === 'undefined') return INITIAL_COMPLAINTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COMPLAINTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Storage read error:', e);
  }
  return INITIAL_COMPLAINTS;
};

const saveStoredComplaints = (list) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_COMPLAINTS, JSON.stringify(list));
  } catch (e) {
    console.warn('Storage write error:', e);
  }
};

const getStoredDepartments = () => {
  if (typeof window === 'undefined') return INITIAL_DEPARTMENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEPARTMENTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Storage read error:', e);
  }
  return INITIAL_DEPARTMENTS;
};

const saveStoredDepartments = (list) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_DEPARTMENTS, JSON.stringify(list));
  } catch (e) {
    console.warn('Storage write error:', e);
  }
};

// Compute dynamic analytics from actual complaints array
export const computeAnalyticsFromData = (complaintsList, departmentsList) => {
  const total = complaintsList.length;
  const pending = complaintsList.filter(c => c.status === 'Pending').length;
  const inProgress = complaintsList.filter(c => c.status === 'In Progress').length;
  const resolved = complaintsList.filter(c => c.status === 'Resolved').length;

  // Category counts
  const categoryMap = {};
  complaintsList.forEach(c => {
    const cat = c.category || 'General';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const categoryBreakdown = Object.entries(categoryMap).map(([category, count]) => ({
    category,
    count
  })).sort((a, b) => b.count - a.count);

  // Status counts
  const statusBreakdown = [
    { name: 'Pending', count: pending, color: '#f59e0b' },
    { name: 'In Progress', count: inProgress, color: '#3b82f6' },
    { name: 'Resolved', count: resolved, color: '#10b981' }
  ];

  // Priority distribution
  const priorityMap = { Urgent: 0, High: 0, Medium: 0, Low: 0 };
  complaintsList.forEach(c => {
    if (priorityMap[c.priority] !== undefined) {
      priorityMap[c.priority]++;
    }
  });
  const priorityDistribution = [
    { priority: 'Urgent', count: priorityMap.Urgent, color: '#ef4444' },
    { priority: 'High', count: priorityMap.High, color: '#f97316' },
    { priority: 'Medium', count: priorityMap.Medium, color: '#0ea5e9' },
    { priority: 'Low', count: priorityMap.Low, color: '#64748b' }
  ];

  // Department counts
  const deptBreakdown = departmentsList.map(dept => {
    const deptComplaints = complaintsList.filter(c => c.assignedDepartment === dept.name);
    return {
      department: dept.name,
      code: dept.code,
      total: deptComplaints.length,
      pending: deptComplaints.filter(c => c.status === 'Pending').length,
      inProgress: deptComplaints.filter(c => c.status === 'In Progress').length,
      resolved: deptComplaints.filter(c => c.status === 'Resolved').length
    };
  });

  // Location breakdown
  const locationMap = {};
  complaintsList.forEach(c => {
    const loc = c.location ? c.location.split(',')[0].trim() : 'Unknown';
    locationMap[loc] = (locationMap[loc] || 0) + 1;
  });
  const locationBreakdown = Object.entries(locationMap).map(([location, count]) => ({
    location,
    count
  })).sort((a, b) => b.count - a.count).slice(0, 6);

  return {
    totalComplaints: total,
    pendingComplaints: pending,
    inProgressComplaints: inProgress,
    resolvedComplaints: resolved,
    resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
    avgResolutionTimeHours: 28,
    categoryBreakdown,
    statusBreakdown,
    priorityDistribution,
    departmentBreakdown: deptBreakdown,
    locationBreakdown
  };
};

/**
 * Check backend health
 */
export const checkApiHealth = async () => {
  const baseUrl = getApiBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${baseUrl}/complaints`, {
      method: 'HEAD',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return res.ok || res.status === 200;
  } catch (err) {
    return false;
  }
};

/**
 * GET /complaints
 */
export const getComplaints = async () => {
  const baseUrl = getApiBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${baseUrl}/complaints`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    const data = await res.json();
    const complaints = Array.isArray(data) ? data : (data.complaints || data.data || []);
    // Cache in local storage for fallback
    saveStoredComplaints(complaints);
    return { data: complaints, isLive: true };
  } catch (error) {
    console.warn('[CampusFix API] GET /complaints failed or offline. Using local resilient data.', error.message);
    const fallback = getStoredComplaints();
    return { data: fallback, isLive: false, error: error.message };
  }
};

/**
 * GET /complaints/{id}
 */
export const getComplaintById = async (id) => {
  const baseUrl = getApiBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${baseUrl}/complaints/${id}`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    const data = await res.json();
    return { data: data.complaint || data, isLive: true };
  } catch (error) {
    const list = getStoredComplaints();
    const match = list.find(c => String(c.id) === String(id));
    if (match) {
      return { data: match, isLive: false };
    }
    throw new Error(`Complaint with ID ${id} not found`);
  }
};

/**
 * GET /departments
 */
export const getDepartments = async () => {
  const baseUrl = getApiBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${baseUrl}/departments`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    const data = await res.json();
    const departments = Array.isArray(data) ? data : (data.departments || data.data || []);
    saveStoredDepartments(departments);
    return { data: departments, isLive: true };
  } catch (error) {
    console.warn('[CampusFix API] GET /departments offline. Using seeded departments.', error.message);
    const fallback = getStoredDepartments();
    return { data: fallback, isLive: false, error: error.message };
  }
};

/**
 * GET /analytics
 */
export const getAnalytics = async () => {
  const baseUrl = getApiBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${baseUrl}/analytics`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    const data = await res.json();
    return { data, isLive: true };
  } catch (error) {
    console.warn('[CampusFix API] GET /analytics offline. Computing dynamic analytics from actual complaints.', error.message);
    const complaints = getStoredComplaints();
    const departments = getStoredDepartments();
    const computed = computeAnalyticsFromData(complaints, departments);
    return { data: computed, isLive: false, error: error.message };
  }
};

/**
 * PATCH /complaints/{id}/status
 * @param {string|number} id
 * @param {string} status 'Pending' | 'In Progress' | 'Resolved'
 * @param {string} resolutionNotes
 */
export const updateComplaintStatus = async (id, status, resolutionNotes = '') => {
  const baseUrl = getApiBaseUrl();
  const payload = { status, resolutionNotes };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${baseUrl}/complaints/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`PATCH /complaints/${id}/status failed: ${res.statusText}`);
    }
    const data = await res.json();

    // Also update local cache
    const currentList = getStoredComplaints();
    const updated = currentList.map(c => {
      if (String(c.id) === String(id)) {
        return {
          ...c,
          status,
          resolutionNotes: resolutionNotes || c.resolutionNotes,
          updatedAt: new Date().toISOString(),
          history: [
            ...(c.history || []),
            {
              status,
              timestamp: new Date().toISOString(),
              note: resolutionNotes || `Status updated to ${status}`
            }
          ]
        };
      }
      return c;
    });
    saveStoredComplaints(updated);

    return { data: data.complaint || data, isLive: true };
  } catch (error) {
    console.warn('[CampusFix API] PATCH /complaints/{id}/status offline, persisting locally:', error.message);
    const currentList = getStoredComplaints();
    let updatedRecord = null;
    const updated = currentList.map(c => {
      if (String(c.id) === String(id)) {
        updatedRecord = {
          ...c,
          status,
          resolutionNotes: resolutionNotes || c.resolutionNotes,
          updatedAt: new Date().toISOString(),
          history: [
            ...(c.history || []),
            {
              status,
              timestamp: new Date().toISOString(),
              note: resolutionNotes || `Status updated to ${status}`
            }
          ]
        };
        return updatedRecord;
      }
      return c;
    });
    saveStoredComplaints(updated);

    return { data: updatedRecord, isLive: false, offlineUpdated: true };
  }
};

/**
 * PATCH /complaints/{id}/assign
 * @param {string|number} id
 * @param {string} department
 */
export const assignComplaintDepartment = async (id, department) => {
  const baseUrl = getApiBaseUrl();
  const payload = { department };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${baseUrl}/complaints/${id}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`PATCH /complaints/${id}/assign failed: ${res.statusText}`);
    }
    const data = await res.json();

    // Also update local cache
    const currentList = getStoredComplaints();
    const updated = currentList.map(c => {
      if (String(c.id) === String(id)) {
        return {
          ...c,
          assignedDepartment: department,
          updatedAt: new Date().toISOString(),
          history: [
            ...(c.history || []),
            {
              status: c.status,
              timestamp: new Date().toISOString(),
              note: `Assigned to ${department}`
            }
          ]
        };
      }
      return c;
    });
    saveStoredComplaints(updated);

    return { data: data.complaint || data, isLive: true };
  } catch (error) {
    console.warn('[CampusFix API] PATCH /complaints/{id}/assign offline, persisting locally:', error.message);
    const currentList = getStoredComplaints();
    let updatedRecord = null;
    const updated = currentList.map(c => {
      if (String(c.id) === String(id)) {
        updatedRecord = {
          ...c,
          assignedDepartment: department,
          updatedAt: new Date().toISOString(),
          history: [
            ...(c.history || []),
            {
              status: c.status,
              timestamp: new Date().toISOString(),
              note: `Assigned to ${department}`
            }
          ]
        };
        return updatedRecord;
      }
      return c;
    });
    saveStoredComplaints(updated);

    return { data: updatedRecord, isLive: false, offlineUpdated: true };
  }
};
