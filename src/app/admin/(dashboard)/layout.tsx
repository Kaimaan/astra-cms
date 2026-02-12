import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isAuthEnabled, verifySession, SESSION_COOKIE } from '@/core/auth/session';
import AdminLayoutClient from './AdminLayoutClient';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authEnabled = await isAuthEnabled();

  if (authEnabled) {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      redirect('/admin/login');
    }

    const user = await verifySession(sessionId);
    if (!user) {
      redirect('/admin/login');
    }

    // Serialize user for client component (Dates → strings)
    const serializedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return <AdminLayoutClient user={serializedUser}>{children}</AdminLayoutClient>;
  }

  // No auth — zero-config dev mode
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
