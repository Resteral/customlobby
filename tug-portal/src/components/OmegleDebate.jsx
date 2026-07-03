import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, ShieldAlert, Sparkles, User, HelpCircle, MessageSquare, Swords } from 'lucide-react';

const DEBATE_TOPICS = [
  { id: '1', title: 'AI will replace human software engineers in 5 years.', category: 'Tech' },
  { id: '2', title: 'Pineapple is an elite pizza topping.', category: 'Food' },
  { id: '3', title: 'Remote work is superior to hybrid or in-office work.', category: 'Lifestyle' },
  { id: '4', title: 'Tabs are strictly superior to Spaces for indentation.', category: 'Programming' },
  { id: '5', title: 'Social media has done more harm than good to society.', category: 'Culture' }
];

const OPPONENTS = [
  { name: 'DebateSlayer99', style: 'aggressive', bio: 'I speak facts. Feelings do not matter.' },
  { name: 'LogicWeaver', style: 'analytical', bio: 'Data-driven arguer. Always cites sources.' },
  { name: 'PhilosopherKing', style: 'philosophical', bio: 'Deconstructs the core premise of your reality.' },
  { name: 'SarcasticSocrates', style: 'witty', bio: 'Will mock your argument before destroying it.' }
];

const MOCK_REBUTTALS = {
  '1': { // AI replace engineers
    pro: [
      "AI code generation is accelerating exponentially. Within 5 years, context windows and multi-agent reasoning will design whole systems in seconds, making manual coding obsolete.",
      "The cost of compute is dropping, while developer salaries are high. Businesses will prioritize autonomous AI squads because they work 24/7 without bugs or health insurance.",
      "Most software development is glue code and database CRUD. AI excels at template patterns, meaning human engineers will only be needed as prompt guides, not writers."
    ],
    con: [
      "AI lacks true reasoning and only predicts the next token. It cannot design novel architectures or solve edge cases that aren't in its training set.",
      "Software engineering is 90% communication, understanding client requirements, and debugging legacy systems. AI cannot understand human nuance or align stakeholders.",
      "Who compiles the AI's output? Who takes legal and ethical responsibility when it fails? Humans will always remain in the driver's seat as overseers and auditors."
    ]
  },
  '2': { // Pineapple pizza
    pro: [
      "The sweetness of pineapple perfectly balances the salty ham and acidic marinara sauce. It's a culinary masterpiece of flavor profiling.",
      "Caramelized pineapple under high-heat pizza ovens brings out sugars that elevate standard pizza crust beyond boring savory elements.",
      "Food is meant for experimentation. Limiting pizza to cheese and pepperoni is close-minded. Pineapple adds essential juiciness."
    ],
    con: [
      "The water content in pineapple releases during baking, turning the dough soggy and ruining the structural integrity of the crust.",
      "Sweet fruit has absolutely no place in a hot, savory, garlicky tomato sauce environment. It completely clashes with the profile.",
      "Authentic Italian pizza tradition is built on balanced savory components. Adding high-sugar pineapple is a gastronomic crime."
    ]
  },
  '3': { // Remote work
    pro: [
      "Commuting wastes hours of life and pollutes the environment. Remote work gives workers back time for family, health, and focus.",
      "Without office distractions, deep-work productivity sky-rockets. Modern collaboration tools make physical presence unnecessary.",
      "Companies can hire global talent rather than being limited to a 30-mile radius. It's a win-win for diversity and capability."
    ],
    con: [
      "Isolation degrades mental health and breaks down team cohesion. You cannot replicate serendipitous hallway conversations on Zoom.",
      "Mentorship of junior developers suffers immensely. You learn by osmosis, watching seniors work, which is impossible in a remote vacuum.",
      "Distractions at home (kids, pets, chores) dilute concentration. Many projects lack proper velocity without close physical collaboration."
    ]
  },
  '4': { // Tabs vs Spaces
    pro: [
      "Tabs allow visual customization. I can set tab size to 2, and you can set it to 4, honoring accessibility and personal preference.",
      "Using one character (Tab) instead of multiple characters (Spaces) reduces file sizes and is logically cleaner for parser tokens.",
      "Spaces require clicking backspace multiple times or configuring IDE overrides to pretend they are tabs. Just use the tab key!"
    ],
    con: [
      "Spaces guarantee the code looks exactly the same on every screen, every editor, and every git diff output. Total consistency.",
      "Using tabs causes alignment issues when aligning multi-line function parameters or long comments across different systems.",
      "The modern programming consensus (including PEP8 and standard JS style guides) heavily favors spaces for formatting control."
    ]
  },
  '5': { // Social media
    pro: [
      "Algorithms are engineered to hook dopamine receptors, driving anxiety, depression, and severe sleep deprivation in younger generations.",
      "It acts as an echo chamber that amplifies disinformation and divides societies by prioritizing outrage over factual nuance.",
      "It has replaced genuine face-to-face community connections with superficial validation metrics like likes and followers."
    ],
    con: [
      "It has democratized voice, allowing marginalized creators and activists to bypass traditional gatekeepers and organize global movements.",
      "It enables instant connection with friends and family across oceans, reducing isolation for niche communities who feel alone locally.",
      "Social media is just a tool. It acts as a mirror to humanity; the issues lie in human nature, not the platforms themselves."
    ]
  }
};

