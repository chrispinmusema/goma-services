import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ArrowLeft, ArrowRight, BadgeCheck, Bookmark, CarFront, Check, ChevronDown, Clock3, Compass, Hammer, Heart, House, Info, Laptop, Link2, LogOut, MapPin, Menu, Navigation, Phone, Plus, Search, ShieldCheck, SlidersHorizontal, Smartphone, Star, Trash2, UserRound, Wrench, X, Zap } from 'lucide-react';
import { neighborhoods } from './lib/neighborhoods';
import { supabase } from './lib/supabase';

const client = new QueryClient();
const navLinks = [['/', 'Accueil'], ['/fonctionnement', 'Comment ça marche'], ['/contact', 'Contact']];

function App() {
  return <QueryClientProvider client={client}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Shell><Switch>
    <Route path="/" component={HomePage} />
    <Route path="/professionnels/:id" component={ProfessionalPage} />
    <Route path="/connexion" component={AuthPage} />
    <Route path="/inscription" component={AuthPage} />
    <Route path="/auth/callback" component={AuthCallbackPage} />
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
  const [location, setLocation] = useLocation();
  const [account, setAccount] = useState<{ id: string; email: string; name: string; role: string } | null>(null);
  const mobileNavLinks = [...navLinks, [account?.role === 'professional' ? '/espace/pro' : account?.role === 'admin' ? '/admin' : '/espace/client', 'Mon espace'], ...(!account ? [['/connexion', 'Connexion'], ['/inscription', 'Inscrire mon activité']] : [])];
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const loadAccount = async (user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null) => {
      if (!user) { if (active) setAccount(null); return; }
      let profile: { display_name: string; role: string };
      try { profile = await ensureAccountProfile(user); }
      catch { if (active) setAccount(null); return; }
      if (!active) return;
      setAccount({
        id: user.id,
        email: user.email ?? '',
        name: profile.display_name || user.email || 'Mon compte',
        role: profile.role,
      });
    };
    void supabase.auth.getUser().then(({ data }) => loadAccount(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      if (!user) { setAccount(null); return; }
      window.setTimeout(() => { void loadAccount(user); }, 0);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  const signOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) return;
    setAccount(null);
    setMenu(false);
    setLocation('/');
  };
  const roleLabel = account?.role === 'professional' ? 'Professionnel' : account?.role === 'admin' ? 'Administrateur' : account?.role === 'client' ? 'Client' : 'Compte';
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
          {account ? <><Link href={account.role === 'professional' ? '/espace/pro' : account.role === 'admin' ? '/admin' : '/espace/client'} className="flex max-w-[220px] items-center gap-2 rounded-full border border-[#dbe9ff] bg-white px-3.5 py-2 text-left shadow-sm hover:bg-[#f7fbff]"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eaf2fb] text-[#0d5ebd]"><UserRound size={15}/></span><span className="min-w-0"><span className="block truncate text-[11px] font-extrabold text-[#183451]">{account.name}</span><span className="block text-[10px] font-semibold text-[#0d5ebd]">Compte {roleLabel}</span></span></Link><button onClick={signOut} className="inline-flex items-center gap-2 rounded-full border border-[#e2e8ed] bg-white px-3.5 py-2.5 text-[11px] font-bold text-[#405268] transition hover:bg-[#f4f7f9]"><LogOut size={14}/>Se déconnecter</button></> : <><Link href="/connexion" className="inline-flex items-center gap-2 rounded-full border border-[#dbe9ff] bg-white px-4 py-2.5 text-[12px] font-bold text-[#11487f] shadow-[0_1px_0_rgba(13,94,189,0.08),0_3px_12px_rgba(13,94,189,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#f7fbff] hover:shadow-[0_1px_0_rgba(13,94,189,0.08),0_6px_18px_rgba(13,94,189,0.1)]"><Link2 size={15} className="text-[#0d5ebd]"/>Se connecter</Link>
          <Link href="/inscription" className="inline-flex items-center gap-2.5 rounded-full bg-[#0d5ebd] px-4 py-2.5 text-[12px] font-extrabold text-white shadow-[0_8px_18px_rgba(13,94,189,0.2)] ring-1 ring-[#0d5ebd]/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0b4fa7] hover:shadow-[0_10px_22px_rgba(13,94,189,0.25)]"><UserRound size={15} className="text-white"/>Créer un compte</Link></>}
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
            {account && <div className="rounded-xl border border-[#dbe9ff] bg-[#f7fbff] px-4 py-3"><div className="flex items-center gap-2 text-xs font-extrabold text-[#183451]"><UserRound size={15} className="text-[#0d5ebd]"/>{account.name}</div><div className="mt-1 text-[11px] font-semibold text-[#0d5ebd]">Compte {roleLabel}{account.email ? ` · ${account.email}` : ''}</div><button onClick={signOut} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#dfe5e8] bg-white text-sm font-bold text-[#405268]"><LogOut size={15}/>Se déconnecter</button></div>}
          </div>
        </nav>
      </div>}
    </header>
    <main>{children}</main>
    {location !== '/connexion' && location !== '/inscription' && <footer className="mt-16 bg-[#183451] text-white">
      <div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-10 sm:grid-cols-[1fr_auto] sm:px-7">
        <div><div className="font-serif text-xl font-extrabold">Kazi<span className="text-[#f0bf62]">Goma</span></div><p className="mt-2 max-w-md text-sm leading-6 text-[#cad5df]">Les compétences de Goma, à portée de main. Une mise en relation locale.</p></div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#d5dfe6]"><Link href="/">Trouver un pro</Link><Link href="/fonctionnement">Fonctionnement</Link><Link href="/contact">Contact</Link></div>
      </div>
    </footer>}
  </div>;
}

