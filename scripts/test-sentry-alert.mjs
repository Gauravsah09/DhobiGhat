import * as Sentry from "@sentry/nextjs";
import fs from "fs";

let dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
if (!dsn && fs.existsSync(".env.local")) {
  const content = fs.readFileSync(".env.local", "utf8");
  for (const line of content.split("\n")) {
    if (line.startsWith("NEXT_PUBLIC_SENTRY_DSN=")) {
      dsn = line.replace("NEXT_PUBLIC_SENTRY_DSN=", "").trim();
      break;
    }
  }
}

if (!dsn) {
  console.error("Error: No Sentry DSN found in environment or .env.local");
  process.exit(1);
}

console.log("Configuring Sentry with DSN:", dsn.substring(0, 32) + "...");

Sentry.init({
  dsn,
  enabled: true,
  tracesSampleRate: 1.0,
  debug: false,
});

Sentry.setTag("component", "dhobighat-lms");
Sentry.setTag("test_alert", "true");
Sentry.setUser({ id: "dhobighat-admin-01", username: "admin" });

const testError = new Error("🚨 DhobiGhat LMS Alert: Live Sentry Telemetry Verification Event");
const eventId = Sentry.captureException(testError, {
  level: "error",
  tags: {
    alert_type: "production_verification",
    system: "DhobiGhat Next.js",
  },
  extra: {
    dispatched_at: new Date().toISOString(),
    status: "Telemetry active and verified",
    note: "This alert confirms that Sentry error capturing and alerting is functioning end-to-end.",
  },
});

console.log(`✔ Sentry event captured! Event ID: ${eventId}`);
console.log("Flushing event envelope to Sentry ingest servers...");

const flushed = await Sentry.flush(8000);
if (flushed) {
  console.log(`✔ Sentry flush SUCCESSFUL! Event ${eventId} was delivered to your Sentry project.`);
} else {
  console.warn("⚠ Sentry flush timed out. Check network connection.");
}
