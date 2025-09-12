
import React, { useState, useEffect, useCallback } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

const dialogue = [
  { speaker: "Shuvo", role: "Systems Check Officer", line: "All systems functioning correctly — we are ready to leave the ground!" },
  { speaker: "Arnob", role: "Launch Announcer", line: "Crew ARUN, prepare for launch. We leave Earth's embrace shortly!" },
  { speaker: "Nilay", role: "Telemetry & Diagnostics", line: "All system parameters are normal. No errors detected. Mission is go." },
  { speaker: "Rabbi", role: "Propulsion & Fuel Check", line: "Fuel levels confirmed. Engines checked — status: GREEN." },
  { speaker: "Amio", role: "Thrusters & Navigation", line: "Thrusters are performing beautifully. Trajectory locked. Diving into space in T-minus…" },
  { speaker: "Bitto", role: "Project Lead / Commander", line: "This is it, Team ARUN. Hold steady — ignition sequence starts now… 3… 2… 1… LIFT OFF!" },
];

const Typewriter: React.FC<{ text: string; onComplete: () => void }> = ({ text, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText(''); // Reset on text change
    if (text) {
      let i = 0;
      const intervalId = setInterval(() => {
        setDisplayedText(prev => text.substring(0, i + 1));
        i++;
        if (i >= text.length) {
          clearInterval(intervalId);
          onComplete();
        }
      }, 50); // Typing speed in ms
      return () => clearInterval(intervalId);
    }
  }, [text, onComplete]);

  return <p className="text-lg md:text-xl text-space-light/90 font-sans min-h-[56px]">{displayedText}</p>;
};


export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [lineIsVisible, setLineIsVisible] = useState(true);

  useEffect(() => {
    const startSound = new Audio('/loading_start.mp3');
    startSound.play().catch(e => console.error("Loading start sound failed:", e));

    const loopSound = new Audio('/during_loading.wav');
    loopSound.volume = 0.4;
    loopSound.loop = true;
    loopSound.play().catch(e => console.error("Loading loop sound failed:", e));

    return () => {
        loopSound.pause();
    };
  }, []);

  const handleTypingComplete = useCallback(() => {
    setIsTyping(false);
  }, []);
  
  useEffect(() => {
    if (isTyping) return; // Wait for typing to finish

    const isLastLine = currentLineIndex === dialogue.length - 1;
    const readTime = isLastLine ? 2000 : 1500;
    const fadeDuration = 500;

    // After reading, start fading out the current line
    const fadeOutTimer = setTimeout(() => {
      setLineIsVisible(false);
    }, readTime);

    // After the fade-out animation completes, advance to the next state
    const nextLineTimer = setTimeout(() => {
      if (isLastLine) {
        setFadeOut(true); // Trigger fade-out for the whole screen
      } else {
        setCurrentLineIndex(prev => prev + 1);
        setLineIsVisible(true); // Make the next line visible
        setIsTyping(true); // Start typing the next line
      }
    }, readTime + fadeDuration);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(nextLineTimer);
    };
  }, [isTyping, currentLineIndex]);


  useEffect(() => {
    // Handles the final fade-out and completion call.
    if (fadeOut) {
      const timer = setTimeout(onComplete, 1000); // Wait for fade-out animation
      return () => clearTimeout(timer);
    }
  }, [fadeOut, onComplete]);
  
  const handleSkip = () => {
    setFadeOut(true);
  };
  
  const currentEntry = dialogue[currentLineIndex];

  return (
    <div className={`fixed inset-0 bg-space-dark z-50 flex flex-col items-center justify-center transition-opacity duration-1000 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
        <div className="absolute top-5 right-5">
            <button
                onClick={handleSkip}
                className="px-4 py-2 text-sm font-bold text-space-light/70 bg-space-blue/50 border border-slate-700 rounded-md hover:bg-space-blue hover:text-white transition-colors"
                aria-label="Skip intro"
            >
                Skip Intro
            </button>
        </div>

        <div className="text-center mb-12 animate-pulse">
            <h1 className="text-5xl md:text-7xl font-heading text-accent-cyan" style={{ textShadow: '0 0 15px rgba(34, 211, 238, 0.7)' }}>
                TEAM ARUN
            </h1>
            <p className="text-xl md:text-2xl font-sans text-space-light/80 tracking-widest mt-2">
                Launch Countdown Log
            </p>
        </div>

        <div className="w-full max-w-3xl p-6 bg-space-blue/30 backdrop-blur-sm border border-slate-700/60 rounded-lg shadow-2xl min-h-[160px] flex items-center">
             {currentEntry && (
                <div
                    key={currentEntry.speaker}
                    className={`transition-opacity duration-500 w-full ${lineIsVisible ? 'opacity-100' : 'opacity-0'}`}
                >
                    <div className="flex items-baseline space-x-3">
                        <h2 className="text-xl font-bold font-heading text-accent-cyan">{currentEntry.speaker}</h2>
                        <p className="text-sm text-space-light/70">({currentEntry.role})</p>
                    </div>
                    <Typewriter text={currentEntry.line} onComplete={handleTypingComplete} />
                </div>
             )}
        </div>
    </div>
  );
};
