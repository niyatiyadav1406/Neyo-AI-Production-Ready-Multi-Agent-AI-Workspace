import { useEffect, useState } from 'react'
import {
  Calendar, Check, CheckSquare, ChevronLeft, ChevronRight,
  Droplets, FileText, Flame, Moon, Plus, Star, Trash2, X,
} from 'lucide-react'
import { Badge } from '../lib/shadcn/badge'
import { Button } from '../lib/shadcn/button'
import { Card, CardContent, CardHeader, CardTitle } from '../lib/shadcn/card'
import { Input } from '../lib/shadcn/input'
import { Progress } from '../lib/shadcn/progress'
import { Textarea } from '../lib/shadcn/textarea'

type Task = { id: string; text: string; done: boolean; priority: 'low' | 'medium' | 'high' }
type Note = { id: string; title: string; body: string; ts: number }
type HabitDay = { water: boolean; exercise: boolean; sleep: boolean; focus: boolean }

const STORAGE_TASKS = 'pos_tasks'
const STORAGE_NOTES = 'pos_notes'
const STORAGE_HABITS = 'pos_habits'

function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback } catch { return fallback }
}
function save(key: string, val: unknown) { try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* ignore */ } }

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']

function MiniCalendar() {
  const [cur, setCur] = useState(new Date())
  const today = new Date()
  const year = cur.getFullYear(), month = cur.getMonth()
  const first = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => setCur(new Date(year, month - 1))} className="rounded p-1 hover:bg-accent"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-sm font-semibold">{MONTHS[month]} {year}</span>
        <button onClick={() => setCur(new Date(year, month + 1))} className="rounded p-1 hover:bg-accent"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {DAYS.map((d) => <div key={d} className="text-center text-[10px] font-medium text-muted-foreground">{d}</div>)}
        {Array.from({ length: first }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          return (
            <button key={day} className={`flex h-7 w-full items-center justify-center rounded text-xs transition-colors hover:bg-accent ${isToday ? 'bg-primary text-primary-foreground font-bold hover:bg-primary/90' : 'text-foreground'}`}>
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function PersonalOS() {
  const [tasks, setTasks] = useState<Task[]>(() => load(STORAGE_TASKS, []))
  const [notes, setNotes] = useState<Note[]>(() => load(STORAGE_NOTES, []))
  const [habits, setHabits] = useState<HabitDay>(() => load(STORAGE_HABITS, { water: false, exercise: false, sleep: false, focus: false }))
  const [newTask, setNewTask] = useState('')
  const [taskPriority, setTaskPriority] = useState<Task['priority']>('medium')
  const [editNote, setEditNote] = useState<Note | null>(null)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes' | 'calendar' | 'health'>('tasks')

  useEffect(() => { save(STORAGE_TASKS, tasks) }, [tasks])
  useEffect(() => { save(STORAGE_NOTES, notes) }, [notes])
  useEffect(() => { save(STORAGE_HABITS, habits) }, [habits])

  const addTask = () => {
    if (!newTask.trim()) return
    setTasks((p) => [...p, { id: Date.now().toString(), text: newTask.trim(), done: false, priority: taskPriority }])
    setNewTask('')
  }

  const saveNote = () => {
    if (!noteTitle.trim()) return
    if (editNote) {
      setNotes((p) => p.map((n) => n.id === editNote.id ? { ...n, title: noteTitle, body: noteBody, ts: Date.now() } : n))
    } else {
      setNotes((p) => [...p, { id: Date.now().toString(), title: noteTitle, body: noteBody, ts: Date.now() }])
    }
    setEditNote(null); setNoteTitle(''); setNoteBody('')
  }

  const PRIORITY_COLORS: Record<Task['priority'], string> = {
    high: 'text-red-500', medium: 'text-amber-500', low: 'text-green-500',
  }

  const done = tasks.filter((t) => t.done).length
  const habitsDone = Object.values(habits).filter(Boolean).length

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Tab bar */}
      <div className="flex border-b border-border bg-card px-4">
        {([['tasks', CheckSquare, 'Tasks'], ['notes', FileText, 'Notes'], ['calendar', Calendar, 'Calendar'], ['health', Flame, 'Health']] as [typeof activeTab, React.ElementType, string][]).map(([tab, Icon, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* TASKS */}
        {activeTab === 'tasks' && (
          <div className="mx-auto max-w-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Tasks</h2>
              <Badge variant="secondary">{done}/{tasks.length} done</Badge>
            </div>
            {tasks.length > 0 && <Progress value={tasks.length ? (done / tasks.length) * 100 : 0} className="h-1.5" />}

            <div className="flex gap-2">
              <Input value={newTask} onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add a task..." onKeyDown={(e) => e.key === 'Enter' && addTask()} className="flex-1" />
              <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value as Task['priority'])}
                className="rounded-md border border-input bg-background px-2 text-sm">
                <option value="high">High</option>
                <option value="medium">Med</option>
                <option value="low">Low</option>
              </select>
              <Button onClick={addTask} size="icon"><Plus className="h-4 w-4" /></Button>
            </div>

            {tasks.length === 0 && <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">No tasks yet. Add one above!</div>}

            <div className="space-y-2">
              {['high', 'medium', 'low'].map((p) => {
                const pTasks = tasks.filter((t) => t.priority === p)
                if (!pTasks.length) return null
                return (
                  <div key={p}>
                    <p className={`mb-1.5 text-xs font-semibold uppercase tracking-wider ${PRIORITY_COLORS[p as Task['priority']]}`}>{p} priority</p>
                    {pTasks.map((task) => (
                      <div key={task.id} className={`mb-1.5 flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-all ${task.done ? 'opacity-50' : ''}`}>
                        <button onClick={() => setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, done: !t.done } : t))}
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${task.done ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>
                          {task.done && <Check className="h-3 w-3" />}
                        </button>
                        <span className={`flex-1 text-sm ${task.done ? 'line-through text-muted-foreground' : ''}`}>{task.text}</span>
                        <button onClick={() => setTasks((p) => p.filter((t) => t.id !== task.id))} className="rounded p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* NOTES */}
        {activeTab === 'notes' && (
          <div className="mx-auto max-w-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Notes</h2>
              <Button size="sm" className="gap-1.5" onClick={() => { setEditNote(null); setNoteTitle(''); setNoteBody('') }}>
                <Plus className="h-3.5 w-3.5" />New Note
              </Button>
            </div>

            {(editNote !== null || (noteTitle === '' && noteBody === '' && !notes.length)) && (
              <Card className="border-primary/30 shadow-retool-sm">
                <CardContent className="pt-4 space-y-3">
                  <Input placeholder="Note title..." value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} />
                  <Textarea placeholder="Write your note..." value={noteBody} onChange={(e) => setNoteBody(e.target.value)} rows={4} />
                  <div className="flex gap-2">
                    <Button onClick={saveNote} disabled={!noteTitle.trim()} className="flex-1">Save</Button>
                    <Button variant="outline" onClick={() => { setNoteTitle(''); setNoteBody(''); setEditNote(null) }}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {noteTitle !== '' && !editNote && (
              <Card className="border-primary/30 shadow-retool-sm">
                <CardContent className="pt-4 space-y-3">
                  <Input placeholder="Note title..." value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} />
                  <Textarea placeholder="Write your note..." value={noteBody} onChange={(e) => setNoteBody(e.target.value)} rows={4} />
                  <div className="flex gap-2">
                    <Button onClick={saveNote} disabled={!noteTitle.trim()} className="flex-1">Save</Button>
                    <Button variant="outline" onClick={() => { setNoteTitle(''); setNoteBody('') }}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {notes.length === 0 && noteTitle === '' && <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">No notes yet. Click "New Note" to start writing.</div>}

            <div className="grid gap-3 sm:grid-cols-2">
              {notes.map((note) => (
                <Card key={note.id} className="border-border shadow-retool-sm hover:border-primary/30 cursor-pointer transition-all"
                  onClick={() => { setEditNote(note); setNoteTitle(note.title); setNoteBody(note.body) }}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm">{note.title}</CardTitle>
                      <button onClick={(e) => { e.stopPropagation(); setNotes((p) => p.filter((n) => n.id !== note.id)) }}
                        className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  </CardHeader>
                  {note.body && <CardContent><p className="line-clamp-3 text-xs text-muted-foreground">{note.body}</p></CardContent>}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* CALENDAR */}
        {activeTab === 'calendar' && (
          <div className="mx-auto max-w-sm">
            <Card className="border-border shadow-retool-sm">
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-primary" />Calendar</CardTitle></CardHeader>
              <CardContent><MiniCalendar /></CardContent>
            </Card>
            <Card className="mt-4 border-border shadow-retool-sm">
              <CardHeader><CardTitle className="text-sm">Upcoming</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {[{date: 'Today', label: 'Team standup', time: '10:00 AM'}, {date: 'Tomorrow', label: 'Code review session', time: '2:00 PM'}, {date: 'In 3 days', label: 'Project deadline', time: 'All day'}].map((ev) => (
                  <div key={ev.label} className="flex items-center gap-3 rounded-lg border border-border bg-card/50 px-3 py-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">{ev.date.slice(0, 2).toUpperCase()}</div>
                    <div><p className="text-sm font-medium">{ev.label}</p><p className="text-xs text-muted-foreground">{ev.date} · {ev.time}</p></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* HEALTH */}
        {activeTab === 'health' && (
          <div className="mx-auto max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Daily Habits</h2>
              <Badge variant="secondary">{habitsDone}/4 completed</Badge>
            </div>
            <Progress value={(habitsDone / 4) * 100} className="h-2" />

            {([
              ['water', Droplets, 'Drink 8 glasses of water', 'Hydration goal', 'text-blue-500'],
              ['exercise', Flame, '30 min of exercise', 'Physical health', 'text-orange-500'],
              ['sleep', Moon, '8 hours of sleep', 'Rest & recovery', 'text-purple-500'],
              ['focus', Star, '2 hours of deep focus', 'Productivity', 'text-amber-500'],
            ] as [keyof HabitDay, React.ElementType, string, string, string][]).map(([key, Icon, label, desc, color]) => (
              <button key={key} onClick={() => setHabits((p) => ({ ...p, [key]: !p[key] }))}
                className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${habits[key] ? 'border-primary/30 bg-primary/5' : 'border-border bg-card hover:border-primary/20 hover:bg-accent/50'}`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${habits[key] ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                  <Icon className={`h-5 w-5 ${habits[key] ? '' : color}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${habits[key] ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>
                  {habits[key] && <Check className="h-3.5 w-3.5" />}
                </div>
              </button>
            ))}

            {habitsDone === 4 && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-950/20">
                <p className="font-semibold text-green-700 dark:text-green-400">🎉 All habits completed today!</p>
                <p className="mt-1 text-sm text-green-600 dark:text-green-500">Keep it up for a healthy lifestyle.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
