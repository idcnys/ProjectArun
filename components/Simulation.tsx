
// FIX: Changed React import from a namespace import to a default import to correctly resolve augmented JSX types for react-three-fiber.
import React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
// FIX: Import the Line component from trei to render dashed lines correctly.
// UPDATED: Import useTexture to load planet textures and useGLTF to load 3D models.
import { OrbitControls, Stars, Line, useTexture, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { CelestialBodyData, OrbitPhase } from '../types';
import { G, AU_IN_SIMULATION_UNITS, SIMULATION_DISTANCE_SCALE } from '../constants';
import { useSimulationStore } from '../simulationStore';


// Placed at file scope to be accessible by multiple components
type SunspotData = {
  mesh: THREE.Mesh;
  age: number;
  maxAge: number;
  maxSize: number;
};

/**
 * Calculates key orbital elements from a body's state vectors (position, velocity).
 * This is essential for determining how the orbit changes after a gravity assist.
 * @returns An object containing the perihelion distance in simulation units, or null if calculation fails.
 */
const calculateOrbitalElements = (
  position: THREE.Vector3,
  velocity: THREE.Vector3,
  sunMass: number
): { perihelion: number } | null => {
  const mu = G * sunMass;
  if (mu <= 0) return null;

  const r = position;
  const v = velocity;
  const rMag = r.length();
  if (rMag === 0) return null;


  // Specific angular momentum: h = r x v
  const h = new THREE.Vector3().crossVectors(r, v);
  const hMag = h.length();

  // Eccentricity vector: e = ((v x h) / mu) - (r / rMag)
  const eVec = new THREE.Vector3()
    .crossVectors(v, h)
    .divideScalar(mu)
    .sub(r.clone().divideScalar(rMag));

  const eccentricity = eVec.length();

  // Use the more numerically stable formula for perihelion: q = h^2 / (mu * (1 + e))
  // This avoids calculating the semi-major axis, which is unstable for near-parabolic orbits (e ≈ 1)
  // that can occur during a flyby interaction before the orbit settles.
  const perihelion = (hMag * hMag) / (mu * (1 + eccentricity));

  if (isNaN(perihelion) || !isFinite(perihelion)) return null;

  return { perihelion };
};

const Atmosphere: React.FC<{ radius: number, color: string }> = ({ radius, color }) => {
    const vertexShader = `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
            vNormal = normalize( normalMatrix * normal );
            vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
            vPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
    `;
    const fragmentShader = `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform vec3 uColor;
        void main() {
            vec3 viewDirection = normalize(cameraPosition - vPosition);
            float intensity = pow(1.0 - abs(dot(vNormal, viewDirection)), 3.0);
            gl_FragColor = vec4(uColor, intensity);
        }
    `;

    const material = React.useMemo(() => new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: { uColor: { value: new THREE.Color(color) } },
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
    }), [color]);

    return (
        <mesh scale={[1.05, 1.05, 1.05]}>
            <sphereGeometry args={[radius, 32, 32]} />
            <primitive object={material} attach="material" />
        </mesh>
    );
};

interface BodyProps {
  data: CelestialBodyData;
  sun?: CelestialBodyData;
  showOrbitPath: boolean;
  isPaused: boolean;
  timeScale: number;
  allBodies: CelestialBodyData[];
  bodyRefs: Map<string, React.RefObject<THREE.Group>>;
  // Props for flyby detection, passed only to the probe
  venusRef?: React.RefObject<THREE.Group>;
  onFlybyDetected?: (date: Date, newPerihelionAU: number) => void;
}

