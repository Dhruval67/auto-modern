// src/schemas/contentSchemas.ts
import { z } from "zod";

export const HeroSchema = z.object({
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
  // optional image block the AI can toggle on or off
  media: z
    .object({
      kind: z.enum(["none", "shape", "image"]).default("shape"),
      imageUrl: z.string().url().optional(),
      alt: z.string().optional(),
    })
    .optional(),
});

export type HeroConfig = z.infer<typeof HeroSchema>;

export const HighlightsSchema = z.object({
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

export type HighlightsConfig = z.infer<typeof HighlightsSchema>;
