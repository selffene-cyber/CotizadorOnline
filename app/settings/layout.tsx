import DashboardLayoutWrapper from '@/components/layouts/DashboardLayoutWrapper';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
}


