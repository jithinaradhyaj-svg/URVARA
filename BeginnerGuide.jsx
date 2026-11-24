import { useState } from 'react'
import { askGroq } from '../utils/groqAPI'

const guideTopics = [
  { id: 'compost', title: 'Making Your Own Compost', desc: 'Step by step guide to making free organic manure' },
  { id: 'finance', title: 'Farm Finance & Loans', desc: 'Managing money, loans, and farm budget' },
  { id: 'fertilizer', title: 'Fertilizer Guide', desc: 'NPK basics, organic vs chemical, dosage guide' },
  { id: 'harvest', title: 'Harvesting & Selling', desc: 'When to harvest and how to get best price' },
  { id: 'homeremedies', title: 'Home Remedies for Crops', desc: 'Natural homemade solutions for diseases and pests' },
  { id: 'water', title: 'Irrigation Basics', desc: 'When, how much and how to water your crops' },
  { id: 'organic', title: 'Organic Farming Basics', desc: 'How to farm without chemicals naturally' },
  { id: 'pest', title: 'Pest & Disease Control', desc: 'How to identify and treat common crop problems' },
  { id: 'season', title: 'Seasonal Planning', desc: 'How to plan your crops season by season' },
  { id: 'seeds', title: 'Choosing the Right Seeds', desc: 'How to select quality seeds for your region' },
  { id: 'soil', title: 'Understanding Your Soil', desc: 'How to read, test and improve your soil' },
  { id: 'start', title: 'How to Start Farming', desc: 'Complete beginner guide to starting your farm' },
].sort((a, b) => a.title.localeCompare(b.title))

const TopicIcon = ({ id }) => {
  const icons = {
    compost: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/>
        <path d="M12 6v6l4 2"/>
      </svg>
    ),
    finance: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <path d="M2 10h20"/>
        <path d="M12 15h.01"/>
      </svg>
    ),
    fertilizer: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3h6l1 9H8L9 3z"/>
        <path d="M6 12h12l-2 9H8l-2-9z"/>
        <path d="M12 12v9"/>
      </svg>
    ),
    harvest: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17l4-8 4 4 4-6 4 10"/>
        <path d="M3 21h18"/>
      </svg>
    ),
    homeremedies: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V12"/>
        <path d="M5 12C5 7 8 4 12 2c4 2 7 5 7 10H5z"/>
        <path d="M5 12h14"/>
      </svg>
    ),
    water: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L6 12a6 6 0 1 0 12 0L12 2z"/>
      </svg>
    ),
    organic: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c4-4 8-8 8-13A8 8 0 0 0 4 9c0 5 4 9 8 13z"/>
        <path d="M12 22V11"/>
        <path d="M12 15c-2-2-4-3-6-3"/>
        <path d="M12 11c2-2 4-3 6-3"/>
      </svg>
    ),
    pest: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
    ),
    season: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <path d="M16 2v4M8 2v4M3 10h18"/>
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
      </svg>
    ),
    seeds: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V12"/>
        <path d="M5 12c0-5 3-8 7-10 4 2 7 5 7 10H5z"/>
      </svg>
    ),
    soil: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18h18"/>
        <path d="M3 14h18"/>
        <path d="M7 14V6a4 4 0 0 1 8 0v8"/>
        <path d="M5 18v2M9 18v2M13 18v2M17 18v2M19 18v2"/>
      </svg>
    ),
    start: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V12"/>
        <path d="M17 7c0 3-2 5-5 5S7 10 7 7c0-3 2-6 5-7 3 1 5 4 5 7z"/>
        <path d="M3 22h18"/>
      </svg>
    ),
  }
  return icons[id] || icons.start
}

