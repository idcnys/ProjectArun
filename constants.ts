// --- SIMULATION PHYSICS CONSTANTS ---
// These values are tuned for a balance of realism and visual feedback.
// The orbital period is now scaled so that 1 year in simulation corresponds
// to 365 seconds in real-time at 1x speed.
export const G = 0.00463; // Gravitational constant, tuned for a ~365 second orbit at r=25, M=1000

// --- SCALING & REALISM CONSTANTS ---
export const KM_IN_AU = 149.6e6;
export const SIMULATION_DISTANCE_SCALE = 6e6; // 1 simulation unit = 6,000,000 km
export const AU_IN_SIMULATION_UNITS = KM_IN_AU / SIMULATION_DISTANCE_SCALE; // ~25 units
