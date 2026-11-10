import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Dispatch, FormEvent, ReactNode, SetStateAction } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ProfessionalMap } from '@/components/professional-map'; 
import NotFound from '@/pages/not-found';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ArrowLeft, ArrowRight, BadgeCheck, Bookmark, CarFront, Check, ChevronDown, Clock3, Compass, Hammer, Heart, House, Info, Laptop, Link2, MapPin, Menu, Navigation, Phone, Plus, Search, ShieldCheck, SlidersHorizontal, Smartphone, Star, Trash2, UserRound, Wrench, X, Zap } from 'lucide-react';
import { type Category, type DemoState, type Professional, type Profile, loadDemo, saveDemo, neighborhoods } from './lib/demo-store';
import { rankMatches, type RankedProfessional } from './lib/ranking';
import { supabase } from './lib/supabase';

const client = new QueryClient();
type Store = { data: DemoState; setData: Dispatch<SetStateAction<DemoState>> };
const DemoContext = createContext<Store | null>(null);
function useDemo() { const value = useContext(DemoContext); if (!value) throw new Error('Demo store unavailable'); return value; }
const navLinks = [['/', 'Accueil'], ['/fonctionnement', 'Comment ça marche'], ['/contact', 'Contact']];
const statusOptions = ['En attente', 'Acceptée', 'En cours', 'Terminée', 'Refusée'];
const homeCategoryOrder = [
  { id: 'plomberie', Icon: Wrench, imagePosition: '100% 50%' },
  { id: 'electricite', Icon: Zap, imagePosition: '76% 0%' },
  { id: 'telephones', Icon: Smartphone, imagePosition: '55% 25%' },
  { id: 'informatique', Icon: Laptop, imagePosition: '100% 40%' },
  { id: 'menuiserie', Icon: Hammer, imagePosition: '82% 72%' },
  { id: 'construction', Icon: House, imagePosition: '76% 0%' },
  { id: 'mecanique', Icon: CarFront, imagePosition: '96% 50%' },
];

function App() {
  const [data, setData] = useState<DemoState>(loadDemo);
  useEffect(() => saveDemo(data), [data]);
  return <QueryClientProvider client={client}><TooltipProvider><DemoContext.Provider value={{ data, setData }}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></DemoContext.Provider></TooltipProvider></QueryClientProvider>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Shell><Switch>
    <Route path="/" component={HomePage} />
    <Route path="/professionnels/:id" component={ProfessionalPage} />
    <Route path="/connexion" component={AuthPage} />
    <Route path="/inscription" component={AuthPage} />
    <Route path="/espace/client" component={ClientSpace} />
    <Route path="/espace/pro" component={ProSpace} />
    <Route path="/admin" component={AdminAccessUnavailable} />
    <Route path="/fonctionnement" component={HowPage} />
    <Route path="/contact" component={ContactPage} />
    <Route component={NotFound} />
  </Switch></Shell></ErrorBoundary>;
}

