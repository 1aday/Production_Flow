type PortraitStatusRecord = {
  status: string;
  detail?: string;
  outputUrl?: string;
  updatedAt: number;
};

type PortraitStatusStore = Map<string, PortraitStatusRecord>;

const globalForPortraitStatus = globalThis as typeof globalThis & {
  __PORTRAIT_STATUS_STORE__?: PortraitStatusStore;
};

export const portraitStatusStore: PortraitStatusStore =
  globalForPortraitStatus.__PORTRAIT_STATUS_STORE__ ??
  (globalForPortraitStatus.__PORTRAIT_STATUS_STORE__ = new Map());

export function setPortraitStatusRecord(
  jobId: string | undefined,
  status: string,
  detail?: string,
  outputUrl?: string
) {
  if (!jobId) return;
  portraitStatusStore.set(jobId, {
    status,
    detail,
    outputUrl,
    updatedAt: Date.now(),
  });
}

export function getPortraitStatusRecord(jobId: string | null | undefined) {
  if (!jobId) return null;
  return portraitStatusStore.get(jobId) ?? null;
}

export function clearPortraitStatusRecord(jobId: string | null | undefined) {
  if (!jobId) return;
  portraitStatusStore.delete(jobId);
}

export function prunePortraitStatusRecords(maxAgeMs = 1000 * 60 * 30) {
  const cutoff = Date.now() - maxAgeMs;
  for (const [jobId, record] of portraitStatusStore.entries()) {
    if (record.updatedAt < cutoff) {
      portraitStatusStore.delete(jobId);
    }
  }
}




