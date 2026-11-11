// Keep the batch algorithm independent of Gmail and Prisma so retries and
// checkpoint behavior can be tested without reading a real inbox.
export type IndexedPart = {
  partId: string;
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string | null;
};
export type MessageData = { date: Date | null; parts: IndexedPart[] };
export type BatchState = {
  messageIds: string[];
  offset: number;
  pageToken: string | null;
  nextPageToken: string | null;
};
export interface BatchSource {
  page(
    token: string | null,
  ): Promise<{ ids: string[]; nextPageToken: string | null }>;
  message(id: string): Promise<MessageData>;
}
export interface BatchStore {
  savePage(ids: string[], nextPageToken: string | null): Promise<void>;
  commitMessage(
    messageId: string,
    data: MessageData,
    nextOffset: number,
  ): Promise<void>;
  finishPage(nextPageToken: string | null): Promise<void>;
  continuePage(): Promise<void>;
}

export async function processBatch(
  state: BatchState,
  source: BatchSource,
  store: BatchStore,
): Promise<void> {
  let ids = state.messageIds;
  let next = state.nextPageToken;
  if (ids.length === 0) {
    const page = await source.page(state.pageToken);
    ids = page.ids;
    next = page.nextPageToken;
    await store.savePage(ids, next);
  }
  const end = Math.min(ids.length, state.offset + 10);
  for (let offset = state.offset; offset < end; offset++) {
    const id = ids[offset];
    const data = await source.message(id);
    // Each message and its cursor advance are committed together. If a later
    // message fails, a retry starts at the last successful checkpoint.
    await store.commitMessage(id, data, offset + 1);
  }
  if (end >= ids.length) await store.finishPage(next);
  else await store.continuePage();
}
