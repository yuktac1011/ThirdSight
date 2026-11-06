import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { OverviewPage } from '@/features/overview/OverviewPage';
import { PlaceholderView } from '@/components/common/PlaceholderView';
import { LoginPage } from '@/features/auth/LoginPage';
import { UnauthorizedPage } from '@/features/auth/UnauthorizedPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { VendorListPage } from '@/features/vendors/VendorListPage';
import { VendorDetailPage } from '@/features/vendors/VendorDetailPage';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import {
  ClipboardCheck,
  FileQuestion,
  FileCheck,
  Layers,
  ShieldAlert,
  FileText,
} from 'lucide-react';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected Application Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainLayout />}>
          {/* Dashboard Landing Route */}
          <Route index element={<OverviewPage />} />

          {/* Vendors Management (Increment 03 Real Implementation) */}
          <Route path="vendors" element={<VendorListPage />} />
          <Route path="vendors/:vendorId" element={<VendorDetailPage />} />

          {/* Feature Navigation Modules (Upcoming Increments) */}
          <Route
            path="assessments"
            element={
              <PlaceholderView
                moduleName="Assessments"
                description="Coordinate security assessments, audits, and compliance evaluation cycles."
                icon={<ClipboardCheck className="h-6 w-6 text-brand-600" />}
              />
            }
          />
          <Route
            path="questionnaires"
            element={
              <PlaceholderView
                moduleName="Questionnaires"
                description="Build, dispatch, and review industry standard (SIG, CAIQ, CIS) questionnaires."
                icon={<FileQuestion className="h-6 w-6 text-brand-600" />}
              />
            }
          />
          <Route
            path="evidence"
            element={
              <PlaceholderView
                moduleName="Evidence"
                description="Central repository for SOC reports, ISO certs, penetration test results, and policy documents."
                icon={<FileCheck className="h-6 w-6 text-brand-600" />}
              />
            }
          />
          <Route
            path="security-controls"
            element={
              <PlaceholderView
                moduleName="Security Controls"
                description="Catalog of organizational controls mapped against NIST, ISO 27001, and SOC 2."
                icon={<Layers className="h-6 w-6 text-brand-600" />}
              />
            }
          />
          <Route
            path="risk-analysis"
            element={
              <PlaceholderView
                moduleName="Risk Analysis"
                description="Threat modeling, vulnerability telemetry, and continuous automated risk scoring."
                icon={<ShieldAlert className="h-6 w-6 text-brand-600" />}
              />
            }
          />
          <Route
            path="reports"
            element={
              <PlaceholderView
                moduleName="Reports"
                description="Generate executive briefings, compliance audits, and regulatory risk disclosures."
                icon={<FileText className="h-6 w-6 text-brand-600" />}
              />
            }
          />

          {/* Settings & Organization Administration */}
          <Route path="settings" element={<SettingsPage />} />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
};
