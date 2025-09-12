
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import TeamMembers from './pages/TeamMembers';
import ProjectDescription from './pages/ProjectDescription';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/team" element={<TeamMembers />} />
        <Route path="/about" element={<ProjectDescription />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
