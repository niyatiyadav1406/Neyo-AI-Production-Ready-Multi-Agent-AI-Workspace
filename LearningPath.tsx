import { useEffect, useState } from 'react'
import {
  Award, BookOpen, ChevronRight, Flame, Lock,
  RefreshCw, Star, Target, TrendingUp, Trophy, Zap,
} from 'lucide-react'
import { Badge } from '../lib/shadcn/badge'
import { Button } from '../lib/shadcn/button'
import { Card, CardContent, CardHeader, CardTitle } from '../lib/shadcn/card'
import { Progress } from '../lib/shadcn/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../lib/shadcn/select'

type SkillLevel = 'locked' | 'available' | 'in_progress' | 'completed'

type Skill = {
  id: string
  label: string
  xp: number
  requires: string[]
  level: SkillLevel
  category: 'foundation' | 'core' | 'advanced' | 'expert'
}

type Track = { id: string; label: string; icon: string; color: string; skills: Skill[] }

const TRACKS: Record<string, Track> = {
  python: {
    id: 'python', label: 'Python', icon: '🐍', color: 'text-yellow-600 dark:text-yellow-400',
    skills: [
      { id: 'py-syntax', label: 'Syntax & Variables', xp: 50, requires: [], level: 'completed', category: 'foundation' },
      { id: 'py-control', label: 'Control Flow', xp: 75, requires: ['py-syntax'], level: 'completed', category: 'foundation' },
      { id: 'py-funcs', label: 'Functions', xp: 100, requires: ['py-control'], level: 'in_progress', category: 'core' },
      { id: 'py-oop', label: 'Classes & OOP', xp: 150, requires: ['py-funcs'], level: 'available', category: 'core' },
      { id: 'py-modules', label: 'Modules & Packages', xp: 120, requires: ['py-funcs'], level: 'available', category: 'core' },
      { id: 'py-errors', label: 'Error Handling', xp: 100, requires: ['py-funcs'], level: 'locked', category: 'core' },
      { id: 'py-gen', label: 'Generators & Decorators', xp: 200, requires: ['py-oop', 'py-modules'], level: 'locked', category: 'advanced' },
      { id: 'py-async', label: 'Async & Await', xp: 250, requires: ['py-gen'], level: 'locked', category: 'advanced' },
      { id: 'py-meta', label: 'Metaclasses', xp: 350, requires: ['py-async'], level: 'locked', category: 'expert' },
    ],
  },
  react: {
    id: 'react', label: 'React', icon: '⚛️', color: 'text-blue-600 dark:text-blue-400',
    skills: [
      { id: 'rx-jsx', label: 'JSX & Components', xp: 50, requires: [], level: 'completed', category: 'foundation' },
      { id: 'rx-props', label: 'Props & State', xp: 75, requires: ['rx-jsx'], level: 'completed', category: 'foundation' },
      { id: 'rx-hooks', label: 'React Hooks', xp: 150, requires: ['rx-props'], level: 'in_progress', category: 'core' },
      { id: 'rx-effects', label: 'useEffect & Lifecycle', xp: 150, requires: ['rx-hooks'], level: 'available', category: 'core' },
      { id: 'rx-context', label: 'Context & State Mgmt', xp: 200, requires: ['rx-effects'], level: 'locked', category: 'advanced' },
      { id: 'rx-perf', label: 'Performance & Memoization', xp: 250, requires: ['rx-context'], level: 'locked', category: 'advanced' },
      { id: 'rx-patterns', label: 'Advanced Patterns', xp: 350, requires: ['rx-perf'], level: 'locked', category: 'expert' },
    ],
  },
  sql: {
    id: 'sql', label: 'SQL', icon: '🗄️', color: 'text-green-600 dark:text-green-400',
    skills: [
      { id: 'sql-select', label: 'SELECT & WHERE', xp: 50, requires: [], level: 'completed', category: 'foundation' },
      { id: 'sql-joins', label: 'JOINs', xp: 100, requires: ['sql-select'], level: 'in_progress', category: 'core' },
      { id: 'sql-agg', label: 'Aggregations & GROUP BY', xp: 100, requires: ['sql-select'], level: 'available', category: 'core' },
      { id: 'sql-subq', label: 'Subqueries & CTEs', xp: 150, requires: ['sql-joins', 'sql-agg'], level: 'locked', category: 'advanced' },
      { id: 'sql-index', label: 'Indexing & Performance', xp: 200, requires: ['sql-subq'], level: 'locked', category: 'advanced' },
      { id: 'sql-txn', label: 'Transactions & ACID', xp: 250, requires: ['sql-index'], level: 'locked', category: 'expert' },
    ],
  },
}

