import { useState } from 'react'
import { askGroq } from '../utils/groqAPI'
import { allCrops } from '../data/cropData'

const benefitTypes = [
  { id: 'pest', label: 'Pest Repellent', icon: '🐛', desc: 'Plants that naturally repel pests' },
  { id: 'fertility', label: 'Soil Fertility', icon: '🌿', desc: 'Plants that improve soil nutrients' },
  { id: 'profit', label: 'Extra Income', icon: '💰', desc: 'Companion crops that also give profit' },
  { id: 'water', label: 'Water Saving', icon: '💧', desc: 'Combinations that reduce water needs' },
]

function CompanionPlanting({ profile }) {
  const [existingCrop, setExistingCrop] = useState('')
  const [secondCrop, setSecondCrop] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkResult, setCheckResult] = useState('')
  const [checkLoading, setCheckLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('find')
  const [rotationCrop, setRotationCrop] = useState('')
  const [rotationResult, setRotationResult] = useState('')
  const [rotationLoading, setRotationLoading] = useState(false)

  const getCompanionGuide = async () => {
    if (!existingCrop) { alert('Please enter your crop!'); return }
    setLoading(true)
    setResult('')
    try {
      const reply = await askGroq([{
        role: 'user',
        content: `Give me a complete companion planting guide for ${existingCrop}.
${profile ? `My farm: ${profile.district}, ${profile.state}, ${profile.soil} soil, ${profile.water} water, ${profile.land} land, ${profile.budget} budget` : ''}

Provide:
1. TOP 5 best companion plants to grow next to ${existingCrop}
   For each companion plant:
   - How it benefits ${existingCrop} specifically
   - Does it repel specific pests? Which ones?
   - Does it increase soil nitrogen or other nutrients?
   - Is it also profitable to sell? Expected price?
   - Spacing: how far from ${existingCrop} to plant
   - When to plant relative to ${existingCrop}
   - Water compatibility
   
2. TOP 3 plants to NEVER grow next to ${existingCrop}
   - Why they are harmful
   - What problems they cause
   
3. Best traditional Indian companion planting combinations with ${existingCrop}

4. Expected benefits of companion planting:
   - Yield increase %
   - Pest reduction %
   - Cost savings per acre
   - Extra income from companion crops

5. Step by step layout plan for ${profile?.land || '1 acre'} of land
   - How to arrange the crops
   - Row spacing
   - When to sow each

6. Homemade pest repellent sprays using companion plant leaves`
      }], profile, null)
      setResult(reply)
    } catch (err) {
      setResult('Error fetching guide. Please try again.')
    }
    setLoading(false)
  }

  const checkCompatibility = async () => {
    if (!existingCrop || !secondCrop) { alert('Please enter both crops!'); return }
    setCheckLoading(true)
    setCheckResult('')
    try {
      const reply = await askGroq([{
        role: 'user',
        content: `Check if ${existingCrop} and ${secondCrop} are good companion plants.
${profile ? `My farm: ${profile.district}, ${profile.state}, ${profile.soil} soil` : ''}

Tell me:
1. Compatibility score (1-10) and reason
2. Benefits of growing them together
3. Problems if any
4. How to plant them together if compatible (spacing, timing)
5. Which grows better in my soil type
6. Combined profit potential per acre
7. Better alternative if they are NOT compatible`
      }], profile, null)
      setCheckResult(reply)
    } catch (err) {
      setCheckResult('Error checking compatibility. Please try again.')
    }
    setCheckLoading(false)
  }

  const getCropRotation = async () => {
    if (!rotationCrop) { alert('Please enter your current crop!'); return }
    setRotationLoading(true)
    setRotationResult('')
    try {
      const reply = await askGroq([{
        role: 'user',
        content: `Give me a 2-year crop rotation plan after growing ${rotationCrop}.
${profile ? `My farm: ${profile.district}, ${profile.state}, ${profile.soil} soil, ${profile.water} water, ${profile.land} land` : ''}

Include:
1. What to grow IMMEDIATELY after ${rotationCrop} harvest and why
2. Complete 2-year rotation calendar season by season
3. How each rotation crop improves soil health
4. Which rotation gives maximum profit
5. How rotation reduces pest and disease problems
6. Soil preparation between each crop
7. Expected profit for the full 2-year rotation plan
8. Traditional Indian crop rotation wisdom for my region`
      }], profile, null)
      setRotationResult(reply)
    } catch (err) {
      setRotationResult('Error fetching rotation plan. Please try again.')
    }
    setRotationLoading(false)
  }

  return (
    <div className="section-inner">
      <h2 className="section-title">Companion Planting</h2>
      <p className="section-subtitle">
        Grow crops together that help each other — repel pests, improve soil, and increase profit naturally
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '1.5rem' }}>
        {benefitTypes.map(b => (
          <div key={b.id} style={{ background: 'var(--green-bg)', border: '1.5px solid var(--green-border)', borderRadius: 'var(--r-md)', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '6px' }}>{b.icon}</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{b.label}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'find', label: 'Find Companions' },
          { id: 'check', label: 'Check Compatibility' },
          { id: 'rotation', label: 'Crop Rotation' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '9px 18px',
              borderRadius: 'var(--r-md)',
              border: '1.5px solid var(--green-border)',
              background: activeTab === tab.id ? 'var(--primary)' : 'var(--green-soft)',
              color: activeTab === tab.id ? 'white' : 'var(--primary)',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'find' && (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
            <input
              list="crop-list-comp"
              placeholder="Enter your main crop e.g. Tomato, Cotton, Rice..."
              value={existingCrop}
              onChange={e => setExistingCrop(e.target.value)}
              style={{ flex: 1, minWidth: '200px', padding: '11px 14px', borderRadius: 'var(--r-sm)', border: '1.5px solid var(--green-border)', fontSize: '14px', fontFamily: 'Plus Jakarta Sans, sans-serif', background: 'var(--green-bg)', color: 'var(--text-primary)', outline: 'none' }}
            />
            <datalist id="crop-list-comp">
              {allCrops.map((c, index) => <option key={`${c.name}-${index}`} value={c.name} />)}
            </datalist>
            <button className="btn-primary" onClick={getCompanionGuide} disabled={loading}>
              {loading ? 'Finding companions...' : 'Find Best Companions'}
            </button>
          </div>
          {loading && <div className="loading-box">Finding best companion plants for {existingCrop}...</div>}
          {result && !loading && (
            <div className="result-box">
              <div className="result-title">Companion Planting Guide — {existingCrop}</div>
              {result}
            </div>
          )}
        </>
      )}

      {activeTab === 'check' && (
        <>
          <div style={{ background: 'var(--green-bg)', border: '1.5px solid var(--green-border)', borderRadius: 'var(--r-lg)', padding: '1.2rem', marginBottom: '1.2rem' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Check if two specific crops are compatible to grow together
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                list="crop-list-a"
                placeholder="First crop e.g. Tomato"
                value={existingCrop}
                onChange={e => setExistingCrop(e.target.value)}
                style={{ flex: 1, minWidth: '150px', padding: '11px 14px', borderRadius: 'var(--r-sm)', border: '1.5px solid var(--green-border)', fontSize: '14px', fontFamily: 'Plus Jakarta Sans, sans-serif', background: 'white', color: 'var(--text-primary)', outline: 'none' }}
              />
              <datalist id="crop-list-a">
                {allCrops.map((c, index) => <option key={`${c.name}-${index}`} value={c.name} />)}
              </datalist>
              <span style={{ fontSize: '18px', color: 'var(--text-muted)', fontWeight: '700' }}>+</span>
              <input
                list="crop-list-b"
                placeholder="Second crop e.g. Basil"
                value={secondCrop}
                onChange={e => setSecondCrop(e.target.value)}
                style={{ flex: 1, minWidth: '150px', padding: '11px 14px', borderRadius: 'var(--r-sm)', border: '1.5px solid var(--green-border)', fontSize: '14px', fontFamily: 'Plus Jakarta Sans, sans-serif', background: 'white', color: 'var(--text-primary)', outline: 'none' }}
              />
              <datalist id="crop-list-b">
                {allCrops.map((c, index) => <option key={`${c.name}-${index}`} value={c.name} />)}
              </datalist>
              <button className="btn-primary" onClick={checkCompatibility} disabled={checkLoading}>
                {checkLoading ? 'Checking...' : 'Check'}
              </button>
            </div>
          </div>
          {checkLoading && <div className="loading-box">Checking compatibility between {existingCrop} and {secondCrop}...</div>}
          {checkResult && !checkLoading && (
            <div className="result-box">
              <div className="result-title">Compatibility Check — {existingCrop} + {secondCrop}</div>
              {checkResult}
            </div>
          )}
        </>
      )}

      {activeTab === 'rotation' && (
        <>
          <div style={{ background: 'var(--green-bg)', border: '1.5px solid var(--green-border)', borderRadius: 'var(--r-lg)', padding: '1.2rem', marginBottom: '1.2rem' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Get a 2-year crop rotation plan to maximize soil health and profit
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                list="crop-list-rot"
                placeholder="Your current or last crop..."
                value={rotationCrop}
                onChange={e => setRotationCrop(e.target.value)}
                style={{ flex: 1, minWidth: '200px', padding: '11px 14px', borderRadius: 'var(--r-sm)', border: '1.5px solid var(--green-border)', fontSize: '14px', fontFamily: 'Plus Jakarta Sans, sans-serif', background: 'white', color: 'var(--text-primary)', outline: 'none' }}
              />
              <datalist id="crop-list-rot">
                {allCrops.map((c, index) => <option key={`${c.name}-${index}`} value={c.name} />)}
              </datalist>
              <button className="btn-primary" onClick={getCropRotation} disabled={rotationLoading}>
                {rotationLoading ? 'Planning...' : 'Get Rotation Plan'}
              </button>
            </div>
          </div>
          {rotationLoading && <div className="loading-box">Creating your 2-year crop rotation plan...</div>}
          {rotationResult && !rotationLoading && (
            <div className="result-box">
              <div className="result-title">2-Year Crop Rotation Plan — After {rotationCrop}</div>
              {rotationResult}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default CompanionPlanting
