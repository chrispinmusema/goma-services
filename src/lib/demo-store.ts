export type Profile = { id: string; name: string; role: string; avatar: string; neighborhood: string; phone: string };
export type Professional = { profileId: string; trade: string; skills: string[]; experienceYears: number; description: string; availability: string; verificationStatus: string; serviceArea: string[]; latitude: number; longitude: number; reviewCount: number; ratingAverage: number; portfolio: string[]; suspended?: boolean; moderationReason?: string };
export type Category = { id: string; label: string; icon: string };
export type ServiceRequest = { id: string; clientName: string; professionalId: string; description: string; neighborhood: string; status: string; createdAt: string };
export type Review = { professionalId: string; rating: number; comment: string; isDemo: boolean };
export type Favorite = { professionalId: string };
export type DemoReport = { id: string; professionalId: string; reason: string; status: 'Ouvert' | 'Traité' | 'Écarté'; createdAt: string };
export type DemoState = { profiles: Profile[]; professionals: Professional[]; categories: Category[]; requests: ServiceRequest[]; reviews: Review[]; favorites: Favorite[]; reports: DemoReport[] };

const initialState: DemoState = {
  profiles: [],
  professionals: [],
  categories: [
    { id: 'informatique', label: 'Informatique et réseaux', icon: 'IT' }, { id: 'electricite', label: 'Électricité', icon: 'É' }, { id: 'plomberie', label: 'Plomberie', icon: 'P' }, { id: 'mecanique', label: 'Mécanique auto', icon: 'M' }, { id: 'telephones', label: 'Réparation de téléphones', icon: 'T' }, { id: 'menuiserie', label: 'Menuiserie', icon: 'Me' }, { id: 'construction', label: 'Construction', icon: 'C' },
  ],
  requests: [],
  reviews: [],
  favorites: [],
  reports: [],
};

const KEY = 'goma-proximite-real-v1';
export function loadDemo(): DemoState {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return { ...initialState, ...JSON.parse(saved) };
  } catch { /* use the empty initial state if storage is unavailable */ }
  return structuredClone(initialState);
}
export function saveDemo(state: DemoState) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* browser storage may be disabled */ }
}
export const neighborhoods = ['Himbi', 'Katindo', 'Les Volcans', 'Mabanga', 'Birere', 'Kyeshero'];
export function haversineKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const rad = (n: number) => n * Math.PI / 180;
  const dLat = rad(b.latitude - a.latitude), dLon = rad(b.longitude - a.longitude);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
