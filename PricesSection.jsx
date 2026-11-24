import { useCallback, useEffect, useRef, useState } from 'react'

const stateChoices = [
  { value: '', label: 'All India' },
  { value: 'Karnataka', label: 'Karnataka' },
  { value: 'Keralam', label: 'Keralam (Kerala in common usage)' },
  { value: 'Punjab', label: 'Punjab' },
  { value: 'other', label: 'Another state…' },
]

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

function PricesSection() {
  const [stateChoice, setStateChoice] = useState('Karnataka')
  const [otherState, setOtherState] = useState('')
  const [draft, setDraft] = useState({ district: '', market: '', commodity: '' })
  const [filters, setFilters] = useState({ state: 'Karnataka' })
  const [payload, setPayload] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const controllerRef = useRef(null)

  const fetchRecords = useCallback(async (activeFilters, offset = 0, append = false) => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    if (append) setLoadingMore(true)
    else {
      setLoading(true)
      setError('')
    }
    const params = new URLSearchParams({ limit: '20', offset: String(offset) })
    Object.entries(activeFilters).forEach(([key, value]) => { if (value) params.set(key, value) })
    try {
      const response = await fetch(`/api/mandi?${params}`, { signal: controller.signal, headers: { Accept: 'application/json' } })
      const result = await response.json()
      if (!response.ok) throw new Error(result?.error?.message || 'Market data is temporarily unavailable. Please try again.')
      setPayload(result)
      setRecords(current => append ? [...current, ...result.records] : result.records)
      setError('')
    } catch (fetchError) {
      if (fetchError.name !== 'AbortError') {
        setError(fetchError.message || 'Market data is temporarily unavailable. Please try again.')
        if (!append) {
          setPayload(null)
          setRecords([])
        }
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => fetchRecords(filters), 0)
    return () => {
      window.clearTimeout(timer)
      controllerRef.current?.abort()
    }
  }, [filters, fetchRecords])

  const applyFilters = event => {
    event.preventDefault()
    const selectedState = stateChoice === 'other' ? otherState.trim() : stateChoice
    if (stateChoice === 'other' && !selectedState) return
    setFilters({ state: selectedState, district: draft.district.trim(), market: draft.market.trim(), commodity: draft.commodity.trim() })
  }

  const resetFilters = () => {
    setStateChoice('Karnataka')
    setOtherState('')
    setDraft({ district: '', market: '', commodity: '' })
    setFilters({ state: 'Karnataka' })
  }

  const total = Number(payload?.metadata?.total || 0)
  const retrievedAt = payload?.metadata?.retrievedAt ? new Date(payload.metadata.retrievedAt).toLocaleString() : ''

  return (
    <div className="section-inner">
      <h2 className="section-title">Mandi Market Prices</h2>
      <p className="section-subtitle">Daily wholesale observations from AGMARKNET. Prices are market references, not guaranteed farm-gate prices or real-time offers.</p>

      <form className="market-filter-panel" onSubmit={applyFilters}>
        <div className="market-filter-grid">
          <div className="field">
            <label htmlFor="market-state">State</label>
            <select id="market-state" value={stateChoice} onChange={event => setStateChoice(event.target.value)}>
              {stateChoices.map(choice => <option key={choice.value || 'all'} value={choice.value}>{choice.label}</option>)}
            </select>
          </div>
          {stateChoice === 'other' && <div className="field"><label htmlFor="market-other-state">State name as listed by the source</label><input id="market-other-state" value={otherState} onChange={event => setOtherState(event.target.value)} maxLength={80} placeholder="Enter state name" /></div>}
          <div className="field"><label htmlFor="market-district">District</label><input id="market-district" value={draft.district} onChange={event => setDraft(current => ({ ...current, district: event.target.value }))} maxLength={80} placeholder="Any district" /></div>
          <div className="field"><label htmlFor="market-name">Market</label><input id="market-name" value={draft.market} onChange={event => setDraft(current => ({ ...current, market: event.target.value }))} maxLength={80} placeholder="Any market" /></div>
          <div className="field"><label htmlFor="market-commodity">Commodity (exact name)</label><input id="market-commodity" value={draft.commodity} onChange={event => setDraft(current => ({ ...current, commodity: event.target.value }))} maxLength={80} placeholder="For example, Banana" /></div>
        </div>
        <div className="market-filter-actions">
          <button className="btn-primary" type="submit">Apply filters</button>
          <button className="btn-secondary" type="button" onClick={resetFilters}>Reset</button>
          <span>District, market and commodity use exact source names. Observation date is retained with each record.</span>
        </div>
      </form>

      {loading && <div className="market-message" role="status">Loading verified market observations…</div>}
      {!loading && error && <div className="market-message market-error" role="alert"><strong>Market information is temporarily unavailable.</strong><span>{error}</span><button className="btn-secondary" type="button" onClick={() => fetchRecords(filters)}>Try again</button></div>}
      {!loading && !error && records.length === 0 && <div className="market-message" role="status">No observations match these filters. Try a different state, district, market or commodity.</div>}

      {!loading && !error && records.length > 0 && <>
        <div className="market-results-heading"><strong>{total.toLocaleString('en-IN')} matching observations</strong><span>Retrieved {retrievedAt}{payload?.cache === 'fresh' ? ' · served from short cache' : ''}</span></div>
        {payload?.stale && <div className="market-stale" role="status">Showing previously retrieved records while the source is unavailable. The source retrieval time above and observation dates below are unchanged.</div>}
        <div className="market-table-wrap">
          <table className="prices-table market-data-table">
            <thead><tr><th>Observation date</th><th>Market / district / state</th><th>Commodity</th><th>Variety / grade</th><th>Minimum</th><th>Maximum</th><th>Modal</th></tr></thead>
            <tbody>{records.map((record, index) => <tr key={`${record.arrival_date}-${record.state}-${record.market}-${record.commodity}-${record.variety}-${index}`}>
              <td>{record.arrival_date}</td>
              <td><strong>{record.market}</strong><small>{record.district}, {record.state}</small></td>
              <td>{record.commodity}</td>
              <td>{record.variety}<small>{record.grade}</small></td>
              <td className="price-val">{money.format(Number(record.min_price))}</td>
              <td className="price-val">{money.format(Number(record.max_price))}</td>
              <td className="price-val">{money.format(Number(record.modal_price))}</td>
            </tr>)}</tbody>
          </table>
        </div>
        {records.length < total && <div className="market-load-more"><button className="btn-secondary" type="button" disabled={loadingMore} onClick={() => fetchRecords(filters, records.length, true)}>{loadingMore ? 'Loading…' : 'Load more observations'}</button></div>}
      </>}

      <footer className="market-source-note">
        <span>Source: <a href="https://www.data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi" target="_blank" rel="noreferrer">Ministry of Agriculture and Farmers Welfare, DMI / AGMARKNET via data.gov.in</a> · Resource 9ef84268-d588-465a-a308-a864a43d0070</span>
        <span>Price unit: ₹ per quintal, as shown in the official data.gov.in market app material. <a href="https://event.data.gov.in/wp-content/uploads/2016/03/Opendataapps_challenge_final.pdf" target="_blank" rel="noreferrer">View source material</a></span>
      </footer>
    </div>
  )
}

export default PricesSection