const Body = React.forwardRef<THREE.Group, BodyProps>(
  ({ data, sun, showOrbitPath, isPaused, timeScale, allBodies, bodyRefs, venusRef, onFlybyDetected }, forwardedRef) => {
    const localRef = React.useRef<THREE.Group>(null!);
    const ref = forwardedRef || localRef;
    const velocity = React.useRef(new THREE.Vector3(...data.velocity));
    const acceleration = React.useRef(new THREE.Vector3(0, 0, 0));
    const isFirstFrame = React.useRef(true);
    
    // Refs for flyby detection state
    const lastDistanceToVenus = React.useRef(Infinity);
    const wasApproachingVenus = React.useRef(false);
    
    // Ref for orbit completion detection
    const lastAngle = React.useRef<number | null>(null);

    const texture = data.textureUrl ? useTexture(data.textureUrl) : null;
    const { scene: probeModel } = data.id === 'parker-probe' ? useGLTF('/PSP.glb') : { scene: null };

    const { setOrbitalSpeed } = useSimulationStore.getState();

    const sunPositionVec = React.useMemo(() => new THREE.Vector3(...(sun?.position || [0, 0, 0])), [sun]);

    const calculateAccelerationAt = React.useCallback((position: THREE.Vector3): THREE.Vector3 => {
      const totalAcceleration = new THREE.Vector3(0, 0, 0);

      if (data.id === 'parker-probe') {
          // Precise simulation: The probe is affected by the Sun and all inner planets.
          const influencingBodies = allBodies.filter(b => b.isSun || b.id === 'venus' || b.id === 'earth' || b.id === 'mercury');
          for (const otherBody of influencingBodies) {
              const otherBodyRef = bodyRefs.get(otherBody.id);
              if (!otherBodyRef?.current) continue;

              const toOtherBody = otherBodyRef.current.position.clone().sub(position);
              
              // Use a much smaller softening radius for planets to allow for very strong gravity assists.
              // This is the key to making the gravity assist mechanic effective. A larger radius results
              // in a "gentle" flyby that doesn't significantly alter the probe's trajectory.
              const softeningRadius = otherBody.isSun ? 5.0 : 0.05;
              const distanceSq = Math.max(toOtherBody.lengthSq(), softeningRadius * softeningRadius);

              const forceMagnitude = (G * otherBody.mass * data.mass) / distanceSq;
              const force = toOtherBody.normalize().multiplyScalar(forceMagnitude);
              const acceleration = force.divideScalar(data.mass);
              totalAcceleration.add(acceleration);
          }
          return totalAcceleration;
      } 
      
      else if (sun) {
          const toSun = sunPositionVec.clone().sub(position);
          const distanceSq = Math.max(toSun.lengthSq(), 25);
          const forceMagnitude = (G * sun.mass * data.mass) / distanceSq;
          const force = toSun.normalize().multiplyScalar(forceMagnitude);
          return force.divideScalar(data.mass);
      }
      
      return totalAcceleration;
    }, [sun, sunPositionVec, data.mass, data.id, allBodies, bodyRefs]);


    useFrame((_, delta) => {
      const group = (ref as React.MutableRefObject<THREE.Group>).current;
      if (!group || isPaused) return;

      const cappedDelta = Math.min(delta, 1 / 30);
      const totalTimeStep = cappedDelta * timeScale;

      if (data.isSun) {
        // Sun rotation is handled in the dedicated Sun component
      } else if (data.id === 'parker-probe' && sun) {
        group.lookAt(sunPositionVec);
      } else if (data.id === 'venus') {
        group.rotation.y -= ((2 * Math.PI) / 243) * totalTimeStep;
      } else {
        group.rotation.y += (2 * Math.PI) * totalTimeStep;
      }

      if (data.isSun) return;
      
      if (isFirstFrame.current) {
        acceleration.current.copy(calculateAccelerationAt(group.position));
        isFirstFrame.current = false;
      }

      // Performance optimization: cap sub-steps to prevent freezing at high time scales
      const subSteps = Math.min(Math.ceil(Math.abs(totalTimeStep)), 100);
      const subStepDelta = totalTimeStep / subSteps;
      
      for (let i = 0; i < subSteps; i++) {
        const positionOffset = velocity.current.clone().multiplyScalar(subStepDelta)
            .add(acceleration.current.clone().multiplyScalar(0.5 * subStepDelta * subStepDelta));
        group.position.add(positionOffset);

        const newAcceleration = calculateAccelerationAt(group.position);
        
        const avgAcceleration = acceleration.current.clone().add(newAcceleration).multiplyScalar(0.5);
        velocity.current.add(avgAcceleration.multiplyScalar(subStepDelta));

        acceleration.current.copy(newAcceleration);
      }
      
      if (data.id === 'parker-probe' && sun) {
        // --- Integrated Flyby Detection Logic ---
        if (venusRef?.current && onFlybyDetected) {
            const FLYBY_THRESHOLD_SIM_UNITS = 8e6 / SIMULATION_DISTANCE_SCALE;
            const currentDistance = group.position.distanceTo(venusRef.current.position);
            const isApproaching = currentDistance < lastDistanceToVenus.current;
  
            if (wasApproachingVenus.current && !isApproaching) {
                if (lastDistanceToVenus.current < FLYBY_THRESHOLD_SIM_UNITS) {
                    const orbitalElements = calculateOrbitalElements(
                        group.position,
                        velocity.current,
                        sun.mass
                    );
  
                    if (orbitalElements) {
                        const currentDate = useSimulationStore.getState().simulationDate;
                        const perihelionAU = orbitalElements.perihelion / AU_IN_SIMULATION_UNITS;
                        onFlybyDetected(new Date(currentDate), perihelionAU);
                    }
                }
            }
            wasApproachingVenus.current = isApproaching;
            lastDistanceToVenus.current = currentDistance;
        }

        // --- Orbit Completion Detection ---
        const toProbe = group.position.clone().sub(sunPositionVec);
        const currentAngle = Math.atan2(toProbe.z, toProbe.x);

        if (lastAngle.current === null) {
            lastAngle.current = currentAngle;
        }

        // Check for orbit completion by seeing if it crosses the -PI/PI boundary on the -X axis
        if (lastAngle.current > Math.PI * 0.9 && currentAngle < -Math.PI * 0.9) {
            const orbitalElements = calculateOrbitalElements(group.position, velocity.current, sun.mass);
            if (orbitalElements) {
                const perihelionAU = orbitalElements.perihelion / AU_IN_SIMULATION_UNITS;
                const currentDate = useSimulationStore.getState().simulationDate;
                useSimulationStore.getState().addOrbitalPerihelionData({
                    date: new Date(currentDate),
                    perihelion: perihelionAU,
                });
            }
        }
        lastAngle.current = currentAngle;
      }


      if (data.id === 'earth') {
        const speedInSimUnitsPerDay = velocity.current.length();
        const speedInKmPerDay = speedInSimUnitsPerDay * SIMULATION_DISTANCE_SCALE;
        const speedInKmPerSec = speedInKmPerDay / (24 * 3600);
        setOrbitalSpeed(speedInKmPerSec);
      }
    });
    
    let bodyRadius = 0.5;
    if (data.isSun) {
      bodyRadius = 2;
    } else if (data.id === 'parker-probe') {
      bodyRadius = 0.1;
    } else if (data.id === 'venus') {
      bodyRadius = 0.475;
    } else if (data.id === 'mercury') {
      bodyRadius = 0.19;
    }
    const gravityWellRadius = 2.5 * bodyRadius;
    
    const [isHovered, setIsHovered] = React.useState(false);
    const name = React.useMemo(() => data.id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '), [data.id]);

    return (
      <>
        <group ref={ref as React.Ref<THREE.Group>} position={data.position}>
          {data.id === 'parker-probe' && probeModel ? (
            <primitive 
                object={probeModel.clone()} 
                scale={0.05} 
                rotation-y={Math.PI} 
                onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); }}
                onPointerOut={() => setIsHovered(false)}
            />
           ) : (
            <mesh
                onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); }}
                onPointerOut={() => setIsHovered(false)}
            >
                <sphereGeometry args={[bodyRadius, 32, 32]} />
                <meshStandardMaterial
                    map={texture || undefined}
                    color={texture ? '#ffffff' : data.color}
                />
            </mesh>
          )}

          {isHovered && (
            <Html position={[0, data.id === 'parker-probe' ? 0.3 : bodyRadius + 0.3, 0]} center>
                <div className="bg-space-blue/70 backdrop-blur-sm text-space-light text-sm px-2 py-1 rounded border border-slate-700/80 whitespace-nowrap">
                    {name}
                </div>
            </Html>
          )}

          { (data.id === 'earth' || data.id === 'venus') && 
            <Atmosphere radius={bodyRadius} color={data.id === 'earth' ? '#4D96FF' : '#E6D3A3'} />
          }

          {data.id !== 'parker-probe' && (
            <mesh>
              <sphereGeometry args={[gravityWellRadius, 32, 32]} />
              <meshStandardMaterial
                  color={data.color}
                  transparent={true}
                  opacity={0.15}
              />
            </mesh>
          )}
        </group>
        {/* For planets, show the pre-computed static orbit path. The probe's path is handled dynamically. */}
        {!data.isSun && data.id !== 'parker-probe' && showOrbitPath && data.orbitPath && data.orbitPath.length > 1 && (
          <Line
              points={data.orbitPath}
              color={data.color}
              opacity={0.5}
              transparent={true}
              dashed
              dashSize={0.5} 
              gapSize={0.5}
              lineWidth={1}
          />
        )}
      </>
    );
  }
);
Body.displayName = "Body";


