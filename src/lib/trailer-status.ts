type TrailerStatusRecord = {
  status: string;
  detail?: string;
  outputUrl?: string;
  model?: string;
  updatedAt: number;
};

type TrailerStatusStore = Map<string, TrailerStatusRecord>;

const globalForTrailerStatus = globalThis as typeof globalThis & {
  __TRAILER_STATUS_STORE__?: TrailerStatusStore;
};

export const trailerStatusStore: TrailerStatusStore =
  globalForTrailerStatus.__TRAILER_STATUS_STORE__ ??
  (globalForTrailerStatus.__TRAILER_STATUS_STORE__ = new Map());

export function setTrailerStatusRecord(
  jobId: string | undefined,
  status: string,
  detail?: string,
  outputUrl?: string,
  model?: string
) {
  if (!jobId) return;
  trailerStatusStore.set(jobId, {
    status,
    detail,
    outputUrl,
    model,
    updatedAt: Date.now(),
  });
}

export function getTrailerStatusRecord(jobId: string | null | undefined) {
  if (!jobId) return null;
  return trailerStatusStore.get(jobId) ?? null;
}

export function clearTrailerStatusRecord(jobId: string | null | undefined) {
  if (!jobId) return;
  trailerStatusStore.delete(jobId);
}

export function pruneTrailerStatusRecords(maxAgeMs = 1000 * 60 * 30) {
  const cutoff = Date.now() - maxAgeMs;
  for (const [jobId, record] of trailerStatusStore.entries()) {
    if (record.updatedAt < cutoff) {
      trailerStatusStore.delete(jobId);
    }
  }
}
