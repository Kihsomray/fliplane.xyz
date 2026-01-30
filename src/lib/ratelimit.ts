const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

const DEMO_LIMIT = 10;
const DEMO_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function checkDemoRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = ipRequestCounts.get(ip);

  if (!record || now > record.resetTime) {
    ipRequestCounts.set(ip, { count: 1, resetTime: now + DEMO_WINDOW_MS });
    return { allowed: true, remaining: DEMO_LIMIT - 1, resetIn: DEMO_WINDOW_MS };
  }

  if (record.count >= DEMO_LIMIT) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }

  record.count++;
  return { allowed: true, remaining: DEMO_LIMIT - record.count, resetIn: record.resetTime - now };
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRequestCounts.entries()) {
    if (now > record.resetTime) {
      ipRequestCounts.delete(ip);
    }
  }
}, 60 * 1000);
