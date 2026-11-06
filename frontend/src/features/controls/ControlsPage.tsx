import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Layers,
  Search,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/common/FeedbackStates';
import { controlService, SecurityControl, Framework } from '@/services/controlService';

export const ControlsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedControl, setSelectedControl] = useState<SecurityControl | null>(null);

  const { data: frameworks } = useQuery<Framework[]>({
    queryKey: ['frameworks_list'],
    queryFn: () => controlService.listFrameworks(),
  });

  const {
    data: controls,
    isLoading,
    error,
  } = useQuery<SecurityControl[]>({
    queryKey: ['security_controls_list', selectedDomain],
    queryFn: () => controlService.listControls(selectedDomain !== 'all' ? selectedDomain : undefined),
  });

  const filteredControls = (controls || []).filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.mappings.some((m) => m.framework_ref.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const domains = Array.from(new Set((controls || []).map((c) => c.domain)));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl flex items-center gap-2.5">
            <Layers className="h-7 w-7 text-brand-600" />
            Security Control Library & Framework Crosswalk
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Enterprise unified controls mapped to NIST CSF 2.0, ISO/IEC 27001:2022, and SOC 2 Trust Services Criteria.
          </p>
        </div>
      </div>

      {/* Framework Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {frameworks?.map((fw) => (
          <div key={fw.id} className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm hover:border-brand-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Framework</span>
              <Badge variant="neutral" className="font-mono text-xs">v{fw.version}</Badge>
            </div>
            <h3 className="text-base font-semibold text-slate-900 mt-1">{fw.name}</h3>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{fw.description}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by control code, title, or framework reference (e.g. PR.AA-01, A.5.15, CC6.1)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-slate-400" />}
          />
        </div>
        <div>
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            aria-label="Filter controls by security domain"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="all">All Security Domains</option>
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Controls Table */}
      {isLoading ? (
        <LoadingState message="Loading security control library and crosswalks..." />
      ) : error ? (
        <ErrorState message="Failed to load security control catalog." />
      ) : filteredControls.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-xl">
          <Layers className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">No security controls found</h3>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your domain filter or search query.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Code</th>
                  <th className="px-5 py-3.5">Control Title & Domain</th>
                  <th className="px-5 py-3.5">Framework Crosswalk Mappings</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 bg-white">
                {filteredControls.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedControl(c)}
                    className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200/80 px-2.5 py-1 rounded">
                        {c.code}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{c.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span className="text-slate-600 font-medium">{c.domain}</span>
                        <span>•</span>
                        <span className="line-clamp-1 max-w-md">{c.description}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {c.mappings.map((m) => (
                          <span
                            key={m.id}
                            title={`${m.framework_name}: ${m.mapping_notes || ''}`}
                            className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            <span className="text-slate-400">{m.framework_name?.split(' ')[0]}:</span>
                            <span className="font-bold">{m.framework_ref}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <ChevronRight className="h-4 w-4 text-slate-400 inline" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Control Detail Drawer / Modal */}
      {selectedControl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded">
                  {selectedControl.code}
                </span>
                <h3 className="text-lg font-semibold text-slate-900">{selectedControl.title}</h3>
              </div>
              <button
                onClick={() => setSelectedControl(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-500 space-y-1">
              <div><span className="font-semibold text-slate-700">Security Domain:</span> {selectedControl.domain}</div>
              <div><span className="font-semibold text-slate-700">Specification Version:</span> v{selectedControl.version}</div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Control Description</label>
              <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200/60 leading-relaxed">
                {selectedControl.description}
              </p>
            </div>

            {selectedControl.guidance && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-brand-600" /> Audit & Assessment Guidance
                </label>
                <p className="text-xs text-slate-600 bg-amber-50/50 p-3 rounded-lg border border-amber-200/60 leading-relaxed">
                  {selectedControl.guidance}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Framework Crosswalk Mappings ({selectedControl.mappings.length})
              </label>
              <div className="space-y-2">
                {selectedControl.mappings.map((m) => (
                  <div key={m.id} className="p-3 rounded-lg border border-slate-200 bg-white flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{m.framework_name}</span>
                        <span className="font-mono text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                          {m.framework_ref}
                        </span>
                      </div>
                      {m.mapping_notes && (
                        <p className="text-xs text-slate-500 mt-1">{m.mapping_notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedControl(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
