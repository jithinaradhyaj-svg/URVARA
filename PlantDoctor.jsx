import { useState } from 'react'
import { askGroq, analyzeImageWithGroq } from '../utils/groqAPI'

const commonSymptoms = [
  'Yellow leaves', 'Brown spots on leaves', 'Wilting plant', 'White powder on leaves',
  'Holes in leaves', 'Rotting roots', 'Curling leaves', 'Black spots on leaves',
  'Stunted growth', 'Leaf drop', 'Sticky residue on leaves', 'White insects under leaves',
  'Mosaic pattern on leaves', 'Brown edges on leaves', 'Pale green color',
  'Stem rot', 'Fruit rot', 'Root rot', 'Tip burn', 'Rust colored spots',
  'Grey mold on plant', 'Wilting despite watering', 'Purple colored leaves',
  'Yellowing between leaf veins', 'Scorched leaf tips', 'Distorted new growth'
]

const cropStages = [
  'Just sowed seeds',
  'Germination / Sprouting',
  'Seedling stage (0-30 days)',
  'Vegetative growth',
  'Flowering stage',
  'Fruiting / Pod formation',
  'Maturity / Pre-harvest',
  'Post harvest'
]

function PlantDoctor({ profile }) {
  const [tab, setTab] = useState('symptoms')
  const [cropName, setCropName] = useState('')
  const [cropStage, setCropStage] = useState('')
  const [symptomText, setSymptomText] = useState('')
  const [severityGuess, setSeverityGuess] = useState('')
  const [image, setImage] = useState(null)
  const [imageBase64, setImageBase64] = useState(null)
  const [imageMimeType, setImageMimeType] = useState('image/jpeg')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [followUp, setFollowUp] = useState('')
  const [followUpResult, setFollowUpResult] = useState('')
  const [followUpLoading, setFollowUpLoading] = useState(false)

  const addSymptom = (s) => {
    setSymptomText(prev => prev ? `${prev}, ${s}` : s)
  }

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large! Please use an image under 5MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImage(ev.target.result)
      setImageBase64(ev.target.result.split(',')[1])
      setImageMimeType(file.type || 'image/jpeg')
    }
    reader.readAsDataURL(file)
  }

  const diagnoseSymptoms = async () => {
    if (!symptomText && !cropName) {
      alert('Please enter crop name and describe symptoms!')
      return
    }
    setLoading(true)
    setResult('')
    setFollowUpResult('')
    try {
      const reply = await askGroq([{
        role: 'user',
        content: `PLANT DOCTOR DIAGNOSIS REQUEST:

Crop: ${cropName || 'Unknown — please identify based on symptoms'}
Crop Stage: ${cropStage || 'Not specified'}
Symptoms observed: ${symptomText}
Farmer estimated severity: ${severityGuess || 'Not specified'}
${profile ? `Farm location: ${profile.district}, ${profile.state}
Soil type: ${profile.soil}
Water source: ${profile.water}
Season: ongoing` : ''}

Please provide a COMPLETE and DETAILED diagnosis:

1. MOST LIKELY DISEASE/PEST (with confidence %)
   - Scientific name
   - Common name in India
   - Why this diagnosis fits the symptoms

2. ALTERNATIVE POSSIBILITIES
   - 2nd most likely (with confidence %)
   - 3rd most likely (with confidence %)

3. SEVERITY ASSESSMENT
   - Level: Mild / Moderate / Severe / Critical
   - How fast is it spreading?
   - Will it kill the crop if untreated?

4. IMMEDIATE ACTION (do this TODAY)
   - Most urgent step
   - What NOT to do

5. ORGANIC TREATMENT (try first)
   - Step by step application
   - Exact quantities and timing
   - Homemade remedies available in India
   - Cost per acre

6. CHEMICAL TREATMENT (if organic fails)
   - Chemical name (generic + brand names available in India)
   - Exact dosage: ml or grams per litre of water
   - Litres of spray per acre
   - Application timing: morning or evening
   - Frequency and number of sprays
   - Safety precautions
   - Do NOT mix with: (incompatible chemicals)
   - Cost per acre in INR

7. EXPECTED RECOVERY
   - Days to see improvement after treatment
   - Signs of recovery to look for
   - If no improvement in X days → do Y

8. SPREAD RISK
   - Is it contagious to nearby crops?
   - Which crops nearby are at risk?
   - How to prevent spread

9. PREVENTION FOR NEXT SEASON
   - Cultural practices
   - Resistant varieties to use
   - Pre-season treatment

10. SHOULD VISIT KVK?
    - Yes/No and why
    - Nearest KVK contact if needed`
      }], profile, null)
      setResult(reply)
    } catch (err) {
      setResult(`Error: ${err.message}. Please try again.`)
    }
    setLoading(false)
  }

  const diagnoseImage = async () => {
    if (!imageBase64) {
      alert('Please upload a plant photo first!')
      return
    }
    setLoading(true)
    setResult('')
    setFollowUpResult('')
    try {
      const reply = await analyzeImageWithGroq(imageBase64, cropName, profile, imageMimeType)
      setResult(reply)
    } catch (err) {
      setResult(`Error analyzing image: ${err.message}\n\nTips for better results:\n• Take photo in good lighting\n• Focus on the affected area\n• Include both healthy and affected parts\n• Try describing symptoms instead if image analysis fails`)
    }
    setLoading(false)
  }

  const askFollowUp = async () => {
    if (!followUp.trim() || !result) return
    setFollowUpLoading(true)
    setFollowUpResult('')
    try {
      const reply = await askGroq([
        {
          role: 'user',
          content: `I have a plant problem. Here is the diagnosis I received: ${result}`
        },
        {
          role: 'assistant',
          content: result
        },
        {
          role: 'user',
          content: followUp
        }
      ], profile, null)
      setFollowUpResult(reply)
    } catch (err) {
      setFollowUpResult(`Could not get an answer: ${err.message}`)
    }
    setFollowUpLoading(false)
  }

  return (
    <div className="section-inner">
      <h2 className="section-title">Plant Doctor</h2>
      <p className="section-subtitle">
        Advanced AI crop disease diagnosis — describe symptoms or upload a photo for instant treatment advice
      </p>

      <div className="doctor-tabs">
        <button
          className={`doctor-tab ${tab === 'symptoms' ? 'active' : ''}`}
          onClick={() => setTab('symptoms')}
        >
          📝 Describe Symptoms
        </button>
        <button
          className={`doctor-tab ${tab === 'photo' ? 'active' : ''}`}
          onClick={() => setTab('photo')}
        >
          📸 Upload Photo
        </button>
      </div>

      <div className="form-grid" style={{ marginBottom: '1rem' }}>
        <div className="field">
          <label>Crop Name</label>
          <input
            placeholder="e.g. Tomato, Rice, Cotton, Wheat..."
            value={cropName}
            onChange={e => setCropName(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Crop Stage</label>
          <select value={cropStage} onChange={e => setCropStage(e.target.value)}>
            <option value="">Select crop stage</option>
            {cropStages.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {tab === 'symptoms' && (
        <>
          <div className="field" style={{ marginBottom: '1rem' }}>
            <label>Describe What You See in Detail</label>
            <textarea
              value={symptomText}
              onChange={e => setSymptomText(e.target.value)}
              placeholder="Describe everything you see — color changes, spots pattern, wilting pattern, insects visible, smell, texture changes, which part of plant is affected first, how fast it is spreading..."
              rows={5}
              style={{
                padding: '11px 14px',
                borderRadius: 'var(--r-sm)',
                border: '1.5px solid var(--green-border)',
                fontSize: '14px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                background: 'var(--green-bg)',
                color: 'var(--text-primary)',
                resize: 'vertical',
                outline: 'none',
                lineHeight: '1.6',
                transition: 'border-color 0.2s',
                width: '100%'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--green-border)'}
            />
          </div>

          <div className="field" style={{ marginBottom: '1.2rem' }}>
            <label>How bad does it look to you?</label>
            <select value={severityGuess} onChange={e => setSeverityGuess(e.target.value)}>
              <option value="">Select severity</option>
              <option>Just noticed it — very early stage</option>
              <option>Affecting a few plants</option>
              <option>Spreading to many plants</option>
              <option>More than half my crop is affected</option>
              <option>Almost entire crop is affected</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.2rem' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              Quick add symptoms:
            </p>
            <div className="symptom-tags">
              {commonSymptoms.map(s => (
                <button
                  key={s}
                  className="symptom-tag"
                  onClick={() => addSymptom(s)}
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginBottom: '1rem' }}
            onClick={diagnoseSymptoms}
            disabled={loading || (!symptomText && !cropName)}
          >
            {loading ? '🔬 Diagnosing...' : '🩺 Diagnose My Plant'}
          </button>
        </>
      )}

      {tab === 'photo' && (
        <>
          <div
            className="upload-zone"
            onClick={() => document.getElementById('plant-img').click()}
            style={{ marginBottom: '1rem' }}
          >
            {image ? (
              <img
                src={image}
                alt="Plant"
                style={{
                  maxWidth: '100%',
                  maxHeight: '350px',
                  borderRadius: 'var(--r-md)',
                  objectFit: 'contain'
                }}
              />
            ) : (
              <>
                <div className="upload-icon">📸</div>
                <div className="upload-title">Click to upload plant photo</div>
                <div className="upload-sub">
                  Take a clear photo of affected leaves, stem, or roots<br />
                  <strong>Tips:</strong> Good lighting • Focus on affected area • Include healthy part for comparison
                </div>
              </>
            )}
          </div>

          <input
            id="plant-img"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImage}
          />

          {image && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
              <button
                className="btn-primary"
                style={{ flex: 2, justifyContent: 'center' }}
                onClick={diagnoseImage}
                disabled={loading}
              >
                {loading ? '🔬 Analyzing photo...' : '🩺 Analyze This Photo'}
              </button>
              <button
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => { setImage(null); setImageBase64(null); setResult('') }}
              >
                Remove Photo
              </button>
            </div>
          )}

          <div style={{
            background: 'var(--green-bg)',
            border: '1.5px solid var(--green-border)',
            borderRadius: 'var(--r-md)',
            padding: '1rem',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: '1.6'
          }}>
            <strong>For best results:</strong> Upload a close-up of the affected leaf or stem. 
            If photo analysis is unclear, switch to Describe Symptoms tab for more accurate diagnosis.
          </div>
        </>
      )}

      {loading && (
        <div className="loading-box" style={{ marginTop: '1rem' }}>
          {tab === 'photo'
            ? '🔬 Analyzing plant photo with AI vision model...'
            : '🔬 Analyzing symptoms and cross-referencing with disease database...'}
        </div>
      )}

      {result && !loading && (
        <div style={{ marginTop: '1.5rem' }}>
          <div className="result-box">
            <div className="result-title">🩺 Diagnosis Result — {cropName || 'Unknown Crop'}</div>
            {result}
          </div>

          <div style={{
            background: 'var(--green-bg)',
            border: '1.5px solid var(--green-border)',
            borderRadius: 'var(--r-lg)',
            padding: '1.2rem',
            marginTop: '1rem'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)', marginBottom: '10px' }}>
              Have a follow-up question about this diagnosis?
            </h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                value={followUp}
                onChange={e => setFollowUp(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && askFollowUp()}
                placeholder="e.g. Where can I buy this medicine? Is it safe near my water source?"
                style={{
                  flex: 1, minWidth: '200px', padding: '10px 14px',
                  borderRadius: 'var(--r-sm)', border: '1.5px solid var(--green-border)',
                  fontSize: '14px', fontFamily: 'Plus Jakarta Sans, sans-serif',
                  background: 'white', color: 'var(--text-primary)', outline: 'none'
                }}
              />
              <button className="btn-primary" onClick={askFollowUp} disabled={followUpLoading || !followUp.trim()}>
                {followUpLoading ? '...' : 'Ask'}
              </button>
            </div>
            {followUpLoading && <div className="loading-box" style={{ marginTop: '1rem' }}>Getting answer...</div>}
            {followUpResult && !followUpLoading && (
              <div style={{ marginTop: '1rem', whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.8', color: 'var(--text-primary)' }}>
                {followUpResult}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PlantDoctor
