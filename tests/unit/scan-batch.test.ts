import assert from "node:assert/strict";
import test from "node:test";
import {
  processBatch,
  type BatchSource,
  type BatchState,
  type BatchStore,
  type MessageData,
} from "../../lib/scan-batch";
import { attachmentDisposition } from "../../lib/file-headers";
import { attachments, decodeBase64Url } from "../../lib/gmail";

function harness(ids: string[], next: string | null = null) {
  const state: BatchState = {
    messageIds: [],
    offset: 0,
    pageToken: null,
    nextPageToken: null,
  };
  const commits: string[] = [];
  let processed = 0;
  let failed: string | null = null;
  let pageCalls = 0;
  let status = "queued";
  const source: BatchSource = {
    async page() {
      pageCalls++;
      return { ids, nextPageToken: next };
    },
    async message(id) {
      if (id === failed) throw new Error("Temporary Gmail failure");
      return { date: null, parts: [] };
    },
  };
  const store: BatchStore = {
    async savePage(messageIds, nextPageToken) {
      state.messageIds = [...messageIds];
      state.nextPageToken = nextPageToken;
    },
    async commitMessage(id: string, _data: MessageData, nextOffset: number) {
      commits.push(id);
      processed++;
      state.offset = nextOffset;
    },
    async finishPage(nextPageToken) {
      state.messageIds = [];
      state.offset = 0;
      state.pageToken = nextPageToken;
      state.nextPageToken = null;
      status = nextPageToken ? "running" : "completed";
    },
    async continuePage() {
      status = "running";
    },
  };
  return {
    state,
    commits,
    source,
    store,
    fail(id: string | null) {
      failed = id;
    },
    get processed() {
      return processed;
    },
    get pageCalls() {
      return pageCalls;
    },
    get status() {
      return status;
    },
  };
}

test("a batch checks at most ten messages and resumes the saved snapshot", async () => {
  const h = harness(Array.from({ length: 15 }, (_, i) => `message-${i}`));
  await processBatch({ ...h.state }, h.source, h.store);
  assert.equal(h.processed, 10);
  assert.equal(h.state.offset, 10);
  assert.equal(h.status, "running");
  await processBatch({ ...h.state }, h.source, h.store);
  assert.equal(h.processed, 15);
  assert.equal(new Set(h.commits).size, 15);
  assert.equal(h.pageCalls, 1);
  assert.equal(h.status, "completed");
});

test("a partial failure retries only uncommitted messages", async () => {
  const h = harness(["a", "b", "c"]);
  h.fail("b");
  await assert.rejects(
    processBatch({ ...h.state }, h.source, h.store),
    /Temporary Gmail failure/,
  );
  assert.deepEqual(h.commits, ["a"]);
  assert.equal(h.state.offset, 1);
  h.fail(null);
  await processBatch({ ...h.state }, h.source, h.store);
  assert.deepEqual(h.commits, ["a", "b", "c"]);
  assert.equal(h.processed, 3);
  assert.equal(h.pageCalls, 1);
});

test("a full page advances to the next page token without losing the cursor", async () => {
  const h = harness(["a", "b"], "page-2");
  await processBatch({ ...h.state }, h.source, h.store);
  assert.equal(h.state.pageToken, "page-2");
  assert.equal(h.state.offset, 0);
  assert.deepEqual(h.state.messageIds, []);
  assert.equal(h.status, "running");
});

test("an empty terminal page completes without fetching a message", async () => {
  const h = harness([]);
  await processBatch({ ...h.state }, h.source, h.store);
  assert.equal(h.status, "completed");
  assert.equal(h.processed, 0);
});

test("an attachment commit failure preserves the uncommitted message for retry", async () => {
  const h = harness(["a"]);
  const store = {
    ...h.store,
    async commitMessage() {
      throw new Error("Transaction rolled back");
    },
  };
  await assert.rejects(
    processBatch({ ...h.state }, h.source, store),
    /rolled back/,
  );
  assert.equal(h.state.offset, 0);
  assert.equal(h.processed, 0);
});

test("nested MIME parts include named zero-byte files and ignore email bodies", () => {
  const result = attachments({
    mimeType: "multipart/mixed",
    parts: [
      { mimeType: "text/plain", body: { data: "hello", size: 5 } },
      {
        parts: [
          { partId: "2.1", filename: "empty.txt", body: { data: "", size: 0 } },
          {
            partId: "2.2",
            filename: "paper.pdf",
            body: { attachmentId: "gmail-id", size: 5 },
          },
        ],
      },
    ],
  });
  assert.deepEqual(
    result.map((part) => part.filename),
    ["empty.txt", "paper.pdf"],
  );
  assert.equal(decodeBase64Url("aGVsbG8").toString(), "hello");
});

test("download headers prevent injection and preserve international filenames", () => {
  const header = attachmentDisposition('Résumé "final"\r\n.pdf');
  assert.ok(!header.includes("\r") && !header.includes("\n"));
  assert.ok(header.includes("filename*=UTF-8''R%C3%A9sum%C3%A9"));
  assert.ok(header.includes('filename="R_sum_ _final___.pdf"'));
});
