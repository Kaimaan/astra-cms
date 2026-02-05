import type { BlogListProps } from './index';
import { getContentProvider } from '@/infrastructure';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface BlogListRendererProps {
  props: BlogListProps;
}

export async function BlogListRenderer({ props }: BlogListRendererProps) {
  const {
    title,
    subtitle,
    category,
    limit,
    layout,
    columns,
    showExcerpt,
    showAuthor,
    showDate,
    showCategories,
    viewAllLink,
    viewAllText,
  } = props;

  // Fetch posts from content provider
  const provider = getContentProvider();
  const posts = await provider.getPosts({
    status: 'published',
    category,
    limit,
    sortBy: 'publishedAt',
    sortOrder: 'desc',
  });

  // Fetch team members for author info
  const teamMembers = await provider.getTeamMembers({ activeOnly: true });
  const authorMap = new Map(teamMembers.map((m) => [m.id, m]));

  // Fetch categories for badges
  const categories = await provider.getCategories();
  const categoryMap = new Map(categories.map((c) => [c.slug, c]));

  const gridCols = {
    '2': 'md:grid-cols-2',
    '3': 'md:grid-cols-2 lg:grid-cols-3',
    '4': 'md:grid-cols-2 lg:grid-cols-4',
  };

  if (posts.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <Container>
          {title && (
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
              {subtitle && (
                <p className="mt-4 text-lg text-gray-600">{subtitle}</p>
              )}
            </div>
          )}
          <div className="text-center py-12">
            <p className="text-gray-500">No posts yet. Create your first post in the admin.</p>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <Container>
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && (
              <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-4 text-lg text-gray-600">{subtitle}</p>
            )}
          </div>
        )}

        {/* Posts Grid/List */}
        {layout === 'list' ? (
          <div className="space-y-6 max-w-3xl mx-auto">
            {posts.map((post) => {
              const author = post.authorId ? authorMap.get(post.authorId) : null;
              return (
                <article
                  key={post.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <Link href={`/blog/${post.slug}`} className="block">
                    <div className="flex gap-6">
                      {post.featuredImage && (
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-48 h-32 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        {showCategories && post.categories && post.categories.length > 0 && (
                          <div className="flex gap-2 mb-2">
                            {post.categories.map((slug) => {
                              const cat = categoryMap.get(slug);
                              return (
                                <span
                                  key={slug}
                                  className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded"
                                >
                                  {cat?.name || slug}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        <h3 className="text-xl font-semibold text-gray-900 hover:text-primary-600">
                          {post.title}
                        </h3>
                        {showExcerpt && post.excerpt && (
                          <p className="mt-2 text-gray-600 line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                          {showAuthor && author && (
                            <span className="flex items-center gap-2">
                              {author.avatar && (
                                <img
                                  src={author.avatar}
                                  alt={author.name}
                                  className="w-6 h-6 rounded-full"
                                />
                              )}
                              {author.name}
                            </span>
                          )}
                          {showDate && post.publishedAt && (
                            <time dateTime={post.publishedAt.toISOString()}>
                              {post.publishedAt.toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </time>
                          )}
                          {post.readingTime && (
                            <span>{post.readingTime} min read</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        ) : layout === 'featured' ? (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Featured (first) post */}
            {posts[0] && (
              <Link href={`/blog/${posts[0].slug}`} className="block group">
                <article className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                  {posts[0].featuredImage && (
                    <img
                      src={posts[0].featuredImage}
                      alt={posts[0].title}
                      className="w-full h-64 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary-600">
                      {posts[0].title}
                    </h3>
                    {showExcerpt && posts[0].excerpt && (
                      <p className="mt-3 text-gray-600">{posts[0].excerpt}</p>
                    )}
                  </div>
                </article>
              </Link>
            )}
            {/* Other posts */}
            <div className="space-y-4">
              {posts.slice(1).map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="block group"
                >
                  <article className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex gap-4">
                      {post.featuredImage && (
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-24 h-24 object-cover rounded"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">
                          {post.title}
                        </h3>
                        {showDate && post.publishedAt && (
                          <time className="text-sm text-gray-500">
                            {post.publishedAt.toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </time>
                        )}
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          /* Grid layout (default) */
          <div className={`grid gap-8 ${gridCols[columns]}`}>
            {posts.map((post) => {
              const author = post.authorId ? authorMap.get(post.authorId) : null;
              return (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="block group"
                >
                  <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden">
                    {post.featuredImage && (
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-6">
                      {showCategories && post.categories && post.categories.length > 0 && (
                        <div className="flex gap-2 mb-3">
                          {post.categories.slice(0, 2).map((slug) => {
                            const cat = categoryMap.get(slug);
                            return (
                              <span
                                key={slug}
                                className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded"
                              >
                                {cat?.name || slug}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600">
                        {post.title}
                      </h3>
                      {showExcerpt && post.excerpt && (
                        <p className="mt-2 text-gray-600 line-clamp-2 text-sm">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="mt-4 flex items-center gap-3 text-sm text-gray-500">
                        {showAuthor && author && (
                          <span className="flex items-center gap-2">
                            {author.avatar && (
                              <img
                                src={author.avatar}
                                alt={author.name}
                                className="w-5 h-5 rounded-full"
                              />
                            )}
                            <span className="truncate">{author.name}</span>
                          </span>
                        )}
                        {showDate && post.publishedAt && (
                          <time dateTime={post.publishedAt.toISOString()}>
                            {post.publishedAt.toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </time>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* View All Link */}
        {viewAllLink && (
          <div className="text-center mt-12">
            <Link href={viewAllLink}>
              <Button variant="outline">{viewAllText}</Button>
            </Link>
          </div>
        )}
      </Container>
    </section>
  );
}
