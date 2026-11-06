import type { DemoState, Profile, Professional } from './demo-store.ts';
import { haversineKm } from './demo-store.ts';

/**
 * The initial, documented search weights. Keep these in one place so the
 * research prototype can tune them without changing the scoring algorithm.
 */
export const SEARCH_WEIGHTS = {
  skills: 0.4,
  proximity: 0.25,
  reliability: 0.2,
  availability: 0.15,
} as const;

/**
 * Bayesian prior used only to reduce the effect of tiny review samples.
 * It is an algorithm parameter, not a fabricated review shown to the client.
 */
export const RELIABILITY_PRIOR = { mean: 5, reviewCount: 3 } as const;

const GOMA_CENTER = { latitude: -1.67, longitude: 29.222 };
const AREA_CENTERS: Record<string, { latitude: number; longitude: number }> = {
  Himbi: { latitude: -1.665, longitude: 29.218 },
  Katindo: { latitude: -1.679, longitude: 29.226 },
  'Les Volcans': { latitude: -1.67, longitude: 29.239 },
  Mabanga: { latitude: -1.685, longitude: 29.235 },
  Birere: { latitude: -1.678, longitude: 29.245 },
  Kyeshero: { latitude: -1.654, longitude: 29.203 },
};

export type RankedProfessional = {
  profile: Profile;
  pro: Professional;
  km: number;
  score: number;
  reasons: string[];
  reliabilityAvailable: boolean;
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase('fr');
}

function skillMatchScore(pro: Professional, query: string): number | null {
  if (!query) return null;
  const normalizedQuery = normalize(query);
  const trade = normalize(pro.trade);
  const skills = pro.skills.map(normalize);
  if (trade === normalizedQuery || skills.includes(normalizedQuery)) return 1;
  if (trade.includes(normalizedQuery) || skills.some((skill) => skill.includes(normalizedQuery))) return 0.85;
  return null;
}

function reliabilityScore(pro: Professional): number | null {
  if (pro.reviewCount <= 0 || pro.ratingAverage <= 0) return null;
  const smoothedRating =
    (pro.ratingAverage * pro.reviewCount +
      RELIABILITY_PRIOR.mean * RELIABILITY_PRIOR.reviewCount) /
    (pro.reviewCount + RELIABILITY_PRIOR.reviewCount);
  return Math.max(0, Math.min(1, smoothedRating / 5));
}

function availabilityScore(availability: string): number | null {
  if (!availability.trim()) return null;
  if (availability === 'Disponible aujourd’hui') return 1;
  if (availability === 'Disponible demain') return 0.8;
  if (availability === 'Cette semaine') return 0.55;
  if (availability === 'Indisponible') return 0;
  return null;
}

export function rankMatches(
  state: DemoState,
  term: string,
  area: string,
  radiusKm: number,
  origin?: { latitude: number; longitude: number },
): RankedProfessional[] {
  const query = normalize(term);

  return state.professionals
    .filter(
      (professional) =>
        !professional.suspended &&
        professional.verificationStatus !== 'Refusé (démo)' &&
        professional.verificationStatus !== 'Suspendu (démo)',
    )
    .flatMap((pro) => {
      const profile = state.profiles.find((item) => item.id === pro.profileId);
      if (!profile) return [];
      if (
        area &&
        !pro.serviceArea.includes(area) &&
        profile.neighborhood !== area
      ) {
        return [];
      }

      const skillScore = skillMatchScore(pro, query);
      // A requested skill that does not match is excluded rather than rescued
      // by other criteria.
      if (query && skillScore === null) return [];

      const searchOrigin =
        origin ?? AREA_CENTERS[area] ?? GOMA_CENTER;
      const km = haversineKm(searchOrigin, {
        latitude: pro.latitude,
        longitude: pro.longitude,
      });
      if (km > radiusKm) return [];

      const proximityScore = Math.max(0, 1 - km / Math.max(radiusKm, 0.1));
      const reliability = reliabilityScore(pro);
      const availability = availabilityScore(pro.availability);
      const criteria: Array<{ score: number; weight: number; label: string }> = [
        { score: proximityScore, weight: SEARCH_WEIGHTS.proximity, label: 'Proximité' },
      ];
      const reasons = [
        `Proximité : ${km.toFixed(1)} km environ · ${Math.round(proximityScore * 100)}/100 (${SEARCH_WEIGHTS.proximity * 100} %)`,
      ];

      if (skillScore !== null) {
        criteria.push({ score: skillScore, weight: SEARCH_WEIGHTS.skills, label: 'Compétences' });
        reasons.unshift(
          `Compétences : ${Math.round(skillScore * 100)}/100 (${SEARCH_WEIGHTS.skills * 100} %)`,
        );
      } else {
        reasons.unshift('Compétences : aucun filtre métier saisi · poids redistribué');
      }

      if (reliability !== null) {
        criteria.push({ score: reliability, weight: SEARCH_WEIGHTS.reliability, label: 'Fiabilité' });
        reasons.push(
          `Fiabilité lissée : ${Math.round(reliability * 100)}/100 (${SEARCH_WEIGHTS.reliability * 100} %, avis fictifs en démo)`,
        );
      } else {
        reasons.push('Fiabilité : aucun avis disponible · poids redistribué');
      }

      if (availability !== null) {
        criteria.push({ score: availability, weight: SEARCH_WEIGHTS.availability, label: 'Disponibilité' });
        reasons.push(
          `Disponibilité : ${Math.round(availability * 100)}/100 (${SEARCH_WEIGHTS.availability * 100} %)`,
        );
      } else {
        reasons.push('Disponibilité : information absente · poids redistribué');
      }

      const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
      const score =
        totalWeight > 0
          ? Math.round(
              (criteria.reduce(
                (sum, criterion) => sum + criterion.score * criterion.weight,
                0,
              ) /
                totalWeight) *
                100,
            )
          : 0;
      reasons.push(`Poids disponibles renormalisés : ${Math.round(totalWeight * 100)} %`);

      return [
        {
          profile,
          pro,
          km,
          score,
          reasons,
          reliabilityAvailable: reliability !== null,
        },
      ];
    })
    .sort((a, b) => b.score - a.score);
}
