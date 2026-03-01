"use client";

import { useState, useEffect } from "react";
import { ModelConfig } from "./ModelConfig";

interface Props {
  initialPrompt: string;
  initialModel: string;
  initialTemperature: number;
  onSubmit: (prompt: string, model: string, temperature: number) => Promise<void>;
  loading: boolean;
  error: string | null;
  isRegeneration: boolean;
}

export function PromptBar({
  initialPrompt,
  initialModel,
  initialTemperature,
  onSubmit,
  loading,
  error,
  isRegeneration,
}: Props) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [model, setModel] = useState(initialModel);
  const [temperature, setTemperature] = useState(initialTemperature);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => { setPrompt(initialPrompt); }, [initialPrompt]);
  useEffect(() => { setModel(initialModel); }, [initialModel]);
  useEffect(() => { setTemperature(initialTemperature); }, [initialTemperature]);

  const hasChanged =
    prompt.trim() !== initialPrompt.trim() ||
    model !== initialModel ||
    temperature !== initialTemperature;

  const canSubmit = prompt.trim().length > 0 && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onSubmit(prompt.trim(), model, temperature);
  };

  return (
    <div>
      {error && (
        <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {isRegeneration && (
        <div className="mb-2 text-xs text-gray-400 flex items-center gap-1">
          <span>ℹ</span>
          <span>
            Regenerating will{" "}
            <strong className="text-gray-500">supersede</strong> current items
            — previous generations remain viewable in history.
          </span>
        </div>
      )}

      <div className={`border rounded-xl transition-all bg-white overflow-hidden ${expanded ? "border-indigo-300 shadow-sm" : "border-gray-200"}`}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onFocus={() => setExpanded(true)}
          onBlur={() => setExpanded(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
          disabled={loading}
          rows={expanded ? 4 : 2}
          className="w-full resize-none text-sm text-gray-900 placeholder-gray-400 px-3.5 py-2.5 focus:outline-none bg-transparent"
          placeholder="Modify your prompt and regenerate…"
        />

        <div className="border-t border-gray-100 px-3.5 py-2.5 bg-gray-50">
          <ModelConfig
            model={model}
            temperature={temperature}
            onModelChange={setModel}
            onTemperatureChange={setTemperature}
            disabled={loading}
          />
        </div>

        <div className="flex items-center justify-between px-3.5 py-2 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">⌘ + Enter to submit</span>
            {hasChanged && !loading && (
              <span className="text-xs text-amber-600 font-medium">● Modified</span>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <><Spinner /> Generating…</>
            ) : isRegeneration ? (
              "Regenerate ↺"
            ) : (
              "Generate ✦"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
