// scripts/ai/updateHighlights.mjs
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { z } from "zod";
import OpenAI from "openai";

dotenv.config({ path: ".env.local" });
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// keep in sync with app schema
const HighlightsSchema = z.object({
  items: z
    .array(
      z.object({
        icon: z.string().min(1),
        title: z.string().min(3),
        href: z.string().url().optional(),
      })
    )
    .min(1),
});

const root = process.cwd();
const filePath = path.join(root, "content", "highlights.json");
const dumpPath = path.join(root, "content", "highlights_proposed_dump.json");

const systemPrompt = `
You are a social/content strategist.
Return ONLY a JSON object matching this schema:
{
  "items": [
    { "icon": "emoji", "title": "short, punchy line", "href"?: "https://..." },
    ...
  ]
}
Guidelines:
- 3 to 5 items.
- Icons must be a single emoji character.
- Titles 3–8 words, modern tone.
- If adding href, it must be a valid full URL (https://...).
- JSON only, no commentary.
`;

function seedExample() {
  return {
    items: [
      { icon: "🚀", title: "Fresh AI-driven hero update" },
      { icon: "🎨", title: "Modern, accessible design tokens" },
      { icon: "⚡", title: "Auto-PRs with safety checks" },
    ],
  };
}

async function main() {
  const current = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: JSON.stringify({
          currentHighlights: current,
          context:
            "Site: AutoModern — autonomous AI that updates sections and ships PRs",
          goals: [
            "Rotate highlights to feel current and exciting",
            "Optional: add useful external links with https://",
          ],
          example: seedExample(),
        }),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  fs.writeFileSync(dumpPath, raw, "utf-8");

  let proposed;
  try {
    proposed = JSON.parse(raw);
  } catch {
    console.error("Bad JSON, see dump:", dumpPath);
    process.exit(1);
  }

  const parsed = HighlightsSchema.safeParse(proposed);
  if (!parsed.success) {
    console.error("Failed schema:", parsed.error.issues);
    console.error("See dump:", dumpPath);
    process.exit(1);
  }

  fs.writeFileSync(filePath, JSON.stringify(parsed.data, null, 2), "utf-8");
  console.log("✅ highlights.json updated.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