function BeginnerGuide({ profile }) {
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [question, setQuestion] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatResult, setChatResult] = useState('')
  const [search, setSearch] = useState('')

  const filteredTopics = guideTopics.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.desc.toLowerCase().includes(search.toLowerCase())
  )

  const loadTopic = async (topic) => {
    setSelectedTopic(topic)
    setContent('')
    setLoading(true)
    try {
      const reply = await askGroq([{
        role: 'user',
        content: `I am a beginner farmer. Give me a complete, simple, step-by-step guide on: "${topic.title}".
${profile ? `My farm details: ${profile.district}, ${profile.state}, ${profile.soil} soil, ${profile.water} water, ${profile.land} land.` : ''}
Make it very easy to understand for someone with zero farming experience.
Use numbered steps, simple language, and real examples from India.
Include:
- What it is and why it matters
- Step by step instructions
- Common mistakes beginners make
- Tips to save money
- What to do if something goes wrong
- Homemade/natural alternatives where possible`
      }], profile, null)
      setContent(reply)
    } catch (err) {
      setContent('Error loading guide. Please try again.')
    }
    setLoading(false)
  }

  const askQuestion = async () => {
    if (!question.trim()) return
    setChatLoading(true)
    setChatResult('')
    try {
      const reply = await askGroq([{
        role: 'user',
        content: `I am a beginner farmer with a question: ${question}
${profile ? `My farm: ${profile.district}, ${profile.state}, ${profile.soil} soil, ${profile.land} land.` : ''}
Please answer in very simple language with step by step instructions if needed.`
      }], profile, null)
      setChatResult(reply)
    } catch (err) {
      setChatResult('Error getting answer. Please try again.')
    }
    setChatLoading(false)
  }

  return (
    <div className="section-inner">
      <h2 className="section-title">Beginner's Farm Guide</h2>
      <p className="section-subtitle">Complete step-by-step guides for new farmers — simple language, real Indian examples</p>

      {!selectedTopic ? (
        <>
          <input
            placeholder="Search guides e.g. fertilizer, water, seeds..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px',
              borderRadius: 'var(--r-md)', border: '1.5px solid var(--green-border)',
              fontSize: '14px', fontFamily: 'Plus Jakarta Sans, sans-serif',
              background: 'var(--green-bg)', color: 'var(--text-primary)',
              outline: 'none', marginBottom: '1.2rem', transition: 'all 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--green-border)'}
          />

          {search && (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              {filteredTopics.length} guide{filteredTopics.length !== 1 ? 's' : ''} found
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px', marginBottom: '2rem' }}>
            {filteredTopics.map(topic => (
              <div
                key={topic.id}
                onClick={() => loadTopic(topic)}
                style={{
                  background: 'white',
                  border: '1.5px solid var(--green-border)',
                  borderRadius: 'var(--r-lg)',
                  padding: '1.4rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--primary)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(184,80,66,0.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--green-border)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ color: 'var(--primary)', width: '44px', height: '44px', background: 'var(--green-soft)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TopicIcon id={topic.id} />
                </div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {topic.title}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', flex: 1 }}>
                  {topic.desc}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Read guide
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--green-bg)', border: '1.5px solid var(--green-border)', borderRadius: 'var(--r-lg)', padding: '1.4rem' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Ask Any Beginner Question
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Not sure about something? Ask anything farming related
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && askQuestion()}
                placeholder="e.g. How much water does tomato need? When should I add fertilizer?"
                style={{
                  flex: 1, minWidth: '200px', padding: '11px 14px',
                  borderRadius: 'var(--r-sm)', border: '1.5px solid var(--green-border)',
                  fontSize: '14px', fontFamily: 'Plus Jakarta Sans, sans-serif',
                  background: 'white', color: 'var(--text-primary)', outline: 'none'
                }}
              />
              <button className="btn-primary" onClick={askQuestion} disabled={chatLoading}>
                {chatLoading ? 'Getting answer...' : 'Ask'}
              </button>
            </div>
            {chatLoading && <div className="loading-box" style={{ marginTop: '1rem' }}>Getting your answer...</div>}
            {chatResult && !chatLoading && (
              <div style={{ marginTop: '1rem', whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.8', color: 'var(--text-primary)' }}>
                {chatResult}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <button className="btn-secondary" style={{ marginBottom: '1.2rem' }} onClick={() => { setSelectedTopic(null); setContent('') }}>
            ← Back to guides
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1.2rem', padding: '1rem', background: 'var(--green-bg)', borderRadius: 'var(--r-md)', border: '1px solid var(--green-border)' }}>
            <div style={{ color: 'var(--primary)', width: '48px', height: '48px', background: 'white', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--green-border)' }}>
              <TopicIcon id={selectedTopic.id} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>{selectedTopic.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{selectedTopic.desc}</p>
            </div>
          </div>
          {loading ? (
            <div className="loading-box">Loading your guide...</div>
          ) : (
            <div className="result-box">
              <div className="result-title">{selectedTopic.title}</div>
              {content}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default BeginnerGuide