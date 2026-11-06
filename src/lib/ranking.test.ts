import assert from 'node:assert/strict';
import test from 'node:test';
import type { DemoState } from './demo-store.ts';
import { rankMatches } from './ranking.ts';

function createState(): DemoState {
  return {
    profiles: [
      { id: 'near', name: 'Profil démo proche', role: 'Électricité', avatar: '01', neighborhood: 'Himbi', phone: 'Non attribué (démo)' },
      { id: 'far', name: 'Profil démo éloigné', role: 'Électricité', avatar: '02', neighborhood: 'Kyeshero', phone: 'Non attribué (démo)' },
      { id: 'suspended', name: 'Profil démo suspendu', role: 'Électricité', avatar: '03', neighborhood: 'Himbi', phone: 'Non attribué (démo)' },
    ],
    professionals: [
      { profileId: 'near', trade: 'Électricité', skills: ['Dépannage'], experienceYears: 2, description: 'Profil fictif', indicativeRate: 'Sur devis', availability: 'Disponible aujourd’hui', verificationStatus: 'Profil fictif', serviceArea: ['Himbi'], latitude: -1.67, longitude: 29.222, reviewCount: 1, ratingAverage: 5, portfolio: [] },
      { profileId: 'far', trade: 'Électricité', skills: ['Installation électrique'], experienceYears: 2, description: 'Profil fictif', indicativeRate: 'Sur devis', availability: 'Disponible demain', verificationStatus: 'Profil fictif', serviceArea: ['Kyeshero'], latitude: -1.70, longitude: 29.24, reviewCount: 0, ratingAverage: 0, portfolio: [] },
      { profileId: 'suspended', trade: 'Électricité', skills: ['Dépannage'], experienceYears: 2, description: 'Profil fictif', indicativeRate: 'Sur devis', availability: 'Disponible aujourd’hui', verificationStatus: 'Suspendu (démo)', serviceArea: ['Himbi'], latitude: -1.67, longitude: 29.222, reviewCount: 10, ratingAverage: 5, portfolio: [] },
    ],
    categories: [],
    requests: [],
    reviews: [],
    favorites: [],
    reports: [],
  };
}

test('excludes non-matching and suspended professionals', () => {
  const results = rankMatches(createState(), 'plomberie', '', 20);
  assert.deepEqual(results, []);

  const matches = rankMatches(createState(), 'dépannage', '', 20);
  assert.deepEqual(matches.map(({ pro }) => pro.profileId), ['near']);
});

test('renormalizes weights when a reliability value is unavailable', () => {
  const result = rankMatches(createState(), 'dépannage', '', 5)[0];
  assert.equal(result.score, 100);
  assert.equal(result.reliabilityAvailable, true);

  const state = createState();
  state.professionals[0].reviewCount = 0;
  state.professionals[0].ratingAverage = 0;
  const withoutReviews = rankMatches(state, 'dépannage', '', 5)[0];
  assert.equal(withoutReviews.score, 100);
  assert.ok(withoutReviews.reasons.some((reason) => reason.includes('aucun avis')));
  assert.ok(withoutReviews.reasons.some((reason) => reason.includes('80 %')));
});

test('distance radius filters out professionals beyond the selected range', () => {
  const results = rankMatches(createState(), '', '', 1);
  assert.deepEqual(results.map(({ pro }) => pro.profileId), ['near']);
});