const MAX_GRAVITY_WELLS = 10; // Must match shader #define

interface SpacetimeFabricProps {
    bodies: CelestialBodyData[];
    bodyRefs: Map<string, React.RefObject<THREE.Group>>;
}

const SpacetimeFabric: React.FC<SpacetimeFabricProps> = ({ bodies, bodyRefs }) => {
    const planeSize = 100;
    const segments = 60;

    const gravityWells = React.useMemo(() => new Array(MAX_GRAVITY_WELLS).fill(0).map(() => new THREE.Vector3()), []);
    const gravityMasses = React.useMemo(() => new Float32Array(MAX_GRAVITY_WELLS), []);

    const uniforms = React.useMemo(() => ({
        uGravityWells: { value: gravityWells },
        uGravityMasses: { value: gravityMasses },
        uGravityWellCount: { value: 0 },
    }), [gravityWells, gravityMasses]);

    const vertexShader = `
        uniform vec3 uGravityWells[${MAX_GRAVITY_WELLS}];
        uniform float uGravityMasses[${MAX_GRAVITY_WELLS}];
        uniform int uGravityWellCount;

        void main() {
            vec3 pos = position;
            float totalDepression = 0.0;

            for (int i = 0; i < uGravityWellCount; i++) {
                float dx = pos.x - uGravityWells[i].x;
                float dz = pos.z - uGravityWells[i].z;
                float distanceSq = dx * dx + dz * dz;
                
                // Using exp is expensive, a squared falloff is cheaper and looks good
                float depression = -uGravityMasses[i] / (1.0 + 0.005 * distanceSq);
                totalDepression += depression;
            }
            pos.y += totalDepression;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `;

    const fragmentShader = `
        void main() {
            gl_FragColor = vec4(vec3(0.2, 0.2549, 0.3333), 0.2);
        }
    `;

    const material = React.useMemo(() => new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        wireframe: true,
        transparent: true,
    }), [uniforms]);

    useFrame(() => {
        let count = 0;
        for (const body of bodies) {
            if (count >= MAX_GRAVITY_WELLS) break;
            const meshRef = bodyRefs.get(body.id);
            if (meshRef?.current) {
                uniforms.uGravityWells.value[count].copy(meshRef.current.position);
                uniforms.uGravityMasses.value[count] = body.mass / 200.0;
                count++;
            }
        }
        uniforms.uGravityWellCount.value = count;
    });

    return (
        <mesh rotation-x={-Math.PI / 2} position-y={-1}>
            <planeGeometry args={[planeSize, planeSize, segments, segments]} />
            <primitive object={material} attach="material" />
        </mesh>
    );
};


interface SimulationProps {
  bodies: CelestialBodyData[];
  showOrbitPaths: boolean;
  isPaused: boolean;
  timeScale: number; // days per second
  startDate: Date;
  cameraType: 'default' | 'earth' | 'earth-ground' | 'parker-probe' | 'venus-orbit' | 'mercury-orbit';
  onFlybyDetected: (date: Date, newPerihelionAU: number) => void;
  showSunspots: boolean;
  showSpacetimeFabric: boolean;
}

const SimulationClock: React.FC<Pick<SimulationProps, 'isPaused' | 'timeScale' | 'startDate'>> = ({
  isPaused,
  timeScale,
  startDate,
}) => {
  const simTime = React.useRef(0); // in days
  const { setSimulationDate } = useSimulationStore.getState();
  const lastYear = React.useRef(startDate.getUTCFullYear());

  useFrame((_, delta) => {
    if (isPaused) return;

    const cappedDelta = Math.min(delta, 1 / 30);
    simTime.current += cappedDelta * timeScale; 
    
    const elapsedMilliseconds = simTime.current * 24 * 60 * 60 * 1000;
    
    const newDate = new Date(startDate.getTime() + elapsedMilliseconds);
    
    setSimulationDate(newDate);

    const currentYear = newDate.getUTCFullYear();
    if (currentYear > lastYear.current) {
      new Audio('/a_year_passed.mp3').play().catch(e => console.error("Year sound failed:", e));
      lastYear.current = currentYear;
    }
  });

  return null;
};

