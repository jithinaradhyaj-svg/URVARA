import { useState, useRef } from 'react'
import { askGroq } from '../utils/groqAPI'
import { findKnownVarietyConflict, formatFarmClarification, getMissingFarmDetails } from '../data/agronomyReferences'

const supportedLanguages = [
  { code: 'en-IN', label: 'English', name: 'English' },
  { code: 'hi-IN', label: 'हिंदी', name: 'Hindi' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ', name: 'Kannada' },
  { code: 'ta-IN', label: 'தமிழ்', name: 'Tamil' },
  { code: 'te-IN', label: 'తెలుగు', name: 'Telugu' },
  { code: 'mr-IN', label: 'मराठी', name: 'Marathi' },
  { code: 'pa-IN', label: 'ਪੰਜਾਬੀ', name: 'Punjabi' },
  { code: 'gu-IN', label: 'ગુજરાતી', name: 'Gujarati' },
  { code: 'ml-IN', label: 'മലയാളം', name: 'Malayalam' },
  { code: 'bn-IN', label: 'বাংলা', name: 'Bengali' },
]

function VoiceAdvisor({ profile }) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedLang, setSelectedLang] = useState('en-IN')
  const [supported] = useState(() => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  const [speaking, setSpeaking] = useState(false)
  const [history, setHistory] = useState([])
  const recognitionRef = useRef(null)
  const transcriptRef = useRef('')

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = selectedLang
    recognition.continuous = false
    recognition.interimResults = true
    transcriptRef.current = ''
    setTranscript('')

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (event) => {
      const current = Array.from(event.results)
        .map(r => r[0].transcript)
        .join('')
      transcriptRef.current = current
      setTranscript(current)
    }

    recognition.onend = () => {
      setIsListening(false)
      if (transcriptRef.current.trim()) askQuestion(transcriptRef.current)
    }

    recognition.onerror = (event) => {
      setIsListening(false)
      if (event.error === 'not-allowed') {
        alert('Microphone permission denied. Please allow microphone access.')
      }
    }

    recognition.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  const askQuestion = async (text) => {
    if (!text.trim()) return
    setLoading(true)
    setResponse('')
    const langName = supportedLanguages.find(l => l.code === selectedLang)?.name || 'English'
    const varietyConflict = findKnownVarietyConflict(text)
    const missingDetails = getMissingFarmDetails(text, profile)
    if (varietyConflict || missingDetails.length) {
      const answer = varietyConflict
        ? `${varietyConflict.answer}\n\nSources: ${varietyConflict.sources.map(source => `${source.sourceName}: ${source.sourceUrl}`).join(' | ')}`
        : formatFarmClarification(missingDetails, langName)
      setResponse(answer)
      setHistory(prev => [{ question: text, answer, lang: langName }, ...prev.slice(0, 9)])
      setLoading(false)
      return
    }
    try {
      const reply = await askGroq([{
        role: 'user',
        content: `[RESPOND IN ${langName.toUpperCase()} ONLY]\n\nFarmer's voice question: ${text}\n\nGive a SHORT, clear answer in ${langName}. Max 3-4 sentences. Simple language.`
      }], profile, null)
      setResponse(reply)
      setHistory(prev => [{ question: text, answer: reply, lang: langName }, ...prev.slice(0, 9)])
      speakResponse(reply, selectedLang)
    } catch (err) {
      setResponse(`Could not get an answer: ${err.message}`)
    }
    setLoading(false)
  }

  const speakResponse = (text, lang) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.9
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }

  const askTyped = () => {
    if (transcript.trim()) askQuestion(transcript)
  }

  return (
    <div className="section-inner">
      <h2 className="section-title">Voice Advisor</h2>
      <p className="section-subtitle">Ask farming questions by speaking in your language — AI responds in the same language</p>

      {!supported && (
        <div style={{ background: 'var(--warning-bg)', border: '1.5px solid #E8D5A0', borderRadius: 'var(--r-md)', padding: '1rem', marginBottom: '1rem', color: 'var(--warning)', fontSize: '14px' }}>
          ⚠️ Voice input is not supported in your browser. Please use Google Chrome for voice features. You can still type your question below.
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.5rem', padding: '12px', background: 'var(--green-bg)', borderRadius: 'var(--r-md)', border: '1px solid var(--green-border)' }}>
        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', alignSelf: 'center' }}>Language:</span>
        {supportedLanguages.map(lang => (
          <button key={lang.code} onClick={() => setSelectedLang(lang.code)} style={{
            padding: '5px 12px', borderRadius: '20px',
            border: '1.5px solid var(--green-border)',
            background: selectedLang === lang.code ? 'var(--primary)' : 'white',
            color: selectedLang === lang.code ? 'white' : 'var(--text-secondary)',
            fontSize: '12px', fontWeight: '600', cursor: 'pointer',
            fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'all 0.2s'
          }}>
            {lang.label}
          </button>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={!supported || loading}
          style={{
            width: '100px', height: '100px', borderRadius: '50%',
            border: 'none', cursor: supported ? 'pointer' : 'not-allowed',
            background: isListening
              ? 'linear-gradient(135deg, var(--danger), #E57373)'
              : 'linear-gradient(135deg, var(--primary), var(--primary-light))',
            color: 'white', transition: 'all 0.2s',
            boxShadow: isListening ? '0 0 0 12px rgba(184,80,66,0.2)' : 'var(--shadow-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto'
          }}
        >
          {isListening ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <rect x="6" y="4" width="4" height="16" rx="2"/><rect x="14" y="4" width="4" height="16" rx="2"/>
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
            </svg>
          )}
        </button>
        <div style={{ marginTop: '12px', fontSize: '14px', color: isListening ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '600' }}>
          {isListening ? 'Listening... tap to stop' : 'Tap to speak'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
        <input
          value={transcript}
          onChange={e => setTranscript(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && askTyped()}
          placeholder="Or type your question here..."
          style={{
            flex: 1, padding: '11px 14px', borderRadius: 'var(--r-sm)',
            border: '1.5px solid var(--green-border)', fontSize: '14px',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            background: 'var(--green-bg)', color: 'var(--text-primary)', outline: 'none'
          }}
          onFocus={e => e.target.style.borderColor = 'var(--primary)'}
          onBlur={e => e.target.style.borderColor = 'var(--green-border)'}
        />
        <button className="btn-primary" onClick={askTyped} disabled={loading || !transcript.trim()}>
          {loading ? '...' : 'Ask'}
        </button>
      </div>

      {loading && <div className="loading-box">Getting your answer...</div>}

      {response && !loading && (
        <div style={{ background: 'var(--green-bg)', border: '1.5px solid var(--green-border)', borderRadius: 'var(--r-lg)', padding: '1.4rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Answer
            </div>
            <button
              onClick={speaking ? stopSpeaking : () => speakResponse(response, selectedLang)}
              style={{ background: 'none', border: '1.5px solid var(--green-border)', borderRadius: 'var(--r-sm)', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: speaking ? 'var(--primary)' : 'var(--text-secondary)', fontFamily: 'Plus Jakarta Sans, sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {speaking ? (
                  <><rect x="6" y="4" width="4" height="16" rx="2"/><rect x="14" y="4" width="4" height="16" rx="2"/></>
                ) : (
                  <><polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5"/><path d="M15.54,8.46a5,5,0,0,1,0,7.07M19.07,4.93a10,10,0,0,1,0,14.14"/></>
                )}
              </svg>
              {speaking ? 'Stop' : 'Read aloud'}
            </button>
          </div>
          <div style={{ fontSize: '15px', lineHeight: '1.8', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
            {response}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Recent Questions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.map((item, i) => (
              <div key={i} style={{ background: 'white', border: '1.5px solid var(--green-border)', borderRadius: 'var(--r-md)', padding: '12px 16px', cursor: 'pointer' }}
                onClick={() => { setTranscript(item.question); setResponse(item.answer) }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>{item.question}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.lang} • Click to view answer</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default VoiceAdvisor
