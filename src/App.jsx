import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import MatchLobby from './pages/MatchLobby';
import TeamBuilder from './pages/TeamBuilder'
import Leaderboard from './pages/Leaderboard'
import MyTeams from './pages/MyTeams'
import SharedTeam from './pages/SharedTeam'

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Navigate to="/auth" />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/lobby" element={<MatchLobby />} />
          <Route path="/team-builder/:match_id" element={<TeamBuilder />} />
          <Route path="/leaderboard/:contest_id" element={<Leaderboard />} />
          <Route path="/my-teams" element={<MyTeams />} />
          <Route path="/team/:team_id" element={<SharedTeam />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
