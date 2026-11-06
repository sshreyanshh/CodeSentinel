import type { AnalysisReport } from '../types/api'
import { deriveVerdict } from '../lib/verdict'

interface VerdictCardProps {
  report: AnalysisReport | null
  isAnalyzing: boolean
}

export function VerdictCard({
  report,
  isAnalyzing,
}: VerdictCardProps) {
  const containerClasses =
    'rounded-[var(--color-radius)] border border-border bg-card p-4 text-card-foreground shadow-sm'

  const verdict = report ? deriveVerdict(report) : null
  const isValid = verdict?.status === 'valid'
  const metrics = [
    { label: 'Tokens', value: verdict?.summary.tokens ?? '-' },
    { label: 'Lexical', value: verdict?.summary.lexicalErrors ?? '-' },
    { label: 'Syntax', value: verdict?.summary.syntaxErrors ?? '-' },
    { label: 'Security', value: verdict?.summary.securityFindings ?? '-' },
  ]

  return (
    <section
      className={containerClasses}
      aria-live="polite"
      aria-busy={isAnalyzing}
    >
      <div className="flex flex-wrap items-center gap-2">
        {verdict ? (
          <span
            className={
              isValid
                ? 'rounded-full border border-primary/40 bg-primary/20 px-3 py-1 text-sm font-medium text-primary'
                : 'rounded-full border border-destructive/40 bg-destructive/20 px-3 py-1 text-sm font-medium text-destructive'
            }
          >
            {isValid ? 'Valid Mini-C++' : verdict.title}
          </span>
        ) : (
          <p className="text-sm text-muted-foreground">
            Ready to analyze. Press Ctrl+Enter or click Analyze.
          </p>
        )}
        {verdict && verdict.securityCount > 0 && (
          <span className="rounded-full border border-accent bg-accent/30 px-3 py-1 text-sm font-medium text-accent-foreground">
            {verdict.securityCount} security warnings
          </span>
        )}
      </div>

      {verdict?.note && (
        <p className="mt-3 text-sm text-muted-foreground">{verdict.note}</p>
      )}

      {verdict && verdict.securityCount > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          {verdict.disclaimer}
        </p>
      )}

      <dl className="mt-4 flex flex-wrap gap-2">
        {metrics.map(({ label, value }) => (
          <div
            key={label}
            className="flex min-w-24 items-center justify-between gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs"
          >
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-3 text-right font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
