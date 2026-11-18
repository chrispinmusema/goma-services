import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Bot, MessageCircle, Send, X } from 'lucide-react';

type ChatMessage = { role: 'assistant' | 'user'; text: string };

const suggestions = [
  'Comment trouver un professionnel ?',
  'Comment inscrire mon activité ?',
  'Comment contacter KaziGoma ?',
];

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function editDistanceWithin(first: string, second: string, limit: number) {
  if (Math.abs(first.length - second.length) > limit) return false;
  let previous = Array.from({ length: second.length + 1 }, (_, index) => index);
  for (let row = 1; row <= first.length; row += 1) {
    const current = [row];
    let rowMinimum = row;
    for (let column = 1; column <= second.length; column += 1) {
      const cost = first[row - 1] === second[column - 1] ? 0 : 1;
      current[column] = Math.min(current[column - 1] + 1, previous[column] + 1, previous[column - 1] + cost);
      rowMinimum = Math.min(rowMinimum, current[column]);
    }
    if (rowMinimum > limit) return false;
    previous = current;
  }
  return previous[second.length] <= limit;
}

function hasIntent(text: string, terms: string[]) {
  const words = text.split(' ');
  return terms.some(term => {
    if (text.includes(term)) return true;
    return term.split(' ').some(target => target.length >= 5 && words.some(word => {
      if (word.length < 5) return false;
      const limit = Math.min(word.length, target.length) >= 8 ? 2 : 1;
      return editDistanceWithin(word, target, limit);
    }));
  });
}

function answerQuestion(question: string): string {
  const text = normalize(question);
  const greeting = /\b(bonjour|salut|bonsoir|coucou|hello|yo)\b/.test(text);
  const questionOnlyGreeting = /^(bonjour|salut|bonsoir|coucou|hello|yo)( tout le monde)?$/.test(text);
  const query = text.replace(/\b(bonjour|salut|bonsoir|coucou|hello|yo)\b/g, ' ').replace(/\s+/g, ' ').trim();
  if (questionOnlyGreeting) return 'Bonjour ! Que souhaitez-vous faire sur KaziGoma ? Je peux vous aider à trouver un professionnel, créer un compte ou inscrire votre activité.';

  const aboutKaziGoma = hasIntent(query, ['kazigoma', 'site', 'plateforme', 'compte', 'profil', 'professionnel', 'prestataire', 'activite', 'inscrire', 'inscription', 'enregistrer', 'client', 'demande', 'metier', 'quartier', 'disponible', 'recherche', 'chercher', 'avis', 'service', 'contact', 'equipe', 'accueil', 'connexion', 'connecter', 'login', 'session', 'identifier', 'mot de passe', 'fiche', 'favori', 'artisan', 'plombier', 'electricien', 'macon', 'menuisier', 'peintre', 'mecanicien', 'couturier', 'coiffeur', 'photographe']);
  if (!aboutKaziGoma) {
    return greeting ? 'Bonjour ! Je peux vous aider uniquement pour KaziGoma : comptes, recherche de professionnels, inscription et fonctionnement du site.' : 'Je réponds seulement aux questions sur KaziGoma. Avez-vous besoin d’aide pour un compte, une recherche ou l’inscription d’une activité ?';
  }

  let answer: string;
  if (hasIntent(query, ['mot de passe', 'oubli', 'connexion', 'connecter', 'login', 'ouvrir session', 'acceder au compte', 'entrer dans mon compte', 'identifier', 'recuperer acces', 'sign in'])) {
    answer = 'Pour vous connecter, ouvrez « Se connecter » et saisissez votre adresse e-mail et votre mot de passe. Si vous l’avez oublié, choisissez « Mot de passe oublié ? ».';
  } else if (hasIntent(query, ['inscrire', 'inscription', 'enregistrer', 'enregistrement', 'rejoindre', 'adhesion', 'creer mon compte', 'ouvrir un compte', 'devenir professionnel', 'devenir prestataire', 'm inscrire', 'm enregistrer', 'proposer mes services', 'ajouter mon activite', 'creer mon activite', 'creer un compte professionnel', 'publier ma fiche', 'mettre mon activite en ligne'])) {
    answer = 'Pour inscrire votre activité : 1) choisissez « Créer un compte » ; 2) sélectionnez « Un professionnel » ; 3) confirmez votre adresse e-mail ; 4) ouvrez votre espace professionnel et complétez votre fiche. Elle sera visible après validation par KaziGoma.';
  } else if (hasIntent(query, ['comment ca marche', 'fonctionnement', 'utiliser le site', 'utiliser kazigoma', 'comment fonctionne'])) {
    answer = 'KaziGoma aide les habitants à trouver un professionnel local : cherchez un métier, comparez les profils, puis contactez le professionnel. Les professionnels peuvent créer une fiche, publiée après validation.';
  } else if (hasIntent(query, ['contact', 'aide', 'equipe', 'email', 'mail', 'joindre', 'ecrire', 'appeler', 'parler avec', 'parler a quelqu un', 'assistance', 'support'])) {
    answer = 'Pour joindre l’équipe KaziGoma, écrivez à bonjour@kazigoma.cd depuis la page Contact.';
  } else if (hasIntent(query, ['favori', 'favoris', 'sauvegarder un profil', 'enregistrer un professionnel'])) {
    answer = 'Connectez-vous à votre compte client, puis utilisez le cœur sur un profil pour le retrouver dans vos favoris.';
  } else if (hasIntent(query, ['client', 'demande', 'besoin', 'commander', 'solliciter', 'service', 'trouver quelqu un', 'chercher un artisan', 'mettre en relation'])) {
    answer = 'Avec un compte client, vous pouvez envoyer une demande à un professionnel et enregistrer des profils favoris. Vous pouvez aussi parcourir les profils publics sans compte.';
  } else if (hasIntent(query, ['chercher', 'trouver', 'recherche', 'quartier', 'metier', 'profil', 'professionnel', 'prestataire', 'disponible', 'artisan', 'ouvrier', 'depanneur', 'reparation', 'competence'])) {
    answer = 'Sur l’accueil, cherchez par métier ou compétence, puis choisissez éventuellement un quartier. Ouvrez les profils pour comparer l’expérience, les compétences et les disponibilités.';
  } else if (hasIntent(query, ['prix', 'tarif', 'cout', 'paiement', 'payer', 'combien'])) {
    answer = 'KaziGoma met les habitants en relation avec les professionnels. Le prix et les détails du travail se conviennent directement avec le professionnel avant de confirmer.';
  } else if (hasIntent(query, ['avis', 'note', 'evaluation', 'etoile', 'temoignage', 'commentaire'])) {
    answer = 'Les avis sont affichés uniquement lorsqu’ils proviennent de prestations réelles.';
  } else if (hasIntent(query, ['admin', 'supprimer', 'suppression', 'effacer mon compte'])) {
    answer = 'Pour une suppression de compte ou une question d’administration, écrivez à bonjour@kazigoma.cd. L’équipe pourra vérifier votre demande.';
  } else {
    answer = 'Je peux vous aider pour les comptes, la recherche d’un professionnel, l’inscription d’une activité ou le contact avec KaziGoma. Pouvez-vous préciser ce que vous souhaitez faire ?';
  }
  return greeting ? `Bonjour ! ${answer}` : answer;
}

