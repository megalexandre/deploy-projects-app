import { Button } from '@/shared/components/Button';
import { Card, CardContent } from '@/shared/components/Card';

export const SegurancaSettingsSection: React.FC = () => (
  <div className="space-y-6 page-enter">
    <h3 className="mb-4 text-lg font-medium text-gray-100">Configurações de Segurança</h3>

    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <h4 className="mb-2 font-medium text-gray-100">Autenticação de Dois Fatores</h4>
          <p className="mb-4 text-sm text-gray-400">
            Adicione uma camada extra de segurança a sua conta.
          </p>
          <Button variant="outline">Configurar 2FA</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h4 className="mb-2 font-medium text-gray-100">Senha</h4>
          <p className="mb-4 text-sm text-gray-400">
            Altere sua senha regularmente para manter a segurança.
          </p>
          <Button variant="outline">Alterar Senha</Button>
        </CardContent>
      </Card>
    </div>
  </div>
);
