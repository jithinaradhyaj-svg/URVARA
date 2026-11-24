import { useState } from 'react'
import { askGroq } from '../utils/groqAPI'
import { allCrops } from '../data/cropData'

function SeedGuide({ profile }) {
  const [crop, setCrop] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('seeds')
  const [soilResult, setSoilResult] = useState('')
  const [soilLoading, setSoilLoading] = useState(false)
  const [priceResult, setPriceResult] = useState('')
  const [priceLoading, setPriceLoading] = useState(false)
  const [priceCrop, setPriceCrop] = useState('')

  const getSeedGuide = async () => {
    if (!crop) { alert('Please enter a crop name!'); return }
    setLoading(true)
    setResult('')
    try {
      const reply = await askGroq([{
        role: 'user',
        content: `Give me a complete seed and breed guide for ${crop}.
${profile ? `My farm: ${profile.district}, ${profile.state}, ${profile.soil} soil, ${profile.water} water` : ''}

Include:
1. Top 5-8 best seed varieties/breeds for my region
2. For each variety: yield potential, disease resistance, water needs, time to harvest
3. Which variety suits my specific soil type best and why
4. Where to buy genuine certified seeds in my district/state
5. How to check seed quality before buying
6. Approximate seed cost per acre for each variety
7. Government-subsidized seeds available
8. Organic/traditional varieties available
9. How to save seeds for next season
10. Common fake seed problems and how to avoid them`
      }], profile, null)
      setResult(reply)
    } catch (err) {
      setResult(`Could not load seed guidance: ${err.message}`)
    }
    setLoading(false)
  }

  const getSoilBasedRecommendation = async () => {
    if (!profile?.soil) {
      alert('Please set up your farm profile with soil type first!')
      return
    }
    setSoilLoading(true)
    setSoilResult('')
    try {
      const reply = await askGroq([{
        role: 'user',
        content: `Based on my farm profile, recommend the best crops and seeds for me.
Farm details:
- Location: ${profile.district}, ${profile.state}
- Soil type: ${profile.soil}
- Water source: ${profile.water}
- Land size: ${profile.land}
- Budget: ${profile.budget}
- Experience: ${profile.experience}
- Current season: ongoing

Please provide:
1. Top 5 most suitable crops for my EXACT soil type with best seed variety for each
2. Which crops will IMPROVE my soil fertility over time
3. Crops to AVOID on my soil type and why
4. Soil improvement suggestions before next season
5. Natural ways to improve soil fertility using locally available materials
6. Long-term crop rotation plan for maximum soil health and profit
7. Expected profit range per acre for each recommended crop`
      }], profile, null)
      setSoilResult(reply)
    } catch (err) {
      setSoilResult(`Could not load recommendations: ${err.message}`)
    }
    setSoilLoading(false)
  }

  const getPesticidePrices = async () => {
    if (!priceCrop) { alert('Please enter a crop name!'); return }
    setPriceLoading(true)
    setPriceResult('')
    try {
      const reply = await askGroq([{
        role: 'user',
        content: `Give me input-cost guidance for growing ${priceCrop}. Do not invent current prices, brands, or local availability. If you do not have verified current price data, say it is unavailable and advise checking local suppliers.
${profile ? `Location: ${profile.district}, ${profile.state}` : ''}

Include:
1. Essential fertilizers needed (omit current prices unless verified data is available)
   - NPK fertilizers with exact ratio needed
   - Micronutrients if needed
   - Organic alternatives (omit current prices unless verified data is available)

2. Common pesticides/fungicides that may be relevant (omit current prices unless verified data is available)
   - Chemical name and brand names available in India
   - Price per litre/kg only when verified current data is available
   - Dosage per acre
   - When to apply (crop stage)
   - Safety precautions

3. Organic/homemade alternatives for each chemical input
   - How to make at home
   - Cost comparison vs chemical

4. Manure options (omit current prices unless verified data is available)
   - FYM (Farm Yard Manure)
   - Vermicompost
   - Neem cake
   - Bio-fertilizers
   - Estimated cost per acre

5. Total input cost estimate per acre
6. Where to buy in ${profile?.district || 'your district'} — shop types and government outlets
7. Subsidy available on any inputs`
      }], profile, null)
      setPriceResult(reply)
    } catch (err) {
      setPriceResult(`Could not load input guidance: ${err.message}`)
    }
    setPriceLoading(false)
  }

  return (
    <div className="section-inner">
      <h2 className="section-title">Seeds, Breeds & Input Guidance</h2>
      <p className="section-subtitle">
        Find seed varieties, soil-based crop recommendations, and input-cost guidance
      </p>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'seeds', label: '🌾 Seed & Variety Guide' },
          { id: 'soil', label: '🪨 Soil-Based Crops' },
          { id: 'prices', label: '💊 Input Cost Guidance' },
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

      {activeTab === 'seeds' && (
        <>
          <div style={{ background: 'var(--green-bg)', border: '1.5px solid var(--green-border)', borderRadius: 'var(--r-lg)', padding: '1.2rem', marginBottom: '1.2rem' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.6' }}>
              Get the best seed varieties for your crop and region. Find out which breed suits your soil, water source, and gives maximum yield.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                list="crop-list-seed"
                placeholder="Enter crop name e.g. Tomato, Rice, Cotton..."
                value={crop}
                onChange={e => setCrop(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && getSeedGuide()}
                style={{
                  flex: 1, minWidth: '200px', padding: '11px 14px',
                  borderRadius: 'var(--r-sm)', border: '1.5px solid var(--green-border)',
                  fontSize: '14px', fontFamily: 'Plus Jakarta Sans, sans-serif',
                  background: 'white', color: 'var(--text-primary)', outline: 'none'
                }}
              />
              <datalist id="crop-list-seed">
                {allCrops.map((c, index) => <option key={`${c.name}-${index}`} value={c.name} />)}
              </datalist>
              <button className="btn-primary" onClick={getSeedGuide} disabled={loading}>
                {loading ? 'Loading...' : 'Get Seed Guide'}
              </button>
            </div>
          </div>
          {loading && <div className="loading-box">Finding best seed varieties for your region...</div>}
          {result && !loading && (
            <div className="result-box">
              <div className="result-title">Seed & Variety Guide — {crop}</div>
              {result}
            </div>
          )}
        </>
      )}

      {activeTab === 'soil' && (
        <>
          <div style={{ background: 'var(--green-bg)', border: '1.5px solid var(--green-border)', borderRadius: 'var(--r-lg)', padding: '1.2rem', marginBottom: '1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ background: 'var(--green-soft)', border: '1.5px solid var(--green-border)', borderRadius: 'var(--r-md)', padding: '10px 16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Your Soil Type</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary)' }}>
                  {profile?.soil || 'Not set'}
                </div>
              </div>
              <div style={{ background: 'var(--green-soft)', border: '1.5px solid var(--green-border)', borderRadius: 'var(--r-md)', padding: '10px 16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Location</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary)' }}>
                  {profile ? `${profile.district}, ${profile.state}` : 'Not set'}
                </div>
              </div>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.6' }}>
              Get crop recommendations specifically optimized for your soil type, location, water source, and budget.
            </p>
            <button className="btn-gold" onClick={getSoilBasedRecommendation} disabled={soilLoading}>
              {soilLoading ? 'Analyzing...' : 'Get Soil-Based Crop Recommendations'}
            </button>
          </div>
          {soilLoading && <div className="loading-box">Analyzing best crops for your {profile?.soil}...</div>}
          {soilResult && !soilLoading && (
            <div className="result-box">
              <div className="result-title">Best Crops for {profile?.soil} — {profile?.district}</div>
              {soilResult}
            </div>
          )}
        </>
      )}

      {activeTab === 'prices' && (
        <>
          <div style={{ background: 'var(--green-bg)', border: '1.5px solid var(--green-border)', borderRadius: 'var(--r-lg)', padding: '1.2rem', marginBottom: '1.2rem' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.6' }}>
              AI guidance on relevant inputs. Current prices and local availability are not verified; confirm quotes with local suppliers.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                list="crop-list-price"
                placeholder="Enter crop name e.g. Tomato, Wheat..."
                value={priceCrop}
                onChange={e => setPriceCrop(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && getPesticidePrices()}
                style={{
                  flex: 1, minWidth: '200px', padding: '11px 14px',
                  borderRadius: 'var(--r-sm)', border: '1.5px solid var(--green-border)',
                  fontSize: '14px', fontFamily: 'Plus Jakarta Sans, sans-serif',
                  background: 'white', color: 'var(--text-primary)', outline: 'none'
                }}
              />
              <datalist id="crop-list-price">
                {allCrops.map((c, index) => <option key={`${c.name}-${index}`} value={c.name} />)}
              </datalist>
              <button className="btn-primary" onClick={getPesticidePrices} disabled={priceLoading}>
                {priceLoading ? 'Preparing...' : 'Get Guidance'}
              </button>
            </div>
          </div>
          {priceLoading && <div className="loading-box">Preparing input guidance for {priceCrop}...</div>}
          {priceResult && !priceLoading && (
            <div className="result-box">
              <div className="result-title">Input Guidance — {priceCrop}</div>
              {priceResult}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default SeedGuide
