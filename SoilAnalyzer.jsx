import { useState } from 'react'
import { askGroq } from '../utils/groqAPI'

function SoilAnalyzer({ profile }) {
  const [form, setForm] = useState({
    nitrogen: '', phosphorus: '', potassium: '',
    ph: '', ec: '', organicMatter: '',
    soilType: profile?.soil || '', crop: ''
  })
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('npk')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const analyze = async () => {
    setLoading(true)
    setResult('')
    try {
      const reply = await askGroq([{
        role: 'user',
        content: `Analyze my soil test results and give fertilizer prescription:

Soil Test Results:
- Nitrogen (N): ${form.nitrogen || 'Not tested'} kg/ha
- Phosphorus (P): ${form.phosphorus || 'Not tested'} kg/ha
- Potassium (K): ${form.potassium || 'Not tested'} kg/ha
- pH: ${form.ph || 'Not tested'}
- EC: ${form.ec || 'Not tested'} dS/m
- Organic Matter: ${form.organicMatter || 'Not tested'}%
- Soil Type: ${form.soilType || profile?.soil || 'Not specified'}
- Intended Crop: ${form.crop || 'General recommendation'}
${profile ? `Location: ${profile.district}, ${profile.state}` : ''}

Give me:
1. Soil health assessment — what is deficient, excess, or balanced
2. Exact fertilizer prescription for ${form.crop || 'general farming'}:
   - Chemical fertilizers: exact kg per acre
   - Organic alternatives: exact quantity per acre
   - Micronutrients if needed
3. pH correction if needed — lime or sulfur quantity
4. Application schedule — when to apply each fertilizer
5. Crops best suited for this soil in current condition
6. How to improve soil health over next 2 seasons
7. Estimated fertilizer cost per acre
8. Warning signs to watch for`
      }], profile, null)
      setResult(reply)
    } catch (err) {
      setResult('Error analyzing soil. Please try again.')
    }
    setLoading(false)
  }

  const getPhStatus = (ph) => {
    const p = parseFloat(ph)
    if (!p) return null
    if (p < 5.5) return { label: 'Very Acidic', color: 'var(--danger)' }
    if (p < 6.5) return { label: 'Slightly Acidic', color: 'var(--warning)' }
    if (p <= 7.5) return { label: 'Optimal', color: 'var(--success)' }
    if (p <= 8.5) return { label: 'Alkaline', color: 'var(--warning)' }
    return { label: 'Very Alkaline', color: 'var(--danger)' }
  }

  const phStatus = getPhStatus(form.ph)

  return (
    <div className="section-inner">
      <h2 className="section-title">Soil Test Analyzer</h2>
      <p className="section-subtitle">Enter your soil test values to get precise fertilizer recommendations</p>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'npk', label: 'NPK & pH Test' },
          { id: 'notest', label: 'No Soil Test' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '9px 18px', borderRadius: 'var(--r-md)',
            border: '1.5px solid var(--green-border)',
            background: activeTab === tab.id ? 'var(--primary)' : 'var(--green-soft)',
            color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
            fontSize: '13px', fontWeight: '700', cursor: 'pointer',
            fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'all 0.2s'
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'npk' && (
        <>
          <div style={{ background: 'var(--green-bg)', border: '1.5px solid var(--green-border)', borderRadius: 'var(--r-lg)', padding: '1.4rem', marginBottom: '1.2rem' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Macronutrients
            </h3>
            <div className="form-grid">
              <div className="field">
                <label>Nitrogen — N (kg/ha)</label>
                <input name="nitrogen" type="number" placeholder="e.g. 180" value={form.nitrogen} onChange={handleChange} />
              </div>
              <div className="field">
                <label>Phosphorus — P (kg/ha)</label>
                <input name="phosphorus" type="number" placeholder="e.g. 12" value={form.phosphorus} onChange={handleChange} />
              </div>
              <div className="field">
                <label>Potassium — K (kg/ha)</label>
                <input name="potassium" type="number" placeholder="e.g. 120" value={form.potassium} onChange={handleChange} />
              </div>
              <div className="field">
                <label>
                  Soil pH
                  {phStatus && (
                    <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: '700', color: phStatus.color }}>
                      {phStatus.label}
                    </span>
                  )}
                </label>
                <input name="ph" type="number" step="0.1" placeholder="e.g. 6.5" value={form.ph} onChange={handleChange} />
              </div>
              <div className="field">
                <label>EC (dS/m)</label>
                <input name="ec" type="number" step="0.1" placeholder="e.g. 0.8" value={form.ec} onChange={handleChange} />
              </div>
              <div className="field">
                <label>Organic Matter (%)</label>
                <input name="organicMatter" type="number" step="0.1" placeholder="e.g. 0.5" value={form.organicMatter} onChange={handleChange} />
              </div>
            </div>
          </div>

          {form.ph && (
            <div style={{ marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Acidic (4.0)</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: phStatus?.color }}>{form.ph} — {phStatus?.label}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Alkaline (9.0)</span>
              </div>
              <div style={{ height: '8px', background: 'linear-gradient(to right, #e74c3c, #f39c12, #2ecc71, #f39c12, #e74c3c)', borderRadius: '4px', position: 'relative' }}>
                <div style={{
                  position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)',
                  left: `${((parseFloat(form.ph) - 4) / 5) * 100}%`,
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: 'white', border: '3px solid var(--primary)', boxShadow: 'var(--shadow-sm)'
                }} />
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'notest' && (
        <div style={{ background: 'var(--green-bg)', border: '1.5px solid var(--green-border)', borderRadius: 'var(--r-lg)', padding: '1.4rem', marginBottom: '1.2rem' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.6' }}>
            No soil test? No problem. We'll give you general fertilizer recommendations based on your soil type and crop.
          </p>
        </div>
      )}

      <div className="form-grid" style={{ marginBottom: '1.2rem' }}>
        <div className="field">
          <label>Soil Type</label>
          <select name="soilType" value={form.soilType} onChange={handleChange}>
            <option value="">Select soil type</option>
            <option>Red soil</option>
            <option>Black cotton soil</option>
            <option>Loamy soil</option>
            <option>Sandy soil</option>
            <option>Alluvial soil</option>
            <option>Laterite soil</option>
            <option>Clay soil</option>
          </select>
        </div>
        <div className="field">
          <label>Intended Crop</label>
          <input name="crop" list="crop-soil-list" placeholder="e.g. Tomato, Rice, Wheat" value={form.crop} onChange={handleChange} />
          <datalist id="crop-soil-list">
            {['Tomato','Rice','Wheat','Maize','Cotton','Onion','Potato','Sugarcane','Groundnut','Soybean'].map(c => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>

      <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={analyze} disabled={loading}>
        {loading ? 'Analyzing soil...' : 'Analyze Soil & Get Fertilizer Prescription'}
      </button>

      {loading && <div className="loading-box" style={{ marginTop: '1rem' }}>Analyzing soil test results...</div>}

      {result && !loading && (
        <div className="result-box" style={{ marginTop: '1.5rem' }}>
          <div className="result-title">Soil Analysis & Fertilizer Prescription</div>
          {result}
        </div>
      )}
    </div>
  )
}

export default SoilAnalyzer