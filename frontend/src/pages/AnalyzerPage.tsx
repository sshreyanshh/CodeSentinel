import type { editor as MonacoEditor } from 'monaco-editor'
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { analyze } from '../api/client'
import { EditorPane } from '../components/EditorPane'
import { ThemeToggle } from '../components/ThemeToggle'
import { VerdictCard } from '../components/VerdictCard'
import { useTheme } from '../hooks/useTheme'
import { createMonacoMarkers } from '../lib/markers'
import type { AnalysisReport } from '../types/api'

type ActiveTab = 'errors' | 'tokens' | 'tree' | 'automaton' | 'security'

const tabs: {
  id: ActiveTab
  label: string
  count?: (report: AnalysisReport | null) => number
}[] = [
  {
    id: 'errors',
    label: 'Errors',
    count: (report) =>
      report ? report.lexical.errors.length + report.syntax.errors.length : 0,
  },
  { id: 'tokens', label: 'Tokens', count: (report) => report?.tokens.length ?? 0 },
  { id: 'tree', label: 'Tree' },
  { id: 'automaton', label: 'Automaton' },
  {
    id: 'security',
    label: 'Security',
    count: (report) => report?.security.findings.length ?? 0,
  },
]

const initialCode = 'int main() {\n  return 0;\n}\n'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readPosition(value: unknown): { line: number; column: number } | null {
  if (!isRecord(value)) {
    return null
  }

  const line = value.line
  const column = value.column
  if (
    typeof line === 'number' &&
    typeof column === 'number' &&
    Number.isInteger(line) &&
    Number.isInteger(column) &&
    line > 0 &&
    column > 0
  ) {
    return { line, column }
  }

  return null
}

function getItemPosition(value: unknown): { line: number; column: number } | null {
  if (!isRecord(value)) {
    return null
  }

  const span = value.span
  if (isRecord(span)) {
    const fromSpan = readPosition(span.start)
    if (fromSpan) {
      return fromSpan
    }
  }

  return readPosition(value.start) ?? readPosition(value)
}

function getTabData(report: AnalysisReport, tab: ActiveTab): unknown {
  switch (tab) {
    case 'errors':
      return [...report.lexical.errors, ...report.syntax.errors]
    case 'tokens':
      return report.tokens
    case 'security':
      return report.security.findings
    case 'tree':
      return report.tree ?? report.parseTree ?? report.syntaxTree ?? null
    case 'automaton':
      return report.automaton ?? report.dfa ?? report.nfa ?? null
  }
}

function getItems(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value
  }
  return value === null || value === undefined ? [] : [value]
}

function itemLabel(value: unknown): string {
  if (isRecord(value) && typeof value.message === 'string') {
    return value.message
  }
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2)
}

function EmptyState({ tab, analyzed }: { tab: ActiveTab; analyzed: boolean }) {
  const message = analyzed
    ? `No ${tab} data available.`
    : `Analyze code to see ${tab} results.`

  return (
    <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
      <svg
        aria-hidden="true"
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-10 opacity-50"
      >
        {tab === 'errors' && (
          <>
            <path d="M24 7 43 40H5L24 7Z" />
            <path d="M24 18v10m0 6h.01" />
          </>
        )}
        {tab === 'tokens' && (
          <>
            <path d="M8 12h32M8 24h32M8 36h32" />
            <circle cx="4" cy="12" r="1" />
            <circle cx="4" cy="24" r="1" />
            <circle cx="4" cy="36" r="1" />
          </>
        )}
        {tab === 'tree' && (
          <>
            <rect x="19" y="5" width="10" height="8" rx="2" />
            <rect x="5" y="35" width="10" height="8" rx="2" />
            <rect x="33" y="35" width="10" height="8" rx="2" />
            <path d="M24 13v10M10 35v-8h28v8" />
          </>
        )}
        {tab === 'automaton' && (
          <>
            <circle cx="11" cy="24" r="6" />
            <circle cx="37" cy="24" r="6" />
            <path d="M17 24h14m-5-5 5 5-5 5" />
          </>
        )}
        {tab === 'security' && (
          <>
            <path d="M24 5 40 11v12c0 10-7 16-16 20C15 39 8 33 8 23V11l16-6Z" />
            <path d="m17 24 5 5 10-11" />
          </>
        )}
      </svg>
      <p className="text-sm">{message}</p>
    </div>
  )
}

