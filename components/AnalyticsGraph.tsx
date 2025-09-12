import React from 'react';
import { SIMULATION_DISTANCE_SCALE } from '../constants';
import { useThrottledStore } from '../simulationStore';

const MAX_PROBABILITY_FOR_UI = 0.06; // The max calculated probability is ~0.055, so this is a good ceiling for the UI bar.
const MAX_DISTANCE_KM_FOR_UI = 500000; // 500,000 km as the max for the proximity graph.

export const AnalyticsGraph: React.FC = () => {
    const {
        sunspotProbability,
        footpointDistance,
<<<<<<< HEAD
        activeSunspotCount,
        solarPhase,
=======
>>>>>>> f4d78b85de1bbc78bc8de8ca7a0ea4e5b3eca188
        orbitalPerihelionData
    } = useThrottledStore(state => ({
        sunspotProbability: state.sunspotProbability,
        footpointDistance: state.probeFootpointDistanceToSunspot,
<<<<<<< HEAD
        activeSunspotCount: state.activeSunspotCount,
        solarPhase: state.solarPhase,
        orbitalPerihelionData: state.orbitalPerihelionData,
    }), 100);

  // Get current time scale from the Controls component (we'll need to pass this down or store it)
  // For now, we'll calculate the estimated cycle time based on standard 4 minutes at 1x
  const baseCycleMinutes = 4;

  // Helper function to get phase color and progress
  const getPhaseInfo = (phase: string) => {
    switch (phase) {
      case 'Solar Minimum':
        return { 
          color: 'text-blue-400', 
          bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600', 
          progress: 15, 
          description: 'Minimal sunspot activity, quiet solar conditions',
          icon: '🌑'
        };
      case 'Rising Activity':
        return { 
          color: 'text-yellow-400', 
          bgColor: 'bg-gradient-to-r from-blue-500 via-yellow-500 to-orange-500', 
          progress: 45, 
          description: 'Increasing solar activity, more sunspots forming',
          icon: '🌤️'
        };
      case 'Solar Maximum':
        return { 
          color: 'text-red-400', 
          bgColor: 'bg-gradient-to-r from-orange-500 via-red-500 to-red-600', 
          progress: 100, 
          description: 'Peak sunspot activity, maximum solar flares',
          icon: '☀️'
        };
      case 'Declining Activity':
        return { 
          color: 'text-orange-400', 
          bgColor: 'bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500', 
          progress: 75, 
          description: 'Decreasing solar activity, fewer sunspots',
          icon: '🌅'
        };
      default:
        return { 
          color: 'text-gray-400', 
          bgColor: 'bg-gray-400', 
          progress: 0, 
          description: 'Unknown phase',
          icon: '❓'
        };
    }
  };

  const phaseInfo = getPhaseInfo(solarPhase);
=======
        orbitalPerihelionData: state.orbitalPerihelionData,
    }), 100);

