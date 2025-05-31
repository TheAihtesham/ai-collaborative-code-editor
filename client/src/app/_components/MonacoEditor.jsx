import Editor from "@monaco-editor/react";
export function CodeEditorPanel({ language, theme, onChange, onMount }) {
  return (
    <Editor
      height="100%"
      theme={theme}
      language={language}
      defaultValue={"// Grind here..."}
      onMount={onMount}
      onChange={onChange}
      options={{ fontSize: 16, minimap: { enabled: false } }}
    />
  );
}