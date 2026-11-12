export type Profile = { id: string; name: string; role: string; avatar: string; neighborhood: string; phone: string };
export type Professional = { profileId: string; trade: string; skills: string[]; experienceYears: number; description: string; availability: string; verificationStatus: string; serviceArea: string[]; latitude: number; longitude: number; reviewCount: number; ratingAverage: number; portfolio: string[]; suspended?: boolean; moderationReason?: string };
export type Category = { id: string; label: string; icon: string };
export type ServiceRequest = { id: string; clientName: string; professionalId: string; description: string; neighborhood: string; status: string; createdAt: string };
export type Review = { professionalId: string; rating: number; comment: string; isDemo: boolean };
export type Favorite = { professionalId: string };
export type DemoReport = { id: string; professionalId: string; reason: string; status: 'Ouvert' | 'Traité' | 'Écarté'; createdAt: string };
export type DemoState = { profiles: Profile[]; professionals: Professional[]; categories: Category[]; requests: ServiceRequest[]; reviews: Review[]; favorites: Favorite[]; reports: DemoReport[] };

const demo: DemoState = {
  profiles: [
    { id: 'p1', name: 'Profil démo 01', role: 'Informatique et réseaux', avatar: '01', neighborhood: 'Himbi', phone: 'Non attribué (démo)' },
    { id: 'p2', name: 'Profil démo 02', role: 'Électricité', avatar: '02', neighborhood: 'Katindo', phone: 'Non attribué (démo)' },
    { id: 'p3', name: 'Profil démo 03', role: 'Plomberie', avatar: '03', neighborhood: 'Les Volcans', phone: 'Non attribué (démo)' },
    { id: 'p4', name: 'Profil démo 04', role: 'Mécanique automobile', avatar: '04', neighborhood: 'Mabanga', phone: 'Non attribué (démo)' },
    { id: 'p5', name: 'Profil démo 05', role: 'Réparation de téléphones', avatar: '05', neighborhood: 'Birere', phone: 'Non attribué (démo)' },
    { id: 'p6', name: 'Profil démo 06', role: 'Menuiserie', avatar: '06', neighborhood: 'Kyeshero', phone: 'Non attribué (démo)' },
    { id: 'p7', name: 'Profil démo 07', role: 'Construction', avatar: '07', neighborhood: 'Katindo', phone: 'Non attribué (démo)' },
  ],
  professionals: [
    { profileId: 'p1', trade: 'Informatique et réseaux', skills: ['Installation réseau', 'Dépannage informatique', 'Configuration Wi-Fi'], experienceYears: 5, description: 'Profil de démonstration pour l’installation et le dépannage informatique à Goma.', availability: 'Disponible aujourd’hui', verificationStatus: 'Profil fictif', serviceArea: ['Himbi', 'Katindo', 'Les Volcans'], latitude: -1.665, longitude: 29.218, reviewCount: 3, ratingAverage: 4.7, portfolio: ['Réseau domestique (démo)'] },
    { profileId: 'p2', trade: 'Électricité', skills: ['Installation électrique', 'Dépannage', 'Panneaux solaires'], experienceYears: 8, description: 'Profil de démonstration pour des installations et réparations électriques.', availability: 'Disponible demain', verificationStatus: 'Profil fictif', serviceArea: ['Katindo', 'Mabanga', 'Himbi'], latitude: -1.679, longitude: 29.226, reviewCount: 2, ratingAverage: 4.5, portfolio: ['Installation solaire (démo)'] },
    { profileId: 'p3', trade: 'Plomberie', skills: ['Réparation de fuite', 'Installation sanitaire', 'Débouchage'], experienceYears: 6, description: 'Profil de démonstration pour les réparations et installations de plomberie.', availability: 'Disponible aujourd’hui', verificationStatus: 'Profil fictif', serviceArea: ['Les Volcans', 'Birere', 'Himbi'], latitude: -1.670, longitude: 29.239, reviewCount: 1, ratingAverage: 4.0, portfolio: ['Robinetterie (démo)'] },
    { profileId: 'p4', trade: 'Mécanique automobile', skills: ['Diagnostic auto', 'Freins', 'Entretien courant'], experienceYears: 10, description: 'Profil de démonstration pour le diagnostic et l’entretien automobile.', availability: 'Cette semaine', verificationStatus: 'Profil fictif', serviceArea: ['Mabanga', 'Birere', 'Katindo'], latitude: -1.685, longitude: 29.235, reviewCount: 0, ratingAverage: 0, portfolio: ['Entretien courant (démo)'] },
    { profileId: 'p5', trade: 'Réparation de téléphones', skills: ['Écran et batterie', 'Diagnostic', 'Configuration'], experienceYears: 4, description: 'Profil de démonstration pour le diagnostic et la réparation de téléphones.', availability: 'Disponible aujourd’hui', verificationStatus: 'Profil fictif', serviceArea: ['Birere', 'Les Volcans', 'Katindo'], latitude: -1.678, longitude: 29.245, reviewCount: 2, ratingAverage: 4.5, portfolio: ['Remplacement d’écran (démo)'] },
    { profileId: 'p6', trade: 'Menuiserie', skills: ['Meubles sur mesure', 'Portes', 'Réparation'], experienceYears: 10, description: 'Profil de démonstration pour la fabrication et réparation de menuiseries.', availability: 'Cette semaine', verificationStatus: 'Profil fictif', serviceArea: ['Kyeshero', 'Himbi', 'Les Volcans'], latitude: -1.654, longitude: 29.203, reviewCount: 0, ratingAverage: 0, portfolio: ['Bibliothèque (démo)'] },
    { profileId: 'p7', trade: 'Construction', skills: ['Maçonnerie', 'Carrelage', 'Enduit'], experienceYears: 12, description: 'Profil de démonstration pour des travaux de construction et de finition.', availability: 'Indisponible', verificationStatus: 'Profil fictif', serviceArea: ['Katindo', 'Himbi'], latitude: -1.691, longitude: 29.215, reviewCount: 1, ratingAverage: 4.0, portfolio: ['Carrelage (démo)'] },
  ],
  categories: [
    { id: 'informatique', label: 'Informatique et réseaux', icon: 'IT' }, { id: 'electricite', label: 'Électricité', icon: 'É' }, { id: 'plomberie', label: 'Plomberie', icon: 'P' }, { id: 'mecanique', label: 'Mécanique auto', icon: 'M' }, { id: 'telephones', label: 'Réparation de téléphones', icon: 'T' }, { id: 'menuiserie', label: 'Menuiserie', icon: 'Me' }, { id: 'construction', label: 'Construction', icon: 'C' },
  ],
  requests: [{ id: 'r1', clientName: 'Client démo', professionalId: 'p2', description: 'Vérifier une installation électrique (demande fictive).', neighborhood: 'Himbi', status: 'En attente', createdAt: '24/10/2026' }],
  reviews: [
    { professionalId: 'p1', rating: 5, comment: 'Avis de démonstration, non associé à une prestation réelle.', isDemo: true },
    { professionalId: 'p2', rating: 4, comment: 'Avis de démonstration, non associé à une prestation réelle.', isDemo: true },
    { professionalId: 'p3', rating: 4, comment: 'Avis de démonstration, non associé à une prestation réelle.', isDemo: true },
    { professionalId: 'p5', rating: 5, comment: 'Avis de démonstration, non associé à une prestation réelle.', isDemo: true },
    { professionalId: 'p7', rating: 4, comment: 'Avis de démonstration, non associé à une prestation réelle.', isDemo: true },
  ],
  favorites: [],
  reports: [],
};

const KEY = 'goma-proximite-demo-v2';
export function loadDemo(): DemoState {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return { ...demo, ...JSON.parse(saved) };
  } catch { /* keep the in-memory demo if storage is unavailable */ }
  return structuredClone(demo);
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
