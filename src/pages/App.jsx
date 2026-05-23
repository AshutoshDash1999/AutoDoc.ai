import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './Home';
import Generator from './Generator';
import Contributors from './Contributors';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/generator" element={<Generator />} />
          <Route path="/contributors" element={<Contributors />} />
    </Routes>
  );
}

export default App;