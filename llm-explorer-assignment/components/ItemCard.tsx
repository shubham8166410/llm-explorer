"use client";

import { useState } from "react";

interface Item {
  id: string;
  title: string;
  description: string;
  tags: string[];
  status: "active" | "deleted";
  editedAt: string | null;
}

interface Props {
  item: Item;
  onUpdate: (updates: { title?: string; description?: string; tags?: string[] }) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function ItemCard({ item, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [tagsInput, setTagsInput] = useState(item.tags.join(", "));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await onUpdate({ title, description, tags });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setTitle(item.title);
    setDescription(item.description);
    setTagsInput(item.tags.join(", "));
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    setDeleting(true);
    await onDelete();
  };

  return (
    <div
      className={`bg-white border rounded-xl p-4 transition-all ${
        editing ? "border-indigo-300 shadow-md" : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      {editing ? (
        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full font-semibold text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Title"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-sm text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1.5 min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Description"
          />
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              Tags (comma-separated)
            </label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="tag1, tag2, tag3"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-indigo-600 text-white text-sm py-1.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-100 text-gray-700 text-sm py-1.5 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug">
              {item.title}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              {item.editedAt && (
                <span className="text-xs text-indigo-400 mr-1" title="Manually edited">
                  ✎
                </span>
              )}
              <button
                onClick={() => setEditing(true)}
                className="text-gray-400 hover:text-indigo-600 transition-colors p-0.5"
                title="Edit item"
              >
                <EditIcon />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={`transition-colors p-0.5 ${
                  confirmDelete
                    ? "text-red-500 hover:text-red-700"
                    : "text-gray-400 hover:text-red-500"
                }`}
                title={confirmDelete ? "Click again to confirm" : "Delete item"}
              >
                {deleting ? "…" : <TrashIcon />}
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            {item.description}
          </p>

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {confirmDelete && (
            <p className="text-xs text-red-500 mt-2">
              Click delete again to confirm
            </p>
          )}
        </>
      )}
    </div>
  );
}

function EditIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
