import React from "react";
import { Link } from "react-router-dom";

const ProjectDescription: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Space Fabric Gravity Simulator
        </h1>

        <div className="bg-gray-900 rounded-lg p-8 mb-10 shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-blue-400">
            Project Overview
          </h2>
          <p className="mb-6 text-lg">
            The Space Fabric Gravity Simulator is an interactive web-based
            application that visualizes gravitational interactions between
            celestial bodies, demonstrating the principles of Einstein's theory
            of general relativity where mass curves spacetime.
          </p>

          <h2 className="text-2xl font-bold mb-4 text-blue-400">Features</h2>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-lg">
            <li>
              Accurate simulation of gravitational interactions between
              celestial bodies
            </li>
            <li>Real-time visualization of the curvature of spacetime</li>
            <li>Interactive controls to manipulate simulation parameters</li>
            <li>Multiple viewpoints and camera controls</li>
            <li>Realistic rendering of planets, stars, and spacecraft</li>
            <li>Analytics graphs to monitor physical properties</li>
            <li>Sound effects and ambient music to enhance the experience</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4 text-blue-400">
            Technology Stack
          </h2>
          <div className="mb-6">
            <p className="mb-2 text-lg">
              This project is built using modern web technologies:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-lg">
              <li>React for UI components and state management</li>
              <li>Three.js and React Three Fiber for 3D rendering</li>
              <li>TypeScript for type-safe code</li>
              <li>Zustand for state management</li>
              <li>TailwindCSS for styling</li>
              <li>Vite for fast development and optimized builds</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold mb-4 text-blue-400">
            Scientific Background
          </h2>
          <p className="mb-6 text-lg">
            The simulation models the gravitational interactions between
            celestial bodies based on Newton's law of universal gravitation,
            while visually representing the curvature of spacetime as described
            by Einstein's general theory of relativity. This allows users to
            intuitively understand how massive objects like stars bend the
            fabric of spacetime, influencing the paths of smaller objects like
            planets and spacecraft.
          </p>

          <h2 className="text-2xl font-bold mb-4 text-blue-400">
            Educational Purpose
          </h2>
          <p className="text-lg">
            This simulator serves as an educational tool for students,
            educators, and space enthusiasts to explore complex astrophysical
            concepts in an interactive and visually engaging way. By
            manipulating parameters and observing the effects in real-time,
            users can develop an intuitive understanding of orbital mechanics
            and gravitational physics.
          </p>
        </div>

        <div className="flex justify-center space-x-4 mt-8">
          <Link
            to="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition duration-300"
          >
            Back to Simulator
          </Link>
          <Link
            to="/team"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition duration-300"
          >
            Back to Team
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProjectDescription;
