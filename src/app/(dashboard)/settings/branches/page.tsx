import { BranchesManagement } from '@/components/branches/BranchesManagement';

export const metadata = {
  title: 'Gestión de Sucursales | ARI ERP',
  description: 'Administración de sucursales físicas y asignación de almacenes',
};

export default function BranchesPage() {
  return <BranchesManagement />;
}
