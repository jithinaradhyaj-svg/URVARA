import { useState, useRef, useEffect } from 'react'
import { Mic } from 'lucide-react'
import { askGroq } from '../utils/groqAPI'
import { findCropReferences, findKnownVarietyConflict, formatFarmClarification, getMissingFarmDetails } from '../data/agronomyReferences'
import VoiceAdvisor from './VoiceAdvisor'

const quickQuestions = [
  'Which crop should I grow this season for maximum profit?',
  'My crop leaves are turning yellow. What disease is this?',
  'What is the current market price for tomato in my district?',
  'What government schemes am I eligible for?',
  'How do I grow onions step by step?',
  'When should I sell my harvest for best price?',
  'What fertilizer should I use for my soil type?',
  'How much water does rice need per acre?',
]

const languages = [
  { code: 'English', label: 'English' },
  { code: 'Hindi', label: 'हिंदी' },
  { code: 'Kannada', label: 'ಕನ್ನಡ' },
  { code: 'Tamil', label: 'தமிழ்' },
  { code: 'Telugu', label: 'తెలుగు' },
  { code: 'Marathi', label: 'मराठी' },
  { code: 'Punjabi', label: 'ਪੰਜਾਬੀ' },
  { code: 'Bengali', label: 'বাংলা' },
  { code: 'Gujarati', label: 'ગુજરાતી' },
  { code: 'Malayalam', label: 'മലയാളം' },
]

