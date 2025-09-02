// src/components/Hero.tsx
import rawHero from "../../content/hero.json";
import { HeroSchema, HeroConfig } from "@/schemas/contentSchemas";

let heroConfig: HeroConfig;
try {
  heroConfig = HeroSchema.parse(rawHero);
} catch (e) {
  console.error("Hero config invalid:", e);
  heroConfig = {
    variant: "image-right",
    headline: "Fallback Headline",
    subheadline: "Subheadline not available",
    primaryCta: { label: "Home", href: "/" },
    secondaryCta: { label: "About", href: "/about" },
    media: { kind: "shape" },
  };
}

function MediaBlock() {
  const media = heroConfig.media ?? { kind: "shape" as const };
  if (media.kind === "image" && media.imageUrl) {
    return (
      <img
        src={media.imageUrl}
        alt={media.alt ?? "Hero media"}
        className="w-full h-64 md:h-96 object-cover rounded-xl shadow"
      />
    );
  }
  // default decorative shape
  return (
    <div className="bg-gradient-to-br from-green-100 to-green-300 rounded-xl h-64 md:h-96 shadow-inner" />
  );
}

function CopyBlock() {
  return (
    <div>
      <h1 className="text-4xl md:text-5xl font-bold mb-4">
        {heroConfig.headline}
      </h1>
      <p className="text-lg md:text-xl mb-6 text-gray-700 dark:text-gray-300">
        {heroConfig.subheadline}
      </p>
      <div className="flex flex-wrap gap-4">
        <a
          href={heroConfig.primaryCta.href}
          className="px-5 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
        >
          {heroConfig.primaryCta.label}
        </a>
        <a
          href={heroConfig.secondaryCta.href}
          className="px-5 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
        >
          {heroConfig.secondaryCta.label}
        </a>
      </div>
    </div>
  );
}

export default function Hero() {
  // three layout variants
  if (heroConfig.variant === "centered") {
    return (
      <section className="bg-gray-50 dark:bg-gray-900 py-16">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            {heroConfig.headline}
          </h1>
          <p className="text-lg md:text-xl mb-8 text-gray-700 dark:text-gray-300">
            {heroConfig.subheadline}
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href={heroConfig.primaryCta.href}
              className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
            >
              {heroConfig.primaryCta.label}
            </a>
            <a
              href={heroConfig.secondaryCta.href}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
            >
              {heroConfig.secondaryCta.label}
            </a>
          </div>
          <div className="mt-10 flex justify-center">
            <div className="w-full max-w-3xl">
              <MediaBlock />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // split layouts
  const left =
    heroConfig.variant === "image-left" ? <MediaBlock /> : <CopyBlock />;
  const right =
    heroConfig.variant === "image-left" ? <CopyBlock /> : <MediaBlock />;

  return (
    <section className="bg-gray-50 dark:bg-gray-900 py-16">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        {left}
        {right}
      </div>
    </section>
  );
}
