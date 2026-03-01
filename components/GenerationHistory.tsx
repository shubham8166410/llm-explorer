"use client";

import { useState } from "react";

interface Item {
  id: string;
  title: string;
  description: string;
  tags: string[];
  status: "active" | "deleted";
}

interface Generation {
  id: string;
  prompt: string;
  status: "pending" | "running" | "completed" | "failed";
  lifecycle: "active" | "superseded";
  createdAt: string;
  items: Item[];
}

interface Props {
  generations: Generation[];
}

export function GenerationHistory({ generations }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Previous Generations ({generations.length})
      </h3>
      <div className="space-y-2">
        {generations.map((gen, idx) => {
          const isExpanded = expandedIds.has(gen.id);
          const activeItems = gen.items.filter((i) => i.status === "active");
          const label = `Generation ${generations.length - idx}`;

          return (
            <div
              key={gen.id}
              className="border border-gray-200 rounded-xl bg-gray-50 overflow-hidden"
            >
              <button
                onClick={() => toggle(gen.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-medium text-gray-400 shrink-0">
                    {label}
                  </span>
                  <span className="text-xs text-gray-500 truncate">
                    {gen.prompt}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-xs text-gray-400">
                    {activeItems.length} items
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(gen.createdAt).toLocaleDateString()}
                  </span>
                  <ChevronIcon expanded={isExpanded} />
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mt-3 mb-3 italic">
                    &quot;{gen.prompt}&quot;
                  </p>
                  {activeItems.length === 0 ? (
                    <p className="text-xs text-gray-400">No items in this generation.</p>
                  ) : (
                    <div className="space-y-2">
                      {activeItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white border border-gray-200 rounded-lg p-3"
                        >
                          <p className="text-xs font-semibold text-gray-700">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {item.description}
                          </p>
                          {item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {item.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-1.5 py-0.5 bg-gray-100 text-gray-400 text-xs rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
