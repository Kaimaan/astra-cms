import AdminLayoutClient from './AdminLayoutClient';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AdminLayoutClient>{children}</AdminLayoutClient>
      </body>
    </html>
  );
}
