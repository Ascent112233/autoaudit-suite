'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocalList } from '../../lib/useLocalList';
import { SEED_AUDITS } from '../../lib/auditData';
import { answerQuery, EXAMPLE_QUERIES } from '../../lib/copilot';

export default function Copilot() {
  const { items: audits } = useLocalList('audit_engagements_v2', SEED_AUDITS);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "I'm AuditBrain — ask me about vendor data, audit status, Field Force travel compliance, or open observations. Try one of the example queries on the right." },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, thinking]);

  function send(text) {
    const query = (text ?? input).trim();
    if (!query) return;
    setMessages((m) => [...m, { role: 'user', text: query }]);
    setInput('');
    setThinking(true);
    setTimeout(() => {
      const answer = answerQuery(query, { audits });
      setMessages((m) => [...m, { role: 'bot', text: answer }]);
      setThinking(false);
    }, 700);
  }

  return (
    <>
      <div className="page-head">
        <h1>AuditBrain Copilot</h1>
        <p>Ask natural-language questions about vendor master data, audit status, travel compliance, and observations.</p>
      </div>
      <div className="grid grid-3" style={{ gap: 18, alignItems: 'flex-start' }}>
        <div className="card" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', height: 520 }}>
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: m.role === 'user' ? 'var(--brand)' : 'var(--surface-2)',
                color: m.role === 'user' ? '#fff' : 'var(--text)',
                borderRadius: 10, padding: '10px 13px', fontSize: 12.5, whiteSpace: 'pre-line', lineHeight: 1.5,
              }}>
                {m.text}
              </div>
            ))}
            {thinking && <div style={{ alignSelf: 'flex-start', fontSize: 12, color: 'var(--text-dimmer)', fontStyle: 'italic' }}>AuditBrain is checking the data…</div>}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', padding: 12, display: 'flex', gap: 8 }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Ask AuditBrain a question…" />
            <button className="btn btn-primary" onClick={() => send()}>Send</button>
          </div>
        </div>
        <div className="card" style={{ padding: '14px 16px' }}>
          <span className="field-label">Example queries</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {EXAMPLE_QUERIES.map((q) => (
              <button key={q} className="btn-sm" style={{ textAlign: 'left', height: 'auto', whiteSpace: 'normal', lineHeight: 1.4 }} onClick={() => send(q)}>{q}</button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