const EXERCISES: Record<string, string[]> = {
  'py-syntax': ['Declare 3 variables of different types', 'Write a program that prints "Hello World"', 'Create a list and access its elements'],
  'py-control': ['Write an if-else chain for age groups', 'Use a for loop to sum numbers 1-100', 'Implement FizzBuzz'],
  'py-funcs': ['Write a function that reverses a string', 'Create a recursive factorial function', 'Build a higher-order function'],
  'rx-jsx': ['Create a Hello World component', 'Render a list of items with JSX', 'Use conditional rendering'],
  'rx-hooks': ['Build a counter with useState', 'Fetch data using a custom hook', 'Implement a useLocalStorage hook'],
  'sql-joins': ['Write an INNER JOIN between two tables', 'Use LEFT JOIN to include nulls', 'Self-join a hierarchy table'],
}

const LEVEL_COLORS: Record<SkillLevel, string> = {
  locked: 'bg-secondary text-secondary-foreground border-border opacity-50',
  available: 'bg-card border-primary/30 text-foreground hover:border-primary cursor-pointer',
  in_progress: 'bg-primary/10 border-primary/50 text-primary cursor-pointer',
  completed: 'bg-primary border-primary text-primary-foreground',
}

const CATEGORY_ROW: Record<Skill['category'], number> = { foundation: 0, core: 1, advanced: 2, expert: 3 }

