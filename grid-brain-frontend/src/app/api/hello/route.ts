import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import promClient from "prom-client";

const counter = new promClient.Counter({
  name: "hello_requests_total",
  help: "Total number of requests to the hello API",
});

export async function GET() {
  counter.inc();
  const log = logger.child({ module: "api:hello" });
  log.info("Hello from the API!");
  return NextResponse.json({ message: "Hello, world!" });
}