function OmegleDebate({ onBack }) {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [stance, setStance] = useState('pro'); // pro or con
  const [matchStatus, setMatchStatus] = useState('idle'); // idle, matching, debating, ended
  const [opponent, setOpponent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [turn, setTurn] = useState('user'); // user or opponent
  const [spectatorScore, setSpectatorScore] = useState(50); // 0 (Opponent winning) to 100 (User winning)
  const [turnCount, setTurnCount] = useState(0);

  const radarIntervalRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startMatching = (topic) => {
    setSelectedTopic(topic);
    setMatchStatus('matching');
    setSpectatorScore(50);
    setTurnCount(0);
    setMessages([]);

    let dotCount = 0;
    radarIntervalRef.current = setTimeout(() => {
      // Pick random opponent
      const randomOpp = OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)];
      setOpponent(randomOpp);
      setMatchStatus('debating');
      setTurn(stance === 'pro' ? 'user' : 'opponent');

      // Add intro system message
      setMessages([
        { 
          id: 'sys-1', 
          sender: 'System', 
          text: `Matched with ${randomOpp.name}! Stance: ${stance === 'pro' ? 'CON' : 'PRO'}. Topic: "${topic.title}"`,
          isSystem: true 
        },
        {
          id: 'sys-2',
          sender: 'System',
          text: stance === 'pro' ? "You have the first move! State your opening argument." : `${randomOpp.name} is preparing their opening argument...`,
          isSystem: true
        }
      ]);

      // If opponent goes first, trigger their turn
      if (stance === 'con') {
        triggerOpponentTurn(topic.id, 'pro', 0);
      }
    }, 3000);
  };

  const triggerOpponentTurn = (topicId, opponentStance, currentTurnIndex) => {
    setTurn('opponent');
    
    // Simulate typing delay
    setTimeout(() => {
      const topicRebuttalSet = MOCK_REBUTTALS[topicId];
      let replyText = "I disagree with your premise. You haven't provided any evidence.";
      
      if (topicRebuttalSet && topicRebuttalSet[opponentStance]) {
        const list = topicRebuttalSet[opponentStance];
        replyText = list[currentTurnIndex % list.length];
      }

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: opponent.name, text: replyText, isOpponent: true }
      ]);
      
      // Opponent message swings the score towards opponent (left side/lower score)
      setSpectatorScore((prev) => {
        const swing = Math.floor(Math.random() * 15) + 10;
        return Math.max(10, prev - swing);
      });

      setTurn('user');
      setTurnCount((prev) => {
        const nextTurn = prev + 1;
        if (nextPosCheck(nextTurn)) {
          handleDebateEnd();
        }
        return nextTurn;
      });
    }, 2500);
  };

  const nextPosCheck = (currentTurns) => {
    // End debate after 6 combined turns (3 each)
    return currentTurns >= 6;
  };

  const handleUserSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim() || turn !== 'user') return;

    const userText = inputVal.trim();
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: 'You', text: userText, isUser: true }
    ]);
    setInputVal('');

    // User message swings score towards user (right side/higher score)
    // Long messages or messages containing certain logical words get extra score
    const containsLogic = /\b(because|evidence|data|statistic|prove|reason|logical|study)\b/i.test(userText);
    const scoreSwing = Math.min(25, Math.floor(userText.length / 10) + (containsLogic ? 10 : 2));
    
    setSpectatorScore((prev) => Math.min(90, prev + scoreSwing));

    const nextTurnCount = turnCount + 1;
    setTurnCount(nextTurnCount);

    if (nextPosCheck(nextTurnCount)) {
      handleDebateEnd();
    } else {
      const opponentStance = stance === 'pro' ? 'con' : 'pro';
      triggerOpponentTurn(selectedTopic.id, opponentStance, Math.floor(nextTurnCount / 2));
    }
  };

  const handleDebateEnd = () => {
    setMatchStatus('ended');
    setTurn('none');
    
    const finalWinner = spectatorScore > 50 ? 'You' : opponent?.name || 'Opponent';
    
    setMessages((prev) => [
      ...prev,
      { 
        id: 'sys-end', 
        sender: 'System', 
        text: `🏆 DEBATE CONCLUDED! The spectators voted. Winner: ${finalWinner}!`, 
        isSystem: true 
      }
    ]);
  };

  const resetDebate = () => {
    setMatchStatus('idle');
    setSelectedTopic(null);
    setOpponent(null);
    setMessages([]);
  };

  return (
    <div style={styles.container}>
      {matchStatus === 'idle' && (
        /* TOPIC SELECTOR */
        <div style={styles.topicSelectorBox}>
          <div style={styles.headerRow}>
            <h2 style={styles.viewTitle}>Omegle Debate</h2>
            <p style={styles.viewDesc}>Enter the digital colosseum. Match with random debaters and argue your stance.</p>
          </div>

          <div style={styles.setupCard} className="glass-panel">
            <h3 style={styles.setupTitle}>1. Choose Your Stance</h3>
            <div style={styles.stanceRow}>
              <button 
                style={{
                  ...styles.stanceBtn,
                  borderColor: stance === 'pro' ? 'var(--accent-green)' : 'transparent',
                  background: stance === 'pro' ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255,255,255,0.02)',
                  color: stance === 'pro' ? 'var(--accent-cyan)' : 'var(--text-secondary)'
                }}
                onClick={() => setStance('pro')}
              >
                PRO (Support Topic)
              </button>
              <button 
                style={{
                  ...styles.stanceBtn,
                  borderColor: stance === 'con' ? 'var(--accent-pink)' : 'transparent',
                  background: stance === 'con' ? 'rgba(255, 0, 128, 0.08)' : 'rgba(255,255,255,0.02)',
                  color: stance === 'con' ? 'var(--accent-pink)' : 'var(--text-secondary)'
                }}
                onClick={() => setStance('con')}
              >
                CON (Oppose Topic)
              </button>
            </div>

            <h3 style={{ ...styles.setupTitle, marginTop: '20px' }}>2. Select a Topic to Begin Matchmaking</h3>
            <div style={styles.topicList}>
              {DEBATE_TOPICS.map((topic) => (
                <div 
                  key={topic.id} 
                  className="glass-panel glass-panel-hover" 
                  style={styles.topicCard}
                  onClick={() => startMatching(topic)}
                >
                  <div style={styles.topicCardHeader}>
                    <span style={styles.topicCategory}>{topic.category}</span>
                    <Swords size={16} color="var(--text-muted)" />
                  </div>
                  <p style={styles.topicTitle}>{topic.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {matchStatus === 'matching' && (
        /* MATCHMAKING RADAR SCREEN */
        <div style={styles.radarContainer} className="glass-panel">
          <div style={styles.radarCircle}>
            <div style={styles.radarPulse}></div>
            <Swords size={48} color="var(--accent-pink)" className="float-animation" />
          </div>
          <h3 style={styles.radarTitle}>Finding Opponent...</h3>
          <p style={styles.radarDesc}>Searching the network for active debaters on the topic: <br /><strong>"{selectedTopic?.title}"</strong></p>
          <button className="btn btn-secondary" onClick={resetDebate}>Cancel Search</button>
        </div>
      )}

      {(matchStatus === 'debating' || matchStatus === 'ended') && (
        /* ACTIVE DEBATE ARENA */
        <div style={styles.arenaContainer}>
          <div style={styles.arenaHeader}>
            <button className="btn btn-secondary" onClick={resetDebate} style={styles.backBtn}>
              &larr; Quit Match
            </button>
            <span style={styles.arenaTopicDisplay}>Topic: {selectedTopic.title}</span>
            <div style={{ width: '80px' }}></div>
          </div>

          {/* Spectator Sentiment Meter */}
          <div className="glass-panel" style={styles.sentimentCard}>
            <div style={styles.sentimentLabels}>
              <span style={{ color: 'var(--accent-pink)', fontWeight: 'bold' }}>{opponent.name} (CON)</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Spectator Sentiment</span>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>You (PRO)</span>
            </div>
            <div style={styles.barTrack}>
              <div style={{ ...styles.barFillBlue, width: `${spectatorScore}%` }}></div>
              <div style={{ ...styles.needle, left: `${spectatorScore}%` }}></div>
            </div>
          </div>

          <div style={styles.arenaGrid}>
            {/* Left Column: Opponent Bio Panel */}
            <div className="glass-panel" style={styles.sideProfilePanel}>
              <div style={styles.profileBox}>
                <div style={{ ...styles.avatarContainer, borderColor: 'var(--accent-pink)' }}>
                  <User size={32} color="var(--accent-pink)" />
                </div>
                <h3 style={styles.profileName}>{opponent.name}</h3>
                <span style={styles.profileStanceTag}>
                  STANCE: {stance === 'pro' ? 'CON' : 'PRO'}
                </span>
                <p style={styles.profileBio}>"{opponent.bio}"</p>
              </div>
            </div>

            {/* Middle Column: Chat feed */}
            <div className="glass-panel" style={styles.chatArenaPanel}>
              <div style={styles.chatAreaBody}>
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    style={{
                      ...styles.debateMessageContainer,
                      justifyContent: msg.isSystem 
                        ? 'center' 
                        : msg.isUser 
                        ? 'flex-end' 
                        : 'flex-start'
                    }}
                  >
                    {msg.isSystem ? (
                      <div style={styles.debateSystemMsg}>
                        {msg.text}
                      </div>
                    ) : (
                      <div style={{
                        ...styles.debateBubble,
                        backgroundColor: msg.isUser ? 'rgba(0, 242, 254, 0.1)' : 'rgba(255, 0, 128, 0.1)',
                        borderColor: msg.isUser ? 'var(--accent-cyan)' : 'var(--accent-pink)',
                        alignItems: msg.isUser ? 'flex-end' : 'flex-start'
                      }}>
                        <span style={styles.bubbleSender}>{msg.sender}</span>
                        <p style={styles.bubbleText}>{msg.text}</p>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {matchStatus === 'debating' ? (
                <form onSubmit={handleUserSubmit} style={styles.debateInputForm}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder={turn === 'user' ? "Type your counter-argument..." : `${opponent.name} is typing...`}
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    disabled={turn !== 'user'}
                    style={styles.debateInput}
                  />
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={turn !== 'user' || !inputVal.trim()}
                    style={styles.debateSendBtn}
                  >
                    <Send size={16} />
                  </button>
                </form>
              ) : (
                <div style={styles.concludeActions}>
                  <p style={styles.concludeText}>The debate has concluded. Thank you for participating!</p>
                  <button className="btn btn-primary" onClick={resetDebate}>
                    Back to Topics
                  </button>
                </div>
              )}
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
  topicSelectorBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  headerRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  viewTitle: {
    fontSize: '2.2rem',
    fontWeight: '800',
    letterSpacing: '-1px',
  },
  viewDesc: {
    color: 'var(--text-secondary)',
    fontSize: '1rem',
  },
  setupCard: {
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  setupTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--text-main)',
  },
  stanceRow: {
    display: 'flex',
    gap: '16px',
  },
  stanceBtn: {
    flex: 1,
    padding: '16px',
    borderRadius: '12px',
    border: '2px solid',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  topicList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  topicCard: {
    padding: '24px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minHeight: '140px',
  },
  topicCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicCategory: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: 'var(--accent-purple)',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  topicTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    lineHeight: '1.5',
    flexGrow: 1,
  },
  radarContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
    padding: '60px 40px',
    textAlign: 'center',
    maxWidth: '500px',
    margin: '40px auto',
  },
  radarCircle: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    border: '1px solid rgba(0, 242, 254, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  radarPulse: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    border: '2px solid var(--accent-cyan)',
    borderRadius: '50%',
    animation: 'pulseGlow 2s infinite',
  },
  radarTitle: {
    fontSize: '1.5rem',
    fontWeight: '800',
    letterSpacing: '1px',
  },
  radarDesc: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    lineHeight: '1.6',
  },
  arenaContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  arenaHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
  },
  backBtn: {
    padding: '8px 16px',
    fontSize: '0.85rem',
  },
  arenaTopicDisplay: {
    fontWeight: '700',
    fontSize: '1.1rem',
    color: 'var(--text-main)',
    textAlign: 'center',
    flex: 1,
  },
  sentimentCard: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sentimentLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.9rem',
  },
  barTrack: {
    height: '12px',
    width: '100%',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '6px',
    position: 'relative',
    overflow: 'hidden',
  },
  barFillBlue: {
    height: '100%',
    backgroundColor: 'var(--accent-cyan)',
    boxShadow: '0 0 10px var(--accent-cyan)',
    transition: 'width 0.5s ease-in-out',
  },
  needle: {
    position: 'absolute',
    top: '-4px',
    bottom: '-4px',
    width: '4px',
    backgroundColor: '#fff',
    boxShadow: '0 0 8px #fff',
    borderRadius: '2px',
    transition: 'left 0.5s ease-in-out',
    transform: 'translateX(-50%)',
  },
  arenaGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 3fr',
    gap: '24px',
    alignItems: 'start',
  },
  sideProfilePanel: {
    padding: '24px',
  },
  profileBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '16px',
  },
  avatarContainer: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.02)',
  },
  profileName: {
    fontSize: '1.25rem',
    fontWeight: '700',
  },
  profileStanceTag: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: 'var(--accent-pink)',
    padding: '4px 10px',
    borderRadius: '20px',
    backgroundColor: 'rgba(255, 0, 128, 0.1)',
  },
  profileBio: {
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    fontStyle: 'italic',
    lineHeight: '1.5',
  },
  chatArenaPanel: {
    display: 'flex',
    flexDirection: 'column',
    height: '420px',
  },
  chatAreaBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  debateMessageContainer: {
    display: 'flex',
    width: '100%',
  },
  debateSystemMsg: {
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    fontStyle: 'italic',
    background: 'rgba(138, 43, 226, 0.08)',
    border: '1px solid var(--border-glass)',
    padding: '8px 16px',
    borderRadius: '20px',
  },
  debateBubble: {
    maxWidth: '80%',
    padding: '12px 16px',
    borderRadius: '16px',
    border: '1px solid',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  bubbleSender: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: 'var(--text-secondary)',
  },
  bubbleText: {
    fontSize: '0.95rem',
    lineHeight: '1.5',
  },
  debateInputForm: {
    padding: '16px 20px',
    borderTop: '1px solid var(--border-glass)',
    display: 'flex',
    gap: '10px',
  },
  debateInput: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '0.9rem',
  },
  debateSendBtn: {
    padding: '0 16px',
  },
  concludeActions: {
    padding: '20px',
    borderTop: '1px solid var(--border-glass)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    textAlign: 'center',
  },
  concludeText: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
  }
};

export default OmegleDebate;
