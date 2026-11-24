import { useState } from 'react'
import { cropData, allCrops } from '../data/cropData'
import { askGroq } from '../utils/groqAPI'
import { findCropReferences } from '../data/agronomyReferences'

function CropsSection({ profile, weatherData }) {
  const [activeCategory, setActiveCategory] = useState('Vegetables')
  const [search, setSearch] = useState('')
  const [selectedCrop, setSelectedCrop] = useState(null)
  const [advice, setAdvice] = useState('')
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('browse')

  const filteredCrops = search
    ? allCrops.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : cropData[activeCategory] || []
  const selectedReferences = selectedCrop ? findCropReferences(selectedCrop.name) : []

  const getCropAdvice = async (crop) => {
    setSelectedCrop(crop)
    setView('advice')
    setLoading(true)
    setAdvice('')
    try {
      const reply = await askGroq([{
        role: 'user',
        content: `Give general information about ${crop.name} for a beginner farmer. Use cited crop references supplied in context where available, and clearly distinguish source facts and scope from general suggestions. Do not give an authoritative farm-specific recommendation, exact input schedule or dosage, yield, cost, profit, current price, or market forecast without a cited and applicable source. If local suitability or soil information is unavailable, say what should be checked with a local KVK or agricultural university. Keep it concise and do not fill gaps with guesses.`
      }], profile, weatherData)
      setAdvice(reply)
    } catch (err) {
      setAdvice(`Could not fetch crop advice: ${err.message}`)
    }
    setLoading(false)
  }

  const getBestCrops = async () => {
    setView('best')
    setLoading(true)
    setAdvice('')
    try {
      const reply = await askGroq([{
        role: 'user',
        content: `Use only the farm details supplied in context. List possible crop options to discuss with a local KVK or agricultural university. Do not call any option best or suitable without applicable cited evidence. Do not estimate yield, investment, profit, risk percentages, or current market demand. State what additional farm details and crop-specific local references are needed before a recommendation can be made.`
      }], profile, weatherData)
      setAdvice(reply)
    } catch (err) {
      setAdvice(`Could not load crop options: ${err.message}`)
    }
    setLoading(false)
  }

  return (
    <div className="section-inner">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 className="section-title">Crop Advisor</h2>
          <p className="section-subtitle" style={{ margin: 0 }}>Browse crop names. Farm suitability and returns depend on local conditions and verified guidance.</p>
        </div>
        <button className="btn-gold" onClick={getBestCrops}>✨ Best for My Farm</button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button className={`btn-secondary ${view === 'browse' ? 'active' : ''}`} onClick={() => setView('browse')} style={{ fontSize: '13px', padding: '8px 16px' }}>Browse Crops</button>
        {selectedCrop && (
          <button className={`btn-secondary ${view === 'advice' ? 'active' : ''}`} onClick={() => setView('advice')} style={{ fontSize: '13px', padding: '8px 16px' }}>{selectedCrop.name} Guide</button>
        )}
        {view === 'best' && (
          <button className="btn-secondary active" style={{ fontSize: '13px', padding: '8px 16px' }}>Best for My Farm</button>
        )}
      </div>

      {view === 'browse' && (
        <>
          <input
            className="crop-search"
            placeholder="🔍 Search any crop — tomato, wheat, jasmine..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {!search && (
            <div className="category-tabs">
              {Object.keys(cropData).map(cat => (
                <button key={cat} className={`cat-btn ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
                  {cat}
                </button>
              ))}
            </div>
          )}
          <div className="crops-grid">
            {filteredCrops.map((crop, index) => (
              <div key={`${crop.name}-${crop.season}-${index}`} className="crop-card" onClick={() => getCropAdvice(crop)}>
                <div className="crop-name">{crop.name}</div>
                <div className="crop-season">Open crop information and advice</div>
              </div>
            ))}
          </div>
        </>
      )}

      {(view === 'advice' || view === 'best') && (
        <>
          {loading ? (
            <div className="loading-box">🌾 Generating detailed farming advice for your profile...</div>
          ) : (
            <div className="result-box">
              <div className="result-title">{view === 'best' ? '✨ Best Crops for Your Farm' : `Complete Guide: ${selectedCrop?.name}`}</div>
              {advice}
              {view === 'advice' && selectedCrop && <div className="reference-panel"><h4>Crop references in URVARA</h4>{selectedReferences.length ? selectedReferences.map(reference => <div className="reference-item" key={reference.id}><strong>{reference.cropName}: {reference.subject}</strong><ul>{reference.facts.map(fact => <li key={fact}>{fact}</li>)}</ul><small>{reference.scope}</small><a href={reference.sourceUrl} target="_blank" rel="noreferrer">{reference.sourceName}</a></div>) : <p>URVARA has no cited crop-specific reference for this crop in its current library. Treat general information as unverified and check local university or KVK guidance.</p>}</div>}
            </div>
          )}
          <button className="btn-secondary" style={{ marginTop: '1rem' }} onClick={() => setView('browse')}>← Back to crops</button>
        </>
      )}
    </div>
  )
}

export default CropsSection

