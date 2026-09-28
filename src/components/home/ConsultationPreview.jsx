'use client';

import { useEffect, useRef, useState } from 'react';
import { UserRound, Scale, Lock, FileText, BadgeCheck, CircleCheck, Zap } from 'lucide-react';
import { usePresence } from '@/components/consultation/PresenceProvider';

/**
 * ConsultationPreview — the hero's picture of what Justiceland is: a
 * consultation, start to finish, in one live chat.
 *
 * A client who has been served with a cheque bounce case asks what to do, is
 * matched with a verified lawyer in under a minute, and leaves knowing their
 * next steps. The lawyer advises; they do not take on work — that is what the
 * platform sells, so that is all the example shows. The three steps along the top light up as the chat reaches
 * them, so the process reads even to someone who does not read the messages.
 *
 * Whoever speaks next is shown typing on their own side; the platform's own
 * notes (match, outcome) sit in the middle. Client always left, lawyer always
 * right. The lawyer is not a named person — this illustrates a consultation,
 * it does not claim one.
 *
 * The online figure is live — the same presence poll the lawyer cards read —
 * and the total is the same figure the stats band shows, so the two never
 * disagree. With reduced motion the whole exchange is shown at once.
 *
 * @param {object} props
 * @param {number} [props.totalLawyers]  verified lawyers on the platform
 */
const SCRIPT = [
  { from: 'client', text: 'I got a court summons. A cheque bounce case has been filed against me. What should I do?' },
  { from: 'system', kind: 'match', text: 'Verified Criminal Law lawyer connected in 42 sec' },
  { from: 'lawyer', text: 'Don’t panic. A cheque bounce case is bailable. When is your court date?' },
  { from: 'client', text: 'Next Monday. Should I go?' },
  { from: 'lawyer', text: 'Yes, appear in person. Skipping it can lead to a warrant. Apply for bail the same day.' },
  { from: 'lawyer', text: 'Carry proof of any amount you have repaid. Settling with the complainant can close the case.' },
  { from: 'client', text: 'Thank you, now I know exactly what to do.' },
  { from: 'system', kind: 'done', text: 'Consultation complete · 8 min · ₹80' },
]

/** Which step each point in the script has reached. */
const STEPS = ['Ask your problem', 'Lawyer connected', 'Expert advice'];
function stepFor(shown) {
  if (shown >= SCRIPT.length) return 2;
  if (shown >= 2) return 1;
  return 0;
}

const TYPING_MS = 1400;
const READ_MS = 900;
const REST_MS = 4500;

function Avatar({ lawyer }) {
  const Icon = lawyer ? Scale : UserRound;
  return (
    <span
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
        lawyer ? 'bg-primary text-accent' : 'bg-muted text-primary'
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </span>
  );
}

function Row({ from, label, children }) {
  const lawyer = from === 'lawyer';
  return (
    <div className={`animate-fade-up flex items-end gap-2 ${lawyer ? 'flex-row-reverse' : ''}`}>
      <Avatar lawyer={lawyer} />
      <div className={`max-w-[78%] ${lawyer ? 'text-right' : ''}`}>
        {label && (
          <p
            className={`mb-1 flex items-center gap-1 text-[10.5px] font-semibold ${
              lawyer ? 'justify-end text-[#9A7B1C]' : 'text-ink/50'
            }`}
          >
            {lawyer && <BadgeCheck className="h-3 w-3" aria-hidden="true" />}
            {lawyer ? 'Lawyer · Verified' : 'Client · Anonymous'}
          </p>
        )}
        <div
          className={`inline-block rounded-2xl px-3 py-2 text-left text-[12.5px] leading-snug ${
            lawyer ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md bg-muted text-ink/80'
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function SystemNote({ kind, text }) {
  const done = kind === 'done';
  const Icon = done ? CircleCheck : Zap;
  return (
    <div className="animate-fade-up flex justify-center">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-semibold ${
          done ? 'bg-emerald-500/10 text-emerald-700' : 'bg-accent/15 text-[#8A6D12]'
        }`}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {text}
      </span>
    </div>
  );
}

