import { useState } from 'react'
import { askGroq } from '../utils/groqAPI'
import { allCrops } from '../data/cropData'

const months = ['January','February','March','April','May','June','July','August','September','October','November','December']

const currentMonth = new Date().getMonth()

function CropCalendar({ profile, onOpenCycles }) {
  const [crop, setCrop] = useState('')
  const [calendar, setCalendar] = useState(null)
  const [loading, setLoading] = useState(false)
  const [generalCalendar, setGeneralCalendar] = useState(null)
  const [generalLoading, setGeneralLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('crop')

  const fetchCropCalendar = async () => {
    if (!crop) { alert('Please enter a crop name!'); return }
    setLoading(true)
    setCalendar(null)
    try {
      const reply = await askGroq([{
        role: 'user',
        content: `Create a month-by-month farming calendar for ${crop}.
${profile ? `Farm: ${profile.district}, ${profile.state}, ${profile.soil} soil, ${profile.water} water` : ''}

Return valid JSON with this shape: {"crop":"crop name","months":{}}. Include only advice that can be supported for the provided farm context; omit unsupported details.`
      }], profile, null)

      const jsonMatch = reply.match(/\{[\s\S]*\}/)
      if (jsonMatch) setCalendar(JSON.parse(jsonMatch[0]))
    } catch (err) {
      alert(`Could not generate calendar: ${err.message}`)
    }
    setLoading(false)
  }

  const fetchGeneralCalendar = async () => {
    setGeneralLoading(true)
    setGeneralCalendar(null)
    try {
      const reply = await askGroq([{
        role: 'user',
        content: `Create a general annual farm management calendar for a farmer in ${profile?.state || 'unknown location'}, India.
${profile ? `Soil: ${profile.soil}, Water: ${profile.water}` : ''}

Return valid JSON with this shape: {"months":{}}. The farm location is unknown unless provided. Include only source-supported, location-appropriate information; omit unsupported details and do not guess.`
      }], profile, null)

      const jsonMatch = reply.match(/\{[\s\S]*\}/)
      if (jsonMatch) setGeneralCalendar(JSON.parse(jsonMatch[0]))
    } catch (err) {
      alert(`Could not generate calendar: ${err.message}`)
    }
    setGeneralLoading(false)
  }

  const getActivityColor = (activity) => {
    if (!activity) return 'var(--green-border)'
    const a = activity.toLowerCase()
    if (a.includes('sow') || a.includes('plant')) return '#4A7C59'
    if (a.includes('harvest')) return 'var(--primary)'
    if (a.includes('prep') || a.includes('land')) return 'var(--gold)'
    if (a.includes('growth') || a.includes('flower') || a.includes('fruit')) return '#2D6A4F'
    if (a.includes('off') || a.includes('rest')) return 'var(--text-muted)'
    return 'var(--text-secondary)'
  }

  return (
    <div className="section-inner">
      <div className="workflow-page-heading"><div><h2 className="section-title">Crop Calendar</h2><p className="section-subtitle">AI-generated planning drafts are not verified cultivation instructions. Check important dates and treatments with local agricultural guidance.</p></div><button className="btn-primary" onClick={onOpenCycles}>Plan a crop cycle</button></div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'crop', label: 'Crop-Specific Calendar' },
          { id: 'general', label: 'Annual Farm Calendar' },
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

      {activeTab === 'crop' && (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <input
              list="crop-cal-list"
              placeholder="Enter crop name e.g. Tomato, Rice, Cotton..."
              value={crop}
              onChange={e => setCrop(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchCropCalendar()}
              style={{
                flex: 1, minWidth: '200px', padding: '11px 14px',
                borderRadius: 'var(--r-sm)', border: '1.5px solid var(--green-border)',
                fontSize: '14px', fontFamily: 'Plus Jakarta Sans, sans-serif',
                background: 'var(--green-bg)', color: 'var(--text-primary)', outline: 'none'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--green-border)'}
            />
            <datalist id="crop-cal-list">
              {allCrops.map((c, index) => <option key={`${c.name}-${index}`} value={c.name} />)}
            </datalist>
            <button className="btn-primary" onClick={fetchCropCalendar} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Calendar'}
            </button>
          </div>

          {loading && <div className="loading-box">Generating crop calendar for {crop}...</div>}

          {calendar && !loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {months.map((month, i) => {
                const data = calendar.months?.[month]
                const isCurrent = i === currentMonth
                return (
                  <div key={month} style={{
                    background: isCurrent ? 'var(--gold-bg)' : 'white',
                    border: `1.5px solid ${isCurrent ? 'var(--gold)' : 'var(--green-border)'}`,
                    borderRadius: 'var(--r-lg)', padding: '1.2rem',
                    boxShadow: isCurrent ? '0 4px 16px rgba(160,133,108,0.2)' : 'none'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: isCurrent ? 'var(--gold)' : 'var(--text-primary)' }}>
                        {month}
                        {isCurrent && <span style={{ fontSize: '11px', background: 'var(--gold)', color: 'white', padding: '2px 8px', borderRadius: '10px', marginLeft: '8px', fontWeight: '600' }}>NOW</span>}
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: getActivityColor(data?.activity), background: 'var(--green-bg)', padding: '3px 10px', borderRadius: '20px' }}>
                        {data?.activity || 'N/A'}
                      </span>
                    </div>
                    {data && (
                      <>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>Irrigation: </span>{data.irrigation}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>Fertilizer: </span>{data.fertilizer}
                        </div>
                        {data.tasks?.length > 0 && (
                          <ul style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '16px', marginBottom: '8px', lineHeight: '1.7' }}>
                            {data.tasks.map((t, j) => <li key={j}>{t}</li>)}
                          </ul>
                        )}
                        {data.warning && (
                          <div style={{ fontSize: '11px', color: 'var(--danger)', background: 'var(--danger-bg)', padding: '5px 10px', borderRadius: 'var(--r-sm)', fontWeight: '600' }}>
                            ⚠ {data.warning}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'general' && (
        <>
          <button className="btn-primary" onClick={fetchGeneralCalendar} disabled={generalLoading} style={{ marginBottom: '1.5rem' }}>
            {generalLoading ? 'Generating...' : `Generate Annual Calendar for ${profile?.state || 'My State'}`}
          </button>

          {generalLoading && <div className="loading-box">Generating annual farm calendar...</div>}

          {generalCalendar && !generalLoading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {months.map((month, i) => {
                const data = generalCalendar.months?.[month]
                const isCurrent = i === currentMonth
                return (
                  <div key={month} style={{
                    background: isCurrent ? 'var(--gold-bg)' : 'white',
                    border: `1.5px solid ${isCurrent ? 'var(--gold)' : 'var(--green-border)'}`,
                    borderRadius: 'var(--r-lg)', padding: '1.2rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: isCurrent ? 'var(--gold)' : 'var(--text-primary)' }}>
                        {month}
                        {isCurrent && <span style={{ fontSize: '11px', background: 'var(--gold)', color: 'white', padding: '2px 8px', borderRadius: '10px', marginLeft: '8px' }}>NOW</span>}
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary)', background: 'var(--green-bg)', padding: '3px 10px', borderRadius: '20px' }}>
                        {data?.season}
                      </span>
                    </div>
                    {data && (
                      <>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                          {data.keyActivity}
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          {data.bestCrops?.map(c => (
                            <span key={c} style={{ fontSize: '10px', background: 'var(--green-soft)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>
                              {c}
                            </span>
                          ))}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--primary)', fontStyle: 'italic' }}>
                          Tip: {data.tip}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default CropCalendar
