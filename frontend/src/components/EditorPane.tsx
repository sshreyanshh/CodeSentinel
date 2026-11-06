import Editor, { type Monaco } from '@monaco-editor/react'
import type { editor as MonacoEditor } from 'monaco-editor'
import { useEffect, useRef } from 'react'
import type { Theme } from '../hooks/useTheme'
import { codePointColumnToMonaco } from '../lib/positions'

interface EditorPaneProps {
  code: string
  onChange: (value: string) => void
  onAnalyze: () => void
  isAnalyzing: boolean
  markers: MonacoEditor.IMarkerData[]
  activeHighlight: { line: number; column: number } | null
  theme: Theme
}

const presets = {
  Valid: 'int main() {\n  return 0;\n}\n',
  'Lexical Error': 'int main() {\n  @return 0;\n}\n',
  'Syntax Error': 'int main( {\n  return 0;\n}\n',
  'Unicode Bidi': 'int main() {\n  // safe\u202E } evil {\n  return 0;\n}\n',
  Homoglyph: 'int m\u0430in() {\n  return 0;\n}\n',
}

type PresetName = keyof typeof presets

function beforeMount(monaco: Monaco) {
  monaco.editor.defineTheme('parchment-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#e4d7b0',
      'editor.foreground': '#5c4b3e',
      'editorLineNumber.foreground': '#b19681',
      'editorLineNumber.activeForeground': '#5c4b3e',
      'editor.lineHighlightBackground': '#e7dbbf',
      'editor.selectionBackground': '#dbc894',
      'editorCursor.foreground': '#8d9d4f',
    },
  })
  monaco.editor.defineTheme('parchment-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#3a3529',
      'editor.foreground': '#ede4d4',
      'editorLineNumber.foreground': '#a8a096',
      'editorLineNumber.activeForeground': '#ede4d4',
      'editor.lineHighlightBackground': '#413c33',
      'editor.selectionBackground': '#5a5345',
      'editorCursor.foreground': '#8a9f7b',
    },
  })
}

export function EditorPane({
  code,
  onChange,
  onAnalyze,
  isAnalyzing,
  markers,
  activeHighlight,
  theme,
}: EditorPaneProps) {
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const onAnalyzeRef = useRef(onAnalyze)

  useEffect(() => {
    onAnalyzeRef.current = onAnalyze
  }, [onAnalyze])

  const syncMarkers = (
    editor: MonacoEditor.IStandaloneCodeEditor,
    monaco: Monaco,
    nextMarkers: MonacoEditor.IMarkerData[],
  ) => {
    const model = editor.getModel()
    if (model) {
      monaco.editor.setModelMarkers(model, 'codesentinel', nextMarkers)
    }
  }

  const revealHighlight = (
    editor: MonacoEditor.IStandaloneCodeEditor,
    highlight: { line: number; column: number } | null,
  ) => {
    if (!highlight) {
      return
    }

    const model = editor.getModel()
    if (!model) {
      return
    }

    const lineNumber = Math.min(Math.max(highlight.line, 1), model.getLineCount())
    const lineContent = model.getLineContent(lineNumber)
    const column = codePointColumnToMonaco(lineContent, highlight.column)
    const position = { lineNumber, column }
    editor.revealPositionInCenter(position)

    const nextCharacter = Array.from(lineContent.slice(column - 1))[0]
    if (nextCharacter) {
      editor.setSelection({
        startLineNumber: lineNumber,
        startColumn: column,
        endLineNumber: lineNumber,
        endColumn: column + nextCharacter.length,
      })
    } else {
      editor.setPosition(position)
    }
  }

  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      syncMarkers(editorRef.current, monacoRef.current, markers)
    }
  }, [markers])

  useEffect(() => {
    if (editorRef.current) {
      revealHighlight(editorRef.current, activeHighlight)
    }
  }, [activeHighlight])

  const handleMount = (
    editor: MonacoEditor.IStandaloneCodeEditor,
    monaco: Monaco,
  ) => {
    editorRef.current = editor
    monacoRef.current = monaco
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onAnalyzeRef.current()
    })
    syncMarkers(editor, monaco, markers)
    revealHighlight(editor, activeHighlight)
  }

  const handlePresetChange = (value: string) => {
    if (value in presets) {
      onChange(presets[value as PresetName])
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[var(--color-radius)] border border-border bg-card text-card-foreground shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-3 py-2">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Examples</span>
            <select
              aria-label="Examples"
              defaultValue=""
              onChange={(event) => handlePresetChange(event.target.value)}
              className="rounded-md border border-border bg-card px-2 py-1 text-card-foreground"
            >
              <option value="" disabled>
                Select an example
              </option>
              {Object.keys(presets).map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
            </select>
          </label>
          <span
            className={`text-xs tabular-nums ${
              code.length > 50_000 ? 'text-destructive' : 'text-muted-foreground'
            }`}
            aria-label={`${code.length} of 50000 characters`}
          >
            {code.length} / 50000
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-2 rounded-md border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-card disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAnalyzing && (
              <span
                aria-hidden="true"
                className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
              />
            )}
            {isAnalyzing ? 'Analyzing…' : 'Analyze (Ctrl+Enter)'}
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          language="cpp"
          value={code}
          onChange={(value) => onChange(value ?? '')}
          beforeMount={beforeMount}
          onMount={handleMount}
          theme={theme === 'dark' ? 'parchment-dark' : 'parchment-light'}
          options={{
            fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
            minimap: { enabled: false },
            unicodeHighlight: {
              ambiguousCharacters: false,
              invisibleCharacters: false,
            },
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </section>
  )
}
