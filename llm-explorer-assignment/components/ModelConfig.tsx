"use client";

import { AVAILABLE_MODELS } from "@/lib/llm";

interface Props {
  model: string;
  temperature: number;
  onModelChange: (model: string) => void;
  onTemperatureChange: (temp: number) => void;
  disabled?: boolean;
}

export function ModelConfig({
  model,
  temperature,
  onModelChange,
  onTemperatureChange,
  disabled,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Model selector */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 font-medium whitespace-nowrap">
          Model
        </label>
        <select
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={disabled}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300 disabled:opacity-50 cursor-pointer"
        >
          {AVAILABLE_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Temperature slider */}
      <div className="flex items-center gap-2 flex-1 min-w-[180px]">
        <label className="text-xs text-gray-500 font-medium whitespace-nowrap">
          Temperature
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={temperature}
          onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="flex-1 h-1.5 accent-indigo-600 disabled:opacity-50"
        />
        <span className="text-xs text-gray-500 w-6 text-right tabular-nums">
          {temperature.toFixed(1)}
        </span>
        <span className="text-xs text-gray-400">
          {temperature <= 0.3
            ? "(precise)"
            : temperature <= 0.6
            ? "(balanced)"
            : "(creative)"}
        </span>
      </div>
    </div>
  );
}
