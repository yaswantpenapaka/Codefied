import Editor from "@monaco-editor/react";

const MONACO_LANG = {
  cpp: "cpp",
  c: "c",
  java: "java",
  python: "python",
};

export default function CodeEditor({
  language = "cpp",
  value,
  onChange,
  height = "420px",
}) {
  return (
    <div
      data-editor-shell
      className="rounded-lg overflow-hidden border border-gray-800"
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
    >
      <Editor
        height={height}
        language={MONACO_LANG[language] || language}
        value={value}
        onChange={(v) => onChange(v || "")}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          automaticLayout: true,
          tabSize: 2,
          quickSuggestions: true,
          acceptSuggestionOnEnter: "on",
        }}
      />
    </div>
  );
}