import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { OverviewPage } from '@/features/overview/OverviewPage';
import { PlaceholderView } from '@/components/common/PlaceholderView';
import {
  Building2,
  ClipboardCheck,
  FileQuestion,
  FileCheck,
  Layers,
  ShieldAlert,
  FileText,
  Settings,
} from 'lucide-react';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Dashboard Landing Route */}
        <Route index element={<OverviewPage />} />

        {/* Feature Navigation Placeholders */}
        <Route
          path="vendors"
          element={
            <PlaceholderView
              moduleName="Vendors"
              description="Manage third-party entities, tiers, contact persons, and domain mappings."
              icon={<Building2 className="h-6 w-6 text-brand-600" />}
            />
          }
        />
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
        <Route
          path="settings"
          element={
            <PlaceholderView
              moduleName="Settings"
              description="Manage workspace configuration, team permissions, integrations, and notification preferences."
              icon={<Settings className="h-6 w-6 text-brand-600" />}
            />
          }
        />

        {/* Fallback to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

