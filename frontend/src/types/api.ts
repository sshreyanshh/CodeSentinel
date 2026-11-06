export interface SourcePosition {
  line: number
  column: number
}

export interface SourceSpan {
  start: SourcePosition
  end: SourcePosition
}

export interface Diagnostic {
  message: string
  span: SourceSpan
}

export interface AnalysisReport {
  tokens: unknown[]
  lexical: {
    errors: Diagnostic[]
  }
  syntax: {
    status: 'errors' | 'ok'
    errors: Diagnostic[]
  }
  security: {
    findings: Diagnostic[]
  }
  [key: string]: unknown
}