interface CameraManagerProps {
  cameraType: 'default' | 'earth' | 'earth-ground' | 'parker-probe' | 'venus-orbit' | 'mercury-orbit';
  earthRef: React.RefObject<THREE.Group>;
  probeRef: React.RefObject<THREE.Group>;
  venusRef: React.RefObject<THREE.Group>;
  mercuryRef: React.RefObject<THREE.Group>;
  sunPosition: THREE.Vector3;
}

const CameraManager: React.FC<CameraManagerProps> = ({ cameraType, earthRef, probeRef, venusRef, mercuryRef, sunPosition }) => {
  const { camera } = useThree();

  useFrame((_, delta) => {
    const smoothingFactor = 1 - Math.pow(0.01, delta);

    if (cameraType === 'earth') {
        if (!earthRef.current) return;
        const earthPosition = new THREE.Vector3();
        earthRef.current.getWorldPosition(earthPosition);

        const directionFromSun = new THREE.Vector3().subVectors(earthPosition, sunPosition).normalize();
        const offset = directionFromSun.multiplyScalar(10).add(new THREE.Vector3(0, 4, 0)); 
        const desiredCameraPosition = earthPosition.clone().add(offset);
        
        camera.position.lerp(desiredCameraPosition, smoothingFactor);
        camera.lookAt(sunPosition);
    } else if (cameraType === 'earth-ground') {
        if (!earthRef.current) return;
        const earthPosition = new THREE.Vector3();
        const earthQuaternion = new THREE.Quaternion();
        earthRef.current.getWorldPosition(earthPosition);
        earthRef.current.getWorldQuaternion(earthQuaternion);

        const cameraOffset = new THREE.Vector3(0, 0.6, 0); 
        cameraOffset.applyQuaternion(earthQuaternion);
        const desiredCameraPosition = earthPosition.clone().add(cameraOffset);
        
        camera.position.lerp(desiredCameraPosition, smoothingFactor);
        camera.lookAt(sunPosition);
    } else if (cameraType === 'venus-orbit') {
        if (!venusRef.current) return;
        const venusPosition = new THREE.Vector3();
        venusRef.current.getWorldPosition(venusPosition);

        const directionFromSun = new THREE.Vector3().subVectors(venusPosition, sunPosition).normalize();
        const offset = directionFromSun.multiplyScalar(10).add(new THREE.Vector3(0, 4, 0)); 
        const desiredCameraPosition = venusPosition.clone().add(offset);
        
        camera.position.lerp(desiredCameraPosition, smoothingFactor);
        camera.lookAt(sunPosition);
    } else if (cameraType === 'mercury-orbit') {
        if (!mercuryRef.current) return;
        const mercuryPosition = new THREE.Vector3();
        mercuryRef.current.getWorldPosition(mercuryPosition);

        const directionFromSun = new THREE.Vector3().subVectors(mercuryPosition, sunPosition).normalize();
        const offset = directionFromSun.multiplyScalar(5).add(new THREE.Vector3(0, 2, 0)); 
        const desiredCameraPosition = mercuryPosition.clone().add(offset);
        
        camera.position.lerp(desiredCameraPosition, smoothingFactor);
        camera.lookAt(sunPosition);
    } else if (cameraType === 'parker-probe') {
      if (!probeRef.current) return;
      const probePosition = new THREE.Vector3();
      probeRef.current.getWorldPosition(probePosition);

      const directionFromSun = new THREE.Vector3().subVectors(probePosition, sunPosition).normalize();
      const offset = directionFromSun.multiplyScalar(2).add(new THREE.Vector3(0, 0.5, 0)); 
      const desiredCameraPosition = probePosition.clone().add(offset);
      
      camera.position.lerp(desiredCameraPosition, smoothingFactor);
      camera.lookAt(sunPosition);
    }
  });

  return null;
};

interface DistanceTrackerProps {
  refA: React.RefObject<THREE.Group>;
  refB: React.RefObject<THREE.Group>;
  onDistanceUpdate: (distance: number) => void;
}

const DistanceTracker: React.FC<DistanceTrackerProps> = ({ refA, refB, onDistanceUpdate }) => {
  useFrame(() => {
    if (!refA.current || !refB.current) {
      return;
    }
    const distanceInSimUnits = refA.current.position.distanceTo(refB.current.position);
    const distanceInKm = distanceInSimUnits * SIMULATION_DISTANCE_SCALE;
    onDistanceUpdate(distanceInKm);
  });
  return null;
};

interface FootpointVisualizerProps {
  probeRef: React.RefObject<THREE.Group>;
  sunRef: React.RefObject<THREE.Group>;
  sunRadius: number;
}

const FootpointVisualizer: React.FC<FootpointVisualizerProps> = ({ probeRef, sunRef, sunRadius }) => {
  const lineRef = React.useRef<THREE.Line>(null!);
  const markerRef = React.useRef<THREE.Mesh>(null!);
  const wasVisible = React.useRef(false);
  
  const VISIBILITY_THRESHOLD = 15.0;

  const line = React.useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0)
    ]);
    const material = new THREE.LineBasicMaterial({
        color: "#00ffff",
        transparent: true,
        opacity: 0.7,
        toneMapped: false,
    });
    return new THREE.Line(geometry, material);
  }, []);

  useFrame(() => {
    if (!probeRef.current || !sunRef.current || !lineRef.current || !markerRef.current) {
      return;
    }

    const probePosition = probeRef.current.position;
    const sunPosition = sunRef.current.position;
    const distance = probePosition.distanceTo(sunPosition);
    const isVisible = distance < VISIBILITY_THRESHOLD;

    if (isVisible && !wasVisible.current) {
        new Audio('/footpoint_on.mp3').play().catch(e => console.error("Footpoint sound failed:", e));
    } else if (!isVisible && wasVisible.current) {
        new Audio('/footpoint_out.wav').play().catch(e => console.error("Footpoint sound failed:", e));
    }
    wasVisible.current = isVisible;

    lineRef.current.visible = isVisible;
    markerRef.current.visible = isVisible;

    if (isVisible) {
      const direction = probePosition.clone().sub(sunPosition).normalize();
      const footpoint = sunPosition.clone().add(direction.multiplyScalar(sunRadius));

      markerRef.current.position.copy(footpoint);
      markerRef.current.lookAt(probePosition);

      const positions = lineRef.current.geometry.attributes.position as THREE.BufferAttribute;
      positions.setXYZ(0, probePosition.x, probePosition.y, probePosition.z);
      positions.setXYZ(1, footpoint.x, footpoint.y, footpoint.z);
      positions.needsUpdate = true;
    }
  });

  return (
    <>
      <primitive object={line} ref={lineRef} />
      <mesh ref={markerRef}>
        <cylinderGeometry args={[0.15, 0.15, 0.05, 16]} />
        <meshBasicMaterial color="#00ffff" toneMapped={false} />
      </mesh>
    </>
  );
};

