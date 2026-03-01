"use client";

import { useState } from "react";
import { ModelConfig } from "./ModelConfig";

interface Props {
  onSessionCreated: (sessionId: string) => void;
}

export function NewSessionPanel({ onSessionCreated }: Props) {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("claude-haiku-4-5");
  const [temperature, setTemperature] = useState(0.7);
  const [status, setStatus] = useState<"idle" | "generating">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!prompt.trim() || status !== "idle") return;
    setError(null);
    setStatus("generating");

    try {
      // Single atomic call — creates session + runs generation together.
      // If generation fails, no orphan session is left behind.
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model, temperature }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Generation failed but session was still created — navigate there
        // so the user can see the error and retry.
        if (data.sessionId) {
          onSessionCreated(data.sessionId);
          return;
        }
        throw new Error(data.details || data.error || "Generation failed");
      }

      onSessionCreated(data.sessionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStatus("idle");
    }
  };

  const isLoading = status === "generating";

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <div className="w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">New Session</h2>
        <p className="text-gray-500 mb-6">
          Describe what you want to explore. The LLM will generate structured
          items you can review, edit, and iterate on.
        </p>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
            disabled={isLoading}
            placeholder="e.g. Give me ideas for a mobile app that helps people build better daily habits..."
            className="w-full resize-none text-gray-900 placeholder-gray-400 text-base focus:outline-none min-h-[130px] p-4"
            autoFocus
          />

          <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
            <ModelConfig
              model={model}
              temperature={temperature}
              onModelChange={setModel}
              onTemperatureChange={setTemperature}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">⌘ + Enter to submit</span>
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isLoading}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Spinner />
                  Generating…
                </>
              ) : (
                "Generate ✦"
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {isLoading && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-center gap-2">
            <Spinner className="text-amber-600" />
            Running your prompt through the LLM — this takes a few seconds…
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner({ className = "text-white" }: { className?: string }) {
  return (
    <svg className={`animate-spin h-4 w-4 ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
