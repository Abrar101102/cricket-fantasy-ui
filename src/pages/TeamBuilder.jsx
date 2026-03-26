import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import TeamLogo from '../components/common/TeamLogo';
import './TeamBuilder.css';

// Map full team names → team codes for logos
const TEAM_CODE_MAP = {
    'Mumbai Indians': 'MI',
    'Chennai Super Kings': 'CSK',
    'Royal Challengers Bengaluru': 'RCB',
    'Royal Challengers Bangalore': 'RCB',
    'Gujarat Titans': 'GT',
    'Lucknow Super Giants': 'LSG',
    'Kolkata Knight Riders': 'KKR',
    'Delhi Capitals': 'DC',
    'Rajasthan Royals': 'RR',
    'Sunrisers Hyderabad': 'SRH',
    'Punjab Kings': 'PBKS',
};

const getTeamCode = (teamName) => {
    if (!teamName) return null;
    // Try exact match first
    if (TEAM_CODE_MAP[teamName]) return TEAM_CODE_MAP[teamName];
    // Try uppercase abbreviation match (e.g. "MI", "CSK" stored directly)
    const upper = teamName.toUpperCase();
    if (['MI', 'CSK', 'RCB', 'GT', 'LSG', 'KKR', 'DC', 'RR', 'SRH', 'PBKS'].includes(upper)) return upper;
    return null;
};