interface SolarFlaresProps {
  sunRef: React.RefObject<THREE.Group>;
  sunRadius: number;
  isPaused: boolean;
}

const SolarFlares: React.FC<SolarFlaresProps> = ({ sunRef, sunRadius, isPaused }) => {
  const flaresGroupRef = React.useRef<THREE.Group>(null!);

  type FlareData = {
    line: THREE.Line;
    velocity: THREE.Vector3;
    endPoint: THREE.Vector3;
    age: number;
    maxAge: number;
  };
  const activeFlaresRef = React.useRef<FlareData[]>([]);

  useFrame((_, delta) => {
    if (isPaused || !sunRef.current || !flaresGroupRef.current) return;
    
    const SPAWN_PROBABILITY = 0.015;
    if (Math.random() < SPAWN_PROBABILITY) {
      const sunPosition = sunRef.current.position;

      const randomDirection = new THREE.Vector3().randomDirection();
      const startPoint = sunPosition.clone().add(randomDirection.clone().multiplyScalar(sunRadius));

      const speed = THREE.MathUtils.randFloat(3, 7);
      const velocity = randomDirection.clone().multiplyScalar(speed);
      const maxAge = THREE.MathUtils.randFloat(0.8, 2.0);

      const geometry = new THREE.BufferGeometry().setFromPoints([startPoint, startPoint.clone()]);
      const material = new THREE.LineBasicMaterial({
        color: '#FFFF99',
        transparent: true,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      });
      const line = new THREE.Line(geometry, material);

      flaresGroupRef.current.add(line);
      activeFlaresRef.current.push({
        line,
        velocity,
        endPoint: startPoint.clone(),
        age: 0,
        maxAge,
      });
    }

    for (let i = activeFlaresRef.current.length - 1; i >= 0; i--) {
      const flare = activeFlaresRef.current[i];

      flare.age += delta;
      if (flare.age >= flare.maxAge) {
        flaresGroupRef.current.remove(flare.line);
        flare.line.geometry.dispose();
        (flare.line.material as THREE.Material).dispose();
        activeFlaresRef.current.splice(i, 1);
        continue;
      }

      flare.endPoint.add(flare.velocity.clone().multiplyScalar(delta));

      const positions = flare.line.geometry.attributes.position as THREE.BufferAttribute;
      positions.setXYZ(1, flare.endPoint.x, flare.endPoint.y, flare.endPoint.z);
      positions.needsUpdate = true;

      (flare.line.material as THREE.LineBasicMaterial).opacity = 1.0 - (flare.age / flare.maxAge);
    }
  });

  return <group ref={flaresGroupRef} />;
};

interface SunspotManagerProps {
  sunRef: React.RefObject<THREE.Group>;
  sunRadius: number;
  isPaused: boolean;
  probeRef: React.RefObject<THREE.Group>;
  onSunspotsUpdate: (spots: SunspotData[]) => void;
}

