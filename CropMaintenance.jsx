import { useState } from 'react'
import { askGroq } from '../utils/groqAPI'

const maintenanceTasks = [
  { id: 'watering', label: 'Watering Schedule', icon: '💧' },
  { id: 'fertilizer', label: 'Fertilizer Schedule', icon: '🧪' },
  { id: 'pesticide', label: 'Pesticide Schedule', icon: '🐛' },
  { id: 'weeding', label: 'Weeding Schedule', icon: '🌿' },
  { id: 'pruning', label: 'Pruning Guide', icon: '✂️' },
  { id: 'harvest', label: 'Harvest Timing', icon: '🚜' },
]

function CropMaintenance({ profile, weatherData, onOpenCycles }) {
  const [crop, setCrop] = useState('')
  const [sowingDate, setSowingDate] = useState('')
  const [stage, setStage] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [fullSchedule, setFullSchedule] = useState('')
  const [scheduleLoading, setScheduleLoading] = useState(false)

  const getTaskAdvice = async (task) => {
    if (!crop) { alert('Please enter crop name first!'); return }
    setSelectedTask(task)
    setLoading(true)
    setResult('')
    try {
      const reply = await askGroq([{
        role: 'user',
        content: `Give me a detailed ${task.label} guide for ${crop}.
${sowingDate ? `Sowing date: ${sowingDate}` : ''}
${stage ? `Current crop stage: ${stage}` : ''}
${profile ? `Farm: ${profile.district}, ${profile.state}, ${profile.soil} soil, ${profile.water} water` : ''}
${weatherData ? `Current weather: ${weatherData.temperature}°C, ${weatherData.condition}, Humidity ${weatherData.humidity}%` : ''}

Give general guidance only where it is supported. If crop stage, soil, water source, or a soil test is needed and missing, ask first. Do not invent an exact schedule, input quantity, dosage, cost, or result. Separate known facts from uncertain suggestions and recommend local KVK validation for farm-specific actions.`
      }], profile, weatherData)
      setResult(reply)
    } catch (err) {
      setResult(`Could not get advice: ${err.message}`)
    }
    setLoading(false)
  }

  const getFullSchedule = async () => {
    if (!crop) { alert('Please enter crop name first!'); return }
    setScheduleLoading(true)
    setFullSchedule('')
    try {
      const reply = await askGroq([{
        role: 'user',
        content: `Create a complete crop maintenance calendar for ${crop} from sowing to harvest.
${sowingDate ? `Sowing date: ${sowingDate}` : 'Sowing date: not provided'}
${profile ? `Farm: ${profile.district}, ${profile.state}, ${profile.soil} soil, ${profile.water} water, ${profile.budget} budget` : ''}

Do not fabricate a week-by-week plan. If verified crop-specific, locally applicable sources are unavailable or key conditions are missing, explain the limits and ask what information is needed. Avoid treatment dosages or cost estimates without a cited basis.`
      }], profile, weatherData)
      setFullSchedule(reply)
    } catch (err) {
      setFullSchedule(`Could not generate the schedule: ${err.message}`)
    }
    setScheduleLoading(false)
  }

  return (
    <div className="section-inner">
      <h2 className="section-title">Crop Maintenance</h2>
      <p className="section-subtitle">Get general AI crop-care guidance. Confirm specific treatments with your local agricultural expert.</p>
      <button className="btn-secondary" style={{ marginBottom: '1rem' }} onClick={onOpenCycles}>Track activities in a crop cycle</button>

      <div className="form-grid" style={{ marginBottom: '1.2rem' }}>
        <div className="field">
          <label>Crop Name</label>
          <input
            placeholder="e.g. Tomato, Rice, Wheat..."
            value={crop}
            onChange={e => setCrop(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Sowing Date (optional)</label>
          <input
            type="date"
            value={sowingDate}
            onChange={e => setSowingDate(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Current Crop Stage</label>
          <select value={stage} onChange={e => setStage(e.target.value)}>
            <option value="">Select stage</option>
            <option>Just sowed seeds</option>
            <option>Germination (sprouting)</option>
            <option>Seedling stage</option>
            <option>Vegetative growth</option>
            <option>Flowering stage</option>
            <option>Fruiting stage</option>
            <option>Maturity / Pre-harvest</option>
          </select>
        </div>
      </div>

      <button className="btn-gold" style={{ marginBottom: '1.5rem', width: '100%' }} onClick={getFullSchedule} disabled={scheduleLoading}>
        {scheduleLoading ? '⏳ Generating full schedule...' : '📅 Generate Complete Maintenance Calendar'}
      </button>

      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
          Or get advice for specific task:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
          {maintenanceTasks.map(task => (
            <button
              key={task.id}
              onClick={() => getTaskAdvice(task)}
              style={{
                padding: '14px',
                borderRadius: 'var(--r-md)',
                border: `1.5px solid ${selectedTask?.id === task.id ? 'var(--primary)' : 'var(--green-border)'}`,
                background: selectedTask?.id === task.id ? 'var(--green-soft)' : 'white',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>{task.icon}</div>
              {task.label}
            </button>
          ))}
        </div>
      </div>

      {scheduleLoading && <div className="loading-box">📅 Creating your complete maintenance calendar...</div>}

      {fullSchedule && !scheduleLoading && (
        <div className="result-box" style={{ marginBottom: '1.5rem' }}>
          <div className="result-title">📅 Complete Maintenance Calendar — {crop}</div>
          {fullSchedule}
        </div>
      )}

      {loading && <div className="loading-box">Getting {selectedTask?.label} advice for {crop}...</div>}

      {result && !loading && (
        <div className="result-box">
          <div className="result-title">{selectedTask?.icon} {selectedTask?.label} — {crop}</div>
          {result}
        </div>
      )}
    </div>
  )
}

export default CropMaintenance
