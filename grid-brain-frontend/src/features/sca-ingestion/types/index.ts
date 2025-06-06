import { z } from "zod";

export const ScaRecommendationSchema = z.object({
  id: z.string(),
  text: z.string(),
  priority: z.enum(["high", "medium", "low"]),
});

export const ScaQuadrantSchema = z.object({
  id: z.string(),
  name: z.string(),
  score: z.number().min(0).max(100),
  recommendations: z.array(ScaRecommendationSchema),
});

export const GridBriefSchema = z.object({
  version: z.string(),
  clientName: z.string(),
  assessmentDate: z.date(),
  quadrants: z.array(ScaQuadrantSchema),
});

export type ScaRecommendation = z.infer<typeof ScaRecommendationSchema>;
export type ScaQuadrant = z.infer<typeof ScaQuadrantSchema>;
export type GridBrief = z.infer<typeof GridBriefSchema>;
