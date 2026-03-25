import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './MyTeams.css';

export default function MyTeams() {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copiedTeamId, setCopiedTeamId] = useState(null);
    const navigate = useNavigate();

    const handleShare = (teamId) => {
        navigator.clipboard.writeText(window.location.origin + '/team/' + teamId);
        setCopiedTeamId(teamId);
        setTimeout(() => setCopiedTeamId(null), 2000);
    };

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await api.get('/teams/mine');
                setTeams(response.data);
            } catch (err) {
                if (err.response?.status === 401) {
                    navigate('/auth');
                } else {
                    setError('Failed to load your teams.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchTeams();
    }, [navigate]);

    if (loading) {
        return (
            <div className="lobby-container animate-fade-in">
                <div className="lobby-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 className="lobby-title" style={{ margin: 0 }}>My <span className="text-gradient">Teams</span></h1>
                    <button className="btn btn-secondary" onClick={() => navigate('/lobby')}>Back to Lobby</button>
                </div>
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

    return (
        <div className="lobby-container animate-fade-in">
            <div className="lobby-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="lobby-title" style={{ margin: 0 }}>My <span className="text-gradient">Teams</span></h1>
                <button className="btn btn-secondary" onClick={() => navigate('/lobby')}>Back to Lobby</button>
            </div>
            
            {teams.length === 0 ? (
                <div className="glass-panel empty-state">
                    <p>You haven't created any teams yet.</p>
                </div>
            ) : (
                <div className="matches-grid">
                    {teams.map(team => {
                        const isNotStarted = team.total_points == 0;
                        return (
                            <div key={team.id} className="glass-panel match-card">
                                <div className="match-teams">
                                    <div className="team">{team.team_a}</div>
                                    <div className="vs">VS</div>
                                    <div className="team">{team.team_b}</div>
                                </div>
                                <div className="match-time" style={{ marginBottom: '0.5rem', opacity: 0.8 }}>
                                    {team.contest_name || 'No Contest Linked'}
                                </div>
                                <div style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                    {isNotStarted ? "Match not started yet" : `${parseFloat(team.total_points).toFixed(1)} Pts`}
                                </div>
                                <div className="match-time" style={{ marginBottom: '1.5rem', opacity: 0.6 }}>
                                    Created: {new Date(team.created_at).toLocaleDateString()}
                                </div>
                                <button 
                                    className="btn btn-primary create-btn"
                                    onClick={() => handleShare(team.id)}
                                >
                                    {copiedTeamId === team.id ? 'Link copied!' : 'Copy Share Link'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
