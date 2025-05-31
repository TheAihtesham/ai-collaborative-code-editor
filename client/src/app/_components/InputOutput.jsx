export function InputOutputPanel({ input, setInput, output }) {
  return (
    <>
      <div className="flex-1 bg-gray-800 rounded p-3 overflow-auto">
        <h3 className="text-gray-400 text-sm mb-2">Input (stdin):</h3>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full h-[85%] bg-gray-700 text-white p-2 rounded resize-none"
          placeholder="Enter custom input for your code..."
        />
      </div>
      <div className="flex-1 bg-gray-800 rounded p-3 overflow-auto">
        <h3 className="text-gray-400 text-sm mb-2">Output:</h3>
        <pre
          className={`text-sm whitespace-pre-wrap break-words max-h-full overflow-auto ${
            output.toLowerCase().includes("error") ? "text-red-400" : "text-green-400"
          }`}
        >
          {output}
        </pre>
      </div>
    </>
  );
}