import Editor from "@monaco-editor/react";

const MONACO_LANG = {
  cpp: "cpp",
  c: "c",
  java: "java",
  python: "python",
};

const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 14,
  lineHeight: 21,
  fontFamily: "Menlo, Monaco, 'Courier New', monospace",
  automaticLayout: true,
  tabSize: 4,
  insertSpaces: true,
  lineNumbers: "on",
  lineNumbersMinChars: 3,
  scrollBeyondLastLine: false,
  wordWrap: "off",
  folding: true,
  bracketPairColorization: { enabled: true },
  autoClosingBrackets: "always",
  autoClosingQuotes: "always",
  autoIndent: "full",
  formatOnPaste: true,
  formatOnType: true,
  quickSuggestions: true,
  acceptSuggestionOnEnter: "on",
  suggestOnTriggerCharacters: true,
  smoothScrolling: true,
  cursorBlinking: "blink",
  cursorSmoothCaretAnimation: "off",
  renderLineHighlight: "line",
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  scrollbar: {
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
  },
  padding: { top: 8, bottom: 8 },
};

export default function CodeEditor({
  language = "cpp",
  value,
  onChange,
  height = "420px",
}) {
  const handleMount = (editor) => {
    editor.focus();
  };

  return (
    <div className="rounded-lg overflow-hidden border border-gray-800">
      <Editor
        height={height}
        language={MONACO_LANG[language] || language}
        value={value}
        onChange={(v) => onChange(v || "")}
        theme="vs-dark"
        options={EDITOR_OPTIONS}
        onMount={handleMount}
      />
    </div>
  );
}