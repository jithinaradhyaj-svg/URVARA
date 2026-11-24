import { useMemo, useState } from 'react'
import { allCrops } from '../data/cropData'
import { findCropReferences } from '../data/agronomyReferences'
import { CROP_RECORDS_KEY, FARM_EXPENSES_KEY, FARM_PLOTS_KEY, createRecordId, readStoredCollection, writeStoredCollection } from '../utils/farmStorage'

const cycleStatuses = ['Growing', 'Ready to Harvest', 'Harvested', 'Sold', 'Failed']
const activityTypes = ['General crop check', 'Irrigation', 'Weed management', 'Nutrient application', 'Pest or disease inspection', 'Harvest check', 'Other']
const today = () => new Date().toISOString().slice(0, 10)

function CropCycles({ profile, onOpenPlots, onNeedProfile }) {
  const [initialStorage] = useState(() => ({
    cycles: readStoredCollection(CROP_RECORDS_KEY),
    plots: readStoredCollection(FARM_PLOTS_KEY),
    expenses: readStoredCollection(FARM_EXPENSES_KEY),
  }))
  const [cycles, setCycles] = useState(initialStorage.cycles.items)
  const [plots] = useState(initialStorage.plots.items)
  const [expenses, setExpenses] = useState(initialStorage.expenses.items)
  const [cycleStorageValid] = useState(initialStorage.cycles.valid)
  const [expenseStorageValid] = useState(initialStorage.expenses.valid)
  const [plotsStorageValid] = useState(initialStorage.plots.valid)
  const [selectedId, setSelectedId] = useState(() => initialStorage.cycles.items.find(cycle => cycle && typeof cycle === 'object' && cycle.id !== undefined)?.id || '')
  const [showCycleForm, setShowCycleForm] = useState(false)
  const [editingCycle, setEditingCycle] = useState(null)
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [completingActivity, setCompletingActivity] = useState(null)
  const [message, setMessage] = useState('')
  const [cycleForm, setCycleForm] = useState({ crop: '', plotId: '', sowingDate: '', expectedHarvest: '', seedVariety: '', status: 'Growing', notes: '' })
  const [activityForm, setActivityForm] = useState({ title: '', type: 'General crop check', dueDate: '', notes: '' })
  const [completionNote, setCompletionNote] = useState('')
  const [expenseForm, setExpenseForm] = useState({ category: 'Other', amount: '', description: '', date: today() })

  const visibleCycles = useMemo(() => cycles.filter(cycle => cycle && typeof cycle === 'object' && cycle.crop), [cycles])
  const visiblePlots = useMemo(() => plots.filter(plot => plot && typeof plot === 'object'), [plots])
  const visibleExpenses = useMemo(() => expenses.filter(item => item && typeof item === 'object'), [expenses])
  const selectedCycle = visibleCycles.find(cycle => cycle.id === selectedId) || null
  const selectedPlot = selectedCycle && visiblePlots.find(plot => plot.id === selectedCycle.plotId)
  const linkedExpenses = useMemo(() => visibleExpenses.filter(item => item.cropCycleId === selectedId && item.type === 'expense'), [visibleExpenses, selectedId])
  const linkedExpenseTotal = linkedExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const selectedActivities = Array.isArray(selectedCycle?.activities)
    ? selectedCycle.activities.filter(activity => activity && typeof activity === 'object')
    : []
  const plannedActivityCount = selectedActivities.filter(activity => activity.status !== 'completed').length
  const completedActivityCount = selectedActivities.filter(activity => activity.status === 'completed').length
  const references = selectedCycle ? findCropReferences(selectedCycle.crop) : []

  const saveCycles = next => {
    if (!cycleStorageValid) { setMessage('Crop records could not be read, so nothing was changed. Back up or repair local storage before editing cycles.'); return false }
    if (!writeStoredCollection(CROP_RECORDS_KEY, next)) { setMessage('Could not save crop records. Check browser storage space and try again.'); return false }
    setCycles(next)
    return true
  }

  const startNewCycle = () => {
    setEditingCycle(null)
    setCycleForm({ crop: '', plotId: '', sowingDate: '', expectedHarvest: '', seedVariety: '', status: 'Growing', notes: '' })
    setShowCycleForm(true)
    setMessage('')
  }

  const editCycle = cycle => {
    setEditingCycle(cycle)
    setCycleForm({ crop: cycle.crop || '', plotId: cycle.plotId || '', sowingDate: cycle.sowingDate || '', expectedHarvest: cycle.expectedHarvest || '', seedVariety: cycle.seedVariety || '', status: cycle.status || 'Growing', notes: cycle.notes || '' })
    setShowCycleForm(true)
    setMessage('')
  }

  const saveCycle = () => {
    if (!cycleForm.crop || !cycleForm.plotId) { setMessage('Choose a crop and plot to create this cycle.'); return }
    if (cycleForm.sowingDate && cycleForm.expectedHarvest && cycleForm.expectedHarvest < cycleForm.sowingDate) { setMessage('Expected harvest date must be after the planting date.'); return }
    if (!visiblePlots.some(plot => plot.id === cycleForm.plotId)) { setMessage('That plot is no longer available. Refresh the page and choose a current plot.'); return }
    const prior = editingCycle
    const nextCycle = {
      ...prior,
      ...cycleForm,
      id: prior?.id || createRecordId('cycle'),
      farmId: profile.id || 'primary-farm',
      field: visiblePlots.find(plot => plot.id === cycleForm.plotId)?.name || prior?.field || '',
      createdAt: prior?.createdAt || new Date().toISOString(),
      activities: Array.isArray(prior?.activities) ? prior.activities : [],
    }
    const next = prior ? cycles.map(cycle => cycle.id === prior.id ? nextCycle : cycle) : [nextCycle, ...cycles]
    if (!saveCycles(next)) return
    setSelectedId(nextCycle.id)
    setShowCycleForm(false)
    setEditingCycle(null)
    setMessage(prior ? 'Crop cycle updated.' : 'Crop cycle created. Next, add the activities you want to track.')
  }

  const updateSelectedCycle = updater => {
    if (!selectedCycle) return false
    const next = cycles.map(cycle => cycle?.id === selectedCycle.id ? updater(cycle) : cycle)
    return saveCycles(next)
  }

  const addActivity = () => {
    if (!activityForm.title.trim() || !activityForm.dueDate) { setMessage('Add an activity name and due date.'); return }
    const activity = { id: createRecordId('activity'), title: activityForm.title.trim(), type: activityForm.type, dueDate: activityForm.dueDate, notes: activityForm.notes.trim(), status: 'planned', createdAt: new Date().toISOString() }
    if (updateSelectedCycle(cycle => ({ ...cycle, activities: [...(Array.isArray(cycle.activities) ? cycle.activities : []), activity] }))) {
      setActivityForm({ title: '', type: 'General crop check', dueDate: '', notes: '' })
      setShowActivityForm(false)
      setMessage('Activity added to this crop cycle.')
    }
  }

  const completeActivity = () => {
    if (!completingActivity) return
    if (updateSelectedCycle(cycle => ({
      ...cycle,
      activities: (Array.isArray(cycle.activities) ? cycle.activities : []).map(activity => activity?.id === completingActivity.id
        ? { ...activity, status: 'completed', completedAt: new Date().toISOString(), observation: completionNote.trim() }
        : activity),
    }))) {
      setCompletingActivity(null)
      setCompletionNote('')
      setMessage('Activity marked complete.')
    }
  }

  const addExpense = () => {
    const amount = Number(expenseForm.amount)
    if (!Number.isFinite(amount) || amount <= 0 || !expenseForm.description.trim()) { setMessage('Enter a positive amount and a short description.'); return }
    if (!expenseStorageValid) { setMessage('Expense records could not be read, so nothing was changed. Back up or repair local storage before adding an expense.'); return }
    const entry = { id: createRecordId('expense'), type: 'expense', category: expenseForm.category, amount, description: expenseForm.description.trim(), date: expenseForm.date || today(), crop: selectedCycle.crop, cropCycleId: selectedCycle.id, plotId: selectedCycle.plotId, farmId: profile.id || 'primary-farm' }
    const next = [entry, ...expenses]
    if (!writeStoredCollection(FARM_EXPENSES_KEY, next)) { setMessage('Could not save the expense. Check browser storage space and try again.'); return }
    setExpenses(next)
    setExpenseForm({ category: 'Other', amount: '', description: '', date: today() })
    setMessage('Expense saved and linked to this crop cycle.')
  }

  if (!profile) return <div className="section-inner"><h2 className="section-title">Crop cycles</h2><p className="section-subtitle">Start by setting up your farm profile. Then add plots and plan a crop cycle.</p><button className="btn-primary" onClick={onNeedProfile}>Set up my farm</button></div>

  return <div className="section-inner">
    <div className="workflow-page-heading"><div><span className="eyebrow">Plan → record → review</span><h2 className="section-title">Crop cycles</h2><p className="section-subtitle">Keep planting dates, field activities, observations, and costs together for each crop.</p></div><div className="workflow-actions"><button className="btn-secondary" onClick={onOpenPlots}>Manage plots</button><button className="btn-primary" disabled={!cycleStorageValid || !plotsStorageValid || visiblePlots.length === 0} onClick={startNewCycle}>+ Start a crop cycle</button></div></div>

    {(!cycleStorageValid || !expenseStorageValid || !plotsStorageValid) && <div className="no-profile-box" role="alert"><div className="no-profile-title">Some saved farm data could not be read</div><div className="no-profile-sub">URVARA has not overwritten it. Back up or repair the affected local-storage data before making changes.</div></div>}
    {message && <p role="status" className="workflow-message">{message}</p>}

    {showCycleForm && <section className="workflow-card"><h3>{editingCycle ? 'Update crop cycle' : 'Start a crop cycle'}</h3><p className="workflow-help">Choose a crop and plot. Dates and variety are optional; only record what you know.</p><div className="form-grid">
      <div className="field"><label htmlFor="cycle-crop">Crop *</label><select id="cycle-crop" value={cycleForm.crop} onChange={event => setCycleForm({ ...cycleForm, crop: event.target.value })}><option value="">Choose a crop</option>{allCrops.map((crop, index) => <option key={`${crop.name}-${index}`} value={crop.name}>{crop.name}</option>)}</select></div>
      <div className="field"><label htmlFor="cycle-plot">Plot *</label><select id="cycle-plot" value={cycleForm.plotId} onChange={event => setCycleForm({ ...cycleForm, plotId: event.target.value })}><option value="">Choose a plot</option>{visiblePlots.map(plot => <option key={plot.id} value={plot.id}>{plot.name}{plot.area ? ` · ${plot.area} ${plot.unit || 'acre'}` : ''}</option>)}</select></div>
      <div className="field"><label htmlFor="cycle-sowing">Planting / sowing date</label><input id="cycle-sowing" type="date" value={cycleForm.sowingDate} onChange={event => setCycleForm({ ...cycleForm, sowingDate: event.target.value })} /></div>
      <div className="field"><label htmlFor="cycle-harvest">Expected harvest (optional)</label><input id="cycle-harvest" type="date" value={cycleForm.expectedHarvest} onChange={event => setCycleForm({ ...cycleForm, expectedHarvest: event.target.value })} /></div>
      <div className="field"><label htmlFor="cycle-variety">Variety (optional)</label><input id="cycle-variety" value={cycleForm.seedVariety} onChange={event => setCycleForm({ ...cycleForm, seedVariety: event.target.value })} placeholder="Enter the variety you selected" /></div>
      <div className="field"><label htmlFor="cycle-status">Current status</label><select id="cycle-status" value={cycleForm.status} onChange={event => setCycleForm({ ...cycleForm, status: event.target.value })}>{cycleStatuses.map(status => <option key={status}>{status}</option>)}</select></div>
      <div className="field"><label htmlFor="cycle-notes">Starting notes (optional)</label><input id="cycle-notes" value={cycleForm.notes} onChange={event => setCycleForm({ ...cycleForm, notes: event.target.value })} placeholder="Anything you want to remember" /></div>
    </div><div className="workflow-actions" style={{ marginTop: 14 }}><button className="btn-primary" onClick={saveCycle}>{editingCycle ? 'Save changes' : 'Create crop cycle'}</button><button className="btn-secondary" onClick={() => setShowCycleForm(false)}>Cancel</button></div></section>}

    {visiblePlots.length === 0 && plotsStorageValid && <div className="no-profile-box"><div className="no-profile-title">Add a plot before planning a crop</div><div className="no-profile-sub">Plots let you keep crop cycles and costs attached to the right part of your farm.</div><button className="btn-primary" style={{ marginTop: 12 }} onClick={onOpenPlots}>Add a plot</button></div>}
    {visibleCycles.length === 0 && cycleStorageValid && visiblePlots.length > 0 && !showCycleForm && <div className="no-profile-box"><div className="no-profile-title">No crop cycles recorded yet</div><div className="no-profile-sub">Start with one crop and one plot. You can add activity dates and expenses as you go.</div><button className="btn-primary" style={{ marginTop: 12 }} onClick={startNewCycle}>Start your first crop cycle</button></div>}

    {visibleCycles.length > 0 && <div className="cycle-layout"><section className="workflow-list" aria-label="Saved crop cycles">{visibleCycles.map(cycle => {
      const plot = visiblePlots.find(item => item.id === cycle.plotId)
      const activities = Array.isArray(cycle.activities) ? cycle.activities.filter(activity => activity && typeof activity === 'object') : []
      const expensesForCycle = visibleExpenses.filter(item => item.cropCycleId === cycle.id && item.type === 'expense')
      const cost = expensesForCycle.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      return <button className={`cycle-list-card ${selectedId === cycle.id ? 'active' : ''}`} key={cycle.id || `${cycle.crop}-${cycle.createdAt}`} onClick={() => { setSelectedId(cycle.id); setMessage(''); setShowCycleForm(false) }}>
        <span className="cycle-status">{cycle.status || 'Status not recorded'}</span><strong>{cycle.crop}</strong><span>{plot?.name || cycle.field || 'Plot not linked'}</span><small>{cycle.sowingDate ? `Planted ${cycle.sowingDate}` : 'Planting date not recorded'}{cycle.expectedHarvest ? ` · Harvest ${cycle.expectedHarvest}` : ''}</small><small>{activities.filter(activity => activity.status === 'completed').length} of {activities.length} activities complete · {cost.toLocaleString('en-IN')} INR linked expenses</small>
      </button>
    })}</section>

    {selectedCycle && <article className="workflow-card cycle-detail">
      <div className="workflow-card-heading"><div><span className="eyebrow">Crop cycle</span><h3>{selectedCycle.crop}</h3><p>{selectedPlot?.name || selectedCycle.field || 'Plot not linked'}{selectedPlot?.area ? ` · ${selectedPlot.area} ${selectedPlot.unit || 'acre'}` : ''}</p></div><button className="btn-secondary" onClick={() => editCycle(selectedCycle)}>Edit cycle</button></div>
      <div className="cycle-facts"><span>Status: <b>{selectedCycle.status || 'Not recorded'}</b></span><span>Planting: <b>{selectedCycle.sowingDate || 'Not recorded'}</b></span><span>Expected harvest: <b>{selectedCycle.expectedHarvest || 'Not recorded'}</b></span>{selectedCycle.seedVariety && <span>Variety: <b>{selectedCycle.seedVariety}</b></span>}</div>
      {selectedCycle.notes && <p className="workflow-help">Starting notes: {selectedCycle.notes}</p>}
      <div className="cycle-progress"><strong>Recorded progress</strong><span>{completedActivityCount} completed · {plannedActivityCount} planned</span>{(completedActivityCount + plannedActivityCount) > 0 && <div className="cycle-progress-track"><span style={{ width: `${Math.round(completedActivityCount / (completedActivityCount + plannedActivityCount) * 100)}%` }} /></div>}</div>

      {references.length > 0 && <section className="reference-panel"><h4>Crop references in URVARA</h4><p>These are source facts, not a farm-specific recommendation. Check the source scope before acting.</p>{references.map(reference => <div className="reference-item" key={reference.id}><strong>{reference.cropName}: {reference.subject}</strong><ul>{reference.facts.map(fact => <li key={fact}>{fact}</li>)}</ul><small>{reference.scope}</small><a href={reference.sourceUrl} target="_blank" rel="noreferrer">{reference.sourceName}</a></div>)}</section>}
      {references.length === 0 && <p className="workflow-help">URVARA has no cited crop-specific reference for {selectedCycle.crop} in its current library. Use local KVK or university guidance for variety and input decisions.</p>}

      <section className="workflow-section"><div className="workflow-section-heading"><div><h4>Activities and observations</h4><p>Schedule the work you choose to follow. URVARA does not invent crop timings.</p></div><button className="btn-secondary" onClick={() => setShowActivityForm(value => !value)}>{showActivityForm ? 'Close' : '+ Add activity'}</button></div>
        {showActivityForm && <div className="workflow-form"><div className="form-grid"><div className="field"><label htmlFor="activity-type">Activity type</label><select id="activity-type" value={activityForm.type} onChange={event => setActivityForm({ ...activityForm, type: event.target.value })}>{activityTypes.map(type => <option key={type}>{type}</option>)}</select></div><div className="field"><label htmlFor="activity-title">What will you do? *</label><input id="activity-title" value={activityForm.title} onChange={event => setActivityForm({ ...activityForm, title: event.target.value })} placeholder="Use your own plan or local advice" /></div><div className="field"><label htmlFor="activity-date">Planned date *</label><input id="activity-date" type="date" value={activityForm.dueDate} onChange={event => setActivityForm({ ...activityForm, dueDate: event.target.value })} /></div><div className="field"><label htmlFor="activity-notes">Notes (optional)</label><input id="activity-notes" value={activityForm.notes} onChange={event => setActivityForm({ ...activityForm, notes: event.target.value })} placeholder="What should you check?" /></div></div><button className="btn-primary" style={{ marginTop: 12 }} onClick={addActivity}>Save activity</button></div>}
        {selectedActivities.length === 0 && <p className="empty-inline">No activities yet. Add an activity and choose its date.</p>}
        <div className="activity-list">{selectedActivities.map(activity => <div className={`activity-row ${activity.status === 'completed' ? 'done' : ''}`} key={activity.id}><div className="activity-row-copy"><strong>{activity.title || 'Activity'}</strong><span>{activity.type || 'Activity'} · {activity.status === 'completed' ? `Completed ${activity.completedAt?.slice(0, 10) || ''}` : `Planned ${activity.dueDate || 'date not set'}`}</span>{activity.notes && <small>{activity.notes}</small>}{activity.observation && <small>Observation: {activity.observation}</small>}</div>{activity.status !== 'completed' && <button className="btn-secondary" onClick={() => { setCompletingActivity(activity); setCompletionNote('') }}>Mark done</button>}{completingActivity?.id === activity.id && <div className="completion-form"><label htmlFor="activity-observation">What did you observe? (optional)</label><textarea id="activity-observation" rows="2" value={completionNote} onChange={event => setCompletionNote(event.target.value)} /><button className="btn-primary" onClick={completeActivity}>Save completion</button><button className="btn-secondary" onClick={() => setCompletingActivity(null)}>Cancel</button></div>}</div>)}</div>
      </section>

      <section className="workflow-section"><div className="workflow-section-heading"><div><h4>Cycle-linked expenses</h4><p>Only expenses you add here are counted as linked to this cycle.</p></div></div>
        <div className="cycle-cost-summary"><strong>{linkedExpenseTotal.toLocaleString('en-IN')} INR</strong><span>{linkedExpenses.length} linked expense {linkedExpenses.length === 1 ? 'entry' : 'entries'}</span></div>
        {!expenseStorageValid && <p role="alert" className="workflow-message">Expense records could not be read; adding is disabled to protect existing data.</p>}
        {expenseStorageValid && <div className="workflow-form"><div className="form-grid"><div className="field"><label htmlFor="cycle-expense-category">Category</label><select id="cycle-expense-category" value={expenseForm.category} onChange={event => setExpenseForm({ ...expenseForm, category: event.target.value })}>{['Seeds','Fertilizer','Pesticide','Labor','Irrigation','Equipment','Transport','Other'].map(category => <option key={category}>{category}</option>)}</select></div><div className="field"><label htmlFor="cycle-expense-amount">Amount (INR) *</label><input id="cycle-expense-amount" type="number" min="0.01" step="0.01" value={expenseForm.amount} onChange={event => setExpenseForm({ ...expenseForm, amount: event.target.value })} /></div><div className="field"><label htmlFor="cycle-expense-desc">What was purchased or paid for? *</label><input id="cycle-expense-desc" value={expenseForm.description} onChange={event => setExpenseForm({ ...expenseForm, description: event.target.value })} placeholder="Enter a short description" /></div><div className="field"><label htmlFor="cycle-expense-date">Date</label><input id="cycle-expense-date" type="date" value={expenseForm.date} onChange={event => setExpenseForm({ ...expenseForm, date: event.target.value })} /></div></div><button className="btn-primary" style={{ marginTop: 12 }} onClick={addExpense}>Save cycle expense</button></div>}
        {linkedExpenses.length > 0 && <div className="linked-expense-list">{linkedExpenses.map(item => <div key={item.id}><span>{item.date} · {item.category} · {item.description}</span><strong>{(Number(item.amount) || 0).toLocaleString('en-IN')} INR</strong></div>)}</div>}
      </section>
    </article>}
    </div>}
  </div>
}

export default CropCycles
