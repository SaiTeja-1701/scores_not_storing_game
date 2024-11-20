import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';
import Navbar from '../src/components/Navbar';
import Home from '../src/pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StartScreen from './StartScreen.jsx';
import MemoryGame from './pages/Memorygame.jsx';
import { UserContextProvider } from '../context/userContext';
import SessionReport from './SessionReports.jsx'


axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.withCredentials = true;

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [gameStage, setGameStage] = useState('start');
  const [score, setScore] = useState(0);
  const [sessionData, setSessionData] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);


  return (
    <UserContextProvider>
      <Navbar />
      <Toaster position="center" toastOptions={{ duration: 3000 }} />
      
      {/* Game and routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/memorygame" element={<MemoryGame />} />
        <Route path="/session-report" element={<SessionReport />} />
        <Route path="/startscreen" element={<StartScreen />} />
      </Routes>

    </UserContextProvider>
  );
}

export default App;