export default function LearningPath() {
  const [track, setTrack] = useState<string>('python')
  const [skills, setSkills] = useState<Skill[]>([])
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null)
  const [streak] = useState(7)
  const STORAGE_KEY = `learning_${track}`

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try { setSkills(JSON.parse(saved) as Skill[]) } catch { setSkills(TRACKS[track]?.skills ?? []) }
    } else {
      setSkills(TRACKS[track]?.skills ?? [])
    }
    setActiveSkill(null)
  }, [track, STORAGE_KEY])

  const save = (updated: Skill[]) => {
    setSkills(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const totalXP = skills.filter((s) => s.level === 'completed').reduce((sum, s) => sum + s.xp, 0)
  const maxXP = skills.reduce((sum, s) => sum + s.xp, 0)
  const completed = skills.filter((s) => s.level === 'completed').length

  const markDone = (id: string) => {
    const updated = skills.map((s) => {
      if (s.id === id) return { ...s, level: 'completed' as SkillLevel }
      // Unlock dependents
      if (s.requires.includes(id) && s.level === 'locked') {
        const allDeps = s.requires.every((req) => {
          const dep = skills.find((sk) => sk.id === req)
          return dep?.level === 'completed' || dep?.id === id
        })
        if (allDeps) return { ...s, level: 'available' as SkillLevel }
      }
      return s
    })
    save(updated)
    setActiveSkill(null)
  }

  const currentTrack = TRACKS[track]!
  const byCategory = Object.entries(CATEGORY_ROW).map(([cat]) =>
    skills.filter((s) => s.category === cat as Skill['category'])
  )

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-4xl p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Learning Path</h1>
            <p className="text-sm text-muted-foreground">Track skills, earn XP, and progress through levels</p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Badge className="gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
              <Flame className="h-3 w-3" />{streak} day streak
            </Badge>
            <Badge variant="secondary" className="gap-1"><Zap className="h-3 w-3" />{totalXP} XP</Badge>
          </div>
        </div>

        {/* Track selector + stats */}
        <div className="flex flex-wrap gap-3">
          <Select value={track} onValueChange={setTrack}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.values(TRACKS).map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.icon} {t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Card className="flex-1 min-w-48 border-border shadow-retool-sm">
            <CardContent className="flex items-center gap-3 pt-3 pb-3">
              <Trophy className="h-4 w-4 text-amber-500" />
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1"><span className="font-medium">{completed}/{skills.length} skills</span><span className="text-muted-foreground">{Math.round((totalXP/maxXP)*100)||0}%</span></div>
                <Progress value={maxXP ? (totalXP / maxXP) * 100 : 0} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skill tree */}
        <Card className="border-border shadow-retool-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <span>{currentTrack.icon}</span> {currentTrack.label} Skill Tree
              <Badge variant="outline" className="ml-auto text-[10px]">Click to study</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {byCategory.map((catSkills, rowIdx) => {
              const catLabel = ['Foundation', 'Core', 'Advanced', 'Expert'][rowIdx]!
              if (!catSkills.length) return null
              return (
                <div key={rowIdx}>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{catLabel}</p>
                  <div className="flex flex-wrap gap-2">
                    {catSkills.map((skill) => (
                      <button key={skill.id} disabled={skill.level === 'locked'}
                        onClick={() => setActiveSkill(skill.id === activeSkill?.id ? null : skill)}
                        className={`group relative flex flex-col items-center gap-1.5 rounded-xl border px-4 py-3 text-center transition-all ${LEVEL_COLORS[skill.level]} ${activeSkill?.id === skill.id ? 'ring-2 ring-primary' : ''}`}
                        style={{ minWidth: 100 }}>
                        {skill.level === 'locked' && <Lock className="absolute right-2 top-2 h-3 w-3 opacity-40" />}
                        {skill.level === 'completed' && <Star className="absolute right-2 top-2 h-3 w-3" />}
                        <span className="text-sm font-medium leading-tight">{skill.label}</span>
                        <Badge variant="outline" className={`text-[9px] ${skill.level === 'completed' ? 'border-white/30 text-white/80' : ''}`}>
                          {skill.xp} XP
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Active skill panel */}
        {activeSkill && (
          <Card className="border-primary/30 bg-primary/5 shadow-retool-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />{activeSkill.label}
                  <Badge className={activeSkill.level === 'in_progress' ? 'bg-primary/20 text-primary' : 'bg-green-500/20 text-green-600 dark:text-green-400'} variant="outline">
                    {activeSkill.level.replace('_', ' ')}
                  </Badge>
                </CardTitle>
                <span className="text-xs text-muted-foreground">{activeSkill.xp} XP reward</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5"><Target className="h-3.5 w-3.5" />Practice Exercises</p>
                {(EXERCISES[activeSkill.id] ?? ['Explore this topic with examples', 'Read the documentation', 'Build a small project using this skill']).map((ex, i) => (
                  <div key={i} className="flex items-center gap-2.5 mb-2 text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{i + 1}</span>
                    <span className="text-foreground">{ex}</span>
                    <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                ))}
              </div>

              {activeSkill.level !== 'completed' && (
                <div className="flex gap-2">
                  <Button onClick={() => markDone(activeSkill.id)} className="flex-1 gap-2">
                    <Award className="h-4 w-4" />Mark as Completed (+{activeSkill.xp} XP)
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => setActiveSkill(null)}>
                    <RefreshCw className="h-4 w-4" />Later
                  </Button>
                </div>
              )}
              {activeSkill.level === 'completed' && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <Trophy className="h-4 w-4" />Skill completed! Well done.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
