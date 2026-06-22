import React from 'react';
import { Shield, User, Users } from '@phosphor-icons/react';
import { Card, CardContent } from '@/shared/components/Card';

type Props = {
  totalUsers: number;
  mainUsers: number;
  regularUsers: number;
  profileCount: number;
};

export const UserStatsGrid: React.FC<Props> = ({
  totalUsers,
  mainUsers,
  regularUsers,
  profileCount,
}) => (
  <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Total</p>
            <p className="text-2xl font-bold text-blue-400">{totalUsers}</p>
          </div>
          <Users className="h-8 w-8 text-blue-400" />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Main</p>
            <p className="text-2xl font-bold text-amber-300">{mainUsers}</p>
          </div>
          <Shield className="h-8 w-8 text-amber-300" />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Usuários</p>
            <p className="text-2xl font-bold text-green-400">{regularUsers}</p>
          </div>
          <User className="h-8 w-8 text-green-400" />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Perfis</p>
            <p className="text-2xl font-bold text-purple-400">{profileCount}</p>
          </div>
          <Users className="h-8 w-8 text-purple-400" />
        </div>
      </CardContent>
    </Card>
  </div>
);
