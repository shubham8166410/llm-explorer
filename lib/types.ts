export interface SessionWithLatestGeneration {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  latestGeneration?: {
    id: string;
    prompt: string;
    status: "pending" | "running" | "completed" | "failed";
    lifecycle: "active" | "superseded";
    createdAt: Date;
    itemCount: number;
  };
}

export interface GenerationWithItems {
  id: string;
  sessionId: string;
  prompt: string;
  status: "pending" | "running" | "completed" | "failed";
  lifecycle: "active" | "superseded";
  errorMessage?: string | null;
  createdAt: Date;
  completedAt?: Date | null;
  items: ItemData[];
}

export interface ItemData {
  id: string;
  generationId: string;
  title: string;
  description: string;
  tags: string[];
  status: "active" | "deleted";
  editedAt?: Date | null;
  createdAt: Date;
}

export interface LLMOutputItem {
  title: string;
  description: string;
  tags: string[];
}
