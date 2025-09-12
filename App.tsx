
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import ContextMenu from './components/ContextMenu';
import { Simulation } from './components/Simulation';
import { Controls } from './components/Controls';
import type { CelestialBodyData, DetectedFlybyInfo, OrbitPhase } from './types';
import * as THREE from 'three';
import { AnalyticsGraph } from './components/AnalyticsGraph';
import { G, AU_IN_SIMULATION_UNITS, SIMULATION_DISTANCE_SCALE } from './constants';
import { useSimulationStore } from './simulationStore';
import { LoadingScreen } from './components/LoadingScreen';
<<<<<<< HEAD
=======
import { Link } from 'react-router-dom';
>>>>>>> f4d78b85de1bbc78bc8de8ca7a0ea4e5b3eca188


// --- INITIAL BODY PARAMETERS ---
const INITIAL_SUN_MASS = 1000;
const INITIAL_EARTH_MASS = 0.3;
const INITIAL_EARTH_DISTANCE = AU_IN_SIMULATION_UNITS;
const INITIAL_VELOCITY_MULTIPLIER = 0.98; // Nearly circular orbit

const INITIAL_VENUS_MASS = INITIAL_EARTH_MASS * 0.815; // Venus is 81.5% of Earth's mass
const INITIAL_VENUS_DISTANCE = AU_IN_SIMULATION_UNITS * 0.723; // Venus is at 0.723 AU

const INITIAL_MERCURY_MASS = INITIAL_EARTH_MASS * 0.0553; // Mercury is 5.53% of Earth's mass
const INITIAL_MERCURY_DISTANCE = AU_IN_SIMULATION_UNITS * 0.387; // Mercury is at 0.387 AU

const PROBE_MASS = 0.00001; // Negligible mass

const START_DATE = new Date('2018-08-12T07:31:00Z'); // Parker Solar Probe Launch Time

// Heliocentric longitudes for the planets on the launch date. This ensures the
// simulation starts with an astronomically correct configuration.
const INITIAL_PLANET_PHASES = {
  earth: 319.4, // Degrees
  venus: 245.5, // Degrees
  mercury: 226.5, // Degrees
};


/**
 * Pre-computes the orbital path for a celestial body around a sun.
 */
const computeOrbitPath = (planet: CelestialBodyData, sun: CelestialBodyData): [number, number, number][] => {
  const distance = Math.hypot(...planet.position);
  if (distance === 0) return [];

  const orbitalPeriod = 2 * Math.PI * Math.sqrt(Math.pow(distance, 3) / (G * sun.mass));
  const timeStep = orbitalPeriod / 500; // Use more steps for a smoother pre-computed path
  const orbitComputationSteps = Math.ceil((orbitalPeriod / timeStep) * 1.05);

  const path: [number, number, number][] = [];
  let p_x = planet.position[0], p_y = planet.position[1], p_z = planet.position[2];
  let v_x = planet.velocity[0], v_y = planet.velocity[1], v_z = planet.velocity[2];
  const s_x = sun.position[0], s_y = sun.position[1], s_z = sun.position[2];

  for (let i = 0; i < orbitComputationSteps; i++) {
    const toSun_x = s_x - p_x;
    const toSun_y = s_y - p_y;
    const toSun_z = s_z - p_z;
    
    const distanceSq = Math.max(toSun_x*toSun_x + toSun_y*toSun_y + toSun_z*toSun_z, 25);
    const distanceCurrent = Math.sqrt(distanceSq);
    
    const forceMagnitude = (G * sun.mass * planet.mass) / distanceSq;
    const norm_x = toSun_x / distanceCurrent, norm_y = toSun_y / distanceCurrent, norm_z = toSun_z / distanceCurrent;
    const accel_x = (norm_x * forceMagnitude) / planet.mass, accel_y = (norm_y * forceMagnitude) / planet.mass, accel_z = (norm_z * forceMagnitude) / planet.mass;

    v_x += accel_x * timeStep;
    v_y += accel_y * timeStep;
    v_z += accel_z * timeStep;

    p_x += v_x * timeStep;
    p_y += v_y * timeStep;
    p_z += v_z * timeStep;

    path.push([p_x, p_y, p_z]);
  }
  return path;
};

/**
 * Creates a generic planet data object with proper orbital mechanics for phase and inclination.
 * Ascending node is assumed to be along the positive X-axis.
 */
