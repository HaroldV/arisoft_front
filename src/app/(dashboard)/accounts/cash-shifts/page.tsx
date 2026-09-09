import { CashShiftsAuditView } from '@/components/accounts/cash-shifts/CashShiftsAuditView';

export const metadata = {
  title: 'Auditoría de Cierres de Caja | ARI ERP',
  description: 'Auditoría de arqueos de caja y liquidación de ventas por sucursal',
};

export default function CashShiftsAuditPage() {
  return <CashShiftsAuditView />;
}
