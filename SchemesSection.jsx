import { useState } from 'react'
import { askGroq } from '../utils/groqAPI'

const schemes = [
  {
    icon: '💰',
    name: 'PM-KISAN',
    benefit: '₹6,000/year direct income support',
    desc: 'Pradhan Mantri Kisan Samman Nidhi — ₹2,000 every 4 months directly to your bank account. All small and marginal farmers with less than 2 hectares are eligible.',
    apply: 'Apply at pmkisan.gov.in or your nearest Common Service Centre (CSC)',
    eligibility: 'All landholding farmers with cultivable land'
  },
  {
    icon: '🛡️',
    name: 'PMFBY — Crop Insurance',
    benefit: 'Insure your crop against losses',
    desc: 'Pradhan Mantri Fasal Bima Yojana — protects against crop loss due to natural calamities, pests, diseases. Premium is only 1.5-2% for Rabi, 2% for Kharif crops.',
    apply: 'Apply through your bank, CSC, or insurance company before sowing deadline',
    eligibility: 'All farmers growing notified crops in notified areas'
  },
  {
    icon: '📋',
    name: 'MSP — Minimum Support Price',
    benefit: 'Guaranteed minimum price for your crop',
    desc: 'Government guarantees a minimum price for 23 crops. If market prices fall below MSP, government buys at MSP through procurement agencies.',
    apply: 'Register at your nearest APMC mandi or e-NAM platform',
    eligibility: 'All farmers growing MSP-notified crops'
  },
  {
    icon: '💳',
    name: 'Kisan Credit Card (KCC)',
    benefit: 'Low interest loans up to ₹3 lakh at 4% interest',
    desc: 'Get agricultural loans at just 4% interest rate per year (with interest subvention). Use for seeds, fertilizers, pesticides, and farm equipment.',
    apply: 'Apply at any nationalized bank, cooperative bank, or RRB',
    eligibility: 'All farmers, tenant farmers, and sharecroppers'
  },
  {
    icon: '💧',
    name: 'PM Krishi Sinchai Yojana',
    benefit: 'Subsidy on irrigation equipment',
    desc: 'Get up to 55% subsidy on drip and sprinkler irrigation systems. Saves water and increases yield significantly.',
    apply: 'Apply through your state agriculture department or horticulture department',
    eligibility: 'All farmers, priority to small and marginal farmers'
  },
  {
    icon: '🌱',
    name: 'Soil Health Card Scheme',
    benefit: 'Free soil testing and fertilizer advice',
    desc: 'Get your soil tested for free and receive a Soil Health Card with crop-wise fertilizer recommendations. Helps save money on fertilizers.',
    apply: 'Contact your nearest Krishi Vigyan Kendra (KVK) or agriculture office',
    eligibility: 'All farmers'
  },
  {
    icon: '🏪',
    name: 'eNAM — Online Mandi',
    benefit: 'Sell crops online at better prices',
    desc: 'National Agriculture Market — sell your produce online to buyers across India. Get better prices by reaching more buyers without middlemen.',
    apply: 'Register at enam.gov.in or through your local APMC mandi',
    eligibility: 'All farmers with produce to sell'
  },
  {
    icon: '🌾',
    name: 'National Food Security Mission',
    benefit: 'Free seeds and technology support',
    desc: 'Get high-yield variety seeds, improved technologies, and extension services for rice, wheat, pulses, coarse cereals, and commercial crops.',
    apply: 'Contact your district agriculture officer or block agriculture office',
    eligibility: 'Farmers in identified districts'
  },
]

function SchemesSection({ profile }) {
  const [selectedScheme, setSelectedScheme] = useState(null)
  const [aiHelp, setAiHelp] = useState('')
  const [loading, setLoading] = useState(false)

  const getSchemeHelp = async (scheme) => {
    setSelectedScheme(scheme)
    setLoading(true)
    setAiHelp('')
    try {
      const reply = await askGroq([{
        role: 'user',
        content: `Tell me everything about ${scheme.name} scheme for a farmer in ${profile?.district || 'India'}, ${profile?.state || ''}.
Include:
1. Am I eligible based on my profile?
2. Exact benefit amount
3. Step by step application process
4. Documents needed
5. Deadline if any
6. Contact number or website
7. Common mistakes to avoid when applying`
      }], profile, null)
      setAiHelp(reply)
    } catch (err) {
      setAiHelp('Error fetching scheme details. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="section-inner">
      <h2 className="section-title">Government Schemes</h2>
      <p className="section-subtitle">Click any scheme to get detailed eligibility and application help</p>

      <div style={{ display: 'grid', gap: '12px' }}>
        {schemes.map((scheme, i) => (
          <div
            key={i}
            className="scheme-card"
            onClick={() => getSchemeHelp(scheme)}
            style={{ borderColor: selectedScheme?.name === scheme.name ? 'var(--primary)' : 'var(--green-border)' }}
          >
            <div className="scheme-header">
              <div className="scheme-icon">{scheme.icon}</div>
              <div>
                <div className="scheme-name">{scheme.name}</div>
                <div className="scheme-benefit">{scheme.benefit}</div>
              </div>
            </div>
            <div className="scheme-desc">{scheme.desc}</div>
            <div className="scheme-apply">How to apply: {scheme.apply}</div>
          </div>
        ))}
      </div>

      {(loading || aiHelp) && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary)', marginBottom: '1rem' }}>
            AI Help — {selectedScheme?.name}
          </h3>
          {loading ? (
            <div className="loading-box">Getting personalized scheme information...</div>
          ) : (
            <div className="result-box">
              <div className="result-title">{selectedScheme?.name} — Detailed Guide</div>
              {aiHelp}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SchemesSection