const SunspotManager: React.FC<SunspotManagerProps> = ({ sunRef, sunRadius, isPaused, probeRef, onSunspotsUpdate }) => {
  const activeSunspotsRef = React.useRef<SunspotData[]>([]);
  const { setSunspotProbability } = useSimulationStore.getState();
  
  const sunspotTexture = React.useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (!context) return null;

    // A radial gradient from solid black to transparent black to create a soft-edged spot,
    // which will be more visible against the bright sun texture.
    const gradient = context.createRadialGradient(64, 64, 48, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  React.useEffect(() => {
    return () => {
      if (sunRef.current) {
        activeSunspotsRef.current.forEach(spot => {
          sunRef.current?.remove(spot.mesh);
          spot.mesh.geometry.dispose();
          (spot.mesh.material as THREE.Material).dispose();
        });
      }
      activeSunspotsRef.current = [];
    };
  }, [sunRef]);

  useFrame((state, delta) => {
    if (isPaused || !sunRef.current) return;
    const cappedDelta = Math.min(delta, 1 / 30);
    const time = state.clock.getElapsedTime();

    let spawnProbability = 0.005; 
    const maxEffectDistance = 15.0; 
    const perihelionDistance = 1.2;

    if (probeRef.current) {
      const distanceToSun = probeRef.current.position.distanceTo(sunRef.current.position);
      if (distanceToSun < maxEffectDistance) {
        const closeness = 1.0 - THREE.MathUtils.clamp((distanceToSun - perihelionDistance) / (maxEffectDistance - perihelionDistance), 0, 1);
        spawnProbability += closeness * 0.05;
      }
    }

    setSunspotProbability(spawnProbability);

    if (Math.random() < spawnProbability) {
      const randomDirection = new THREE.Vector3().randomDirection();
      const position = randomDirection.clone().multiplyScalar(sunRadius * 1.001);

      const maxAge = THREE.MathUtils.randFloat(15, 45);
      const maxSize = THREE.MathUtils.randFloat(0.2, 0.6);

      const geometry = new THREE.CircleGeometry(1, 32);
      const material = new THREE.MeshBasicMaterial({
        map: sunspotTexture,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      mesh.position.copy(position);
      mesh.lookAt(sunRef.current.position);
      mesh.renderOrder = 2; // Render sunspots after the glow effect

      sunRef.current.add(mesh);
      activeSunspotsRef.current.push({ mesh, age: 0, maxAge, maxSize });
      onSunspotsUpdate(activeSunspotsRef.current.slice());
    }

    let didUpdate = false;
    for (let i = activeSunspotsRef.current.length - 1; i >= 0; i--) {
      const spot = activeSunspotsRef.current[i];
      spot.age += cappedDelta;

      if (spot.age >= spot.maxAge) {
        sunRef.current.remove(spot.mesh);
        spot.mesh.geometry.dispose();
        (spot.mesh.material as THREE.Material).dispose();
        activeSunspotsRef.current.splice(i, 1);
        didUpdate = true;
        continue;
      }

      const lifecycleProgress = spot.age / spot.maxAge;
      
      const baseScale = spot.maxSize * Math.sin(Math.PI * lifecycleProgress);
      const shimmer = 1.0 + 0.08 * Math.sin(time * 5 + i);
      spot.mesh.scale.set(baseScale * shimmer, baseScale * shimmer, 1);

      const baseOpacity = Math.sin(Math.PI * lifecycleProgress);
      const pulse = 0.8 + 0.2 * Math.sin(time * 3 + i);
      (spot.mesh.material as THREE.MeshBasicMaterial).opacity = baseOpacity * pulse;
    }

    if (didUpdate) {
      onSunspotsUpdate(activeSunspotsRef.current.slice());
    }
  });

  return null;
};

interface FootpointSunspotCorrelatorProps {
  probeRef: React.RefObject<THREE.Group>;
  sunRef: React.RefObject<THREE.Group>;
  sunRadius: number;
  activeSunspots: SunspotData[];
}

const FootpointSunspotCorrelator: React.FC<FootpointSunspotCorrelatorProps> = ({ probeRef, sunRef, sunRadius, activeSunspots }) => {
  const VISIBILITY_THRESHOLD = 15.0;
  const sunspotWorldPosition = React.useMemo(() => new THREE.Vector3(), []);
  const { setProbeFootpointDistanceToSunspot } = useSimulationStore.getState();

  useFrame(() => {
    if (!probeRef.current || !sunRef.current) {
      setProbeFootpointDistanceToSunspot(null);
      return;
    }

    const probePosition = probeRef.current.position;
    const sunPosition = sunRef.current.position;
    const distanceToSun = probePosition.distanceTo(sunPosition);

    if (distanceToSun >= VISIBILITY_THRESHOLD || activeSunspots.length === 0) {
      setProbeFootpointDistanceToSunspot(null);
      return;
    }

    const direction = probePosition.clone().sub(sunPosition).normalize();
    const footpoint = sunPosition.clone().add(direction.multiplyScalar(sunRadius));

    let minDistanceSq = Infinity;

    for (const spot of activeSunspots) {
      spot.mesh.getWorldPosition(sunspotWorldPosition);
      const distSq = footpoint.distanceToSquared(sunspotWorldPosition);
      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
      }
    }
    
    setProbeFootpointDistanceToSunspot(minDistanceSq === Infinity ? null : Math.sqrt(minDistanceSq));
  });

  return null;
};

const DampedControlsUpdater: React.FC = () => {
    const { controls } = useThree();
    useFrame(() => {
        if (controls && 'update' in controls && (controls as any).enabled) {
            (controls as any).update();
        }
    });
    return null;
}

const PulsingGlow: React.FC<{ sunRadius: number }> = ({ sunRadius }) => {
  const glowRef1 = React.useRef<THREE.Mesh>(null!);
  const glowRef2 = React.useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const pulseFactor1 = (Math.sin(time * 0.5) + 1) / 2; // Slow pulse, value from 0 to 1
    const pulseFactor2 = (Math.sin(time * 0.8) + 1) / 2; // Faster pulse

    if (glowRef1.current) {
      const scale1 = 1.15 + pulseFactor1 * 0.1; // Varies between 1.15 and 1.25
      glowRef1.current.scale.set(scale1, scale1, scale1);
      (glowRef1.current.material as THREE.MeshStandardMaterial).opacity = 0.15 + pulseFactor1 * 0.1; // Varies between 0.15 and 0.25
    }
    
    if (glowRef2.current) {
        const scale2 = 1.2 + pulseFactor2 * 0.15; // Varies between 1.2 and 1.35
        glowRef2.current.scale.set(scale2, scale2, scale2);
        (glowRef2.current.material as THREE.MeshStandardMaterial).opacity = 0.05 + pulseFactor2 * 0.1; // Varies between 0.05 and 0.15
    }
  });

  return (
    <>
      {/* Inner Glow Layer */}
      <mesh ref={glowRef1} renderOrder={1}>
        <sphereGeometry args={[sunRadius, 64, 64]} />
        <meshStandardMaterial
          color="#FFD700"
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* Outer Glow Layer */}
      <mesh ref={glowRef2} renderOrder={1}>
        <sphereGeometry args={[sunRadius, 64, 64]} />
        <meshStandardMaterial
          color="#FFA500"
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </>
  );
};


interface SunProps extends Pick<SunspotManagerProps, 'probeRef' | 'onSunspotsUpdate'> {
    sunRef: React.RefObject<THREE.Group>;
    sunRadius: number;
    isPaused: boolean;
    timeScale: number;
    showSunspots: boolean;
}

