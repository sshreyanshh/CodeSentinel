import type { AnalysisReport } from '../types/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

function isAnalysisReport(value: unknown): value is AnalysisReport {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const report = value as Record<string, unknown>
  const lexical = report.lexical
  const syntax = report.syntax
  const security = report.security

  return (
    Array.isArray(report.tokens) &&
    typeof lexical === 'object' &&
    lexical !== null &&
    Array.isArray((lexical as Record<string, unknown>).errors) &&
    typeof syntax === 'object' &&
    syntax !== null &&
    ['ok', 'errors'].includes(
      String((syntax as Record<string, unknown>).status),
    ) &&
    Array.isArray((syntax as Record<string, unknown>).errors) &&
    typeof security === 'object' &&
    security !== null &&
    Array.isArray((security as Record<string, unknown>).findings)
  )
}

export async function analyze(code: string): Promise<AnalysisReport> {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  })

  if (!response.ok) {
    throw new Error(
      `Analysis request failed (${response.status} ${response.statusText}).`,
    )
  }

  const result: unknown = await response.json()
  if (!isAnalysisReport(result)) {
    throw new Error('Analysis response did not match the expected report shape.')
  }

  return result
}