>>>>>>> f4d78b85de1bbc78bc8de8ca7a0ea4e5b3eca188
  const probPercentage = (sunspotProbability / MAX_PROBABILITY_FOR_UI) * 100;

  const distanceKm = footpointDistance !== null ? footpointDistance * SIMULATION_DISTANCE_SCALE : null;
  
  let proximityPercentage = 0;
  if (distanceKm !== null) {
    const proximity = 1 - Math.min(distanceKm, MAX_DISTANCE_KM_FOR_UI) / MAX_DISTANCE_KM_FOR_UI;
    proximityPercentage = proximity * 100;
  }
  
  const renderPerihelionVsTimeChart = () => {
    const data = orbitalPerihelionData;
    if (data.length < 2) {
      return (
        <div className="flex items-center justify-center h-48 bg-space-dark/50 rounded-lg">
          <p className="text-sm text-space-light/60">Awaiting first completed orbit...</p>
        </div>
      );
    }

    const PADDING = { top: 20, right: 10, bottom: 40, left: 40 };
    const VIEWBOX_WIDTH = 288;
    const VIEWBOX_HEIGHT = 192;
    const WIDTH = VIEWBOX_WIDTH - PADDING.left - PADDING.right;
    const HEIGHT = VIEWBOX_HEIGHT - PADDING.top - PADDING.bottom;

    const minPeri = Math.min(...data.map(d => d.perihelion));
    const maxPeri = Math.max(...data.map(d => d.perihelion));
    const minTime = data[0].date.getTime();
    const maxTime = data[data.length - 1].date.getTime();

    const yScale = (val: number) => {
        if (maxPeri === minPeri) return HEIGHT / 2;
        return HEIGHT - ((val - minPeri) / (maxPeri - minPeri)) * HEIGHT;
    };
    const xScale = (date: Date) => {
        if (maxTime === minTime) return WIDTH / 2;
        return ((date.getTime() - minTime) / (maxTime - minTime)) * WIDTH;
    };
    
    const points = data.map(d => `${xScale(d.date)},${yScale(d.perihelion)}`).join(' ');

    const yAxisLabels = () => {
        const labels = [];
        const numTicks = 3;
        if (maxPeri === minPeri) {
            return [{ y: HEIGHT / 2, label: minPeri.toFixed(2) }];
        }
        for (let i = 0; i <= numTicks; i++) {
            const val = minPeri + (i / numTicks) * (maxPeri - minPeri);
            labels.push({ y: yScale(val), label: val.toFixed(2) });
        }
        return labels;
    };
    
    const xAxisLabels = () => {
      const labels = [];
      const numTicks = 3;
      if (maxTime === minTime) {
          return [{ x: WIDTH / 2, label: new Date(minTime).getFullYear().toString() }];
      }
      const duration = maxTime - minTime;
      const addedYears = new Set();
      for (let i = 0; i <= numTicks; i++) {
          const time = minTime + (i / numTicks) * duration;
          const date = new Date(time);
          const year = date.getFullYear();
          if (!addedYears.has(year)) {
              labels.push({ x: xScale(date), label: year.toString() });
              addedYears.add(year);
          }
      }
      return labels;
  };
    
    return (
      <svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} className="w-full h-auto font-sans">
        <g transform={`translate(${PADDING.left}, ${PADDING.top})`}>
          {yAxisLabels().map(({ y, label }) => (
            <g key={`y-${label}`}>
              <line x1="0" x2={WIDTH} y1={y} y2={y} stroke="rgba(203, 213, 225, 0.1)" />
              <text x="-8" y={y + 4} fill="rgba(203, 213, 225, 0.6)" textAnchor="end" fontSize="10">{label}</text>
            </g>
          ))}
          <text x="-28" y={HEIGHT / 2} fill="rgba(203, 213, 225, 0.8)" fontSize="10" transform={`rotate(-90, -28, ${HEIGHT / 2})`} textAnchor="middle">
            Perihelion (AU)
          </text>
          
          {xAxisLabels().map(({ x, label }) => (
             <text key={`x-${label}`} x={x} y={HEIGHT + 20} fill="rgba(203, 213, 225, 0.6)" textAnchor="middle" fontSize="10">
                {label}
            </text>
          ))}

          {data.length > 1 && <polyline points={points} fill="none" stroke="#22d3ee" strokeWidth="2" />}

          {data.map(d => (
             <circle key={d.date.getTime()} cx={xScale(d.date)} cy={yScale(d.perihelion)} r="3" fill="#22d3ee" />
          ))}
        </g>
      </svg>
    );
  };


  return (
    <div className="absolute top-0 right-0 z-20 bg-space-blue/80 backdrop-blur-xs p-4 rounded-lg shadow-2xl w-72 text-space-light font-sans border border-slate-700/80">
      <h2 className="text-lg font-bold text-accent-cyan mb-3 text-center font-heading">Parker Probe Analytics</h2>
      
<<<<<<< HEAD
      <div className="space-y-4">
        {/* Solar Phase Indicator */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-space-light/80">
              Solar Cycle Phase
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-lg">{phaseInfo.icon}</span>
              <span className={`text-sm font-bold tabular-nums ${phaseInfo.color}`}>
                {solarPhase}
              </span>
            </div>
          </div>
          <div className="w-full bg-space-dark/70 rounded-full h-4 overflow-hidden">
            <div
              className={`${phaseInfo.bgColor} h-4 rounded-full transition-all duration-1000 ease-out`}
              style={{ width: `${phaseInfo.progress}%` }}
              aria-valuenow={phaseInfo.progress}
              aria-valuemin={0}
              aria-valuemax={100}
              role="progressbar"
            />
          </div>
          <p className="text-xs text-space-light/60 mt-1">{phaseInfo.description}</p>
        </div>

        {/* Active Sunspots Count */}
        <div>
          <div className="flex justify-between items-baseline mb-1">
            <label className="text-sm font-medium text-space-light/80">
              Active Sunspots
            </label>
            <span className="text-lg font-bold tabular-nums text-accent-cyan">
              {activeSunspotCount}
            </span>
          </div>
          <div className="w-full bg-space-dark/70 rounded-full h-4 overflow-hidden">
            <div
              className="bg-accent-cyan h-4 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min((activeSunspotCount / 10) * 100, 100)}%` }}
              aria-valuenow={activeSunspotCount}
              aria-valuemin={0}
              aria-valuemax={10}
              role="progressbar"
            />
          </div>
          <p className="text-xs text-space-light/60 mt-1">Real-time count of visible sunspots on solar surface.</p>
        </div>

        {/* Sunspot Formation Probability */}
        <div>
          <div className="flex justify-between items-baseline mb-1">
            <label className="text-sm font-medium text-space-light/80">
              Sunspot Formation Rate
            </label>
            <span className="text-sm font-semibold tabular-nums text-accent-magenta">
=======
{/*       <div className="space-y-4"> */}
        {/* Sunspot-Footpoint overlapping chance */}
{/*         <div>
          <div className="flex justify-between items-baseline mb-1">
            <label className="text-sm font-medium text-space-light/80">
              Sunspot-Footpoint Proximity Chance
            </label>
            <span className="text-sm font-semibold tabular-nums text-accent-cyan">
>>>>>>> f4d78b85de1bbc78bc8de8ca7a0ea4e5b3eca188
              {(sunspotProbability * 100).toFixed(2)}%
            </span>
          </div>
          <div className="w-full bg-space-dark/70 rounded-full h-4 overflow-hidden">
            <div
<<<<<<< HEAD
              className="bg-accent-magenta h-4 rounded-full transition-all duration-300 ease-out"
=======
              className="bg-accent-cyan h-4 rounded-full transition-all duration-300 ease-out"
>>>>>>> f4d78b85de1bbc78bc8de8ca7a0ea4e5b3eca188
              style={{ width: `${Math.min(probPercentage, 100)}%` }}
              aria-valuenow={probPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              role="progressbar"
            />
          </div>
          <p className="text-xs text-space-light/60 mt-1">Increases with probe proximity to the Sun.</p>
<<<<<<< HEAD
        </div>

        {/* Footpoint-Sunspot Proximity */}
        <div>
=======
        </div> */}

        {/* Footpoint-Sunspot Proximity */}
{/*         <div>
>>>>>>> f4d78b85de1bbc78bc8de8ca7a0ea4e5b3eca188
           <div className="flex justify-between items-baseline mb-1">
            <label className="text-sm font-medium text-space-light/80">
              Footpoint Proximity
            </label>
<<<<<<< HEAD
            <span className="text-sm font-semibold tabular-nums text-accent-cyan">
=======
            <span className="text-sm font-semibold tabular-nums text-accent-magenta">
>>>>>>> f4d78b85de1bbc78bc8de8ca7a0ea4e5b3eca188
              {distanceKm !== null ? `${(distanceKm / 1000).toFixed(0)}k km` : 'N/A'}
            </span>
          </div>
          <div className="w-full bg-space-dark/70 rounded-full h-4 overflow-hidden">
             <div
<<<<<<< HEAD
              className={`bg-gradient-to-r from-accent-cyan to-accent-magenta h-4 rounded-full transition-all duration-300 ease-out ${distanceKm === null ? 'opacity-30' : ''}`}
=======
              className={`bg-accent-magenta h-4 rounded-full transition-all duration-300 ease-out ${distanceKm === null ? 'opacity-30' : ''}`}
>>>>>>> f4d78b85de1bbc78bc8de8ca7a0ea4e5b3eca188
              style={{ width: `${distanceKm === null ? 0 : proximityPercentage}%` }}
              aria-valuenow={proximityPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              role="progressbar"
            />
          </div>
          <p className="text-xs text-space-light/60 mt-1">Measures magnetic footpoint to nearest sunspot.</p>
        </div>
<<<<<<< HEAD
      </div>
=======
      </div> */}
>>>>>>> f4d78b85de1bbc78bc8de8ca7a0ea4e5b3eca188

      <div className="mt-4 pt-4 border-t border-slate-700/80">
        <h3 className="text-base font-bold text-accent-cyan mb-2 text-center font-heading">Perihelion vs Time (Orbit)</h3>
        {renderPerihelionVsTimeChart()}
<<<<<<< HEAD
        <p className="text-xs text-space-light/50 mt-2 text-center">
          Solar cycle: ~4 min simulated (real: ~11 years)
        </p>
=======
>>>>>>> f4d78b85de1bbc78bc8de8ca7a0ea4e5b3eca188
      </div>
    </div>
  );
};
