import { useMemo, useState } from 'react'
import { FARM_PLOTS_KEY, CROP_RECORDS_KEY, createRecordId, readStoredCollection, writeStoredCollection } from '../utils/farmStorage'

const blankPlot = { name: '', area: '', unit: 'acre', soil: '', water: '' }

function FarmPlots({ profile, onNeedProfile, onOpenCycles }) {
  const [initialStorage] = useState(() => readStoredCollection(FARM_PLOTS_KEY))
  const [plots, setPlots] = useState(initialStorage.items)
  const [storageValid] = useState(initialStorage.valid)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(blankPlot)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')

  const visiblePlots = useMemo(() => plots.filter(plot => plot && typeof plot === 'object'), [plots])

  const savePlot = () => {
    if (!form.name.trim()) { setMessage('Give this plot a name so you can recognize it in your crop records.'); return }
    if (!storageValid) { setMessage('Plot storage is unreadable. Existing data was left untouched. Back up or repair it before saving.'); return }
    const previous = visiblePlots.find(plot => plot.id === editingId)
    const plot = { ...previous, ...form, id: previous?.id || createRecordId('plot'), farmId: profile.id || 'primary-farm', name: form.name.trim() }
    const next = previous ? plots.map(item => item?.id === editingId ? plot : item) : [...plots, plot]
    if (!writeStoredCollection(FARM_PLOTS_KEY, next)) { setMessage('Could not save this plot. Check browser storage space and try again.'); return }
    setPlots(next)
    setMessage('Plot saved.')
    setShowForm(false)
    setEditingId('')
    setForm(blankPlot)
  }

  const editPlot = plot => {
    setEditingId(plot.id)
    setForm({ name: plot.name || '', area: plot.area || '', unit: plot.unit || 'acre', soil: plot.soil || '', water: plot.water || '' })
    setShowForm(true)
    setMessage('')
  }

  const deletePlot = plot => {
    const cycles = readStoredCollection(CROP_RECORDS_KEY)
    if (!cycles.valid) { setMessage('Crop-cycle storage is unreadable. The plot was kept to protect links.'); return }
    if (cycles.items.some(cycle => cycle?.plotId === plot.id)) { setMessage('This plot is linked to a crop cycle. Keep it so the cycle history stays connected.'); return }
    const next = plots.filter(item => item?.id !== plot.id)
    if (!writeStoredCollection(FARM_PLOTS_KEY, next)) { setMessage('Could not update browser storage. The plot was kept.'); return }
    setPlots(next)
    setMessage('Plot removed.')
  }

  if (!profile) return <div className="section-inner">
    <h2 className="section-title">Farm plots</h2>
    <p className="section-subtitle">Save your farm profile first, then add the plots you manage.</p>
    <button className="btn-primary" onClick={onNeedProfile}>Set up farm profile</button>
  </div>

  return <div className="section-inner">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
      <div><h2 className="section-title">Farm plots</h2><p className="section-subtitle">Break your farm into named fields. Add only the area and conditions you know.</p></div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn-secondary" onClick={onOpenCycles}>View crop cycles</button>
        <button className="btn-primary" disabled={!storageValid} onClick={() => { setEditingId(''); setForm(blankPlot); setShowForm(true); setMessage('') }}>+ Add plot</button>
      </div>
    </div>

    {!storageValid && <div className="no-profile-box" role="alert"><div className="no-profile-title">Plot data could not be read</div><div className="no-profile-sub">No existing data was overwritten. Back up or repair the browser's local storage before saving plot changes.</div></div>}
    {message && <p role="status" style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>{message}</p>}

    {showForm && <section className="workflow-card" aria-label="Plot details">
      <h3>{editingId ? 'Update plot details' : 'Add a plot'}</h3>
      <div className="form-grid">
        <div className="field"><label htmlFor="plot-name">Plot name *</label><input id="plot-name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="For example, North field" /></div>
        <div className="field"><label htmlFor="plot-area">Area (optional)</label><div style={{ display: 'flex', gap: 8 }}><input id="plot-area" type="number" min="0" step="any" value={form.area} onChange={event => setForm({ ...form, area: event.target.value })} placeholder="Enter known area" /><select aria-label="Area unit" value={form.unit} onChange={event => setForm({ ...form, unit: event.target.value })}><option value="acre">acre</option><option value="hectare">hectare</option><option value="gunta">gunta</option></select></div></div>
        <div className="field"><label htmlFor="plot-soil">Soil type (optional)</label><select id="plot-soil" value={form.soil} onChange={event => setForm({ ...form, soil: event.target.value })}><option value="">Not recorded</option>{['Red soil','Black cotton soil','Loamy soil','Sandy soil','Alluvial soil','Laterite soil','Clay soil','Not sure'].map(value => <option key={value}>{value}</option>)}</select></div>
        <div className="field"><label htmlFor="plot-water">Water source (optional)</label><select id="plot-water" value={form.water} onChange={event => setForm({ ...form, water: event.target.value })}><option value="">Not recorded</option>{['Rainfed only','Borewell','Canal irrigation','Drip irrigation','Sprinkler irrigation','River/Tank','Multiple sources'].map(value => <option key={value}>{value}</option>)}</select></div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}><button className="btn-primary" onClick={savePlot}>Save plot</button><button className="btn-secondary" onClick={() => { setShowForm(false); setEditingId('') }}>Cancel</button></div>
    </section>}

    {visiblePlots.length === 0 && storageValid && !showForm && <div className="no-profile-box"><div className="no-profile-title">No plots added yet</div><div className="no-profile-sub">Add a named plot before creating a crop cycle. Area and soil details can be added later.</div><button className="btn-primary" style={{ marginTop: 12 }} onClick={() => setShowForm(true)}>Add your first plot</button></div>}
    <div className="workflow-list">{visiblePlots.map(plot => <article className="workflow-card" key={plot.id}>
      <div className="workflow-card-heading"><div><h3>{plot.name}</h3><p>{[plot.area && `${plot.area} ${plot.unit || 'acre'}`, plot.soil, plot.water].filter(Boolean).join(' · ') || 'Area and conditions not recorded'}</p></div><div style={{ display: 'flex', gap: 8 }}><button className="btn-secondary" onClick={() => editPlot(plot)}>Edit</button><button className="btn-secondary" onClick={() => deletePlot(plot)}>Remove</button></div></div>
      <button className="text-button" onClick={onOpenCycles}>View cycles for this farm →</button>
    </article>)}</div>
  </div>
}

export default FarmPlots
