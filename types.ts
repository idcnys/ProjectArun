import type { Vector3 } from 'three';

export interface DetectedFlybyInfo {
  date: Date;
  newPerihelionAU: number;
  type: 'positive' | 'negative';
}

export interface OrbitalPerihelionData {
  date: Date; // The simulated date of orbit completion
  perihelion: number; // in AU
}

export interface OrbitPhase {
  startDate: Date;
  endDate: Date;
  path: [number, number, number][];
}

export interface CelestialBodyData {
  id: string;
  position: [number, number,number];
  velocity: [number, number, number];
  mass: number;
  color: string;
  isSun?: boolean;
  orbitPath?: [number, number, number][];
  textureUrl?: string;
  orbitPhases?: OrbitPhase[];
}

export interface SimulationState {
    simulationDate: Date;
    sunEarthDistance: number;
    orbitalSpeed: number;
    probeSunDistance: number;
    probeFootpointDistanceToSunspot: number | null;
    sunspotProbability: number;
<<<<<<< HEAD
    activeSunspotCount: number;
    solarPhase: 'Solar Minimum' | 'Rising Activity' | 'Solar Maximum' | 'Declining Activity';
    currentTimeScale: number;
=======
>>>>>>> f4d78b85de1bbc78bc8de8ca7a0ea4e5b3eca188
    orbitalPerihelionData: OrbitalPerihelionData[];

    setSimulationDate: (date: Date) => void;
    setSunEarthDistance: (distance: number) => void;
    setOrbitalSpeed: (speed: number) => void;
    setProbeSunDistance: (distance: number) => void;
    setProbeFootpointDistanceToSunspot: (distance: number | null) => void;
    setSunspotProbability: (probability: number) => void;
<<<<<<< HEAD
    setActiveSunspotCount: (count: number) => void;
    setSolarPhase: (phase: 'Solar Minimum' | 'Rising Activity' | 'Solar Maximum' | 'Declining Activity') => void;
    setCurrentTimeScale: (scale: number) => void;
=======
>>>>>>> f4d78b85de1bbc78bc8de8ca7a0ea4e5b3eca188
    addOrbitalPerihelionData: (data: OrbitalPerihelionData) => void;
    resetAnalyticsData: () => void;
}