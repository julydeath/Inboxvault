import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir, userInfo } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

function run(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv = process.env,
) {
  const result = spawnSync(command, args, { env, stdio: "inherit" });
  if (result.status !== 0)
    throw new Error(`${command} failed (${result.status})`);
}

async function main() {
  const directory = await mkdtemp(join(tmpdir(), "inboxvault-test-db-"));
  const socket = createServer();
  await new Promise<void>((resolve) => socket.listen(0, "127.0.0.1", resolve));
  const port = (socket.address() as { port: number }).port;
  await new Promise<void>((resolve, reject) =>
    socket.close((error) => (error ? reject(error) : resolve())),
  );
  const url = `postgresql://${encodeURIComponent(userInfo().username)}@127.0.0.1:${port}/postgres`;
  const env = {
    ...process.env,
    DATABASE_URL: url,
    INBOXVAULT_TEST_DATABASE_URL: url,
  };
  let started = false;
  let client: PrismaClient | undefined;
  try {
    run("initdb", [
      "-D",
      directory,
      "-A",
      "trust",
      "--no-locale",
      "-E",
      "UTF8",
    ]);
    run("pg_ctl", [
      "-D",
      directory,
      "-l",
      join(directory, "server.log"),
      "-o",
      `-h 127.0.0.1 -p ${port} -k ${directory} -F`,
      "-w",
      "start",
    ]);
    started = true;
    run("npx", ["prisma", "db", "push", "--skip-generate"], env);
    client = new PrismaClient({ datasources: { db: { url } } });
    await client.user.createMany({
      data: [
        { id: "tenant-a", email: "a@example.test", name: "Test Alice" },
        { id: "tenant-b", email: "b@example.test", name: "Test Bob" },
      ],
    });
    await client.gmailConnection.create({
      data: {
        userId: "tenant-a",
        refreshTokenEncrypted: "fictional-test-record-never-used-with-google",
      },
    });
    await client.attachment.createMany({
      data: [
        ...Array.from({ length: 55 }, (_, i) => ({
          id: `a-file-${String(i).padStart(3, "0")}`,
          userId: "tenant-a",
          gmailMessageId: `a-message-${i}`,
          partId: "1",
          filename: i === 0 ? "Résumé 0.pdf" : `Document ${i}.pdf`,
          mimeType: "application/pdf",
          size: i === 54 ? 16_000_000 : 1000,
          emailDate: new Date("2026-11-08T10:00:00Z"),
        })),
        {
          id: "b-private-file",
          userId: "tenant-b",
          gmailMessageId: "b-message",
          partId: "1",
          filename: "Private contract.pdf",
          mimeType: "application/pdf",
          size: 1000,
        },
      ],
    });
    await client.scanJob.createMany({
      data: [
        {
          id: "tenant-a-completed",
          userId: "tenant-a",
          query: "has:attachment",
          status: "completed",
          processed: 10,
          found: 2,
        },
        {
          id: "tenant-b-job",
          userId: "tenant-b",
          query: "private query",
          status: "queued",
        },
      ],
    });
    await client.$disconnect();
    client = undefined;
    run("npx", ["playwright", "test"], env);
  } finally {
    await client?.$disconnect();
    if (started)
      spawnSync("pg_ctl", ["-D", directory, "-m", "immediate", "-w", "stop"], {
        stdio: "inherit",
      });
    await rm(directory, { recursive: true, force: true });
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
