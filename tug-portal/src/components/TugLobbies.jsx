import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, ShieldAlert, Award, Plus, Swords, Play } from 'lucide-react';

const mockLobbies = [
  { id: '1', name: 'JavaScript vs Python', players: 12, maxPlayers: 20, status: 'Active', score: { blue: 2, red: 1 } },
  { id: '2', name: 'Frontend devs vs Backend devs', players: 8, maxPlayers: 16, status: 'Active', score: { blue: 0, red: 3 } },
  { id: '3', name: 'Tabs vs Spaces', players: 15, maxPlayers: 30, status: 'Match Ended', score: { blue: 4, red: 5 } },
  { id: '4', name: 'Light Mode vs Dark Mode', players: 6, maxPlayers: 12, status: 'Waiting', score: { blue: 0, red: 0 } },
];

const mockChatNames = ['BytePuller', 'RopeMaster', 'CyberTug', 'NullPointer', 'PixelPro', 'AsyncCoder', 'GitPush', 'HexWeaver'];
const mockChatMessages = [
  'LET S GO BLUE TEAM!',
  'Red is pulling crazy hard right now!',
  'easy win guys, trust',
  'click faster!!!!',
  'my finger hurts lol',
  'ping is high but im pulling',
  'we got this!!',
  'whose idea was spaces anyway??'
];

