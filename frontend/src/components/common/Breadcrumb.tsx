import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeNameMap: Record<string, string> = {
  '': 'Overview',
  'vendors': 'Vendors',
  'assessments': 'Assessments',
  'questionnaires': 'Questionnaires',
  'evidence': 'Evidence Repository',
  'security-controls': 'Security Controls',
  'risk-analysis': 'Risk Analysis',
  'reports': 'Intelligence Reports',
  'settings': 'Platform Settings',
};

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-slate-500 font-medium">
      <ol className="flex items-center space-x-1.5">
        <li>
          <Link
            to="/"
            className="flex items-center text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {pathnames.length === 0 ? (
          <li className="flex items-center">
            <ChevronRight className="h-3 w-3 text-slate-400 mx-1 shrink-0" />
            <span className="text-slate-800 font-semibold">Overview</span>
          </li>
        ) : (
          pathnames.map((value, index) => {
            const to = `/${pathnames.slice(0, index + 1).join('/')}`;
            const isLast = index === pathnames.length - 1;
            const displayName = routeNameMap[value] || value.charAt(0).toUpperCase() + value.slice(1);

            return (
              <li key={to} className="flex items-center">
                <ChevronRight className="h-3 w-3 text-slate-400 mx-1 shrink-0" />
                {isLast ? (
                  <span className="text-slate-900 font-semibold">{displayName}</span>
                ) : (
                  <Link
                    to={to}
                    className="text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    {displayName}
                  </Link>
                )}
              </li>
            );
          })
        )}
      </ol>
    </nav>
  );
};

