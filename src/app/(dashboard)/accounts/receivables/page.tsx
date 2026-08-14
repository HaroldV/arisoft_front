import ReceivablesPayables from '@/components/accounts/ReceivablesPayables';

export const metadata = {
  title: 'Cuentas por Cobrar (CxC) | ARI ERP',
  description: 'Gestión de saldos pendientes de clientes, facturas fiscales y cobranzas multimoneda',
};

export default function ReceivablesPage() {
  return <ReceivablesPayables forcedTab="RECEIVABLE" />;
}
