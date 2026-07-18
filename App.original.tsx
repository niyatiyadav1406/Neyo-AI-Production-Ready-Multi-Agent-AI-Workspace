export default function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>🚀 AI Tutor Dashboard</h1>
      <p style={{ color: '#666' }}>Frontend is running successfully!</p>
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h2 style={{ marginTop: 0 }}>Setup Status</h2>
        <ul style={{ lineHeight: 1.8 }}>
          <li>✅ Vite dev server running</li>
          <li>✅ React app initialized</li>
          <li>✅ React Router configured</li>
          <li>⏳ UI components being prepared</li>
        </ul>
      </div>
    </div>
  )
}

// ─── Types ─────────────────────────────────────────────────────────────────

type SessionData = LoginPayload & { role: Role }

// ─── Loading fallback ──────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

// ─── Route tracker (logs navigation) ──────────────────────────────────────

function RouteLogger() {
  const location = useLocation()
  useEffect(() => {
    logger.info('Page navigation', { path: location.pathname })
  }, [location.pathname])
  return null
}

// ─── Login route ───────────────────────────────────────────────────────────

type LoginRouteProps = {
  session: SessionData | null
  onLogin: (payload: LoginPayload) => void
}

function LoginRoute({ session, onLogin }: LoginRouteProps) {
  const navigate = useNavigate()
  if (session) return <Navigate to="/assistant" replace />

  const handleLogin = async (payload: LoginPayload) => {
    onLogin(payload)
    navigate('/assistant', { replace: true })
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed right-4 top-4 z-30 sm:right-6 sm:top-6">
        <div className="pointer-events-auto"><ThemeToggle showLabel size="default" /></div>
      </div>
      <LoginPage onSubmit={handleLogin} />
    </div>
  )
}

// ─── Authenticated layout ──────────────────────────────────────────────────

type AssistantLayoutProps = {
  session: SessionData | null
  onLogout: () => void
}

function AssistantLayout({ session, onLogout }: AssistantLayoutProps) {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!session) return <Navigate to="/" replace />

  const handleLogout = () => {
    logger.info('User logged out', { email: session.email })
    onLogout()
    navigate('/', { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} role={session.role} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-14 shrink-0 items-center border-b border-border bg-card px-4 gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold">Neyo</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* User info + role */}
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary">
                <User2 className="h-3.5 w-3.5 text-secondary-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium leading-none">{session.name}</p>
                  <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${roleBadgeClass(session.role)}`}>
                    {roleLabel(session.role)}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">{session.email}</p>
              </div>
            </div>

            <ThemeToggle size="sm" />

            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 min-h-0 overflow-hidden">
          <RouteLogger />
          <Routes>
            <Route path="/" element={
              <ErrorBoundary label="AI Chat">
                <Suspense fallback={<PageLoader />}>
                  <div className="h-full overflow-y-auto"><AssistantWorkspace /></div>
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/canvas" element={
              <ErrorBoundary label="Canvas">
                <Suspense fallback={<PageLoader />}>
                  <DiagramCanvas />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/tutor" element={
              <ErrorBoundary label="AI Tutor">
                <Suspense fallback={<PageLoader />}>
                  <div className="h-full overflow-y-auto"><AITutor /></div>
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/os" element={
              <ErrorBoundary label="Personal OS">
                <Suspense fallback={<PageLoader />}>
                  <PersonalOS />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/agents" element={
              <ErrorBoundary label="Multi-Agent">
                <Suspense fallback={<PageLoader />}>
                  <div className="h-full overflow-y-auto"><MultiAgent /></div>
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/explain" element={
              <ErrorBoundary label="Explainability">
                <Suspense fallback={<PageLoader />}>
                  <ExplainMode />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/collab" element={
              <ErrorBoundary label="Live Collab">
                <Suspense fallback={<PageLoader />}>
                  <LiveCollab />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/learn" element={
              <ErrorBoundary label="Learning Path">
                <Suspense fallback={<PageLoader />}>
                  <div className="h-full overflow-y-auto"><LearningPath /></div>
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/plugins" element={
              <ErrorBoundary label="Plugin Hub">
                <Suspense fallback={<PageLoader />}>
                  <div className="h-full overflow-y-auto"><PluginHub /></div>
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/monitoring" element={
              <ErrorBoundary label="Monitoring">
                <Suspense fallback={<PageLoader />}>
                  <MonitoringDashboard />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/api-docs" element={
              <ErrorBoundary label="API Docs">
                <Suspense fallback={<PageLoader />}>
                  <ApiDocs />
                </Suspense>
              </ErrorBoundary>
            } />
          </Routes>
        </main>
      </div>
    </div>
  )
}

// ─── Root ──────────────────────────────────────────────────────────────────

export default function App() {
  const [session, setSession] = useState<SessionData | null>(null)

  const handleLogin = (payload: LoginPayload) => {
    const role = getRoleFromEmail(payload.email)
    logger.info('User logged in', { email: payload.email, role })
    setSession({ ...payload, role })
  }

  return (
    <Routes>
      <Route path="/" element={<LoginRoute session={session} onLogin={handleLogin} />} />
      <Route
        path="/assistant/*"
        element={<AssistantLayout session={session} onLogout={() => setSession(null)} />}
      />
      <Route path="*" element={<Navigate to={session ? '/assistant' : '/'} replace />} />
    </Routes>
  )
}
