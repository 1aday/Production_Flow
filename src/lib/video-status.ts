type VideoStatusRecord = {
  status: string;
  detail?: string;
  outputUrl?: string;
  updatedAt: number;
};

type VideoStatusStore = Map<string, VideoStatusRecord>;

const globalForVideoStatus = globalThis as typeof globalThis & {
  __VIDEO_STATUS_STORE__?: VideoStatusStore;
};

export const videoStatusStore: VideoStatusStore =
  globalForVideoStatus.__VIDEO_STATUS_STORE__ ??
  (globalForVideoStatus.__VIDEO_STATUS_STORE__ = new Map());

export function setVideoStatusRecord(
  jobId: string | undefined,
  status: string,
  detail?: string,
  outputUrl?: string
) {
  if (!jobId) return;
  videoStatusStore.set(jobId, {
    status,
    detail,
    outputUrl,
    updatedAt: Date.now(),
  });
}

export function getVideoStatusRecord(jobId: string | null | undefined) {
  if (!jobId) return null;
  return videoStatusStore.get(jobId) ?? null;
}

export function clearVideoStatusRecord(jobId: string | null | undefined) {
  if (!jobId) return;
  videoStatusStore.delete(jobId);
}

export function pruneVideoStatusRecords(maxAgeMs = 1000 * 60 * 30) {
  const cutoff = Date.now() - maxAgeMs;
  for (const [jobId, record] of videoStatusStore.entries()) {
    if (record.updatedAt < cutoff) {
      videoStatusStore.delete(jobId);
    }
  }
}