function Dots() {
  return (
    <span className="flex h-[17px] items-center gap-1" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-60"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

function Message({ msg, prev }) {
  if (msg.from === 'system') return <SystemNote kind={msg.kind} text={msg.text} />;
  // The label only on the first bubble of a turn, like any chat app.
  const label = !prev || prev.from !== msg.from;
  return (
    <Row from={msg.from} label={label}>
      {msg.file ? (
        <span className="flex items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-rose-600">
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span>
            <span className="block font-semibold text-ink">{msg.file}</span>
            <span className="block text-[10.5px] text-ink/45">PDF · shared securely</span>
          </span>
        </span>
      ) : (
        msg.text
      )}
    </Row>
  );
}

export default function ConsultationPreview({ totalLawyers = 0 }) {
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(true);
  const [reduced, setReduced] = useState(false);
  const presence = usePresence();
  const online = presence ? presence.size : null;
  // The chat fills from the top like a real one, and scrolls up once full.
  const chatRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (reduced) return undefined;
    let t;
    if (shown >= SCRIPT.length) {
      t = setTimeout(() => { setShown(0); setTyping(true); }, REST_MS);
    } else if (typing) {
      // The platform's own notes appear on their own, with no one typing.
      const wait = SCRIPT[shown].from === 'system' ? 700 : TYPING_MS;
      t = setTimeout(() => { setShown((n) => n + 1); setTyping(false); }, wait);
    } else {
      t = setTimeout(() => setTyping(true), READ_MS);
    }
    return () => clearTimeout(t);
  }, [shown, typing, reduced]);

  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: shown === 0 ? 'auto' : 'smooth' });
    setScrolled(el.scrollHeight > el.clientHeight + 4);
  }, [shown, typing, reduced]);

  const count = reduced ? SCRIPT.length : shown;
  const visible = SCRIPT.slice(0, count);
  const next = !reduced && typing && shown < SCRIPT.length && SCRIPT[shown].from !== 'system'
    ? SCRIPT[shown]
    : null;
  const step = stepFor(count);

  return (
    <div
      role="img"
      aria-label="Example: a client facing a cheque bounce case consults a verified lawyer online and is told exactly what to do"
      className="w-[26rem] max-w-full overflow-hidden rounded-3xl border border-ink/8 bg-white shadow-[0_2px_4px_rgba(30,58,95,0.04),0_28px_56px_-28px_rgba(30,58,95,0.45)]"
    >
      {/* Who is available right now, and how many there are in all. */}
      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-primary-dark to-primary px-5 py-3.5 text-white">
        <div>
          <p className="text-[13.5px] font-bold">Online consultation</p>
          <p className="text-[11px] text-white/60">
            {totalLawyers > 0 ? `${totalLawyers.toLocaleString('en-IN')}+ verified lawyers` : 'Verified lawyers'}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11.5px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          {online === null ? 'Lawyers online' : `${online} online now`}
        </span>
      </div>

      {/* The three steps of every consultation, lit as the chat reaches them. */}
      <ol className="flex items-center gap-1.5 border-b border-ink/[0.06] px-5 py-2.5">
        {STEPS.map((label, i) => {
          const reached = i <= step;
          return (
            <li key={label} className="flex flex-1 items-center gap-1.5">
              <span
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10.5px] font-bold transition-colors duration-500 ${
                  reached ? 'bg-accent text-primary-dark' : 'bg-ink/[0.07] text-ink/40'
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`truncate text-[11px] font-semibold transition-colors duration-500 ${
                  reached ? 'text-ink' : 'text-ink/40'
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      {/* The chat. Fixed height so the card never changes size; once it is
          full, older lines scroll up and fade out under the steps. */}
      <div
        ref={chatRef}
        className={`flex h-[21rem] flex-col gap-2.5 overflow-hidden bg-[#F8FAFC] px-4 py-3 ${
          scrolled ? '[mask-image:linear-gradient(to_bottom,transparent,black_2.5rem)]' : ''
        }`}
      >
        {visible.map((m, i) => (
          <Message key={i} msg={m} prev={visible[i - 1]} />
        ))}
        {next && (
          <Row key={`typing-${shown}`} from={next.from} label={!visible.length || visible[visible.length - 1].from !== next.from}>
            <Dots />
          </Row>
        )}
      </div>

      <p className="flex items-center justify-center gap-1.5 border-t border-ink/[0.06] px-5 py-2.5 text-[11px] text-ink/45">
        <Lock className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
        Chat, call or video · Pay per minute · 100% private
      </p>
    </div>
  );
}
