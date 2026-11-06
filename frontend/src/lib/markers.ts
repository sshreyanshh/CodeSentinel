import * as monaco from 'monaco-editor'
import type { AnalysisReport, Diagnostic } from '../types/api'
import { codePointColumnToMonaco } from './positions'

export function createMonacoMarkers(
  report: AnalysisReport,
  getLineContent: (line: number) => string,
): monaco.editor.IMarkerData[] {
  const toMarker = (
    diagnostic: Diagnostic,
    severity: monaco.MarkerSeverity,
  ): monaco.editor.IMarkerData => {
    const startLineNumber = diagnostic.span.start.line
    const startColumn = codePointColumnToMonaco(
      getLineContent(startLineNumber),
      diagnostic.span.start.column,
    )
    const endLineNumber = diagnostic.span.end.line
    const convertedEndColumn = codePointColumnToMonaco(
      getLineContent(endLineNumber),
      diagnostic.span.end.column,
    )
    const isEmptySpan =
      startLineNumber === endLineNumber &&
      startColumn === convertedEndColumn

    return {
      startLineNumber,
      startColumn,
      endLineNumber,
      endColumn: isEmptySpan ? convertedEndColumn + 1 : convertedEndColumn,
      message: diagnostic.message,
      source: 'CodeSentinel',
      severity,
    }
  }

  return [
    ...report.lexical.errors.map((diagnostic) =>
      toMarker(diagnostic, monaco.MarkerSeverity.Error),
    ),
    ...report.syntax.errors.map((diagnostic) =>
      toMarker(diagnostic, monaco.MarkerSeverity.Error),
    ),
    ...report.security.findings.map((diagnostic) =>
      toMarker(diagnostic, monaco.MarkerSeverity.Warning),
    ),
  ]
}
