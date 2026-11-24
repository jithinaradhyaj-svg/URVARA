import { useEffect, useState } from 'react'
import { ArrowRight, BarChart3, BookOpen, CalendarDays, CircleHelp, CloudSun, Compass, CreditCard, Leaf, Lightbulb, MapPin, Menu, Sprout, Stethoscope, Store, Tractor, Wallet, Wheat } from 'lucide-react'
import './App.css'
import { getCurrentSeason } from './utils/groqAPI'
import { getCoordinates, getWeather } from './utils/weatherAPI'
import { readStoredFarmProfile, writeStoredFarmProfile } from './utils/farmStorage'
import ProfileSetup from './components/ProfileSetup'
import ChatAdvisor from './components/ChatAdvisor'
import WeatherSection from './components/WeatherSection'
import CropsSection from './components/CropsSection'
import PricesSection from './components/PricesSection'
import PlantDoctor from './components/PlantDoctor'
import SchemesSection from './components/SchemesSection'
import ProfitCalculator from './components/ProfitCalculator'
import BeginnerGuide from './components/BeginnerGuide'
import CropMaintenance from './components/CropMaintenance'
import CropRecords from './components/CropRecords'
import FarmPlots from './components/FarmPlots'
import CropCycles from './components/CropCycles'
import SeedGuide from './components/SeedGuide'
import CompanionPlanting from './components/CompanionPlanting'
import PriceChart from './components/PriceChart'
import CropCalendar from './components/CropCalendar'
import SoilAnalyzer from './components/SoilAnalyzer'
import ExpenseTracker from './components/ExpenseTracker'
import KVKFinder from './components/KVKFinder'

const groups = [
  { id: 'overview', label: 'Overview', icon: Compass, tools: [['overview', 'Farm overview'], ['weather', 'Weather']] },
  { id: 'farm', label: 'My Farm', icon: Tractor, tools: [['profile', 'Farm profile'], ['plots', 'Farm plots'], ['records', 'Crop records']] },
  { id: 'planning', label: 'Farm Planning', icon: CalendarDays, tools: [['cycles', 'Crop cycles'], ['calendar', 'Crop calendar'], ['crops', 'Crop library'], ['seeds', 'Seeds & breeds'], ['companion', 'Companion planting']] },
  { id: 'management', label: 'Crop Management', icon: Sprout, tools: [['maintenance', 'Crop care'], ['doctor', 'Plant doctor'], ['soil', 'Soil analyzer'], ['chat', 'AI advisor']] },
  { id: 'market', label: 'Market & Finance', icon: BarChart3, tools: [['prices', 'Mandi prices'], ['chart', 'Price trends'], ['expenses', 'Expenses'], ['profit', 'Profit calculator']] },
  { id: 'support', label: 'Knowledge & Support', icon: CircleHelp, tools: [['guide', 'Farmer guides'], ['kvk', 'Find a KVK'], ['schemes', 'Government schemes']] },
]
const toolLabels = Object.fromEntries(groups.flatMap(group => group.tools))
const money = value => `₹${Number(value || 0).toLocaleString('en-IN')}`
const readStored = key => {
  try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null }
}

