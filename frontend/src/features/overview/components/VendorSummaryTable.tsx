import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { mockVendors } from '@/features/overview/data/mockOverviewData';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const VendorSummaryTable: React.FC = () => {
  return (
    <Card className="hover:shadow-card-hover transition-all duration-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>High-Exposure Vendor Overview</CardTitle>
            <CardDescription>Monitored third parties requiring continuous compliance validation</CardDescription>
          </div>
          <Link
            to="/vendors"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-brand-50 border border-transparent hover:border-brand-200/60"
          >
            All Vendors <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Vendor Entity</TableHead>
              <TableHead>Criticality</TableHead>
              <TableHead>Security Score</TableHead>
              <TableHead>Audit Status</TableHead>
              <TableHead className="text-right">Last Assessment</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {mockVendors.map((vendor) => {
              const scoreBadge =
                vendor.riskScore >= 80 ? 'success' : vendor.riskScore >= 60 ? 'warning' : 'danger';

              return (
                <TableRow key={vendor.id} className="hover:bg-slate-50/80 transition-colors group">
                  <TableCell>
                    <div className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                      {vendor.name}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{vendor.domain}</div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">
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
                  <TableCell className="text-right text-xs font-mono text-slate-500">
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
