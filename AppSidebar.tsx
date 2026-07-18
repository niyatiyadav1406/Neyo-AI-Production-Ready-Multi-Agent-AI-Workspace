import { cn } from '../lib/shadcn/utils'
import {
  Activity,
  BookOpen,
  Bot,
  Brain,
  GitBranch,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Network,
  Pencil,
  Puzzle,
  Route,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import type { Role } from '../utils/rbac'
import { roleBadgeClass, roleLabel } from '../utils/rbac'

export type NavItem = {
  to: string
  icon: React.ReactNode
  label: string
  description: string
  badge?: string
  /** If set, only users with this role or higher can see the item. */
  minRole?: Role
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/assistant',
    icon: <MessageSquare className="h-4 w-4" />,
    label: 'AI Chat',
    description: 'Smart assistant & voice chat',
  },
  {
    to: '/assistant/canvas',
    icon: <Pencil className="h-4 w-4" />,
    label: 'Canvas',
    description: 'Diagrams, mind maps & UML',
  },
  {
    to: '/assistant/tutor',
    icon: <GraduationCap className="h-4 w-4" />,
    label: 'AI Tutor',
    description: 'Quizzes & study plans',
  },
  {
    to: '/assistant/os',
    icon: <LayoutDashboard className="h-4 w-4" />,
    label: 'Personal OS',
    description: 'Tasks, notes & calendar',
  },
  {
    to: '/assistant/agents',
    icon: <Network className="h-4 w-4" />,
    label: 'Multi-Agent',
    description: 'Collaborative AI pipeline',
  },
  {
    to: '/assistant/explain',
    icon: <Brain className="h-4 w-4" />,
    label: 'Explainability',
    description: 'Confidence & reasoning',
  },
  {
    to: '/assistant/collab',
    icon: <Users className="h-4 w-4" />,
    label: 'Live Collab',
    description: 'Multi-user AI sessions',
  },
  {
    to: '/assistant/learn',
    icon: <Route className="h-4 w-4" />,
    label: 'Learning Path',
    description: 'Track your skill progress',
  },
  {
    to: '/assistant/plugins',
    icon: <Puzzle className="h-4 w-4" />,
    label: 'Plugin Hub',
    description: 'GitHub, Discord & more',
  },
  // ── DevOps & docs ──────────────────────────────────────────────
  {
    to: '/assistant/monitoring',
    icon: <Activity className="h-4 w-4" />,
    label: 'Monitoring',
    description: 'Health, perf & log stream',
    badge: 'New',
    minRole: 'admin',
  },
  {
    to: '/assistant/api-docs',
    icon: <BookOpen className="h-4 w-4" />,
    label: 'API Docs',
    description: 'Backend function reference',
    badge: 'New',
  },
]

type AppSidebarProps = {
  isOpen: boolean
  onClose: () => void
  role?: Role
}

export default function AppSidebar({ isOpen, onClose, role = 'user' }: AppSidebarProps) {
  const location = useLocation()

  const ROLE_RANK: Record<Role, number> = { readonly: 0, user: 1, admin: 2 }
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.minRole) return true
    return ROLE_RANK[role] >= ROLE_RANK[item.minRole]
  })

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Neyo</p>
              <p className="text-[10px] text-muted-foreground">Your AI workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {visibleItems.map((item) => {
              const isActive = item.to === '/assistant'
                ? location.pathname === '/assistant'
                : location.pathname.startsWith(item.to)

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground group-hover:bg-accent',
                    )}
                  >
                    {item.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">{item.description}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4 space-y-2">
          {/* Role badge */}
          <div className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold', roleBadgeClass(role))}>
            <Bot className="h-3 w-3" />
            {roleLabel(role)}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{visibleItems.length} features</span>
            <GitBranch className="ml-auto h-3.5 w-3.5" />
            <span>v2.1</span>
          </div>
        </div>
      </aside>
    </>
  )
}
