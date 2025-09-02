// scripts/ai/updateHero.mjs
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { z } from "zod";
import OpenAI from "openai";

dotenv.config({ path: ".env.local" });

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- Zod schema (kept in sync with your app) ---
const HeroSchema = z.object({
  variant: z.enum(["image-left", "image-right", "centered"]),
  headline: z.string().min(5),
  subheadline: z.string().min(5),
  primaryCta: z.object({
    label: z.string(),
    href: z.string().url().or(z.string().startsWith("/")),
  }),
  secondaryCta: z.object({
    label: z.string(),
    href: z.string().url().or(z.string().startsWith("/")),
  }),
  media: z
    .object({
      kind: z.enum(["none", "shape", "image"]).default("shape"),
      imageUrl: z.string().url().optional(),
      alt: z.string().optional(),
    })
    .optional(),
});

const root = process.cwd();
const heroPath = path.join(root, "content", "hero.json");
const dumpPath = path.join(root, "content", "hero_proposed_dump.json");

// Map loose variants to allowed enum
function normalizeVariant(v) {
  if (!v) return undefined;
  const s = String(v).toLowerCase().trim();
  if (["left", "imageleft", "img-left"].includes(s)) return "image-left";
  if (["right", "imageright", "img-right"].includes(s)) return "image-right";
  if (["center", "centred", "centered"].includes(s)) return "centered";
  if (["image-left", "image-right", "centered"].includes(s)) return s;
  return undefined;
}

// Ensure hrefs look like "/path" or "https://..."
function normalizeHref(href, fallback = "/") {
  if (typeof href !== "string" || href.length === 0) return fallback;
  if (
    href.startsWith("/") ||
    href.startsWith("http://") ||
    href.startsWith("https://")
  )
    return href;
  return `/${href.replace(/^\/+/, "")}`;
}

const systemPrompt = `
You are a senior product designer for a modern website.
Return ONLY a JSON object for the hero section that matches the schema explained below.
Do NOT include commentary, markdown, or code fences. JSON only.

Schema (keys and types must match):
{
  "variant": "image-left" | "image-right" | "centered",
  "headline": string,
  "subheadline": string,
  "primaryCta": { "label": string, "href": string ("/path" or "https://...") },
  "secondaryCta": { "label": string, "href": string ("/path" or "https://...") },
  "media": { "kind": "none" | "shape" | "image", "imageUrl"?: string("https://..."), "alt"?: string }
}

Design heuristics:
- Modern, minimal, high contrast, readable.
- Prefer "image-right" or "centered" for most weeks.
- Keep primary CTA to /get-started, secondary to /about (you may reword labels).
`;

function exampleJson() {
  return {
    variant: "image-right",
    headline: "Ship AI-driven websites effortlessly",
    subheadline:
      "AutoModern proposes and ships modern design updates with safety checks and instant deploys.",
    primaryCta: { label: "Get Started", href: "/get-started" },
    secondaryCta: { label: "Learn More", href: "/about" },
    media: { kind: "shape" },
  };
}

async function main() {
  const current = JSON.parse(fs.readFileSync(heroPath, "utf-8"));

  const userPrompt = {
    currentHero: current,
    siteContext:
      "Site: AutoModern — an autonomous system that updates sections and ships PRs with checks.",
    goals: [
      "Refresh headline/subheadline to feel contemporary.",
      "Pick the best variant for readability this week.",
      "Keep primary CTA to /get-started, secondary to /about; labels can be improved.",
    ],
    example: exampleJson(),
  };

  // Force JSON output via response_format
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(userPrompt) },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  // Optionally dump raw for debugging
  fs.writeFileSync(dumpPath, raw, "utf-8");

  let proposed = {};
  try {
    proposed = JSON.parse(raw);
  } catch (e) {
    console.error("LLM did not return parseable JSON. See dump at:", dumpPath);
    process.exit(1);
  }

  // --- normalization step (be forgiving, then validate strictly) ---
  if (proposed && typeof proposed === "object") {
    if (proposed.variant) {
      const nv = normalizeVariant(proposed.variant);
      if (nv) proposed.variant = nv;
    }
    if (proposed.primaryCta) {
      proposed.primaryCta.href = normalizeHref(
        proposed.primaryCta.href,
        "/get-started"
      );
    }
    if (proposed.secondaryCta) {
      proposed.secondaryCta.href = normalizeHref(
        proposed.secondaryCta.href,
        "/about"
      );
    }
    if (
      proposed.media &&
      proposed.media.kind &&
      typeof proposed.media.kind === "string"
    ) {
      const mk = proposed.media.kind.toLowerCase();
      if (!["none", "shape", "image"].includes(mk))
        proposed.media.kind = "shape";
      else proposed.media.kind = mk;
    }
  }

  // Validate against schema (now strict)
  const parsed = HeroSchema.safeParse(proposed);
  if (!parsed.success) {
    console.error(
      "Proposed hero failed schema validation:",
      parsed.error.issues
    );
    console.error("Full proposal saved at:", dumpPath);
    process.exit(1);
  }

  fs.writeFileSync(heroPath, JSON.stringify(parsed.data, null, 2), "utf-8");
  console.log("✅ hero.json updated.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