function Overview({ profile, weatherData, weatherStatus, go, onRetryWeather }) {
  const storedRecords = readStored('kisaan_crop_records')
  const storedTransactions = readStored('kisaan_expenses')
  const records = Array.isArray(storedRecords) ? storedRecords.filter(record => record && typeof record === 'object') : []
  const transactions = Array.isArray(storedTransactions) ? storedTransactions.filter(item => item && typeof item === 'object') : []
  const activeCrops = records.filter(record => !record.sellingDate && record.crop)
  const validTransactions = transactions.filter(item => item.type === 'income' || item.type === 'expense')
  const expenseTotal = validTransactions.filter(item => item.type === 'expense').reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const incomeTotal = validTransactions.filter(item => item.type === 'income').reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const farmLocation = [profile?.district, profile?.state].filter(Boolean).join(', ')
  const priorities = [
    !profile && { title: 'Add your farm details to get local advice', action: 'Set up farm', tool: 'profile' },
    profile && !weatherData && { title: weatherStatus === 'error' ? 'Weather could not be loaded for your farm' : 'Check current weather for your farm', action: weatherStatus === 'error' ? 'Try again' : 'View weather', tool: 'weather' },
    profile && activeCrops.length === 0 && { title: 'Add a crop record to track your season', action: 'Add a crop', tool: 'records' },
  ].filter(Boolean)

  return <div className="overview-page">
    <section className="overview-hero">
      <div className="overview-hero-copy">
        <span className="eyebrow">{getCurrentSeason()}</span>
        <h1>{profile ? `Good to have you back${profile.name ? `, ${profile.name}` : ''}` : 'A clearer view of your farm'}</h1>
        <p>{profile ? `${farmLocation || 'Farm location incomplete'} · Your farm information and tools in one place.` : 'Set up your farm once to get advice that reflects your location, soil, and water.'}</p>
        <button className="hero-action" onClick={() => go(profile ? 'calendar' : 'profile')}>{profile ? 'Plan this season' : 'Set up my farm'} <ArrowRight size={16} /></button>
      </div>
      <div className="hero-mark" aria-hidden="true"><Wheat size={112} strokeWidth={1.1} /></div>
    </section>

    <section className="overview-metrics" aria-label="Farm summary">
      <article className="metric-card"><span className="metric-icon"><MapPin size={18}/></span><span className="metric-label">Farm location</span><strong>{profile ? farmLocation || 'Location incomplete' : 'Not set up'}</strong><small>{profile?.land ? `Land size: ${profile.land}` : 'Add your land size'}</small></article>
      <article className="metric-card"><span className="metric-icon"><CloudSun size={18}/></span><span className="metric-label">Current weather</span><strong>{weatherData ? `${weatherData.temperature}°C · ${weatherData.condition}` : weatherStatus === 'loading' ? 'Loading weather…' : weatherStatus === 'error' ? 'Weather unavailable' : 'No weather loaded'}</strong><small>{weatherData ? `Humidity ${weatherData.humidity}% · Wind ${weatherData.wind} km/h` : weatherStatus === 'error' ? 'Could not reach the weather service' : 'Weather appears after farm setup'}</small></article>
      <article className="metric-card"><span className="metric-icon"><Leaf size={18}/></span><span className="metric-label">Crops being tracked</span><strong>{activeCrops.length ? activeCrops.length : 'None yet'}</strong><small>{activeCrops.length ? activeCrops.map(item => item.crop).slice(0, 2).join(', ') : 'Add a crop record to begin'}</small></article>
      <article className="metric-card"><span className="metric-icon"><Wallet size={18}/></span><span className="metric-label">Recorded finances</span><strong>{validTransactions.length ? money(incomeTotal - expenseTotal) : 'No entries yet'}</strong><small>{validTransactions.length ? `${money(incomeTotal)} income · ${money(expenseTotal)} expenses` : 'Add income and expenses to track them'}</small></article>
    </section>

    <section className="overview-columns">
      <article className="overview-panel">
        <div className="panel-heading"><div><span className="eyebrow">Your next steps</span><h2>Farm priorities</h2></div><Lightbulb size={20}/></div>
        {priorities.length ? <div className="priority-list">{priorities.map(item => <button className="priority-row" key={item.tool} onClick={() => item.tool === 'weather' && weatherStatus === 'error' ? onRetryWeather() : go(item.tool)}><span className="priority-dot"/><span>{item.title}</span><strong>{item.action}<ArrowRight size={14}/></strong></button>)}</div> : <p className="panel-empty">You’re all set up. Add crop and finance records to see your farm activity here.</p>}
        {weatherData && <button className="weather-inline" onClick={() => go('weather')}><CloudSun size={18}/><span><b>{weatherData.condition} in {profile?.district}</b><small>{weatherData.temperature}°C · {weatherData.humidity}% humidity · View forecast</small></span><ArrowRight size={16}/></button>}
      </article>
      <article className="overview-panel tools-panel">
        <div className="panel-heading"><div><span className="eyebrow">URVARA tools</span><h2>Go to a tool</h2></div><Sprout size={20}/></div>
        <div className="overview-shortcuts">
          {[[ 'chat', 'Ask AI advisor', Leaf ], ['weather', 'Weather forecast', CloudSun], ['doctor', 'Check crop health', Stethoscope], ['prices', 'Mandi prices', Store], ['expenses', 'Track finances', CreditCard], ['guide', 'Browse farm guides', BookOpen]].map(([id, label, Icon]) => <button className="shortcut-button" key={id} onClick={() => go(id)}><span><Icon size={18}/></span>{label}<ArrowRight size={14}/></button>)}
        </div>
      </article>
    </section>
  </div>
}

