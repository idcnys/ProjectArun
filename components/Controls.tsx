import React from 'react';
import { KM_IN_AU, SIMULATION_DISTANCE_SCALE } from '../constants';
import { useThrottledStore } from '../simulationStore';
import type { DetectedFlybyInfo } from '../types';

interface ControlsProps {
  isPaused: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  timeScale: number;
  onTimeScaleChange: (value: number) => void;
  showOrbitPaths: boolean;
  onShowOrbitPathsChange: (value: boolean) => void;
  cameraType: 'default' | 'earth' | 'earth-ground' | 'parker-probe' | 'venus-orbit' | 'mercury-orbit';
  onCameraTypeChange: (type: 'default' | 'earth' | 'earth-ground' | 'parker-probe' | 'venus-orbit' | 'mercury-orbit') => void;
  includeParkerProbe: boolean;
  onIncludeParkerProbeChange: () => void;
  showSunspots: boolean;
  onShowSunspotsChange: (value: boolean) => void;
  showSpacetimeFabric: boolean;
  onShowSpacetimeFabricChange: (value: boolean) => void;
}

const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const ResetIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
  </svg>
);

// --- Time Scale Constants and Helpers ---
const MIN_TIMESCALE = 1 / 24; // 1 hour/sec in days/sec
const MAX_TIMESCALE = 365; // 1 year/sec in days/sec

const log_min = Math.log(MIN_TIMESCALE);
const log_max = Math.log(MAX_TIMESCALE);

// Convert a linear slider value [0, 100] to a logarithmic time scale value
const sliderToTimeScale = (sliderValue: number): number => {
  const log_val = log_min + (sliderValue / 100) * (log_max - log_min);
  return Math.exp(log_val);
};

// Convert a time scale value back to a linear slider value [0, 100]
const timeScaleToSlider = (timeScaleValue: number): number => {
  if (timeScaleValue <= 0) return 0;
  const log_val = Math.log(timeScaleValue);
  return 100 * (log_val - log_min) / (log_max - log_min);
};

// Format the time scale for display with appropriate units
const formatTimeScale = (scale: number): string => {
    if (scale < 1) { // Less than a day per second -> hours/sec
        const hours = scale * 24;
        return `${hours.toFixed(hours < 10 ? 1 : 0)} h/s`;
    }
    if (scale < 7) { // Less than a week per second -> days/sec
        return `${scale.toFixed(1)} d/s`;
    }
    if (scale < 30.44) { // Less than a month per second -> weeks/sec
        return `${(scale / 7).toFixed(1)} w/s`;
    }
    if (scale < 365) { // Less than a year per second -> months/sec
        return `${(scale / 30.44).toFixed(1)} m/s`;
    }
    // Years per second
    return `${(scale / 365).toFixed(1)} y/s`;
};


