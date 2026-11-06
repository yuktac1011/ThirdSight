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
import { QuestionnaireDashboardPage } from '@/features/questionnaires/QuestionnaireDashboardPage';
import { TemplateDetailPage } from '@/features/questionnaires/TemplateDetailPage';
import { AssessmentDashboardPage } from '@/features/assessments/AssessmentDashboardPage';
import { AssessmentDetailPage } from '@/features/assessments/AssessmentDetailPage';
import { VendorResponsePortalPage } from '@/features/assessments/VendorResponsePortalPage';
import { EvidencePage } from '@/features/evidence/EvidencePage';
import { ControlsPage } from '@/features/controls/ControlsPage';
import { RiskDashboardPage } from '@/features/risk/RiskDashboardPage';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import {
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

          {/* Vendors Management (Increment 03) */}
          <Route path="vendors" element={<VendorListPage />} />
          <Route path="vendors/:vendorId" element={<VendorDetailPage />} />

          {/* Security Questionnaire Engine (Increment 04) */}
          <Route path="questionnaires" element={<QuestionnaireDashboardPage />} />
          <Route path="questionnaires/templates/:templateId" element={<TemplateDetailPage />} />

          {/* Assessment Management & Vendor Response Portal (Increments 05 & 06) */}
          <Route path="assessments" element={<AssessmentDashboardPage />} />
          <Route path="assessments/:assessmentId" element={<AssessmentDetailPage />} />
          <Route path="assessments/:assessmentId/respond" element={<VendorResponsePortalPage />} />

          {/* Evidence Management (Increment 07) */}
          <Route path="evidence" element={<EvidencePage />} />

          {/* Security Controls & Framework Crosswalk (Increment 08) */}
          <Route path="security-controls" element={<ControlsPage />} />

          {/* Risk Engine, Gap Analysis & Remediation (Increment 09) */}
          <Route path="risk-analysis" element={<RiskDashboardPage />} />
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
