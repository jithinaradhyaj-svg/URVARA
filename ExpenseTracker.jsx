import { useState } from 'react'
import { askGroq } from '../utils/groqAPI'
import { CROP_RECORDS_KEY, FARM_EXPENSES_KEY, createRecordId, readStoredCollection, writeStoredCollection } from '../utils/farmStorage'

const categories = ['Seeds', 'Fertilizer', 'Pesticide', 'Labor', 'Irrigation', 'Equipment', 'Transport', 'Other']
const incomeCategories = ['Crop Sale', 'Government Subsidy', 'Scheme Benefit', 'Other Income']

function ExpenseTracker({ profile }) {
  const [initialExpenses] = useState(() => readStoredCollection(FARM_EXPENSES_KEY))
  const [initialCycles] = useState(() => readStoredCollection(CROP_RECORDS_KEY))
  const [transactions, setTransactions] = useState(initialExpenses.items)
  const [form, setForm] = useState({ type: 'expense', category: 'Seeds', amount: '', description: '', date: new Date().toISOString().split('T')[0], crop: '', cropCycleId: '' })
  const [cropCycles] = useState(() => initialCycles.items.filter(item => item && typeof item === 'object' && item.crop))
  const [storageValid] = useState(initialExpenses.valid)
  const [storageMessage, setStorageMessage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [analysis, setAnalysis] = useState('')
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [filterMonth, setFilterMonth] = useState('')

  const save = (updated) => {
    if (!storageValid) { setStorageMessage('Saved expense data could not be read, so it was not changed. Back up or repair local storage first.'); return false }
    if (!writeStoredCollection(FARM_EXPENSES_KEY, updated)) { setStorageMessage('Could not save this transaction. Check browser storage space and try again.'); return false }
    setTransactions(updated)
    setStorageMessage('')
    return true
  }

  const addTransaction = () => {
    if (!form.amount || !form.description) { alert('Please fill amount and description!'); return }
    const linkedCycle = cropCycles.find(cycle => cycle.id === form.cropCycleId)
    const tx = { ...form, id: createRecordId('transaction'), amount: parseFloat(form.amount), cropCycleId: form.type === 'expense' ? (form.cropCycleId || '') : '', plotId: form.type === 'expense' ? (linkedCycle?.plotId || '') : '', farmId: profile?.id || 'primary-farm' }
    if (save([tx, ...transactions])) {
      setForm({ type: 'expense', category: 'Seeds', amount: '', description: '', date: new Date().toISOString().split('T')[0], crop: '', cropCycleId: '' })
      setShowForm(false)
    }
  }

  const deleteTransaction = (id) => {
    if (!confirm('Delete this transaction?')) return
    save(transactions.filter(t => t?.id !== id))
  }

  const validTransactions = transactions.filter(t => t && typeof t === 'object')
  const filtered = filterMonth
    ? validTransactions.filter(t => t.date?.startsWith(filterMonth))
    : validTransactions

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0)
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0)
  const netProfit = totalIncome - totalExpense

  const expenseByCategory = categories.reduce((acc, cat) => {
    acc[cat] = filtered.filter(t => t.type === 'expense' && t.category === cat).reduce((s, t) => s + (Number(t.amount) || 0), 0)
    return acc
  }, {})

  const getAIAnalysis = async () => {
    setAnalysisLoading(true)
    setAnalysis('')
    try {
      const summary = `Total Income: ₹${totalIncome}, Total Expenses: ₹${totalExpense}, Net: ₹${netProfit}. Expense breakdown: ${Object.entries(expenseByCategory).filter(([,v]) => v > 0).map(([k,v]) => `${k}: ₹${v}`).join(', ')}`
      const reply = await askGroq([{
        role: 'user',
        content: `Analyze my farm financial records:
${summary}
${profile ? `Farm: ${profile.district}, ${profile.state}, ${profile.land} land` : ''}

Give me:
1. Is my spending balanced? Which category is too high?
2. Cost reduction opportunities
3. Expected profit improvement if I follow recommendations
4. Comparison with typical farm costs in my region
5. Next month financial planning advice
Keep it brief and actionable — max 200 words.`
      }], profile, null)
      setAnalysis(reply)
    } catch (err) {
      setAnalysis(`Could not analyze these records: ${err.message}`)
    }
    setAnalysisLoading(false)
  }

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)

  const maxExpense = Math.max(...Object.values(expenseByCategory), 1)

  return (
    <div className="section-inner">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 className="section-title">Farm Expense Tracker</h2>
          <p className="section-subtitle" style={{ margin: 0 }}>Track all farm income and expenses</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Transaction'}
        </button>
      </div>

      {storageMessage && <p role="alert" className="workflow-message">{storageMessage}</p>}

      {showForm && (
        <div style={{ background: 'var(--green-bg)', border: '1.5px solid var(--green-border)', borderRadius: 'var(--r-lg)', padding: '1.4rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem' }}>New Transaction</h3>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
            {['expense', 'income'].map(type => (
              <button key={type} onClick={() => setForm({ ...form, type })} style={{
                flex: 1, padding: '10px', borderRadius: 'var(--r-md)', cursor: 'pointer',
                border: '1.5px solid var(--green-border)', fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '14px', fontWeight: '700', transition: 'all 0.2s',
                background: form.type === type ? (type === 'expense' ? 'var(--primary)' : '#4A7C59') : 'white',
                color: form.type === type ? 'white' : 'var(--text-secondary)'
              }}>
                {type === 'expense' ? 'Expense' : 'Income'}
              </button>
            ))}
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {(form.type === 'expense' ? categories : incomeCategories).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Amount (₹)</label>
              <input type="number" placeholder="e.g. 5000" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="field">
              <label>Description</label>
              <input placeholder="e.g. DAP fertilizer 2 bags" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="field">
              <label>Crop (optional)</label>
              <input placeholder="e.g. Tomato" value={form.crop} onChange={e => setForm({ ...form, crop: e.target.value })} />
            </div>
            {form.type === 'expense' && <div className="field">
              <label htmlFor="expense-cycle">Link to crop cycle (optional)</label>
              <select id="expense-cycle" value={form.cropCycleId} onChange={e => {
                const cycle = cropCycles.find(item => item.id === e.target.value)
                setForm({ ...form, cropCycleId: e.target.value, crop: cycle?.crop || form.crop })
              }}>
                <option value="">Farm-wide / not linked</option>
                {cropCycles.map(cycle => <option key={cycle.id} value={cycle.id}>{cycle.crop}{cycle.field ? ` · ${cycle.field}` : ''}</option>)}
              </select>
            </div>}
            <div className="field">
              <label>Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <button className="btn-primary" onClick={addTransaction} disabled={!storageValid}>Save Transaction</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['dashboard', 'transactions', 'analysis'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '8px 16px', borderRadius: 'var(--r-md)',
            border: '1.5px solid var(--green-border)',
            background: activeTab === tab ? 'var(--primary)' : 'var(--green-soft)',
            color: activeTab === tab ? 'white' : 'var(--text-secondary)',
            fontSize: '13px', fontWeight: '700', cursor: 'pointer',
            fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'all 0.2s',
            textTransform: 'capitalize'
          }}>
            {tab}
          </button>
        ))}
        <input
          type="month"
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          style={{
            marginLeft: 'auto', padding: '8px 12px', borderRadius: 'var(--r-sm)',
            border: '1.5px solid var(--green-border)', fontSize: '13px',
            fontFamily: 'Plus Jakarta Sans, sans-serif', background: 'var(--green-bg)',
            color: 'var(--text-primary)', outline: 'none'
          }}
        />
      </div>

      {activeTab === 'dashboard' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Income', value: formatCurrency(totalIncome), color: '#4A7C59', bg: '#EFF5F1' },
              { label: 'Total Expenses', value: formatCurrency(totalExpense), color: 'var(--primary)', bg: 'var(--danger-bg)' },
              { label: netProfit >= 0 ? 'Net Profit' : 'Net Loss', value: formatCurrency(Math.abs(netProfit)), color: netProfit >= 0 ? '#4A7C59' : 'var(--primary)', bg: netProfit >= 0 ? '#EFF5F1' : 'var(--danger-bg)' },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, borderRadius: 'var(--r-lg)', padding: '1.2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: s.color, fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>{s.label}</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: s.color, fontFamily: 'Playfair Display, serif' }}>{s.value}</div>
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Expense Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(expenseByCategory)
              .filter(([,v]) => v > 0)
              .sort(([,a],[,b]) => b - a)
              .map(([cat, amount]) => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '80px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', flexShrink: 0 }}>{cat}</div>
                  <div style={{ flex: 1, height: '8px', background: 'var(--green-soft)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${(amount / maxExpense) * 100}%`, height: '100%', background: 'var(--primary)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ width: '80px', fontSize: '12px', color: 'var(--primary)', fontWeight: '700', textAlign: 'right', flexShrink: 0 }}>
                    {formatCurrency(amount)}
                  </div>
                </div>
              ))}
            {Object.values(expenseByCategory).every(v => v === 0) && (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No expenses recorded yet</p>
            )}
          </div>
        </>
      )}

      {activeTab === 'transactions' && (
        <>
          {filtered.length === 0 ? (
            <div className="no-profile-box">
              <div className="no-profile-title">No transactions yet</div>
              <div className="no-profile-sub">Click Add Transaction to start tracking</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.sort((a,b) => new Date(b.date) - new Date(a.date)).map(tx => (
                <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'white', border: '1.5px solid var(--green-border)', borderRadius: 'var(--r-md)', flexWrap: 'wrap' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tx.type === 'income' ? '#4A7C59' : 'var(--primary)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{tx.description}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {tx.category} {tx.crop && `• ${tx.crop}`} {tx.cropCycleId && '• Linked crop cycle'} • {tx.date}
                    </div>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: tx.type === 'income' ? '#4A7C59' : 'var(--primary)', fontFamily: 'Playfair Display, serif', flexShrink: 0 }}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                  <button onClick={() => deleteTransaction(tx.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'analysis' && (
        <>
          <button className="btn-gold" onClick={getAIAnalysis} disabled={analysisLoading || transactions.length === 0} style={{ marginBottom: '1.2rem' }}>
            {analysisLoading ? 'Analyzing...' : 'Get AI Financial Analysis'}
          </button>
          {transactions.length === 0 && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Add some transactions first to get analysis.</p>}
          {analysisLoading && <div className="loading-box">Analyzing your farm finances...</div>}
          {analysis && !analysisLoading && (
            <div className="result-box">
              <div className="result-title">Financial Analysis</div>
              {analysis}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ExpenseTracker
