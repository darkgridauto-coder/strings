'use client';
const KEY = 'strings.feed.weights';
export const TOPICS = ['design', 'film', 'product', 'city', 'life', 'tech'] as const;
export type Topic = typeof TOPICS[number];
export type Mode = 'standard' | 'custom';

export function loadWeights(): { mode: Mode; weights: Record<Topic, number> } {
  const defaults: Record<Topic, number> = { design: 1, film: 1, product: 1, city: 1, life: 1, tech: 1 };
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && raw.weights) return { mode: raw.mode || 'standard', weights: { ...defaults, ...raw.weights } };
  } catch {}
  return { mode: 'standard', weights: defaults };
}
export function saveWeights(mode: Mode, weights: Record<Topic, number>) {
  localStorage.setItem(KEY, JSON.stringify({ mode, weights }));
}
export function scorePost(body: string, weights: Record<Topic, number>): number {
  const lower = body.toLowerCase();
  let score = 0;
  for (const t of TOPICS) if (lower.includes(t)) score += weights[t] - 1;
  return score;
}
