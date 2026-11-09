import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { mockVendors } from '@/features/overview/data/mockOverviewData';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const VendorSummaryTable: React.FC = () => {
  return (
    <Card hover className="transition-all duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>High-Exposure Vendor Overview</CardTitle>
            <CardDescription>Monitored third parties requiring continuous compliance validation</CardDescription>
          </div>
          <Link
            to="/vendors"
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
          >
            All Vendors <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <tr className="border-b border-slate-800">
              <TableHead className="text-slate-400 font-bold uppercase text-[11px] tracking-wider">Vendor Entity</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-[11px] tracking-wider">Criticality</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-[11px] tracking-wider">Security Score</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-[11px] tracking-wider">Audit Status</TableHead>
              <TableHead className="text-right text-slate-400 font-bold uppercase text-[11px] tracking-wider">Last Assessment</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {mockVendors.map((vendor) => {
              const scoreBadge =
                vendor.riskScore >= 80 ? 'success' : vendor.riskScore >= 60 ? 'warning' : 'danger';

              return (
                <TableRow key={vendor.id} className="border-b border-slate-800/60 hover:bg-slate-800/50 transition-colors group">
                  <TableCell>
                    <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {vendor.name}
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{vendor.domain}</div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[11px] font-bold text-slate-300 bg-slate-800/90 px-2.5 py-1 rounded-md border border-slate-700 shadow-subtle">
                      {vendor.tier}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={scoreBadge} size="sm" dot>
                      {vendor.riskScore} / 100
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        vendor.status === 'Active'
                          ? 'success'
                          : vendor.status === 'Review Required'
                          ? 'danger'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {vendor.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono text-slate-400">
                    {vendor.lastAssessmentDate}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