function App() {
  const [initialProfileStorage] = useState(() => readStoredFarmProfile())
  const [profile, setProfile] = useState(initialProfileStorage.profile)
  const [weatherData, setWeatherData] = useState(null)
  const [weatherStatus, setWeatherStatus] = useState(() => profile ? 'loading' : 'empty')
  const [activeTool, setActiveTool] = useState(() => initialProfileStorage.profile ? 'overview' : 'profile')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const activeGroup = groups.find(group => group.tools.some(([id]) => id === activeTool)) || groups[0]
  const season = getCurrentSeason()

  useEffect(() => {
    if (!profile?.district || !profile?.state) return
    if (weatherData) return
    let cancelled = false
    const refreshWeather = async () => {
      try {
        const coordinates = await getCoordinates(profile.district, profile.state)
        const weather = await getWeather(coordinates.lat, coordinates.lon)
        if (!cancelled) {
          setWeatherData(weather)
          setWeatherStatus('ready')
        }
      } catch {
        if (!cancelled) setWeatherStatus('error')
      }
    }
    refreshWeather()
    return () => { cancelled = true }
  }, [profile, weatherData])

  const go = tool => {
    setActiveTool(tool)
    setMobileMenuOpen(false)
  }
  const selectGroup = group => go(group.tools[0][0])
  const handleProfileSave = profileData => {
    if (!initialProfileStorage.valid || !writeStoredFarmProfile(profileData)) return false
    setProfile(profileData)
    go('overview')
    return true
  }
  const handleWeatherFetched = weather => {
    setWeatherData(weather)
    setWeatherStatus('ready')
  }
  const retryWeather = async () => {
    if (!profile?.district || !profile?.state) return
    setWeatherStatus('loading')
    try {
      const coordinates = await getCoordinates(profile.district, profile.state)
      handleWeatherFetched(await getWeather(coordinates.lat, coordinates.lon))
    } catch {
      setWeatherStatus('error')
    }
  }

  let page
  if (activeTool === 'overview') page = <Overview profile={profile} weatherData={weatherData} weatherStatus={weatherStatus} go={go} onRetryWeather={retryWeather}/>
  else if (activeTool === 'chat') page = <ChatAdvisor profile={profile} weatherData={weatherData} onNeedProfile={() => go('profile')}/>
  else if (activeTool === 'crops') page = <CropsSection profile={profile} weatherData={weatherData}/>
  else if (activeTool === 'prices') page = <PricesSection profile={profile}/>
  else if (activeTool === 'weather') page = <WeatherSection profile={profile} weatherData={weatherData} onWeatherFetched={handleWeatherFetched}/>
  else if (activeTool === 'doctor') page = <PlantDoctor profile={profile}/>
  else if (activeTool === 'maintenance') page = <CropMaintenance profile={profile} weatherData={weatherData} onOpenCycles={() => go('cycles')}/>
  else if (activeTool === 'seeds') page = <SeedGuide profile={profile}/>
  else if (activeTool === 'companion') page = <CompanionPlanting profile={profile}/>
  else if (activeTool === 'records') page = <CropRecords profile={profile} onOpenCycles={() => go('cycles')}/>
  else if (activeTool === 'plots') page = <FarmPlots profile={profile} onNeedProfile={() => go('profile')} onOpenCycles={() => go('cycles')}/>
  else if (activeTool === 'cycles') page = <CropCycles profile={profile} onNeedProfile={() => go('profile')} onOpenPlots={() => go('plots')}/>
  else if (activeTool === 'profit') page = <ProfitCalculator profile={profile}/>
  else if (activeTool === 'schemes') page = <SchemesSection profile={profile}/>
  else if (activeTool === 'guide') page = <BeginnerGuide profile={profile}/>
  else if (activeTool === 'profile') page = <ProfileSetup existingProfile={profile} storageInvalid={!initialProfileStorage.valid} onSave={handleProfileSave} onWeatherFetched={handleWeatherFetched}/>
  else if (activeTool === 'chart') page = <PriceChart profile={profile}/>
  else if (activeTool === 'calendar') page = <CropCalendar profile={profile} onOpenCycles={() => go('cycles')}/>
  else if (activeTool === 'soil') page = <SoilAnalyzer profile={profile}/>
  else if (activeTool === 'expenses') page = <ExpenseTracker profile={profile}/>
  else if (activeTool === 'kvk') page = <KVKFinder profile={profile}/>

  return <div className="urvara-shell">
    {mobileMenuOpen && <button aria-label="Close navigation" className="nav-scrim" onClick={() => setMobileMenuOpen(false)}/>}
    <aside className={`urvara-sidebar ${mobileMenuOpen ? 'is-open' : ''}`}>
      <button className="brand-lockup" onClick={() => go('overview')} aria-label="URVARA home"><span className="brand-symbol"><Sprout size={23}/></span><span><b>URVARA</b><small>Farm intelligence</small></span></button>
      <span className="sidebar-caption">WORKSPACE</span>
      <nav className="primary-navigation" aria-label="Main navigation">{groups.map(group => { const Icon = group.icon; return <button key={group.id} onClick={() => selectGroup(group)} className={`primary-nav-item ${activeGroup.id === group.id ? 'active' : ''}`}><Icon size={18}/><span>{group.label}</span>{activeGroup.id === group.id && <span className="nav-active-mark"/>}</button> })}</nav>
      <div className="sidebar-footer"><span className="season-indicator"><span/> {season}</span><span>Made for Indian farms</span></div>
    </aside>

    <div className="urvara-main">
      <header className="urvara-topbar"><div className="topbar-leading"><button className="mobile-nav-toggle" aria-label="Open navigation" onClick={() => setMobileMenuOpen(true)}><Menu size={20}/></button><div><span className="breadcrumb">{activeGroup.label}</span><h1>{activeTool === 'overview' ? 'Farm overview' : toolLabels[activeTool]}</h1></div></div><div className="topbar-trailing">{(profile?.district || profile?.state) && <span className="location-badge"><MapPin size={15}/>{[profile.district, profile.state].filter(Boolean).join(', ')}</span>}<button className="profile-avatar" title="Edit farm profile" onClick={() => go('profile')}>{profile?.district?.[0]?.toUpperCase() || 'U'}</button></div></header>
      <div className="tool-navigation" aria-label={`${activeGroup.label} tools`}>{activeGroup.tools.map(([id, label]) => <button key={id} onClick={() => go(id)} className={`tool-nav-item ${activeTool === id ? 'active' : ''}`}>{label}</button>)}</div>
      <main className={`page-content ${activeTool === 'overview' ? 'is-overview' : ''}`} key={activeTool}>{page}</main>
    </div>
  </div>
}

export default App
