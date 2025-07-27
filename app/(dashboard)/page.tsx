import { redirect } from 'next/navigation';

export default function DashboardDefaultPage() {
  redirect('/dashboard/dashboard');
}