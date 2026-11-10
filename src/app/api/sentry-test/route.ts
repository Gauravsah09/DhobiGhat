import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export async function GET() {
  const error = new Error("🚨 DhobiGhat Sentry Alert: Browser/API Test Triggered");

  const eventId = Sentry.captureException(error, {
    level: "error",
    tags: {
      source: "api_route",
      route: "/api/sentry-test",
      environment: process.env.NODE_ENV || "development",
    },
    extra: {
      triggeredAt: new Date().toISOString(),
      note: "Live Sentry alert dispatched from Next.js server route handler.",
    },
  });

  // Ensure the event is flushed immediately
  await Sentry.flush(2000);

  return NextResponse.json({
    status: "ok",
    message: "Test alert dispatched to Sentry successfully!",
    eventId,
    instructions: "Check your Sentry dashboard under Issues to see this alert in real time.",
    timestamp: new Date().toISOString(),
  });
}
