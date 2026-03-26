import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './MyTeams.css';

const RoleIcon = ({ role }) => {
    switch (role?.toUpperCase()) {
        case 'BAT': return <span title="Batsman">🏏</span>;
        case 'BOWL': return <span title="Bowler">🥎</span>;
        case 'AR': return <span title="All Rounder">⚔️</span>;
        case 'WK': return <span title="Wicket Keeper">🧤</span>;
        default: return <span title="Player">👤</span>;
    }
};

const PlayerModal = ({ player, onClose }) => {
    if (!player) return null;
    return (
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div className="glass-panel animate-scale-in" onClick={e => e.stopPropagation()} style={{
                width: '90%', maxWidth: '400px', padding: '2rem', position: 'relative'
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: '10px', right: '15px',
                    background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer'
                }}>&times;</button>

                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        {player.name} {player.is_overseas && <span title="Overseas Player">🌍</span>}
                    </h2>
                    <div style={{ color: 'var(--text-secondary)' }}>
                        {player.team_name} • <RoleIcon role={player.role} /> {player.role}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'center' }}>
                    <div className="glass-panel" style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Credits</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--neon-green)' }}>{player.credits}</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Points</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--neon-blue)' }}>{player.points || 0}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TeamCard = ({ team, handleShare, copiedTeamId, onPlayerClick }) => {
    const [players, setPlayers] = useState([]);
    const [showPlayers, setShowPlayers] = useState(false);
    const [loadingPlayers, setLoadingPlayers] = useState(false);

    const togglePlayers = async () => {
        if (!showPlayers && players.length === 0) {
            setLoadingPlayers(true);
            try {
                const res = await api.get(`/teams/${team.id}/players`);
                setPlayers(res.data);
            } catch (err) {
                console.error("Error fetching players:", err);
            } finally {
                setLoadingPlayers(false);
            }
        }
        setShowPlayers(!showPlayers);
    };

    const isNotStarted = team.total_points == 0;

    return (
        <div className="glass-panel match-card" style={{ display: 'flex', flexDirection: 'column' }}>
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
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <button
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '0.8rem' }}
                    onClick={togglePlayers}
                >
                    {showPlayers ? 'Hide Players' : 'View Players'}
                </button>
                <button
                    className="btn btn-primary create-btn"
                    style={{ flex: 1, padding: '0.8rem' }}
                    onClick={() => handleShare(team.id)}
                >
                    {copiedTeamId === team.id ? 'Copied!' : 'Share'}
                </button>
            </div>

            {showPlayers && (
                <div className="team-players-list animate-fade-in" style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                    {loadingPlayers ? (
                        <div style={{ textAlign: 'center', padding: '1rem' }}>Loading players...</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {players.map(p => (
                                <div
                                    key={p.id}
                                    className="player-list-item"
                                    onClick={() => onPlayerClick(p)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <RoleIcon role={p.role} />
                                        <div style={{ fontWeight: '500' }}>
                                            {p.name}
                                            {p.is_captain && <span style={{ marginLeft: '0.5rem', color: 'var(--neon-green)', fontWeight: 'bold' }}>(C)</span>}
                                            {p.is_vc && <span style={{ marginLeft: '0.5rem', color: 'var(--neon-blue)', fontWeight: 'bold' }}>(VC)</span>}
                                        </div>
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        {p.points || 0} pts
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default function MyTeams() {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copiedTeamId, setCopiedTeamId] = useState(null);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
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
                <div className="matches-grid" style={{ alignItems: 'start' }}>
                    {teams.map(team => (
                        <TeamCard
                            key={team.id}
                            team={team}
                            handleShare={handleShare}
                            copiedTeamId={copiedTeamId}
                            onPlayerClick={setSelectedPlayer}
                        />
                    ))}
                </div>
            )}

            <PlayerModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
        </div>
    );
}