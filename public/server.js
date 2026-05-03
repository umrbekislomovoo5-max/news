import { createServer } from "http";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = process.env.PORT || 3000;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

const server = createServer(async (req, res) => {
  try {
    const requestPath = req.url === "/" ? "/index.html" : req.url;
    const safePath = path.normalize(requestPath).replace(/^\\.\\.(?:\\|\/|$)/, "");
    const filePath = path.join(__dirname, safePath);
    const ext = path.extname(filePath).toLowerCase();

    const content = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream"
    });
    res.end(content);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
  }
});

server.listen(port, () => {
  console.log(`frontend (public) running on http://localhost:${port}`);
});
