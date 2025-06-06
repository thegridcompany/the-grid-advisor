import { createServer } from "http";
import { parse } from "url";
import next from "next";
import promClient from "prom-client";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    if (pathname === "/metrics") {
      res.setHeader("Content-Type", promClient.register.contentType);
      res.end(promClient.register.metrics());
      return;
    }

    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log("> Ready on http://localhost:3000");
  });
});
