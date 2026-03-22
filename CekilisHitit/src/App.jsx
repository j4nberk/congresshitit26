import React, { useState } from 'react';
import MenuStep from './components/MenuStep';
import InputStep from './components/InputStep';
import ScrapeProgressStep from './components/ScrapeProgressStep';
import DrawInputStep from './components/DrawInputStep';
import SettingsStep from './components/SettingsStep';
import DrawStep from './components/DrawStep';
import ResultStep from './components/ResultStep';

import GalaInputStep from './components/GalaInputStep';
import GalaDashboardStep from './components/GalaDashboardStep';
import GalaDrawStep from './components/GalaDrawStep';
import GalaResultStep from './components/GalaResultStep';
import GalaFinalStep from './components/GalaFinalStep';

function App() {
  const [mode, setMode] = useState(null); // null | 'ig-scrape' | 'ig-draw' | 'gala'
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    url: '',
    apiParams: { token: '', userId: '' },
    settings: {
      winnerCount: 1,
      backupCount: 1,
      allowMultiple: false,
      mustFollow: [],
      mustLike: false,
      minTagCount: 0
    },
    comments: [],
    winners: [],
    backups: [],
    previousWinners: [],
    drawRound: 1,
    rounds: [],
    currentRound: 0,
    allRoundResults: [],
    gala: {
      participants: [],
      prizes: [],
      currentPrizeIndex: 0,
      drawResults: {},
      autoMode: false,
      autoDelay: 5,       // saniye — çekilişler arası bekleme
      skipCountdown: false, // otomatik modda başlangıç sayımını atla
    }
  });

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);
  const reset = () => {
    setStep(1);
    setMode(null);
  };

  // Multi-round draw: save current round results, advance to next round or final
  const handleNextRound = () => {
    setData(prev => {
      const currentRoundDef = prev.rounds[prev.currentRound];
      const newResult = {
        round: prev.currentRound + 1,
        name: currentRoundDef?.name || `Tur ${prev.currentRound + 1}`,
        winners: [...prev.winners],
        backups: [...prev.backups],
      };
      const allCurrentUsernames = [
        ...prev.winners.map(w => w.username),
        ...prev.backups.map(b => b.username)
      ];
      const nextRoundIdx = prev.currentRound + 1;
      return {
        ...prev,
        allRoundResults: [...prev.allRoundResults, newResult],
        previousWinners: [...prev.previousWinners, ...allCurrentUsernames],
        winners: [],
        backups: [],
        currentRound: nextRoundIdx,
        drawRound: (prev.drawRound || 1) + 1,
      };
    });

    // Check if there are more rounds - need to read from current state
    setData(prev => {
      if (prev.currentRound < prev.rounds.length) {
        // More rounds to go -> go to DrawStep
        return prev;
      }
      return prev;
    });

    // We check after state update - if there are more rounds, go to DrawStep (step 3)
    // If this was the last round, go to FinalStep (step 5)
    setTimeout(() => {
      setData(prev => {
        if (prev.currentRound >= prev.rounds.length) {
          setStep(5); // Final summary
        } else {
          setStep(3); // Next DrawStep
        }
        return prev;
      });
    }, 0);
  };

  const getModeLabel = () => {
    if (mode === 'ig-scrape') return 'Yorum Çekme';
    if (mode === 'ig-draw') return 'Çekiliş';
    if (mode === 'gala') return 'Gala';
    return '';
  };

  const getTotalSteps = () => {
    if (mode === 'ig-scrape') return 2;
    if (mode === 'ig-draw') {
      const roundCount = data.rounds?.length || 1;
      return roundCount > 1 ? 5 : 4;
    }
    if (mode === 'gala') return 5;
    return 1;
  };

  // Get current round label for header
  const getStepLabel = () => {
    if (mode === 'ig-draw' && (step === 3 || step === 4) && data.rounds?.length > 1) {
      const roundDef = data.rounds[data.currentRound];
      return roundDef ? ` — ${roundDef.name}` : '';
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-brand-black text-white selection:bg-brand-500 selection:text-white font-sans flex flex-col p-4 sm:p-8" style={{ WebkitAppRegion: 'drag' }}>
      {mode === null ? (
        <MenuStep onSelectMode={setMode} />
      ) : (
        <div
          className="flex-1 flex flex-col w-full max-w-2xl mx-auto"
          style={{ animation: 'fadeIn 0.3s ease both' }}
        >
          <header className="flex justify-between items-center mb-12 flex-shrink-0" style={{ WebkitAppRegion: 'no-drag' }}>
            <h1
              className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent cursor-pointer hover:scale-[1.05] transition-transform duration-200"
              onClick={() => { setMode(null); setStep(1); }}
            >
              Cekilis<span className="text-white">Hitit</span>
            </h1>
            <div className="flex items-center gap-3">
              <div className="text-sm text-brand-400 font-medium">
                {getModeLabel()}{getStepLabel()}
              </div>
              <img src="./congress-logo.png" alt="Congress HITU" className="w-10 h-10 rounded-full border border-brand-500/30 shadow-[0_0_10px_rgba(34,197,94,0.15)]" />
            </div>
          </header>

          <main className="flex-1 flex flex-col items-center justify-center w-full" style={{ WebkitAppRegion: 'no-drag' }}>
            {/* IG Scrape Mode (2 steps) */}
            {mode === 'ig-scrape' && step === 1 && <InputStep data={data} setData={setData} onNext={nextStep} />}
            {mode === 'ig-scrape' && step === 2 && <ScrapeProgressStep data={data} onReset={reset} />}

            {/* IG Draw Mode */}
            {mode === 'ig-draw' && step === 1 && <DrawInputStep data={data} setData={setData} onNext={nextStep} />}
            {mode === 'ig-draw' && step === 2 && <SettingsStep data={data} setData={setData} onNext={nextStep} onPrev={prevStep} />}
            {mode === 'ig-draw' && step === 3 && <DrawStep key={data.drawRound} data={data} setData={setData} onNext={nextStep} />}
            {mode === 'ig-draw' && step === 4 && <ResultStep data={data} setData={setData} onReset={reset} onNextRound={handleNextRound} />}
            {mode === 'ig-draw' && step === 5 && <ResultStep data={data} setData={setData} onReset={reset} isFinal={true} />}

            {/* Gala Mode Flow */}
            {mode === 'gala' && step === 1 && <GalaInputStep data={data} setData={setData} onNext={nextStep} />}
            {mode === 'gala' && step === 2 && <GalaDashboardStep data={data} setData={setData} onNext={nextStep} onFinal={() => setStep(5)} />}
            {mode === 'gala' && step === 3 && <GalaDrawStep key={data.gala.currentPrizeIndex} data={data} setData={setData} onNext={nextStep} />}
            {mode === 'gala' && step === 4 && (
              <GalaResultStep
                data={data}
                setData={setData}
                onNext={() => {
                  // currentPrizeIndex handleNextPrize içinde artırıldı ama henüz commit olmamış olabilir
                  // Bu yüzden +1 ile kontrol ediyoruz (çünkü handleNextPrize artırdı)
                  const nextIndex = data.gala.currentPrizeIndex + 1;
                  if (nextIndex >= data.gala.prizes.length) {
                    setStep(5); // Tüm çekilişler bitti → final
                  } else if (data.gala.autoMode) {
                    setStep(3); // Otomatik mod → dashboard'u atla, direkt çekilişe
                  } else {
                    setStep(2); // Manuel mod → dashboard'a dön
                  }
                }}
              />
            )}
            {mode === 'gala' && step === 5 && <GalaFinalStep data={data} onReset={reset} />}
          </main>
        </div>
      )}
    </div>
  );
}

export default App;


