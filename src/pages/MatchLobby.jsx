import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './MatchLobby.css';

export default function MatchLobby() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const response = await api.get('/matches');
                setMatches(response.data);
            } catch (err) {
                // Determine if it's auth failure vs server failure
                if (err.response?.status === 401) {
                    navigate('/auth');
                } else {
                    setError('Failed to load upcoming matches. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchMatches();
    }, [navigate]);

    const handleCreateTeam = (matchId) => {
        navigate(`/team-builder/${matchId}`);
    };

    if (loading) {
        return (
            <div className="lobby-container animate-fade-in">
                <h1 className="lobby-title">Match Lobby</h1>
                <div className="matches-grid">
                    {[1, 2, 3].map(n => (
                        <div key={n} className="glass-panel match-card skeleton">
                            <div className="skeleton-line title"></div>
                            <div className="skeleton-line time"></div>
                            <div className="skeleton-button"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="lobby-container animate-fade-in">
                <div className="error-banner">{error}</div>
            </div>
        );
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/auth');
    };

    return (
        <div className="lobby-container animate-fade-in">
            <div className="lobby-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="lobby-title" style={{ margin: 0 }}>Upcoming <span className="text-gradient">Matches</span></h1>
                <div className="lobby-nav" style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-secondary" onClick={() => navigate('/my-teams')}>My Teams</button>
                    <button className="btn btn-primary" onClick={handleLogout}>Logout</button>
                </div>
            </div>
            
            {matches.length === 0 ? (
                <div className="glass-panel empty-state">
                    <p>No matches available right now. Check back later!</p>
                </div>
            ) : (
                <div className="matches-grid">
                    {matches.map(match => (
                        <div key={match.id} className="glass-panel match-card">
                            <div className="match-teams">
                                <div className="team">{match.team_a}</div>
                                <div className="vs">VS</div>
                                <div className="team">{match.team_b}</div>
                            </div>
                            <div className="match-time">
                                📅 {new Date(match.start_time).toLocaleString(undefined, {
                                    weekday: 'short', month: 'short', day: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                })}
                            </div>

                            {match.max_entries && (() => {
                                const entryCount = match.entry_count || 0;
                                const maxEntries = match.max_entries;
                                const isFull = entryCount >= maxEntries;
                                const percent = (entryCount / maxEntries) * 100;
                                let barColor = '#22c55e';
                                if (percent >= 50 && percent <= 80) barColor = '#eab308';
                                else if (percent > 80) barColor = '#ef4444';

                                return (
                                    <div style={{ marginTop: '1rem', marginBottom: '1rem', width: '100%' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                                            <span style={{ opacity: 0.8 }}>{match.contest_name || 'Contest'}</span>
                                            {isFull ? (
                                                <span style={{ backgroundColor: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>FULL</span>
                                            ) : (
                                                <span style={{ opacity: 0.8 }}>{entryCount} / {maxEntries} spots filled</span>
                                            )}
                                        </div>
                                        <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${Math.min(percent, 100)}%`, background: barColor, transition: 'width 0.3s ease-in-out' }}></div>
                                        </div>
                                    </div>
                                );
                            })()}

                            <button 
                                className={`btn btn-primary create-btn ${match.max_entries && match.entry_count >= match.max_entries ? 'btn-disabled' : ''}`}
                                disabled={match.max_entries && match.entry_count >= match.max_entries}
                                style={{ marginTop: match.max_entries ? '0' : '1.5rem', opacity: match.max_entries && match.entry_count >= match.max_entries ? 0.5 : 1 }}
                                onClick={() => handleCreateTeam(match.id)}
                            >
                                {match.max_entries && match.entry_count >= match.max_entries ? 'Contest Full' : 'Create Team'}
                            </button>
                            <button 
                                className="btn btn-secondary create-btn"
                                style={{ marginTop: '0.5rem' }}
                                onClick={() => navigate('/leaderboard/1')}
                            >
                                View Leaderboard
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
