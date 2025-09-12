import { create } from 'zustand';
import type { SimulationState, DetectedFlybyInfo, OrbitalPerihelionData } from './types';
import React from 'react';

const START_DATE = new Date('2018-08-12T07:31:00Z');

const initialState = {
    simulationDate: START_DATE,
    sunEarthDistance: 0,
    orbitalSpeed: 0,
    probeSunDistance: 0,
    probeFootpointDistanceToSunspot: null,
    sunspotProbability: 0,
<<<<<<< HEAD
    activeSunspotCount: 0,
    solarPhase: 'Solar Minimum' as const,
    currentTimeScale: 1,
=======
>>>>>>> f4d78b85de1bbc78bc8de8ca7a0ea4e5b3eca188
    orbitalPerihelionData: [],
};

export const useSimulationStore = create<SimulationState>((set, get) => ({
    ...initialState,
    setSimulationDate: (date: Date) => set({ simulationDate: date }),
    setSunEarthDistance: (distance: number) => set({ sunEarthDistance: distance }),
    setOrbitalSpeed: (speed: number) => set({ orbitalSpeed: speed }),
    setProbeSunDistance: (distance: number) => set({ probeSunDistance: distance }),
    setProbeFootpointDistanceToSunspot: (distance: number | null) => set({ probeFootpointDistanceToSunspot: distance }),
    setSunspotProbability: (probability: number) => set({ sunspotProbability: probability }),
<<<<<<< HEAD
    setActiveSunspotCount: (count: number) => set({ activeSunspotCount: count }),
    setSolarPhase: (phase: 'Solar Minimum' | 'Rising Activity' | 'Solar Maximum' | 'Declining Activity') => set({ solarPhase: phase }),
    setCurrentTimeScale: (scale: number) => set({ currentTimeScale: scale }),
=======
>>>>>>> f4d78b85de1bbc78bc8de8ca7a0ea4e5b3eca188
    addOrbitalPerihelionData: (data: OrbitalPerihelionData) => set(state => ({
        orbitalPerihelionData: [...state.orbitalPerihelionData, data]
    })),
    resetAnalyticsData: () => set({
        orbitalPerihelionData: [],
    }),
}));

/**
 * Custom hook that subscribes to a Zustand store but throttles re-renders.
 * This is crucial for UI components that display data from the 60fps simulation loop.
 * @param selector - The Zustand selector function.
 * @param ms - The throttle interval in milliseconds. Defaults to 100ms.
 */
export function useThrottledStore<T>(
  selector: (state: SimulationState) => T,
  ms: number = 100
): T {
  const [data, setData] = React.useState(selector(useSimulationStore.getState()));
  const lastUpdateTime = React.useRef(0);
  const timeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const unsubscribe = useSimulationStore.subscribe(state => {
      const now = Date.now();
      if (now - lastUpdateTime.current > ms) {
        setData(selector(state));
        lastUpdateTime.current = now;
      } else {
        if (timeoutRef.current) {
          cancelAnimationFrame(timeoutRef.current);
        }
        timeoutRef.current = requestAnimationFrame(() => {
          setData(selector(useSimulationStore.getState()));
          lastUpdateTime.current = Date.now();
        });
      }
    });

    return () => {
      if (timeoutRef.current) {
        cancelAnimationFrame(timeoutRef.current);
      }
      unsubscribe();
    };
  }, [selector, ms]);

  return data;
}