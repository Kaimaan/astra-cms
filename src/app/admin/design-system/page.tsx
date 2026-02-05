import config from '../../../../astra.config';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input, Textarea } from '@/components/ui/Input';
import { IconBox } from '@/components/ui/IconBox';

const { tokens } = config;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-16">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">{title}</h2>
      {children}
    </section>
  );
}

function ColorSwatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="group">
      <div
        className="w-full aspect-square rounded-xl border border-gray-200 shadow-sm mb-3 transition-transform group-hover:scale-105"
        style={{ backgroundColor: value }}
      />
      <p className="font-medium text-gray-900 text-sm">{name}</p>
      <p className="text-xs text-gray-400 font-mono">{value}</p>
    </div>
  );
}

function SpacingBar({ name, value }: { name: string; value: number }) {
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="w-12 text-sm font-medium text-gray-500">{name}</div>
      <div className="flex-1 flex items-center gap-3">
        <div
          className="h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg"
          style={{ width: `${Math.min(value * 2, 400)}px` }}
        />
        <span className="text-sm text-gray-400 font-mono">{value}px</span>
      </div>
    </div>
  );
}

function FontSizeRow({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="w-16 text-sm font-medium text-gray-500">{name}</div>
      <div style={{ fontSize: value }} className="text-gray-900 flex-1">
        The quick brown fox
      </div>
      <div className="text-sm text-gray-400 font-mono">{value}</div>
    </div>
  );
}

function RadiusBox({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600"
        style={{ borderRadius: value }}
      />
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">{name}</p>
        <p className="text-xs text-gray-400 font-mono">{value}</p>
      </div>
    </div>
  );
}

