import DashboardLayoutWrapper from '@/components/layouts/DashboardLayoutWrapper';

export default function CostingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
}



