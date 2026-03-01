"use client";

import { useState, useEffect, useCallback } from "react";
import { SessionSidebar } from "./SessionSidebar";
import { SessionView } from "./SessionView";
import { NewSessionPanel } from "./NewSessionPanel";

export interface SessionSummary {
  id: string;
  title: string;
  updatedAt: string;
  latestGeneration?: {
    id: string;
    prompt: string;
    status: "pending" | "running" | "completed" | "failed";
    lifecycle: "active" | "superseded";
    itemCount: number;
  } | null;
}

export function AppShell() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [showNewSession, setShowNewSession] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleSessionCreated = (sessionId: string) => {
    setShowNewSession(false);
    setActiveSessionId(sessionId);
    loadSessions();
  };

  const handleSessionDeleted = (sessionId: string) => {
    if (activeSessionId === sessionId) setActiveSessionId(null);
    loadSessions();
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-72 shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-gray-900 text-lg">LLM Explorer</h1>
            <p className="text-xs text-gray-500 mt-0.5">Prompt → Iterate → Refine</p>
          </div>
          <button
            onClick={() => {
              setShowNewSession(true);
              setActiveSessionId(null);
            }}
            className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <span className="text-base leading-none">+</span> New
          </button>
        </div>

        <SessionSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          loading={loadingList}
          onSelect={(id) => {
            setActiveSessionId(id);
            setShowNewSession(false);
          }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {showNewSession ? (
          <NewSessionPanel onSessionCreated={handleSessionCreated} />
        ) : activeSessionId ? (
          <SessionView
            key={activeSessionId}
            sessionId={activeSessionId}
            onSessionDeleted={() => handleSessionDeleted(activeSessionId)}
            onSessionUpdated={loadSessions}
          />
        ) : (
          <EmptyState onNew={() => setShowNewSession(true)} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="text-5xl mb-4">✦</div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Start exploring with a prompt
      </h2>
      <p className="text-gray-500 max-w-md mb-6">
        Submit a prompt and the LLM will generate structured ideas you can
        review, edit, and refine through iteration.
      </p>
      <button
        onClick={onNew}
        className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
      >
        Create your first session
      </button>
    </div>
  );
}
