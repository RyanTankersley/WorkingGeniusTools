import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distPath = path.join(root, "dist");
const port = Number(process.env.PORT ?? 3000);
const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".svg", "image/svg+xml"],
]);

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
  response.end(request.method === "HEAD" ? undefined : contents);
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  try {
    await serveStatic(request, response, url.pathname);
  } catch (error) {
    console.error("Failed to serve the requested page:", error);
    response.writeHead(500);
    response.end("Unable to serve the requested page.");
  }
});

server.listen(port, () => {
  console.log(`Working Genius app listening on http://localhost:${port}`);
});
