import DashboardLayoutWrapper from '@/components/layouts/DashboardLayoutWrapper';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
}
