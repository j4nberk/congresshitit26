import React, { useState, useEffect } from 'react'
import { Home, Users, GraduationCap, FileCheck2, Settings as SettingsIcon, Send, Mail } from 'lucide-react'
import Dashboard from './components/Dashboard'
import Teachers from './components/Teachers'
import Students from './components/Students'
import Scoring from './components/Scoring'
import Settings from './components/Settings'
import Sending from './components/Sending'
import TeacherSending from './components/TeacherSending'
import logoImage from './assets/logo.png'
import { applyTheme, DEFAULT_THEME } from './theme'

const STEPS = [
    { id: 'dashboard', label: 'Anasayfa', icon: Home },
    { id: 'teachers', label: 'Hocalar', icon: Users },
    { id: 'students', label: 'Öğrenciler & Bildiriler', icon: GraduationCap },
    { id: 'scoring', label: 'Puanlama', icon: FileCheck2 },
    { id: 'teacher-sending', label: 'Hoca Gönderim', icon: Mail },
    { id: 'settings', label: 'Ayarlar & Şablonlar', icon: SettingsIcon },
    { id: 'sending', label: 'Öğrenci Gönderim', icon: Send },
]

function App() {
    const [currentStep, setCurrentStep] = useState(STEPS[0].id)
    const [displayedStep, setDisplayedStep] = useState(STEPS[0].id)
    const [transitionStage, setTransitionStage] = useState('enter')
    const [currentTheme, setCurrentTheme] = useState(DEFAULT_THEME)

    useEffect(() => {
        let isMounted = true

        if (!window.electronAPI) {
            applyTheme(DEFAULT_THEME)
            return
        }

        window.electronAPI.loadSettings()
            .then(saved => {
                if (isMounted) {
                    const nextTheme = saved?.theme || DEFAULT_THEME
                    setCurrentTheme(nextTheme)
                    applyTheme(nextTheme)
                }
            })
            .catch(() => {
                if (isMounted) {
                    setCurrentTheme(DEFAULT_THEME)
                    applyTheme(DEFAULT_THEME)
                }
            })

        return () => {
            isMounted = false
        }
    }, [])

    useEffect(() => {
        if (currentStep === displayedStep) return

        setTransitionStage('exit')
        const switchTimer = setTimeout(() => {
            setDisplayedStep(currentStep)
            setTransitionStage('enter')
        }, 140)

        return () => clearTimeout(switchTimer)
    }, [currentStep, displayedStep])

    const handleThemeChange = (theme) => {
        setCurrentTheme(theme)
        applyTheme(theme)
        window.electronAPI?.saveSettings({ theme })
    }

    const renderStep = () => {
        if (displayedStep === 'dashboard') return <Dashboard setCurrentStep={setCurrentStep} />
        if (displayedStep === 'teachers') return <Teachers />
        if (displayedStep === 'students') return <Students />
        if (displayedStep === 'scoring') return <Scoring />
        if (displayedStep === 'settings') return <Settings currentTheme={currentTheme} onThemeChange={handleThemeChange} />
        if (displayedStep === 'sending') return <Sending />
        if (displayedStep === 'teacher-sending') return <TeacherSending />
        return null
    }

    return (
        <div className="app-shell flex h-screen bg-brand-black text-white font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="app-sidebar w-64 shrink-0 flex flex-col bg-brand-900/10" style={{ WebkitAppRegion: 'drag' }}>
                <div className="px-6 pb-6 pt-12">
                    <h1 className="text-xl font-semibold tracking-tight text-white">
                        Bildiri<span className="text-brand-400">Hitit</span>
                    </h1>
                </div>
                
                <nav className="flex-1 px-4 py-4 space-y-1" style={{ WebkitAppRegion: 'no-drag' }}>
                    {STEPS.map((step) => {
                        const Icon = step.icon
                        const isActive = currentStep === step.id
                        return (
                            <button
                                key={step.id}
                                onClick={() => setCurrentStep(step.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                                    isActive 
                                    ? 'bg-brand-500/10 text-brand-400' 
                                    : 'text-brand-100/60 hover:bg-brand-800/50 hover:text-brand-200'
                                }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-brand-400' : 'text-brand-100/40'}`} />
                                {step.label}
                            </button>
                        )
                    })}
                </nav>
                
                {/* Logo Area */}
                <div className="p-6 mt-auto mb-4 flex justify-center items-center" style={{ WebkitAppRegion: 'no-drag' }}>
                    <img 
                        src={logoImage} 
                        alt="Kongre Logosu" 
                        className="w-24 h-auto drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                        draggable="false"
                    />
                </div>
            </aside>

            {/* Main Content */}
            <main className="app-main flex-1 min-w-0 flex flex-col relative" style={{ WebkitAppRegion: 'no-drag' }}>
                <div className="app-titlebar h-12 flex items-center justify-between px-6" style={{ WebkitAppRegion: 'drag' }}>
                    <div className="flex items-center gap-2 text-sm font-medium text-brand-100/70">
                        <span className="font-semibold text-white">Bildiri<span className="text-brand-400">Hitit</span></span>
                        <span className="text-brand-100/30">/</span>
                        <span className="text-brand-100/60">
                            {STEPS.find(s => s.id === currentStep)?.label}
                        </span>
                    </div>
                </div>
                
                <div className="app-content flex-1 overflow-auto p-8 relative">
                    <div className={`page-transition-${transitionStage} max-w-5xl mx-auto w-full h-full`}>
                        {renderStep()}
                    </div>
                </div>
            </main>
        </div>
    )
}

export default App