function PageTitle({ eyebrow, title, text }: { eyebrow?: string; title: string; text?: string }) {
  return <div className="mb-7"><div className="mb-2 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#a57934]">{eyebrow}</div><h1 className="font-serif text-3xl font-extrabold tracking-[-1px] text-[#183451] sm:text-[38px]">{title}</h1>{text && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#647384]">{text}</p>}</div>;
}
function InfoNote({ children }: { children: ReactNode }) { return <div className="flex gap-2 rounded-lg border border-[#ead9b7] bg-[#fff9ee] px-3 py-2.5 text-xs leading-5 text-[#735b35]"><Info size={15} className="mt-0.5 shrink-0"/><span>{children}</span></div>; }
type LiveSearchRecord = {
  profile_id: string;
  display_name: string;
  neighborhood: string | null;
  category_name: string;
  description: string;
  experience_years: number;
  indicative_rate: number | null;
  rate_currency: string;
  available: boolean;
  service_area: string[];
  public_contact_phone: string | null;
  skills: string[];
  average_rating: number | null;
  review_count: number;
  approximate_distance_meters: number | null;
};
type ProfessionalMedia = { avatar_path: string | null; portfolio_paths: string[] };
function professionalMediaUrl(path: string | null | undefined) { return path && supabase ? supabase.storage.from('professional-media').getPublicUrl(path).data.publicUrl : undefined; }

function HomePage() {
  if (supabase) return <LiveHomePage />;
  return <div className="mx-auto max-w-3xl px-5 py-16"><PageTitle eyebrow="Configuration requise" title="Le catalogue est momentanément indisponible" text="La connexion à la base de données n’est pas configurée sur cette version du site. Les comptes et les fiches doivent être chargés depuis Supabase pour être visibles sur tous les appareils."/><div className="rounded-xl border border-[#ead9b7] bg-[#fff9ee] p-4 text-sm leading-6 text-[#735b35]">Dans Vercel, vérifiez les variables <strong>VITE_SUPABASE_URL</strong> et <strong>VITE_SUPABASE_PUBLISHABLE_KEY</strong>, puis redéployez le projet.</div><Link href="/connexion" className="mt-5 inline-flex rounded-lg bg-[#183451] px-4 py-3 text-sm font-bold text-white">Connexion</Link></div>;
}

function LiveHomePage() {
  const [, setLocation] = useLocation();
  const [term, setTerm] = useState('');
  const [submittedTerm, setSubmittedTerm] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [results, setResults] = useState<LiveSearchRecord[]>([]);
  const [mediaByProfessional, setMediaByProfessional] = useState<Record<string, ProfessionalMedia>>({});
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [userId, setUserId] = useState('');
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void (async () => {
      setLoading(true);
      setError('');
      const [{ data: searchRows, error: searchError }, { data: categoryRows, error: categoryError }, { data: auth }] = await Promise.all([
        supabase.rpc('search_professionals', {
          p_query: submittedTerm.trim() || null,
          p_latitude: null,
          p_longitude: null,
          p_radius_meters: 20000,
          p_available_only: availableOnly,
          p_neighborhood: neighborhood || null,
        }),
        supabase.from('categories').select('id, name').order('name'),
        supabase.auth.getUser(),
      ]);
      if (!active) return;
      if (searchError) setError(searchError.message);
      else {
        const publicResults = (searchRows ?? []) as LiveSearchRecord[];
        setResults(publicResults);
        if (publicResults.length) {
          const { data: mediaRows, error: mediaError } = await supabase.from('professionals').select('profile_id, avatar_path, portfolio_paths').in('profile_id',publicResults.map(row=>row.profile_id));
          if (!active) return;
          if (mediaError) setError(mediaError.message);
          else setMediaByProfessional(Object.fromEntries((mediaRows??[]).map(row=>[row.profile_id,{avatar_path:row.avatar_path,portfolio_paths:row.portfolio_paths??[]}])));
        } else setMediaByProfessional({});
      }
      if (categoryError) setError(categoryError.message);
      else setCategories(categoryRows ?? []);
      if (auth.user) {
        setUserId(auth.user.id);
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', auth.user.id).maybeSingle();
        if (!active) return;
        setUserRole(profile?.role ?? '');
        if (profile?.role === 'client') {
          const { data: favorites } = await supabase.from('favorites').select('professional_id').eq('client_id', auth.user.id);
          if (active) setFavoriteIds((favorites ?? []).map(item => item.professional_id));
        }
      } else {
        setUserId('');
        setUserRole('');
        setFavoriteIds([]);
      }
      setLoading(false);
    })().catch(cause => {
      if (active) { setError(cause instanceof Error ? cause.message : 'Impossible de charger les professionnels.'); setLoading(false); }
    });
    return () => { active = false; };
  }, [submittedTerm, neighborhood, availableOnly]);

  const toggleFavorite = async (professionalId: string) => {
    if (!supabase) return;
    if (!userId) { setLocation('/connexion'); return; }
    if (userRole !== 'client') { setActionMessage('Les favoris sont disponibles avec un compte client.'); return; }
    setActionMessage('');
    const isSaved = favoriteIds.includes(professionalId);
    const response = isSaved
      ? await supabase.from('favorites').delete().eq('client_id', userId).eq('professional_id', professionalId)
      : await supabase.from('favorites').insert({ client_id: userId, professional_id: professionalId });
    if (response.error) { setActionMessage(response.error.message); return; }
    setFavoriteIds(current => isSaved ? current.filter(id => id !== professionalId) : [...current, professionalId]);
  };

  return <div className="page-enter">
    <section className="relative overflow-hidden bg-[#eff5ff] text-[#12294b]">
      <div aria-hidden="true" className="absolute inset-y-0 right-0 hidden w-[52%] bg-cover bg-center lg:block" style={{ backgroundImage: "url('/Smiling%20Team%20in%20Modern%20Workshop.png')" }}><span className="absolute inset-0 bg-gradient-to-l from-transparent to-[#eff5ff]"/></div>
      <div className="relative mx-auto max-w-[1690px] px-5 py-12 sm:px-7 sm:py-16 lg:px-[4.2%] lg:py-20">
        <div className="max-w-2xl"><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d7e5f7] bg-white/80 px-3.5 py-2 text-xs font-bold text-[#174572]"><span className="h-2 w-2 rounded-full bg-[#f3b52f]"/>Services de proximité · Goma</div><h1 className="font-sans text-4xl font-extrabold leading-tight tracking-tight text-[#102448] sm:text-6xl">Trouvez un professionnel <span className="text-[#0758d5]">vérifié à Goma</span></h1><p className="mt-4 max-w-xl text-sm leading-6 text-[#263b5a] sm:text-base">Parcourez les profils publics sans créer de compte. Connectez-vous seulement si vous souhaitez enregistrer un favori ou envoyer une demande.</p>
          <form onSubmit={event=>{event.preventDefault();setSubmittedTerm(term)}} className="mt-7 grid gap-2 rounded-2xl border border-[#dceaff] bg-white p-3 shadow-[0_18px_30px_rgba(13,94,189,0.12)] sm:grid-cols-[1.3fr_1fr_auto]">
            <label className="flex items-center gap-2 rounded-xl border border-[#e6edf5] bg-[#f7fafd] px-3 py-3 text-[#1f426d]"><Search size={16}/><input value={term} onChange={event=>setTerm(event.target.value)} placeholder="Métier ou compétence" className="w-full bg-transparent text-sm outline-none" aria-label="Rechercher un professionnel"/></label>
            <label className="flex items-center gap-2 rounded-xl border border-[#e6edf5] bg-[#f7fafd] px-3 py-3 text-[#1f426d]"><MapPin size={16}/><select value={neighborhood} onChange={event=>setNeighborhood(event.target.value)} className="w-full bg-transparent text-sm outline-none" aria-label="Filtrer par quartier"><option value="">Tous les quartiers</option>{neighborhoods.map(place=><option key={place}>{place}</option>)}</select></label>
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0d5ebd] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#0b4fa5]"><Search size={17}/>Rechercher</button>
          </form>
          <label className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#24415e]"><input type="checkbox" checked={availableOnly} onChange={event=>setAvailableOnly(event.target.checked)} className="accent-[#0d5ebd]"/>Afficher seulement les professionnels disponibles</label>
        </div>
      </div>
    </section>
    <div className="mx-auto max-w-[1690px] px-4 sm:px-7 lg:px-[4.2%]">
      <section className="py-7" aria-labelledby="live-categories-title"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 id="live-categories-title" className="border-l-4 border-[#0758d5] pl-3 text-xl font-extrabold text-[#122448]">Métiers disponibles</h2><span className="text-xs font-semibold text-[#71808b]">{categories.length} catégories</span></div><div className="flex flex-wrap gap-2">{categories.map(category=><button key={category.id} onClick={()=>{setTerm(category.name);setSubmittedTerm(category.name)}} className="rounded-full border border-[#d7e2ec] bg-white px-3.5 py-2 text-xs font-bold text-[#34516d] transition hover:border-[#0d5ebd] hover:text-[#0d5ebd]">{category.name}</button>)}</div></section>
      <section id="results" className="pb-10"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-serif text-2xl font-extrabold text-[#183451]">Professionnels vérifiés</h2><p className="mt-1 text-xs text-[#778591]">Les profils ne sont publiés qu’après validation par l’administration.</p></div><span className="rounded-full bg-[#edf4fc] px-3 py-1.5 text-xs font-bold text-[#174572]">{results.length} résultat{results.length===1?'':'s'}</span></div>
        {actionMessage&&<p role="status" className="mb-4 rounded-lg bg-[#f3f6f7] p-3 text-xs text-[#526575]">{actionMessage}</p>}
        {error&&<p role="alert" className="mb-4 rounded-lg border border-[#f0d8d4] bg-[#fff8f6] p-3 text-sm text-[#9f5145]">Impossible de charger les profils. {error}</p>}
        {loading?<div className="rounded-2xl border border-[#e0e6e8] bg-white p-10 text-center text-sm text-[#647384]">Recherche des professionnels…</div>:results.length===0?<div className="rounded-2xl border border-dashed border-[#cbd5da] bg-white px-5 py-14 text-center"><Search size={22} className="mx-auto text-[#35546d]"/><h3 className="mt-4 font-serif text-lg font-bold text-[#183451]">Aucun profil vérifié pour ces critères</h3><p className="mx-auto mt-1 max-w-md text-sm text-[#74818b]">Les comptes professionnels apparaîtront ici après l’envoi d’une fiche et sa validation par l’administration.</p><Link href="/inscription" className="mt-4 inline-flex rounded-lg bg-[#183451] px-4 py-2.5 text-xs font-bold text-white">Inscrire une activité</Link></div>:<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{results.map(pro=><article key={pro.profile_id} className="relative rounded-2xl border border-[#e4ebf3] bg-white p-5 shadow-[0_5px_16px_rgba(24,52,81,0.07)]"><div className="flex items-start gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eaf2fb] text-sm font-extrabold text-[#174572]">{mediaByProfessional[pro.profile_id]?.avatar_path?<img src={professionalMediaUrl(mediaByProfessional[pro.profile_id].avatar_path)} alt={`Photo de ${pro.display_name}`} className="h-full w-full object-cover"/>:pro.display_name.split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase()}</div><div className="min-w-0 flex-1"><h3 className="truncate text-base font-extrabold text-[#102448]">{pro.display_name}</h3><p className="mt-1 text-xs font-semibold text-[#a57934]">{pro.category_name}</p><p className="mt-1 flex items-center gap-1 text-xs text-[#60738d]"><MapPin size={13}/>{pro.neighborhood || 'Goma'}</p></div><button onClick={()=>void toggleFavorite(pro.profile_id)} aria-label={favoriteIds.includes(pro.profile_id)?'Retirer des favoris':'Ajouter aux favoris'} className={`rounded-full p-2 ${favoriteIds.includes(pro.profile_id)?'text-[#e44962]':'text-[#58708f] hover:text-[#e44962]'}`}><Heart size={18} fill={favoriteIds.includes(pro.profile_id)?'currentColor':'none'}/></button></div><p className="mt-4 line-clamp-3 text-sm leading-5 text-[#526575]">{pro.description}</p><div className="mt-3 flex flex-wrap gap-1.5">{(pro.skills??[]).slice(0,4).map(skill=><span key={skill} className="rounded-full bg-[#eaf2ff] px-2.5 py-1 text-[10px] font-semibold text-[#164b96]">{skill}</span>)}</div><div className="mt-4 flex items-center justify-between border-t border-[#edf1f6] pt-3"><div className="text-xs font-bold text-[#29445c]">{pro.indicative_rate == null ? 'Sur devis' : `${Number(pro.indicative_rate).toLocaleString('fr-FR')} ${pro.rate_currency}`}<div className="mt-1 font-normal text-[#71808b]">{pro.review_count ? `${Number(pro.average_rating).toFixed(1)} · ${pro.review_count} avis` : 'Pas encore d’avis'}</div></div><Link href={`/professionnels/${pro.profile_id}`} className="rounded-full border border-[#2678ff] px-3 py-2 text-xs font-bold text-[#0758d5] hover:bg-[#0758d5] hover:text-white">Voir le profil</Link></div><div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#e4f7eb] px-2.5 py-1 text-[10px] font-bold text-[#168447]"><span className="h-1.5 w-1.5 rounded-full bg-[#16a05b]"/>{pro.available?'Disponible':'Sur demande'}</div></article>)}</div>}
      </section>
    </div>
  </div>;
}

function ProfessionalPage({ params }: { params: { id: string } }) {
  if (supabase) return <LiveProfessionalPage params={params} />;
  return <div className="mx-auto max-w-3xl px-5 py-16"><PageTitle eyebrow="Profil indisponible" title="Connexion à la base requise" text="Cette page affiche uniquement les fiches enregistrées dans Supabase. Vérifiez la configuration du site puis réessayez."/><Link href="/" className="inline-flex rounded-lg bg-[#183451] px-4 py-3 text-sm font-bold text-white">Retour à l’accueil</Link></div>;
}

function LiveProfessionalPage({ params }: { params: { id: string } }) {
  const [, setLocation] = useLocation();
  const [professional, setProfessional] = useState<LiveSearchRecord | null>(null);
  const [media, setMedia] = useState<ProfessionalMedia>({avatar_path:null,portfolio_paths:[]});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [userRole, setUserRole] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [neighborhood, setNeighborhood] = useState(neighborhoods[0]);
  const [favorite, setFavorite] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportMessage, setReportMessage] = useState('');

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void (async () => {
      const [{ data: rows, error: searchError }, { data: auth }] = await Promise.all([
        supabase.rpc('search_professionals', { p_query: null, p_latitude: null, p_longitude: null, p_radius_meters: 20000, p_available_only: false, p_neighborhood: null }),
        supabase.auth.getUser(),
      ]);
      if (!active) return;
      if (searchError) setMessage(searchError.message);
      else {
        const found = ((rows ?? []) as LiveSearchRecord[]).find(row => row.profile_id === params.id) ?? null;
        setProfessional(found);
        if (found) {
          const { data: mediaRow, error: mediaError } = await supabase.from('professionals').select('avatar_path, portfolio_paths').eq('profile_id',params.id).maybeSingle();
          if (!active) return;
          if (mediaError) setMessage(mediaError.message);
          else if (mediaRow) setMedia({avatar_path:mediaRow.avatar_path,portfolio_paths:mediaRow.portfolio_paths??[]});
        }
      }
      if (auth.user) {
        setUserId(auth.user.id);
        const [{ data: profile }, { data: saved }] = await Promise.all([
          supabase.from('profiles').select('role, neighborhood').eq('id', auth.user.id).maybeSingle(),
          supabase.from('favorites').select('professional_id').eq('client_id', auth.user.id).eq('professional_id', params.id).maybeSingle(),
        ]);
        if (!active) return;
        setUserRole(profile?.role ?? '');
        setNeighborhood(profile?.neighborhood ?? neighborhoods[0]);
        setFavorite(Boolean(saved));
      }
      setLoading(false);
    })().catch(cause => { if (active) { setMessage(cause instanceof Error ? cause.message : 'Impossible de charger ce profil.'); setLoading(false); } });
    return () => { active = false; };
  }, [params.id]);

  const signInFor = (next: string) => setLocation(`/connexion?next=${encodeURIComponent(next)}`);
  const toggleFavorite = async () => {
    if (!supabase || !professional) return;
    if (!userId) { signInFor(`/professionnels/${professional.profile_id}`); return; }
    if (userRole !== 'client') { setMessage('Les favoris sont disponibles depuis un compte client.'); return; }
    const response = favorite
      ? await supabase.from('favorites').delete().eq('client_id', userId).eq('professional_id', professional.profile_id)
      : await supabase.from('favorites').insert({ client_id: userId, professional_id: professional.profile_id });
    if (response.error) setMessage(response.error.message);
    else setFavorite(!favorite);
  };
  const sendRequest = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !professional) return;
    if (!userId) { signInFor(`/professionnels/${professional.profile_id}`); return; }
    if (userRole !== 'client') { setMessage('Pour envoyer une demande, connectez-vous avec un compte client.'); return; }
    if (requestDescription.trim().length < 10) { setMessage('Décrivez votre besoin en au moins 10 caractères.'); return; }
    setSending(true); setMessage('');
    const { error: requestError } = await supabase.from('service_requests').insert({
      client_id: userId, professional_id: professional.profile_id,
      description: requestDescription.trim(), neighborhood,
    });
    if (requestError) setMessage(requestError.message);
    else { setRequestDescription(''); setMessage('Demande envoyée. Vous pourrez suivre son état dans votre espace client.'); }
    setSending(false);
  };
  const sendReport = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !professional) return;
    if (!userId) { signInFor(`/professionnels/${professional.profile_id}`); return; }
    if (reportReason.trim().length < 3) { setReportMessage('Décrivez le motif en au moins 3 caractères.'); return; }
    const { error: reportError } = await supabase.from('reports').insert({ reporter_id: userId, professional_id: professional.profile_id, reason: reportReason.trim().slice(0, 120) });
    setReportMessage(reportError ? reportError.message : 'Signalement transmis à l’administration.');
    if (!reportError) setReportReason('');
  };

  if (loading) return <div className="mx-auto max-w-3xl px-5 py-16 text-sm text-[#647384]">Chargement du profil…</div>;
  if (!professional) return <div className="mx-auto max-w-3xl px-5 py-16"><PageTitle title="Profil indisponible" text="Ce profil n’est pas public ou n’a pas encore été validé."/>{message&&<p role="alert" className="mb-4 text-sm text-[#9f5145]">{message}</p>}<Link href="/" className="font-bold text-[#294d6a]">Retour à la recherche</Link></div>;
  return <div className="page-enter mx-auto max-w-[1080px] px-4 py-8 sm:px-7 sm:py-12"><Link href="/" className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-[#617383]"><ArrowLeft size={15}/>Retour aux professionnels</Link><div className="grid gap-6 lg:grid-cols-[1fr_340px]"><section className="rounded-2xl border border-[#e0e6e8] bg-white p-5 sm:p-7"><div className="flex flex-wrap items-start gap-4"><div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eaf2fb] text-lg font-extrabold text-[#174572]">{media.avatar_path?<img src={professionalMediaUrl(media.avatar_path)} alt={`Photo de ${professional.display_name}`} className="h-full w-full object-cover"/>:professional.display_name.split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h1 className="font-serif text-2xl font-extrabold text-[#183451] sm:text-3xl">{professional.display_name}</h1><span className="rounded-full bg-[#eaf6ed] px-2.5 py-1 text-[10px] font-bold text-[#327044]">Professionnel vérifié</span></div><p className="mt-1 font-semibold text-[#a57934]">{professional.category_name}</p><p className="mt-2 flex items-center gap-1 text-xs text-[#71808c]"><MapPin size={13}/>{professional.neighborhood || 'Goma'} · intervient à {professional.service_area.join(', ') || professional.neighborhood}</p></div><button onClick={()=>void toggleFavorite()} className="flex items-center gap-2 rounded-lg border border-[#e0e6e8] px-3 py-2 text-xs font-bold text-[#536a7c]"><Heart size={15} fill={favorite?'currentColor':'none'}/>{favorite?'Enregistré':'Enregistrer'}</button></div>
    <div className="mt-6 grid grid-cols-2 gap-3"><Metric label="Expérience" value={`${professional.experience_years} ans`}/><Metric label="Disponibilité" value={professional.available?'Disponible':'Sur demande'}/><Metric label="Tarif indicatif" value={professional.indicative_rate==null?'Sur devis':`${Number(professional.indicative_rate).toLocaleString('fr-FR')} ${professional.rate_currency}`}/><Metric label="Avis clients" value={professional.review_count?`${Number(professional.average_rating).toFixed(1)} · ${professional.review_count}`:'Pas encore d’avis'}/></div>
    <h2 className="mt-7 font-serif text-lg font-bold text-[#183451]">Présentation</h2><p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#596b79]">{professional.description}</p><h2 className="mt-6 font-serif text-lg font-bold text-[#183451]">Compétences</h2><div className="mt-3 flex flex-wrap gap-2">{professional.skills.map(skill=><span key={skill} className="rounded-full bg-[#edf2f4] px-3 py-1.5 text-xs font-semibold text-[#425c70]">{skill}</span>)}</div>{media.portfolio_paths.length>0&&<><h2 className="mt-7 font-serif text-lg font-bold text-[#183451]">Réalisations</h2><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{media.portfolio_paths.map(path=><img key={path} src={professionalMediaUrl(path)} alt={`Réalisation de ${professional.display_name}`} className="aspect-square w-full rounded-xl border border-[#e3e8e9] object-cover"/>)}</div></>}
    {professional.public_contact_phone&&<a href={`tel:${professional.public_contact_phone}`} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#edf4ef] px-4 py-3 text-sm font-bold text-[#327044]"><Phone size={16}/>Appeler {professional.public_contact_phone}</a>}
    <form onSubmit={sendReport} className="mt-8 border-t border-[#edf0f1] pt-5"><label className="block text-xs font-bold text-[#667887]">Signaler ce profil<textarea value={reportReason} onChange={event=>setReportReason(event.target.value)} maxLength={120} rows={2} placeholder="Décrivez le problème" className="mt-2 w-full rounded-lg border border-[#dfe5e8] px-3 py-2 text-sm font-normal"/></label><button className="mt-2 text-xs font-bold text-[#9f5145]">Envoyer un signalement</button>{reportMessage&&<p role="status" className="mt-2 text-xs text-[#526575]">{reportMessage}</p>}</form>
    </section><aside className="h-fit rounded-2xl border border-[#e0e6e8] bg-white p-5 lg:sticky lg:top-24"><div className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#a57934]">Prendre contact</div><h2 className="mt-1 font-serif text-xl font-extrabold text-[#183451]">Décrire votre besoin</h2>{userRole!=='client'&&<p className="mt-2 text-xs leading-5 text-[#71808b]">La consultation est publique. Pour envoyer une demande, connectez-vous avec un compte client.</p>}<form onSubmit={sendRequest} className="mt-4 space-y-3"><label className="block text-xs font-bold text-[#506273]">Votre quartier<select value={neighborhood} onChange={event=>setNeighborhood(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] bg-white px-3 py-2.5 text-sm font-normal">{neighborhoods.map(place=><option key={place}>{place}</option>)}</select></label><label className="block text-xs font-bold text-[#506273]">Votre besoin<textarea value={requestDescription} onChange={event=>setRequestDescription(event.target.value)} minLength={10} maxLength={3000} rows={5} required placeholder="Décrivez le travail souhaité…" className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] px-3 py-2.5 text-sm font-normal"/></label>{message&&<p role="status" className="text-xs text-[#526575]">{message}</p>}<button disabled={sending} className="w-full rounded-lg bg-[#183451] py-3 text-sm font-bold text-white disabled:opacity-60">{sending?'Envoi…':'Envoyer la demande'}</button>{!userId&&<button type="button" onClick={()=>signInFor(`/professionnels/${professional.profile_id}`)} className="w-full rounded-lg border border-[#dfe5e8] py-2.5 text-xs font-bold text-[#405268]">Se connecter ou créer un compte client</button>}</form></aside></div></div>;
}

function Metric({label,value}:{label:string;value:string}) { return <div className="rounded-xl bg-[#f4f6f6] p-3"><div className="text-[9px] font-bold uppercase tracking-wider text-[#7b8992]">{label}</div><div className="mt-1 text-sm font-extrabold text-[#28445d]">{value}</div></div>; }

function AdminAccessUnavailable() {
  const [status, setStatus] = useState<'checking' | 'signed-out' | 'authorized' | 'unconfigured'>('checking');
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
    return <><div className="mx-auto flex max-w-[1240px] justify-end px-4 pt-6 sm:px-7"><button onClick={signOut} className="rounded-lg border border-[#dfe5e8] bg-white px-3 py-2 text-xs font-bold text-[#405268]">Se déconnecter</button></div><LiveAdminPage /></>;
  }

  const configured = status !== 'unconfigured';
  return <div className="page-enter mx-auto max-w-3xl px-5 py-16 sm:px-7">
    <PageTitle eyebrow="Accès protégé" title="Espace administrateur" text="Connectez-vous avec le compte auquel le rôle administrateur a été attribué." />
    {!configured && <div className="mb-6"><InfoNote>Accès fermé. Configurez les variables Supabase et appliquez la migration avant d’activer la connexion administrateur.</InfoNote></div>}
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

function isMissingAuthSession(error: unknown) {
  return typeof error === 'object' && error !== null && 'message' in error
    && typeof error.message === 'string' && /auth session missing/i.test(error.message);
}

function accountHome(role: string) {
  return role === 'professional' ? '/espace/pro' : role === 'admin' ? '/admin' : '/espace/client';
}

async function ensureAccountProfile(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
  if (!supabase) throw new Error('La connexion à Supabase n’est pas configurée.');
  const { data: existing, error: readError } = await supabase.from('profiles').select('display_name, role, neighborhood').eq('id', user.id).maybeSingle();
  if (readError) throw readError;
  if (existing) return existing;

  const role = user.user_metadata?.role === 'professional' ? 'professional' : 'client';
  const metadataName = typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name.trim() : '';
  const displayName = metadataName || user.email?.split('@')[0] || 'Nouveau membre';
  const { data: created, error: insertError } = await supabase.from('profiles')
    .insert({ id: user.id, display_name: displayName.slice(0, 100), role })
    .select('display_name, role, neighborhood')
    .single();
  if (!insertError && created) return created;

  // A signup trigger can create the row at the same time; re-read before reporting failure.
  const { data: raced, error: retryError } = await supabase.from('profiles').select('display_name, role, neighborhood').eq('id', user.id).maybeSingle();
  if (!retryError && raced) return raced;
  throw insertError ?? retryError ?? new Error('Impossible de créer le profil du compte.');
}

function requestedDestination() {
  const next = new URLSearchParams(window.location.search).get('next');
  return next?.startsWith('/') && !next.startsWith('//') ? next : null;
}

function AuthCallbackPage() {
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState('Confirmation de votre adresse…');
  const [recovery, setRecovery] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!supabase) { setMessage('La connexion Supabase n’est pas configurée.'); return; }
    let active = true;
    const isRecovery = new URLSearchParams(window.location.search).get('mode') === 'recovery';
    setRecovery(isRecovery);
    void (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        if (active) setMessage(isRecovery ? 'Ce lien de récupération est invalide ou expiré. Demandez-en un nouveau depuis la page de connexion.' : 'La confirmation n’a pas ouvert de session. Réessayez depuis le lien reçu par courriel ou connectez-vous.');
        return;
      }
      if (isRecovery) { if (active) { setRecoveryReady(true); setMessage('Choisissez un nouveau mot de passe pour votre compte.'); } return; }
      let profile: { role: string };
      try { profile = await ensureAccountProfile(data.user); }
      catch (profileError) { if (active) setMessage(profileError instanceof Error ? profileError.message : 'Impossible de charger votre profil.'); return; }
      if (active) setLocation(requestedDestination() ?? accountHome(profile.role));
    })();
    return () => { active = false; };
  }, [setLocation]);
  const updatePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setMessage(authErrorMessage(error, 'signin')); setBusy(false); return; }
    if (data.user) {
      try {
        const profile = await ensureAccountProfile(data.user);
        setLocation(accountHome(profile.role));
        return;
      } catch (profileError) { setMessage(profileError instanceof Error ? profileError.message : 'Mot de passe modifié. Reconnectez-vous pour ouvrir votre espace.'); }
    }
    setBusy(false);
  };
  if (recovery && recoveryReady) return <div className="mx-auto max-w-[520px] px-5 py-12"><PageTitle eyebrow="Récupération du compte" title="Choisir un nouveau mot de passe" text={message}/><form onSubmit={updatePassword} className="space-y-4 rounded-2xl border border-[#e0e6e8] bg-white p-6 shadow-sm"><label className="block text-xs font-bold text-[#506273]">Nouveau mot de passe<input type="password" autoComplete="new-password" minLength={6} required value={newPassword} onChange={event=>setNewPassword(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] px-3 py-3 text-sm font-normal"/></label><button disabled={busy} className="w-full rounded-lg bg-[#183451] py-3 text-sm font-bold text-white disabled:opacity-60">{busy?'Enregistrement…':'Enregistrer le mot de passe'}</button></form><Link href="/connexion" className="mt-4 inline-flex text-sm font-bold text-[#0d5ebd]">Retour à la connexion</Link></div>;
  if (recovery) return <div className="mx-auto max-w-3xl px-5 py-16"><PageTitle eyebrow="Récupération du compte" title="Lien à renouveler" text={message}/><Link href="/connexion" className="inline-flex rounded-lg bg-[#183451] px-4 py-3 text-sm font-bold text-white">Demander un nouveau lien</Link></div>;
  return <div className="mx-auto max-w-3xl px-5 py-16"><PageTitle eyebrow="Compte sécurisé" title="Ouverture de votre espace" text={message}/><Link href="/connexion" className="text-sm font-bold text-[#0d5ebd]">Aller à la connexion</Link></div>;
}

function AuthPage() {
  const [location, setLocation] = useLocation();
  const signup=location.split('?')[0]==='/inscription';
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [name,setName]=useState('');
  const [role,setRole]=useState<'client'|'professional'>('client'); const [message,setMessage]=useState('');
  const [canResendConfirmation,setCanResendConfirmation]=useState(false);
  const [busy,setBusy]=useState(false);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getUser().then(async ({ data, error }) => {
      if (!active || error || !data.user) return;
      try {
        const profile = await ensureAccountProfile(data.user);
        if (active) setLocation(requestedDestination() ?? accountHome(profile.role));
      } catch { /* The form reports setup and permission errors when the user submits. */ }
    });
    return () => { active = false; };
  }, [setLocation]);
  const submit=async(e:FormEvent)=>{
    e.preventDefault(); setMessage(''); setCanResendConfirmation(false);
    if(!supabase){setMessage('Supabase n’est pas configuré. Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY dans .env.local.');return;}
    setBusy(true);
    try {
      if(signup){
        const next = requestedDestination();
        const emailRedirectTo = `${window.location.origin}/auth/callback${next?`?next=${encodeURIComponent(next)}`:''}`;
        const {data,error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo,data:{display_name:name.trim(),role}}});
        if(error) throw error;
        if (!data.session && data.user?.identities?.length === 0) {
          setCanResendConfirmation(true);
          setMessage('Un compte existe déjà avec cette adresse e-mail. Connectez-vous avec votre mot de passe, ou demandez la récupération du mot de passe depuis la page de connexion.');
          return;
        }
        if (data.session) {
          const profile = await ensureAccountProfile(data.user!);
          setLocation(next ?? accountHome(profile.role));
        } else {
          setCanResendConfirmation(true);
          setMessage('Compte créé. Confirmez votre adresse dans le courriel reçu ; vous serez ensuite dirigé automatiquement vers votre espace.');
        }
      } else {
        const {data,error}=await supabase.auth.signInWithPassword({email,password});
        if(error) throw error;
        const profile=await ensureAccountProfile(data.user);
        setLocation(requestedDestination() ?? accountHome(profile.role));
      }
    } catch(error) { setMessage(authErrorMessage(error, signup ? 'signup' : 'signin')); }
    finally {setBusy(false);}
  };
  const sendRecovery = async () => {
    if (!supabase) return;
    if (!email.trim()) { setMessage('Saisissez votre adresse e-mail pour recevoir le lien de récupération.'); return; }
    setBusy(true); setMessage('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/callback?mode=recovery` });
    setMessage(error ? authErrorMessage(error, 'signin') : 'Si un compte existe pour cette adresse, un lien de récupération vient de lui être envoyé. Vérifiez aussi vos courriers indésirables.');
    setBusy(false);
  };
  const resendConfirmation = async () => {
    if (!supabase || !email.trim()) return;
    setBusy(true); setMessage('');
    const next = requestedDestination();
    const emailRedirectTo = `${window.location.origin}/auth/callback${next?`?next=${encodeURIComponent(next)}`:''}`;
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo } });
    setMessage(error ? authErrorMessage(error, 'signup') : 'Si cette adresse attend une confirmation, un nouveau lien vient de lui être envoyé. Vérifiez aussi vos courriers indésirables.');
    setBusy(false);
  };
  return <div className="mx-auto flex min-h-[calc(100dvh-48px)] max-w-[520px] items-center justify-center px-5 py-10 sm:px-7 xl:min-h-[calc(100dvh-60px)]">
    <form onSubmit={submit} className="w-full rounded-2xl border border-[#e0e6e8] bg-white p-6 shadow-[0_16px_40px_rgba(24,52,81,0.08)] sm:p-8"><div className="mb-5"><div className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#a57934]">{signup?'Créer un compte':'Connexion'}</div><h1 className="mt-1 font-serif text-2xl font-extrabold text-[#183451]">{signup?'Rejoindre KaziGoma':'Accéder à mon compte'}</h1></div>
      {signup&&<><label className="mb-4 block text-xs font-bold text-[#506273]">Nom complet<input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} maxLength={100} className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] px-3 py-3 text-sm font-normal" required/></label><label className="mb-4 block text-xs font-bold text-[#506273]">Je suis<select value={role} onChange={e=>setRole(e.target.value as 'client'|'professional')} className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] bg-white px-3 py-3 text-sm font-normal"><option value="client">Un client</option><option value="professional">Un professionnel</option></select></label></>}
      <label className="mb-4 block text-xs font-bold text-[#506273]">Adresse e-mail<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="vous@exemple.cd" className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] px-3 py-3 text-sm font-normal" required/></label>
      <label className="mb-4 block text-xs font-bold text-[#506273]">Mot de passe<input type="password" autoComplete={signup?'new-password':'current-password'} minLength={6} value={password} onChange={e=>setPassword(e.target.value)} placeholder="6 caractères minimum" className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] px-3 py-3 text-sm font-normal" required/></label>
      {message&&<p role="status" className="mb-3 rounded-lg bg-[#f3f6f7] p-3 text-xs leading-5 text-[#526575]">{message}</p>}
      {canResendConfirmation&&<button type="button" disabled={busy} onClick={()=>void resendConfirmation()} className="mb-2 w-full rounded-lg border border-[#dfe5e8] bg-white py-2.5 text-xs font-bold text-[#405268] disabled:opacity-60">Renvoyer le courriel de confirmation</button>}
      <button disabled={busy} className="mt-2 w-full rounded-lg bg-[#183451] py-3 text-sm font-bold text-white disabled:opacity-60" data-testid="button-auth">{busy?'Patientez…':signup?'Créer mon compte':'Se connecter'}</button>
      {!signup&&<button type="button" disabled={busy} onClick={()=>void sendRecovery()} className="mt-3 w-full text-xs font-bold text-[#0d5ebd] disabled:opacity-60">Mot de passe oublié ? Recevoir un lien de récupération</button>}
      <div className="mt-5 border-t border-[#edf0f1] pt-4 text-center text-xs text-[#74828c]">{signup?'Déjà un compte ?':'Vous n’avez pas encore de compte ?'} <Link href={`${signup?'/connexion':'/inscription'}${requestedDestination()?`?next=${encodeURIComponent(requestedDestination()!)}`:''}`} className="font-bold text-[#284b68]">{signup?'Se connecter':'Créer mon compte'}</Link></div>
    </form>
  </div>;
}

