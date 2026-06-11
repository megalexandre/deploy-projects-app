import { Card, CardContent } from '@/shared/components/Card';
import { Input } from '@/shared/components/Input';
import type { User } from '@/types';

interface UserProfileReadonlySectionProps {
  currentUser: User | null;
}

export const UserProfileReadonlySection: React.FC<UserProfileReadonlySectionProps> = ({
  currentUser,
}) => (
  <div className="space-y-6 page-enter">
    <div>
      <h1 className="text-2xl font-bold text-gray-100">Meu Perfil</h1>
      <p className="mt-1 text-gray-400">Visualizacao do proprio usuario autenticado.</p>
    </div>

    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
          A API atual nao possui endpoint para editar o proprio perfil. Por isso, os dados abaixo
          estao disponiveis apenas para consulta no frontend.
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Input label="Nome" value={currentUser?.name ?? ''} readOnly />
          <Input label="E-mail" value={currentUser?.email ?? ''} readOnly />
          <Input label="Perfil" value={currentUser?.role ?? 'user'} readOnly />
          <Input label="Acesso" value={currentUser?.isAdmin ? 'Perfil Main' : 'Usuario'} readOnly />
        </div>
      </CardContent>
    </Card>
  </div>
);
