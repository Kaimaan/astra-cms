import { getContentProvider } from '@/infrastructure';
import { PagesListClient } from './PagesListClient';

export default async function PagesListPage() {
  const provider = getContentProvider();
  const allPages = await provider.getPages({ status: 'all' });

  const pages = allPages.map((page) => ({
    id: page.id,
    title: page.title,
    paths: page.paths,
    status: page.status,
    updatedAt: page.updatedAt.toISOString(),
  }));

  return <PagesListClient initialPages={pages} />;
}
