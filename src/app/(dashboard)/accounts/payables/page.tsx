import ReceivablesPayables from '@/components/accounts/ReceivablesPayables';

export const metadata = {
  title: 'Cuentas por Pagar (CxP) | ARI ERP',
  description: 'Control de compromisos financieros con proveedores, compras y egresos',
};

export default function PayablesPage() {
  return <ReceivablesPayables forcedTab="PAYABLE" />;
}