function ChatAdvisor({ profile, weatherData, onNeedProfile }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Namaste! 🌱 I am URVARA — your farming intelligence advisor.\n\nI can help you with:\n• Crop selection & profit estimates for your district\n• Disease diagnosis & treatment advice\n• Market guidance and selling decisions (verify current rates locally)\n• Step-by-step farming guides\n• Government schemes & subsidies\n• Weather-based farm advisory\n• Fertilizer & irrigation planning\n\n${profile ? `I can see your farm is in ${profile.district}, ${profile.state}. Ask me anything!` : 'Set up your farm profile in the My Farm section for location-specific advice, or ask me anything directly!'}`,
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [language, setLanguage] = useState(profile?.language || 'English')
  const [voiceOpen, setVoiceOpen] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const buildApiMessages = (msgs, lang) => {
    const apiMessages = msgs.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }))

    if (lang !== 'English') {
      const langInstruction = `[SYSTEM LANGUAGE OVERRIDE: You MUST respond ONLY in ${lang}. Every word of your response must be in ${lang}. Do not use English at all. This is mandatory.]`
      apiMessages[apiMessages.length - 1] = {
        role: 'user',
        content: langInstruction + '\n\n' + apiMessages[apiMessages.length - 1].content + `\n\n[Respond in ${lang} only. Not English.]`
      }
    }

    return apiMessages
  }

  const sendMessage = async (text) => {
    const userText = text || input.trim()
    if (!userText || loading) return

    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    const userMsg = { role: 'user', content: userText }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setLoading(true)

    setMessages([...updatedMessages, {
      role: 'assistant',
      content: language !== 'English'
        ? `${language} में जवाब तैयार हो रहा है...`
        : '🌱 Analyzing your query with farm data...',
      thinking: true
    }])

    try {
      const varietyConflict = findKnownVarietyConflict(userText)
      if (varietyConflict) {
        setMessages([...updatedMessages, { role: 'assistant', content: varietyConflict.answer, sources: varietyConflict.sources }])
        setLoading(false)
        return
      }
      const missingDetails = getMissingFarmDetails(userText, profile)
      if (missingDetails.length) {
        const clarification = formatFarmClarification(missingDetails, language)
        setMessages([...updatedMessages, { role: 'assistant', content: clarification }])
        setLoading(false)
        return
      }
      const apiMessages = buildApiMessages(updatedMessages, language)
      const reply = await askGroq(apiMessages, profile, weatherData)
      setMessages([...updatedMessages, { role: 'assistant', content: reply, sources: findCropReferences(userText) }])
    } catch (err) {
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: `⚠️ ${err.message}`
      }])
    }
    setLoading(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    if (lang !== 'English') {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: lang === 'Hindi' ? 'ठीक है! अब मैं हिंदी में जवाब दूंगा। आप क्या जानना चाहते हैं?' :
          lang === 'Kannada' ? 'ಸರಿ! ಈಗ ನಾನು ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸುತ್ತೇನೆ. ನಿಮಗೆ ಏನು ತಿಳಿಯಬೇಕು?' :
          lang === 'Tamil' ? 'சரி! இப்போது நான் தமிழில் பதில் அளிப்பேன். நீங்கள் என்ன தெரிந்துகொள்ள விரும்புகிறீர்கள்?' :
          lang === 'Telugu' ? 'సరే! ఇప్పుడు నేను తెలుగులో జవాబు ఇస్తాను. మీకు ఏమి తెలుసుకోవాలి?' :
          lang === 'Marathi' ? 'ठीक आहे! आता मी मराठीत उत्तर देईन. तुम्हाला काय जाणून घ्यायचे आहे?' :
          lang === 'Punjabi' ? 'ਠੀਕ ਹੈ! ਹੁਣ ਮੈਂ ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦੇਵਾਂਗਾ। ਤੁਸੀਂ ਕੀ ਜਾਣਨਾ ਚਾਹੁੰਦੇ ਹੋ?' :
          lang === 'Bengali' ? 'ঠিক আছে! এখন আমি বাংলায় উত্তর দেব। আপনি কি জানতে চান?' :
          lang === 'Gujarati' ? 'ઠીક છે! હવે હું ગુજરાતીમાં જવાબ આપીશ. તમે શું જાણવા માંગો છો?' :
          lang === 'Malayalam' ? 'ശരി! ഇനി ഞാൻ മലയാളത്തിൽ മറുപടി നൽകും. നിങ്ങൾക്ക് എന്ത് അറിയണം?' :
          `Now responding in ${lang}.`
      }])
    }
  }

  return (
    <div className="chat-wrap">
      {!profile && <div className="chat-profile-prompt"><span>Personalize URVARA with your farm location and growing conditions.</span><button onClick={onNeedProfile}>Set up my farm</button></div>}
      <div className="advisor-actions"><span>Ask by text or voice</span><button className="btn-secondary" onClick={() => setVoiceOpen(open => !open)}><Mic size={15}/> {voiceOpen ? 'Close voice advisor' : 'Use voice'}</button></div>
      {voiceOpen && <div className="advisor-voice-panel"><VoiceAdvisor profile={profile}/></div>}
      <div className="lang-bar">
        <span className="lang-label">Language:</span>
        {languages.map(lang => (
          <button
            key={lang.code}
            className={`lang-btn ${language === lang.code ? 'active' : ''}`}
            onClick={() => handleLanguageChange(lang.code)}
          >
            {lang.label}
          </button>
        ))}
      </div>

      <div className="quick-questions">
        {quickQuestions.map((q, i) => (
          <button key={i} className="quick-q" onClick={() => sendMessage(q)}>
            {q}
          </button>
        ))}
      </div>

      <div className="messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`msg-wrap ${msg.role === 'user' ? 'user' : msg.thinking ? 'thinking' : 'bot'}`}
          >
            <div className="msg-bubble">{msg.content}
              {msg.sources?.length > 0 && <div className="advisor-sources"><strong>Crop references</strong>{msg.sources.map(source => <a key={source.id} href={source.sourceUrl} target="_blank" rel="noreferrer">{source.sourceName}</a>)}</div>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="input-box">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={
            language === 'Hindi' ? 'फसल, बीमारी, बाजार भाव के बारे में पूछें...' :
            language === 'Kannada' ? 'ಬೆಳೆ, ರೋಗ, ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ಬಗ್ಗೆ ಕೇಳಿ...' :
            language === 'Tamil' ? 'பயிர், நோய், சந்தை விலை பற்றி கேளுங்கள்...' :
            language === 'Telugu' ? 'పంట, వ్యాధి, మార్కెట్ ధర గురించి అడగండి...' :
            language === 'Marathi' ? 'पीक, रोग, बाजारभाव बद्दल विचारा...' :
            'Ask about crops, diseases, market prices, schemes, weather...'
          }
          rows={1}
          disabled={loading}
          onInput={e => {
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
          }}
        />
        <button className="send-btn" onClick={() => sendMessage()} disabled={loading}>
          {loading ? '...' : 'Send ↗'}
        </button>
      </div>
      <p className="chat-disclaimer">
        Estimates are advisory only. Always verify with your local KVK or APMC mandi before major decisions.
      </p>
    </div>
  )
}

export default ChatAdvisor
