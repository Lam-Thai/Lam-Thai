import { Resend } from "resend";
import { NextResponse } from "next/server";

// In-memory rate limiting (for simple use case)
// For production, consider using Redis or a database
const emailTracker = new Map();

const RATE_LIMIT = 3;
const TIME_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function getRateLimitKey(email, ip) {
  // Use both email and IP for better tracking
  return `${email}_${ip}`;
}

function checkRateLimit(key) {
  const now = Date.now();
  const userSubmissions = emailTracker.get(key) || [];

  // Filter out submissions older than the time window
  const recentSubmissions = userSubmissions.filter(
    (timestamp) => now - timestamp < TIME_WINDOW,
  );

  if (recentSubmissions.length >= RATE_LIMIT) {
    // Calculate when they can submit again
    const oldestSubmission = Math.min(...recentSubmissions);
    const resetTime = new Date(oldestSubmission + TIME_WINDOW);
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime,
    };
  }

  return {
    allowed: true,
    remainingAttempts: RATE_LIMIT - recentSubmissions.length,
    resetTime: null,
  };
}

function recordSubmission(key) {
  const now = Date.now();
  const userSubmissions = emailTracker.get(key) || [];

  // Add new submission and filter old ones
  const recentSubmissions = userSubmissions.filter(
    (timestamp) => now - timestamp < TIME_WINDOW,
  );
  recentSubmissions.push(now);

  emailTracker.set(key, recentSubmissions);
}

export async function POST(request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json(
        { error: "Email service is not configured" },
        { status: 503 },
      );
    }

    const resend = new Resend(resendApiKey);

    const { name, email, subject, message } = await request.json();

    // Validate input
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    // Get client IP address
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    // Check rate limit
    const rateLimitKey = getRateLimitKey(email, ip);
    const rateLimit = checkRateLimit(rateLimitKey);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `You've reached the maximum of ${RATE_LIMIT} messages per day. Please try again after ${rateLimit.resetTime.toLocaleString()}.`,
          resetTime: rateLimit.resetTime.toISOString(),
        },
        { status: 429 }, // Too Many Requests
      );
    }

    const data = await resend.emails.send({
      from: "Portfolio Contact <onboarding@resend.dev>",
      to: ["tuoclamthai@gmail.com"],
      replyTo: email,
      subject: `Portfolio Contact: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    });

    // Record the submission
    recordSubmission(rateLimitKey);

    return NextResponse.json(
      {
        success: true,
        data,
        remainingAttempts: rateLimit.remainingAttempts - 1,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
