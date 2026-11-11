"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { demoFiles, demoJobs, demoSummary } from "@/lib/demo";
import type { FileItem, ScanJobSummary, WorkspaceSummary } from "@/lib/types";

async function responseData<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      data.error ||
        (response.status === 401
          ? "Your session has ended. Please reconnect Gmail."
          : "Something went wrong. Please try again."),
    );
  return data as T;
}

export function useWorkspace(initialSummary: WorkspaceSummary, demo: boolean) {
  const [summary, setSummary] = useState(initialSummary);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [jobs, setJobs] = useState<ScanJobSummary[]>(demo ? demoJobs : []);
  const [sampleFiles, setSampleFiles] = useState(demoFiles);
  const [search, setSearch] = useState("");
  const [mime, setMime] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filesError, setFilesError] = useState(false);
  const [notice, setNotice] = useState("");
  const [version, setVersion] = useState(0);
  const [hydrated, setHydrated] = useState(!demo);
  const fileRequest = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const paging = useRef(false);
  const actionBusy = useRef(false);
  const mounted = useRef(true);
  const simulationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      fileRequest.current?.abort();
      if (simulationTimer.current) clearTimeout(simulationTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!demo) return;
    try {
      const saved = JSON.parse(
        sessionStorage.getItem("inboxvault-demo-v1") || "null",
      );
      if (
        saved &&
        Array.isArray(saved.jobs) &&
        Array.isArray(saved.files) &&
        saved.jobs.every(
          (j: ScanJobSummary) =>
            j &&
            typeof j.id === "string" &&
            typeof j.query === "string" &&
            ["queued", "running", "completed", "failed"].includes(j.status) &&
            typeof j.processed === "number" &&
            typeof j.found === "number" &&
            typeof j.createdAt === "string" &&
            typeof j.updatedAt === "string",
        ) &&
        saved.files.every(
          (f: FileItem) =>
            f &&
            typeof f.id === "string" &&
            typeof f.filename === "string" &&
            typeof f.mimeType === "string" &&
            typeof f.size === "number" &&
            (f.emailDate === null || typeof f.emailDate === "string"),
        )
      ) {
        setSampleFiles(saved.files);
        setJobs(saved.jobs);
        setSummary({
          ...demoSummary,
          totalFiles: saved.files.length,
          indexedBytes: saved.files.reduce(
            (sum: number, f: FileItem) => sum + f.size,
            0,
          ),
          latestJob: saved.jobs[0] || null,
        });
      }
    } catch {
      /* A demo always works without browser storage. */
    }
    setHydrated(true);
  }, [demo]);

  useEffect(() => {
    if (demo && hydrated) {
      try {
        sessionStorage.setItem(
          "inboxvault-demo-v1",
          JSON.stringify({ jobs, files: sampleFiles }),
        );
      } catch {
        /* Storage is optional. */
      }
    }
  }, [demo, hydrated, jobs, sampleFiles]);

  const refresh = useCallback(async () => {
    if (demo) {
      setVersion((v) => v + 1);
      return;
    }
    const [nextSummary, nextJobs] = await Promise.all([
      fetch("/api/summary", { cache: "no-store" }).then(
        responseData<WorkspaceSummary>,
      ),
      fetch("/api/jobs", { cache: "no-store" }).then(
        responseData<ScanJobSummary[]>,
      ),
    ]);
    if (!mounted.current) return;
    setSummary(nextSummary);
    setJobs(nextJobs);
    setVersion((v) => v + 1);
  }, [demo]);

  useEffect(() => {
    if (!demo)
      void refresh().catch((e) => {
        if (mounted.current) setError(e.message);
      });
  }, [demo, refresh]);

  useEffect(() => {
    const requestGeneration = ++generation.current;
    fileRequest.current?.abort();
    const controller = new AbortController();
    fileRequest.current = controller;
    paging.current = false;
    setCursor(null);
    setFiles([]);
    setLoading(true);
    setFilesError(false);
    const timer = setTimeout(
      async () => {
        if (demo) {
          setFiles(
            sampleFiles.filter(
              (f) =>
                f.filename
                  .toLowerCase()
                  .includes(search.toLowerCase().trim()) &&
                (!mime || f.mimeType.startsWith(mime)),
            ),
          );
          setLoading(false);
          return;
        }
        try {
          const params = new URLSearchParams({ search: search.trim(), mime });
          const data = await fetch("/api/files?" + params, {
            signal: controller.signal,
            cache: "no-store",
          }).then(
            responseData<{ files: FileItem[]; nextCursor: string | null }>,
          );
          if (
            generation.current === requestGeneration &&
            !controller.signal.aborted
          ) {
            setFiles(data.files);
            setCursor(data.nextCursor);
          }
        } catch (e) {
          if (!controller.signal.aborted && mounted.current) {
            setFilesError(true);
            setError(
              e instanceof Error ? e.message : "Files could not be loaded.",
            );
          }
        } finally {
          if (
            generation.current === requestGeneration &&
            !controller.signal.aborted
          )
            setLoading(false);
        }
      },
      search ? 250 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [demo, search, mime, version, sampleFiles]);

  async function loadMore() {
    if (!cursor || paging.current || loading || demo) return;
    paging.current = true;
    setLoading(true);
    const currentGeneration = generation.current;
    const currentCursor = cursor;
    try {
      const params = new URLSearchParams({
        search: search.trim(),
        mime,
        cursor: currentCursor,
      });
      const data = await fetch("/api/files?" + params, {
        signal: fileRequest.current?.signal,
        cache: "no-store",
      }).then(responseData<{ files: FileItem[]; nextCursor: string | null }>);
      if (generation.current === currentGeneration && mounted.current) {
        setFiles((old) => [
          ...old,
          ...data.files.filter(
            (f) => !old.some((existing) => existing.id === f.id),
          ),
        ]);
        setCursor(data.nextCursor);
      }
    } catch (e) {
      if (
        generation.current === currentGeneration &&
        mounted.current &&
        !(e instanceof DOMException && e.name === "AbortError")
      )
        setError(
          e instanceof Error ? e.message : "More files could not be loaded.",
        );
    } finally {
      if (generation.current === currentGeneration && mounted.current) {
        paging.current = false;
        setLoading(false);
      }
    }
  }

  async function start(query: string) {
    if (actionBusy.current) return false;
    actionBusy.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (demo) {
        const now = new Date().toISOString();
        const job: ScanJobSummary = {
          id: crypto.randomUUID(),
          query,
          status: "queued",
          processed: 0,
          found: 0,
          error: null,
          createdAt: now,
          updatedAt: now,
        };
        setJobs((old) => [job, ...old]);
        setSummary((old) => ({ ...old, latestJob: job }));
        setNotice(
          "Sample scan created. Process a batch to see how extraction works.",
        );
      } else {
        await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        }).then(responseData<ScanJobSummary>);
        await refresh();
        setNotice(
          "Your scan is ready. Process the first batch when you’re ready.",
        );
      }
      return true;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your scan could not be created.",
      );
      return false;
    } finally {
      actionBusy.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function run() {
    const job = summary.latestJob;
    if (!job || actionBusy.current) return;
    actionBusy.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (demo) {
        await new Promise<void>((resolve) => {
          simulationTimer.current = setTimeout(resolve, 900);
        });
        if (!mounted.current) return;
        const updated: ScanJobSummary = {
          ...job,
          status: job.processed >= 10 ? "completed" : "running",
          processed: job.processed + 10,
          found: job.query.includes("filename:pdf") ? 2 : 4,
          updatedAt: new Date().toISOString(),
        };
        setJobs((old) => old.map((j) => (j.id === job.id ? updated : j)));
        setSummary((old) => ({ ...old, latestJob: updated }));
        setNotice(
          updated.status === "completed"
            ? "Sample scan complete. The library contains fictional files only."
            : "10 sample messages checked. Continue with the next batch.",
        );
      } else {
        await fetch(`/api/jobs/${job.id}/run`, { method: "POST" }).then(
          responseData<ScanJobSummary>,
        );
        await refresh();
        setNotice("Batch processed. Your library is up to date.");
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "The batch could not be processed.",
      );
      if (!demo) await refresh().catch(() => {});
    } finally {
      actionBusy.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  function resetDemo() {
    setSampleFiles(demoFiles);
    setJobs(demoJobs);
    setSummary(demoSummary);
    setSearch("");
    setMime("");
    setError("");
    setNotice("Sample workspace reset.");
  }

  return {
    summary,
    files,
    jobs,
    search,
    setSearch,
    mime,
    setMime,
    cursor,
    loading,
    busy,
    error,
    filesError,
    setError,
    notice,
    setNotice,
    refresh,
    loadMore,
    start,
    run,
    resetDemo,
  };
}