const createPlanetData = (
    id: string,
    color: string,
    textureUrl: string,
    sun: CelestialBodyData, 
    distance: number, 
    mass: number, 
    velocityMultiplier: number,
    initialPhaseAngle: number, // degrees
    inclination: number, // degrees
): CelestialBodyData => {
    const angleRad = initialPhaseAngle * (Math.PI / 180);
    const inclinationRad = inclination * (Math.PI / 180);

    const circularVelocityMagnitude = Math.sqrt((G * sun.mass) / distance);
    const initialVelocityMagnitude = circularVelocityMagnitude * velocityMultiplier;

    // Position vector: calculated for a point in an orbit with a given phase angle (angleRad)
    // and then tilted by the inclination angle (inclinationRad) around the X-axis.
    const posX = distance * Math.cos(angleRad);
    const posY = distance * Math.sin(angleRad) * Math.sin(inclinationRad);
    const posZ = distance * Math.sin(angleRad) * Math.cos(inclinationRad);
    const position: [number, number, number] = [posX, posY, posZ];
    
    // Velocity vector: perpendicular to the position vector, also rotated by the inclination.
    const velX = -initialVelocityMagnitude * Math.sin(angleRad);
    const velY = initialVelocityMagnitude * Math.cos(angleRad) * Math.sin(inclinationRad);
    const velZ = initialVelocityMagnitude * Math.cos(angleRad) * Math.cos(inclinationRad);
    const velocity: [number, number, number] = [velX, velY, velZ];

    const newPlanet: CelestialBodyData = { id, position, velocity, mass, color, textureUrl };
    newPlanet.orbitPath = computeOrbitPath(newPlanet, sun);
    return newPlanet;
};

/**
 * Creates the data object for Earth based on simulation parameters.
 * Earth's orbit defines the ecliptic plane (y=0) for this simulation.
 */
const createEarthData = (sun: CelestialBodyData, distance: number, mass: number, velocityMultiplier: number, initialPhaseAngle: number): CelestialBodyData => {
    return createPlanetData(
        'earth',
        '#4D96FF',
        'earthmap1k.jpg',
        sun, distance, mass, velocityMultiplier,
        initialPhaseAngle,
        0 // Earth defines the ecliptic plane, so its inclination is zero.
    );
};

/**
 * Creates the data object for Venus based on simulation parameters.
 * This version introduces a realistic orbital inclination.
 */
const createVenusData = (sun: CelestialBodyData, distance: number, mass: number, velocityMultiplier: number, initialPhaseAngle: number): CelestialBodyData => {
    return createPlanetData(
        'venus',
        '#E6D3A3',
        'venusmap.jpg',
        sun, distance, mass, velocityMultiplier,
        initialPhaseAngle,
        3.39 // Venus's actual inclination relative to the ecliptic.
    );
};


/**
 * Creates the data object for Mercury based on simulation parameters.
 * Includes a realistic orbital inclination.
 */
const createMercuryData = (sun: CelestialBodyData, distance: number, mass: number, velocityMultiplier: number, initialPhaseAngle: number): CelestialBodyData => {
    return createPlanetData(
        'mercury',
        '#A9A9A9',
        'mercurymap.jpg',
        sun, distance, mass, velocityMultiplier,
        initialPhaseAngle,
        7.005 // Mercury's actual inclination relative to the ecliptic.
    );
};

/**
 * Creates the data object for the Parker Solar Probe.
 * Its path is not pre-computed; it will be generated dynamically based on
 * gravitational interactions with the Sun and planets.
 */
const createParkerProbeData = (sun: CelestialBodyData, earthInitialPhaseAngle: number): CelestialBodyData => {
    // These are the orbital parameters for the probe's *first* solar orbit after launch.
    // Aphelion is near Earth's orbit, and perihelion is much closer to the Sun.
    const aphelionAU = 0.98;
    const perihelionAU = 0.25;

    const semiMajorAxis_AU = (aphelionAU + perihelionAU) / 2;
    const aphelion_sim = aphelionAU * AU_IN_SIMULATION_UNITS;
    const semiMajorAxis_sim = semiMajorAxis_AU * AU_IN_SIMULATION_UNITS;
    
    // Calculate velocity at aphelion using the vis-viva equation: v^2 = GM(2/r - 1/a)
    const velocity_at_aphelion = Math.sqrt(G * sun.mass * ((2 / aphelion_sim) - (1 / semiMajorAxis_sim)));
    
    // The probe is launched from Earth, so it begins its solar orbit at Earth's position.
    // We model this by starting the probe at the aphelion of its new orbit, with the same
    // phase angle as Earth on the launch date.
    const rotationAngleRad = earthInitialPhaseAngle * (Math.PI / 180);

    const p_x = aphelion_sim * Math.cos(rotationAngleRad);
    const p_z = aphelion_sim * Math.sin(rotationAngleRad);
    
    // Velocity is tangential to the orbit at aphelion, and perpendicular to the position vector.
    const v_x = -velocity_at_aphelion * Math.sin(rotationAngleRad);
    const v_z = velocity_at_aphelion * Math.cos(rotationAngleRad);
    
    const initialPosition: [number, number, number] = [p_x, 0, p_z];
    const initialVelocity: [number, number, number] = [v_x, 0, v_z];

    const newProbe: CelestialBodyData = {
        id: 'parker-probe',
        position: initialPosition,
        velocity: initialVelocity,
        mass: PROBE_MASS,
        color: '#E0E0E0',
        orbitPhases: [{
            startDate: START_DATE,
            endDate: new Date('2030-01-01T00:00:00Z'), // A far-future end date
            path: [],
        }],
    };
    return newProbe;
};


