import DashboardLayoutWrapper from '@/components/layouts/DashboardLayoutWrapper';

export default function QuotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
}



