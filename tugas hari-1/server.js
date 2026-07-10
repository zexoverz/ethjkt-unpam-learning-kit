const fs = require("fs");
const http = require("http");
const path = require("path");

const PORT = 8000;
const ROOT = __dirname;

const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const pathname = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const filePath = path.join(ROOT, pathname);
  const normalizedPath = path.normalize(filePath);

  if (!normalizedPath.startsWith(ROOT)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(normalizedPath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": CONTENT_TYPES[path.extname(normalizedPath)] ?? "text/plain",
    });
    response.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Arknights gacha app: http://localhost:${PORT}`);
});