const createInitialSun = (): CelestialBodyData => ({
    id: 'sun',
    position: [0, 0, 0],
    velocity: [0, 0, 0],
    mass: INITIAL_SUN_MASS,
    color: '#FFD700',
    isSun: true,
    textureUrl: 'sun2.jpg',
});


const App: React.FC = () => {
<<<<<<< HEAD
  const setCurrentTimeScale = useSimulationStore(state => state.setCurrentTimeScale);
=======
>>>>>>> f4d78b85de1bbc78bc8de8ca7a0ea4e5b3eca188
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem('missionArunLaunched') === 'true') {
        setShowLoadingScreen(false);
      }
    } catch (error) {
      console.error("Could not access localStorage:", error);
      // Fallback for environments where localStorage is disabled (e.g., private browsing)
      setShowLoadingScreen(false);
    }
    setIsReady(true);
  }, []);

  const handleLoadingComplete = useCallback(() => {
    try {
      localStorage.setItem('missionArunLaunched', 'true');
    } catch (error) {
      console.error("Could not write to localStorage:", error);
    }
    setShowLoadingScreen(false);
  }, []);

  const [bodies, setBodies] = useState<CelestialBodyData[]>([]);
  const [showOrbitPaths, setShowOrbitPaths] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [timeScale, setTimeScale] = useState(1); // days per second
<<<<<<< HEAD
  
  // Custom time scale handler that updates both local state and store
  const handleTimeScaleChange = useCallback((newTimeScale: number) => {
    setTimeScale(newTimeScale);
    setCurrentTimeScale(newTimeScale);
  }, [setCurrentTimeScale]);

  // Initialize store with current time scale
  useEffect(() => {
    setCurrentTimeScale(timeScale);
  }, [setCurrentTimeScale, timeScale]);

