import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TeamBuilder.css'; // Leverage existing glassmorphic grid classes

export default function SharedTeam() {
    const { team_id } = useParams();
    const navigate = useNavigate();
    const [teamData, setTeamData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSharedTeam = async () => {
            try {
                // Using generic axios securely without auth headers for this public route
                const response = await axios.get(`http://localhost:3000/teams/${team_id}/share`);
                setTeamData(response.data);
            } catch (err) {
                setError('Team not found or server error.');
            } finally {
                setLoading(false);
            }
        };
        fetchSharedTeam();
    }, [team_id]);

    if (loading) {
        return (
            <div className="tb-container animate-fade-in">
                <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                    Loading shared team...
                </div>
            </div>
        );
    }

    if (error || !teamData) {
        return <div className="tb-container error-banner">{error || 'Team not found'}</div>;
    }

    return (
        <div className="tb-container animate-fade-in">
            <div className="glass-panel top-bar" style={{ flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
                <div className="tb-match-title">
                    {teamData.team_a} <span className="text-gradient">VS</span> {teamData.team_b}
                </div>
                <div style={{ fontSize: '1.2rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                    Built by <span style={{ fontWeight: 'bold', color: '#fff' }}>{teamData.owner_name}</span> for {teamData.contest_name || 'practice'}
                </div>
                <div className="tb-stats" style={{ justifyContent: 'center' }}>
                    <div className="stat-badge">
                        <span>Total Points</span>
                        <strong className="text-gradient">{parseFloat(teamData.total_points).toFixed(1)}</strong>
                    </div>
                </div>
                <div className="tb-actions" style={{ marginTop: '1rem' }}>
                    <button 
                        className="btn btn-primary"
                        onClick={() => navigate('/auth')}
                    >
                        Join this Contest
                    </button>
                </div>
            </div>

            <div className="player-grid mt-2">
                {teamData.players.map((player, idx) => (
                    <div key={idx} className={`glass-panel player-card ${player.is_captain ? 'is-captain' : ''} ${player.is_vc ? 'is-vc' : ''}`}>
                        <div className="p-role-badge">{player.role}</div>
                        {player.is_captain && <div className="c-badge">C</div>}
                        {player.is_vc && <div className="vc-badge">VC</div>}

                        <div className="p-info">
                            <h3>{player.name}</h3>
                            <p className="p-credits text-gradient">{player.credits} CR</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
