import { describe, expect, it } from 'vitest'
import type { AnalysisReport, Diagnostic } from '../types/api'
import { deriveVerdict } from './verdict'

function createReport(overrides: Partial<AnalysisReport> = {}): AnalysisReport {
  return {
    tokens: [],
    lexical: { errors: [] },
    syntax: { status: 'ok', errors: [] },
    security: { findings: [] },
    ...overrides,
  }
}

function diagnostic(message: string): Diagnostic {
  return {
    message,
    span: {
      start: { line: 1, column: 1 },
      end: { line: 1, column: 2 },
    },
  }
}

describe('deriveVerdict', () => {
  it('returns an invalid lexical verdict when lexical errors exist', () => {
    const report = createReport({
      lexical: { errors: [diagnostic('unexpected character')] },
      syntax: { status: 'errors', errors: [diagnostic('unexpected token')] },
    })

    expect(deriveVerdict(report)).toEqual({
      status: 'invalid_lexical',
      title: 'Invalid: lexical errors',
      note: 'Parsing skipped because of lexical errors.',
      securityCount: 0,
      disclaimer: 'Warnings only. Not proof of malicious intent.',
      summary: {
        tokens: 0,
        lexicalErrors: 1,
        syntaxErrors: 1,
        securityFindings: 0,
      },
    })
  })

  it('returns an invalid syntax verdict when syntax errors exist', () => {
    const report = createReport({
      syntax: { status: 'errors', errors: [diagnostic('missing semicolon')] },
    })

    expect(deriveVerdict(report)).toEqual({
      status: 'invalid_syntax',
      title: 'Invalid: syntax errors',
      note: undefined,
      securityCount: 0,
      disclaimer: 'Warnings only. Not proof of malicious intent.',
      summary: {
        tokens: 0,
        lexicalErrors: 0,
        syntaxErrors: 1,
        securityFindings: 0,
      },
    })
  })

  it('returns a valid verdict when there are no lexical or syntax errors', () => {
    const report = createReport({
      tokens: ['int', 'main'],
    })

    expect(deriveVerdict(report)).toEqual({
      status: 'valid',
      title: 'Valid Mini-C++',
      note: undefined,
      securityCount: 0,
      disclaimer: 'Warnings only. Not proof of malicious intent.',
      summary: {
        tokens: 2,
        lexicalErrors: 0,
        syntaxErrors: 0,
        securityFindings: 0,
      },
    })
  })

  it('keeps valid code valid when security findings exist', () => {
    const report = createReport({
      tokens: ['int', 'main'],
      security: {
        findings: [
          diagnostic('suspicious call'),
          diagnostic('unsafe operation'),
        ],
      },
    })

    const verdict = deriveVerdict(report)

    expect(verdict.status).toBe('valid')
    expect(verdict.title).toBe('Valid Mini-C++')
    expect(verdict.securityCount).toBe(2)
    expect(verdict.summary.securityFindings).toBe(2)
    expect(verdict.disclaimer).toBe(
      'Warnings only. Not proof of malicious intent.',
    )
  })
})
