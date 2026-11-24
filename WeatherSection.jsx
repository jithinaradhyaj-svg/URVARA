import { useState, useEffect } from 'react'
import { getCoordinates, getWeather, getForecast, getWeatherIcon, getFarmingAdvisory } from '../utils/weatherAPI'
import { askGroq } from '../utils/groqAPI'

function WeatherSection({ profile, weatherData, onWeatherFetched }) {
  const [loading, setLoading] = useState(false)
  const [forecast, setForecast] = useState([])
  const [advisory, setAdvisory] = useState([])
  const [aiAdvisory, setAiAdvisory] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile) fetchWeather()
  }, [profile])

  const fetchWeather = async () => {
    if (!profile?.district || !profile?.state) return
    setLoading(true)
    setError('')
    try {
      const coords = await getCoordinates(profile.district, profile.state)
      const weather = await getWeather(coords.lat, coords.lon)
      const forecastData = await getForecast(coords.lat, coords.lon)
      onWeatherFetched(weather)
      setForecast(forecastData)
      setAdvisory(getFarmingAdvisory(weather))
    } catch (err) {
      setError(`Could not fetch weather: ${err.message}. Try updating district name in profile.`)
    }
    setLoading(false)
  }

  const fetchAIAdvisory = async () => {
    if (!weatherData) return
    setAiLoading(true)
    setAiAdvisory('')
    try {
      const reply = await askGroq([{
        role: 'user',
        content: `Weather in ${profile.district}, ${profile.state}: ${weatherData.temperature}°C, ${weatherData.condition}, Humidity ${weatherData.humidity}%, Wind ${weatherData.wind} km/h.
Give me a SHORT farming advisory — 5 bullet points max. What should I do on my farm today? Irrigation, spraying, any warnings?`
      }], profile, weatherData)
      setAiAdvisory(reply)
    } catch (err) {
      setAiAdvisory('Rate limit reached. Please try again in a minute.')
    }
    setAiLoading(false)
  }

  const getWeatherBg = (code) => {
    if (code === 0) return 'linear-gradient(135deg, #8B6914, #C4873A)'
    if (code <= 3) return 'linear-gradient(135deg, #4A3728, #6B4F3A)'
    if (code <= 69) return 'linear-gradient(135deg, #2C3E50, #4A5568)'
    return 'linear-gradient(135deg, #2C2416, #4A3728)'
  }

  if (!profile) {
    return (
      <div className="section-inner">
        <div className="no-profile-box">
          <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.5 19a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z"/>
              <path d="M9 17H5a4 4 0 0 1 0-8 5 5 0 0 1 9.8-1"/>
            </svg>
          </div>
          <div className="no-profile-title">Set up your farm profile first</div>
          <div className="no-profile-sub">We need your location to fetch accurate weather data</div>
        </div>
      </div>
    )
  }

  return (
    <div className="section-inner">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 className="section-title">Weather & Farm Advisory</h2>
          <p className="section-subtitle" style={{ margin: 0 }}>Live weather for {profile.district}, {profile.state}</p>
        </div>
        <button className="btn-primary" onClick={fetchWeather} disabled={loading}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          {loading ? 'Fetching...' : 'Refresh Weather'}
        </button>
      </div>

      {error && (
        <div style={{ background: 'var(--danger-bg)', border: '1px solid #E8C4C0', borderRadius: 'var(--r-md)', padding: '1rem', marginBottom: '1rem', color: 'var(--danger)', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {loading && <div className="loading-box">Fetching live weather for {profile.district}, {profile.state}...</div>}

      {weatherData && !loading && (
        <>
          <div style={{ background: getWeatherBg(weatherData.code), borderRadius: 'var(--r-xl)', padding: '2rem', color: 'white', marginBottom: '1.5rem', boxShadow: 'var(--shadow-lg)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-100px', right: '-50px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(184,80,66,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ zIndex: 1 }}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '72px', fontWeight: '700', lineHeight: 1 }}>
                  {weatherData.temperature}°C
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', marginTop: '6px', opacity: 0.9 }}>
                  {weatherData.condition}
                </div>
                <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '4px' }}>
                  {profile.district}, {profile.state}
                </div>
                <div style={{ fontSize: '13px', opacity: 0.6, marginTop: '2px' }}>
                  Feels like {weatherData.feelsLike}°C
                </div>
              </div>
              <div style={{ fontSize: '80px', zIndex: 1, lineHeight: 1 }}>
                {getWeatherIcon(weatherData.code)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', zIndex: 1, position: 'relative' }}>
              {[
                { label: `Humidity: ${weatherData.humidity}%` },
                { label: `Wind: ${weatherData.wind} km/h` },
                weatherData.precipitation > 0 ? { label: `Rain: ${weatherData.precipitation}mm` } : null
              ].filter(Boolean).map((item, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', padding: '8px 16px', borderRadius: 'var(--r-md)', fontSize: '13px', fontWeight: '600' }}>
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {forecast.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>7-Day Forecast</h3>
              <div className="forecast-grid">
                {forecast.map((day, i) => (
                  <div key={i} className="forecast-card">
                    <div className="forecast-date">{day.date}</div>
                    <div className="forecast-icon">{getWeatherIcon(day.code)}</div>
                    <div className="forecast-temps">{day.max}° / {day.min}°</div>
                    {day.rain > 0 && <div className="forecast-rain">{day.rain}mm</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {advisory.length > 0 && (
            <div className="advisory-box" style={{ marginBottom: '1.5rem' }}>
              <div className="advisory-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4M12 16h.01"/>
                </svg>
                Quick Farm Advisory
              </div>
              <div className="advisory-list">
                {advisory.map((item, i) => (
                  <div key={i} className="advisory-item">
                    <span style={{ color: 'var(--primary)', fontWeight: '700' }}>•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn-gold" onClick={fetchAIAdvisory} disabled={aiLoading}>
              {aiLoading ? 'Getting advisory...' : 'Get AI Farm Advisory'}
            </button>
          </div>

          {aiLoading && <div className="loading-box">Generating AI farm advisory...</div>}

          {aiAdvisory && !aiLoading && (
            <div className="advisory-box">
              <div className="advisory-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/>
                  <path d="M12 16v-4M12 8h.01"/>
                </svg>
                AI Detailed Advisory
              </div>
              <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.8', color: 'var(--text-primary)' }}>
                {aiAdvisory}
              </div>
            </div>
          )}
        </>
      )}

      {!weatherData && !loading && !error && (
        <div className="no-profile-box">
          <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.5 19a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z"/>
              <path d="M9 17H5a4 4 0 0 1 0-8 5 5 0 0 1 9.8-1"/>
            </svg>
          </div>
          <div className="no-profile-title">No weather data yet</div>
          <div className="no-profile-sub">Click Refresh Weather to load live data for your farm</div>
        </div>
      )}
    </div>
  )
}

export default WeatherSection