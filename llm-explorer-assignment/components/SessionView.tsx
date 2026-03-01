"use client";

import { useState, useEffect, useCallback } from "react";
import { ItemCard } from "./ItemCard";
import { PromptBar } from "./PromptBar";
import { GenerationHistory } from "./GenerationHistory";

interface Item {
  id: string;
  title: string;
  description: string;
  tags: string[];
  status: "active" | "deleted";
  editedAt: string | null;
  generationId: string;
}

interface Generation {
  id: string;
  prompt: string;
  model: string;
  temperature: number;
  status: "pending" | "running" | "completed" | "failed";
  lifecycle: "active" | "superseded";
  errorMessage?: string | null;
  createdAt: string;
  completedAt?: string | null;
  items: Item[];
}

interface SessionDetail {
  id: string;
  title: string;
  generations: Generation[];
}

interface Props {
  sessionId: string;
  onSessionDeleted: () => void;
  onSessionUpdated: () => void;
}

export function SessionView({ sessionId, onSessionDeleted, onSessionUpdated }: Props) {
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setSession(data);
    } catch {
      // silently fail — UI shows stale data
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const handleRegenerate = async (newPrompt: string, model: string, temperature: number) => {
    if (!session || regenerating) return;
    setRegenError(null);
    setRegenerating(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, prompt: newPrompt, model, temperature }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.details || data.error || "Regeneration failed");
      }

      await loadSession();
      onSessionUpdated();
    } catch (e) {
      setRegenError(e instanceof Error ? e.message : "Something went wrong");
      // Still reload to reflect any partial state
      await loadSession();
    } finally {
      setRegenerating(false);
    }
  };

  // Optimistic update: update local state immediately, then sync with server
  const handleItemUpdate = async (
    itemId: string,
    updates: { title?: string; description?: string; tags?: string[] }
  ) => {
    // Optimistically update UI
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        generations: prev.generations.map((g) => ({
          ...g,
          items: g.items.map((item) =>
            item.id === itemId
              ? { ...item, ...updates, editedAt: new Date().toISOString() }
              : item
          ),
        })),
      };
    });

    // Sync to server (fire and forget — reload on failure)
    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Update failed");
    } catch {
      // Revert on failure
      await loadSession();
    }
  };

  // Optimistic delete
  const handleItemDelete = async (itemId: string) => {
    // Optimistically remove from UI
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        generations: prev.generations.map((g) => ({
          ...g,
          items: g.items.map((item) =>
            item.id === itemId ? { ...item, status: "deleted" as const } : item
          ),
        })),
      };
    });

    try {
      const res = await fetch(`/api/items/${itemId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    } catch {
      await loadSession();
    }
  };

  const handleDeleteSession = async () => {
    if (!confirm("Delete this session and all its content?")) return;
    await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
    onSessionDeleted();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400 animate-pulse">Loading session…</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Session not found.
      </div>
    );
  }

  const activeGeneration = session.generations.find((g) => g.lifecycle === "active");
  const historicalGenerations = session.generations.filter((g) => g.lifecycle === "superseded");
  const activeItems = activeGeneration?.items.filter((i) => i.status === "active") ?? [];
  const currentPrompt = activeGeneration?.prompt ?? "";
  const currentModel = activeGeneration?.model ?? "claude-haiku-4-5";
  const currentTemperature = activeGeneration?.temperature ?? 0.7;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900 text-lg truncate">
              {session.title}
            </h2>
            {activeGeneration && (
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <StatusBadge status={activeGeneration.status} />
                <span className="text-xs text-gray-400">
                  {activeItems.length} item{activeItems.length !== 1 ? "s" : ""}
                  {" · "}
                  {session.generations.length} generation{session.generations.length !== 1 ? "s" : ""}
                </span>
                <span className="text-xs text-gray-300">·</span>
                <span className="text-xs text-gray-400">
                  {activeGeneration.model} · temp {activeGeneration.temperature.toFixed(1)}
                </span>
                {historicalGenerations.length > 0 && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-xs text-indigo-500 hover:text-indigo-700 underline"
                  >
                    {showHistory ? "Hide history" : "View history"}
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleDeleteSession}
            className="shrink-0 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Delete session
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {showHistory && historicalGenerations.length > 0 && (
          <GenerationHistory generations={historicalGenerations} />
        )}

        {activeGeneration?.status === "failed" && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <strong>Generation failed:</strong>{" "}
            {activeGeneration.errorMessage ?? "Unknown error"}
            <span className="ml-2 text-red-500">
              — modify your prompt below and try again.
            </span>
          </div>
        )}

        {regenerating ? (
          <GeneratingPlaceholder />
        ) : activeItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {activeItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onUpdate={(updates) => handleItemUpdate(item.id, updates)}
                onDelete={() => handleItemDelete(item.id)}
              />
            ))}
          </div>
        ) : activeGeneration?.status === "completed" ? (
          <div className="text-center py-12 text-gray-400">
            All items deleted. Regenerate to get new ones.
          </div>
        ) : activeGeneration?.status !== "failed" ? (
          <div className="text-center py-12 text-gray-400">Nothing here yet.</div>
        ) : null}
      </div>

      {/* Prompt bar */}
      <div className="shrink-0 bg-white border-t border-gray-200 px-6 py-4">
        <PromptBar
          initialPrompt={currentPrompt}
          initialModel={currentModel}
          initialTemperature={currentTemperature}
          onSubmit={handleRegenerate}
          loading={regenerating}
          error={regenError}
          isRegeneration={session.generations.length > 0}
        />
      </div>
    </div>
  );
}

function GeneratingPlaceholder() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse"
        >
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
          <div className="space-y-1.5 mb-3">
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-5/6" />
            <div className="h-3 bg-gray-100 rounded w-4/6" />
          </div>
          <div className="flex gap-1.5">
            <div className="h-5 w-12 bg-gray-100 rounded-full" />
            <div className="h-5 w-16 bg-gray-100 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "running" | "completed" | "failed" }) {
  const styles = {
    pending: "bg-gray-100 text-gray-500",
    running: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-600",
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {status === "running" && (
        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
      )}
      {status}
    </span>
  );
}
