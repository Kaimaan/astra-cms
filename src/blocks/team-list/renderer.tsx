import type { TeamListProps } from './index';
import { getContentProvider } from '@/infrastructure';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';

interface TeamListRendererProps {
  props: TeamListProps;
}

export async function TeamListRenderer({ props }: TeamListRendererProps) {
  const {
    title,
    subtitle,
    limit,
    layout,
    columns,
    showRole,
    showBio,
    showEmail,
    showSocial,
  } = props;

  // Fetch team members from content provider
  const provider = getContentProvider();
  const members = await provider.getTeamMembers({
    activeOnly: true,
    limit: limit || undefined,
  });

  const gridCols = {
    '2': 'md:grid-cols-2',
    '3': 'md:grid-cols-2 lg:grid-cols-3',
    '4': 'md:grid-cols-2 lg:grid-cols-4',
    '5': 'md:grid-cols-3 lg:grid-cols-5',
  };

  if (members.length === 0) {
    return (
      <section className="py-16">
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
            <p className="text-gray-500">
              No team members yet. Add them in the admin.
            </p>
          </div>
        </Container>
      </section>
    );
  }

  const SocialLinks = ({ social }: { social: NonNullable<typeof members[0]['social']> }) => (
    <div className="flex gap-3 justify-center">
      {social.linkedin && (
        <a
          href={social.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-blue-600 transition-colors"
          aria-label="LinkedIn"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </a>
      )}
      {social.twitter && (
        <a
          href={social.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-sky-500 transition-colors"
          aria-label="Twitter"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>
      )}
      {social.github && (
        <a
          href={social.github}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-gray-900 transition-colors"
          aria-label="GitHub"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
      )}
      {social.website && (
        <a
          href={social.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-primary-600 transition-colors"
          aria-label="Website"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
          </svg>
        </a>
      )}
    </div>
  );

  return (
    <section className="py-16">
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

        {/* Team Members */}
        {layout === 'list' ? (
          <div className="space-y-6 max-w-3xl mx-auto">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex gap-6 items-start bg-white rounded-lg border border-gray-200 p-6"
              >
                {member.avatar && (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-24 h-24 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {member.name}
                  </h3>
                  {showRole && member.role && (
                    <p className="text-primary-600 font-medium">{member.role}</p>
                  )}
                  {showBio && member.bio && (
                    <p className="mt-2 text-gray-600">{member.bio}</p>
                  )}
                  {showEmail && member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="mt-2 inline-block text-sm text-gray-500 hover:text-primary-600"
                    >
                      {member.email}
                    </a>
                  )}
                  {showSocial && member.social && (
                    <div className="mt-3 flex gap-3">
                      <SocialLinks social={member.social} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : layout === 'compact' ? (
          <div className="flex flex-wrap justify-center gap-8">
            {members.map((member) => (
              <div key={member.id} className="text-center w-32">
                {member.avatar && (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-20 h-20 rounded-full object-cover mx-auto"
                  />
                )}
                <h3 className="mt-3 font-medium text-gray-900 text-sm">
                  {member.name}
                </h3>
                {showRole && member.role && (
                  <p className="text-xs text-gray-500">{member.role}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Grid layout (default) */
          <div className={`grid gap-8 ${gridCols[columns]}`}>
            {members.map((member) => (
              <Card key={member.id} className="text-center p-6">
                {member.avatar && (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-32 h-32 rounded-full object-cover mx-auto"
                  />
                )}
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {member.name}
                </h3>
                {showRole && member.role && (
                  <p className="text-primary-600 font-medium">{member.role}</p>
                )}
                {showBio && member.bio && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                    {member.bio}
                  </p>
                )}
                {showEmail && member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="mt-2 inline-block text-sm text-gray-500 hover:text-primary-600"
                  >
                    {member.email}
                  </a>
                )}
                {showSocial && member.social && (
                  <div className="mt-4">
                    <SocialLinks social={member.social} />
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
