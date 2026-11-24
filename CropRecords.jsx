import { useState } from 'react'
import { askGroq } from '../utils/groqAPI'
import { CROP_RECORDS_KEY, createRecordId, readStoredCollection, writeStoredCollection } from '../utils/farmStorage'

function CropRecords({ profile, onOpenCycles }) {
  const [initialRecords] = useState(() => readStoredCollection(CROP_RECORDS_KEY))
  const [records, setRecords] = useState(initialRecords.items)
  const [showForm, setShowForm] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [analysis, setAnalysis] = useState('')
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [storageValid] = useState(initialRecords.valid)
  const [storageMessage, setStorageMessage] = useState('')
  const [form, setForm] = useState({
    crop: '',
    field: '',
    landSize: '',
    sowingDate: '',
    expectedHarvest: '',
    seedVariety: '',
    seedCost: '',
    fertilizerCost: '',
    laborCost: '',
    otherCost: '',
    expectedYield: '',
    actualYield: '',
    sellingPrice: '',
    sellingDate: '',
    notes: '',
    status: 'Growing'
  })

  const visibleRecords = records.filter(record => record && typeof record === 'object' && record.crop)

  const saveRecord = () => {
    if (!form.crop) { alert('Please enter crop name!'); return }
    if (!storageValid) { setStorageMessage('Crop record storage could not be read, so nothing was changed. Back up or repair local storage first.'); return }
    const newRecord = { ...form, id: selectedRecord?.id || createRecordId('crop'), createdAt: selectedRecord?.createdAt || new Date().toISOString() }
    const updated = selectedRecord
      ? records.map(r => r?.id === selectedRecord.id ? { ...selectedRecord, ...newRecord, id: selectedRecord.id } : r)
      : [...records, newRecord]
    if (!writeStoredCollection(CROP_RECORDS_KEY, updated)) { setStorageMessage('Could not save the crop record. Check browser storage space and try again.'); return }
    setRecords(updated)
    setStorageMessage('')
    setShowForm(false)
    setSelectedRecord(null)
    setForm({
      crop: '', field: '', landSize: '', sowingDate: '', expectedHarvest: '',
      seedVariety: '', seedCost: '', fertilizerCost: '', laborCost: '',
      otherCost: '', expectedYield: '', actualYield: '', sellingPrice: '',
      sellingDate: '', notes: '', status: 'Growing'
    })
  }

  const deleteRecord = (id) => {
    if (!confirm('Delete this record?')) return
    if (!storageValid) { setStorageMessage('Crop record storage could not be read, so nothing was deleted.'); return }
    const updated = records.filter(r => r?.id !== id)
    if (!writeStoredCollection(CROP_RECORDS_KEY, updated)) { setStorageMessage('Could not update crop records.'); return }
    setRecords(updated)
  }

  const editRecord = (record) => {
    setSelectedRecord(record)
    setForm(record)
    setShowForm(true)
  }

  const getAnalysis = async (record) => {
    setAnalysisLoading(true)
    setAnalysis('')
    const totalCost = (parseFloat(record.seedCost) || 0) + (parseFloat(record.fertilizerCost) || 0) +
      (parseFloat(record.laborCost) || 0) + (parseFloat(record.otherCost) || 0)
    const revenue = (parseFloat(record.actualYield) || 0) * (parseFloat(record.sellingPrice) || 0)
    const profit = revenue - totalCost

    try {
      const reply = await askGroq([{
        role: 'user',
        content: `Analyze my crop record and give insights:
Crop: ${record.crop}
Land: ${record.landSize} acres
Sowing: ${record.sowingDate}
Harvest: ${record.sellingDate || 'Not yet'}
Seed variety: ${record.seedVariety || 'Not specified'}
Total cost: ₹${totalCost}
Expected yield: ${record.expectedYield} kg
Actual yield: ${record.actualYield || 'Not harvested yet'} kg
Selling price: ₹${record.sellingPrice}/kg
Total revenue: ₹${revenue}
Net profit/loss: ₹${profit}
Notes: ${record.notes}

Please provide:
1. Performance analysis — was this good or bad?
2. Where did I do well and where can I improve?
3. Was the profit/loss normal for ${record.crop} in ${profile?.state || 'India'}?
4. What could I do differently next time?
5. Suggestions for next crop cycle
6. Cost reduction opportunities I missed`
      }], profile, null)
      setAnalysis(reply)
    } catch (err) {
      setAnalysis(`Could not get analysis: ${err.message}`)
    }
    setAnalysisLoading(false)
  }

  const calcProfit = (r) => {
    const cost = (parseFloat(r.seedCost) || 0) + (parseFloat(r.fertilizerCost) || 0) +
      (parseFloat(r.laborCost) || 0) + (parseFloat(r.otherCost) || 0)
    const rev = (parseFloat(r.actualYield) || 0) * (parseFloat(r.sellingPrice) || 0)
    return rev - cost
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)
  }

  return (
    <div className="section-inner">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 className="section-title">Crop Records</h2>
          <p className="section-subtitle" style={{ margin: 0 }}>Track all your crops, costs, and profits</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={onOpenCycles}>Plan and track a crop cycle</button>
          <button className="btn-primary" onClick={() => { setShowForm(true); setSelectedRecord(null) }}>+ Add New Record</button>
        </div>
      </div>

      {showForm && (
        <div style={{ background: 'var(--green-bg)', border: '1.5px solid var(--green-border)', borderRadius: 'var(--r-lg)', padding: '1.4rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary)', marginBottom: '1rem' }}>
            {selectedRecord ? 'Edit Record' : 'New Crop Record'}
          </h3>
          <div className="form-grid">
            <div className="field"><label>Crop Name</label><input placeholder="e.g. Tomato" value={form.crop} onChange={e => setForm({ ...form, crop: e.target.value })} /></div>
            <div className="field"><label>Field Name</label><input placeholder="e.g. Field A, North Plot" value={form.field} onChange={e => setForm({ ...form, field: e.target.value })} /></div>
            <div className="field"><label>Land Size (acres)</label><input type="number" placeholder="2" value={form.landSize} onChange={e => setForm({ ...form, landSize: e.target.value })} /></div>
            <div className="field"><label>Seed Variety</label><input placeholder="e.g. Hybrid H-24" value={form.seedVariety} onChange={e => setForm({ ...form, seedVariety: e.target.value })} /></div>
            <div className="field"><label>Sowing Date</label><input type="date" value={form.sowingDate} onChange={e => setForm({ ...form, sowingDate: e.target.value })} /></div>
            <div className="field"><label>Expected Harvest Date</label><input type="date" value={form.expectedHarvest} onChange={e => setForm({ ...form, expectedHarvest: e.target.value })} /></div>
            <div className="field"><label>Seed Cost (₹)</label><input type="number" placeholder="5000" value={form.seedCost} onChange={e => setForm({ ...form, seedCost: e.target.value })} /></div>
            <div className="field"><label>Fertilizer Cost (₹)</label><input type="number" placeholder="8000" value={form.fertilizerCost} onChange={e => setForm({ ...form, fertilizerCost: e.target.value })} /></div>
            <div className="field"><label>Labor Cost (₹)</label><input type="number" placeholder="10000" value={form.laborCost} onChange={e => setForm({ ...form, laborCost: e.target.value })} /></div>
            <div className="field"><label>Other Costs (₹)</label><input type="number" placeholder="2000" value={form.otherCost} onChange={e => setForm({ ...form, otherCost: e.target.value })} /></div>
            <div className="field"><label>Expected Yield (kg)</label><input type="number" placeholder="8000" value={form.expectedYield} onChange={e => setForm({ ...form, expectedYield: e.target.value })} /></div>
            <div className="field"><label>Actual Yield (kg)</label><input type="number" placeholder="7500" value={form.actualYield} onChange={e => setForm({ ...form, actualYield: e.target.value })} /></div>
            <div className="field"><label>Selling Price (₹/kg)</label><input type="number" placeholder="20" value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: e.target.value })} /></div>
            <div className="field"><label>Selling Date</label><input type="date" value={form.sellingDate} onChange={e => setForm({ ...form, sellingDate: e.target.value })} /></div>
            <div className="field"><label>Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option>Growing</option>
                <option>Ready to Harvest</option>
                <option>Harvested</option>
                <option>Sold</option>
                <option>Failed</option>
              </select>
            </div>
          </div>
          <div className="field" style={{ marginBottom: '1rem' }}>
            <label>Notes</label>
            <textarea
              placeholder="Any observations, problems faced, or notes..."
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={3}
              style={{ padding: '10px 14px', borderRadius: 'var(--r-sm)', border: '1.5px solid var(--green-border)', fontSize: '14px', fontFamily: 'Plus Jakarta Sans, sans-serif', background: 'white', color: 'var(--text-primary)', resize: 'vertical', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-primary" onClick={saveRecord}>Save Record</button>
            <button className="btn-secondary" onClick={() => { setShowForm(false); setSelectedRecord(null) }}>Cancel</button>
          </div>
        </div>
      )}

      {(!storageValid || storageMessage) && <div className="no-profile-box" role="alert"><div className="no-profile-title">{storageMessage || 'Crop record data could not be read'}</div><div className="no-profile-sub">Existing data is protected. Back up or repair the browser's local storage before editing records.</div></div>}

      {visibleRecords.length === 0 && !showForm && (
        <div className="no-profile-box">
          <div className="no-profile-icon">📋</div>
          <div className="no-profile-title">No crop records yet</div>
          <div className="no-profile-sub">Start tracking your crops to monitor performance and profits</div>
        </div>
      )}

      {visibleRecords.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {visibleRecords.map(record => {
            const profit = calcProfit(record)
            const totalCost = (parseFloat(record.seedCost) || 0) + (parseFloat(record.fertilizerCost) || 0) +
              (parseFloat(record.laborCost) || 0) + (parseFloat(record.otherCost) || 0)
            return (
              <div key={record.id} style={{ background: 'white', border: '1.5px solid var(--green-border)', borderRadius: 'var(--r-lg)', padding: '1.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>{record.crop}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {record.field && `${record.field} • `}{record.landSize && `${record.landSize} acres • `}Sown: {record.sowingDate || 'Not set'}
                    </p>
                    {record.seedVariety && <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Variety: {record.seedVariety}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                      background: record.status === 'Sold' ? '#dcfce7' : record.status === 'Failed' ? '#fee2e2' : '#fef3c7',
                      color: record.status === 'Sold' ? '#15803d' : record.status === 'Failed' ? '#dc2626' : '#d97706'
                    }}>
                      {record.status}
                    </span>
                    <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: '12px' }} onClick={() => editRecord(record)}>Edit</button>
                    <button onClick={() => deleteRecord(record.id)} style={{ padding: '5px 12px', fontSize: '12px', border: '1px solid #fecaca', borderRadius: 'var(--r-sm)', background: 'white', color: '#dc2626', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Delete</button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: '1rem' }}>
                  {[
                    { label: 'Total Cost', value: formatCurrency(totalCost) },
                    { label: 'Revenue', value: record.actualYield && record.sellingPrice ? formatCurrency(parseFloat(record.actualYield) * parseFloat(record.sellingPrice)) : 'Pending' },
                    { label: 'Profit/Loss', value: record.actualYield && record.sellingPrice ? formatCurrency(profit) : 'Pending', highlight: true, positive: profit >= 0 },
                    { label: 'Actual Yield', value: record.actualYield ? `${record.actualYield} kg` : 'Pending' },
                  ].map((item, i) => (
                    <div key={i} style={{ background: 'var(--green-bg)', borderRadius: 'var(--r-sm)', padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{item.label}</div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: item.highlight ? (item.positive ? '#15803d' : '#dc2626') : 'var(--primary)', fontFamily: 'Playfair Display, serif' }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                {record.notes && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '1rem', fontStyle: 'italic' }}>
                    Notes: {record.notes}
                  </p>
                )}

                <button className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }} onClick={() => getAnalysis(record)}>
                  🤖 Get AI Analysis
                </button>

                {analysisLoading && selectedRecord?.id === record.id && (
                  <div className="loading-box" style={{ marginTop: '1rem' }}>Analyzing your crop performance...</div>
                )}
                {analysis && !analysisLoading && (
                  <div className="result-box" style={{ marginTop: '1rem' }}>
                    <div className="result-title">AI Performance Analysis — {record.crop}</div>
                    {analysis}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CropRecords
