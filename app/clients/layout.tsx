import DashboardLayoutWrapper from '@/components/layouts/DashboardLayoutWrapper';

export default function ClientsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
}



