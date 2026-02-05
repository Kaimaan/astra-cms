import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { IconBox } from '@/components/ui/IconBox';

export default function AdminDashboard() {
  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s what&apos;s happening with your site today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Pages"
          value="12"
          change="+2"
          trend="up"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          label="Assets"
          value="48"
          change="+8"
          trend="up"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Blocks"
          value="4"
          change=""
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          }
        />
        <StatCard
          label="Locales"
          value="2"
          change=""
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/admin/pages/new">
              <Card hover padding="lg" className="h-full">
                <div className="flex flex-col items-center text-center">
                  <IconBox variant="primary" size="lg" className="mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </IconBox>
                  <CardTitle className="mb-1">Create Page</CardTitle>
                  <CardDescription>Add a new page to your site</CardDescription>
                </div>
              </Card>
            </Link>

            <Link href="/admin/assets">
              <Card hover padding="lg" className="h-full">
                <div className="flex flex-col items-center text-center">
                  <IconBox variant="secondary" size="lg" className="mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </IconBox>
                  <CardTitle className="mb-1">Upload Asset</CardTitle>
                  <CardDescription>Add images and files</CardDescription>
                </div>
              </Card>
            </Link>

            <Link href="/admin/blocks">
              <Card hover padding="lg" className="h-full">
                <div className="flex flex-col items-center text-center">
                  <IconBox variant="success" size="lg" className="mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                    </svg>
                  </IconBox>
                  <CardTitle className="mb-1">View Blocks</CardTitle>
                  <CardDescription>Manage content blocks</CardDescription>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <Card padding="none">
            <div className="divide-y divide-gray-100">
              <ActivityItem
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                }
                title="Page created"
                description="Homepage"
                time="Just now"
              />
              <ActivityItem
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                  </svg>
                }
                title="Asset uploaded"
                description="hero-image.jpg"
                time="2 hours ago"
              />
              <ActivityItem
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                }
                title="Page updated"
                description="About Us"
                time="Yesterday"
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Setup Status */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Setup Status</h2>
      <Card padding="lg" className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SetupItem
            title="Firebase Connection"
            status="pending"
            description="Configure your Firebase credentials"
          />
          <SetupItem
            title="Authentication"
            status="pending"
            description="Set up Firebase Auth for admin"
          />
          <SetupItem
            title="Content Storage"
            status="pending"
            description="Firestore database ready"
          />
          <SetupItem
            title="Design Tokens"
            status="complete"
            description="Configured in astra.config.ts"
          />
          <SetupItem
            title="Blocks"
            status="complete"
            description="4 starter blocks ready"
          />
          <SetupItem
            title="Localization"
            status="complete"
            description="Multi-language support enabled"
          />
        </div>
      </Card>

      {/* Getting Started */}
      <Card variant="ghost" padding="lg">
        <div className="flex items-start gap-4">
          <IconBox variant="primary" size="lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </IconBox>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Getting Started</h3>
            <ol className="space-y-2 text-gray-600">
              <li className="flex items-center gap-2">
                <Badge variant="outline" size="sm">1</Badge>
                <span>Copy <code className="bg-gray-200 px-1.5 py-0.5 rounded text-sm">.env.example</code> to <code className="bg-gray-200 px-1.5 py-0.5 rounded text-sm">.env.local</code></span>
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="outline" size="sm">2</Badge>
                <span>Add your Firebase project credentials</span>
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="outline" size="sm">3</Badge>
                <span>Set up Firestore security rules</span>
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="outline" size="sm">4</Badge>
                <span>Create your first page!</span>
              </li>
            </ol>
            <div className="mt-4">
              <Button variant="outline" size="sm">
                View Documentation
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
  trend,
  icon,
}: {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
  icon: React.ReactNode;
}) {
  return (
    <Card padding="lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
              {change} this week
            </p>
          )}
        </div>
        <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
          {icon}
        </div>
      </div>
    </Card>
  );
}

function ActivityItem({
  icon,
  title,
  description,
  time,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500 truncate">{description}</p>
      </div>
      <p className="text-xs text-gray-400 whitespace-nowrap">{time}</p>
    </div>
  );
}

function SetupItem({
  title,
  status,
  description,
}: {
  title: string;
  status: 'complete' | 'pending' | 'error';
  description: string;
}) {
  const statusConfig = {
    complete: {
      badge: <Badge variant="success" size="sm">Complete</Badge>,
      icon: (
        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    pending: {
      badge: <Badge variant="warning" size="sm">Pending</Badge>,
      icon: (
        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    error: {
      badge: <Badge variant="error" size="sm">Error</Badge>,
      icon: (
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
      <div className="mt-0.5">{config.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-gray-900">{title}</p>
          {config.badge}
        </div>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}
