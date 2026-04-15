import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { dbPool } from "./_lib/postgres";

const requestSchema = z.object({
  email: z.string().trim().email().max(320),
  source: z.string().trim().max(64).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

type NotifyResponse = { ok: boolean; message: string };

function json(res: VercelResponse, status: number, body: NotifyResponse): VercelResponse {
  return res.status(status).json(body);
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { ok: false, message: "Method not allowed." });
  }

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return json(res, 400, { ok: false, message: "Please provide a valid email address." });
  }

  const email = parsed.data.email.toLowerCase();
  const source = parsed.data.source?.trim() || "site_contact_notify";
  const metadata = parsed.data.metadata ?? {};

  try {
    await dbPool.query(
      `
        INSERT INTO waitlist_signups (email, source, metadata)
        VALUES ($1, $2, $3::jsonb)
        ON CONFLICT (email) DO UPDATE SET
          source = EXCLUDED.source,
          metadata = waitlist_signups.metadata || EXCLUDED.metadata
      `,
      [email, source, JSON.stringify(metadata)],
    );

    return json(res, 200, {
      ok: true,
      message: "Thanks. You are on the waitlist.",
    });
  } catch (error) {
    console.error("notify waitlist insert failed", error);
    return json(res, 500, {
      ok: false,
      message: "Unable to save your request right now.",
    });
  }
}