=======
>>>>>>> f4d78b85de1bbc78bc8de8ca7a0ea4e5b3eca188
  const [simulationKey, setSimulationKey] = useState(0); // Used to force-remount Simulation
  const [cameraType, setCameraType] = useState<'default' | 'earth' | 'earth-ground' | 'parker-probe' | 'venus-orbit' | 'mercury-orbit'>('default');
  const [includeParkerProbe, setIncludeParkerProbe] = useState(true);
  const [showSunspots, setShowSunspots] = useState(true);
  const [showSpacetimeFabric, setShowSpacetimeFabric] = useState(true);

  const [notification, setNotification] = useState<string | null>(null);
  const notificationTimerRef = useRef<number | null>(null);
  
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const thrustAudioRef = useRef<HTMLAudioElement | null>(null);
  const isFirstCameraRender = useRef(true);

  // Background music effect
  useEffect(() => {
    if (!showLoadingScreen) {
        bgmAudioRef.current = new Audio('/bgm2.mp3');
        bgmAudioRef.current.volume = 1;
        bgmAudioRef.current.loop = true;
        bgmAudioRef.current.play().catch(e => console.error("BGM play failed:", e));
    }
    return () => {
        bgmAudioRef.current?.pause();
    };
  }, [showLoadingScreen]);
  
  // Probe thrust sound effect
  useEffect(() => {
    if (!showLoadingScreen && !isPaused && includeParkerProbe) {
        if (!thrustAudioRef.current) {
            thrustAudioRef.current = new Audio('/thrust.mp3');
            thrustAudioRef.current.volume = 0.4;
            thrustAudioRef.current.loop = true;
            thrustAudioRef.current.play().catch(e => console.error("Thrust audio play failed:", e));
        }
    } else {
        thrustAudioRef.current?.pause();
        thrustAudioRef.current = null;
    }
  }, [showLoadingScreen, isPaused, includeParkerProbe]);

  // Camera view change sound effect
  useEffect(() => {
    if (isFirstCameraRender.current) {
        isFirstCameraRender.current = false;
        return;
    }
    new Audio('/camera_view.wav').play().catch(e => console.error("Camera sound failed:", e));
  }, [cameraType]);


  // Get state setters from our Zustand store
  const {
      setSimulationDate,
      resetAnalyticsData,
      setSunEarthDistance,
      setOrbitalSpeed,
  } = useSimulationStore(state => ({
      setSimulationDate: state.setSimulationDate,
      resetAnalyticsData: state.resetAnalyticsData,
      setSunEarthDistance: state.setSunEarthDistance,
      setOrbitalSpeed: state.setOrbitalSpeed,
  }));

  const orbitalPerihelionData = useSimulationStore(state => state.orbitalPerihelionData);

  // Perihelion Change Notification Effect, now managed at the App level
  useEffect(() => {
      if (orbitalPerihelionData.length < 2) return;

      const currentData = orbitalPerihelionData[orbitalPerihelionData.length - 1];
      const previousData = orbitalPerihelionData[orbitalPerihelionData.length - 2];

      const change = currentData.perihelion - previousData.perihelion;
      const percentChange = (change / previousData.perihelion) * 100;
      
      let notificationText: string | null = null;
      
      // Use a threshold to avoid notifications for tiny, insignificant changes.
      if (Math.abs(percentChange) > 0.5) {
          if (percentChange < -0.5) {
              notificationText = `Perihelion reduced by ${Math.abs(percentChange).toFixed(1)}%`;
          } else if (percentChange > 0.5) {
              notificationText = `Perihelion increased by ${percentChange.toFixed(1)}%`;
          }

          if (notificationText) {
              setNotification(notificationText);
              
              if (notificationTimerRef.current) {
                  clearTimeout(notificationTimerRef.current);
              }
              notificationTimerRef.current = window.setTimeout(() => {
                  setNotification(null);
              }, 4000);
          }
      }
  }, [orbitalPerihelionData]);

  // Cleanup timer on component unmount
  useEffect(() => () => { if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current) }, []);

  const handleFlybyDetected = useCallback((date: Date, newPerihelionAU: number) => {
    new Audio('/flyby.wav').play().catch(e => console.error("Flyby sound failed:", e));
    // The `onFlybyDetected` callback from the physics engine is now only used
    // for triggering visual effects, like splitting the orbit path. The actual
    // perihelion data for the analytics panel is now derived from orbit completions.
    setBodies(prevBodies => prevBodies.map(body => {
        if (body.id === 'parker-probe' && body.orbitPhases && body.orbitPhases.length > 0) {
            const lastPhaseIndex = body.orbitPhases.length - 1;
            const updatedLastPhase = {
                ...body.orbitPhases[lastPhaseIndex],
                endDate: date,
            };

            const newPhases: OrbitPhase[] = [
                ...body.orbitPhases.slice(0, lastPhaseIndex),
                updatedLastPhase,
                {
                    startDate: date,
                    endDate: new Date('2030-01-01T00:00:00Z'), // Far-future end date
                    path: [],
                }
            ];
            
            return { ...body, orbitPhases: newPhases };
        }
        return body;
    }));
  }, []);

  const initializeSimulation = useCallback(() => {
    const newSun = createInitialSun();
    // Use the correct initial phase angles for the launch date to ensure temporal accuracy.
    const newEarth = createEarthData(newSun, INITIAL_EARTH_DISTANCE, INITIAL_EARTH_MASS, INITIAL_VELOCITY_MULTIPLIER, INITIAL_PLANET_PHASES.earth);
    const newVenus = createVenusData(newSun, INITIAL_VENUS_DISTANCE, INITIAL_VENUS_MASS, INITIAL_VELOCITY_MULTIPLIER, INITIAL_PLANET_PHASES.venus);
    const newMercury = createMercuryData(newSun, INITIAL_MERCURY_DISTANCE, INITIAL_MERCURY_MASS, INITIAL_VELOCITY_MULTIPLIER, INITIAL_PLANET_PHASES.mercury);

    const initialBodies = [newSun, newEarth, newVenus, newMercury];
    
    if (includeParkerProbe) {
        // The probe's starting position is now correctly tied to Earth's phase angle.
        const newProbe = createParkerProbeData(newSun, INITIAL_PLANET_PHASES.earth);
        initialBodies.push(newProbe);
    }

    const initialVelocityMagnitude = new THREE.Vector3(...newEarth.velocity).length(); // in sim units/day
    const initialSpeedKms = (initialVelocityMagnitude * SIMULATION_DISTANCE_SCALE) / (24 * 3600);
    setOrbitalSpeed(initialSpeedKms);
    
    setBodies(initialBodies);
    
    // Reset Zustand store state
    setSimulationDate(START_DATE);
    resetAnalyticsData();
    setSunEarthDistance(INITIAL_EARTH_DISTANCE * SIMULATION_DISTANCE_SCALE);

    setSimulationKey(prev => prev + 1); // Increment key to reset component state
  }, [includeParkerProbe, setOrbitalSpeed, setSimulationDate, resetAnalyticsData, setSunEarthDistance]);

  useEffect(() => {
    initializeSimulation();
  }, [initializeSimulation]);
  

  const handleReset = useCallback(() => {
    setIsPaused(true);
    setCameraType('default');
    initializeSimulation();
  }, [initializeSimulation]);
  
  const handlePlayPause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const handleToggleParkerProbe = useCallback(() => {
    setIsPaused(true); // Pause to prevent a jarring transition
    // If we're in the probe camera view and we're about to disable the probe,
    // switch back to the default camera to avoid a dangling view.
    if (cameraType === 'parker-probe') {
      setCameraType('default');
    }
    setIncludeParkerProbe(prev => !prev);
  }, [cameraType]);


  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCloseContextMenu = () => setContextMenu(null);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu]);

  if (!isReady) {
    // Render a blank screen while checking local storage to prevent flicker
    return <div className="fixed inset-0 bg-space-dark"></div>;
  }

  if (showLoadingScreen) {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  return (
  <div className="relative h-screen w-screen bg-space-dark text-space-light font-sans overflow-hidden" onContextMenu={handleContextMenu} style={{ userSelect: 'none' }}>
<<<<<<< HEAD
      <h1 className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-30 text-2xl font-bold text-space-light/80 tracking-wider font-heading" style={{ textShadow: '0 0 10px rgba(34, 211, 238, 0.5)' }}>
        TEAM ARUN
=======
      <h1 className="cursor-pointer absolute top-4 left-1/2 -translate-x-1/2 z-30 text-2xl font-bold text-space-light/80 tracking-wider font-heading" style={{ textShadow: '0 0 10px rgba(34, 211, 238, 0.5)' }}>
        <Link to="/team">TEAM ARUN</Link>
>>>>>>> f4d78b85de1bbc78bc8de8ca7a0ea4e5b3eca188
      </h1>
      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={handleCloseContextMenu} />
      )}
      <Controls
        isPaused={isPaused}
        onPlayPause={handlePlayPause}
        onReset={handleReset}
        timeScale={timeScale}
