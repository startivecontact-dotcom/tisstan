import type { Goals, Meal, SleepEntry, UserProfile, WeightEntry, Workout } from '@/types/models';
import { totalsOfFoods, totalsOfMeals, type MacroTotals } from '@/utils/nutrition';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const MODEL = 'gemini-2.0-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export const isAiEnabled = Boolean(API_KEY);

interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

/**
 * Appel unique à Gemini. Toute l'IA de l'app passe par ici.
 * Retourne `null` si l'API n'est pas configurée ou en cas d'erreur réseau,
 * afin que chaque fonction puisse retomber sur son mode hors-ligne.
 */
async function askGemini(parts: GeminiPart[], system?: string): Promise<string | null> {
  if (!API_KEY) return null;
  try {
    const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(system ? { system_instruction: { parts: [{ text: system }] } } : {}),
        contents: [{ role: 'user', parts }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

const COACH_SYSTEM =
  'Tu es le coach personnel de l’application TisStan, utilisée par deux amis, Stanne et Tissam. ' +
  'Tu es expert en nutrition, musculation, sommeil, organisation et motivation. ' +
  'Réponds en français, de façon concise, concrète et motivante. Tutoie l’utilisateur.';

// ------------------------------------------------------------------
// Contexte utilisateur injecté dans les prompts.
// ------------------------------------------------------------------

export interface CoachContext {
  profile: UserProfile;
  lastWeights: WeightEntry[];
  todayMeals: Meal[];
  lastSleep?: SleepEntry;
  recentWorkouts: Workout[];
}

function contextBlock(ctx: CoachContext): string {
  const w = ctx.lastWeights[0]?.weightKg;
  const totals = totalsOfMeals(ctx.todayMeals);
  return [
    `Utilisateur : ${ctx.profile.name}`,
    `Poids actuel : ${w ?? '?'} kg (objectif ${ctx.profile.goals.weightKg} kg)`,
    `Aujourd'hui : ${Math.round(totals.calories)} kcal, ${Math.round(totals.proteinG)} g protéines (objectifs ${ctx.profile.goals.calories} kcal / ${ctx.profile.goals.proteinG} g)`,
    ctx.lastSleep ? `Dernier sommeil : ${ctx.lastSleep.durationH} h, qualité ${ctx.lastSleep.quality}/5` : '',
    `Séances (7 derniers jours) : ${ctx.recentWorkouts.length}`,
  ]
    .filter(Boolean)
    .join('\n');
}

// ------------------------------------------------------------------
// Fonctions IA — chacune a un fallback hors-ligne à base d'heuristiques.
// ------------------------------------------------------------------

/** Chat libre avec le coach. */
export async function coachChat(message: string, ctx: CoachContext): Promise<string> {
  const ai = await askGemini(
    [{ text: `Contexte:\n${contextBlock(ctx)}\n\nQuestion de ${ctx.profile.name} : ${message}` }],
    COACH_SYSTEM,
  );
  if (ai) return ai;
  return offlineCoach(message, ctx);
}

/** Analyse d'un repas saisi manuellement. */
export async function analyzeMeal(meal: Meal, goals: Goals): Promise<string> {
  const t = totalsOfFoods(meal.foods);
  const desc = meal.foods.map((f) => `${f.name} (${f.quantity})`).join(', ');
  const ai = await askGemini(
    [{
      text:
        `Analyse ce repas : ${desc}. Totaux : ${Math.round(t.calories)} kcal, ` +
        `${Math.round(t.proteinG)} g protéines, ${Math.round(t.carbsG)} g glucides, ${Math.round(t.fatG)} g lipides, ` +
        `${Math.round(t.sodiumMg)} mg sodium. Objectifs journaliers : ${goals.calories} kcal / ${goals.proteinG} g protéines. ` +
        'Donne 2-3 phrases : points forts, points faibles, une amélioration concrète.',
    }],
    COACH_SYSTEM,
  );
  return ai ?? offlineMealAnalysis(t, goals);
}

/** Analyse d'une photo de repas (reconnaissance + estimation nutritionnelle). */
export async function analyzeMealPhoto(base64: string, mimeType = 'image/jpeg'): Promise<string> {
  const ai = await askGemini(
    [
      { inline_data: { mime_type: mimeType, data: base64 } },
      {
        text:
          'Identifie les aliments sur cette photo de repas. Pour chaque aliment, estime la quantité, ' +
          'les calories, protéines, glucides et lipides. Termine par le total estimé et une suggestion d’amélioration. ' +
          'Réponds en français, format liste courte.',
      },
    ],
    COACH_SYSTEM,
  );
  return (
    ai ??
    'Mode démo : la reconnaissance photo nécessite une clé Gemini (EXPO_PUBLIC_GEMINI_API_KEY dans .env). ' +
      'Ajoute les aliments manuellement en attendant — l’analyse nutritionnelle fonctionne quand même !'
  );
}

/** Commentaire automatique sur une nouvelle pesée. */
export async function weightComment(entries: WeightEntry[], goals: Goals): Promise<string> {
  if (entries.length === 0) return 'Ajoute ta première pesée pour démarrer le suivi !';
  const latest = entries[0];
  const weekAgo = entries.find((e) => e.date <= addDaysISO(latest.date, -6));
  const delta = weekAgo ? latest.weightKg - weekAgo.weightKg : 0;
  const ai = await askGemini(
    [{
      text:
        `Nouvelle pesée : ${latest.weightKg} kg. Variation sur 7 jours : ${delta.toFixed(1)} kg. ` +
        `Objectif : ${goals.weightKg} kg. Donne un commentaire de coach en 1-2 phrases.`,
    }],
    COACH_SYSTEM,
  );
  if (ai) return ai;
  const toGoal = latest.weightKg - goals.weightKg;
  if (Math.abs(toGoal) < 0.5) return '🎯 Objectif atteint ! Maintenant, on stabilise.';
  if (delta < -0.2) return `📉 -${Math.abs(delta).toFixed(1)} kg cette semaine, excellent rythme. Plus que ${toGoal.toFixed(1)} kg vers l’objectif.`;
  if (delta > 0.2) return `📈 +${delta.toFixed(1)} kg cette semaine. Vérifie l’hydratation et le sodium avant de t’inquiéter — regarde la tendance sur 2 semaines.`;
  return 'Poids stable. Si tu vises une perte, crée un léger déficit : -200 kcal/jour ou +2 000 pas.';
}

/** Conseil sommeil basé sur les dernières nuits. */
export async function sleepAdvice(entries: SleepEntry[], goals: Goals): Promise<string> {
  if (entries.length === 0) return 'Enregistre ta première nuit pour recevoir des conseils.';
  const recent = entries.slice(0, 7);
  const avg = recent.reduce((a, e) => a + e.durationH, 0) / recent.length;
  const ai = await askGemini(
    [{
      text:
        `Moyenne de sommeil sur ${recent.length} nuits : ${avg.toFixed(1)} h (objectif ${goals.sleepHours} h). ` +
        `Qualité moyenne : ${(recent.reduce((a, e) => a + e.quality, 0) / recent.length).toFixed(1)}/5. ` +
        'Donne un conseil de coach en 2 phrases.',
    }],
    COACH_SYSTEM,
  );
  if (ai) return ai;
  if (avg < goals.sleepHours - 1)
    return `😴 ${avg.toFixed(1)} h de moyenne, c’est ${(goals.sleepHours - avg).toFixed(1)} h sous ton objectif. Avance ton coucher de 30 min cette semaine et coupe les écrans 1 h avant.`;
  if (avg >= goals.sleepHours) return `✅ ${avg.toFixed(1)} h de moyenne — ta récupération est solide, ça se verra sur tes perfs.`;
  return `Tu es proche de ton objectif (${avg.toFixed(1)} h / ${goals.sleepHours} h). Une routine de coucher fixe fera la différence.`;
}

/** Insight du jour pour le dashboard. */
export function dailyInsight(ctx: CoachContext): string {
  const totals = totalsOfMeals(ctx.todayMeals);
  const proteinPct = ctx.profile.goals.proteinG ? totals.proteinG / ctx.profile.goals.proteinG : 0;
  if (ctx.todayMeals.length === 0) return '🍳 Commence par enregistrer ton petit déjeuner pour lancer la journée.';
  if (proteinPct < 0.5) return `🍗 Tu es à ${Math.round(totals.proteinG)} g de protéines — vise ${ctx.profile.goals.proteinG} g. Ajoute une source à ton prochain repas.`;
  if (ctx.lastSleep && ctx.lastSleep.durationH < ctx.profile.goals.sleepHours - 1.5)
    return '😴 Nuit courte : privilégie une séance légère et couche-toi tôt ce soir.';
  if (ctx.recentWorkouts.length >= ctx.profile.goals.workoutsPerWeek)
    return '🔥 Objectif séances de la semaine atteint — pense à la récupération !';
  return '💪 Tout est en place. Une séance aujourd’hui te rapprocherait encore de ton objectif.';
}

// ------------------------------------------------------------------
// Fallbacks hors-ligne.
// ------------------------------------------------------------------

function offlineMealAnalysis(t: MacroTotals, goals: Goals): string {
  const tips: string[] = [];
  const mealProteinTarget = goals.proteinG / 3.5;
  if (t.proteinG < mealProteinTarget) tips.push(`Ton repas manque de protéines (${Math.round(t.proteinG)} g) — vise ~${Math.round(mealProteinTarget)} g par repas.`);
  else tips.push(`Bon apport en protéines (${Math.round(t.proteinG)} g) 💪`);
  if (t.sodiumMg > 800) tips.push(`Attention au sodium (${Math.round(t.sodiumMg)} mg sur ce repas).`);
  if (t.fiberG < 5) tips.push('Ajoute des légumes ou des fibres pour la satiété.');
  if (t.calories > goals.calories * 0.5) tips.push(`Repas copieux (${Math.round(t.calories)} kcal) — allège le prochain.`);
  return tips.slice(0, 3).join(' ');
}

function offlineCoach(message: string, ctx: CoachContext): string {
  const m = message.toLowerCase();
  const totals = totalsOfMeals(ctx.todayMeals);
  if (m.includes('programme') && (m.includes('sport') || m.includes('muscu') || m.includes('entra')))
    return 'Voici une base solide : Push / Pull / Legs sur 4 jours.\n\n• Jour 1 — Push : développé couché 4×8, militaire 3×10, dips 3×max\n• Jour 2 — Pull : tractions 4×max, rowing 4×10, curl 3×12\n• Jour 3 — Repos actif (marche 30 min)\n• Jour 4 — Legs : squat 4×8, RDL 3×10, fentes 3×12\n\nAugmente les charges de 2,5 kg dès que tu boucles toutes les séries. Tes modèles de séance sont prêts dans l’onglet Sport !';
  if (m.includes('nutrition') || m.includes('repas') || m.includes('manger'))
    return `Aujourd'hui tu es à ${Math.round(totals.calories)} kcal et ${Math.round(totals.proteinG)} g de protéines (objectifs : ${ctx.profile.goals.calories} kcal / ${ctx.profile.goals.proteinG} g). Règle simple : une source de protéines à chaque repas, des légumes sur la moitié de l’assiette, et garde les glucides autour de l’entraînement.`;
  if (m.includes('sommeil') || m.includes('dormir'))
    return ctx.lastSleep
      ? `Ta dernière nuit : ${ctx.lastSleep.durationH} h (qualité ${ctx.lastSleep.quality}/5). Vise ${ctx.profile.goals.sleepHours} h avec un coucher fixe, chambre fraîche et zéro écran 45 min avant.`
      : `Vise ${ctx.profile.goals.sleepHours} h par nuit. Le levier n°1 : une heure de coucher fixe, même le week-end.`;
  if (m.includes('motiv'))
    return `${ctx.profile.name}, regarde d’où tu pars : ${ctx.recentWorkouts.length} séance(s) cette semaine, un suivi quotidien en place. La motivation suit l’action — fais la prochaine petite chose (un verre d’eau, 10 pompes) et le reste s’enchaîne. 🔥`;
  if (m.includes('poids') || m.includes('maigrir') || m.includes('perdre'))
    return `Ton poids actuel : ${ctx.lastWeights[0]?.weightKg ?? '?'} kg, objectif ${ctx.profile.goals.weightKg} kg. Le combo gagnant : déficit léger (-300 kcal), protéines hautes (${ctx.profile.goals.proteinG} g), 8 000+ pas/jour et 3-4 séances. La balance fluctue — juge la tendance sur 2 semaines.`;
  return `Bonne question ! En mode démo je réponds avec mes connaissances de base — ajoute une clé Gemini dans .env pour un coach complet. En attendant : dis-moi « programme sport », « nutrition », « sommeil », « poids » ou « motivation » et je te donne un plan concret.`;
}

function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
