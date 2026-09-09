type AnalysisRecord = {
  id: string;
  status: "completed" | "failed";
  createdAt: string;
  report?: unknown;
  error?: string;
};

const analyses = new Map<string, AnalysisRecord>();

// ponytail: unbounded store would grow forever; cap by count (oldest evicted first).
// Raise MAX_ANALYSES or switch to a TTL if reports need to outlive this many requests.
const MAX_ANALYSES = 200;

export function evictOldest<K, V>(map: Map<K, V>, maxSize: number): void {
  while (map.size > maxSize) {
    const oldestKey = map.keys().next().value;
    if (oldestKey === undefined) break;
    map.delete(oldestKey);
  }
}

function remember(id: string, record: AnalysisRecord): void {
  analyses.set(id, record);
  evictOldest(analyses, MAX_ANALYSES);
}

export function createAnalysisRecord(report: unknown): AnalysisRecord {
  const id = `BSA-${new Date().getUTCFullYear()}-${String(Date.now()).slice(-7)}`;
  const record: AnalysisRecord = {
    id,
    status: "completed",
    createdAt: new Date().toISOString(),
    report,
  };

  remember(id, record);
  return record;
}

export function createFailedAnalysisRecord(error: string): AnalysisRecord {
  const id = `BSA-${new Date().getUTCFullYear()}-${String(Date.now()).slice(-7)}`;
  const record: AnalysisRecord = {
    id,
    status: "failed",
    createdAt: new Date().toISOString(),
    error,
  };

  remember(id, record);
  return record;
}

export function getAnalysisRecord(id: string): AnalysisRecord | undefined {
  return analyses.get(id);
}

export function updateAnalysisReport(id: string, updater: (report: unknown) => unknown): AnalysisRecord | undefined {
  const record = analyses.get(id);
  if (!record || !record.report) return record;

  const updated: AnalysisRecord = {
    ...record,
    report: updater(record.report),
  };

  analyses.set(id, updated);
  return updated;
}