const RequirementBadge = ({ met, text }) => (
    <div style={{
        padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold',
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        background: met ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 255, 255, 0.05)',
        color: met ? '#00e676' : 'rgba(255, 255, 255, 0.4)',
        border: `1px solid ${met ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
        transition: 'all 0.3s'
    }}>
        {met ? '✓' : '○'} {text}
    </div>
);

// Modal for entering team name before saving
const TeamNameModal = ({ onConfirm, onCancel, loading, error }) => {
    const [name, setName] = useState('');
    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h2 style={{ margin: 0 }}>Name Your Team</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.9rem' }}>
                    Give this team a unique name for this match. You can create multiple teams with different names.
                </p>
                <input
                    autoFocus
                    type="text"
                    maxLength={50}
                    placeholder="e.g. My Dream XI, Beast Mode..."
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && name.trim().length >= 3 && onConfirm(name)}
                    style={{
                        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '10px', padding: '0.75rem 1rem', color: '#fff',
                        fontSize: '1rem', outline: 'none', width: '100%', boxSizing: 'border-box'
                    }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
                    <span>{name.trim().length < 3 ? `Min 3 characters (${name.length}/50)` : `${name.length}/50`}</span>
                </div>
                {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 'bold' }}>{error}</div>}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel} disabled={loading}>Cancel</button>
                    <button
                        className={`btn ${name.trim().length >= 3 ? 'btn-save-ready' : 'btn-disabled'}`}
                        style={{ flex: 2 }}
                        disabled={name.trim().length < 3 || loading}
                        onClick={() => onConfirm(name)}
                    >
                        {loading ? 'Saving...' : 'Save Team'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function TeamBuilder() {
    const { match_id } = useParams();
    const navigate = useNavigate();

    const [match, setMatch] = useState(null);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [contestError, setContestError] = useState(null);

    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [captainId, setCaptainId] = useState(null);
    const [vcId, setVcId] = useState(null);
    const [filterTab, setFilterTab] = useState('ALL');
    const [toast, setToast] = useState('');

    // Modal state
    const [showNameModal, setShowNameModal] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [modalError, setModalError] = useState(null);

    useEffect(() => {
        const fetchMatchAndPlayers = async () => {
            try {
                const response = await api.get(`/matches/${match_id}`);
                setMatch(response.data.match);
                setPlayers(response.data.players || []);
            } catch (err) {
                setError('Failed to load match details.');
            } finally {
                setLoading(false);
            }
        };
        fetchMatchAndPlayers();
    }, [match_id]);

    const creditsUsed = useMemo(() => players
        .filter(p => selectedPlayers.includes(p.id))
        .reduce((sum, p) => sum + parseFloat(p.credits), 0),
        [players, selectedPlayers]);

    const roleCounts = useMemo(() => {
        const counts = { WK: 0, BAT: 0, AR: 0, BOWL: 0 };
        players.forEach(p => {
            if (selectedPlayers.includes(p.id))
                counts[p.role.toUpperCase()] = (counts[p.role.toUpperCase()] || 0) + 1;
        });
        return counts;
    }, [players, selectedPlayers]);

    const ROLE_LIMITS = { WK: { min: 1, max: 4 }, BAT: { min: 3, max: 6 }, AR: { min: 1, max: 4 }, BOWL: { min: 3, max: 6 } };

    const overseasCount = useMemo(() =>
        players.filter(p => selectedPlayers.includes(p.id) && p.is_overseas).length,
        [players, selectedPlayers]);

    const teamNames = useMemo(() => {
        const teams = new Set();
        players.forEach(p => { if (p.team_name) teams.add(p.team_name); });
        return Array.from(teams);
    }, [players]);

    const teamCounts = useMemo(() => {
        const counts = {};
        if (teamNames[0]) counts[teamNames[0]] = 0;
        if (teamNames[1]) counts[teamNames[1]] = 0;
        players.forEach(p => {
            if (selectedPlayers.includes(p.id) && p.team_name)
                counts[p.team_name] = (counts[p.team_name] || 0) + 1;
        });
        return counts;
    }, [players, selectedPlayers, teamNames]);

    const handlePlayerClick = (player) => {
        const isSelected = selectedPlayers.includes(player.id);
        if (!isSelected) {
            if (selectedPlayers.length >= 11) return;
            if (creditsUsed + parseFloat(player.credits) > 100) return;
            if ((roleCounts[player.role.toUpperCase()] || 0) >= ROLE_LIMITS[player.role.toUpperCase()].max) return;
            setSelectedPlayers([...selectedPlayers, player.id]);
        } else {
            if (captainId !== player.id && vcId !== player.id) {
                setCaptainId(player.id);
                if (vcId === player.id) setVcId(null);
            } else if (captainId === player.id) {
                setCaptainId(null);
                setVcId(player.id);
            } else if (vcId === player.id) {
                setVcId(null);
                setSelectedPlayers(selectedPlayers.filter(id => id !== player.id));
            }
        }
    };

    const isTeamValid = () => {
        if (selectedPlayers.length !== 11) return false;
        if (!captainId || !vcId) return false;
        if (creditsUsed > 100) return false;
        if (roleCounts.WK < ROLE_LIMITS.WK.min) return false;
        if (roleCounts.BAT < ROLE_LIMITS.BAT.min) return false;
        if (roleCounts.AR < ROLE_LIMITS.AR.min) return false;
        if (roleCounts.BOWL < ROLE_LIMITS.BOWL.min) return false;
        if (overseasCount > 4) return false;
        if (teamNames.some(t => teamCounts[t] > 7)) return false;
        return true;
    };

    // Step 1: validate → open modal
    const handleSaveClick = () => {
        if (!isTeamValid()) return;
        setModalError(null);
        setContestError(null);
        setShowNameModal(true);
    };

    // Step 2: modal confirms name → call API
    const handleConfirmSave = async (teamName) => {
        setSaveLoading(true);
        setModalError(null);
        try {
            const payload = {
                match_id: match.id,
                contest_id: null,
                player_ids: selectedPlayers,
                captain_id: captainId,
                vc_id: vcId,
                team_name: teamName.trim(),
            };
            const response = await api.post('/teams/create', payload);
            setShowNameModal(false);
            setToast(response.data.message || 'Team created successfully!');
            setTimeout(() => navigate('/lobby'), 1500);
        } catch (err) {
            const errMsg = err.response?.data?.error || 'Failed to save team';
            setModalError(errMsg); // show error inside modal, not outside
        } finally {
            setSaveLoading(false);
        }
    };

    const filteredPlayers = useMemo(() => {
        if (filterTab === 'ALL') return players;
        return players.filter(p => p.role.toUpperCase() === filterTab);
    }, [players, filterTab]);

    const getDisabledReason = (player) => {
        if (selectedPlayers.includes(player.id)) return null;
        if (selectedPlayers.length >= 11) return 'Max 11 players selected';
        if (creditsUsed + parseFloat(player.credits) > 100) return 'Not enough credits';
        if (roleCounts[player.role.toUpperCase()] >= ROLE_LIMITS[player.role.toUpperCase()].max) return `Max ${ROLE_LIMITS[player.role.toUpperCase()].max} ${player.role}`;
        if (overseasCount >= 4 && player.is_overseas) return 'Overseas limit reached (4/4)';
        if (player.team_name && teamCounts[player.team_name] >= 7) return 'Team limit reached (7/7)';
        return null;
    };

    if (loading) return <div className="tb-container"><div className="skeleton-grid" /></div>;
    if (error && !match) return <div className="tb-container"><div className="error-banner">{error}</div></div>;

    if (match?.locked) {
        return (
            <div className="tb-container animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px', width: '100%' }}>
                    <h2 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Team selection is closed.</h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.1rem' }}>This match has started.</p>
                    <button className="btn btn-secondary" style={{ marginTop: '2rem' }} onClick={() => navigate('/lobby')}>Back to Lobby</button>
                </div>
            </div>
        );
    }

    const teamACode = getTeamCode(match?.team_a);
    const teamBCode = getTeamCode(match?.team_b);

    return (
        <div className="tb-container animate-fade-in">
            {toast && <div className="toast-success">{toast}</div>}
            {showNameModal && (
                <TeamNameModal
                    onConfirm={handleConfirmSave}
                    onCancel={() => setShowNameModal(false)}
                    loading={saveLoading}
                    error={modalError}
                />
            )}

            <div className="glass-panel top-bar">
                {/* ── Match title with logos ── */}
                <div className="tb-match-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                    <div style={{ width: 44, height: 44, flexShrink: 0 }}>
                        <TeamLogo teamCode={teamACode} />
                    </div>
                    <span>{match.team_a}</span>
                    <span className="text-gradient" style={{ fontWeight: 900 }}>VS</span>
                    <span>{match.team_b}</span>
                    <div style={{ width: 44, height: 44, flexShrink: 0 }}>
                        <TeamLogo teamCode={teamBCode} />
                    </div>
                </div>

                <div className="tb-stats">
                    <div className="stat-badge"><span>Players</span><strong>{selectedPlayers.length}/11</strong></div>
                    <div className={`stat-badge ${overseasCount === 4 ? 'error-text' : ''}`}>
                        <span>Overseas</span><strong>{overseasCount}/4</strong>
                    </div>
                    {teamNames.length >= 2 && (
                        <div className={`stat-badge ${(teamCounts[teamNames[0]] === 7 || teamCounts[teamNames[1]] === 7) ? 'error-text' : ''}`}>
                            <span>Teams</span>
                            <strong>{teamNames[0].substring(0, 3).toUpperCase()}: {teamCounts[teamNames[0]]} | {teamNames[1].substring(0, 3).toUpperCase()}: {teamCounts[teamNames[1]]}</strong>
                        </div>
                    )}
                    <div className={`stat-badge ${creditsUsed > 100 ? 'error-text' : ''}`}>
                        <span>Credits</span><strong>{creditsUsed.toFixed(1)} / 100</strong>
                    </div>
                </div>

                <div className="tb-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    {contestError && <div style={{ color: '#ef4444', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold' }}>{contestError}</div>}
                    <button
                        className={`btn ${isTeamValid() ? 'btn-save-ready' : 'btn-disabled'}`}
                        disabled={!isTeamValid()}
                        onClick={handleSaveClick}
                    >
                        Save Team
                    </button>
                </div>
            </div>

            {error && <div className="error-banner mt-2">{error}</div>}

            {!isTeamValid() && (
                <div className="glass-panel" style={{ padding: '1.2rem', paddingBottom: '0.8rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)' }}>
                    <h4 style={{ marginBottom: '1rem', color: '#a0a0a0', fontWeight: '600', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Required to Save Team</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                        <RequirementBadge met={selectedPlayers.length === 11} text={`11 Players (${selectedPlayers.length}/11)`} />
                        <RequirementBadge met={captainId && vcId} text="Captain & VC" />
                        <RequirementBadge met={creditsUsed <= 100} text="Max 100 Credits" />
                        <RequirementBadge met={roleCounts.WK >= ROLE_LIMITS.WK.min} text={`WK (${roleCounts.WK}/${ROLE_LIMITS.WK.min})`} />
                        <RequirementBadge met={roleCounts.BAT >= ROLE_LIMITS.BAT.min} text={`BAT (${roleCounts.BAT}/${ROLE_LIMITS.BAT.min})`} />
                        <RequirementBadge met={roleCounts.AR >= ROLE_LIMITS.AR.min} text={`AR (${roleCounts.AR}/${ROLE_LIMITS.AR.min})`} />
                        <RequirementBadge met={roleCounts.BOWL >= ROLE_LIMITS.BOWL.min} text={`BOWL (${roleCounts.BOWL}/${ROLE_LIMITS.BOWL.min})`} />
                        <RequirementBadge met={overseasCount <= 4} text={`Max 4 Overseas (${overseasCount})`} />
                        {teamNames.length >= 2 && (
                            <RequirementBadge
                                met={!teamNames.some(t => teamCounts[t] > 7) && teamCounts[teamNames[0]] >= 1 && teamCounts[teamNames[1]] >= 1}
                                text={`Max 7 per team (${teamNames[0].substring(0, 3)}:${teamCounts[teamNames[0]]} | ${teamNames[1].substring(0, 3)}:${teamCounts[teamNames[1]]})`}
                            />
                        )}
                    </div>
                </div>
            )}

            <div className="role-tabs">
                {['ALL', 'WK', 'BAT', 'AR', 'BOWL'].map(tab => {
                    const count = tab === 'ALL' ? selectedPlayers.length : roleCounts[tab];
                    return (
                        <button key={tab} className={`role-tab ${filterTab === tab ? 'active' : ''}`} onClick={() => setFilterTab(tab)}>
                            {tab} {tab !== 'ALL' && `(${count})`}
                        </button>
                    );
                })}
            </div>

            <div className="player-grid">
                {filteredPlayers.map(player => {
                    const isSelected = selectedPlayers.includes(player.id);
                    const isCaptain = captainId === player.id;
                    const isVC = vcId === player.id;
                    const disabledReason = getDisabledReason(player);
                    const isDisabled = disabledReason && !isSelected;
                    const playerTeamCode = getTeamCode(player.team_name);

                    let tip = '';
                    if (isSelected && !isCaptain && !isVC) tip = 'Click to set as Captain';
                    else if (isCaptain) tip = 'Click to set as Vice Captain';
                    else if (isVC) tip = 'Click to Deselect Player';

                    return (
                        <div
                            key={player.id}
                            className={`glass-panel player-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''} ${isCaptain ? 'is-captain' : ''} ${isVC ? 'is-vc' : ''}`}
                            onClick={() => !isDisabled && handlePlayerClick(player)}
                            title={disabledReason || tip}
                        >
                            {/* Top-left badges */}
                            <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', display: 'flex', gap: '0.4rem', zIndex: 2, alignItems: 'center' }}>
                                <div className="p-role-badge" style={{ position: 'relative', top: 0, left: 0 }}>{player.role}</div>
                                {/* Team logo replaces 3-letter badge */}
                                {playerTeamCode ? (
                                    <div style={{ width: 24, height: 24, flexShrink: 0 }}>
                                        <TeamLogo teamCode={playerTeamCode} />
                                    </div>
                                ) : player.team_name ? (
                                    <div className="p-role-badge" style={{ position: 'relative', top: 0, left: 0, background: 'rgba(0,210,255,0.2)' }}>
                                        {player.team_name.substring(0, 3).toUpperCase()}
                                    </div>
                                ) : null}
                            </div>

                            {isCaptain && <div className="c-badge">C</div>}
                            {isVC && <div className="vc-badge">VC</div>}

                            <div className="p-info">
                                <h3>{player.name}{player.is_overseas ? ' 🌍' : ''}</h3>
                                <p className="p-credits text-gradient">{player.credits} CR</p>
                            </div>

                            {isDisabled && <div className="disabled-overlay">{disabledReason}</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}