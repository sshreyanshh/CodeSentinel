import type { AnalysisReport } from '../types/api'

export type { AnalysisReport } from '../types/api'

export type Verdict = {
  status: 'invalid_lexical' | 'invalid_syntax' | 'valid'
  title: string
  note: string | undefined
  securityCount: number
  disclaimer: string
  summary: {
    tokens: number
    lexicalErrors: number
    syntaxErrors: number
    securityFindings: number
  }
}

export function deriveVerdict(report: AnalysisReport): Verdict {
  const securityCount = report.security.findings.length
  const summary = {
    tokens: report.tokens.length,
    lexicalErrors: report.lexical.errors.length,
    syntaxErrors: report.syntax.errors.length,
    securityFindings: securityCount,
  }

  if (summary.lexicalErrors > 0) {
    return {
      status: 'invalid_lexical',
      title: 'Invalid: lexical errors',
      note: 'Parsing skipped because of lexical errors.',
      securityCount,
      disclaimer: 'Warnings only. Not proof of malicious intent.',
      summary,
    }
  }

  if (report.syntax.status === 'errors') {
    return {
      status: 'invalid_syntax',
      title: 'Invalid: syntax errors',
      note: undefined,
      securityCount,
      disclaimer: 'Warnings only. Not proof of malicious intent.',
      summary,
    }
  }

  return {
    status: 'valid',
    title: 'Valid Mini-C++',
    note: undefined,
    securityCount,
    disclaimer: 'Warnings only. Not proof of malicious intent.',
    summary,
  }
}
