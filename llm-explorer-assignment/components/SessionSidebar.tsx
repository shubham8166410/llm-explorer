"use client";

import type { SessionSummary } from "./AppShell";

interface Props {
  sessions: SessionSummary[];
  activeSessionId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
}

const STATUS_DOT: Record<string, string> = {
  completed: "bg-emerald-400",
  running: "bg-amber-400 animate-pulse",
  failed: "bg-red-400",
  pending: "bg-gray-300",
};

export function SessionSidebar({ sessions, activeSessionId, loading, onSelect }: Props) {
  if (loading) {
    return (
      <div className="flex-1 p-4 space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex-1 p-4 text-sm text-gray-400 text-center pt-8">
        No sessions yet
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2">
      {sessions.map((session) => {
        const isActive = session.id === activeSessionId;
        const status = session.latestGeneration?.status;
        const itemCount = session.latestGeneration?.itemCount ?? 0;

        return (
          <button
            key={session.id}
            onClick={() => onSelect(session.id)}
            className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-colors group ${
              isActive
                ? "bg-indigo-50 border border-indigo-200"
                : "hover:bg-gray-50 border border-transparent"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={`text-sm font-medium leading-snug line-clamp-2 ${
                  isActive ? "text-indigo-900" : "text-gray-800"
                }`}
              >
                {session.title}
              </span>
              {status && (
                <span
                  className={`mt-1 shrink-0 w-2 h-2 rounded-full ${STATUS_DOT[status] ?? "bg-gray-300"}`}
                  title={status}
                />
              )}
            </div>
            {session.latestGeneration && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400">
                  {itemCount} item{itemCount !== 1 ? "s" : ""}
                </span>
                <span className="text-xs text-gray-300">·</span>
                <span className="text-xs text-gray-400">
                  {new Date(session.updatedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
