import { useState } from 'react'
import { locationData, stateList } from '../data/locationData'
import { getCoordinates, getWeather } from '../utils/weatherAPI'

function ProfileSetup({ existingProfile, onSave, onWeatherFetched, storageInvalid = false }) {
  const [form, setForm] = useState(() => ({
    name: '', state: '', district: '', land: '', soil: '',
    water: '', budget: '', experience: 'Beginner', language: 'English',
    ...existingProfile,
  }))
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const districts = form.state ? locationData[form.state] || [] : []

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (name === 'state') setForm(prev => ({ ...prev, state: value, district: '' }))
  }

  const handleSave = async () => {
    if (!form.state || !form.district) {
      setMsg('⚠️ Please select your state and district.')
      return
    }
    setLoading(true)
    setMsg('Fetching live weather for your location...')
    try {
      const coords = await getCoordinates(form.district, form.state)
      const weather = await getWeather(coords.lat, coords.lon)
      onWeatherFetched(weather)
      setMsg('✅ Profile saved! Weather loaded successfully.')
    } catch {
      setMsg('⚠️ Profile saved. Could not fetch weather — will retry later.')
    }
    setLoading(false)
    if (onSave(form) === false) setMsg('Could not save your farm profile in this browser. Check storage availability and try again.')
  }

  return (
    <div className="section-inner">
      <h2 className="section-title">My Farm Profile</h2>
      <p className="section-subtitle">Set up your farm details for personalized AI advice tailored to your location and conditions</p>

      {storageInvalid && <div className="no-profile-box" role="alert"><div className="no-profile-title">Saved farm profile could not be read</div><div className="no-profile-sub">URVARA has left the stored value untouched. Back up or repair browser storage before saving a replacement profile.</div></div>}

      <div className="form-grid">
        <div className="field">
          <label htmlFor="farm-name">Farm name (optional)</label>
          <input id="farm-name" name="name" placeholder="e.g. Amma's Farm" value={form.name || ''} onChange={handleChange} />
        </div>
        <div className="field">
          <label>State</label>
          <select name="state" value={form.state} onChange={handleChange}>
            <option value="">Select your state</option>
            {stateList.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="field">
          <label>District</label>
          <select name="district" value={form.district} onChange={handleChange} disabled={!form.state}>
            <option value="">Select your district</option>
            {districts.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Land Size</label>
          <input name="land" placeholder="e.g. 2 acres, 5 bigha, 1 hectare" value={form.land} onChange={handleChange} />
        </div>
        <div className="field">
          <label>Soil Type</label>
          <select name="soil" value={form.soil} onChange={handleChange}>
            <option value="">Select soil type</option>
            <option>Red soil</option>
            <option>Black cotton soil</option>
            <option>Loamy soil</option>
            <option>Sandy soil</option>
            <option>Alluvial soil</option>
            <option>Laterite soil</option>
            <option>Clay soil</option>
            <option>Not sure</option>
          </select>
        </div>
        <div className="field">
          <label>Water Source</label>
          <select name="water" value={form.water} onChange={handleChange}>
            <option value="">Select water source</option>
            <option>Rainfed only</option>
            <option>Borewell</option>
            <option>Canal irrigation</option>
            <option>Drip irrigation</option>
            <option>Sprinkler irrigation</option>
            <option>River/Tank</option>
            <option>Multiple sources</option>
          </select>
        </div>
        <div className="field">
          <label>Budget per Acre</label>
          <select name="budget" value={form.budget} onChange={handleChange}>
            <option value="">Select budget range</option>
            <option>Low (under ₹10,000)</option>
            <option>Medium (₹10,000–25,000)</option>
            <option>High (₹25,000–50,000)</option>
            <option>Very High (above ₹50,000)</option>
          </select>
        </div>
        <div className="field">
          <label>Experience Level</label>
          <select name="experience" value={form.experience} onChange={handleChange}>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Experienced</option>
            <option>Expert</option>
          </select>
        </div>
        <div className="field">
          <label>Preferred Language</label>
          <select name="language" value={form.language} onChange={handleChange}>
            <option>English</option>
            <option>Hindi</option>
            <option>Kannada</option>
            <option>Tamil</option>
            <option>Telugu</option>
            <option>Marathi</option>
            <option>Gujarati</option>
            <option>Punjabi</option>
            <option>Bengali</option>
            <option>Odia</option>
          </select>
        </div>
      </div>

      {msg && (
        <div style={{
          padding: '10px 16px',
          borderRadius: 'var(--r-sm)',
          background: msg.includes('✅') ? 'var(--success-bg)' : 'var(--warning-bg)',
          color: msg.includes('✅') ? 'var(--success)' : 'var(--warning)',
          fontSize: '13px',
          fontWeight: '600',
          marginBottom: '12px',
          border: `1px solid ${msg.includes('✅') ? '#86efac' : '#fcd34d'}`
        }}>
          {msg}
        </div>
      )}

      <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSave} disabled={loading || storageInvalid}>
        {loading ? '⏳ Saving & fetching weather...' : '✅ Save Profile & Start Advising'}
      </button>
    </div>
  )
}

export default ProfileSetup