export function SiteChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: 'Bonjour ! Que souhaitez-vous savoir sur KaziGoma ?' },
  ]);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, open]);

  const sendMessage = (value: string) => {
    const question = value.trim();
    if (!question || busy) return;
    setInput('');
    const conversation = [...messages, { role: 'user' as const, text: question }];
    setMessages(conversation);
    setBusy(true);
    window.setTimeout(() => {
      setMessages(current => [...current, { role: 'assistant', text: answerQuestion(question) }]);
      setBusy(false);
    }, 180);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(input);
  };

  return <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
    {open && <section aria-label="Assistant KaziGoma" className="mb-3 flex h-[min(440px,calc(100dvh-120px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-[#dfe6ea] bg-white shadow-[0_20px_60px_rgba(16,56,94,.24)]">
      <header className="flex items-center justify-between bg-[#183451] px-4 py-3 text-white">
        <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[#f0bf62]"><Bot size={19}/></span><div><p className="text-sm font-extrabold">Assistant KaziGoma</p><p className="text-[11px] text-blue-100">Aide sur le fonctionnement du site</p></div></div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Fermer l’assistant" className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"><X size={18}/></button>
      </header>
      <div aria-live="polite" className="flex-1 space-y-3 overflow-y-auto bg-[#f7f9fa] p-4">
        {messages.map((message, index) => <div key={`${index}-${message.role}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><p className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-5 ${message.role === 'user' ? 'rounded-br-md bg-[#0d5ebd] text-white' : 'rounded-bl-md border border-[#e4eaed] bg-white text-[#354b60]'}`}>{message.text}</p></div>)}
        {busy && <p className="text-xs text-[#71808b]">L’assistant prépare une réponse…</p>}
        <div ref={endRef}/>
      </div>
      {messages.length === 1 && <div className="flex flex-wrap gap-2 border-t border-[#edf0f1] bg-white px-3 py-3">{suggestions.map(suggestion => <button key={suggestion} type="button" onClick={() => void sendMessage(suggestion)} className="rounded-full border border-[#dce6ed] px-3 py-2 text-left text-[11px] font-semibold text-[#31516d] hover:border-[#0d5ebd] hover:bg-[#f4f8fc]">{suggestion}</button>)}</div>}
      <p className="bg-white px-3 pt-2 text-[10px] text-[#87939b]">Assistant automatique · questions sur KaziGoma uniquement.</p>
      <form onSubmit={submit} className="flex items-center gap-2 border-t border-[#e8edef] bg-white p-3"><label className="sr-only" htmlFor="site-chat-message">Votre question sur KaziGoma</label><input id="site-chat-message" value={input} onChange={event => setInput(event.target.value)} maxLength={500} placeholder="Écrivez votre question…" className="min-w-0 flex-1 rounded-xl border border-[#dfe5e8] px-3 py-2.5 text-sm outline-none focus:border-[#0d5ebd]"/><button type="submit" disabled={!input.trim() || busy} aria-label="Envoyer" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0d5ebd] text-white hover:bg-[#0b4fa7] disabled:cursor-not-allowed disabled:opacity-50"><Send size={16}/></button></form>
    </section>}
    <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-label={open ? 'Fermer le chatbot' : 'Ouvrir le chatbot KaziGoma'} className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0d5ebd] text-white shadow-[0_8px_24px_rgba(13,94,189,.35)] transition hover:-translate-y-0.5 hover:bg-[#0b4fa7] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f0bf62]/60">{open ? <X size={22}/> : <MessageCircle size={23}/>}</button>
  </div>;
}
