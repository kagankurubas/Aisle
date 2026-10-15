import { authenticate } from "../server/payment.js";
import {
  GuideError,
  guideInput,
  guideConfig,
  reserveGuide,
  askGuide,
} from "../server/guide.js";

export function createGuideHandler({
  auth = authenticate,
  config = guideConfig,
  reserve = reserveGuide,
  ask = askGuide,
} = {}) {
  return async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const origin = req.headers.origin;
    if (
      ![
        "https://aisle-roan.vercel.app",
        "https://kagankurubas.github.io",
      ].includes(origin)
    )
      return res.status(403).json({ error: "This origin is not allowed." });
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type",
    );
    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "POST")
      return res.status(405).json({ error: "Use POST." });
    try {
      if (!String(req.headers["content-type"]).startsWith("application/json"))
        throw new GuideError("Use JSON.", 415);
      let body;
      try {
        const raw = req.body;
        const text =
          typeof raw === "string" ? raw : JSON.stringify(raw ?? null);
        if (Buffer.byteLength(text) > 6000)
          throw new GuideError("Request too large.", 413);
        body = typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch (e) {
        if (e instanceof GuideError) throw e;
        throw new GuideError("Invalid JSON.");
      }
      const input = guideInput(body);
      let uid;
      try {
        uid = await auth(req.headers.authorization);
      } catch {
        throw new GuideError(
          "Sign in with a verified or demo account to ask Pip.",
          401,
        );
      }
      const settings = config();
      await reserve(uid, settings);
      return res.status(200).json(await ask(input, settings));
    } catch (e) {
      // Never log prompts, responses, credentials, bearer tokens or provider errors.
      return res
        .status(e instanceof GuideError ? e.status : 503)
        .json({
          error:
            e instanceof GuideError
              ? e.message
              : "Pip is temporarily unavailable. Please try again.",
        });
    }
  };
}
export default createGuideHandler();
