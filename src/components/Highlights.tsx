// src/components/Highlights.tsx
import rawHighlights from "../../content/highlights.json";
import { HighlightsSchema, HighlightsConfig } from "@/schemas/contentSchemas";

let highlightsConfig: HighlightsConfig;
try {
  highlightsConfig = HighlightsSchema.parse(rawHighlights);
} catch (e) {
  console.error("Highlights config invalid:", e);
  // Safe fallback so the page still renders
  highlightsConfig = {
    items: [
      { icon: "🚧", title: "Highlights unavailable" },
      { icon: "🧩", title: "Using fallback content" },
      { icon: "✅", title: "Fix content/highlights.json to restore" },
    ],
  };
}

export default function Highlights() {
  return (
    <section className="bg-white dark:bg-gray-800 py-12">
      <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-3 gap-8">
        {highlightsConfig.items.map((item, idx) => {
          const content = (
            <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-700 p-6 rounded-xl shadow">
              <span className="text-2xl">{item.icon}</span>
              <span className="font-medium">{item.title}</span>
            </div>
          );

          // If an href is provided (schema allows optional), render as a link
          return item.href ? (
            <a key={idx} href={item.href} className="block">
              {content}
            </a>
          ) : (
            <div key={idx}>{content}</div>
          );
        })}
      </div>
    </section>
  );
}