function ShadowBox({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="w-24 h-24 bg-white rounded-xl"
        style={{ boxShadow: value }}
      />
      <p className="text-sm font-medium text-gray-700">{name}</p>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-10">
        <p className="text-gray-500">
          Design tokens and components from <code className="bg-gray-100 px-2 py-1 rounded-md text-sm font-mono">astra.config.ts</code>
        </p>
      </div>

      {/* Components */}
      <Section title="Components">
        <div className="grid gap-10">
          {/* Buttons */}
          <div>
            <h3 className="text-base font-medium text-gray-800 mb-4">Buttons</h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <Button isLoading>Loading</Button>
              <Button disabled>Disabled</Button>
              <Button leftIcon={<span>+</span>}>With Icon</Button>
            </div>
          </div>

          {/* Badges */}
          <div>
            <h3 className="text-base font-medium text-gray-800 mb-4">Badges</h3>
            <div className="flex flex-wrap items-center gap-3">
              <Badge>Default</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </div>

          {/* Cards */}
          <div>
            <h3 className="text-base font-medium text-gray-800 mb-4">Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Default Card</CardTitle>
                  <CardDescription>This is a default card with standard styling</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Card content goes here.</p>
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="outline">Cancel</Button>
                  <Button size="sm">Save</Button>
                </CardFooter>
              </Card>

              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Elevated Card</CardTitle>
                  <CardDescription>With shadow elevation</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Elevated card content.</p>
                </CardContent>
              </Card>

              <Card hover>
                <CardHeader>
                  <CardTitle>Hover Card</CardTitle>
                  <CardDescription>Interactive on hover</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Hover over me!</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Inputs */}
          <div>
            <h3 className="text-base font-medium text-gray-800 mb-4">Inputs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
              <Input label="Email" placeholder="you@example.com" hint="We'll never share your email" />
              <Input label="Password" type="password" placeholder="Enter password" />
              <Input label="With Error" error="This field is required" placeholder="Something went wrong" />
              <Input label="Disabled" disabled placeholder="Can't edit this" />
            </div>
            <div className="mt-6 max-w-xl">
              <Textarea label="Message" placeholder="Type your message here..." hint="Max 500 characters" />
            </div>
          </div>

          {/* Icon Boxes */}
          <div>
            <h3 className="text-base font-medium text-gray-800 mb-4">Icon Boxes</h3>
            <div className="flex flex-wrap items-end gap-4">
              <IconBox>+</IconBox>
              <IconBox variant="primary">*</IconBox>
              <IconBox variant="success">!</IconBox>
              <IconBox variant="warning">?</IconBox>
              <IconBox variant="error">X</IconBox>
              <IconBox size="sm">S</IconBox>
              <IconBox size="lg">L</IconBox>
            </div>
          </div>
        </div>
      </Section>

      {/* Colors */}
      <Section title="Colors">
        {/* Brand Colors */}
        <div className="mb-8">
          <h3 className="text-base font-medium text-gray-800 mb-4">Brand Colors</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <ColorSwatch name="primary" value={tokens.colors.primary} />
            <ColorSwatch name="secondary" value={tokens.colors.secondary} />
            <ColorSwatch name="background" value={tokens.colors.background} />
            <ColorSwatch name="foreground" value={tokens.colors.foreground} />
          </div>
        </div>

        {/* Primary Palette */}
        <div className="mb-8">
          <h3 className="text-base font-medium text-gray-800 mb-4">Primary Palette</h3>
          <div className="grid grid-cols-5 md:grid-cols-11 gap-2">
            {Object.entries(tokens.colors.primaryPalette)
              .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
              .map(([shade, value]) => (
                <ColorSwatch key={shade} name={shade} value={value} />
              ))}
          </div>
        </div>

        {/* Secondary Palette */}
        <div className="mb-8">
          <h3 className="text-base font-medium text-gray-800 mb-4">Secondary Palette</h3>
          <div className="grid grid-cols-5 md:grid-cols-11 gap-2">
            {Object.entries(tokens.colors.secondaryPalette)
              .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
              .map(([shade, value]) => (
                <ColorSwatch key={shade} name={shade} value={value} />
              ))}
          </div>
        </div>

        {/* Semantic Colors */}
        <div>
          <h3 className="text-base font-medium text-gray-800 mb-4">Semantic Colors</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            <ColorSwatch name="success" value={tokens.colors.success} />
            <ColorSwatch name="warning" value={tokens.colors.warning} />
            <ColorSwatch name="error" value={tokens.colors.error} />
            <ColorSwatch name="muted" value={tokens.colors.muted} />
            <ColorSwatch name="border" value={tokens.colors.border} />
          </div>
        </div>
      </Section>

      {/* Spacing */}
      <Section title="Spacing">
        <Card padding="lg">
          <div className="space-y-1">
            {Object.entries(tokens.spacing).map(([name, value]) => (
              <SpacingBar key={name} name={name} value={value} />
            ))}
          </div>
        </Card>
      </Section>

      {/* Typography */}
      <Section title="Typography">
        <div className="grid gap-8">
          <div>
            <h3 className="text-base font-medium text-gray-800 mb-4">Font Families</h3>
            <Card padding="lg">
              {Object.entries(tokens.typography.fontFamily).map(([name, value]) => (
                <div key={name} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                  <div className="w-20 text-sm font-medium text-gray-500">{name}</div>
                  <div style={{ fontFamily: value }} className="text-xl text-gray-900">
                    The quick brown fox jumps over the lazy dog
                  </div>
                </div>
              ))}
            </Card>
          </div>

          <div>
            <h3 className="text-base font-medium text-gray-800 mb-4">Font Sizes</h3>
            <Card padding="lg">
              {Object.entries(tokens.typography.fontSize).map(([name, value]) => (
                <FontSizeRow key={name} name={name} value={value} />
              ))}
            </Card>
          </div>
        </div>
      </Section>

      {/* Border Radius */}
      <Section title="Border Radius">
        <div className="flex flex-wrap gap-8 p-8 bg-gray-100 rounded-2xl">
          {Object.entries(tokens.radius).map(([name, value]) => (
            <RadiusBox key={name} name={name} value={value} />
          ))}
        </div>
      </Section>

      {/* Shadows */}
      <Section title="Shadows">
        <div className="flex flex-wrap gap-8 p-8 bg-gray-100 rounded-2xl">
          {Object.entries(tokens.shadows).map(([name, value]) => (
            <ShadowBox key={name} name={name} value={value} />
          ))}
        </div>
      </Section>
    </div>
  );
}
