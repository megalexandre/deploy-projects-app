import React from 'react';
import { Card, CardContent } from '@/shared/components/Card';

interface DashboardStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
}

export const DashboardStatCard: React.FC<DashboardStatCardProps> = ({ icon, label, value }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">{icon}</div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-100">{value}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);