export function AnalyzerPage() {
  const { theme, toggleTheme } = useTheme()
  const splitContainerRef = useRef<HTMLDivElement>(null)
  const [code, setCode] = useState(initialCode)
  const [report, setReport] = useState<AnalysisReport | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeHighlight, setActiveHighlight] = useState<{
    line: number
    column: number
  } | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('errors')
  const [requestError, setRequestError] = useState<string | null>(null)
  const [splitPercent, setSplitPercent] = useState(50)
  const [isDraggingSplit, setIsDraggingSplit] = useState(false)

  useEffect(() => {
    if (!isDraggingSplit) {
      return
    }

    const previousUserSelect = document.body.style.userSelect
    document.body.style.userSelect = 'none'

    const handleMouseMove = (event: globalThis.MouseEvent) => {
      const container = splitContainerRef.current
      if (!container) {
        return
      }

      const { left, width } = container.getBoundingClientRect()
      if (width > 0) {
        const nextPercent = ((event.clientX - left) / width) * 100
        setSplitPercent(Math.min(80, Math.max(20, nextPercent)))
      }
    }

    const handleMouseUp = () => setIsDraggingSplit(false)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.body.style.userSelect = previousUserSelect
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingSplit])

  const handleDividerMouseDown = (
    event: ReactMouseEvent<HTMLDivElement>,
  ) => {
    event.preventDefault()
    setIsDraggingSplit(true)
  }

  const handleCodeChange = (nextCode: string) => {
    setCode(nextCode)
    if (report) {
      setReport(null)
      setActiveHighlight(null)
    }
    setRequestError(null)
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setRequestError(null)
    try {
      setReport(await analyze(code))
      setActiveHighlight(null)
    } catch (error) {
      setReport(null)
      setRequestError(
        error instanceof Error ? error.message : 'Analysis request failed.',
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  const markers: MonacoEditor.IMarkerData[] = report
    ? createMonacoMarkers(report, (line) => code.split(/\r?\n/)[line - 1] ?? '')
    : []

  const tabData = report ? getTabData(report, activeTab) : null
  const items = getItems(tabData)
  const canJump = activeTab === 'errors' || activeTab === 'tokens' || activeTab === 'security'

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground transition-colors duration-200 ease-in-out">
      <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border px-4 transition-colors duration-200 ease-in-out">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="m-0 text-base font-bold tracking-tight text-foreground">
            CodeSentinel
          </h1>
          <span className="hidden rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground sm:inline-flex">
            Mini-C++ Analyzer
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            role="status"
            className={`hidden rounded-full border px-2 py-0.5 text-[10px] sm:inline-flex ${
              isAnalyzing
                ? 'border-accent bg-accent/20 text-accent-foreground'
                : 'border-primary/30 bg-primary/10 text-primary'
            }`}
          >
            {isAnalyzing ? 'Analyzing...' : 'Ready'}
          </span>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      <main
        ref={splitContainerRef}
        className={`flex min-h-0 flex-1 flex-col gap-3 overflow-auto bg-background p-4 text-foreground transition-colors duration-200 ease-in-out lg:flex-row lg:gap-0 lg:overflow-hidden ${
          isDraggingSplit ? 'select-none' : ''
        }`}
      >
        <div
          className="min-h-[24rem] min-w-0 lg:min-h-0 lg:w-[var(--left-pane-width)] lg:flex-none"
          style={
            {
              '--left-pane-width': `calc(${splitPercent}% - ${6 * splitPercent / 100}px)`,
            } as CSSProperties
          }
        >
          <EditorPane
            code={code}
            onChange={handleCodeChange}
            onAnalyze={() => void handleAnalyze()}
            isAnalyzing={isAnalyzing}
            markers={markers}
            activeHighlight={activeHighlight}
            theme={theme}
          />
        </div>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize editor and results panels"
          aria-valuemin={20}
          aria-valuemax={80}
          aria-valuenow={Math.round(splitPercent)}
          onMouseDown={handleDividerMouseDown}
          onDoubleClick={() => setSplitPercent(50)}
          className="group hidden w-1.5 shrink-0 cursor-col-resize items-center justify-center bg-border transition-colors hover:bg-primary/50 lg:flex"
        >
          <span className="h-10 w-0.5 rounded-full bg-muted-foreground/40 transition-colors group-hover:bg-primary" />
        </div>

        <div className="flex min-h-[24rem] min-w-0 flex-1 flex-col gap-4 lg:min-h-0">
          <VerdictCard report={report} isAnalyzing={isAnalyzing} />

          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--color-radius)] border border-border bg-card text-card-foreground shadow-sm transition-colors duration-200 ease-in-out">
            <div
              className="flex flex-wrap gap-1 border-b border-border p-2 transition-colors duration-200 ease-in-out"
              role="tablist"
              aria-label="Analysis results"
            >
              {tabs.map(({ id, label, count }) => {
                const badgeCount = count?.(report)
                const hasSecurityFindings =
                  id === 'security' && (badgeCount ?? 0) > 0

                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === id}
                    aria-controls={`panel-${id}`}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors duration-200 ease-in-out ${
                      activeTab === id
                        ? 'bg-primary/20 font-medium text-primary'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {label}
                    {badgeCount !== undefined && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                          hasSecurityFindings
                            ? 'bg-accent/30 text-accent-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {badgeCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <div
              id={`panel-${activeTab}`}
              role="tabpanel"
              className="min-h-0 flex-1 overflow-auto p-3"
            >
              {requestError ? (
                <div className="flex h-full min-h-48 items-center justify-center">
                  <p role="alert" className="text-center text-sm text-destructive">
                    {requestError}
                  </p>
                </div>
              ) : !report || items.length === 0 ? (
                <EmptyState tab={activeTab} analyzed={report !== null} />
              ) : (
                <ul className="space-y-2">
                  {items.map((item, index) => {
                    const position = canJump ? getItemPosition(item) : null
                    const label = itemLabel(item)

                    return (
                      <li key={`${activeTab}-${index}`}>
                        {position ? (
                          <button
                            type="button"
                            onClick={() => setActiveHighlight(position)}
                            className="w-full rounded-md border border-border bg-card/70 p-3 text-left transition-colors duration-200 ease-in-out hover:border-primary/40"
                          >
                            <span className="mb-1 block text-xs text-muted-foreground">
                              Line {position.line}, column {position.column}
                            </span>
                            <pre className="whitespace-pre-wrap break-words font-mono text-xs">
                              {label}
                            </pre>
                          </button>
                        ) : (
                          <pre className="overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-card/70 p-3 font-mono text-xs transition-colors duration-200 ease-in-out">
                            {label}
                          </pre>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