export const Controls: React.FC<ControlsProps> = ({
  isPaused,
  onPlayPause,
  onReset,
  timeScale,
  onTimeScaleChange,
  showOrbitPaths,
  onShowOrbitPathsChange,
  cameraType,
  onCameraTypeChange,
  includeParkerProbe,
  onIncludeParkerProbeChange,
  showSunspots,
  onShowSunspotsChange,
  showSpacetimeFabric,
  onShowSpacetimeFabricChange,
}) => {
  const {
      simulationDate,
      sunEarthDistance,
      orbitalSpeed,
      probeSunDistance,
      probeFootpointDistanceToSunspot,
      orbitalPerihelionData,
  } = useThrottledStore(state => ({
      simulationDate: state.simulationDate,
      sunEarthDistance: state.sunEarthDistance,
      orbitalSpeed: state.orbitalSpeed,
      probeSunDistance: state.probeSunDistance,
      probeFootpointDistanceToSunspot: state.probeFootpointDistanceToSunspot,
      orbitalPerihelionData: state.orbitalPerihelionData,
  }), 100);

  const lastPerihelionChangeEvent = React.useMemo(() => {
    if (orbitalPerihelionData.length < 2) {
      return null;
    }

    const changeEvents: DetectedFlybyInfo[] = [];
    for (let i = 1; i < orbitalPerihelionData.length; i++) {
        const prev = orbitalPerihelionData[i - 1];
        const curr = orbitalPerihelionData[i];
        const perihelionChange = curr.perihelion - prev.perihelion;
        
        // A change of > 0.02 AU after an orbit is a strong indicator of a gravity assist event.
        if (Math.abs(perihelionChange) > 0.02) {
            changeEvents.push({
                date: curr.date,
                newPerihelionAU: curr.perihelion,
                type: perihelionChange > 0 ? 'positive' : 'negative',
            });
        }
    }
    
    // Find the most recent event that has already occurred in the simulation timeline.
    const pastEvents = changeEvents.filter(f => f.date <= simulationDate);
    return pastEvents.pop() || null;
  }, [orbitalPerihelionData, simulationDate]);

  const formattedDate = simulationDate.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sliderValue = Number(e.target.value);
    const newTimeScale = sliderToTimeScale(sliderValue);
    onTimeScaleChange(newTimeScale);
  };
  
  const sliderValue = timeScaleToSlider(timeScale);
  
  const distanceInMillionKm = (sunEarthDistance / 1e6).toFixed(2);
  const distanceInAU = (sunEarthDistance / KM_IN_AU).toFixed(3);

  const probeDistanceToSunInMillionKm = (probeSunDistance / 1e6).toFixed(2);
  const probeDistanceToSunInAU = (probeSunDistance / KM_IN_AU).toFixed(3);

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
  };

  const footpointDistanceKm = probeFootpointDistanceToSunspot !== null 
    ? (probeFootpointDistanceToSunspot * SIMULATION_DISTANCE_SCALE / 1000).toFixed(0) 
    : null;

  return (
    <div className="absolute top-0 left-0 z-20 bg-space-blue/80 backdrop-blur-xs p-4 rounded-lg shadow-2xl max-w-xs w-full text-space-light border border-slate-700/80">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-accent-cyan font-heading">Controls</h2>
        <p className="text-lg font-semibold tabular-nums">{formattedDate}</p>
      </div>

      <div className="grid grid-cols-2 gap-x-4 text-right mb-2">
        <div>
          <p className="text-sm font-medium text-space-light/80">
            Sun-Earth Distance
          </p>
          <p className="font-semibold tabular-nums text-base leading-tight">
            {distanceInMillionKm} <span className="text-xs font-normal">M km</span>
            <br />
            <span className="text-space-light/60 font-normal text-xs">({distanceInAU} AU)</span>
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-space-light/80">
            Orbital Speed
          </p>
          <p className="font-semibold tabular-nums text-lg leading-tight">
            {orbitalSpeed.toFixed(2)}
            <span className="text-sm font-normal text-space-light/80"> km/s</span>
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 mb-2">
        <button
          onClick={onPlayPause}
          className="flex-1 bg-accent-cyan/90 hover:bg-accent-cyan text-space-dark font-bold p-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:ring-offset-2 focus:ring-offset-space-blue"
          aria-label={isPaused ? "Play" : "Pause"}
        >
          {isPaused ? <PlayIcon className="h-5 w-5 mx-auto" /> : <PauseIcon className="h-5 w-5 mx-auto" />}
        </button>
        <button
          onClick={onReset}
          className="flex-1 bg-accent-magenta/90 hover:bg-accent-magenta text-space-dark font-bold p-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent-magenta/50 focus:ring-offset-2 focus:ring-offset-space-blue"
          aria-label="Reset"
        >
          <ResetIcon className="h-5 w-5 mx-auto" />
        </button>
      </div>

      <div className="mb-2">
        <label htmlFor="timeScale" className="block text-sm font-medium text-space-light/80 mb-1">
          Time Scale: <span className="font-bold text-accent-cyan">{formatTimeScale(timeScale)}</span>
        </label>
        <input
          type="range"
          id="timeScale"
          min="0"
          max="100"
          step="0.1"
          value={sliderValue}
          onChange={handleSliderChange}
          className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-accent-cyan"
        />
        <div className="flex justify-between text-xs text-space-light/60 mt-1">
          <span>1h/s</span>
          <span>365d/s</span>
        </div>
      </div>
      
      <div className="mb-2">
        <label className="block text-sm font-medium text-space-light/80 mb-2">
          Camera View
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onCameraTypeChange('default')}
            className={`col-span-3 font-bold p-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-space-blue text-xs ${
              cameraType === 'default'
                ? 'bg-accent-cyan text-space-dark focus:ring-accent-cyan/50'
                : 'bg-slate-600 hover:bg-slate-500 text-space-light focus:ring-accent-cyan/50'
            }`}
            aria-pressed={cameraType === 'default'}
          >
            Default
          </button>
          <button
            onClick={() => onCameraTypeChange('mercury-orbit')}
            className={`font-bold p-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-space-blue text-xs ${
              cameraType === 'mercury-orbit'
                ? 'bg-accent-cyan text-space-dark focus:ring-accent-cyan/50'
                : 'bg-slate-600 hover:bg-slate-500 text-space-light focus:ring-accent-cyan/50'
            }`}
             aria-pressed={cameraType === 'mercury-orbit'}
          >
            Mercury Orbit
          </button>
          <button
            onClick={() => onCameraTypeChange('venus-orbit')}
            className={`font-bold p-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-space-blue text-xs ${
              cameraType === 'venus-orbit'
                ? 'bg-accent-cyan text-space-dark focus:ring-accent-cyan/50'
                : 'bg-slate-600 hover:bg-slate-500 text-space-light focus:ring-accent-cyan/50'
            }`}
             aria-pressed={cameraType === 'venus-orbit'}
          >
            Venus Orbit
          </button>
          <button
            onClick={() => onCameraTypeChange('earth')}
            className={`font-bold p-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-space-blue text-xs ${
              cameraType === 'earth'
                ? 'bg-accent-cyan text-space-dark focus:ring-accent-cyan/50'
                : 'bg-slate-600 hover:bg-slate-500 text-space-light focus:ring-accent-cyan/50'
            }`}
             aria-pressed={cameraType === 'earth'}
          >
            Earth Orbit
          </button>
          <button
            onClick={() => onCameraTypeChange('earth-ground')}
            className={`font-bold p-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-space-blue text-xs ${
              cameraType === 'earth-ground'
                ? 'bg-accent-cyan text-space-dark focus:ring-accent-cyan/50'
                : 'bg-slate-600 hover:bg-slate-500 text-space-light focus:ring-accent-cyan/50'
            }`}
             aria-pressed={cameraType === 'earth-ground'}
          >
            Earth Ground
          </button>
          <button
            onClick={() => onCameraTypeChange('parker-probe')}
            disabled={!includeParkerProbe}
            className={`col-span-2 font-bold p-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-space-blue text-xs ${
              cameraType === 'parker-probe'
                ? 'bg-accent-cyan text-space-dark focus:ring-accent-cyan/50'
                : 'bg-slate-600 hover:bg-slate-500 text-space-light focus:ring-accent-cyan/50'
            } ${!includeParkerProbe ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-pressed={cameraType === 'parker-probe'}
          >
            Probe View
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
            <label htmlFor="showFabric" className="text-sm font-medium text-space-light/80">
              Show Spacetime Fabric
            </label>
            <button
              id="showFabric"
              onClick={() => onShowSpacetimeFabricChange(!showSpacetimeFabric)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:ring-offset-2 focus:ring-offset-space-blue ${
                showSpacetimeFabric ? 'bg-accent-cyan' : 'bg-slate-600'
              }`}
              role="switch"
              aria-checked={showSpacetimeFabric}
            >
              <span
                aria-hidden="true"
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  showSpacetimeFabric ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
        </div>

        <div className="flex items-center justify-between">
            <label htmlFor="showOrbits" className="text-sm font-medium text-space-light/80">
              Show Orbit Paths
            </label>
            <button
              id="showOrbits"
              onClick={() => onShowOrbitPathsChange(!showOrbitPaths)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:ring-offset-2 focus:ring-offset-space-blue ${
                showOrbitPaths ? 'bg-accent-cyan' : 'bg-slate-600'
              }`}
              role="switch"
              aria-checked={showOrbitPaths}
            >
              <span
                aria-hidden="true"
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  showOrbitPaths ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
        </div>

        <div className="flex items-center justify-between">
          <label htmlFor="showSunspots" className="text-sm font-medium text-space-light/80">
            Show Sunspots
          </label>
          <button
            id="showSunspots"
            onClick={() => onShowSunspotsChange(!showSunspots)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:ring-offset-2 focus:ring-offset-space-blue ${
              showSunspots ? 'bg-accent-cyan' : 'bg-slate-600'
            }`}
            role="switch"
            aria-checked={showSunspots}
          >
            <span
              aria-hidden="true"
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                showSunspots ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <label htmlFor="showProbe" className="text-sm font-medium text-space-light/80">
            Include Parker Probe
          </label>
          <button
            id="showProbe"
            onClick={onIncludeParkerProbeChange}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:ring-offset-2 focus:ring-offset-space-blue ${
              includeParkerProbe ? 'bg-accent-cyan' : 'bg-slate-600'
            }`}
            role="switch"
            aria-checked={includeParkerProbe}
          >
            <span
              aria-hidden="true"
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                includeParkerProbe ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
        
        {includeParkerProbe && (
            <div className="mt-1 pt-1 border-t border-slate-700 space-y-2">
               <h3 className="text-base font-bold text-accent-cyan -mb-1 font-heading">Parker Probe Stats</h3>
               <div className="flex justify-between items-baseline">
                    <p className="text-sm font-medium text-space-light/80">
                        Distance from Sun
                    </p>
                    <div className="text-right">
                        <p className="font-semibold tabular-nums text-base leading-tight">
                            {probeDistanceToSunInMillionKm} <span className="text-xs font-normal">M km</span>
                        </p>
                        <p className="text-space-light/60 font-normal text-xs -mt-1">
                            ({probeDistanceToSunInAU} AU)
                        </p>
                    </div>
               </div>
               <div className="flex justify-between items-baseline">
                    <p className="text-sm font-medium text-space-light/80">
                        Footpoint to Sunspot
                    </p>
                    <p className="font-semibold tabular-nums text-sm">
                        {footpointDistanceKm !== null ? `${footpointDistanceKm} km` : 'N/A'}
                    </p>
               </div>
               <div className="flex justify-between">
                  <p className="text-sm font-medium text-space-light/80 self-center">
                      Last Perihelion Change
                      {lastPerihelionChangeEvent && (
                        <span className={`ml-2 font-bold ${
                            lastPerihelionChangeEvent.type === 'negative' ? 'text-accent-cyan' : 'text-accent-magenta'
                        }`}>
                            ({lastPerihelionChangeEvent.type === 'negative' ? 'Shrunk' : 'Grew'})
                        </span>
                      )}
                  </p>
                  {lastPerihelionChangeEvent ? (
                      <div className="text-right text-sm">
                          <p className="font-semibold tabular-nums">
                              {formatDate(lastPerihelionChangeEvent.date)}
                          </p>
                          <p className="tabular-nums -mt-1 text-space-light/70">
                              Perihelion: {lastPerihelionChangeEvent.newPerihelionAU.toFixed(3)} AU
                          </p>
                      </div>
                  ) : (
                      <p className="font-semibold tabular-nums text-sm self-center">N/A</p>
                  )}
               </div>
            </div>
        )}

        <p className="text-xs text-space-light/60 mt-4 pt-3 border-t border-slate-700">
          Note: Distances are scaled for visualization (1 AU ≈ 25 units). Body sizes are exaggerated.
        </p>
    </div>
  );
};