function Shell({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  const [location] = useLocation();
  const mobileNavLinks = [...navLinks, ['/espace/client', 'Mon espace'], ['/connexion', 'Connexion'], ['/inscription', 'Inscrire mon activité']];
  return <div className="min-h-[100dvh] bg-[#f4f6f7] text-[#1d2e42]">
    <header className="sticky top-0 z-30 border-b border-[#e0e6e9] bg-[#fbfcfc]/95 backdrop-blur">
      <div className="mx-auto grid h-[56px] max-w-[1690px] grid-cols-[1fr_auto] items-center px-4 sm:px-6 xl:h-[60px] xl:grid-cols-[1fr_auto_1fr] xl:px-[4.2%]">
        <Link href="/" className="group flex items-center gap-2 lg:gap-2.5" data-testid="link-brand">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#10385e] text-[#f3b52f] shadow-[0_4px_12px_rgba(16,56,94,0.18)] lg:h-9 lg:w-9"><Compass size={17} strokeWidth={1.9}/></div>
          <div><div className="font-sans text-[15px] font-extrabold leading-tight text-[#10385e] lg:text-[17px]">Kazi<span className="text-[#f3a817]">Goma</span></div><div className="text-[6px] font-semibold tracking-[.16em] text-[#7188a0]">LES TALENTS D’ICI</div></div>
        </Link>
        <nav className="hidden items-center gap-3 xl:flex">
          {navLinks.map(([href,label]) => <Link key={href} href={href} className={href === '/' ? 'inline-flex items-center gap-2 pb-2 text-[12px] font-extrabold text-[#174572] transition-colors hover:text-[#0d5ebd]' : 'px-3 pb-2 pt-1 text-[12px] font-semibold text-[#24415e] transition-colors hover:text-[#b77c20]'}>{href === '/' && <House size={15} fill="currentColor"/>}{label}</Link>)}
        </nav>
        <div className="hidden items-center justify-self-end gap-2.5 xl:flex">
          <Link href="/connexion" className="inline-flex items-center gap-2 rounded-full border border-[#dbe9ff] bg-white px-4 py-2.5 text-[12px] font-bold text-[#11487f] shadow-[0_1px_0_rgba(13,94,189,0.08),0_3px_12px_rgba(13,94,189,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#f7fbff] hover:shadow-[0_1px_0_rgba(13,94,189,0.08),0_6px_18px_rgba(13,94,189,0.1)]"><Link2 size={15} className="text-[#0d5ebd]"/>Se connecter</Link>
          <Link href="/inscription" className="inline-flex items-center gap-2.5 rounded-full bg-[#0d5ebd] px-4 py-2.5 text-[12px] font-extrabold text-white shadow-[0_8px_18px_rgba(13,94,189,0.2)] ring-1 ring-[#0d5ebd]/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0b4fa7] hover:shadow-[0_10px_22px_rgba(13,94,189,0.25)]"><UserRound size={15} className="text-white"/>Créer un compte</Link>
        </div>
        <button className="inline-flex h-10 w-10 items-center justify-center justify-self-end rounded-xl text-[#24415e] transition-colors hover:bg-[#edf4fc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3b52f] xl:hidden" onClick={() => setMenu(!menu)} aria-label={menu ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={menu} aria-controls="mobile-navigation" data-testid="button-mobile-menu">{menu ? <X size={19}/> : <Menu size={19}/>}</button>
      </div>
      {menu && <div id="mobile-navigation" className="border-t border-[#e0e6e9] bg-[#fbfcfc] px-4 py-4 shadow-[0_12px_24px_rgba(16,56,94,0.12)] sm:px-6 xl:hidden">
        <nav aria-label="Navigation mobile" className="mx-auto max-w-[1690px]">
          <div className="grid gap-1">
            {mobileNavLinks.slice(0, navLinks.length).map(([href, label]) => {
              const active = location === href;
              return <Link onClick={() => setMenu(false)} key={href} href={href} aria-current={active ? 'page' : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3b52f] ${active ? 'bg-[#edf4fc] text-[#174572]' : 'text-[#405268] hover:bg-[#f1f5f7] hover:text-[#174572]'}`}>
                {href === '/' && <House size={16} fill={active ? 'currentColor' : 'none'} />}
                {label}
              </Link>;
            })}
          </div>
          <div className="mt-3 grid gap-2 border-t border-[#e7ecee] pt-3">
            {mobileNavLinks.slice(navLinks.length).map(([href, label]) => <Link onClick={() => setMenu(false)} key={href} href={href} aria-current={location === href ? 'page' : undefined} className={href === '/inscription' ? 'flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#10385e] px-4 text-sm font-bold text-white transition-colors hover:bg-[#1b4c78] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3b52f]' : `flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3b52f] ${location === href ? 'bg-[#edf4fc] text-[#174572]' : 'text-[#405268] hover:bg-[#f1f5f7] hover:text-[#174572]'}`}>{label}</Link>)}
          </div>
        </nav>
      </div>}
    </header>
    <main>{children}</main>
    {location !== '/connexion' && location !== '/inscription' && <footer className="mt-16 bg-[#183451] text-white">
      <div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-10 sm:grid-cols-[1fr_auto] sm:px-7">
        <div><div className="font-serif text-xl font-extrabold">Kazi<span className="text-[#f0bf62]">Goma</span></div><p className="mt-2 max-w-md text-sm leading-6 text-[#cad5df]">Les compétences de Goma, à portée de main. Une mise en relation locale en version démo.</p><p className="mt-3 text-[11px] text-[#aab9c6]">Profils, avis et statistiques présentés ici sont fictifs.</p></div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#d5dfe6]"><Link href="/">Trouver un pro</Link><Link href="/fonctionnement">Fonctionnement</Link><Link href="/contact">Contact</Link></div>
      </div>
    </footer>}
  </div>;
}

function PageTitle({ eyebrow, title, text }: { eyebrow?: string; title: string; text?: string }) {
  return <div className="mb-7"><div className="mb-2 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#a57934]">{eyebrow}</div><h1 className="font-serif text-3xl font-extrabold tracking-[-1px] text-[#183451] sm:text-[38px]">{title}</h1>{text && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#647384]">{text}</p>}</div>;
}
function DemoNote({ children }: { children: ReactNode }) { return <div className="flex gap-2 rounded-lg border border-[#ead9b7] bg-[#fff9ee] px-3 py-2.5 text-xs leading-5 text-[#735b35]"><Info size={15} className="mt-0.5 shrink-0"/><span>{children}</span></div>; }
function Avatar({ profile, large = false }: { profile: Profile; large?: boolean }) { return <div className={`flex shrink-0 items-center justify-center rounded-full bg-[#e9eff2] font-bold text-[#284863] ${large ? 'h-[68px] w-[68px] text-lg' : 'h-11 w-11 text-xs'}`}>{profile.avatar}</div>; }
function ProfessionalPortrait({ profileId, name }: { profileId: string; name: string }) {
  const portraitPosition: Record<string, string> = {
    p1: '100% 39%',
    p2: '86% 39%',
    p3: '74% 0%',
    p4: '86% 39%',
    p5: '100% 39%',
    p6: '75% 76%',
    p7: '74% 0%',
  };
  return <div
    role="img"
    aria-label={`Portrait illustratif pour ${name}`}
    className="h-[72px] w-[72px] shrink-0 rounded-full border-[3px] border-white bg-[#e9eff2] shadow-[0_2px_8px_rgba(24,52,81,0.12)] sm:h-[96px] sm:w-[96px]"
    style={{
      backgroundImage: "url('/Professional%20Services%20Marketplace%20Collage.png')",
      backgroundPosition: portraitPosition[profileId] ?? '100% 39%',
      backgroundSize: '600% auto',
    }}
  />;
}

function HomePage() {
  const { data, setData } = useDemo();
  const [term, setTerm] = useState('');
  const [city, setCity] = useState('Goma');
  const [radiusKm, setRadiusKm] = useState(10);
  const [view, setView] = useState<'list'|'map'>('list');
  const results = useMemo(() => city === 'Goma' ? rankMatches(data, term, '', radiusKm) : [], [data,term,city,radiusKm]);
  const homeCategories = homeCategoryOrder.flatMap(item => {
    const category = data.categories.find(value => value.id === item.id);
    return category ? [{ ...item, category }] : [];
  });
  const additionalCategories = data.categories
    .filter(category => !homeCategoryOrder.some(item => item.id === category.id))
    .map(category => ({ category, Icon: Wrench, imagePosition: 'center' }));
  const toggleFavorite = (id: string) => setData(prev => ({ ...prev, favorites: prev.favorites.some(f => f.professionalId === id) ? prev.favorites.filter(f => f.professionalId !== id) : [...prev.favorites, { professionalId:id }] }));
  return <div className="page-enter">
    <section className="home-hero relative overflow-hidden bg-[#eff5ff] text-[#12294b]">
      <div aria-hidden="true" className="home-hero-photo absolute inset-x-0 top-0 h-48 bg-no-repeat sm:h-56 md:h-60 lg:inset-y-0 lg:left-auto lg:right-0 lg:h-auto lg:w-[56%]" style={{ backgroundImage: "url('/Smiling%20Team%20in%20Modern%20Workshop.png')", backgroundPosition: 'center', backgroundSize: 'cover' }}>
        <span className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#eff5ff]"/>
      </div>
      <div className="relative z-10 mx-auto min-h-[360px] max-w-[1690px] px-5 pb-6 pt-52 sm:px-7 sm:pb-8 sm:pt-64 md:pt-68 lg:flex lg:min-h-[460px] lg:flex-col lg:justify-center lg:px-[4.2%] lg:py-10">
        <div className="home-hero-copy max-w-[670px] lg:max-w-[48%]">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d7e5f7] bg-white/80 px-3.5 py-2 text-xs font-bold text-[#174572] shadow-sm"><span className="h-2 w-2 rounded-full bg-[#f3b52f]"/>Services de proximité · Goma</div>
          <h1 className="max-w-[650px] font-sans text-[38px] font-extrabold leading-[1.04] tracking-[-1.5px] text-[#102448] sm:text-[52px] lg:text-[60px]">Trouvez facilement<br/>le bon professionnel<br/><span className="text-[#0758d5]">à Goma !</span></h1>
          <p className="mt-4 max-w-[530px] text-sm leading-6 text-[#263b5a] sm:text-base sm:leading-7"><strong>KaziGoma</strong> est votre plateforme de services de proximité. Cherchez, comparez et contactez des professionnels fiables dans votre quartier.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="mt-7 w-full max-w-[760px] rounded-[26px] border border-[#dceaff] bg-white/80 p-2.5 shadow-[0_18px_30px_rgba(13,94,189,0.12)] backdrop-blur-sm"
          >
            <div className="grid gap-2 rounded-[20px] bg-white p-2 sm:grid-cols-[1.5fr_1fr_0.8fr_auto] sm:items-center">
              <label className="flex items-center gap-2 rounded-[16px] border border-[#e6edf5] bg-[#f7fafd] px-3 py-2.5 text-[#1f426d] shadow-inner shadow-[#edf3fa]">
                <Search size={16} className="text-[#1f6ed4]" />
                <input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Ex. Plombier, Électricien..."
                  className="w-full border-0 bg-transparent text-sm font-medium text-[#1d2e42] placeholder:text-[#6d7e90] focus:outline-none"
                  aria-label="Rechercher un service"
                />
              </label>

              <label className="flex items-center gap-2 rounded-[16px] border border-[#e6edf5] bg-[#f7fafd] px-3 py-2.5 text-[#1f426d] shadow-inner shadow-[#edf3fa]">
                <MapPin size={16} className="text-[#1f6ed4]" />
                <select value={city} onChange={event => setCity(event.target.value)} className="w-full appearance-none border-0 bg-transparent text-sm font-medium text-[#1d2e42] focus:outline-none" aria-label="Sélectionner une ville">
                  <option value="Goma">Goma</option>
                  <option value="Bukavu">Bukavu</option>
                  <option value="Kinshasa">Kinshasa</option>
                </select>
                <ChevronDown size={14} className="text-[#526d8a]" />
              </label>

              <label className="flex items-center justify-between gap-2 rounded-[16px] border border-[#e6edf5] bg-[#f7fafd] px-3 py-2.5 text-[#1f426d] shadow-inner shadow-[#edf3fa]">
                <span className="flex items-center gap-2">
                  <MapPin size={15} className="text-[#1f6ed4]" />
                  <span className="text-sm font-medium text-[#1d2e42]">Rayon</span>
                </span>
                <select value={radiusKm} onChange={event => setRadiusKm(Number(event.target.value))} className="appearance-none border-0 bg-transparent pr-1 text-sm font-medium text-[#1d2e42] focus:outline-none" aria-label="Choisir un rayon">
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={20}>20 km</option>
                  <option value={50}>50 km</option>
                </select>
              </label>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#0d5ebd] px-5 py-3 text-sm font-extrabold text-white shadow-[0_12px_22px_rgba(13,94,189,0.28)] transition hover:bg-[#0b4fa5]"
              >
                <Search size={17} />
                Rechercher
              </button>
            </div>
          </form>
        </div>
        <div className="home-hero-trust mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-[#19375d] sm:mt-6 sm:gap-x-7 sm:text-sm">
          <span className="inline-flex items-center gap-2"><ShieldCheck size={18} className="text-[#0758d5]"/>Professionnels vérifiés</span>
          <span className="inline-flex items-center gap-2"><Clock3 size={18} className="text-[#0758d5]"/>Réponse rapide</span>
          <span className="inline-flex items-center gap-2"><MapPin size={18} className="text-[#0758d5]"/>Proches de chez vous</span>
        </div>
      </div>
    </section>
    <div className="mx-auto max-w-[1690px] px-4 pt-5 sm:px-7 lg:px-[4.2%]">
      <section aria-label="Les atouts de KaziGoma" className="grid overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(16,56,94,.08)] lg:grid-cols-[1.6fr_1fr]">
        <div className="grid grid-cols-2 divide-x divide-y divide-[#e3eaf0] sm:grid-cols-4 sm:divide-y-0">
          <div className="flex flex-col items-center justify-center gap-2 px-2 py-4 text-center sm:flex-row sm:gap-3 sm:px-3"><ShieldCheck size={24} className="shrink-0 text-[#0758d5]"/><span className="text-[11px] font-bold leading-4 text-[#19375d] sm:text-xs">Professionnels vérifiés</span></div>
          <div className="flex flex-col items-center justify-center gap-2 px-2 py-4 text-center sm:flex-row sm:gap-3 sm:px-3"><MapPin size={24} className="shrink-0 fill-[#5b92d1] text-[#5b92d1]"/><span className="text-[11px] font-bold leading-4 text-[#19375d] sm:text-xs">Proches de chez vous</span></div>
          <div className="flex flex-col items-center justify-center gap-2 px-2 py-4 text-center sm:flex-row sm:gap-3 sm:px-3"><Zap size={24} className="shrink-0 fill-[#f4b52f] text-[#f4b52f]"/><span className="text-[11px] font-bold leading-4 text-[#19375d] sm:text-xs">Réponse rapide</span></div>
          <div className="flex flex-col items-center justify-center gap-2 px-2 py-4 text-center sm:flex-row sm:gap-3 sm:px-3"><Star size={24} className="shrink-0 fill-[#f4b52f] text-[#f4b52f]"/><span className="text-[11px] font-bold leading-4 text-[#19375d] sm:text-xs">Avis clients</span></div>
        </div>
        <div className="flex min-h-[88px] items-center justify-center gap-4 bg-[#082f68] px-5 py-4 text-white">
          <Compass size={42} strokeWidth={1.4} className="shrink-0 text-[#b8d5ff]"/>
          <div><h2 className="text-sm font-extrabold">Goma, notre ville</h2><p className="mt-1 max-w-xs text-xs leading-4 text-blue-100">Ensemble, construisons une ville plus connectée !</p></div>
          <Heart size={20} className="shrink-0 text-white"/>
        </div>
      </section>
      <section aria-labelledby="home-categories-heading" className="py-6 sm:py-7">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="home-categories-heading" className="border-l-4 border-[#0758d5] pl-3 font-sans text-xl font-extrabold tracking-tight text-[#122448] sm:text-2xl">Nos catégories de services</h2>
          <button onClick={()=>document.getElementById('results')?.scrollIntoView({behavior:'smooth'})} className="inline-flex items-center gap-1 text-xs font-bold text-[#0758d5] transition hover:text-[#0648ae] sm:text-sm">Voir tous les professionnels <ArrowRight size={16}/></button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {[...homeCategories, ...additionalCategories].map(({ category, Icon, imagePosition }) => <button key={category.id} onClick={()=>{setTerm(category.label);document.getElementById('results')?.scrollIntoView({behavior:'smooth'});}} className="group overflow-hidden rounded-2xl border border-[#e3e9ef] bg-white text-left shadow-[0_3px_9px_rgba(16,56,94,.08)] transition duration-200 hover:-translate-y-1 hover:border-[#b7d0f0] hover:shadow-[0_10px_20px_rgba(16,56,94,.13)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0758d5]" aria-label={`Rechercher : ${category.label}`}>
            <span className="relative flex h-[92px] items-center justify-center bg-cover sm:h-[112px]" style={{ backgroundImage: "url('/Professional%20Services%20Marketplace%20Collage.png')", backgroundPosition: imagePosition, backgroundSize: '500% 500%' }}><span aria-hidden="true" className="absolute inset-0 bg-[#102f4d]/25 transition-colors group-hover:bg-[#102f4d]/10"/><Icon size={38} strokeWidth={1.8} className="relative text-white drop-shadow-md transition-transform duration-200 group-hover:scale-110"/></span>
            <span className="flex min-h-11 items-center gap-2 px-3 text-xs font-extrabold text-[#142b4d] sm:min-h-12 sm:text-sm"><Icon size={16} className="shrink-0 text-[#0758d5]"/><span className="line-clamp-2">{category.label}</span></span>
          </button>)}
        </div>
      </section>
    </div>
    <div className="mx-auto max-w-[1690px] px-4 sm:px-7 lg:px-[4.2%]">
      <section id="results" className="pb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-serif text-xl font-extrabold text-[#183451]">{results.length} professionnel{results.length===1?'':'s'} à proximité</h2><p className="mt-1 text-xs text-[#778591]">Classés selon vos critères et la distance approximative.</p></div>
          <div className="flex rounded-lg border border-[#dfe5e7] bg-white p-1"><button onClick={()=>setView('list')} className={`rounded-md px-3 py-1.5 text-xs font-bold ${view==='list'?'bg-[#183451] text-white':'text-[#526578]'}`}>Liste</button><button onClick={()=>setView('map')} className={`rounded-md px-3 py-1.5 text-xs font-bold ${view==='map'?'bg-[#183451] text-white':'text-[#526578]'}`}>Carte</button></div>
        </div>
        {view==='map' && <ProfessionalMap professionals={results.map(({ profile, pro }) => ({ profileId: pro.profileId, name: profile.name, neighborhood: profile.neighborhood, latitude: pro.latitude, longitude: pro.longitude }))}/>}
        {!results.length ? <div className="rounded-2xl border border-dashed border-[#cbd5da] bg-white px-5 py-14 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#edf2f4] text-[#35546d]"><Search size={21}/></div><h3 className="mt-4 font-serif text-lg font-bold text-[#183451]">Aucun résultat pour le moment</h3><p className="mx-auto mt-1 max-w-sm text-sm text-[#74818b]">Aucun professionnel ne correspond à cette catégorie.</p><button onClick={()=>setTerm('')} className="mt-4 rounded-lg border border-[#dbe2e5] px-4 py-2 text-xs font-bold text-[#284b68]">Afficher toutes les catégories</button></div> :
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{results.map((item,i)=><ProfessionalCard key={item.pro.profileId} item={item} rank={i+1} saved={data.favorites.some(f=>f.professionalId===item.pro.profileId)} onFavorite={()=>toggleFavorite(item.pro.profileId)}/>)}</div>}
      </section>
      <div className="mb-5"><DemoNote>Classement indicatif calculé dans cette démo : compétences 40 %, proximité 25 %, fiabilité 20 % si des avis existent, disponibilité 15 % si elle est renseignée. Les critères absents sont redistribués. Aucun avis ni score n’a été vérifié.</DemoNote></div>
    </div>
  </div>;
}

function ProfessionalCard({ item, rank, saved, onFavorite }: { item: RankedProfessional; rank: number; saved: boolean; onFavorite:()=>void }) {
  return <article className="relative flex min-w-0 gap-3 rounded-2xl border border-[#e4ebf3] bg-white p-3.5 shadow-[0_5px_16px_rgba(24,52,81,0.07)] transition hover:-translate-y-0.5 hover:border-[#bfd5f5] hover:shadow-[0_12px_26px_rgba(24,52,81,0.11)] sm:gap-4 sm:p-4" data-testid={`card-professional-${item.pro.profileId}`}>
    <div className="relative mt-0.5 self-start">
      <ProfessionalPortrait profileId={item.pro.profileId} name={item.profile.name}/>
      <span aria-hidden="true" className="absolute bottom-2 right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#14b86a]"/>
    </div>
    <div className="min-w-0 flex-1 pr-7">
      <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
        <h3 className="font-sans text-[15px] font-extrabold leading-5 text-[#102448] sm:text-base">{item.profile.name}</h3>
        <span title="Profil de démonstration non vérifié" className="inline-flex items-center gap-1 rounded-full bg-[#eef3f8] px-1.5 py-0.5 text-[8px] font-bold leading-3 text-[#61758d]"><Info size={10}/>Non vérifié</span>
      </div>
      <p className="mt-1 text-[11px] font-semibold leading-4 text-[#19375d] sm:text-xs"><span className="mr-1 text-[#f2a900]">•</span>{item.pro.trade}<span className="px-1.5 text-[#f2a900]">•</span><span className="text-[#b56a00]">{item.pro.experienceYears} ans d’expérience</span></p>
      <p className="mt-1 flex items-center gap-1 text-[10px] leading-4 text-[#506783] sm:text-[11px]"><MapPin size={13} className="shrink-0 text-[#2678e5]"/>{item.profile.neighborhood}<span className="px-0.5">·</span>{item.km.toFixed(1)} km environ</p>
      <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-[#314967] sm:text-xs">{item.pro.description}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">{item.pro.skills.slice(0,3).map(skill=><span key={skill} className="max-w-full truncate rounded-full bg-[#eaf2ff] px-2 py-1 text-[9px] font-semibold leading-3 text-[#164b96] sm:text-[10px]">{skill}</span>)}</div>
      <div className="mt-2.5 flex flex-wrap items-end justify-between gap-x-3 gap-y-2 border-t border-[#edf1f6] pt-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-[11px] font-bold text-[#263b5a]">{item.pro.reviewCount ? <><Star size={14} className="fill-[#f4ad19] text-[#f4ad19]"/>{item.pro.ratingAverage.toFixed(1)} <span className="font-normal text-[#60738d]">({item.pro.reviewCount} avis)</span></> : <span className="font-medium text-[#718096]">Avis indisponibles</span>}</div>
          <div className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full bg-[#e4f7eb] px-2 py-1 text-[9px] font-bold leading-3 text-[#168447] sm:text-[10px]"><span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#16a05b]"/>{item.pro.availability}</div>
        </div>
        <div className="ml-auto flex min-w-[126px] flex-col items-end gap-1.5">
          <div className="text-right text-[11px] font-extrabold leading-4 text-[#0758d5] sm:text-xs">{item.pro.indicativeRate}</div>
          <Link href={`/professionnels/${item.pro.profileId}`} className="inline-flex min-h-8 w-full items-center justify-center gap-2 rounded-full border border-[#2678ff] bg-white px-3 text-[10px] font-bold text-[#0758d5] transition hover:bg-[#0758d5] hover:text-white sm:text-[11px]" data-testid={`link-profile-${item.pro.profileId}`}>Voir le profil <ArrowRight size={14}/></Link>
        </div>
      </div>
    </div>
    <button onClick={onFavorite} aria-label={saved?'Retirer des favoris':'Ajouter aux favoris'} className={`absolute right-2.5 top-2.5 rounded-full p-1.5 transition ${saved?'text-[#e44962]':'text-[#58708f] hover:bg-[#f0f5fc] hover:text-[#e44962]'}`} data-testid={`button-favorite-${item.pro.profileId}`}><Heart size={20} fill={saved?'currentColor':'none'}/></button>
  </article>;
}

function ProfessionalPage({ params }: { params: { id: string } }) {
  const { data, setData } = useDemo();
  const [sent, setSent] = useState(false);
  const [showDemoPhone, setShowDemoPhone] = useState(false);
  const [description, setDescription] = useState('');
  const [neighborhood, setNeighborhood] = useState('Himbi');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [reportSaved, setReportSaved] = useState(false);
  const pro = data.professionals.find(p=>p.profileId===params.id);
  const profile = data.profiles.find(p=>p.id===params.id);
  if(!pro||!profile||pro.suspended) return <div className="mx-auto max-w-3xl px-5 py-16"><PageTitle title="Profil introuvable" text="Ce professionnel n’est pas disponible dans la démo."/><Link href="/" className="font-bold text-[#294d6a]">Retour à la recherche</Link></div>;
  const favorite=data.favorites.some(f=>f.professionalId===pro.profileId);
  const submit=(e:FormEvent)=>{e.preventDefault();if(description.trim().length<12){setError('Décrivez votre besoin en au moins 12 caractères.');return;}if(!name.trim()){setError('Indiquez votre nom pour la demande démo.');return;}setData(prev=>({...prev,requests:[{id:`r${Date.now()}`,clientName:name.trim(),professionalId:pro.profileId,description:description.trim(),neighborhood,status:'En attente',createdAt:new Date().toLocaleDateString('fr-FR')},...prev.requests]}));setSent(true);setError('');};
  return <div className="page-enter mx-auto max-w-[1080px] px-4 py-8 sm:px-7 sm:py-12"><Link href="/" className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-[#617383]"><ArrowLeft size={15}/> Retour aux résultats</Link>
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div>
        <section className="rounded-2xl border border-[#e0e6e8] bg-white p-5 sm:p-7">
           <div className="flex flex-wrap items-start gap-4"><Avatar profile={profile} large/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h1 className="font-serif text-2xl font-extrabold text-[#183451] sm:text-3xl">{profile.name}</h1><span className="rounded-full bg-[#eef3f5] px-2.5 py-1 text-[10px] font-bold text-[#526c7d]">Profil fictif · non vérifié</span></div><p className="mt-1 font-semibold text-[#a57934]">{pro.trade}</p><p className="mt-2 flex items-center gap-1 text-xs text-[#71808c]"><MapPin size={13}/>{profile.neighborhood} · intervient à {pro.serviceArea.join(', ')}</p></div><button onClick={()=>setData(prev=>({...prev,favorites:favorite?prev.favorites.filter(f=>f.professionalId!==pro.profileId):[...prev.favorites,{professionalId:pro.profileId}]}))} className="flex items-center gap-2 rounded-lg border border-[#e0e6e8] px-3 py-2 text-xs font-bold text-[#536a7c]"><Heart size={15} fill={favorite?'currentColor':'none'}/>{favorite?'Enregistré':'Enregistrer'}</button></div>
          <DemoNote>Statut de profil et éléments présentés à titre fictif. KaziGoma n’a effectué aucune vérification d’identité.</DemoNote>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3"><Metric label="Expérience" value={`${pro.experienceYears} ans`}/><Metric label="Tarif indicatif" value={pro.indicativeRate}/><Metric label="Disponibilité" value={pro.availability}/></div>
          <h2 className="mt-7 font-serif text-lg font-bold text-[#183451]">À propos</h2><p className="mt-2 text-sm leading-6 text-[#596b79]">{pro.description}</p>
          <h2 className="mt-6 font-serif text-lg font-bold text-[#183451]">Compétences</h2><div className="mt-3 flex flex-wrap gap-2">{pro.skills.map(s=><span key={s} className="rounded-full bg-[#edf2f4] px-3 py-1.5 text-xs font-semibold text-[#425c70]">{s}</span>)}</div>
           <h2 className="mt-6 font-serif text-lg font-bold text-[#183451]">Zone d’intervention</h2><div className="mt-3 flex flex-wrap gap-2">{pro.serviceArea.map(a=><span key={a} className="flex items-center gap-1.5 rounded-lg border border-[#e3e8e9] px-3 py-2 text-xs text-[#566a79]"><MapPin size={13}/>{a}</span>)}</div>
           <h2 className="mt-6 font-serif text-lg font-bold text-[#183451]">Réalisations de démonstration</h2><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{pro.portfolio.map((item,index)=>item.startsWith('data:image/')?<img key={`${pro.profileId}-portfolio-${index}`} src={item} alt="Photo fictive ajoutée pour la démonstration" className="aspect-square w-full rounded-xl border border-[#e3e8e9] object-cover"/>:<div key={`${pro.profileId}-portfolio-${index}`} className="flex min-h-24 items-end rounded-xl border border-[#e3e8e9] bg-[#f1f5f5] p-3 text-xs font-semibold text-[#526779]">{item}</div>)}</div><p className="mt-2 text-[10px] text-[#849098]">Images locales de démonstration uniquement ; aucune photo n’est envoyée à un serveur.</p>
          <h2 className="mt-6 font-serif text-lg font-bold text-[#183451]">Avis de démonstration</h2><div className="mt-3 space-y-2">{data.reviews.filter(r=>r.professionalId===pro.profileId).map((r,i)=><div key={i} className="rounded-xl bg-[#f5f7f7] p-3"><div className="flex items-center justify-between"><div className="flex gap-0.5 text-[#d19e42]">{Array.from({length:r.rating},(_,k)=><Star key={k} size={13} fill="currentColor"/>)}</div><span className="text-[9px] font-bold uppercase tracking-wider text-[#89949b]">Avis fictif</span></div><p className="mt-2 text-xs text-[#5b6b78]">{r.comment}</p></div>)}{!pro.reviewCount&&<p className="text-sm text-[#77838b]">Aucun avis disponible dans ce profil démo.</p>}</div>
        </section>
      </div>
      <aside className="h-fit rounded-2xl border border-[#e0e6e8] bg-white p-5 lg:sticky lg:top-24">
        <div className="flex items-center justify-between"><div><div className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#a57934]">Prendre contact</div><h2 className="mt-1 font-serif text-xl font-extrabold text-[#183451]">Décrire votre besoin</h2></div><Phone size={20} className="text-[#a57934]"/></div>
        {sent?<div className="mt-5 rounded-xl bg-[#eef5ef] p-4"><div className="flex items-center gap-2 font-bold text-[#3b684b]"><Check size={17}/>Demande ajoutée à la démo</div><p className="mt-2 text-xs leading-5 text-[#56715f]">Elle est enregistrée localement dans votre espace client. Aucune notification n’a été envoyée.</p><button onClick={()=>{setSent(false);setDescription('')}} className="mt-3 text-xs font-bold text-[#31563e]">Créer une autre demande</button></div>:<form onSubmit={submit} className="mt-5 space-y-3">
          <label className="block text-xs font-bold text-[#506273]">Votre nom<input value={name} onChange={e=>setName(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#9a7843]" placeholder="Nom de démonstration" data-testid="input-client-name"/></label>
          <label className="block text-xs font-bold text-[#506273]">Votre quartier<select value={neighborhood} onChange={e=>setNeighborhood(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] bg-white px-3 py-2.5 text-sm font-normal outline-none" data-testid="select-request-neighborhood">{neighborhoods.map(n=><option key={n}>{n}</option>)}</select></label>
          <label className="block text-xs font-bold text-[#506273]">Votre besoin<textarea value={description} onChange={e=>setDescription(e.target.value)} rows={4} className="mt-1.5 w-full resize-y rounded-lg border border-[#dfe5e8] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#9a7843]" placeholder="Décrivez le travail et le moment souhaité…" data-testid="textarea-request"/></label>
          {error&&<p className="text-xs text-[#a34436]">{error}</p>}<button className="w-full rounded-lg bg-[#183451] py-3 text-sm font-bold text-white hover:bg-[#274967]" data-testid="button-send-request">Enregistrer la demande démo</button><p className="text-center text-[10px] leading-4 text-[#82909a]">Essai local uniquement : aucun message réel ne sera envoyé.</p>
        </form>}
         <button type="button" onClick={()=>setShowDemoPhone(!showDemoPhone)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#dfe5e8] py-2.5 text-xs font-bold text-[#284b68]"><Phone size={14}/>{showDemoPhone?'Masquer le numéro fictif':'Afficher le numéro fictif'}</button>{showDemoPhone&&<p className="mt-2 text-center text-xs text-[#71808c]">{profile.phone} · numéro de démonstration non attribué</p>}
         <div className="mt-5 border-t border-[#edf0f1] pt-4">
           {reportSaved ? <p className="text-xs text-[#42674d]">Signalement fictif enregistré dans cette démo.</p> : <>
             <button type="button" onClick={()=>setShowReport(!showReport)} className="text-xs font-semibold text-[#8b5144]">{showReport?'Annuler':'Signaler ce profil (démo)'}</button>
             {showReport&&<form onSubmit={e=>{e.preventDefault();if(reportReason.trim().length<3)return;setData(prev=>({...prev,reports:[{id:`report-${Date.now()}`,professionalId:pro.profileId,reason:reportReason.trim(),status:'Ouvert',createdAt:new Date().toLocaleDateString('fr-FR')},...prev.reports]}));setReportSaved(true);setReportReason('')}} className="mt-3 space-y-2">
               <label className="block text-[11px] font-semibold text-[#697681]">Motif du signalement<textarea value={reportReason} onChange={e=>setReportReason(e.target.value)} minLength={3} maxLength={500} required rows={3} className="mt-1 w-full rounded-lg border border-[#dfe5e8] px-3 py-2 text-xs outline-none focus:border-[#9a7843]" placeholder="Décrivez brièvement le problème"/></label>
               <button className="rounded-lg border border-[#ead4d0] px-3 py-2 text-[11px] font-bold text-[#8b5144]">Enregistrer le signalement fictif</button>
               <p className="text-[10px] leading-4 text-[#849098]">Aucun signalement réel ne sera transmis.</p>
             </form>}
           </>}
         </div>
      </aside>
    </div>
  </div>;
}
function Metric({label,value}:{label:string;value:string}) { return <div className="rounded-xl bg-[#f4f6f6] p-3"><div className="text-[9px] font-bold uppercase tracking-wider text-[#7b8992]">{label}</div><div className="mt-1 text-sm font-extrabold text-[#28445d]">{value}</div></div>; }

function AdminAccessUnavailable() {
  const [status, setStatus] = useState<'checking' | 'signed-out' | 'authorized' | 'unconfigured'>('checking');
  const [localPreview, setLocalPreview] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const verifyAdmin = async (userId: string) => {
    if (!supabase) return;
    const { data, error: roleError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (roleError || data?.role !== 'admin') {
      await supabase.auth.signOut();
      setStatus('signed-out');
      setError('Ce compte ne possède pas le rôle administrateur.');
      return;
    }

    setError('');
    setStatus('authorized');
  };

  useEffect(() => {
    if (!supabase) {
      setStatus('unconfigured');
      return;
    }

    let active = true;
    void supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!active) return;
      if (authError || !data.user) {
        setStatus('signed-out');
        return;
      }
      void verifyAdmin(data.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && active) setStatus('signed-out');
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setError('');
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !data.user) {
      setError('Connexion impossible. Vérifiez vos identifiants.');
      return;
    }
    await verifyAdmin(data.user.id);
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setStatus('signed-out');
  };

  if (status === 'checking') {
    return <div className="mx-auto max-w-3xl px-5 py-16 text-sm text-[#647384]">Vérification de votre accès…</div>;
  }

  if (status === 'authorized') {
    return <><div className="mx-auto flex max-w-[1120px] justify-end px-4 pt-6 sm:px-7"><button onClick={signOut} className="rounded-lg border border-[#dfe5e8] bg-white px-3 py-2 text-xs font-bold text-[#405268]">Se déconnecter</button></div><AdminPage /></>;
  }

  if (localPreview && import.meta.env.DEV) {
    return <><div className="mx-auto max-w-[1120px] px-4 pt-5 sm:px-7"><DemoNote>Aperçu local de démonstration. Toutes les données et actions sont fictives et restent dans ce navigateur.</DemoNote></div><AdminPage /></>;
  }

  const configured = status !== 'unconfigured';
  return <div className="page-enter mx-auto max-w-3xl px-5 py-16 sm:px-7">
    <PageTitle eyebrow="Accès protégé" title="Espace administrateur" text="Connectez-vous avec le compte auquel le rôle administrateur a été attribué." />
    {!configured && <div className="mb-6"><DemoNote>Accès fermé. Configurez les variables Supabase et appliquez la migration avant d’activer la connexion administrateur.</DemoNote></div>}
    {!configured && import.meta.env.DEV && <button onClick={() => setLocalPreview(true)} className="mb-5 rounded-lg bg-[#183451] px-4 py-2.5 text-sm font-bold text-white">Voir l’aperçu local de l’espace admin</button>}
    {configured && <form onSubmit={signIn} className="mb-6 max-w-md space-y-4 rounded-2xl border border-[#e0e6e8] bg-white p-6 shadow-sm">
      <label className="block text-xs font-bold text-[#506273]">Adresse e-mail<input type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] px-3 py-3 text-sm font-normal" /></label>
      <label className="block text-xs font-bold text-[#506273]">Mot de passe<input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] px-3 py-3 text-sm font-normal" /></label>
      {error && <p role="alert" className="text-sm text-[#a34436]">{error}</p>}
      <button className="w-full rounded-lg bg-[#183451] py-3 text-sm font-bold text-white">Se connecter</button>
    </form>}
    <Link href="/" className="inline-flex rounded-lg bg-[#183451] px-4 py-2.5 text-sm font-bold text-white">Retour à l’accueil</Link>
  </div>;
}

function authErrorMessage(error: unknown, action: 'signup' | 'signin') {
  if (typeof error !== 'object' || error === null) return 'Une erreur est survenue. Réessayez.';

  const status = 'status' in error && typeof error.status === 'number' ? error.status : undefined;
  const code = 'code' in error && typeof error.code === 'string' ? error.code : '';
  const message = 'message' in error && typeof error.message === 'string' ? error.message : '';

  if (status === 429) {
    return 'Trop de tentatives pour le moment. Attendez 5 minutes avant de réessayer. Ce délai est indicatif : si le problème continue, vérifiez les limites et les e-mails d’authentification dans Supabase.';
  }
  if (action === 'signin' && (code === 'email_not_confirmed' || /email not confirmed/i.test(message))) {
    return 'Votre adresse e-mail n’est pas encore confirmée. Consultez votre boîte de réception puis réessayez.';
  }
  if (action === 'signin' && (code === 'invalid_credentials' || /invalid login credentials/i.test(message))) {
    return 'Adresse e-mail ou mot de passe incorrect. Vérifiez vos informations et réessayez.';
  }

  return message || 'Une erreur est survenue. Réessayez.';
}

function AuthPage() {
  const [location, setLocation] = useLocation();
  const signup=location==='/inscription';
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [name,setName]=useState('');
  const [role,setRole]=useState<'client'|'professional'>('client'); const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const submit=async(e:FormEvent)=>{
    e.preventDefault(); setMessage('');
    if(!supabase){setMessage('Supabase n’est pas configuré. Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY dans .env.local.');return;}
    setBusy(true);
    try {
      if(signup){
        const {data,error}=await supabase.auth.signUp({email,password,options:{data:{display_name:name.trim(),role}}});
        if(error) throw error;
        setMessage(data.session?'Compte créé. Vous pouvez maintenant vous connecter.':'Compte créé. Vérifiez votre e-mail pour confirmer votre inscription.');
      } else {
        const {data,error}=await supabase.auth.signInWithPassword({email,password});
        if(error) throw error;
        const {data:profile,error:profileError}=await supabase.from('profiles').select('role').eq('id',data.user.id).single();
        if(profileError) throw profileError;
        setLocation(profile.role==='professional'?'/espace/pro':'/espace/client');
      }
    } catch(error) { setMessage(authErrorMessage(error, signup ? 'signup' : 'signin')); }
    finally {setBusy(false);}
  };
  return <div className="mx-auto flex min-h-[calc(100dvh-48px)] max-w-[520px] items-center justify-center px-5 py-10 sm:px-7 xl:min-h-[calc(100dvh-60px)]">
    <form onSubmit={submit} className="w-full rounded-2xl border border-[#e0e6e8] bg-white p-6 shadow-[0_16px_40px_rgba(24,52,81,0.08)] sm:p-8"><div className="mb-5"><div className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#a57934]">{signup?'Créer un compte':'Connexion'}</div><h1 className="mt-1 font-serif text-2xl font-extrabold text-[#183451]">{signup?'Rejoindre KaziGoma':'Accéder à mon compte'}</h1></div>
      {signup&&<><label className="mb-4 block text-xs font-bold text-[#506273]">Nom complet<input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} maxLength={100} className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] px-3 py-3 text-sm font-normal" required/></label><label className="mb-4 block text-xs font-bold text-[#506273]">Je suis<select value={role} onChange={e=>setRole(e.target.value as 'client'|'professional')} className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] bg-white px-3 py-3 text-sm font-normal"><option value="client">Un client</option><option value="professional">Un professionnel</option></select></label></>}
      <label className="mb-4 block text-xs font-bold text-[#506273]">Adresse e-mail<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="vous@exemple.cd" className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] px-3 py-3 text-sm font-normal" required/></label>
      <label className="mb-4 block text-xs font-bold text-[#506273]">Mot de passe<input type="password" autoComplete={signup?'new-password':'current-password'} minLength={6} value={password} onChange={e=>setPassword(e.target.value)} placeholder="6 caractères minimum" className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] px-3 py-3 text-sm font-normal" required/></label>
      {message&&<p role="status" className="mb-3 rounded-lg bg-[#f3f6f7] p-3 text-xs leading-5 text-[#526575]">{message}</p>}
      <button disabled={busy} className="mt-2 w-full rounded-lg bg-[#183451] py-3 text-sm font-bold text-white disabled:opacity-60" data-testid="button-auth">{busy?'Patientez…':signup?'Créer mon compte':'Se connecter'}</button>
      <div className="mt-5 border-t border-[#edf0f1] pt-4 text-center text-xs text-[#74828c]">{signup?'Déjà un compte ?':'Vous cherchez un professionnel ?'} <Link href={signup?'/connexion':'/'} className="font-bold text-[#284b68]">{signup?'Connexion':'Explorer les profils'}</Link></div>
    </form>
  </div>;
}

function ClientSpace() {
  const {data,setData}=useDemo();
  const [tab,setTab]=useState<'requests'|'saved'>('requests');
  const saved=data.favorites.map(f=>({profile:data.profiles.find(p=>p.id===f.professionalId),pro:data.professionals.find(p=>p.profileId===f.professionalId)})).filter(x=>x.profile&&x.pro);
  return <div className="page-enter mx-auto max-w-[1060px] px-4 py-10 sm:px-7"><PageTitle eyebrow="Espace client · démonstration" title="Votre suivi, en un seul endroit" text="Les demandes et favoris sont enregistrés dans le stockage local de ce navigateur uniquement."/>
    <div className="mb-5 flex gap-2 border-b border-[#dfe5e8]"><button onClick={()=>setTab('requests')} className={`border-b-2 px-3 py-3 text-sm font-bold ${tab==='requests'?'border-[#183451] text-[#183451]':'border-transparent text-[#76838d]'}`}>Mes demandes ({data.requests.length})</button><button onClick={()=>setTab('saved')} className={`border-b-2 px-3 py-3 text-sm font-bold ${tab==='saved'?'border-[#183451] text-[#183451]':'border-transparent text-[#76838d]'}`}>Professionnels enregistrés ({saved.length})</button></div>
    {tab==='requests'?data.requests.length?<div className="space-y-3">{data.requests.map(r=>{const p=data.profiles.find(x=>x.id===r.professionalId);return <article key={r.id} className="rounded-xl border border-[#e0e6e8] bg-white p-4 sm:flex sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><h3 className="font-bold text-[#24425c]">{p?.name??'Profil indisponible'}</h3><StatusPill status={r.status}/></div><p className="mt-1 text-sm text-[#5f707d]">{r.description}</p><p className="mt-2 text-[10px] text-[#87939b]">{r.neighborhood} · {r.createdAt} · demande fictive</p></div><button onClick={()=>{if(window.confirm('Supprimer cette demande de la démo ?'))setData(prev=>({...prev,requests:prev.requests.filter(x=>x.id!==r.id)}))}} className="mt-3 text-xs font-bold text-[#9b5144] sm:mt-0">Supprimer</button></article>})}</div>:<EmptyState title="Aucune demande pour le moment" text="Choisissez un professionnel et décrivez votre besoin pour créer une demande de démonstration." href="/" action="Trouver un professionnel"/>:
    saved.length?<div className="grid gap-3 sm:grid-cols-2">{saved.map(({profile,pro})=><article key={pro!.profileId} className="flex items-center gap-3 rounded-xl border border-[#e0e6e8] bg-white p-4"><Avatar profile={profile!}/><div className="min-w-0 flex-1"><h3 className="font-bold text-[#24425c]">{profile!.name}</h3><p className="text-xs text-[#778590]">{pro!.trade} · {profile!.neighborhood}</p></div><Link href={`/professionnels/${pro!.profileId}`} className="text-xs font-bold text-[#365873]">Profil</Link><button onClick={()=>setData(prev=>({...prev,favorites:prev.favorites.filter(x=>x.professionalId!==pro!.profileId)}))} aria-label="Retirer des favoris" className="p-2 text-[#a45f4d]"><X size={16}/></button></article>)}</div>:<EmptyState title="Vos favoris apparaîtront ici" text="Enregistrez les professionnels que vous souhaitez retrouver facilement." href="/" action="Explorer les profils"/>}
    <div className="mt-6"><DemoNote>Aucune demande n’est envoyée à un professionnel : cet espace ne synchronise aucune donnée avec un serveur.</DemoNote></div>
  </div>;
}
function StatusPill({status}:{status:string}) { const style=status==='Terminée'?'bg-[#edf4ef] text-[#42674d]':status==='Refusée'?'bg-[#f9eeec] text-[#9f5145]':status==='En cours'?'bg-[#eef2f6] text-[#4a6279]':'bg-[#fff4df] text-[#8c672a]';return <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${style}`}>{status}</span>; }
function EmptyState({title,text,href,action}:{title:string;text:string;href:string;action:string}) { return <div className="rounded-2xl border border-dashed border-[#ccd7dc] bg-white px-5 py-14 text-center"><Bookmark size={25} className="mx-auto text-[#8fa0aa]"/><h2 className="mt-3 font-serif text-xl font-bold text-[#183451]">{title}</h2><p className="mx-auto mt-2 max-w-sm text-sm text-[#73828c]">{text}</p><Link href={href} className="mt-5 inline-block rounded-lg bg-[#183451] px-4 py-2.5 text-xs font-bold text-white">{action}</Link></div>; }

function ProSpace() {
  const {data,setData}=useDemo();
  const [selected,setSelected]=useState('p1');
  const pro=data.professionals.find(p=>p.profileId===selected)??data.professionals[0];
  const profile=data.profiles.find(p=>p.id===pro.profileId)!;
  const [saved,setSaved]=useState(false);
  const [portfolioMessage,setPortfolioMessage]=useState('');
  const updateProfile=(field:keyof Profile,value:string)=>setData(prev=>({...prev,profiles:prev.profiles.map(p=>p.id===selected?{...p,[field]:value}:p)}));
  const updatePro=(field:keyof Professional,value:string|number|string[])=>setData(prev=>({...prev,professionals:prev.professionals.map(p=>p.profileId===selected?{...p,[field]:value}:p)}));
  const uploadPortfolio=(files:FileList|null)=>{
    if(!files?.length)return;
    const images=Array.from(files);
    const currentImageCount=pro.portfolio.filter(item=>item.startsWith('data:image/')).length;
    if(currentImageCount+images.length>3){setPortfolioMessage('Limite démo : 3 images au maximum par profil.');return;}
    if(images.some(file=>!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>350_000)){setPortfolioMessage('Choisissez des images PNG, JPEG ou WebP de 350 Ko maximum.');return;}
    Promise.all(images.map(file=>new Promise<string>((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>typeof reader.result==='string'?resolve(reader.result):reject(new Error('Lecture image impossible'));
      reader.onerror=()=>reject(new Error('Lecture image impossible'));
      reader.readAsDataURL(file);
    }))).then(uploaded=>{
      setData(prev=>({...prev,professionals:prev.professionals.map(item=>item.profileId===selected?{...item,portfolio:[...item.portfolio,...uploaded]}:item)}));
      setPortfolioMessage('Images enregistrées dans le stockage local de cette démo.');
    }).catch(()=>setPortfolioMessage('Impossible de lire ces images. Réessayez avec un autre fichier.'));
  };
  return <div className="page-enter mx-auto max-w-[1080px] px-4 py-10 sm:px-7"><PageTitle eyebrow="Espace professionnel · démonstration" title="Votre activité, mieux visible" text="Modifiez un profil fictif ou mettez à jour une demande reçue. Les changements restent dans ce navigateur."/>
    <div className="mb-5"><DemoNote>Aucune authentification n’est configurée. Ce tableau de bord est un aperçu public de démonstration, pas un espace sécurisé.</DemoNote></div>
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-2xl border border-[#e0e6e8] bg-white p-5"><div className="flex items-center justify-between"><h2 className="font-serif text-xl font-bold text-[#183451]">Modifier un profil démo</h2><select value={selected} onChange={e=>setSelected(e.target.value)} className="max-w-[150px] rounded-lg border border-[#dfe5e8] bg-white px-2 py-2 text-xs">{data.profiles.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <div className="mt-4 flex items-center gap-3 border-b border-[#edf0f1] pb-4"><Avatar profile={profile}/><div><div className="font-bold text-[#24425c]">{profile.name}</div><div className="text-xs text-[#79858e]">{pro.trade} · profil fictif</div></div></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2"><EditField label="Nom affiché" value={profile.name} onChange={v=>updateProfile('name',v)}/><EditField label="Métier" value={pro.trade} onChange={v=>updatePro('trade',v)}/><EditField label="Quartier" value={profile.neighborhood} onChange={v=>updateProfile('neighborhood',v)}/><EditField label="Tarif indicatif" value={pro.indicativeRate} onChange={v=>updatePro('indicativeRate',v)}/><label className="block text-xs font-bold text-[#586b7a]">Disponibilité<select value={pro.availability} onChange={e=>updatePro('availability',e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] bg-white px-3 py-2.5 text-sm font-normal">{['Disponible aujourd’hui','Disponible demain','Cette semaine','Indisponible'].map(v=><option key={v}>{v}</option>)}</select></label><EditField label="Expérience (années)" value={String(pro.experienceYears)} onChange={v=>updatePro('experienceYears',Number(v)||0)}/></div>
        <label className="mt-3 block text-xs font-bold text-[#586b7a]">Présentation<textarea value={pro.description} onChange={e=>updatePro('description',e.target.value)} rows={4} className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] px-3 py-2.5 text-sm font-normal"/></label>
        <label className="mt-3 block text-xs font-bold text-[#586b7a]">Compétences <span className="font-normal text-[#89959d]">(séparées par des virgules)</span><input value={pro.skills.join(', ')} onChange={e=>updatePro('skills',e.target.value.split(',').map(x=>x.trim()).filter(Boolean))} className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] px-3 py-2.5 text-sm font-normal"/></label>
        <label className="mt-3 block text-xs font-bold text-[#586b7a]">Zones d’intervention <span className="font-normal text-[#89959d]">(séparées par des virgules)</span><input value={pro.serviceArea.join(', ')} onChange={e=>updatePro('serviceArea',e.target.value.split(',').map(x=>x.trim()).filter(Boolean))} className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] px-3 py-2.5 text-sm font-normal"/></label>
        <label className="mt-3 block text-xs font-bold text-[#586b7a]">Photos de réalisations (démo)<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>{uploadPortfolio(e.currentTarget.files);e.currentTarget.value=''}} className="mt-1.5 block w-full rounded-lg border border-[#dfe5e8] px-3 py-2 text-xs font-normal"/></label><p className="mt-1 text-[10px] text-[#82909a]">3 images max, 350 Ko chacune. Stockées uniquement dans ce navigateur. {portfolioMessage}</p>
        <div className="mt-2 flex flex-wrap gap-2">{pro.portfolio.map((item,index)=>item.startsWith('data:image/')?<div key={`upload-${index}`} className="relative"><img src={item} alt="Réalisation fictive" className="h-16 w-16 rounded-lg border border-[#dfe5e8] object-cover"/><button type="button" onClick={()=>updatePro('portfolio',pro.portfolio.filter((_,i)=>i!==index))} aria-label="Supprimer cette image démo" className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#183451] text-white"><X size={12}/></button></div>:null)}</div>
        <button onClick={()=>{setSaved(true);window.setTimeout(()=>setSaved(false),2400)}} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#183451] py-2.5 text-sm font-bold text-white">{saved?<><Check size={16}/>Modifications conservées dans la démo</>:'Enregistrer les modifications locales'}</button>
      </section>
      <section className="rounded-2xl border border-[#e0e6e8] bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="font-serif text-xl font-bold text-[#183451]">Demandes reçues</h2><p className="mt-1 text-xs text-[#78858e]">Toutes données fictives</p></div><span className="rounded-full bg-[#eef2f4] px-2.5 py-1 text-xs font-bold text-[#456178]">{data.requests.filter(r=>r.professionalId===selected).length}</span></div>
         <div className="mt-4 space-y-3">{data.requests.filter(r=>r.professionalId===selected).map(r=><article key={r.id} className="rounded-xl border border-[#e5e9ea] p-4"><div className="flex items-center justify-between"><h3 className="text-sm font-bold text-[#2a455d]">{r.clientName}</h3><StatusPill status={r.status}/></div><p className="mt-2 text-sm leading-5 text-[#5e6d78]">{r.description}</p><p className="mt-2 text-[10px] text-[#84919a]">{r.neighborhood} · {r.createdAt}</p><label className="mt-3 block text-[10px] font-bold uppercase tracking-wider text-[#76848c]">Mettre à jour<select value={r.status} onChange={e=>setData(prev=>({...prev,requests:prev.requests.map(x=>x.id===r.id?{...x,status:e.target.value}:x)}))} className="mt-1 block w-full rounded-lg border border-[#dfe5e8] bg-white px-3 py-2 text-xs font-semibold normal-case tracking-normal text-[#29465e]">{statusOptions.map(s=><option key={s}>{s}</option>)}</select></label></article>)}</div>
        {!data.requests.some(r=>r.professionalId===selected)&&<div className="rounded-xl border border-dashed border-[#d4dde0] p-8 text-center"><Clock3 size={22} className="mx-auto text-[#82939d]"/><p className="mt-3 text-sm font-semibold text-[#476075]">Aucune demande pour ce profil</p><p className="mt-1 text-xs text-[#87939b]">Les nouvelles demandes de démonstration apparaîtront ici.</p></div>}
        <div className="mt-4"><DemoNote>Les changements de statut sont locaux et ne préviennent aucun client.</DemoNote></div>
      </section>
    </div>
  </div>;
}
function EditField({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}) { return <label className="block text-xs font-bold text-[#586b7a]">{label}<input value={value} onChange={e=>onChange(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] px-3 py-2.5 text-sm font-normal"/></label>; }

function AdminPage() {
  const {data,setData}=useDemo();
  const [tab,setTab]=useState('Profils');
  const [category,setCategory]=useState('');
  const [categoryMessage,setCategoryMessage]=useState('');
  const [moderationReasons,setModerationReasons]=useState<Record<string,string>>({});
  const [moderationError,setModerationError]=useState('');
  const moderate=(profileId:string,status:'Profil fictif'|'Suspendu (démo)'|'Refusé (démo)')=>{
    const reason=moderationReasons[profileId]?.trim()??'';
    if(status!=='Profil fictif'&&reason.length<3){setModerationError('Ajoutez un motif d’au moins 3 caractères avant de suspendre ou refuser.');return;}
    setData(prev=>({...prev,professionals:prev.professionals.map(p=>p.profileId===profileId?{...p,verificationStatus:status,suspended:status!=='Profil fictif',moderationReason:status==='Profil fictif'?undefined:reason}:p)}));
    setModerationError('');
  };
  return <div className="page-enter mx-auto max-w-[1240px] px-4 py-8 sm:px-7 sm:py-10">
    <div className="mb-7 flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-br from-[#10385e] via-[#174572] to-[#0d5ebd] p-6 text-white shadow-[0_18px_40px_rgba(16,56,94,.18)] sm:flex-row sm:items-end sm:p-8">
      <div><div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#f4c35e]"><ShieldCheck size={15}/> Console d’administration</div><h1 className="font-serif text-3xl font-extrabold tracking-tight sm:text-4xl">Tableau de bord</h1><p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">Gérez les profils, les catégories de services et les signalements depuis un seul espace.</p></div>
      <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-xs text-blue-50"><div className="font-bold text-white">Environnement démo</div><div className="mt-1">Données enregistrées sur cet appareil</div></div>
    </div>
    <div className="mb-6"><DemoNote>Les modifications sont locales à cette démonstration et ne changent pas les données de la base.</DemoNote></div>
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-[#e4eaf0] bg-white p-5 shadow-[0_5px_18px_rgba(16,56,94,.05)]"><div className="flex items-center justify-between"><span className="text-xs font-bold text-[#71808b]">PROFILS</span><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf2fb] text-[#0d5ebd]"><UserRound size={19}/></span></div><div className="mt-3 text-3xl font-extrabold tracking-tight text-[#183451]">{data.professionals.length}</div><div className="mt-1 text-xs text-[#71808b]">Profils professionnels</div></div>
      <div className="rounded-2xl border border-[#e4eaf0] bg-white p-5 shadow-[0_5px_18px_rgba(16,56,94,.05)]"><div className="flex items-center justify-between"><span className="text-xs font-bold text-[#71808b]">DEMANDES</span><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff5df] text-[#a57934]"><Clock3 size={19}/></span></div><div className="mt-3 text-3xl font-extrabold tracking-tight text-[#183451]">{data.requests.length}</div><div className="mt-1 text-xs text-[#71808b]">Demandes reçues</div></div>
      <div className="rounded-2xl border border-[#e4eaf0] bg-white p-5 shadow-[0_5px_18px_rgba(16,56,94,.05)]"><div className="flex items-center justify-between"><span className="text-xs font-bold text-[#71808b]">À EXAMINER</span><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f9eeec] text-[#a65445]"><Info size={19}/></span></div><div className="mt-3 text-3xl font-extrabold tracking-tight text-[#183451]">{data.reports.filter(r=>r.status==='Ouvert').length}</div><div className="mt-1 text-xs text-[#71808b]">Signalements ouverts</div></div>
    </div>
    <div role="tablist" aria-label="Sections d’administration" className="mt-8 flex gap-1 overflow-x-auto rounded-xl border border-[#e4eaf0] bg-white p-1.5 shadow-sm">{['Profils','Catégories','Signalements'].map(t=><button role="tab" aria-selected={tab===t} key={t} onClick={()=>setTab(t)} className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-bold transition ${tab===t?'bg-[#183451] text-white shadow-sm':'text-[#667887] hover:bg-[#f1f5f8] hover:text-[#183451]'}`}>{t}</button>)}</div>
    {tab==='Profils'&&<div className="mt-4 overflow-hidden rounded-2xl border border-[#e0e6e8] bg-white shadow-[0_5px_20px_rgba(16,56,94,.05)]"><div className="border-b border-[#edf0f1] px-5 py-4"><h2 className="font-serif text-lg font-bold text-[#183451]">Gestion des profils</h2><p className="mt-1 text-xs text-[#78858e]">Examinez chaque profil et choisissez une action de modération.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left text-xs"><thead className="bg-[#f5f8fa] text-[10px] uppercase tracking-wider text-[#71808b]"><tr><th className="p-4">Profil fictif</th><th className="p-4">Métier</th><th className="p-4">Statut</th><th className="p-4">Motif</th><th className="p-4">Actions</th></tr></thead><tbody>{data.professionals.map(p=>{const person=data.profiles.find(x=>x.id===p.profileId);return <tr key={p.profileId} className="border-t border-[#edf0f1] hover:bg-[#fbfcfd]"><td className="p-4 font-semibold text-[#2b465d]">{person?.name??'Profil démo'}</td><td className="p-4 text-[#637480]">{p.trade}</td><td className="p-4"><span className="rounded-full bg-[#edf4ef] px-2.5 py-1 font-semibold text-[#466b4d]">{p.verificationStatus}</span></td><td className="p-4"><input aria-label={`Motif de modération pour ${person?.name??'ce profil'}`} value={moderationReasons[p.profileId]??p.moderationReason??''} onChange={e=>setModerationReasons(prev=>({...prev,[p.profileId]:e.target.value}))} maxLength={500} className="w-48 rounded-lg border border-[#dfe5e8] px-3 py-2 text-xs outline-none focus:border-[#0d5ebd]" placeholder="Motif requis"/></td><td className="p-4"><div className="flex gap-1.5"><button onClick={()=>moderate(p.profileId,'Suspendu (démo)')} className="rounded-lg bg-[#fff4df] px-2.5 py-2 font-bold text-[#8c672a] hover:bg-[#ffebc5]">Suspendre</button><button onClick={()=>moderate(p.profileId,'Refusé (démo)')} className="rounded-lg bg-[#f9eeec] px-2.5 py-2 font-bold text-[#994d43] hover:bg-[#f3dfdb]">Refuser</button><button onClick={()=>moderate(p.profileId,'Profil fictif')} className="rounded-lg bg-[#edf4ef] px-2.5 py-2 font-bold text-[#466b4d] hover:bg-[#dfeee2]">Réactiver</button></div>{p.moderationReason&&<p className="mt-2 max-w-52 text-[10px] text-[#8b5144]">Motif : {p.moderationReason}</p>}</td></tr>})}</tbody></table></div>{moderationError&&<p role="alert" className="border-t border-[#edf0f1] bg-[#fff8f6] px-4 py-3 text-xs text-[#9f5145]">{moderationError}</p>}</div>}
    {tab==='Catégories'&&<section className="mt-4 overflow-hidden rounded-2xl border border-[#e0e6e8] bg-white shadow-[0_5px_20px_rgba(16,56,94,.05)]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f1] px-5 py-4"><div><h2 className="font-serif text-lg font-bold text-[#183451]">Catégories de services</h2><p className="mt-1 text-xs text-[#78858e]">Ajoutez les métiers proposés et retirez ceux qui ne sont plus utiles.</p></div><span className="rounded-full bg-[#edf4fc] px-3 py-1.5 text-xs font-bold text-[#174572]">{data.categories.length} catégorie{data.categories.length===1?'':'s'}</span></div>
      <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">{data.categories.map(c=><div key={c.id} className="group flex min-h-[76px] items-center justify-between gap-3 rounded-xl border border-[#e4eaf0] bg-[#fbfcfd] p-3 transition hover:border-[#bfd2e6] hover:bg-white"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf2fb] text-sm font-extrabold text-[#174572]">{c.icon}</span><span className="text-sm font-bold leading-5 text-[#29445c]">{c.label}</span></div><button type="button" onClick={()=>setData(prev=>({...prev,categories:prev.categories.filter(x=>x.id!==c.id)}))} aria-label={`Supprimer la catégorie ${c.label}`} title={`Supprimer ${c.label}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#f0d8d4] bg-white text-[#a65445] transition hover:bg-[#f9eeec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d89082]"><Trash2 size={15}/></button></div>)}
      {data.categories.length===0&&<p className="col-span-full rounded-xl border border-dashed border-[#d4dde0] p-8 text-center text-sm text-[#71808b]">Aucune catégorie. Ajoutez votre premier service ci-dessous.</p>}</div>
      <form onSubmit={e=>{e.preventDefault();const label=category.trim();if(!label){setCategoryMessage('Saisissez un nom de catégorie.');return;}if(data.categories.some(c=>c.label.toLocaleLowerCase('fr')===label.toLocaleLowerCase('fr'))){setCategoryMessage('Cette catégorie existe déjà.');return;}setData(prev=>({...prev,categories:[...prev.categories,{id:`custom-${Date.now()}`,label,icon:label.slice(0,2).toLocaleUpperCase('fr')}]}));setCategory('');setCategoryMessage('Catégorie ajoutée.');}} className="border-t border-[#edf0f1] bg-[#f7f9fb] p-5"><label htmlFor="admin-category" className="mb-2 block text-xs font-bold text-[#435c70]">Ajouter une catégorie</label><div className="flex flex-col gap-2 sm:flex-row"><input id="admin-category" value={category} onChange={e=>{setCategory(e.target.value);setCategoryMessage('')}} placeholder="Ex. Peinture, couture, jardinage…" maxLength={80} className="min-w-0 flex-1 rounded-lg border border-[#d6e0e8] bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-[#93a0aa] focus:border-[#0d5ebd] focus:ring-2 focus:ring-[#0d5ebd]/10"/><button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#0d5ebd] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0b4fa7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3b52f]"><Plus size={17}/>Ajouter la catégorie</button></div>{categoryMessage&&<p aria-live="polite" className={`mt-2 text-xs font-semibold ${categoryMessage==='Catégorie ajoutée.'?'text-[#466b4d]':'text-[#a65445]'}`}>{categoryMessage}</p>}</form>
    </section>}
    {tab==='Signalements'&&(data.reports.length?<div className="mt-4 space-y-3">{data.reports.map(report=>{const person=data.profiles.find(p=>p.id===report.professionalId);return <article key={report.id} className="rounded-xl border border-[#e0e6e8] bg-white p-4 sm:flex sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><h2 className="font-bold text-[#29445c]">{person?.name??'Profil démo'}</h2><StatusPill status={report.status}/></div><p className="mt-1 text-sm text-[#62717e]">{report.reason}</p><p className="mt-1 text-[10px] text-[#8a969d]">{report.createdAt} · signalement fictif</p></div><div className="mt-3 flex gap-2 sm:mt-0"><button onClick={()=>setData(prev=>({...prev,reports:prev.reports.map(r=>r.id===report.id?{...r,status:'Traité'}:r)}))} className="rounded-md bg-[#edf4ef] px-3 py-2 text-xs font-bold text-[#466b4d]">Traiter</button><button onClick={()=>setData(prev=>({...prev,reports:prev.reports.map(r=>r.id===report.id?{...r,status:'Écarté'}:r)}))} className="rounded-md border border-[#dfe5e8] px-3 py-2 text-xs font-bold text-[#596a78]">Écarter</button></div></article>})}</div>:<div className="mt-4 rounded-xl border border-dashed border-[#ccd7dc] bg-white px-5 py-12 text-center"><ShieldCheck size={25} className="mx-auto text-[#8c9aa3]"/><h2 className="mt-3 font-serif text-lg font-bold text-[#183451]">Aucun signalement dans la démo</h2><p className="mt-1 text-xs text-[#77858e]">Les signalements créés sur un profil de démonstration apparaîtront ici.</p></div>)}
  </div>;
}

function HowPage() {
  const steps=[['01','Cherchez autour de vous','Choisissez un métier, un quartier et un rayon. Les profils sont classés selon des critères expliqués.'],['02','Comparez les profils','Consultez les compétences, les disponibilités, les tarifs indicatifs et les avis fictifs de cette démo.'],['03','Prenez contact','Décrivez le travail souhaité. Dans la démo, la demande reste enregistrée sur votre appareil.'],['04','Décidez ensemble','Échangez directement avec le professionnel pour confirmer le prix, le délai et les détails.']];
  return <div className="page-enter mx-auto max-w-[1050px] px-4 py-10 sm:px-7 sm:py-14"><PageTitle eyebrow="Simple, local, transparent" title="Des compétences proches. Un choix qui vous appartient." text="KaziGoma aide les habitants de Goma à découvrir les savoir-faire de leur quartier et les professionnels à faire connaître leur activité."/>
    <section className="rounded-2xl bg-[#183451] p-6 text-white sm:p-9"><div className="grid gap-7 sm:grid-cols-2">{steps.map(([n,title,text])=><div key={n} className="border-l border-[#f0bf62]/50 pl-4"><span className="text-xs font-extrabold tracking-widest text-[#f0bf62]">{n}</span><h2 className="mt-2 font-serif text-xl font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#cbd8e1]">{text}</p></div>)}</div></section>
    <div className="mt-8 grid gap-4 sm:grid-cols-2"><article className="rounded-xl border border-[#e0e6e8] bg-white p-5"><h3 className="font-serif text-lg font-bold text-[#183451]">Pour les habitants</h3><p className="mt-2 text-sm leading-6 text-[#687885]">Comparez plusieurs profils, consultez leur zone d’intervention et présentez votre besoin avant de prendre une décision.</p></article><article className="rounded-xl border border-[#e0e6e8] bg-white p-5"><h3 className="font-serif text-lg font-bold text-[#183451]">Pour les professionnels</h3><p className="mt-2 text-sm leading-6 text-[#687885]">Présentez vos services, votre expérience et les quartiers où vous intervenez. Un profil clair aide les clients à vous trouver.</p></article></div>
    <div className="mt-5"><DemoNote>Cette version est une démonstration : profils, avis, tarifs, coordonnées, points de carte et statistiques sont fictifs. Aucun contrôle d’identité n’est effectué. Les modifications sont locales.</DemoNote></div>
    <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#183451] px-5 py-3 text-sm font-bold text-white">Trouver un professionnel <ArrowRight size={15}/></Link>
  </div>;
}

function ContactPage() {
  const [sent,setSent]=useState(false);
  const [errors,setErrors]=useState('');
  return <div className="page-enter mx-auto grid max-w-[1050px] gap-8 px-4 py-10 sm:px-7 md:grid-cols-[.8fr_1.2fr] md:py-14"><div><PageTitle eyebrow="Échangeons" title="Nous sommes à l’écoute." text="Une question sur la démo, une suggestion ou un besoin d’information ? Écrivez-nous."/><div className="rounded-2xl bg-[#183451] p-6 text-white"><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#f0bf62]">Contact de démonstration</div><a href="mailto:bonjour@kazigoma.cd" className="mt-2 block text-lg font-bold">bonjour@kazigoma.cd</a><p className="mt-2 text-sm leading-6 text-[#cbd8e1]">Une adresse indicative pour la maquette. Aucun service de contact n’est encore connecté.</p></div></div>
    <form onSubmit={e=>{e.preventDefault();setSent(true);setErrors('')}} className="rounded-2xl border border-[#e0e6e8] bg-white p-5 sm:p-7"><h2 className="font-serif text-xl font-extrabold text-[#183451]">Laisser un message</h2><p className="mt-1 text-xs text-[#78858e]">État d’envoi simulé. Rien n’est transmis.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-[#556a79]">Nom<input required className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] px-3 py-2.5 text-sm font-normal"/></label><label className="text-xs font-bold text-[#556a79]">Adresse e-mail<input required type="email" className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] px-3 py-2.5 text-sm font-normal"/></label></div><label className="mt-3 block text-xs font-bold text-[#556a79]">Sujet<select className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] bg-white px-3 py-2.5 text-sm font-normal"><option>Question sur la plateforme</option><option>Je suis professionnel</option><option>Suggestion</option></select></label><label className="mt-3 block text-xs font-bold text-[#556a79]">Message<textarea required minLength={10} rows={5} className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] px-3 py-2.5 text-sm font-normal"/></label>{errors&&<p className="mt-2 text-xs text-[#a34436]">{errors}</p>}{sent&&<div className="mt-3 rounded-lg bg-[#edf4ef] px-3 py-2.5 text-xs font-semibold text-[#43694c]">Message de test accepté. Il n’a pas été envoyé et ne sera pas conservé.</div>}<button className="mt-4 rounded-lg bg-[#183451] px-5 py-3 text-sm font-bold text-white">Simuler l’envoi</button></form>
  </div>;
}

export default App;
