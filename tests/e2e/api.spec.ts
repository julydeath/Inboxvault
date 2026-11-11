import { test, expect } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";
import type { FileItem } from "../../lib/types";

const secret = "inboxvault-local-test-secret-not-for-production";
async function cookie(userId: string) {
  const token = await encode({
    secret,
    token: { userId, name: "Test Alice", email: "a@example.test" },
  });
  return { Cookie: `next-auth.session-token=${token}` };
}

test("private APIs reject anonymous requests", async ({ request }) => {
  for (const route of [
    "/api/files",
    "/api/jobs",
    "/api/summary",
    "/api/files/b-private-file/download",
  ])
    expect((await request.get(route)).status()).toBe(401);
  expect(
    (
      await request.post("/api/jobs", { data: { query: "has:attachment" } })
    ).status(),
  ).toBe(401);
  expect((await request.post("/api/jobs/tenant-b-job/run")).status()).toBe(401);
});

test("database-backed workspace isolates tenants, paginates, and reports actual totals", async ({
  request,
  page,
}) => {
  test.skip(
    !process.env.INBOXVAULT_TEST_DATABASE_URL,
    "Run npm run test:integration for the disposable PostgreSQL fixture.",
  );
  const headers = await cookie("tenant-a");
  const summary = await (await request.get("/api/summary", { headers })).json();
  expect(summary.totalFiles).toBe(55);
  expect(summary.indexedBytes).toBe(16_054_000);
  expect(summary.connection.email).toBe("a@example.test");
  expect(JSON.stringify(summary)).not.toContain("refreshToken");
  const first = await (await request.get("/api/files", { headers })).json();
  expect(first.files).toHaveLength(50);
  expect(first.nextCursor).toBe("a-file-049");
  const second = await (
    await request.get(`/api/files?cursor=${first.nextCursor}`, { headers })
  ).json();
  expect(second.files).toHaveLength(5);
  expect(second.nextCursor).toBeNull();
  expect(
    new Set([...first.files, ...second.files].map((file: FileItem) => file.id))
      .size,
  ).toBe(55);
  expect(
    (
      await request.get("/api/files?cursor=b-private-file", { headers })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.get("/api/files/b-private-file/download", { headers })
    ).status(),
  ).toBe(404);
  expect(
    (await request.get("/api/files/a-file-054/download", { headers })).status(),
  ).toBe(413);
  expect(
    (await request.post("/api/jobs/tenant-b-job/run", { headers })).status(),
  ).toBe(404);
  const jobs = await (await request.get("/api/jobs", { headers })).json();
  expect(jobs).toHaveLength(1);
  expect(jobs[0].id).toBe("tenant-a-completed");
  expect(jobs[0]).not.toHaveProperty("leaseToken");
  await page
    .context()
    .addCookies([
      {
        name: "next-auth.session-token",
        value: headers.Cookie.split("=")[1],
        url: "http://127.0.0.1:3100",
      },
    ]);
  await page.goto("/dashboard/files");
  await expect(
    page.getByRole("button", { name: "Résumé 0.pdf", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Load more files" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(55);
  await page
    .getByRole("textbox", { name: "Search filenames" })
    .fill("no-match");
  await expect(
    page.getByRole("heading", { name: "No files match just yet." }),
  ).toBeVisible();
});

test("concurrent scan creation and leased batches return a useful conflict", async ({
  request,
}) => {
  test.skip(
    !process.env.INBOXVAULT_TEST_DATABASE_URL,
    "Requires disposable PostgreSQL fixture.",
  );
  const headers = await cookie("tenant-a");
  const invalid = await request.post("/api/jobs", {
    headers,
    data: { query: "x".repeat(401) },
  });
  expect(invalid.status()).toBe(400);
  const results = await Promise.all([
    request.post("/api/jobs", { headers, data: { query: "has:attachment" } }),
    request.post("/api/jobs", { headers, data: { query: "has:attachment" } }),
  ]);
  expect(results.map((response) => response.status()).sort()).toEqual([
    201, 409,
  ]);
  const created = await results
    .find((response) => response.status() === 201)!
    .json();
  const db = new PrismaClient({
    datasources: { db: { url: process.env.INBOXVAULT_TEST_DATABASE_URL } },
  });
  try {
    await db.scanJob.update({
      where: { id: created.id },
      data: {
        leaseToken: "another-tab",
        leaseExpiresAt: new Date(Date.now() + 60_000),
      },
    });
    expect(
      (await request.post(`/api/jobs/${created.id}/run`, { headers })).status(),
    ).toBe(409);
    expect(
      (
        await request.post("/api/jobs/tenant-a-completed/run", { headers })
      ).status(),
    ).toBe(200);
  } finally {
    await db.$disconnect();
  }
});
