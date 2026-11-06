// @vitest-environment jsdom

import * as monaco from 'monaco-editor'
import { describe, expect, it, vi } from 'vitest'
import type { AnalysisReport } from '../types/api'
import { createMonacoMarkers } from './markers'

function createReport(): AnalysisReport {
  return {
    tokens: [],
    lexical: {
      errors: [
        {
          message: 'Unexpected character',
          span: {
            start: { line: 1, column: 2 },
            end: { line: 1, column: 3 },
          },
        },
      ],
    },
    syntax: {
      status: 'errors',
      errors: [
        {
          message: 'Missing semicolon',
          span: {
            start: { line: 2, column: 1 },
            end: { line: 2, column: 1 },
          },
        },
      ],
    },
    security: {
      findings: [
        {
          message: 'Suspicious operation',
          span: {
            start: { line: 1, column: 2 },
            end: { line: 1, column: 3 },
          },
        },
      ],
    },
  }
}

describe('createMonacoMarkers', () => {
  it('converts diagnostics to markers with severity, message, and source', () => {
    const report = createReport()
    const markers = createMonacoMarkers(report, (line) =>
      line === 1 ? 'a😀b' : 'code',
    )

    expect(markers).toEqual([
      {
        startLineNumber: 1,
        startColumn: 2,
        endLineNumber: 1,
        endColumn: 4,
        message: 'Unexpected character',
        source: 'CodeSentinel',
        severity: monaco.MarkerSeverity.Error,
      },
      {
        startLineNumber: 2,
        startColumn: 1,
        endLineNumber: 2,
        endColumn: 2,
        message: 'Missing semicolon',
        source: 'CodeSentinel',
        severity: monaco.MarkerSeverity.Error,
      },
      {
        startLineNumber: 1,
        startColumn: 2,
        endLineNumber: 1,
        endColumn: 4,
        message: 'Suspicious operation',
        source: 'CodeSentinel',
        severity: monaco.MarkerSeverity.Warning,
      },
    ])
  })

  it('uses the supplied line content for each span endpoint', () => {
    const getLineContent = vi.fn((line: number) =>
      line === 1 ? 'a😀b' : 'cd',
    )

    createMonacoMarkers(createReport(), getLineContent)

    expect(getLineContent).toHaveBeenCalledWith(1)
    expect(getLineContent).toHaveBeenCalledWith(2)
  })
})