const Sun: React.FC<SunProps> = React.memo(({ sunRef, sunRadius, isPaused, timeScale, probeRef, onSunspotsUpdate, showSunspots }) => {
    const sunTexture = useTexture('sun2.jpg');
    const [isHovered, setIsHovered] = React.useState(false);
    
    useFrame((_, delta) => {
        if (!sunRef.current || isPaused) return;
        const totalTimeStep = Math.min(delta, 1 / 30) * timeScale;
        sunRef.current.rotation.y += ((2 * Math.PI) / 27) * totalTimeStep;
    });

    return (
        <group ref={sunRef}>
            {/* Gravity Well */}
            <mesh>
              <sphereGeometry args={[sunRadius * 1.5, 32, 32]} />
              <meshStandardMaterial
                  color={"#FFD700"}
                  transparent={true}
                  opacity={0.15}
              />
            </mesh>

            {/* Main Sun Mesh */}
            <mesh
                onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); }}
                onPointerOut={() => setIsHovered(false)}
            >
                <sphereGeometry args={[sunRadius, 64, 64]} />
                <meshStandardMaterial
                    map={sunTexture}
                    emissiveMap={sunTexture}
                    emissive="#FFD700"
                    emissiveIntensity={1.5}
                    toneMapped={false}
                />
            </mesh>
            
            {isHovered && (
                <Html position={[0, sunRadius + 0.5, 0]} center>
                    <div className="bg-space-blue/70 backdrop-blur-sm text-space-light text-sm px-2 py-1 rounded border border-slate-700/80 whitespace-nowrap">
                        Sun
                    </div>
                </Html>
            )}
            
            <PulsingGlow sunRadius={sunRadius} />

            <SolarFlares sunRef={sunRef} sunRadius={sunRadius} isPaused={isPaused} />

            {showSunspots && (
                <SunspotManager 
                    sunRef={sunRef} 
                    sunRadius={sunRadius}
                    isPaused={isPaused} 
                    probeRef={probeRef}
                    onSunspotsUpdate={onSunspotsUpdate}
                />
            )}
        </group>
    );
});
Sun.displayName = "Sun";

/**
 * Traces the path of the Parker Solar Probe in real-time. This component is
 * highly optimized for performance by directly manipulating THREE.js buffer geometry,
 * avoiding React state updates within the render loop which was causing lag.
 * It uses a pre-allocated buffer for line points and updates the draw range
 * incrementally, which is much more efficient than recreating geometry on each frame.
 */
const MAX_POINTS_PER_PATH = 10000;

const DynamicPath: React.FC<{
  bodyRef: React.RefObject<THREE.Group>;
  phases: OrbitPhase[];
  color: string;
  isPaused: boolean;
}> = ({ bodyRef, phases, color, isPaused }) => {
  const groupRef = React.useRef<THREE.Group>(null!);

  // This ref stores the THREE.js objects, avoiding React state updates in useFrame.
  const linesRef = React.useRef<{
    key: string;
    line: THREE.Line;
    material: THREE.LineBasicMaterial;
    geometry: THREE.BufferGeometry;
    positions: Float32Array; // The raw buffer
    pointCount: number; // How many points are currently in the buffer
  }[]>([]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      linesRef.current.forEach(lineData => {
        lineData.geometry.dispose();
        lineData.material.dispose();
      });
      linesRef.current = [];
    };
  }, []);
  
  // This effect synchronizes the line objects with the `phases` prop from the simulation.
  React.useEffect(() => {
    const MAX_VISIBLE_PATHS = 3;
    const existingKeys = new Set(linesRef.current.map(l => l.key));

    // Reset case: If phases has one item and we have more, it's a reset.
    if (phases.length === 1 && linesRef.current.length > 0) {
        linesRef.current.forEach(lineData => {
            groupRef.current?.remove(lineData.line);
            lineData.geometry.dispose();
            lineData.material.dispose();
        });
        linesRef.current = [];
        existingKeys.clear();
    }
    
    // Add new lines for new phases
    phases.forEach(phase => {
        if (!existingKeys.has(phase.startDate.toISOString())) {
            // Fade out old lines
            linesRef.current.forEach(lineData => {
                lineData.material.opacity = 0.5;
            });
            
            // Create new line
            const positions = new Float32Array(MAX_POINTS_PER_PATH * 3);
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setDrawRange(0, 0);

            const material = new THREE.LineBasicMaterial({
                color,
                linewidth: 2,
                transparent: true,
                opacity: 1.0,
            });

            const line = new THREE.Line(geometry, material);
            line.frustumCulled = false; // Important for lines that can span large areas

            const newLineData = {
                key: phase.startDate.toISOString(),
                line,
                material,
                geometry,
                positions,
                pointCount: 0,
            };

            linesRef.current.push(newLineData);
            groupRef.current.add(line);
        }
    });

    // Prune old lines if we exceed the max visible paths
    if (linesRef.current.length > MAX_VISIBLE_PATHS) {
        const linesToRemove = linesRef.current.splice(0, linesRef.current.length - MAX_VISIBLE_PATHS);
        linesToRemove.forEach(lineData => {
            groupRef.current.remove(lineData.line);
            lineData.geometry.dispose();
            lineData.material.dispose();
        });
    }

  }, [phases, color]);

  const lastPosition = React.useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (isPaused || !bodyRef.current || linesRef.current.length === 0) {
      return;
    }
    
    const activeLine = linesRef.current[linesRef.current.length - 1];
    // -1 to leave space for the 'live' anchor point that follows the probe
    if (!activeLine || activeLine.pointCount >= MAX_POINTS_PER_PATH - 1) {
        return;
    }

    const currentPosition = bodyRef.current.position;
    const { positions, geometry } = activeLine;

    // Add a new "committed" point only if the probe has moved a minimum distance.
    if (activeLine.pointCount === 0 || lastPosition.distanceToSquared(currentPosition) > 0.05) {
        lastPosition.copy(currentPosition);

        const index = activeLine.pointCount * 3;
        positions[index] = currentPosition.x;
        positions[index + 1] = currentPosition.y;
        positions[index + 2] = currentPosition.z;
        
        activeLine.pointCount++;
    }
    
    // Always update the next point in the buffer to the current position to make the line 'stick' to the probe.
    // This creates a "live" segment from the last committed point to the probe's current position.
    const livePointIndex = activeLine.pointCount * 3;
    positions[livePointIndex] = currentPosition.x;
    positions[livePointIndex + 1] = currentPosition.y;
    positions[livePointIndex + 2] = currentPosition.z;
    
    // We draw all committed points, plus the live point.
    geometry.setDrawRange(0, activeLine.pointCount + 1);
    geometry.attributes.position.needsUpdate = true;
    geometry.computeBoundingSphere();
  });

  return <group ref={groupRef} />;
};


