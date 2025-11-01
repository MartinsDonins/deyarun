import * as Sentry from "@sentry/nextjs";

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Add some context to the error
    Sentry.setContext("sentry-test", {
      component: "web-frontend",
      test: "manual-error-generation",
      timestamp: new Date().toISOString()
    });

    // Add user context
    Sentry.setUser({
      id: "test-user",
      email: "test@runacademy.com",
      username: "sentry-test"
    });

    // Add tags
    Sentry.setTag("test-type", "manual");
    Sentry.setTag("environment", process.env.NODE_ENV);

    // Throw an intentional error for testing
    throw new Error("This is a test error for Sentry integration - Running Academy Web Frontend");

  } catch (error) {
    // Capture the error with Sentry
    Sentry.captureException(error);

    // Send response
    res.status(500).json({
      message: "Test error sent to Sentry",
      error: error.message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  }
}