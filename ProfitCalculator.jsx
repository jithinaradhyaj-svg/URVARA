import { useState } from 'react'
import { askGroq } from '../utils/groqAPI'
import { allCrops } from '../data/cropData'

function ProfitCalculator({ profile }) {
  const [form, setForm] = useState({
    crop: '',
    landSize: profile?.land || '',
    sellingPrice: '',
    costOfCultivation: '',
    expectedYield: '',
  })
  const [result, setResult] = useState(null)
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const calculate = () => {
    const land = parseFloat(form.landSize) || 1
    const price = parseFloat(form.sellingPrice) || 0
    const cost = parseFloat(form.costOfCultivation) || 0
    const yield_ = parseFloat(form.expectedYield) || 0

    const totalRevenue = price * yield_ * land
    const totalCost = cost * land
    const totalProfit = totalRevenue - totalCost
    const profitPerAcre = totalProfit / land
    const roi = totalCost > 0 ? ((totalProfit / totalCost) * 100).toFixed(1) : 0
    const breakEven = price > 0 ? (totalCost / price).toFixed(0) : 0

    setResult({ totalRevenue, totalCost, totalProfit, profitPerAcre, roi, breakEven, land })
  }

  const getAiAnalysis = async () => {
  if (!form.crop) {
    alert('Please enter a crop name first!')
    return
  }
  setLoading(true)
  setAiAnalysis('')
  try {
    const messages = [{
      role: 'user',
      content: `I need a detailed profit analysis for growing ${form.crop}.
Farm details:
- Land size: ${form.landSize || 'Not specified'} acres
- Location: ${profile?.district || 'Unknown'}, ${profile?.state || 'India'}
- Soil type: ${profile?.soil || 'Unknown'}
- Water source: ${profile?.water || 'Unknown'}
- Selling price entered: ₹${form.sellingPrice || 'Not entered'}/kg
- Expected yield entered: ${form.expectedYield || 'Not entered'} kg/acre
- Cost of cultivation entered: ₹${form.costOfCultivation || 'Not entered'}/acre

Please provide:
1. Is my profit estimate realistic for my region? Why or why not?
2. Do not invent a current market price. No verified market feed is connected; state that current local prices must be checked with a mandi.
3. Realistic yield range for ${form.crop} with ${profile?.soil || 'average'} soil
4. Realistic cost of cultivation per acre for ${form.crop}
5. Top 3 ways to increase yield and reduce costs specifically for ${form.crop}
6. General seasonal harvest and selling considerations for ${form.crop}; do not present them as a verified price forecast.
7. Risk factors that could reduce profit
8. Two alternative crops that could give better profit on my land`
    }]
    const reply = await askGroq(messages, profile, null)
    setAiAnalysis(reply)
  } catch (err) {
    setAiAnalysis(`Error: ${err.message}. Please check your Groq API key.`)
  }
  setLoading(false)
}

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)
  }

  return (
    <div className="section-inner">
      <h2 className="section-title">Profit Calculator</h2>
      <p className="section-subtitle">Calculate expected profit and get AI analysis for any crop</p>

      <div className="form-grid" style={{ marginBottom: '1.2rem' }}>
        <div className="field">
          <label>Crop Name</label>
          <input
            name="crop"
            list="crop-list"
            placeholder="e.g. Tomato, Wheat, Rice..."
            value={form.crop}
            onChange={handleChange}
          />
          <datalist id="crop-list">
            {allCrops.map((c, index) => <option key={`${c.name}-${index}`} value={c.name} />)}
          </datalist>
        </div>
        <div className="field">
          <label>Land Size (acres)</label>
          <input
            name="landSize"
            type="number"
            placeholder="e.g. 2"
            value={form.landSize}
            onChange={handleChange}
          />
        </div>
        <div className="field">
          <label>Expected Selling Price (₹/kg)</label>
          <input
            name="sellingPrice"
            type="number"
            placeholder="e.g. 20"
            value={form.sellingPrice}
            onChange={handleChange}
          />
        </div>
        <div className="field">
          <label>Expected Yield (kg/acre)</label>
          <input
            name="expectedYield"
            type="number"
            placeholder="e.g. 8000"
            value={form.expectedYield}
            onChange={handleChange}
          />
        </div>
        <div className="field">
          <label>Cost of Cultivation (₹/acre)</label>
          <input
            name="costOfCultivation"
            type="number"
            placeholder="e.g. 15000"
            value={form.costOfCultivation}
            onChange={handleChange}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={calculate}>
          💰 Calculate Profit
        </button>
        <button className="btn-gold" onClick={getAiAnalysis} disabled={loading || !form.crop}>
          {loading ? '⏳ Analyzing...' : '🤖 Get AI Analysis'}
        </button>
      </div>

      {result && (
        <div className="profit-hero">
          <div className="profit-amount">
            {formatCurrency(result.totalProfit)}
          </div>
          <div className="profit-label">
            Expected Net Profit for {result.land} acre{result.land > 1 ? 's' : ''}
            {result.totalProfit < 0 ? ' ⚠️ Loss!' : ' ✅'}
          </div>
          <div className="profit-breakdown">
            <div className="breakdown-item">
              <div className="breakdown-val">{formatCurrency(result.totalRevenue)}</div>
              <div className="breakdown-label">Total Revenue</div>
            </div>
            <div className="breakdown-item">
              <div className="breakdown-val">{formatCurrency(result.totalCost)}</div>
              <div className="breakdown-label">Total Cost</div>
            </div>
            <div className="breakdown-item">
              <div className="breakdown-val">{result.roi}%</div>
              <div className="breakdown-label">Return on Investment</div>
            </div>
            <div className="breakdown-item">
              <div className="breakdown-val">{formatCurrency(result.profitPerAcre)}</div>
              <div className="breakdown-label">Profit Per Acre</div>
            </div>
            <div className="breakdown-item">
              <div className="breakdown-val">{result.breakEven} kg</div>
              <div className="breakdown-label">Break-even Yield</div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-box">🤖 Analyzing profit potential for {form.crop}...</div>
      )}

      {aiAnalysis && !loading && (
        <div className="result-box">
          <div className="result-title">🤖 AI Profit Analysis — {form.crop}</div>
          {aiAnalysis}
        </div>
      )}
    </div>
  )
}

export default ProfitCalculator 
