import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { mockVendors } from '@/features/overview/data/mockOverviewData';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const VendorSummaryTable: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>High-Exposure Vendor Overview</CardTitle>
            <CardDescription>Monitored third parties requiring ongoing compliance validation (Mock Scaffolding)</CardDescription>
          </div>
          <Link
            to="/vendors"
            className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1 transition-colors"
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
              <TableHead>Tier</TableHead>
              <TableHead>Security Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Last Assessment</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {mockVendors.map((vendor) => {
              const scoreBadge =
                vendor.riskScore >= 80 ? 'success' : vendor.riskScore >= 60 ? 'warning' : 'danger';

              return (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <div className="font-semibold text-slate-900">{vendor.name}</div>
                    <div className="text-xs text-slate-600 font-mono">{vendor.domain}</div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium text-slate-600">{vendor.tier}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={scoreBadge} size="sm">
                        {vendor.riskScore} / 100
                      </Badge>
                    </div>
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
                  <TableCell className="text-right text-xs font-mono text-slate-600">
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