function ClientSpace() {
  if (supabase) return <LiveClientSpace />;
  return <div className="mx-auto max-w-3xl px-5 py-16"><PageTitle eyebrow="Configuration requise" title="Espace client indisponible" text="La connexion à Supabase n’est pas configurée pour ce site."/><InfoNote>Connectez les variables Supabase dans Vercel et redéployez pour ouvrir votre compte réel.</InfoNote></div>;
}

function LiveClientSpace() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [tab, setTab] = useState<'requests' | 'favorites'>('requests');
  const [requests, setRequests] = useState<{ id: string; professional_id: string; description: string; neighborhood: string | null; status: string; created_at: string }[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [professionals, setProfessionals] = useState<LiveSearchRecord[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void (async () => {
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError && !isMissingAuthSession(authError)) throw authError;
        if (!auth.user) return;
        const [profile, { data: requestRows, error: requestError }, { data: favoriteRows, error: favoriteError }, { data: professionalRows, error: professionalError }] = await Promise.all([
          ensureAccountProfile(auth.user),
          supabase.from('service_requests').select('id, professional_id, description, neighborhood, status, created_at').eq('client_id', auth.user.id).order('created_at', { ascending: false }),
          supabase.from('favorites').select('professional_id').eq('client_id', auth.user.id),
          supabase.rpc('search_professionals', { p_query: null, p_latitude: null, p_longitude: null, p_radius_meters: 20000, p_available_only: false, p_neighborhood: null }),
        ]);
        if (requestError) throw requestError;
        if (favoriteError) throw favoriteError;
        if (professionalError) throw professionalError;
        if (!active) return;
        setEmail(auth.user.email ?? '');
        setName(profile.display_name);
        setRole(profile.role);
        setRequests(requestRows ?? []);
        setFavoriteIds((favoriteRows ?? []).map(row=>row.professional_id));
        setProfessionals((professionalRows ?? []) as LiveSearchRecord[]);
      } catch (cause) {
        if (active) setError(authErrorMessage(cause, 'signin'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);
  if (loading) return <div className="mx-auto max-w-3xl px-5 py-16 text-sm text-[#647384]">Vérification de votre compte…</div>;
  if (!email) return <div className="mx-auto max-w-3xl px-5 py-16"><PageTitle eyebrow="Espace client" title="Connectez-vous pour continuer" text="La consultation des professionnels reste publique. Connectez-vous ou créez un compte client pour suivre vos demandes et favoris."/><div className="flex flex-wrap gap-3"><Link href="/connexion?next=%2Fespace%2Fclient" className="inline-flex rounded-lg bg-[#183451] px-4 py-3 text-sm font-bold text-white">Se connecter</Link><Link href="/inscription?next=%2Fespace%2Fclient" className="inline-flex rounded-lg border border-[#dfe5e8] bg-white px-4 py-3 text-sm font-bold text-[#405268]">Créer un compte client</Link></div>{error&&<p role="alert" className="mt-3 text-sm text-[#a34436]">{error}</p>}</div>;
  if (role !== 'client') return <div className="mx-auto max-w-3xl px-5 py-16"><PageTitle eyebrow="Compte Supabase · vérifié" title={`Bonjour, ${name}`} text={`Ce compte est enregistré comme ${role === 'professional' ? 'professionnel' : 'administrateur'}, pas comme client.`}/><Link href={accountHome(role)} className="inline-flex rounded-lg bg-[#183451] px-4 py-3 text-sm font-bold text-white">Ouvrir mon espace</Link></div>;
  const roleLabel = 'Client';
  const professionalById = new Map(professionals.map(pro=>[pro.profile_id,pro]));
  const clientRequests = requests.filter(request=>request.status!=='cancelled');
  const savedProfessionals = favoriteIds.map(id=>professionalById.get(id)).filter((pro):pro is LiveSearchRecord=>Boolean(pro));
  const cancelRequest = async (id: string) => {
    if (!supabase) return;
    const { error: cancelError } = await supabase.from('service_requests').update({status:'cancelled'}).eq('id',id);
    if (cancelError) setError(cancelError.message);
    else setRequests(current=>current.map(request=>request.id===id?{...request,status:'cancelled'}:request));
  };
  const removeFavorite = async (id: string) => {
    if (!supabase) return;
    const { error: removeError } = await supabase.from('favorites').delete().eq('professional_id',id);
    if (removeError) setError(removeError.message);
    else setFavoriteIds(current=>current.filter(value=>value!==id));
  };
  return <div className="page-enter mx-auto max-w-[1060px] px-4 py-10 sm:px-7"><PageTitle eyebrow="Espace client · compte réel" title={`Bonjour, ${name}`} text="Retrouvez vos demandes envoyées et les professionnels enregistrés."/>
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-[#cfe4d4] bg-[#f5fbf6] px-4 py-3 text-xs"><span className="rounded-full bg-[#e4f3e7] px-2.5 py-1 font-extrabold text-[#327044]">Compte {roleLabel} réel</span><span className="font-semibold text-[#29445c]">{email}</span></div>
    <div role="tablist" aria-label="Espace client" className="mb-5 flex gap-2 border-b border-[#dfe5e8]"><button role="tab" aria-selected={tab==='requests'} onClick={()=>setTab('requests')} className={`border-b-2 px-3 py-3 text-sm font-bold ${tab==='requests'?'border-[#183451] text-[#183451]':'border-transparent text-[#76838d]'}`}>Mes demandes ({clientRequests.length})</button><button role="tab" aria-selected={tab==='favorites'} onClick={()=>setTab('favorites')} className={`border-b-2 px-3 py-3 text-sm font-bold ${tab==='favorites'?'border-[#183451] text-[#183451]':'border-transparent text-[#76838d]'}`}>Mes favoris ({favoriteIds.length})</button></div>
    {error&&<p role="alert" className="mb-4 rounded-lg bg-[#fff8f6] p-3 text-sm text-[#9f5145]">{error}</p>}
    {tab==='requests'?clientRequests.length?<div className="space-y-3">{clientRequests.map(request=>{const pro=professionalById.get(request.professional_id);return <article key={request.id} className="rounded-xl border border-[#e0e6e8] bg-white p-4 sm:flex sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><h3 className="font-bold text-[#24425c]">{pro?.display_name??'Professionnel'}</h3><StatusPill status={request.status==='pending'?'En attente':request.status==='accepted'?'Acceptée':request.status==='in_progress'?'En cours':request.status==='completed'?'Terminée':request.status==='declined'?'Refusée':'Annulée'}/></div><p className="mt-1 text-xs text-[#778590]">{pro?.category_name??''} · {request.neighborhood??'Quartier non précisé'} · {new Date(request.created_at).toLocaleDateString('fr-FR')}</p><p className="mt-2 text-sm text-[#5f707d]">{request.description}</p></div>{['pending','accepted'].includes(request.status)&&<button onClick={()=>void cancelRequest(request.id)} className="mt-3 text-xs font-bold text-[#9b5144] sm:mt-0">Annuler la demande</button>}</article>})}</div>:<EmptyState title="Aucune demande envoyée" text="Parcourez les professionnels vérifiés et envoyez une demande depuis leur fiche." href="/" action="Trouver un professionnel"/>:
    savedProfessionals.length?<div className="grid gap-3 sm:grid-cols-2">{savedProfessionals.map(pro=><article key={pro.profile_id} className="flex items-center gap-3 rounded-xl border border-[#e0e6e8] bg-white p-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eaf2fb] text-sm font-extrabold text-[#174572]">{pro.display_name.split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase()}</div><div className="min-w-0 flex-1"><h3 className="truncate font-bold text-[#24425c]">{pro.display_name}</h3><p className="text-xs text-[#778590]">{pro.category_name} · {pro.neighborhood}</p></div><Link href={`/professionnels/${pro.profile_id}`} className="text-xs font-bold text-[#365873]">Profil</Link><button onClick={()=>void removeFavorite(pro.profile_id)} aria-label="Retirer des favoris" className="p-2 text-[#a45f4d]"><X size={16}/></button></article>)}</div>:<EmptyState title="Aucun professionnel enregistré" text="Enregistrez les profils qui vous intéressent pour les retrouver ici." href="/" action="Explorer les professionnels"/>}
  </div>;
}

function EmptyState({title,text,href,action}:{title:string;text:string;href:string;action:string}) { return <div className="rounded-xl border border-dashed border-[#d4dde0] px-5 py-10 text-center"><p className="text-sm font-bold text-[#476075]">{title}</p><p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#87939b]">{text}</p><Link href={href} className="mt-4 inline-flex rounded-lg bg-[#183451] px-4 py-2.5 text-xs font-bold text-white">{action}</Link></div>; }

function StatusPill({status}:{status:string}) { const style=status==='Terminée'?'bg-[#edf4ef] text-[#42674d]':status==='Refusée'?'bg-[#f9eeec] text-[#9f5145]':status==='En cours'?'bg-[#eef2f6] text-[#4a6279]':'bg-[#fff4df] text-[#8c672a]';return <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${style}`}>{status}</span>; }
function professionalRequestTransitions(status: string) { return status==='pending'?[['accepted','Accepter'],['declined','Refuser']]:status==='accepted'?[['in_progress','Démarrer']]:status==='in_progress'?[['completed','Terminer']]:[] as string[][]; }

function ProSpace() {
  if (supabase) return <LiveProSpace />;
  return <div className="mx-auto max-w-3xl px-5 py-16"><PageTitle eyebrow="Configuration requise" title="Espace professionnel indisponible" text="La connexion à la base de données n’est pas configurée pour ce site. Ajoutez les variables Supabase dans Vercel et redéployez."/><InfoNote>La fiche professionnelle ne peut pas être enregistrée tant que Supabase n’est pas configuré.</InfoNote></div>;
}

type ProfessionalFormState = {
  displayName: string;
  neighborhood: string;
  categoryId: string;
  description: string;
  experienceYears: string;
  indicativeRate: string;
  available: boolean;
  serviceArea: string;
  phone: string;
};

const emptyProfessionalForm: ProfessionalFormState = {
  displayName: '', neighborhood: neighborhoods[0], categoryId: '', description: '',
  experienceYears: '0', indicativeRate: '', available: false, serviceArea: '', phone: '',
};

function LiveProSpace() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [role, setRole] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [skillOptions, setSkillOptions] = useState<{ id: string; name: string }[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [portfolioPaths, setPortfolioPaths] = useState<string[]>([]);
  const [pendingMediaRemoval, setPendingMediaRemoval] = useState<string[]>([]);
  const [mediaMessage, setMediaMessage] = useState('');
  const [requests, setRequests] = useState<{ id: string; client_id: string; description: string; neighborhood: string | null; status: string; created_at: string; client: { display_name: string }[] }[]>([]);
  const [form, setForm] = useState<ProfessionalFormState>(emptyProfessionalForm);
  const [status, setStatus] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void (async () => {
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError && !isMissingAuthSession(authError)) throw authError;
        if (!auth.user) { if (active) setLoading(false); return; }
        const [profile, { data: categoryRows, error: categoryError }, { data: requestRows, error: requestError }] = await Promise.all([
          ensureAccountProfile(auth.user),
          supabase.from('categories').select('id, name').order('name'),
          supabase.from('service_requests').select('id, client_id, description, neighborhood, status, created_at, client:profiles!service_requests_client_id_fkey(display_name)').eq('professional_id', auth.user.id).order('created_at', { ascending: false }),
        ]);
        if (categoryError) throw categoryError;
        if (requestError) throw requestError;
        const { data: professional, error: professionalError } = await supabase
          .from('professionals')
          .select('category_id, description, experience_years, indicative_rate, available, service_area, public_contact_phone, status, avatar_path, portfolio_paths')
          .eq('profile_id', auth.user.id)
          .maybeSingle();
        if (professionalError) throw professionalError;
        const { data: skillRows, error: skillError } = await supabase.from('professional_skills').select('skill_id').eq('professional_id', auth.user.id);
        if (skillError) throw skillError;
        if (!active) return;
        setUserId(auth.user.id);
        setUserEmail(auth.user.email ?? '');
        setRole(profile.role);
        setCategories(categoryRows ?? []);
        setRequests((requestRows ?? []) as unknown as typeof requests);
        setSelectedSkillIds((skillRows ?? []).map(row=>row.skill_id));
        if (professional) {
          setStatus(professional.status);
          setAvatarPath(professional.avatar_path);
          setPortfolioPaths(professional.portfolio_paths ?? []);
          setForm({
            displayName: profile.display_name ?? '', neighborhood: profile.neighborhood ?? neighborhoods[0],
            categoryId: professional.category_id, description: professional.description ?? '',
            experienceYears: String(professional.experience_years ?? 0),
            indicativeRate: professional.indicative_rate == null ? '' : String(professional.indicative_rate),
            available: Boolean(professional.available), serviceArea: (professional.service_area ?? []).join(', '),
            phone: professional.public_contact_phone ?? '',
          });
        } else {
          setForm(current => ({ ...current, displayName: profile.display_name ?? '', neighborhood: profile.neighborhood ?? neighborhoods[0] }));
        }
      } catch (error) {
        if (active) setMessage(authErrorMessage(error, 'signin'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!supabase || !form.categoryId) { setSkillOptions([]); return; }
    let active = true;
    void supabase.from('skills').select('id, name').eq('category_id', form.categoryId).order('name').then(({data,error})=>{
      if (!active) return;
      if (error) { setMessage(error.message); return; }
      const options = data ?? [];
      setSkillOptions(options);
      const optionIds = new Set(options.map(skill=>skill.id));
      setSelectedSkillIds(current=>current.filter(id=>optionIds.has(id)));
    });
    return ()=>{ active=false; };
  }, [form.categoryId]);

  const updateForm = <K extends keyof ProfessionalFormState>(key: K, value: ProfessionalFormState[K]) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const saveProfessional = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !userId) return;
    setMessage('');
    if (!form.categoryId) { setMessage('Choisissez un métier dans la liste.'); return; }
    if (form.description.trim().length < 20) { setMessage('Ajoutez une présentation d’au moins 20 caractères.'); return; }
    const years = Number(form.experienceYears);
    const rate = form.indicativeRate.trim() === '' ? null : Number(form.indicativeRate);
    if (!Number.isInteger(years) || years < 0 || years > 80) { setMessage('Indiquez une expérience comprise entre 0 et 80 ans.'); return; }
    if (rate !== null && (!Number.isFinite(rate) || rate < 0)) { setMessage('Le tarif doit être un montant positif.'); return; }
    const serviceArea = [...new Set(form.serviceArea.split(',').map(area => area.trim()).filter(Boolean))];
    setSaving(true);
    try {
      const { error: profileError } = await supabase.from('profiles').update({
        display_name: form.displayName.trim(), neighborhood: form.neighborhood,
      }).eq('id', userId);
      if (profileError) throw profileError;
      const professionalValues = {
        profile_id: userId, category_id: form.categoryId, description: form.description.trim(),
        experience_years: years, indicative_rate: rate, rate_currency: 'CDF', available: form.available,
        service_area: serviceArea, public_contact_phone: form.phone.trim() || null,
        avatar_path: avatarPath, portfolio_paths: portfolioPaths,
      };
      const write = status
        ? await supabase.from('professionals').update(professionalValues).eq('profile_id', userId)
        : await supabase.from('professionals').insert(professionalValues);
      if (write.error) throw write.error;
      const { error: clearSkillsError } = await supabase.from('professional_skills').delete().eq('professional_id', userId);
      if (clearSkillsError) throw clearSkillsError;
      if (selectedSkillIds.length) {
        const { error: skillsError } = await supabase.from('professional_skills').insert(selectedSkillIds.map(skill_id=>({professional_id:userId,skill_id})));
        if (skillsError) throw skillsError;
      }
      if (pendingMediaRemoval.length) {
        const { error: removalError } = await supabase.storage.from('professional-media').remove(pendingMediaRemoval);
        if (removalError) setMediaMessage(`La fiche est enregistrée, mais certaines anciennes photos n’ont pas été supprimées : ${removalError.message}`);
        else setPendingMediaRemoval([]);
      }
      const nextStatus = status === 'rejected' ? 'pending' : status ?? 'pending';
      setStatus(nextStatus);
      setMessage(status === 'verified'
        ? 'Votre fiche et vos photos ont été mises à jour dans votre profil public.'
        : status === 'suspended'
          ? 'Vos modifications sont enregistrées. Votre fiche reste suspendue jusqu’à sa réactivation par l’administration.'
          : status === 'rejected'
            ? 'Votre fiche corrigée a été renvoyée à l’administration pour examen.'
            : 'Votre fiche professionnelle est enregistrée. Elle sera visible après validation par l’administration.');
    } catch (error) {
      setMessage(authErrorMessage(error, 'signup'));
    } finally {
      setSaving(false);
    }
  };

  const uploadProfessionalMedia = async (files: FileList | File | null, kind: 'avatar' | 'portfolio') => {
    if (!supabase || !userId || !files) return;
    const selected = files instanceof File ? [files] : Array.from(files);
    const remaining = kind==='portfolio' ? 6-portfolioPaths.length : 1;
    if (!selected.length) return;
    if (kind==='portfolio' && selected.length>remaining) { setMediaMessage('Vous pouvez afficher jusqu’à 6 réalisations.'); return; }
    if (selected.some(file=>!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>2_097_152)) { setMediaMessage('Choisissez des images PNG, JPEG ou WebP de 2 Mo maximum chacune.'); return; }
    setMediaMessage('Téléversement des images…');
    try {
      const uploaded: string[] = [];
      for (const file of selected) {
        const extension = file.type==='image/jpeg'?'jpg':file.type==='image/png'?'png':'webp';
        const path = `${userId}/${kind}-${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from('professional-media').upload(path,file,{contentType:file.type,upsert:false});
        if (error) throw error;
        uploaded.push(path);
      }
      if (kind==='avatar') {
        if (avatarPath) setPendingMediaRemoval(current=>[...new Set([...current,avatarPath])]);
        setAvatarPath(uploaded[0] ?? null);
      } else setPortfolioPaths(current=>[...current,...uploaded]);
      setMediaMessage('Image téléversée. Cliquez sur « Enregistrer ma fiche » pour publier la mise à jour.');
    } catch (error) { setMediaMessage(authErrorMessage(error,'signup')); }
  };

  const deleteProfessionalMedia = async (path: string, kind: 'avatar' | 'portfolio') => {
    setPendingMediaRemoval(current=>[...new Set([...current,path])]);
    if (kind==='avatar') setAvatarPath(null); else setPortfolioPaths(current=>current.filter(item=>item!==path));
    setMediaMessage('Image marquée pour suppression. Enregistrez votre fiche pour confirmer la modification.');
  };

  const updateRequestStatus = async (id: string, nextStatus: string) => {
    if (!supabase) return;
    setMessage('');
    const { error } = await supabase.from('service_requests').update({ status: nextStatus }).eq('id', id);
    if (error) { setMessage(authErrorMessage(error, 'signup')); return; }
    setRequests(current => current.map(request => request.id === id ? { ...request, status: nextStatus } : request));
  };
  const switchToProfessionalAccount = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) { setMessage(error.message); return; }
    setUserId('');
    setUserEmail('');
    setRole('');
    setLocation('/inscription?next=%2Fespace%2Fpro');
  };

  const completionChecklist = [
    { label: 'Nom professionnel', complete: form.displayName.trim().length > 0 },
    { label: 'Métier', complete: Boolean(form.categoryId) },
    { label: 'Quartier', complete: Boolean(form.neighborhood) },
    { label: 'Présentation (20 caractères minimum)', complete: form.description.trim().length >= 20 },
    { label: 'Années d’expérience', complete: Number.isInteger(Number(form.experienceYears)) && Number(form.experienceYears) >= 0 && Number(form.experienceYears) <= 80 },
  ];
  const completedProfileFields = completionChecklist.filter(item => item.complete).length;
  const completionPercent = Math.round(completedProfileFields / completionChecklist.length * 100);

  if (loading) return <div className="mx-auto max-w-3xl px-5 py-16 text-sm text-[#647384]">Chargement de votre espace…</div>;
  if (!userId) return <div className="mx-auto max-w-3xl px-5 py-16"><PageTitle eyebrow="Espace professionnel" title="Ouvrez votre espace professionnel" text="Créez un compte professionnel ou connectez-vous. Vous pourrez ensuite enregistrer votre fiche et suivre sa validation ici."/><div className="flex flex-wrap gap-3"><Link href="/inscription?next=%2Fespace%2Fpro" className="inline-flex rounded-lg bg-[#183451] px-4 py-3 text-sm font-bold text-white">Créer mon compte professionnel</Link><Link href="/connexion?next=%2Fespace%2Fpro" className="inline-flex rounded-lg border border-[#dfe5e8] bg-white px-4 py-3 text-sm font-bold text-[#405268]">J’ai déjà un compte</Link></div>{message&&<p role="alert" className="mt-3 text-sm text-[#a34436]">{message}</p>}</div>;
  if (role !== 'professional') return <div className="mx-auto max-w-3xl px-5 py-16"><PageTitle eyebrow="Espace réservé" title="Ce compte est un compte client" text="La session ouverte n’a pas le rôle professionnel. Déconnectez-vous pour créer une activité ou vous connecter avec un autre compte professionnel."/><button onClick={()=>void switchToProfessionalAccount()} className="rounded-lg bg-[#183451] px-4 py-3 text-sm font-bold text-white">Changer de compte professionnel</button>{message&&<p role="alert" className="mt-3 text-sm text-[#a34436]">{message}</p>}</div>;

  return <div className="page-enter mx-auto max-w-[900px] px-4 py-10 sm:px-7">
    <PageTitle eyebrow="Espace professionnel · compte réel" title={status ? 'Ma fiche professionnelle' : 'Créer ma fiche professionnelle'} text={status==='verified'?'Gérez les informations de votre profil et vos demandes clients.':"Ces informations seront enregistrées dans Supabase. Votre fiche restera en attente avant validation."} />
    <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-[#cfe4d4] bg-[#f5fbf6] px-4 py-3 text-xs"><span className="rounded-full bg-[#e4f3e7] px-2.5 py-1 font-extrabold text-[#327044]">Compte professionnel réel</span><span className="font-semibold text-[#29445c]">{form.displayName}</span><span className="text-[#667887]">{userEmail}</span></div>
    <section className="mb-5 rounded-2xl border border-[#e0e6e8] bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-serif text-lg font-bold text-[#183451]">Complétude du profil</h2><p className="mt-1 text-xs text-[#71808b]">Les informations principales aident les clients à vous identifier et à vous trouver.</p></div><span className="rounded-full bg-[#edf4fc] px-3 py-1.5 text-xs font-extrabold text-[#174572]">{completedProfileFields}/{completionChecklist.length} éléments</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#edf1f3]" role="progressbar" aria-label="Complétude du profil" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completionPercent}><div className="h-full rounded-full bg-[#0d5ebd] transition-all" style={{width:`${completionPercent}%`}}/></div><ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{completionChecklist.map(item=><li key={item.label} className={`flex items-center gap-2 text-xs ${item.complete?'font-semibold text-[#327044]':'text-[#71808b]'}`}><span aria-hidden="true" className={`flex h-4 w-4 items-center justify-center rounded-full ${item.complete?'bg-[#e4f3e7]':'border border-[#cbd5da]'}`}>{item.complete&&<Check size={11}/>}</span>{item.label}</li>)}</ul></section>
    <div className="mb-5"><div className="flex items-start gap-3 rounded-xl border border-[#d7e5f7] bg-[#f3f8ff] p-4 text-sm leading-6 text-[#34516d]"><Info size={17} className="mt-0.5 shrink-0 text-[#0d5ebd]"/><p>Les fiches sont publiées après vérification par l’administration. Seuls le nom, le quartier, le métier et les informations professionnelles renseignées seront affichés publiquement.</p></div></div>
    {status && <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ead9b7] bg-[#fff9ee] px-4 py-3 text-sm text-[#735b35]"><span>État de la fiche : <strong>{status === 'verified' ? 'Vérifiée et publiée' : status === 'rejected' ? 'À corriger' : status === 'suspended' ? 'Suspendue' : 'En attente de validation'}</strong></span>{status==='verified'&&<Link href={`/professionnels/${userId}`} className="inline-flex items-center gap-1.5 rounded-lg border border-[#e5d7b8] bg-white px-3 py-2 text-xs font-bold text-[#705a32]">Voir mon profil public <ArrowRight size={13}/></Link>}</div>}
    {categories.length === 0 && <div className="mb-5"><InfoNote>Aucune catégorie n’est disponible. L’administrateur doit exécuter le script `05_seed_data.sql` dans Supabase.</InfoNote></div>}
    <section className="mb-5 rounded-2xl border border-[#e0e6e8] bg-white p-5 shadow-[0_8px_24px_rgba(16,56,94,.06)] sm:p-6"><h2 className="font-serif text-lg font-bold text-[#183451]">Photos professionnelles</h2><p className="mt-1 text-xs leading-5 text-[#778590]">Ces images seront stockées dans Supabase et visibles sur votre fiche après validation. PNG, JPEG ou WebP, 2 Mo maximum par image.</p><div className="mt-4 grid gap-5 sm:grid-cols-[160px_1fr]"><div><div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-[#dfe5e8] bg-[#edf4fc] text-2xl font-extrabold text-[#174572]">{avatarPath?<img src={professionalMediaUrl(avatarPath)} alt="Photo de profil professionnel" className="h-full w-full object-cover"/>:form.displayName.split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase()}</div><label className="mt-3 block text-[10px] font-bold text-[#506273]">Photo de profil<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>{void uploadProfessionalMedia(event.currentTarget.files?.[0]??null,'avatar');event.currentTarget.value=''}} className="mt-1.5 block w-full text-[10px] font-normal"/></label>{avatarPath&&<button type="button" onClick={()=>deleteProfessionalMedia(avatarPath,'avatar')} className="mt-2 text-[10px] font-bold text-[#9f5145]">Supprimer la photo</button>}</div><div><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold text-[#506273]">Réalisations ({portfolioPaths.length}/6)</p><p className="mt-1 text-[10px] text-[#81909b]">Ajoutez des exemples de travaux effectués.</p></div><label className="cursor-pointer rounded-lg border border-[#dfe5e8] bg-white px-3 py-2 text-[10px] font-bold text-[#405268]">Ajouter des photos<input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={portfolioPaths.length>=6} onChange={event=>{void uploadProfessionalMedia(event.currentTarget.files,'portfolio');event.currentTarget.value=''}} className="sr-only"/></label></div><div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">{portfolioPaths.map(path=><div key={path} className="relative aspect-square overflow-hidden rounded-lg border border-[#dfe5e8]"><img src={professionalMediaUrl(path)} alt="Réalisation professionnelle" className="h-full w-full object-cover"/><button type="button" onClick={()=>deleteProfessionalMedia(path,'portfolio')} aria-label="Supprimer cette réalisation" className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-[#9f5145] shadow"><X size={14}/></button></div>)}{portfolioPaths.length===0&&<div className="col-span-full rounded-lg border border-dashed border-[#d4dde0] p-6 text-center text-xs text-[#87939b]">Aucune réalisation ajoutée.</div>}</div></div></div>{mediaMessage&&<p role="status" className="mt-3 rounded-lg bg-[#f3f6f7] p-3 text-xs text-[#526575]">{mediaMessage}</p>}</section>
    <form onSubmit={saveProfessional} className="rounded-2xl border border-[#e0e6e8] bg-white p-5 shadow-[0_8px_24px_rgba(16,56,94,.06)] sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-xs font-bold text-[#506273]">Nom affiché<input required maxLength={100} value={form.displayName} onChange={e=>updateForm('displayName',e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] px-3 py-3 text-sm font-normal"/></label>
        <label className="block text-xs font-bold text-[#506273]">Métier<select required value={form.categoryId} onChange={e=>{updateForm('categoryId',e.target.value);setSelectedSkillIds([])}} className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] bg-white px-3 py-3 text-sm font-normal"><option value="">Choisir un métier</option>{categories.map(category=><option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label className="block text-xs font-bold text-[#506273]">Votre quartier<select value={form.neighborhood} onChange={e=>updateForm('neighborhood',e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] bg-white px-3 py-3 text-sm font-normal">{neighborhoods.map(place=><option key={place}>{place}</option>)}</select></label>
        <label className="block text-xs font-bold text-[#506273]">Téléphone public (facultatif)<input type="tel" maxLength={32} value={form.phone} onChange={e=>updateForm('phone',e.target.value)} placeholder="Ex. +243…" className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] px-3 py-3 text-sm font-normal"/><span className="mt-1 block font-normal text-[#81909b]">Ce numéro pourra être affiché aux visiteurs.</span></label>
        <label className="block text-xs font-bold text-[#506273]">Expérience (années)<input type="number" min="0" max="80" step="1" required value={form.experienceYears} onChange={e=>updateForm('experienceYears',e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] px-3 py-3 text-sm font-normal"/></label>
        <label className="block text-xs font-bold text-[#506273]">Tarif indicatif en CDF (facultatif)<input type="number" min="0" step="1" value={form.indicativeRate} onChange={e=>updateForm('indicativeRate',e.target.value)} placeholder="Laisser vide si sur devis" className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] px-3 py-3 text-sm font-normal"/></label>
      </div>
      <label className="mt-4 block text-xs font-bold text-[#506273]">Présentation professionnelle<textarea required minLength={20} maxLength={3000} rows={5} value={form.description} onChange={e=>updateForm('description',e.target.value)} placeholder="Décrivez vos services et votre expérience…" className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] px-3 py-3 text-sm font-normal"/></label>
      <fieldset className="mt-4 rounded-xl border border-[#e5eaed] p-4"><legend className="px-1 text-xs font-bold text-[#506273]">Compétences précises</legend>{skillOptions.length?<div className="flex flex-wrap gap-2">{skillOptions.map(skill=><label key={skill.id} className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${selectedSkillIds.includes(skill.id)?'border-[#0d5ebd] bg-[#edf4fc] text-[#174572]':'border-[#dfe5e8] bg-white text-[#657785]'}`}><input type="checkbox" checked={selectedSkillIds.includes(skill.id)} onChange={event=>setSelectedSkillIds(current=>event.target.checked?[...current,skill.id]:current.filter(id=>id!==skill.id))} className="accent-[#0d5ebd]"/>{skill.name}</label>)}</div>:<p className="text-xs leading-5 text-[#81909b]">Aucune compétence n’est configurée pour ce métier. Votre métier et votre présentation restent enregistrés ; l’administrateur peut ajouter des compétences dans Supabase.</p>}</fieldset>
      <label className="mt-4 block text-xs font-bold text-[#506273]">Zones d’intervention <span className="font-normal text-[#81909b]">(séparées par des virgules)</span><input value={form.serviceArea} onChange={e=>updateForm('serviceArea',e.target.value)} placeholder="Himbi, Katindo…" className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] px-3 py-3 text-sm font-normal"/></label>
      <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl bg-[#f5f8fa] p-4 text-sm font-semibold text-[#435c70]"><input type="checkbox" checked={form.available} onChange={e=>updateForm('available',e.target.checked)} className="h-4 w-4 accent-[#0d5ebd]"/>Je suis disponible pour recevoir des demandes</label>
      {message && <p role="status" className="mt-4 rounded-lg bg-[#f3f6f7] p-3 text-sm leading-5 text-[#526575]">{message}</p>}
      <button type="submit" disabled={saving || categories.length===0} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0d5ebd] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0b4fa7] disabled:cursor-not-allowed disabled:opacity-60"><Check size={17}/>{saving?'Enregistrement…':status?'Enregistrer les modifications':'Créer ma fiche professionnelle'}</button>
    </form>
    <section className="mt-6 rounded-2xl border border-[#e0e6e8] bg-white p-5 shadow-[0_8px_24px_rgba(16,56,94,.06)] sm:p-7">
      <div className="flex items-center justify-between"><div><h2 className="font-serif text-xl font-bold text-[#183451]">Demandes reçues</h2><p className="mt-1 text-xs text-[#78858e]">Demandes enregistrées dans votre compte</p></div><span className="rounded-full bg-[#eef2f4] px-2.5 py-1 text-xs font-bold text-[#456178]">{requests.filter(r=>r.status!=='cancelled').length}</span></div>
      {requests.length ? <div className="mt-4 space-y-3">{requests.map(request=><article key={request.id} className="rounded-xl border border-[#e5e9ea] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold text-[#2a455d]">{request.client?.[0]?.display_name??'Client'}</h3><StatusPill status={request.status==='pending'?'En attente':request.status==='accepted'?'Acceptée':request.status==='in_progress'?'En cours':request.status==='completed'?'Terminée':request.status==='declined'?'Refusée':'Annulée'}/></div><p className="mt-2 text-sm leading-5 text-[#5e6d78]">{request.description}</p><p className="mt-2 text-[10px] text-[#84919a]">{request.neighborhood??'Quartier non précisé'} · {new Date(request.created_at).toLocaleDateString('fr-FR')}</p>{professionalRequestTransitions(request.status).length>0&&<label className="mt-3 block text-[10px] font-bold uppercase tracking-wider text-[#76848c]">Mettre à jour<select value="" onChange={e=>void updateRequestStatus(request.id,e.target.value)} className="mt-1 block w-full rounded-lg border border-[#dfe5e8] bg-white px-3 py-2 text-xs font-semibold normal-case tracking-normal text-[#29465e]"><option value="" disabled>Choisir une action</option>{professionalRequestTransitions(request.status).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>}</article>)}</div>:<div className="mt-4 rounded-xl border border-dashed border-[#d4dde0] p-8 text-center"><Clock3 size={22} className="mx-auto text-[#82939d]"/><p className="mt-3 text-sm font-semibold text-[#476075]">Aucune demande reçue pour le moment</p><p className="mt-1 text-xs text-[#87939b]">Les nouvelles demandes envoyées par les clients apparaîtront ici.</p></div>}
    </section>
  </div>;
}

type AdminAccountRecord = { user_id: string; email: string | null; display_name: string; role: string | null; neighborhood: string | null; created_at: string; profile_exists: boolean };
type AdminProfessionalRecord = { profile_id: string; display_name: string; neighborhood: string | null; category_name: string; status: string; moderation_reason: string | null; description: string; experience_years: number; indicative_rate: number | null; rate_currency: string; available: boolean; service_area: string[]; public_contact_phone: string | null; skills: string[]; avatar_path: string | null; portfolio_paths: string[]; verified_at: string | null; created_at: string };
type AdminCategoryRecord = { id: string; name: string; description: string | null };
type AdminSkillRecord = { id: string; category_id: string; name: string };

function LiveAdminPage() {
  const [tab, setTab] = useState<'accounts' | 'professionals' | 'catalog'>('accounts');
  const [accounts, setAccounts] = useState<AdminAccountRecord[]>([]);
  const [professionals, setProfessionals] = useState<AdminProfessionalRecord[]>([]);
  const [categories, setCategories] = useState<AdminCategoryRecord[]>([]);
  const [skills, setSkills] = useState<AdminSkillRecord[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [skillDrafts, setSkillDrafts] = useState<Record<string,string>>({});
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState('');
  const [pendingDeleteSkill, setPendingDeleteSkill] = useState('');
  const [catalogBusy, setCatalogBusy] = useState(false);
  const [catalogMessage, setCatalogMessage] = useState('');
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = async () => {
    if (!supabase) return;
    setLoading(true);
    setError('');
    const [{ data: accountRows, error: accountError }, { data: professionalRows, error: professionalError }, { data: categoryRows, error: categoryError }, { data: skillRows, error: skillError }] = await Promise.all([
      supabase.rpc('admin_list_accounts'),
      supabase.rpc('admin_list_professionals'),
      supabase.from('categories').select('id, name, description').order('name'),
      supabase.from('skills').select('id, category_id, name').order('name'),
    ]);
    if (accountError || professionalError || categoryError || skillError) {
      setError(accountError?.code === 'PGRST202' || accountError?.message.includes('admin_list_accounts')
        ? 'La fonction SQL admin_list_accounts manque dans Supabase. Exécutez supabase/sql-editor/06_admin_accounts.sql.'
        : professionalError?.code === 'PGRST202' || professionalError?.message.includes('admin_list_professionals')
          ? 'La liste des fiches détaillées manque dans Supabase. Exécutez supabase/sql-editor/08_admin_professional_details.sql, puis actualisez.'
          : categoryError || skillError
            ? 'Impossible de lire le catalogue de métiers. Vérifiez les politiques RLS des catégories et compétences.'
            : accountError?.message ?? professionalError?.message ?? 'Impossible de charger les données administrateur.');
    } else {
      const proRows = (professionalRows ?? []) as Omit<AdminProfessionalRecord,'avatar_path'|'portfolio_paths'>[];
      const ids = proRows.map(row=>row.profile_id);
      const { data: mediaRows, error: mediaError } = ids.length
        ? await supabase.from('professionals').select('profile_id, avatar_path, portfolio_paths').in('profile_id',ids)
        : { data: [], error: null };
      if (mediaError) {
        setError(mediaError.message.includes('avatar_path') || mediaError.message.includes('portfolio_paths')
          ? 'Le stockage des photos n’est pas installé dans Supabase. Exécutez supabase/sql-editor/09_professional_media.sql.'
          : mediaError.message);
      }
      const mediaEntries = (mediaRows??[]) as {profile_id:string;avatar_path:string|null;portfolio_paths:string[]|null}[];
      const mediaById = new Map(mediaEntries.map(row=>[row.profile_id,row] as const));
      setAccounts((accountRows ?? []) as AdminAccountRecord[]);
      setProfessionals(proRows.map(row=>({...row,avatar_path:mediaById.get(row.profile_id)?.avatar_path??null,portfolio_paths:mediaById.get(row.profile_id)?.portfolio_paths??[]})) as AdminProfessionalRecord[]);
      setCategories((categoryRows??[]) as AdminCategoryRecord[]);
      setSkills((skillRows??[]) as AdminSkillRecord[]);
    }
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, []);

  const review = async (profileId: string, status: 'verified' | 'rejected' | 'suspended') => {
    if (!supabase) return;
    const reason = reasons[profileId]?.trim() ?? '';
    if ((status === 'rejected' || status === 'suspended') && reason.length < 3) {
      setError('Saisissez un motif d’au moins 3 caractères pour refuser ou suspendre une fiche.');
      return;
    }
    setBusyId(profileId);
    setError('');
    setNotice('');
    const { error: reviewError } = await supabase.rpc('admin_review_professional', {
      p_profile_id: profileId,
      p_status: status,
      p_reason: reason || null,
    });
    if (reviewError) setError(reviewError.message);
    else {
      setNotice(status === 'verified' ? 'Fiche validée.' : status === 'rejected' ? 'Fiche refusée.' : 'Fiche suspendue.');
      await refresh();
    }
    setBusyId('');
  };

  const catalogError = (error: {code?:string;message:string}) => {
    if (error.code==='42501' || /permission denied/i.test(error.message)) return 'Permission SQL manquante. Exécutez supabase/sql-editor/11_admin_catalog_management.sql dans Supabase.';
    if (error.code==='23503') return 'Cette ligne est encore utilisée par une fiche ou une compétence. Détachez-la avant de la supprimer.';
    if (error.code==='23505') return 'Ce nom existe déjà dans cette catégorie.';
    return error.message;
  };

  const addCategory = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    const name=categoryName.trim();
    if (!name || name.length>80) { setCatalogMessage('Le nom doit contenir entre 1 et 80 caractères.'); return; }
    if (categories.some(category=>category.name.toLocaleLowerCase('fr')===name.toLocaleLowerCase('fr'))) { setCatalogMessage('Ce métier existe déjà.'); return; }
    setCatalogBusy(true);setCatalogMessage('');
    const {error}=await supabase.from('categories').insert({name,description:categoryDescription.trim()||null});
    if(error) setCatalogMessage(catalogError(error));
    else {setCategoryName('');setCategoryDescription('');setCatalogMessage('Métier ajouté au catalogue.');await refresh();}
    setCatalogBusy(false);
  };

  const addSkill = async (categoryId:string) => {
    if (!supabase) return;
    const name=(skillDrafts[categoryId]??'').trim();
    if (!name || name.length>80) { setCatalogMessage('Le nom de la compétence doit contenir entre 1 et 80 caractères.'); return; }
    if (skills.some(skill=>skill.category_id===categoryId&&skill.name.toLocaleLowerCase('fr')===name.toLocaleLowerCase('fr'))) { setCatalogMessage('Cette compétence existe déjà pour ce métier.'); return; }
    setCatalogBusy(true);setCatalogMessage('');
    const {error}=await supabase.from('skills').insert({category_id:categoryId,name});
    if(error) setCatalogMessage(catalogError(error));
    else {setSkillDrafts(current=>({...current,[categoryId]:''}));setCatalogMessage('Compétence ajoutée.');await refresh();}
    setCatalogBusy(false);
  };

  const deleteCategory = async (category:AdminCategoryRecord) => {
    if (!supabase) return;
    if (pendingDeleteCategory!==category.id) {setPendingDeleteCategory(category.id);return;}
    setCatalogBusy(true);setCatalogMessage('');
    const {error}=await supabase.from('categories').delete().eq('id',category.id);
    if(error) setCatalogMessage(catalogError(error));
    else {setPendingDeleteCategory('');setCatalogMessage(`Métier « ${category.name} » supprimé.`);await refresh();}
    setCatalogBusy(false);
  };

  const deleteSkill = async (skill:AdminSkillRecord) => {
    if (!supabase) return;
    if (pendingDeleteSkill!==skill.id) {setPendingDeleteSkill(skill.id);return;}
    setCatalogBusy(true);setCatalogMessage('');
    const {error}=await supabase.from('skills').delete().eq('id',skill.id);
    if(error) setCatalogMessage(catalogError(error));
    else {setPendingDeleteSkill('');setCatalogMessage(`Compétence « ${skill.name} » supprimée.`);await refresh();}
    setCatalogBusy(false);
  };

  const roleName = (role: string | null) => role === 'professional' ? 'Professionnel' : role === 'admin' ? 'Administrateur' : role === 'client' ? 'Client' : 'Profil manquant';
  const statusName = (status: string) => status === 'verified' ? 'Validé' : status === 'rejected' ? 'Refusé' : status === 'suspended' ? 'Suspendu' : 'En attente';

  return <div className="page-enter mx-auto max-w-[1240px] px-4 py-6 sm:px-7 sm:py-8">
    <div className="mb-7 flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-br from-[#10385e] via-[#174572] to-[#0d5ebd] p-6 text-white shadow-[0_18px_40px_rgba(16,56,94,.18)] sm:flex-row sm:items-end sm:p-8"><div><div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#f4c35e]"><ShieldCheck size={15}/> Administration connectée</div><h1 className="font-serif text-3xl font-extrabold tracking-tight sm:text-4xl">Comptes réels</h1><p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">Cette liste est chargée depuis Supabase, y compris les comptes qui n’ont pas encore créé leur fiche.</p></div><button onClick={()=>void refresh()} className="rounded-lg border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/20">Actualiser</button></div>
    <div className="mb-5 rounded-xl border border-[#d7e5f7] bg-[#f3f8ff] px-4 py-3 text-xs leading-5 text-[#34516d]">Un compte client ou professionnel peut être présent ici sans apparaître dans la recherche. Les professionnels doivent créer une fiche puis attendre sa validation.</div>
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><Metric label="Comptes enregistrés" value={String(accounts.length)}/><Metric label="Professionnels actifs" value={String(professionals.filter(pro=>pro.status==='verified').length)}/><Metric label="Fiches à examiner" value={String(professionals.filter(pro=>pro.status==='pending').length)}/></div>
    <div role="tablist" aria-label="Données administrateur" className="flex flex-wrap gap-1 rounded-xl border border-[#e4eaf0] bg-white p-1.5 shadow-sm"><button role="tab" aria-selected={tab==='accounts'} onClick={()=>setTab('accounts')} className={`rounded-lg px-4 py-2.5 text-sm font-bold ${tab==='accounts'?'bg-[#183451] text-white':'text-[#667887] hover:bg-[#f1f5f8]'}`}>Comptes ({accounts.length})</button><button role="tab" aria-selected={tab==='professionals'} onClick={()=>setTab('professionals')} className={`rounded-lg px-4 py-2.5 text-sm font-bold ${tab==='professionals'?'bg-[#183451] text-white':'text-[#667887] hover:bg-[#f1f5f8]'}`}>Fiches professionnelles ({professionals.length})</button><button role="tab" aria-selected={tab==='catalog'} onClick={()=>setTab('catalog')} className={`rounded-lg px-4 py-2.5 text-sm font-bold ${tab==='catalog'?'bg-[#183451] text-white':'text-[#667887] hover:bg-[#f1f5f8]'}`}>Métiers et compétences ({categories.length})</button></div>
    {error&&<p role="alert" className="mt-4 rounded-xl border border-[#f0d8d4] bg-[#fff8f6] px-4 py-3 text-sm text-[#9f5145]">{error}</p>}{notice&&<p role="status" className="mt-4 rounded-xl border border-[#cfe4d4] bg-[#f5fbf6] px-4 py-3 text-sm text-[#327044]">{notice}</p>}
    {loading?<div className="mt-5 rounded-2xl border border-[#e0e6e8] bg-white p-10 text-center text-sm text-[#647384]">Chargement des données Supabase…</div>:tab==='catalog'?<AdminCatalogPanel categories={categories} skills={skills} categoryName={categoryName} categoryDescription={categoryDescription} skillDrafts={skillDrafts} pendingDeleteCategory={pendingDeleteCategory} pendingDeleteSkill={pendingDeleteSkill} busy={catalogBusy} message={catalogMessage} onCategoryName={setCategoryName} onCategoryDescription={setCategoryDescription} onSkillDraft={(id,value)=>setSkillDrafts(current=>({...current,[id]:value}))} onAddCategory={addCategory} onAddSkill={addSkill} onDeleteCategory={deleteCategory} onDeleteSkill={deleteSkill} onCancelDeleteCategory={()=>setPendingDeleteCategory("")} onCancelDeleteSkill={()=>setPendingDeleteSkill("")} />:tab==='accounts'?<section className="mt-4 overflow-x-auto rounded-2xl border border-[#e0e6e8] bg-white shadow-sm"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#f5f8fa] text-[10px] uppercase tracking-wider text-[#71808b]"><tr><th className="p-4">Adresse du compte</th><th className="p-4">Nom</th><th className="p-4">Type</th><th className="p-4">Quartier</th><th className="p-4">Profil</th><th className="p-4">Inscription</th></tr></thead><tbody>{accounts.map(account=><tr key={account.user_id} className="border-t border-[#edf0f1]"><td className="p-4 font-semibold text-[#29445c]">{account.email || 'E-mail indisponible'}</td><td className="p-4 text-[#526575]">{account.display_name}</td><td className="p-4"><span className="rounded-full bg-[#edf4fc] px-2.5 py-1 text-xs font-bold text-[#174572]">{roleName(account.role)}</span></td><td className="p-4 text-[#637480]">{account.neighborhood || '—'}</td><td className="p-4">{account.profile_exists?<span className="text-xs font-bold text-[#327044]">Créé</span>:<span className="text-xs font-bold text-[#a65445]">Manquant</span>}</td><td className="p-4 text-xs text-[#71808b]">{new Date(account.created_at).toLocaleDateString('fr-FR')}</td></tr>)}{accounts.length===0&&<tr><td colSpan={6} className="p-10 text-center text-sm text-[#71808b]">Aucun compte Auth trouvé.</td></tr>}</tbody></table></section>:<section className="mt-4 space-y-3">{professionals.map(pro=><AdminProfessionalCard key={pro.profile_id} pro={pro} reason={reasons[pro.profile_id]??''} busy={busyId===pro.profile_id} onReason={value=>setReasons(prev=>({...prev,[pro.profile_id]:value}))} onReview={status=>void review(pro.profile_id,status)}/ >)}{professionals.length===0&&<div className="rounded-2xl border border-dashed border-[#ccd7dc] bg-white px-5 py-12 text-center text-sm text-[#71808b]">Aucune fiche professionnelle n’a encore été envoyée.</div>}</section>}
  </div>;
}

function AdminCatalogPanel({categories,skills,categoryName,categoryDescription,skillDrafts,pendingDeleteCategory,pendingDeleteSkill,busy,message,onCategoryName,onCategoryDescription,onSkillDraft,onAddCategory,onAddSkill,onDeleteCategory,onDeleteSkill,onCancelDeleteCategory,onCancelDeleteSkill}:{categories:AdminCategoryRecord[];skills:AdminSkillRecord[];categoryName:string;categoryDescription:string;skillDrafts:Record<string,string>;pendingDeleteCategory:string;pendingDeleteSkill:string;busy:boolean;message:string;onCategoryName:(value:string)=>void;onCategoryDescription:(value:string)=>void;onSkillDraft:(id:string,value:string)=>void;onAddCategory:(event:FormEvent)=>void;onAddSkill:(id:string)=>void;onDeleteCategory:(category:AdminCategoryRecord)=>void;onDeleteSkill:(skill:AdminSkillRecord)=>void;onCancelDeleteCategory:()=>void;onCancelDeleteSkill:()=>void}) {
  return <section className="mt-4 space-y-4">
    <form onSubmit={onAddCategory} className="rounded-2xl border border-[#e0e6e8] bg-white p-5 shadow-sm sm:p-6"><div className="mb-4"><h2 className="font-serif text-xl font-bold text-[#183451]">Ajouter un métier</h2><p className="mt-1 text-xs text-[#78858e]">Les métiers ajoutés ici sont proposés dans le formulaire professionnel et la recherche publique.</p></div><div className="grid gap-3 sm:grid-cols-2"><label className="block text-xs font-bold text-[#506273]">Nom du métier<input required maxLength={80} value={categoryName} onChange={event=>onCategoryName(event.target.value)} placeholder="Ex. Peinture" className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] px-3 py-3 text-sm font-normal"/></label><label className="block text-xs font-bold text-[#506273]">Description courte<input maxLength={500} value={categoryDescription} onChange={event=>onCategoryDescription(event.target.value)} placeholder="Services proposés dans cette catégorie" className="mt-1.5 w-full rounded-lg border border-[#dfe5e8] px-3 py-3 text-sm font-normal"/></label></div><button disabled={busy} className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#0d5ebd] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"><Plus size={15}/>Ajouter le métier</button></form>
    {message&&<p role="status" className="rounded-xl border border-[#d7e5f7] bg-[#f3f8ff] px-4 py-3 text-xs leading-5 text-[#34516d]">{message}</p>}
    <div className="grid gap-4 md:grid-cols-2">{categories.map(category=>{const categorySkills=skills.filter(skill=>skill.category_id===category.id);return <article key={category.id} className="rounded-2xl border border-[#e0e6e8] bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-[#183451]">{category.name}</h3><p className="mt-1 text-xs leading-5 text-[#78858e]">{category.description||'Aucune description'}</p></div><span className="rounded-full bg-[#edf4fc] px-2.5 py-1 text-[10px] font-bold text-[#174572]">{categorySkills.length} compétence{categorySkills.length===1?'':'s'}</span></div><div className="mt-4 border-t border-[#edf0f1] pt-3"><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#81909b]">Compétences proposées</p>{categorySkills.length?<ul className="mt-2 space-y-1.5">{categorySkills.map(skill=><li key={skill.id} className="flex items-center justify-between gap-2 rounded-lg bg-[#f7f9fb] px-3 py-2"><span className="text-xs font-medium text-[#526575]">{skill.name}</span><button type="button" disabled={busy} onClick={()=>onDeleteSkill(skill)} aria-label={pendingDeleteSkill===skill.id?`Confirmer la suppression de ${skill.name}`:`Supprimer ${skill.name}`} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ${pendingDeleteSkill===skill.id?'bg-[#9f5145] text-white':'text-[#9f5145] hover:bg-[#f9eeec]'}`}>{pendingDeleteSkill===skill.id?'Confirmer':'Supprimer'}</button></li>)}</ul>:<p className="mt-2 text-xs text-[#87939b]">Aucune compétence n’a encore été ajoutée.</p>}<div className="mt-3 flex gap-2"><input maxLength={80} value={skillDrafts[category.id]??''} onChange={event=>onSkillDraft(category.id,event.target.value)} aria-label={`Nouvelle compétence pour ${category.name}`} placeholder="Nouvelle compétence" className="min-w-0 flex-1 rounded-lg border border-[#dfe5e8] px-3 py-2 text-xs"/><button type="button" disabled={busy} onClick={()=>onAddSkill(category.id)} className="inline-flex items-center gap-1 rounded-lg border border-[#cbdced] px-3 py-2 text-xs font-bold text-[#174572] disabled:opacity-60"><Plus size={13}/>Ajouter</button></div></div><div className="mt-4 border-t border-[#edf0f1] pt-3">{pendingDeleteCategory===category.id?<div className="flex flex-wrap items-center gap-2"><span className="text-[10px] text-[#9f5145]">Confirmer ? Les métiers utilisés ne peuvent pas être supprimés.</span><button type="button" disabled={busy} onClick={()=>onDeleteCategory(category)} className="rounded-md bg-[#9f5145] px-3 py-1.5 text-[10px] font-bold text-white">Oui, supprimer</button><button type="button" onClick={onCancelDeleteCategory} className="rounded-md border border-[#dfe5e8] px-3 py-1.5 text-[10px] font-bold text-[#526575]">Annuler</button></div>:<button type="button" disabled={busy} onClick={()=>onDeleteCategory(category)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold text-[#9f5145] hover:bg-[#f9eeec] disabled:opacity-60"><Trash2 size={13}/>Supprimer le métier</button>}</div></article>})}</div>
    {categories.length===0&&<div className="rounded-2xl border border-dashed border-[#ccd7dc] bg-white px-5 py-12 text-center text-sm text-[#71808b]">Aucun métier configuré. Ajoutez le premier avec le formulaire ci-dessus.</div>}
  </section>;
}

function AdminProfessionalCard({pro,reason,busy,onReason,onReview}:{pro:AdminProfessionalRecord;reason:string;busy:boolean;onReason:(value:string)=>void;onReview:(status:'verified'|'rejected'|'suspended')=>void}) {
  const statusName = pro.status==='verified'?'Professionnel actif':pro.status==='rejected'?'Refusée':pro.status==='suspended'?'Suspendue':'À valider';
  return <article className="rounded-2xl border border-[#e0e6e8] bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3">{pro.avatar_path?<img src={professionalMediaUrl(pro.avatar_path)} alt={`Photo de ${pro.display_name}`} className="h-14 w-14 rounded-full border border-[#e0e6e8] object-cover"/>:<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#eaf2fb] text-sm font-extrabold text-[#174572]">{pro.display_name.split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase()}</div>}<div className="min-w-0"><h2 className="text-lg font-bold text-[#183451]">{pro.display_name}</h2><p className="mt-1 text-sm text-[#617383]">{pro.category_name} · {pro.neighborhood||'Quartier non renseigné'}</p><p className="mt-2 break-all text-[10px] text-[#87939b]">ID {pro.profile_id}</p></div></div><span className={`rounded-full px-3 py-1 text-xs font-extrabold ${pro.status==='verified'?'bg-[#eaf6ed] text-[#327044]':pro.status==='rejected'||pro.status==='suspended'?'bg-[#f9eeec] text-[#9f5145]':'bg-[#fff4df] text-[#8c672a]'}`}>{statusName}</span></div>
    <p className="mt-4 whitespace-pre-line text-sm leading-6 text-[#526575]">{pro.description||'Aucune présentation renseignée.'}</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Expérience" value={`${pro.experience_years} ans`}/><Metric label="Tarif indicatif" value={pro.indicative_rate==null?'Sur devis':`${Number(pro.indicative_rate).toLocaleString('fr-FR')} ${pro.rate_currency}`}/><Metric label="Disponibilité" value={pro.available?'Disponible':'Sur demande'}/><Metric label="Téléphone public" value={pro.public_contact_phone||'Non renseigné'}/></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2"><div><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#81909b]">Zones d’intervention</p><p className="mt-1 text-xs text-[#526575]">{pro.service_area?.length?pro.service_area.join(', '):'Non renseignées'}</p></div><div><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#81909b]">Compétences</p><div className="mt-1 flex flex-wrap gap-1.5">{pro.skills?.length?pro.skills.map(skill=><span key={skill} className="rounded-full bg-[#edf4fc] px-2 py-1 text-[10px] font-semibold text-[#34516d]">{skill}</span>):<span className="text-xs text-[#87939b]">Aucune compétence précisée</span>}</div></div></div>
    {pro.portfolio_paths?.length>0&&<div className="mt-4"><p className="text-[10px] font-extrabold uppercase tracking-wider text-[#81909b]">Photos de réalisations · {pro.portfolio_paths.length}</p><div className="mt-2 flex flex-wrap gap-2">{pro.portfolio_paths.map(path=><img key={path} src={professionalMediaUrl(path)} alt={`Réalisation de ${pro.display_name}`} className="h-16 w-16 rounded-lg border border-[#e0e6e8] object-cover"/>)}</div></div>}
    {pro.moderation_reason&&<p className="mt-4 rounded-lg bg-[#fff8f6] p-3 text-xs text-[#9f5145]">Motif : {pro.moderation_reason}</p>}
    <div className="mt-5 flex flex-col gap-2 border-t border-[#edf0f1] pt-4 sm:flex-row">{pro.status!=='verified'&&<button disabled={busy} onClick={()=>onReview('verified')} className="rounded-lg bg-[#edf4ef] px-4 py-2.5 text-xs font-bold text-[#466b4d] disabled:opacity-60">Valider et publier</button>}<input aria-label={`Motif de modération pour ${pro.display_name}`} value={reason} onChange={event=>onReason(event.target.value)} placeholder="Motif requis pour refuser ou suspendre" className="min-w-0 flex-1 rounded-lg border border-[#dfe5e8] px-3 py-2.5 text-xs"/>{pro.status!=='rejected'&&<button disabled={busy} onClick={()=>onReview('rejected')} className="rounded-lg bg-[#f9eeec] px-4 py-2.5 text-xs font-bold text-[#994d43] disabled:opacity-60">Refuser</button>}{pro.status!=='suspended'&&<button disabled={busy} onClick={()=>onReview('suspended')} className="rounded-lg border border-[#e7d5d2] px-4 py-2.5 text-xs font-bold text-[#994d43] disabled:opacity-60">Suspendre</button>}</div>
  </article>;
}

function HowPage() {
  const steps=[['01','Cherchez autour de vous','Choisissez un métier, un quartier et un rayon.'],['02','Comparez les profils','Consultez les compétences, l’expérience et les disponibilités.'],['03','Prenez contact','Décrivez clairement le travail dont vous avez besoin.'],['04','Décidez ensemble','Confirmez directement avec le professionnel le prix, le délai et les détails.']];
  return <div className="page-enter mx-auto max-w-[1050px] px-4 py-10 sm:px-7 sm:py-14"><PageTitle eyebrow="Simple, local, transparent" title="Des compétences proches. Un choix qui vous appartient." text="KaziGoma aide les habitants de Goma à découvrir les savoir-faire de leur quartier et les professionnels à faire connaître leur activité."/>
    <section className="rounded-2xl bg-[#183451] p-6 text-white sm:p-9"><div className="grid gap-7 sm:grid-cols-2">{steps.map(([n,title,text])=><div key={n} className="border-l border-[#f0bf62]/50 pl-4"><span className="text-xs font-extrabold tracking-widest text-[#f0bf62]">{n}</span><h2 className="mt-2 font-serif text-xl font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#cbd8e1]">{text}</p></div>)}</div></section>
    <div className="mt-8 grid gap-4 sm:grid-cols-2"><article className="rounded-xl border border-[#e0e6e8] bg-white p-5"><h3 className="font-serif text-lg font-bold text-[#183451]">Pour les habitants</h3><p className="mt-2 text-sm leading-6 text-[#687885]">Comparez plusieurs profils, consultez leur zone d’intervention et présentez votre besoin avant de prendre une décision.</p></article><article className="rounded-xl border border-[#e0e6e8] bg-white p-5"><h3 className="font-serif text-lg font-bold text-[#183451]">Pour les professionnels</h3><p className="mt-2 text-sm leading-6 text-[#687885]">Présentez vos services, votre expérience et les quartiers où vous intervenez. Un profil clair aide les clients à vous trouver.</p></article></div>
    <div className="mt-5"><InfoNote>Les profils seront publiés après leur ajout et leur validation. Les avis seront affichés uniquement lorsqu’ils proviendront de prestations réelles.</InfoNote></div>
    <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#183451] px-5 py-3 text-sm font-bold text-white">Trouver un professionnel <ArrowRight size={15}/></Link>
  </div>;
}

function ContactPage() {
  return <div className="page-enter mx-auto max-w-[1050px] px-4 py-10 sm:px-7 sm:py-14"><PageTitle eyebrow="Échangeons" title="Nous sommes à l’écoute." text="Une question sur la plateforme ou besoin d’aide ? Contactez l’équipe KaziGoma."/>
    <div className="grid gap-5 md:grid-cols-2">
      <section className="rounded-2xl bg-[#183451] p-6 text-white shadow-[0_12px_30px_rgba(16,56,94,.12)] sm:p-8"><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#f0bf62]">Nous écrire</div><h2 className="mt-2 font-serif text-2xl font-extrabold">Par e-mail</h2><p className="mt-2 text-sm leading-6 text-[#cbd8e1]">Votre application de messagerie s’ouvrira pour envoyer directement votre demande.</p><a href="mailto:bonjour@kazigoma.cd" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-white px-4 py-2.5 text-sm font-extrabold text-[#183451]">bonjour@kazigoma.cd</a></section>
      <section className="rounded-2xl border border-[#e0e6e8] bg-white p-6 shadow-sm sm:p-8"><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#a57934]">Accès rapides</div><h2 className="mt-2 font-serif text-2xl font-extrabold text-[#183451]">Que souhaitez-vous faire ?</h2><div className="mt-5 grid gap-3"><Link href="/inscription?next=%2Fespace%2Fpro" className="rounded-xl border border-[#dfe5e8] p-4 transition hover:border-[#0d5ebd] hover:bg-[#f7fbff]"><span className="block text-sm font-extrabold text-[#183451]">Inscrire mon activité</span><span className="mt-1 block text-xs leading-5 text-[#71808b]">Créez votre compte professionnel et configurez votre fiche.</span></Link><Link href="/" className="rounded-xl border border-[#dfe5e8] p-4 transition hover:border-[#0d5ebd] hover:bg-[#f7fbff]"><span className="block text-sm font-extrabold text-[#183451]">Trouver un professionnel</span><span className="mt-1 block text-xs leading-5 text-[#71808b]">Parcourez les profils vérifiés sans créer de compte.</span></Link></div></section>
    </div>
  </div>;
}

export default App;
