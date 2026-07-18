import { useState } from 'react'
import {
  Bell, Bot, Calendar, Check, Code2, Database,
  Download, Github, Globe, MessageSquare,
  Package, Puzzle, Search, Settings2, Shield, Sliders, Star, Zap,
} from 'lucide-react'
import { Badge } from '../lib/shadcn/badge'
import { Button } from '../lib/shadcn/button'
import { Card, CardContent, CardHeader, CardTitle } from '../lib/shadcn/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../lib/shadcn/dialog'
import { Input } from '../lib/shadcn/input'

type Plugin = {
  id: string
  name: string
  description: string
  category: 'development' | 'productivity' | 'communication' | 'analytics' | 'ai'
  icon: React.ReactNode
  installs: number
  stars: number
  version: string
  author: string
  installed: boolean
  featured?: boolean
  config?: { label: string; placeholder: string }[]
}

const PLUGINS: Plugin[] = [
  { id: 'github', name: 'GitHub Integration', description: 'Connect repos, analyze code, create PRs, and review commits directly from your AI workspace.', category: 'development', icon: <Github className="h-5 w-5" />, installs: 84200, stars: 4.9, version: '2.3.1', author: 'GitHub', installed: false, featured: true, config: [{ label: 'GitHub Token', placeholder: 'ghp_...' }, { label: 'Default Repository', placeholder: 'owner/repo' }] },
  { id: 'discord', name: 'Discord Bot', description: 'Share AI summaries, code snippets, and insights directly to Discord channels and threads.', category: 'communication', icon: <MessageSquare className="h-5 w-5" />, installs: 62100, stars: 4.8, version: '1.5.0', author: 'Discord Inc.', installed: true, featured: true, config: [{ label: 'Bot Token', placeholder: 'Bot ...' }, { label: 'Default Channel ID', placeholder: '123456789' }] },
  { id: 'notion', name: 'Notion Sync', description: 'Automatically sync notes, summaries, and AI outputs to your Notion workspace.', category: 'productivity', icon: <Database className="h-5 w-5" />, installs: 41800, stars: 4.7, version: '1.2.0', author: 'Notion Labs', installed: false, config: [{ label: 'Integration Token', placeholder: 'secret_...' }, { label: 'Database ID', placeholder: 'notion.so/...' }] },
  { id: 'slack', name: 'Slack Integration', description: 'Post AI-generated summaries, alerts, and code reviews directly to Slack channels.', category: 'communication', icon: <Bell className="h-5 w-5" />, installs: 58400, stars: 4.8, version: '3.1.0', author: 'Slack Technologies', installed: true, config: [{ label: 'Webhook URL', placeholder: 'https://hooks.slack.com/...' }] },
  { id: 'gcal', name: 'Google Calendar', description: 'Sync tasks, deadlines, and AI-generated schedules to Google Calendar automatically.', category: 'productivity', icon: <Calendar className="h-5 w-5" />, installs: 33700, stars: 4.6, version: '1.0.4', author: 'Google', installed: false, config: [{ label: 'Calendar ID', placeholder: 'your@gmail.com' }] },
  { id: 'vscode', name: 'VS Code Extension', description: 'Bring your AI coding assistant directly into VS Code with inline suggestions and chat.', category: 'development', icon: <Code2 className="h-5 w-5" />, installs: 97300, stars: 4.9, version: '4.0.2', author: 'Microsoft', installed: false, featured: true },
  { id: 'jira', name: 'Jira Tracker', description: 'Create, update, and track Jira tickets from AI suggestions and code reviews.', category: 'productivity', icon: <Sliders className="h-5 w-5" />, installs: 28900, stars: 4.5, version: '2.0.1', author: 'Atlassian', installed: false, config: [{ label: 'Jira URL', placeholder: 'https://your-org.atlassian.net' }, { label: 'API Token', placeholder: 'ATATT...' }] },
  { id: 'zapier', name: 'Zapier Connect', description: 'Connect your AI workspace to 5000+ apps and automate complex workflows without code.', category: 'analytics', icon: <Zap className="h-5 w-5" />, installs: 45200, stars: 4.7, version: '1.8.0', author: 'Zapier', installed: false, config: [{ label: 'API Key', placeholder: 'zap_...' }] },
  { id: 'openai', name: 'Custom OpenAI Plugin', description: 'Extend with custom OpenAI tool calls, function schemas, and fine-tuned models.', category: 'ai', icon: <Bot className="h-5 w-5" />, installs: 19500, stars: 4.6, version: '0.9.5', author: 'Community', installed: false, config: [{ label: 'OpenAI API Key', placeholder: 'sk-...' }, { label: 'Custom Model ID', placeholder: 'gpt-4o' }] },
  { id: 'figma', name: 'Figma Plugin', description: 'Export AI-generated diagrams and wireframes directly to your Figma workspace.', category: 'development', icon: <Globe className="h-5 w-5" />, installs: 22600, stars: 4.4, version: '1.1.0', author: 'Figma', installed: false },
  { id: 'datadog', name: 'Datadog Monitoring', description: 'Monitor AI usage, query latency, error rates, and performance metrics in Datadog.', category: 'analytics', icon: <Shield className="h-5 w-5" />, installs: 16800, stars: 4.3, version: '0.8.2', author: 'Datadog', installed: false, config: [{ label: 'API Key', placeholder: 'dd_api_...' }] },
  { id: 'linear', name: 'Linear Issues', description: 'Create Linear issues from code reviews, AI insights, and project analysis.', category: 'productivity', icon: <Package className="h-5 w-5" />, installs: 14200, stars: 4.5, version: '1.0.0', author: 'Linear', installed: false, config: [{ label: 'API Key', placeholder: 'lin_...' }] },
]

