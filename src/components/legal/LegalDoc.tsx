import Link from 'next/link';

export type LegalSection = { heading: string; paragraphs: string[] };
export type LegalDocProps = {
  title: string;
  updated?: string;
  intro: string;
  sections: LegalSection[];
};

export function LegalDoc({ title, updated = 'October 22, 2026 · Version 1.0 · Draft pending legal review', intro, sections }: LegalDocProps) {
  return (
    <main className="legal" id="doc">
      <p style={{ fontSize: 12, letterSpacing: '.5em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--t2)', marginBottom: 12 }}>
        Strings
      </p>
      <h2>{title}</h2>
      <p className="muted" style={{ fontSize: '.92em', margin: 0 }}>{updated}</p>
      <p className="lead">{intro}</p>

      <div className="toc">
        <b>On this page</b>
        {sections.map((s, i) => (
          <a key={i} href={`#s${i}`}>{i + 1}. {s.heading}</a>
        ))}
      </div>

      {sections.map((s, i) => (
        <section key={i} id={`s${i}`}>
          <h3>{i + 1}. {s.heading}</h3>
          {s.paragraphs.map((p, j) => (
            p.startsWith('• ')
              ? <li key={j}>{p.slice(2)}</li>
              : <p key={j}>{p}</p>
          ))}
        </section>
      ))}

      <p className="muted" style={{ marginTop: 36 }}>
        Questions about this document? Visit the <Link href="/app/help">Help center</Link>.
      </p>
      <p style={{ marginTop: 12 }}><Link href="/">← Home</Link></p>
    </main>
  );
}
