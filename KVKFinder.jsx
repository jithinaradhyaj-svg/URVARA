import { useState } from 'react'
import { askGroq } from '../utils/groqAPI'

function KVKFinder({ profile }) {
  const [state, setState] = useState(profile?.state || '')
  const [district, setDistrict] = useState(profile?.district || '')
  const [results, setResults] = useState('')
  const [loading, setLoading] = useState(false)
  const [question, setQuestion] = useState('')
  const [questionResult, setQuestionResult] = useState('')
  const [questionLoading, setQuestionLoading] = useState(false)

  const findKVK = async () => {
    if (!state) { alert('Please enter your state!'); return }
    setLoading(true)
    setResults('')
    try {
      const reply = await askGroq([{
        role: 'user',
        content: `Find Krishi Vigyan Kendras (KVK) and agricultural offices for farmers in ${district || ''} ${state}, India.

Provide:
1. Nearest 3-5 KVK centers with:
   - Name and address
   - Phone number (if known)
   - Services offered
   - Best time to visit

2. State Agriculture Department contact:
   - Main office address
   - Helpline number

3. Other useful agricultural contacts:
   - APMC mandi office
   - District Agriculture Officer
   - Soil testing laboratory
   - Seed certification office

4. Online resources:
   - State agriculture portal URL
   - Kisan Call Center: 1800-180-1551 (free)
   - PM-KISAN helpline: 011-23381092

5. What services KVK provides for free:
   - Soil testing
   - Seed distribution
   - Training programs
   - Expert consultation`
      }], profile, null)
      setResults(reply)
    } catch (err) {
      setResults('Error finding KVK centers. Please try again.')
    }
    setLoading(false)
  }

  const askExpert = async () => {
    if (!question.trim()) return
    setQuestionLoading(true)
    setQuestionResult('')
    try {
      const reply = await askGroq([{
        role: 'user',
        content: `A farmer from ${profile?.district || district || 'India'} wants to know: ${question}
Answer as if you are an expert from Krishi Vigyan Kendra.
Give practical, actionable advice specific to their region.`
      }], profile, null)
      setQuestionResult(reply)
    } catch (err) {
      setQuestionResult('Error getting answer. Please try again.')
    }
    setQuestionLoading(false)
  }

  return (
    <div className="section-inner">
      <h2 className="section-title">KVK & Expert Finder</h2>
      <p className="section-subtitle">Find nearest Krishi Vigyan Kendra and get expert agricultural advice</p>

      <div style={{ background: 'var(--green-bg)', border: '1.5px solid var(--green-border)', borderRadius: 'var(--r-lg)', padding: '1.4rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem', padding: '12px 16px', background: 'white', borderRadius: 'var(--r-md)', border: '1.5px solid var(--green-border)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.92 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Kisan Call Center — Free Helpline</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary)', fontFamily: 'Playfair Display, serif' }}>1800-180-1551</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Available in all languages • 6 AM to 10 PM • Toll Free</div>
          </div>
        </div>

        <div className="form-grid">
          <div className="field">
            <label>State</label>
            <input placeholder="e.g. Karnataka" value={state} onChange={e => setState(e.target.value)} />
          </div>
          <div className="field">
            <label>District (optional)</label>
            <input placeholder="e.g. Hassan" value={district} onChange={e => setDistrict(e.target.value)} />
          </div>
        </div>
        <button className="btn-primary" onClick={findKVK} disabled={loading}>
          {loading ? 'Finding KVK centers...' : 'Find Nearest KVK & Agriculture Offices'}
        </button>
      </div>

      {loading && <div className="loading-box">Finding KVK centers in {district} {state}...</div>}

      {results && !loading && (
        <div className="result-box" style={{ marginBottom: '1.5rem' }}>
          <div className="result-title">KVK & Agricultural Offices — {district} {state}</div>
          {results}
        </div>
      )}

      <div style={{ background: 'var(--green-bg)', border: '1.5px solid var(--green-border)', borderRadius: 'var(--r-lg)', padding: '1.4rem' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Ask an Agricultural Expert</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>Get expert advice as if speaking to a KVK scientist</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && askExpert()}
            placeholder="e.g. My tomato plants are wilting despite watering. What should I do?"
            style={{
              flex: 1, minWidth: '200px', padding: '11px 14px',
              borderRadius: 'var(--r-sm)', border: '1.5px solid var(--green-border)',
              fontSize: '14px', fontFamily: 'Plus Jakarta Sans, sans-serif',
              background: 'white', color: 'var(--text-primary)', outline: 'none'
            }}
          />
          <button className="btn-primary" onClick={askExpert} disabled={questionLoading}>
            {questionLoading ? 'Getting answer...' : 'Ask Expert'}
          </button>
        </div>
        {questionLoading && <div className="loading-box" style={{ marginTop: '1rem' }}>Getting expert advice...</div>}
        {questionResult && !questionLoading && (
          <div style={{ marginTop: '1rem', whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.8', color: 'var(--text-primary)' }}>
            {questionResult}
          </div>
        )}
      </div>
    </div>
  )
}

export default KVKFinder