const CATEGORIES = ['all', 'development', 'productivity', 'communication', 'analytics', 'ai'] as const
type Category = typeof CATEGORIES[number]

const CATEGORY_LABELS: Record<Category, string> = {
  all: 'All', development: '⚙️ Dev', productivity: '📋 Productivity',
  communication: '💬 Comms', analytics: '📊 Analytics', ai: '🤖 AI',
}

function formatInstalls(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString()
}

export default function PluginHub() {
  const [plugins, setPlugins] = useState(PLUGINS)
  const [filter, setFilter] = useState<Category>('all')
  const [search, setSearch] = useState('')
  const [configPlugin, setConfigPlugin] = useState<Plugin | null>(null)
  const [configValues, setConfigValues] = useState<Record<string, string>>({})

  const toggleInstall = (id: string) => {
    setPlugins((prev) => prev.map((p) => p.id === id ? { ...p, installed: !p.installed } : p))
  }

  const filtered = plugins.filter((p) => {
    const matchCat = filter === 'all' || p.category === filter
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const featured = filtered.filter((p) => p.featured)
  const rest = filtered.filter((p) => !p.featured)
  const installed = plugins.filter((p) => p.installed).length

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-5xl p-4 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Puzzle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Plugin Hub</h1>
            <p className="text-sm text-muted-foreground">Extend your AI workspace with {plugins.length} integrations</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="secondary" className="gap-1"><Check className="h-3 w-3" />{installed} installed</Badge>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search plugins..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setFilter(cat)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${filter === cat ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Featured */}
        {featured.length > 0 && (
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><Star className="h-3.5 w-3.5" />Featured</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((plugin) => <PluginCard key={plugin.id} plugin={plugin} onToggle={toggleInstall} onConfig={() => { setConfigPlugin(plugin); setConfigValues({}) }} />)}
            </div>
          </div>
        )}

        {/* All plugins */}
        {rest.length > 0 && (
          <div>
            {featured.length > 0 && <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">All Plugins</p>}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((plugin) => <PluginCard key={plugin.id} plugin={plugin} onToggle={toggleInstall} onConfig={() => { setConfigPlugin(plugin); setConfigValues({}) }} />)}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
            No plugins found. Try a different search or category.
          </div>
        )}
      </div>

      {/* Config dialog */}
      <Dialog open={!!configPlugin} onOpenChange={() => setConfigPlugin(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">{configPlugin?.icon} Configure {configPlugin?.name}</DialogTitle>
            <DialogDescription>Set up your integration credentials and preferences.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {configPlugin?.config?.map((field) => (
              <div key={field.label}>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{field.label}</label>
                <Input placeholder={field.placeholder} value={configValues[field.label] ?? ''} onChange={(e) => setConfigValues((p) => ({ ...p, [field.label]: e.target.value }))} />
              </div>
            )) ?? <p className="text-sm text-muted-foreground">This plugin has no configurable settings.</p>}
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => setConfigPlugin(null)}>Save Configuration</Button>
              <Button variant="outline" onClick={() => setConfigPlugin(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PluginCard({ plugin, onToggle, onConfig }: { plugin: Plugin; onToggle: (id: string) => void; onConfig: () => void }) {
  return (
    <Card className={`border shadow-retool-sm transition-all ${plugin.installed ? 'border-primary/30 bg-primary/5' : 'border-border hover:border-primary/20'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${plugin.installed ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
            {plugin.icon}
          </div>
          {plugin.installed && <Badge className="text-[10px] bg-green-500/15 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"><Check className="h-2.5 w-2.5 mr-0.5" />Installed</Badge>}
        </div>
        <CardTitle className="text-sm">{plugin.name}</CardTitle>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{plugin.stars}
          <span>·</span>
          <Download className="h-3 w-3" />{formatInstalls(plugin.installs)}
          <span>·</span>
          <span>v{plugin.version}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{plugin.description}</p>
        <div className="flex gap-1.5">
          <Button size="sm" variant={plugin.installed ? 'outline' : 'default'} className="flex-1 gap-1.5 h-8 text-xs"
            onClick={() => onToggle(plugin.id)}>
            {plugin.installed ? (<><Check className="h-3 w-3" />Installed</>) : (<><Download className="h-3 w-3" />Install</>)}
          </Button>
          {plugin.config && plugin.installed && (
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={onConfig}><Settings2 className="h-3.5 w-3.5" /></Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
