import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../services/api';
import './Leaderboard.css';

const getCurrentUserId = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload)).id;
    } catch (e) {
        return null;
    }
};

export default function Leaderboard() {
    const { contest_id } = useParams();
    const navigate = useNavigate();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [connected, setConnected] = useState(false);
    
    // To track previous ranks for animation
    const prevRanksRef = useRef({});
    
    const currentUserId = getCurrentUserId();
    const userRowRef = useRef(null);
    const hasScrolledRef = useRef(false);

    useEffect(() => {
        // Fetch initial data
        const fetchInitialLeaderboard = async () => {
             try {
                 const response = await api.get(`/leaderboard/${contest_id}`);
                 setLeaderboard(response.data);
                 
                 // Update prevRanks
                 const ranks = {};
                 response.data.forEach(item => {
                     ranks[item.fantasy_team_id] = item.rank;
                 });
                 prevRanksRef.current = ranks;
                 
             } catch (err) {
                 if (err.response?.status === 401) {
                     navigate('/auth');
                 } else {
                     setError('Failed to load leaderboard.');
                 }
             } finally {
                 setLoading(false);
             }
        };

        fetchInitialLeaderboard();

        // Connect WebSocket
        const socket = io('http://localhost:3000'); // Ensure it matches backend URL

        socket.on('connect', () => {
            setConnected(true);
            socket.emit('join_contest', contest_id);
        });

        socket.on('disconnect', () => {
            setConnected(false);
        });

        socket.on('leaderboard_update', (data) => {
            setLeaderboard(prevLeaderboard => {
                // Update prev ranks before setting new data
                const currentRanks = {};
                prevLeaderboard.forEach(item => {
                    currentRanks[item.fantasy_team_id] = item.rank;
                });
                prevRanksRef.current = currentRanks;
                return data;
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [contest_id, navigate]);

    useEffect(() => {
        if (leaderboard.length > 0 && userRowRef.current && !hasScrolledRef.current) {
            userRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            hasScrolledRef.current = true;
        }
    }, [leaderboard]);

    // Helper to get row animation class
    const getRowClass = (item) => {
        const prevRank = prevRanksRef.current[item.fantasy_team_id];
        if (!prevRank) return ''; // New entry
        if (item.rank < prevRank) return 'flash-up'; // Rank improved (smaller number)
        if (item.rank > prevRank) return 'flash-down'; // Rank worsened
        return '';
    };

    if (loading) {
        return (
            <div className="leaderboard-container animate-fade-in">
                <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem' }}>
                    Loading Leaderboard...
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="leaderboard-container error-banner">{error}</div>;
    }

    return (
        <div className="leaderboard-container animate-fade-in">
            <div className="leaderboard-header">
                <div>
                    <h1 className="lobby-title">Live <span className="text-gradient">Leaderboard</span></h1>
                    <button className="btn btn-secondary back-btn" onClick={() => navigate('/lobby')}>
                        ← Back to Lobby
                    </button>
                </div>
                <div className={`status-badge ${connected ? 'live' : 'offline'}`}>
                    {connected ? (
                        <>
                            <span className="pulse-dot"></span> LIVE
                        </>
                    ) : (
                        'OFFLINE'
                    )}
                </div>
            </div>

            <div className="glass-panel table-container">
                {leaderboard.length === 0 ? (
                    <p className="empty-state">No teams have joined this contest yet.</p>
                ) : (
                    <table className="leaderboard-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Team Owner</th>
                                <th>Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((item, i) => (
                                // Add key that uses points slightly, to force re-render for flash animation
                                // Actually, changing class triggers animation, but React needs to know it changed.
                                // We'll use a hack to ensure animation replay by forcing a new key if rank changes
                                <tr 
                                    key={`${item.fantasy_team_id}-${item.rank}`} 
                                    className={`${getRowClass(item)} ${item.user_id === currentUserId ? 'glowing-row' : ''}`}
                                    ref={item.user_id === currentUserId ? userRowRef : null}
                                >
                                    <td className="rank-col">
                                        #{item.rank}
                                        {item.user_id === currentUserId && <span className="you-badge">YOU</span>}
                                    </td>
                                    <td>{item.user_name}</td>
                                    <td className="points-col">{item.points}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
