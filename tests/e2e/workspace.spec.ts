import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

test("landing explains the product, links to demo, and scrolls through extraction", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Your inbox\.\s*Your files\.\s*Finally, apart\./,
    }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await mkdir("artifacts", { recursive: true });
  await page.screenshot({
    path: "artifacts/landing-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.screenshot({
    path: "artifacts/landing-hero.png",
    animations: "disabled",
  });
  await page.evaluate(() => window.scrollTo(0, 650));
  await expect(page.locator(".story-step.active")).toContainText(
    "Make room for clarity",
  );
  await page.getByRole("link", { name: "How it works", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: /Your files deserve\s*a better address\./,
    }),
  ).toBeInViewport();
  await page
    .getByRole("link", { name: "Explore the demo", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "A little more clarity." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("demo library searches, filters, opens accessible details, and downloads an honest sample", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const apiRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/"))
      apiRequests.push(request.url());
  });
  await page.goto("/demo");
  await expect(
    page.getByRole("button", { name: "Brand guidelines.pdf", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await mkdir("artifacts", { recursive: true });
  await page.screenshot({
    path: "artifacts/workspace-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Attachments 8", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "A home for your files." }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Search filenames" }).fill("invoice");
  await expect(
    page.getByRole("button", { name: "Invoice — November.pdf", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Brand guidelines.pdf", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("textbox", { name: "Search filenames" })
    .fill("nothing matches");
  await expect(
    page.getByRole("heading", { name: "No files match just yet." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Filter file types" })
    .selectOption("application/pdf");
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Brand guidelines.pdf", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await dialog
    .getByRole("button", { name: "Download sample details (.txt)" })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("Brand guidelines.pdf.sample.txt");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await page
    .getByRole("combobox", { name: "Filter file types" })
    .selectOption("video/");
  await page
    .getByRole("button", { name: "Launch walkthrough.mp4", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Download sample details (.txt)" }),
  ).toBeDisabled();
  expect(apiRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test("sample scans resume across navigation and finish in explicit batches", async ({
  page,
}) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "New scan", exact: true }).click();
  await page.getByRole("button", { name: "Just PDFs", exact: false }).click();
  await page.getByRole("button", { name: "Create sample scan" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Process 10 messages" }).click();
  await expect(page.locator(".scan-activity-main")).toContainText(
    "10 messages checked",
  );
  await page.getByRole("link", { name: "Scan history", exact: true }).click();
  await expect(page.locator(".scan-activity-main")).toContainText(
    "10 messages checked",
  );
  await page.getByRole("button", { name: "Process 10 messages" }).click();
  await expect(
    page.locator(".scan-history-list article").first(),
  ).toContainText("20 messages checked");
  await expect(
    page.locator(".scan-history-list article").first(),
  ).toContainText("completed");
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(page.locator(".scan-activity-main")).toContainText(
    "30 messages checked",
  );
});

test("mobile navigation, reduced motion, and landing remain usable without overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => document.fonts.ready);
  await mkdir("artifacts", { recursive: true });
  await page.screenshot({
    path: "artifacts/landing-mobile.png",
    fullPage: true,
  });
  await page.goto("/demo");
  await expect(
    page.getByRole("button", { name: "Brand guidelines.pdf", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/workspace-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Make yourself at home." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Toggle navigation" }),
  ).toHaveAttribute("aria-expanded", "false");
});

test("unconfigured integration provides a useful alternative and unknown screens return 404", async ({
  page,
  request,
}) => {
  test.skip(
    Boolean(process.env.INBOXVAULT_TEST_DATABASE_URL),
    "This run uses configured test integration.",
  );
  await page.goto("/connect");
  await expect(
    page.getByText("Gmail connection is being prepared"),
  ).toBeVisible();
  await page.getByRole("link", { name: "Explore with sample files" }).click();
  await expect(
    page.getByRole("heading", { name: "A little more clarity." }),
  ).toBeVisible();
  expect((await request.get("/demo/not-a-page")).status()).toBe(404);
  expect((await request.get("/dashboard/not-a-page")).status()).toBe(404);
});

test("workspace and scan dialog have accessible controls and readable contrast", async ({
  page,
}) => {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  await page.goto("/demo/files");
  await expect(
    page.getByRole("button", { name: "Brand guidelines.pdf", exact: true }),
  ).toBeVisible();
  const report = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    report.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        failure: n.failureSummary,
      })),
    })),
  ).toEqual([]);
  await page.getByRole("button", { name: "New scan", exact: true }).click();
  const dialogReport = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    dialogReport.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        failure: n.failureSummary,
      })),
    })),
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "New scan", exact: true }),
  ).toBeFocused();
});