<<<<<<< HEAD
        onTimeScaleChange={handleTimeScaleChange}
=======
        onTimeScaleChange={setTimeScale}
>>>>>>> f4d78b85de1bbc78bc8de8ca7a0ea4e5b3eca188
        showOrbitPaths={showOrbitPaths}
        onShowOrbitPathsChange={setShowOrbitPaths}
        cameraType={cameraType}
        onCameraTypeChange={setCameraType}
        includeParkerProbe={includeParkerProbe}
        onIncludeParkerProbeChange={handleToggleParkerProbe}
        showSunspots={showSunspots}
        onShowSunspotsChange={setShowSunspots}
        showSpacetimeFabric={showSpacetimeFabric}
        onShowSpacetimeFabricChange={setShowSpacetimeFabric}
      />
      <AnalyticsGraph />
      <div className="h-full w-full">
        <Simulation
          key={simulationKey}
          bodies={bodies}
          showOrbitPaths={showOrbitPaths}
          isPaused={isPaused}
          timeScale={timeScale}
          startDate={START_DATE}
          cameraType={cameraType}
          onFlybyDetected={handleFlybyDetected}
          showSunspots={showSunspots}
          showSpacetimeFabric={showSpacetimeFabric}
        />
      </div>
      {notification && (
        <div 
          className="animate-flyby-notification absolute bottom-8 right-8 z-40 pointer-events-none select-none bg-space-blue/50 backdrop-blur-md text-accent-cyan text-lg font-bold font-heading py-3 px-6 rounded-lg border-2 border-accent-cyan/50 shadow-lg whitespace-nowrap"
          style={{ textShadow: '0 0 10px rgba(34, 211, 238, 0.7)' }}
          role="alert"
          aria-live="assertive"
        >
          {notification}
        </div>
      )}
    </div>
  );
};

export default App;
