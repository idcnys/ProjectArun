# Project Details
- [Live Simulation (website)](https://team-arun.vercel.app)

## Part 01 - Data Analysis Documentation
**All files are available in `Data_Analysis` Folder**

- [Google Colab Notebook ](https://colab.research.google.com/drive/1aG_yOu6RYdN6T1bPLp9ZDupb0vwmp-LK?usp=sharing)

## Problem Connection  
Solar storms pose a significant threat to modern technology, including satellites, GPS navigation, aviation systems, power grids, and everyday electronic devices. One of the strongest precursors to solar storms is the appearance of large-area sunspots on the surface of the Sun.  

While sunspots have been studied for centuries, most existing public tools and resources focus on general sunspot counts or overall cycle strength. They often do not provide detailed insights into:  
- When large sunspots emerge within a solar cycle  
- How long they persist (their duration)  
- Where they form on the Sun’s surface (their coordinates in latitude and longitude)  

Without this information, it is harder to anticipate which sunspots have the potential to grow into significant solar storms. Understanding the timing, lifetime, and location of big sunspots can improve space weather prediction and help protect sensitive technologies on Earth and in orbit.  

## Our Approach  
To address this challenge, our project focuses on analyzing large-area sunspots as early indicators of potential solar storms. We used historical and modern sunspot datasets (e.g., GPR, NASA, NOAA) and applied data analysis techniques to study:  
- When big sunspots emerge within each solar cycle  
- How long they last by tracking their duration and decay  
- Where they occur on the solar surface (latitude and longitude)  

## Visualizations and Methods  
1. **Butterfly diagram (1874–1976)**  
   - We first plotted a butterfly diagram covering more than a century of sunspot data to observe general latitudinal migration patterns across solar cycles.

    <img width="500" alt="Image" src="https://github.com/user-attachments/assets/12f43a83-1bad-4234-9e69-995f5f31c96d" />
2. **Zooming into specific cycles**  
   - To focus on large sunspots, we zoomed into individual cycles and used color gradients to highlight sunspot area — with darker colors representing larger areas.

<img width="500" alt="Image" src="https://github.com/user-attachments/assets/1508091b-97fd-4d23-88e0-261493ba9529" />

3. **Overlapping cycles**  
   - We then plotted a common solar cycle by overlapping all cycles to identify recurring large sunspot events, allowing us to pinpoint common points for future analysis.
 
<img width="500" alt="image" src="https://github.com/user-attachments/assets/b81b8da8-7684-44e7-8d9a-0947d29ffc70" />

4. **Heatmap of probability and density**  
   - We plotted a heatmap showing the probability and density of forming large sunspots. This visualization allowed us to identify regions in time and space where big sunspots are more likely to appear.  
<img width="500" alt="image" src="https://github.com/user-attachments/assets/a2f7a07e-8f1b-4fa2-8c52-4c518c5a7d4d" />
<img width="500" alt="image" src="https://github.com/user-attachments/assets/0e976961-bd20-4477-bc68-74f31f706a22" />

5. **Bar graphs per cycle**  
   - For each solar cycle, we plotted bar graphs to determine when in the cycle larger sunspots are more likely to appear and analyzed these temporal patterns.  
<img width="500" alt="Image" src="https://github.com/user-attachments/assets/a31cd1ce-b1b3-4b18-8a53-a4887432287d" />

6. **Duration vs. Area analysis**  
   - We plotted sunspot duration against area, treating area as the independent variable. This analysis helped us understand whether larger sunspots tend to last longer, which is important for assessing potential solar storm risks.  
<img width="500" alt="Image" src="https://github.com/user-attachments/assets/1d3fa9d7-8b2a-4b4e-a225-6f63ebfa36c5" />

7. **Time vs. Longitude scatter plots**  
   - We created scatter plots of time vs. longitude with sunspot area highlighted, aiming to find patterns. Since no clear pattern emerged, we took the next step.  
<img width="500" alt="image" src="https://github.com/user-attachments/assets/bf6eeeae-6391-4dc9-a4ab-27b2de6a456a" />

## Neural Network Modeling  
We trained a neural network with **(time, latitude, area) → longitude** as inputs, to predict the coordinates of sunspots in upcoming cycles, aiming for a robust pattern detection method.  
<img width="500" alt="image" src="https://github.com/user-attachments/assets/515dd903-5f7d-4a50-badf-e73f90ea5a47" />
<img width="500" alt="image" src="https://github.com/user-attachments/assets/42ace5d3-3516-48a4-86a8-d7be4c3e6ffe" />

## Outcome  
By identifying when, where, and how long large sunspots occur, this project contributes to:  
- Better solar storm forecasting  
- Early protection of Earth and space technologies  
- Supporting future space weather monitoring missions
 



## Part 02 - Simulation Documentation

## Overview

This project simulates the Parker Solar Probe's mission using real orbital mechanics and Einstein's theory of general relativity. The simulation includes accurate gravitational interactions, orbital dynamics, and a visual representation of spacetime curvature.

## Table of Contents

1. [Physics Constants](#physics-constants)
2. [Scaling Factors](#scaling-factors)
3. [Orbital Mechanics](#orbital-mechanics)
4. [Gravitational Physics](#gravitational-physics)
5. [Spacetime Curvature](#spacetime-curvature)
6. [Time Mechanics](#time-mechanics)
7. [Simulation Assumptions](#simulation-assumptions)
8. [Mathematical Formulas](#mathematical-formulas)

## Physics Constants

### Gravitational Constant
```javascript
G = 0.00463 // Simulation units
```
**Real Value**: 6.674 × 10⁻¹¹ m³ kg⁻¹ s⁻²  
**Scaling**: Tuned for simulation to achieve realistic orbital periods

### Distance Scaling
```javascript
SIMULATION_DISTANCE_SCALE = 6e6 // km per simulation unit
AU_IN_SIMULATION_UNITS = 25 // Astronomical units in simulation
```
**Conversion**: 1 simulation unit = 6,000,000 km

### Mass Values (Simulation Units)
- **Sun**: 1000 units (≈ 1.989 × 10³⁰ kg)
- **Earth**: 0.3 units (≈ 5.972 × 10²⁴ kg)
- **Venus**: 0.245 units (≈ 4.867 × 10²⁴ kg)
- **Mercury**: 0.017 units (≈ 3.301 × 10²³ kg)
- **Parker Probe**: 0.0003 units (≈ 685 kg)

## Scaling Factors

### Time Scaling
```javascript
timeScale = days per real second
```
- **1x speed**: 1 simulation day = 1 real second
- **365x speed**: 1 simulation year = 1 real second
- **Default orbit period**: Earth completes orbit in ~365 seconds at 1x speed

### Distance Scaling Rationale
The simulation uses a logarithmic scaling approach to maintain visual clarity while preserving orbital mechanics:

1. **Real AU**: 149.6 million km
2. **Simulation AU**: 25 units
3. **Scale Factor**: 1 unit = 6 million km

This scaling maintains the correct ratios between planetary distances while making the simulation visually manageable.

## Orbital Mechanics

### Kepler's Laws Implementation

#### First Law (Elliptical Orbits)
```javascript
// Orbital eccentricity calculation
e = |velocity × angularMomentum| / (μ) - position / |position|
```

#### Second Law (Equal Areas)
```javascript
// Angular momentum conservation
L = position × velocity = constant
```

#### Third Law (Orbital Periods)
```javascript
// Period calculation
T² ∝ a³
where a = semi-major axis
```

### Orbital Elements Calculation

```javascript
// Perihelion distance (closest approach to Sun)
q = h² / (μ × (1 + e))

where:
- h = |position × velocity| (specific angular momentum)
- μ = G × M_sun (gravitational parameter)
- e = eccentricity
```

### Velocity Calculations

```javascript
// Circular orbital velocity
v_circular = √(GM/r)

// Escape velocity
v_escape = √(2GM/r)

// Orbital velocity for elliptical orbit
v = √(μ × (2/r - 1/a))
```

## Gravitational Physics

### Newton's Law of Universal Gravitation
```javascript
F = G × m₁ × m₂ / r²

// Acceleration calculation
a = F / m = G × M / r²
```

### Gravitational Softening
To prevent numerical instabilities at close approaches:
```javascript
// Softened gravitational force
F = G × m₁ × m₂ / (r² + ε²)

where ε = softening radius:
- Sun: 5.0 units
- Planets: 0.05 units (for precise gravity assists)
```

### N-Body Integration
Uses Verlet integration for numerical stability:

```javascript
// Position update
x(t + Δt) = x(t) + v(t)Δt + ½a(t)Δt²

// Velocity update  
v(t + Δt) = v(t) + ½[a(t) + a(t + Δt)]Δt
```

## Spacetime Curvature

### Einstein Field Equations (Simplified)
The spacetime fabric visualization approximates the Schwarzschild metric:

```glsl
// Schwarzschild radius (simplified for visualization)
r_s = 2GM/c² ≈ 2 × mass × scale_factor

// Spacetime curvature
curvature = r_s / max(distance, r_s × 0.1)

// Depression calculation
depression = -curvature × exp(-distance × 0.02) × 3.0
```

### Gravitational Waves
Simulated as ripples propagating from accelerating masses:

```glsl
// Wave equation
wave_amplitude = velocity × exp(-distance × 0.01) × 0.02
wave_phase = (distance / wavelength) - (time × wave_speed)
wave = sin(wave_phase × 2π) × wave_amplitude
```

**Wave Properties**:
- Speed: 3.0 simulation units/time (approximating speed of light)
- Wavelength: 8.0 simulation units
- Amplitude: Proportional to body velocity

## Time Mechanics

### Simulation Clock
```javascript
// Time progression
simulation_time += real_delta_time × time_scale

// Date calculation
current_date = start_date + simulation_time × 24 × 60 × 60 × 1000
```

### Time Step Capping
```javascript
// Prevent physics instability
capped_delta = Math.min(delta_time, 1/30) // Maximum 30fps equivalent

// Adaptive sub-stepping for high time scales
sub_steps = Math.min(Math.ceil(Math.abs(total_time_step)), 100)
sub_step_delta = total_time_step / sub_steps
```

## Simulation Assumptions

### Simplifications Made

1. **Two-Body Problem Focus**: While the simulation includes multiple bodies, the primary focus is Sun-probe interaction
2. **Constant Mass**: Bodies don't lose mass (ignoring fuel consumption, solar wind, etc.)
3. **Point Masses**: Bodies treated as point masses (no tidal effects, rotation effects on gravity)
4. **Newtonian Gravity**: Uses Newtonian mechanics with relativistic visualization
5. **No Radiation Pressure**: Solar radiation pressure on the probe is neglected
6. **Ideal Orbits**: No perturbations from asteroids, other planets' moons, etc.

### Accuracy Considerations

1. **Orbital Periods**: Scaled to be observable (Earth year = 365 seconds at 1x)
2. **Distance Scaling**: Logarithmic scaling preserves ratios but not absolute sizes
3. **Mass Ratios**: Preserved relative to real celestial bodies
4. **Gravitational Assists**: Accurately modeled using precise gravitational calculations

### Real vs. Simulated Values

| Property | Real Value | Simulated Value | Ratio |
|----------|------------|-----------------|-------|
| Earth-Sun Distance | 149.6M km | 25 units | 1:5.984M |
| Earth Orbital Period | 365.25 days | 365 seconds | 1:86400 |
| Sun Mass | 1.989×10³⁰ kg | 1000 units | 1:1.989×10²⁷ |
| Probe Mass | 685 kg | 0.0003 units | 1:2.28×10⁶ |

## Mathematical Formulas

### Coordinate Transformations

```javascript
// Cartesian to Polar
r = √(x² + y²)
θ = atan2(y, x)

// Polar to Cartesian
x = r × cos(θ)
y = r × sin(θ)
```

### Orbital Energy
```javascript
// Specific orbital energy
E = v²/2 - μ/r

// For elliptical orbits: E = -μ/(2a)
// For parabolic orbits: E = 0
// For hyperbolic orbits: E > 0
```

### Angular Momentum
```javascript
// Specific angular momentum
h = r × v = r × v × sin(φ)

// Conservation law
h = constant throughout orbit
```

### Perihelion Calculation
```javascript
// Distance of closest approach
q = a × (1 - e)

// Using angular momentum
q = h² / (μ × (1 + e))
```

### Gravity Assist Mechanics
```javascript
// Velocity change during flyby
Δv = 2 × V_planet × sin(θ/2)

where:
- V_planet = planet's orbital velocity
- θ = deflection angle
```

## Implementation Notes

### Performance Optimizations

1. **Adaptive Time Stepping**: Reduces computation during stable periods
2. **Distance Culling**: Gravitational effects calculated only for nearby bodies
3. **Shader-Based Spacetime**: GPU-accelerated spacetime curvature calculations
4. **Efficient Collision Detection**: Uses sphere-sphere intersection for flyby detection

### Numerical Stability

1. **Gravitational Softening**: Prevents infinite forces at zero distance
2. **Time Step Limiting**: Caps maximum time step to maintain accuracy
3. **Double Precision**: Critical calculations use higher precision
4. **Symplectic Integration**: Preserves energy in long-term simulations

### Visual Accuracy

1. **Logarithmic Scaling**: Maintains visual proportions
2. **Real Color Mapping**: Planet colors based on actual appearance
3. **Realistic Textures**: Uses NASA imagery for celestial bodies
4. **Accurate Model**: Parker Solar Probe 3D model based on real specifications

## References

1. NASA Parker Solar Probe Mission Documentation
2. "Orbital Mechanics for Engineering Students" by Curtis, Howard D.
3. "Einstein's Theory of Relativity" by Born, Max
4. NASA JPL Small-Body Database
5. "Numerical Recipes in C" by Press, Teukolsky, Vetterling, and Flannery

## Contributing

When modifying physics parameters, ensure:
1. Dimensional analysis is correct
2. Scaling factors are consistently applied
3. Physical constants maintain proper ratios
4. Simulation stability is preserved
5. Visual accuracy is maintained

---

*This simulation is designed for educational purposes and demonstrates fundamental principles of orbital mechanics and general relativity. While simplified, it maintains essential physical relationships and provides accurate qualitative behavior.*