function TugLobbies({ onBack }) {
  const [lobbies, setLobbies] = useState(mockLobbies);
  const [selectedLobby, setSelectedLobby] = useState(null);
  const [gameStatus, setGameStatus] = useState('idle'); // idle, counting, playing, ended
  const [pullPosition, setPullPosition] = useState(50); // 0 (Left/User wins) to 100 (Right/AI wins)
  const [teamSelection, setTeamSelection] = useState('blue'); // blue (Left) or red (Right)
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [winner, setWinner] = useState(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const gameLoopRef = useRef(null);
  const chatSimRef = useRef(null);
  const chatEndRef = useRef(null);

  // Initialize chat when lobby is joined
  useEffect(() => {
    if (selectedLobby) {
      setChatMessages([
        { id: 'sys-1', sender: 'System', text: `Welcome to "${selectedLobby.name}" lobby! Select a team and click Start.`, isSystem: true },
        { id: 'sys-2', sender: 'System', text: 'Blue Team: Left | Red Team: Right', isSystem: true },
      ]);
      setPullPosition(50);
      setGameStatus('idle');
      setWinner(null);
    } else {
      clearInterval(gameLoopRef.current);
      clearInterval(chatSimRef.current);
    }
  }, [selectedLobby]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle game loop and countdown
  useEffect(() => {
    if (gameStatus === 'counting') {
      const countInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countInterval);
            setGameStatus('playing');
            return 3;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(countInterval);
    }

    if (gameStatus === 'playing') {
      // Game logic loop: AI opponent pulls randomly
      gameLoopRef.current = setInterval(() => {
        setPullPosition((pos) => {
          // AI Pull difficulty: user team determines direction of AI pull
          const pullStrength = teamSelection === 'blue' ? 0.75 : -0.75;
          const nextPos = pos + (Math.random() * 1.8 - 0.5) * pullStrength;
          
          if (nextPos <= 5) {
            handleGameEnd('blue');
            return 0;
          }
          if (nextPos >= 95) {
            handleGameEnd('red');
            return 100;
          }
          return nextPos;
        });
      }, 100);

      // Simulate chat messages during game
      chatSimRef.current = setInterval(() => {
        const randomName = mockChatNames[Math.floor(Math.random() * mockChatNames.length)];
        const randomMsg = mockChatMessages[Math.floor(Math.random() * mockChatMessages.length)];
        setChatMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), sender: randomName, text: randomMsg, isSystem: false }
        ]);
      }, 3500);

      return () => {
        clearInterval(gameLoopRef.current);
        clearInterval(chatSimRef.current);
      };
    }
  }, [gameStatus, teamSelection]);

  const handleGameEnd = (winningTeam) => {
    clearInterval(gameLoopRef.current);
    clearInterval(chatSimRef.current);
    setGameStatus('ended');
    setWinner(winningTeam);

    // Update lobby score
    if (selectedLobby) {
      setSelectedLobby(prev => ({
        ...prev,
        score: {
          ...prev.score,
          [winningTeam]: prev.score[winningTeam] + 1
        }
      }));
    }

    setChatMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: 'System', text: `🏆 MATCH OVER! ${winningTeam.toUpperCase()} Team wins the match!`, isSystem: true }
    ]);
  };

  const handleUserPull = () => {
    if (gameStatus !== 'playing') return;

    setPullPosition((pos) => {
      // Blue pulls Left (towards 0), Red pulls Right (towards 100)
      const step = 2.8; 
      const nextPos = teamSelection === 'blue' ? pos - step : pos + step;
      
      if (nextPos <= 5) {
        handleGameEnd('blue');
        return 0;
      }
      if (nextPos >= 95) {
        handleGameEnd('red');
        return 100;
      }
      return nextPos;
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setChatMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: 'You', text: inputMessage.trim(), isSystem: false, isUser: true }
    ]);
    setInputMessage('');
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    const newLobby = {
      id: (lobbies.length + 1).toString(),
      name: newRoomName.trim(),
      players: 1,
      maxPlayers: 10,
      status: 'Waiting',
      score: { blue: 0, red: 0 }
    };

    setLobbies([newLobby, ...lobbies]);
    setSelectedLobby(newLobby);
    setShowCreateModal(false);
    setNewRoomName('');
  };

  const startGame = () => {
    setPullPosition(50);
    setGameStatus('counting');
    setWinner(null);
  };

  return (
    <div style={styles.container}>
      {!selectedLobby ? (
        /* LOBBY BROWSER VIEW */
        <div style={styles.browserContainer}>
          <div style={styles.browserHeader}>
            <div>
              <h2 style={styles.viewTitle}>Tug Lobbies</h2>
              <p style={styles.viewDesc}>Choose a lobby, pick your side, and pull your team to victory.</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={18} /> Create Lobby
            </button>
          </div>

          <div style={styles.lobbyGrid}>
            {lobbies.map((lobby) => (
              <div key={lobby.id} className="glass-panel glass-panel-hover" style={styles.lobbyCard}>
                <div style={styles.lobbyCardHeader}>
                  <h3 style={styles.lobbyName}>{lobby.name}</h3>
                  <span style={{
                    ...styles.statusTag,
                    backgroundColor: lobby.status === 'Active' ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    color: lobby.status === 'Active' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    borderColor: lobby.status === 'Active' ? 'var(--accent-cyan)' : 'var(--border-glass)'
                  }}>
                    {lobby.status}
                  </span>
                </div>
                
                <div style={styles.lobbyScoreBox}>
                  <div style={styles.scoreHalf}>
                    <span style={styles.teamBlueLabel}>BLUE</span>
                    <span style={styles.scoreNumber}>{lobby.score.blue}</span>
                  </div>
                  <div style={styles.scoreDivider}>vs</div>
                  <div style={styles.scoreHalf}>
                    <span style={styles.teamRedLabel}>RED</span>
                    <span style={styles.scoreNumber}>{lobby.score.red}</span>
                  </div>
                </div>

                <div style={styles.lobbyCardFooter}>
                  <div style={styles.playerCount}>
                    <Users size={16} color="var(--text-muted)" />
                    <span>{lobby.players}/{lobby.maxPlayers} Players</span>
                  </div>
                  <button className="btn btn-secondary" onClick={() => setSelectedLobby(lobby)}>
                    Join Room
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* CREATE ROOM MODAL */}
          {showCreateModal && (
            <div style={styles.modalOverlay}>
              <div className="glass-panel" style={styles.modalContent}>
                <h3 style={styles.modalTitle}>Create New Tug Lobby</h3>
                <form onSubmit={handleCreateRoom} style={styles.modalForm}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter lobby name (e.g. Apple vs Android)..."
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    required
                    autoFocus
                  />
                  <div style={styles.modalActions}>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Create & Join
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ACTIVE LOBBY / GAME VIEW */
        <div style={styles.gameViewContainer}>
          <div style={styles.gameHeader}>
            <button className="btn btn-secondary" onClick={() => setSelectedLobby(null)} style={styles.leaveButton}>
              &larr; Leave Room
            </button>
            <div style={styles.gameHeaderTitleBox}>
              <h2 style={styles.gameLobbyName}>{selectedLobby.name}</h2>
              <div style={styles.scoreboardMini}>
                <span style={styles.scoreboardText}>Score:</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{selectedLobby.score.blue}</span>
                <span style={{ color: 'var(--text-muted)' }}>-</span>
                <span style={{ color: 'var(--accent-pink)', fontWeight: 'bold' }}>{selectedLobby.score.red}</span>
              </div>
            </div>
            <div style={{ width: '100px' }}></div> {/* Spacer */}
          </div>

          <div style={styles.gameLayout}>
            {/* Left Side: Game Canvas & Action */}
            <div className="glass-panel" style={styles.arenaPanel}>
              {gameStatus === 'idle' && (
                <div style={styles.setupScreen}>
                  <Swords size={48} color="var(--accent-purple)" className="float-animation" />
                  <h3 style={styles.setupTitle}>Prepare for the Pull</h3>
                  <p style={styles.setupDesc}>Choose your side. Tap "PULL!" as fast as you can to drag the central marker into your zone.</p>
                  
                  <div style={styles.teamSelector}>
                    <button 
                      style={{ 
                        ...styles.teamSelectBtn, 
                        borderColor: teamSelection === 'blue' ? 'var(--accent-cyan)' : 'transparent',
                        boxShadow: teamSelection === 'blue' ? '0 0 15px rgba(0, 242, 254, 0.3)' : 'none',
                        background: teamSelection === 'blue' ? 'rgba(0, 242, 254, 0.1)' : 'rgba(255,255,255,0.02)'
                      }}
                      onClick={() => setTeamSelection('blue')}
                    >
                      <span style={{ color: 'var(--accent-cyan)', fontWeight: '800' }}>BLUE TEAM (LEFT)</span>
                    </button>
                    <button 
                      style={{ 
                        ...styles.teamSelectBtn, 
                        borderColor: teamSelection === 'red' ? 'var(--accent-pink)' : 'transparent',
                        boxShadow: teamSelection === 'red' ? '0 0 15px rgba(255, 0, 128, 0.3)' : 'none',
                        background: teamSelection === 'red' ? 'rgba(255, 0, 128, 0.1)' : 'rgba(255,255,255,0.02)'
                      }}
                      onClick={() => setTeamSelection('red')}
                    >
                      <span style={{ color: 'var(--accent-pink)', fontWeight: '800' }}>RED TEAM (RIGHT)</span>
                    </button>
                  </div>

                  <button className="btn btn-primary" style={styles.startBtn} onClick={startGame}>
                    <Play size={18} /> Start Match
                  </button>
                </div>
              )}

              {gameStatus === 'counting' && (
                <div style={styles.countdownScreen}>
                  <div style={styles.countdownCircle}>
                    <span style={styles.countdownText}>{countdown}</span>
                  </div>
                  <h3 style={styles.countdownTitle}>GET READY...</h3>
                </div>
              )}

              {gameStatus === 'playing' && (
                <div style={styles.arenaActive}>
                  <div style={styles.scoreHeaders}>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: '800', opacity: teamSelection === 'blue' ? 1 : 0.6 }}>
                      BLUE ZONE {teamSelection === 'blue' && '(YOU)'}
                    </span>
                    <span style={{ color: 'var(--accent-pink)', fontWeight: '800', opacity: teamSelection === 'red' ? 1 : 0.6 }}>
                      {teamSelection === 'red' && '(YOU)'} RED ZONE
                    </span>
                  </div>

                  {/* Tug-of-War Track */}
                  <div style={styles.ropeTrack}>
                    <div style={styles.zoneDividerLeft}></div>
                    <div style={styles.zoneDividerRight}></div>
                    
                    {/* The Rope */}
                    <div style={{ ...styles.rope, left: `calc(${pullPosition}% - 400px)` }}>
                      <div style={styles.ropeLine}></div>
                      <div style={styles.ropeKnot}>
                        <div style={styles.ropeFlag}></div>
                      </div>
                    </div>
                  </div>

                  {/* Click/Action Area */}
                  <div style={styles.actionContainer}>
                    <button 
                      className={`btn ${teamSelection === 'blue' ? 'btn-accent' : 'btn-danger'}`} 
                      style={styles.pullButton}
                      onClick={handleUserPull}
                    >
                      PULL!!!
                    </button>
                    <p style={styles.pullTip}>Tap or click rapidly to pull the rope!</p>
                  </div>
                </div>
              )}

              {gameStatus === 'ended' && (
                <div style={styles.endScreen}>
                  <Award size={64} color={winner === teamSelection ? 'var(--accent-green)' : 'var(--accent-pink)'} className="float-animation" />
                  <h3 style={styles.endTitle}>
                    {winner === teamSelection ? '🎉 VICTORY! 🎉' : '💀 DEFEAT 💀'}
                  </h3>
                  <p style={styles.endDesc}>
                    {winner === teamSelection 
                      ? 'You successfully dragged the opponent team into your zone.' 
                      : 'The opponent dragged you into their zone.'}
                  </p>
                  <div style={styles.endActions}>
                    <button className="btn btn-secondary" onClick={() => setSelectedLobby(null)}>
                      Lobby List
                    </button>
                    <button className="btn btn-primary" onClick={startGame}>
                      Rematch
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side: Chat & Spectators */}
            <div className="glass-panel" style={styles.chatPanel}>
              <div style={styles.chatHeader}>
                <div style={styles.chatTitleBox}>
                  <span style={styles.chatTitle}>Lobby Chat</span>
                  <div style={styles.onlineBadge}>
                    <div style={styles.onlineDot}></div>
                    <span>Live</span>
                  </div>
                </div>
              </div>

              <div style={styles.messageBox}>
                {chatMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    style={{
                      ...styles.messageItem,
                      backgroundColor: msg.isSystem 
                        ? 'rgba(138, 43, 226, 0.05)' 
                        : msg.isUser 
                        ? 'rgba(255,255,255,0.03)' 
                        : 'transparent',
                      borderLeft: msg.isSystem 
                        ? '3px solid var(--accent-purple)' 
                        : msg.isUser 
                        ? '3px solid var(--accent-cyan)' 
                        : '3px solid transparent'
                    }}
                  >
                    {!msg.isSystem && (
                      <span style={{
                        ...styles.senderName,
                        color: msg.isUser 
                          ? 'var(--accent-cyan)' 
                          : msg.sender === 'System' 
                          ? 'var(--accent-purple)' 
                          : 'var(--text-secondary)'
                      }}>
                        {msg.sender}:
                      </span>
                    )}
                    <span style={{
                      ...styles.messageText,
                      color: msg.isSystem ? 'var(--text-secondary)' : 'var(--text-main)',
                      fontStyle: msg.isSystem ? 'italic' : 'normal',
                      fontWeight: msg.isSystem ? '500' : 'normal'
                    }}>
                      {msg.text}
                    </span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} style={styles.chatForm}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Send a chat to the lobby..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  style={styles.chatInput}
                />
                <button type="submit" className="btn btn-primary" style={styles.sendBtn}>
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    animation: 'fadeIn 0.5s ease-out',
  },
  browserContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  browserHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewTitle: {
    fontSize: '2.2rem',
    fontWeight: '800',
    letterSpacing: '-1px',
    marginBottom: '8px',
  },
  viewDesc: {
    color: 'var(--text-secondary)',
    fontSize: '1rem',
  },
  lobbyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px',
  },
  lobbyCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  lobbyCardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
  },
  lobbyName: {
    fontSize: '1.2rem',
    fontWeight: '700',
    lineHeight: '1.4',
  },
  statusTag: {
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid',
    textTransform: 'uppercase',
  },
  lobbyScoreBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(0, 0, 0, 0.2)',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid var(--border-glass)',
  },
  scoreHalf: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  teamBlueLabel: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: 'var(--accent-cyan)',
    letterSpacing: '0.5px',
  },
  teamRedLabel: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: 'var(--accent-pink)',
    letterSpacing: '0.5px',
  },
  scoreNumber: {
    fontSize: '1.25rem',
    fontWeight: '800',
  },
  scoreDivider: {
    color: 'var(--text-muted)',
    fontWeight: '600',
    fontSize: '0.85rem',
  },
  lobbyCardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  playerCount: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  gameViewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  gameHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leaveButton: {
    padding: '8px 16px',
    fontSize: '0.85rem',
  },
  gameHeaderTitleBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  gameLobbyName: {
    fontSize: '1.5rem',
    fontWeight: '800',
    letterSpacing: '-0.5px',
  },
  scoreboardMini: {
    display: 'flex',
    gap: '6px',
    fontSize: '0.9rem',
  },
  scoreboardText: {
    color: 'var(--text-secondary)',
  },
  gameLayout: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '24px',
    minHeight: '480px',
  },
  arenaPanel: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
    minHeight: '450px',
    position: 'relative',
    overflow: 'hidden',
  },
  setupScreen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    maxWidth: '450px',
    textAlign: 'center',
  },
  setupTitle: {
    fontSize: '1.6rem',
    fontWeight: '700',
  },
  setupDesc: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    lineHeight: '1.6',
  },
  teamSelector: {
    display: 'flex',
    gap: '16px',
    width: '100%',
    margin: '10px 0',
  },
  teamSelectBtn: {
    flex: 1,
    padding: '16px',
    borderRadius: '12px',
    border: '2px solid',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  startBtn: {
    padding: '14px 28px',
    fontSize: '1rem',
    width: '100%',
  },
  countdownScreen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
  },
  countdownCircle: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    border: '4px solid var(--accent-purple)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 20px rgba(138, 43, 226, 0.4)',
  },
  countdownText: {
    fontSize: '3rem',
    fontWeight: '800',
    color: 'var(--accent-purple)',
  },
  countdownTitle: {
    letterSpacing: '2px',
    fontSize: '1.2rem',
    color: 'var(--text-secondary)',
  },
  arenaActive: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '40px',
  },
  scoreHeaders: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    fontSize: '0.95rem',
    letterSpacing: '1px',
  },
  ropeTrack: {
    width: '100%',
    height: '60px',
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid var(--border-glass)',
    borderRadius: '30px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  zoneDividerLeft: {
    position: 'absolute',
    left: '25%',
    top: 0,
    bottom: 0,
    width: '2px',
    background: 'dashed rgba(0, 242, 254, 0.3)',
    borderLeft: '1px dashed var(--accent-cyan)',
  },
  zoneDividerRight: {
    position: 'absolute',
    right: '25%',
    top: 0,
    bottom: 0,
    width: '2px',
    background: 'dashed rgba(255, 0, 128, 0.3)',
    borderRight: '1px dashed var(--accent-pink)',
  },
  rope: {
    position: 'absolute',
    width: '800px',
    height: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'left 0.15s cubic-bezier(0.25, 0.8, 0.25, 1)',
  },
  ropeLine: {
    width: '100%',
    height: '6px',
    background: 'linear-gradient(90deg, var(--accent-cyan), #e5e5e5, var(--accent-pink))',
    boxShadow: '0 0 10px rgba(255, 255, 255, 0.2)',
    borderRadius: '3px',
  },
  ropeKnot: {
    position: 'absolute',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    boxShadow: '0 0 12px #fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ropeFlag: {
    width: '4px',
    height: '30px',
    backgroundColor: 'var(--accent-purple)',
    boxShadow: '0 0 8px var(--accent-purple)',
    borderRadius: '2px',
  },
  actionContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
  },
  pullButton: {
    width: '220px',
    height: '70px',
    borderRadius: '35px',
    fontSize: '1.4rem',
    fontWeight: '800',
    letterSpacing: '1px',
  },
  pullTip: {
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
  },
  endScreen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    textAlign: 'center',
  },
  endTitle: {
    fontSize: '2.2rem',
    fontWeight: '800',
    letterSpacing: '1px',
  },
  endDesc: {
    color: 'var(--text-secondary)',
    fontSize: '1rem',
    maxWidth: '350px',
    lineHeight: '1.6',
  },
  endActions: {
    display: 'flex',
    gap: '16px',
    marginTop: '10px',
  },
  chatPanel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxHeight: '520px',
  },
  chatHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-glass)',
  },
  chatTitleBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatTitle: {
    fontWeight: '700',
    fontSize: '1.1rem',
  },
  onlineBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.8rem',
    color: 'var(--accent-green)',
    fontWeight: '600',
  },
  onlineDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-green)',
    boxShadow: '0 0 8px var(--accent-green)',
  },
  messageBox: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  messageItem: {
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '0.9rem',
    lineHeight: '1.5',
    wordBreak: 'break-word',
  },
  senderName: {
    fontWeight: '700',
    marginRight: '6px',
  },
  messageText: {},
  chatForm: {
    padding: '16px 20px',
    borderTop: '1px solid var(--border-glass)',
    display: 'flex',
    gap: '10px',
  },
  chatInput: {
    flex: 1,
    padding: '10px 14px',
    fontSize: '0.85rem',
  },
  sendBtn: {
    padding: '0 16px',
    borderRadius: '10px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '100%',
    maxWidth: '440px',
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  modalTitle: {
    fontSize: '1.4rem',
    fontWeight: '700',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  }
};

export default TugLobbies;