export const Simulation: React.FC<SimulationProps> = ({ bodies, showOrbitPaths, isPaused, timeScale, startDate, cameraType, onFlybyDetected, showSunspots, showSpacetimeFabric }) => {
  const sunData = bodies.find(b => b.isSun);
  const otherBodies = bodies.filter(b => !b.isSun);
  const probeData = bodies.find(b => b.id === 'parker-probe');
  const earthRef = React.useRef<THREE.Group>(null!);
  const probeRef = React.useRef<THREE.Group>(null!);
  const venusRef = React.useRef<THREE.Group>(null!);
  const mercuryRef = React.useRef<THREE.Group>(null!);
  const [activeSunspots, setActiveSunspots] = React.useState<SunspotData[]>([]);

  const { setSunEarthDistance, setProbeSunDistance } = useSimulationStore.getState();

  // --- STABLE REF MANAGEMENT ---
  // This approach ensures that refs for each body are created only once and persist
  // across re-renders, preventing React warnings about changing ref objects.
  const genericBodyRefs = React.useRef<Map<string, React.RefObject<THREE.Group>>>(new Map()).current;
  
  // This map is rebuilt on each render but is populated with STABLE refs.
  const bodyRefs = new Map<string, React.RefObject<THREE.Group>>();
  bodies.forEach(body => {
      let ref: React.RefObject<THREE.Group>;
      switch (body.id) {
          case 'earth': ref = earthRef; break;
          case 'parker-probe': ref = probeRef; break;
          case 'venus': ref = venusRef; break;
          case 'mercury': ref = mercuryRef; break;
          default:
              if (!genericBodyRefs.has(body.id)) {
                  genericBodyRefs.set(body.id, React.createRef<THREE.Group>());
              }
              ref = genericBodyRefs.get(body.id)!;
              break;
      }
      bodyRefs.set(body.id, ref);
  });

  // Prune refs for bodies that are no longer in the simulation
  const currentBodyIds = new Set(bodies.map(b => b.id));
  for (const id of genericBodyRefs.keys()) {
      if (!currentBodyIds.has(id)) {
          genericBodyRefs.delete(id);
      }
  }

  const sunRef = sunData ? bodyRefs.get(sunData.id) : undefined;
  const hasProbe = bodies.some(b => b.id === 'parker-probe');

  return (
    <Canvas camera={{ position: [0, 40, 60], fov: 50 }}>
      <SimulationClock
        isPaused={isPaused}
        timeScale={timeScale}
        startDate={startDate}
      />
      <ambientLight intensity={0.2} />
      <hemisphereLight intensity={0.2} color="#87CEEB" groundColor="#0f172a" />
      {sunData && <pointLight position={sunData.position} color="#FFD700" intensity={1500} distance={300} decay={2} />}
      <Stars radius={150} depth={50} count={1500} factor={4} saturation={0} fade speed={1} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        enabled={cameraType === 'default'}
        maxDistance={200}
        enableDamping
        dampingFactor={0.05}
      />
      <DampedControlsUpdater />
      
      {sunData && sunRef && (
          <Sun
              sunRef={sunRef}
              sunRadius={2.0}
              isPaused={isPaused}
              timeScale={timeScale}
              probeRef={probeRef}
              onSunspotsUpdate={setActiveSunspots}
              showSunspots={showSunspots && hasProbe}
          />
      )}
      
      {otherBodies.map(body => {
        return (
            <Body
                key={body.id}
                data={body}
                sun={sunData}
                showOrbitPath={showOrbitPaths}
                isPaused={isPaused}
                timeScale={timeScale}
                ref={bodyRefs.get(body.id)}
                allBodies={bodies}
                bodyRefs={bodyRefs}
                venusRef={body.id === 'parker-probe' ? venusRef : undefined}
                onFlybyDetected={body.id === 'parker-probe' ? onFlybyDetected : undefined}
            />
        );
      })}

      {probeData && probeData.orbitPhases && showOrbitPaths && hasProbe && (
          <DynamicPath
            bodyRef={probeRef}
            phases={probeData.orbitPhases}
            color={probeData.color}
            isPaused={isPaused}
          />
      )}
      
      {showSpacetimeFabric && <SpacetimeFabric bodies={bodies} bodyRefs={bodyRefs} />}
      
      {sunData && sunRef && <CameraManager
        cameraType={cameraType}
        earthRef={earthRef}
        probeRef={probeRef}
        venusRef={venusRef}
        mercuryRef={mercuryRef}
        sunPosition={new THREE.Vector3(...sunData.position)}
      />}

      {sunRef && <DistanceTracker
        refA={sunRef}
        refB={earthRef}
        onDistanceUpdate={setSunEarthDistance}
      />}

      {hasProbe && sunRef && <DistanceTracker
        refA={sunRef}
        refB={probeRef}
        onDistanceUpdate={setProbeSunDistance}
      />}
      
      {hasProbe && sunRef && sunData && (
        <FootpointVisualizer
          probeRef={probeRef}
          sunRef={sunRef}
          sunRadius={2.0}
        />
      )}

      {hasProbe && sunRef && (
        <FootpointSunspotCorrelator
          probeRef={probeRef}
          sunRef={sunRef}
          sunRadius={2.0}
          activeSunspots={activeSunspots}
        />
      )}
    </Canvas>
  );
};
