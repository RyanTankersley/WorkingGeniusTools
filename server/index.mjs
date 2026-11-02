import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(root, "data", "team.json");
const distPath = path.join(root, "dist");
const apiOnly = process.argv.includes("--api-only");
const port = Number(process.env.PORT ?? (apiOnly ? 3001 : 3000));
const workingGeniuses = new Set([
  "Wonder",
  "Invention",
  "Discernment",
  "Galvanizing",
  "Enablement",
  "Tenacity",
]);
const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
]);

function sendJson(response, status, value) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
}

function validateTeam(value) {
  if (!Array.isArray(value)) {
    throw new Error("Team data must be a JSON array.");
  }

  const names = new Set();
  for (const [index, member] of value.entries()) {
    const label = `Team member ${index + 1}`;
    if (
      member === null ||
      typeof member !== "object" ||
      typeof member.FNAME !== "string" ||
      !member.FNAME.trim() ||
      typeof member.LNAME !== "string" ||
      !member.LNAME.trim()
    ) {
      throw new Error(`${label} must have non-empty FNAME and LNAME strings.`);
    }

    const fullName = `${member.FNAME.trim()} ${member.LNAME.trim()}`.toLocaleLowerCase();
    if (names.has(fullName)) {
      throw new Error(`Duplicate team member name: ${member.FNAME.trim()} ${member.LNAME.trim()}.`);
    }
    names.add(fullName);

    const assignedTypes = [];
    for (const field of ["Geniuses", "Competencies", "Frustrations"]) {
      const assignments = member[field];
      if (!Array.isArray(assignments) || assignments.length !== 2) {
        throw new Error(`${label} must have exactly two ${field}.`);
      }
      if (
        assignments.some(
          (type) => typeof type !== "string" || !workingGeniuses.has(type),
        )
      ) {
        throw new Error(`${label} has an unknown Working Genius in ${field}.`);
      }
      assignedTypes.push(...assignments);
    }

    if (new Set(assignedTypes).size !== workingGeniuses.size) {
      throw new Error(`${label} must use each of the six Working Geniuses exactly once.`);
    }
  }
}

async function serveStatic(request, response, pathname) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.resolve(distPath, `.${decodeURIComponent(requestedPath)}`);
  if (filePath !== distPath && !filePath.startsWith(`${distPath}${path.sep}`)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  let contents;
  let resolvedPath = filePath;
  try {
    contents = await readFile(resolvedPath);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
    resolvedPath = path.join(distPath, "index.html");
    try {
      contents = await readFile(resolvedPath);
    } catch (fallbackError) {
      if (fallbackError?.code !== "ENOENT") {
        throw fallbackError;
      }
      response.writeHead(404);
      response.end("Build the app with npm run build before starting the production server.");
      return;
    }
  }

  response.writeHead(200, {
    "Content-Type": mimeTypes.get(path.extname(resolvedPath)) ?? "application/octet-stream",
  });
  response.end(contents);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  if (url.pathname === "/api/team") {
    if (request.method !== "GET") {
      response.writeHead(405, { Allow: "GET" });
      response.end();
      return;
    }

    try {
      const rawData = await readFile(dataPath, "utf8");
      const team = JSON.parse(rawData);
      validateTeam(team);
      sendJson(response, 200, team);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load team data.";
      console.error(`Failed to load ${dataPath}: ${message}`);
      sendJson(response, 500, { error: message });
    }
    return;
  }

  if (apiOnly) {
    sendJson(response, 404, { error: "Not found." });
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  try {
    await serveStatic(request, response, url.pathname);
  } catch (error) {
    console.error("Failed to serve the requested page:", error);
    response.writeHead(500);
    response.end("Unable to serve the requested page.");
  }
});

server.listen(port, () => {
  console.log(`Working Genius ${apiOnly ? "API" : "app"} listening on http://localhost:${port}`);
});
