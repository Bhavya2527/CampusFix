import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminDashboard } from './AdminDashboard';
import { ComplaintManagement } from './ComplaintManagement';
import { ComplaintDetails } from './ComplaintDetails';
import { Analytics } from './Analytics';
import { DepartmentManagement } from './DepartmentManagement';
import { DuplicateDetection } from './DuplicateDetection';

/**
 * AdminRoutes Component
 * Provides modular nested routing for the CampusFix Admin Module.
 *
 * Usage in parent App.jsx:
 * <Route path="/admin/*" element={<AdminRoutes />} />
 *
 * Or individual routes:
 * <Route path="/admin" element={<AdminDashboard />} />
 * <Route path="/admin/complaints" element={<ComplaintManagement />} />
 * <Route path="/admin/complaints/:id" element={<ComplaintDetails />} />
 * <Route path="/admin/departments" element={<DepartmentManagement />} />
 * <Route path="/admin/duplicates" element={<DuplicateDetection />} />
 * <Route path="/admin/analytics" element={<Analytics />} />
 */
export const AdminRoutes = () => {
  return (
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="complaints" element={<ComplaintManagement />} />
      <Route path="complaints/:id" element={<ComplaintDetails />} />
      <Route path="departments" element={<DepartmentManagement />} />
      <Route path="duplicates" element={<DuplicateDetection />} />
      <Route path="analytics" element={<Analytics />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};

export default AdminRoutes;
