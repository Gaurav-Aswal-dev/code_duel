import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import confetti from 'canvas-confetti';
import { Swords, Clock, Send, Trophy, ArrowLeft, Terminal, Shield, CheckCircle2, XCircle, AlertCircle, Sparkles, Copy, Check, Brain, Zap } from 'lucide-react';
import { api } from '../services/api';
import { BattleSocket } from '../services/websocket';
import ProblemSlideOver from './ProblemSlideOver';

export default function BattleRoom({ roomCode, user, onLeave }) {
  const [battle, setBattle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  
  // Realtime opponent stats
  const [opponentProgress, setOpponentProgress] = useState({
    status: 'idle',
    testCasesPassed: 0,
    totalTestCases: 0
  });

  const [timeLeft, setTimeLeft] = useState(1200);
  const [copiedCode, setCopiedCode] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [isProblemOpen, setIsProblemOpen] = useState(false);
  
  const socketRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchBattleData();

    // Setup WebSocket
    socketRef.current = new BattleSocket(
      roomCode,
      (msg) => handleSocketMessage(msg),
      (status) => setWsConnected(status === 'connected')
    );

    return () => {
      if (socketRef.current) socketRef.current.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roomCode]);

  // Countdown timer
  useEffect(() => {
    if (battle?.status === 'IN_PROGRESS' || battle?.status === 'COUNTDOWN') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [battle?.status]);

  const updateStarterCode = (data, lang) => {
    if (!data?.problem_details) return;
    const p = data.problem_details;
    if (lang === 'python') setCode(p.starter_code_python || '# Write solution\n');
    else if (lang === 'cpp') setCode(p.starter_code_cpp || '#include <iostream>\nusing namespace std;\nint main() { return 0; }\n');
    else if (lang === 'java') setCode(p.starter_code_java || 'import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n    }\n}\n');
    else if (lang === 'c') setCode(p.starter_code_c || '#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    return 0;\n}\n');
    else if (lang === 'javascript') setCode(p.starter_code_javascript || 'const fs = require("fs");\n');
  };

  const fetchBattleData = async () => {
    try {
      const data = await api.getBattle(roomCode);
      setBattle(data);
      if (data.duration_seconds && timeLeft === 1200) {
        setTimeLeft(data.duration_seconds);
      }
      if (data.problem_details) {
        updateStarterCode(data, language);
      }
      if (data.status === 'COMPLETED' && data.winner_name === user?.username) {
        triggerVictoryConfetti();
      }
    } catch (err) {
      console.error("Failed to load battle data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSocketMessage = (data) => {
    const { action, payload } = data;

    if (action === 'player_joined') {
      fetchBattleData();
    } else if (action === 'code_progress') {
      if (payload.username !== user?.username) {
        setOpponentProgress({
          status: payload.status,
          testCasesPassed: payload.passed || 0,
          totalTestCases: payload.total || 0
        });
      }
    } else if (action === 'battle_won') {
      fetchBattleData();
      if (payload.winner === user?.username) {
        triggerVictoryConfetti();
      }
    }
  };

  const triggerVictoryConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleEditorChange = (val) => {
    setCode(val || '');
    if (socketRef.current && user) {
      socketRef.current.send('code_progress', {
        username: user.username,
        status: 'coding'
      });
    }
  };

  const handleSubmit = async () => {
    if (!battle || !battle.problem) return;
    setSubmitting(true);
    setSubmissionResult(null);

    try {
      const res = await api.submitCode({
        problem: battle.problem,
        battle: battle.id,
        language,
        code
      });
      setSubmissionResult(res);

      if (socketRef.current && user) {
        socketRef.current.send('code_progress', {
          username: user.username,
          status: res.verdict === 'ACCEPTED' ? 'solved' : 'submitted',
          passed: res.test_cases_passed,
          total: res.total_test_cases
        });

        if (res.verdict === 'ACCEPTED') {
          socketRef.current.send('battle_won', {
            winner: user.username
          });
          triggerVictoryConfetti();
        }
      }

      fetchBattleData();
    } catch (err) {
      setSubmissionResult({
        verdict: 'RUNTIME_ERROR',
        error_output: err.message || 'Submission error.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !battle) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--text-muted)' }}>
        <div className="animate-spin" style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #dcdad2', borderTopColor: '#53766b', borderRadius: '50%', marginBottom: '1rem' }} />
        <div>Connecting to Battle Room #{roomCode}...</div>
      </div>
    );
  }

  const isPlayer1 = user?.username === battle.player1_name;
  const isPlayer2 = user?.username === battle.player2_name;
  const myRating = isPlayer1 ? battle.player1_rating : battle.player2_rating;
  const myStreak = isPlayer1 ? battle.player1_streak : battle.player2_streak;
  const oppName = isPlayer1 ? battle.player2_name : battle.player1_name;
  const oppRating = isPlayer1 ? battle.player2_rating : battle.player1_rating;
  const oppStreak = isPlayer1 ? battle.player2_streak : battle.player1_streak;

  // Thinking Phase (first 5 min) vs Coding Phase
  const codingDuration = battle.coding_seconds || 900;
  const isThinkingPhase = timeLeft > codingDuration;
  const displayTimerSeconds = isThinkingPhase ? (timeLeft - codingDuration) : timeLeft;

  const minutes = Math.floor(displayTimerSeconds / 60);
  const seconds = displayTimerSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isCompleted = battle.status === 'COMPLETED';
  const isWinner = battle.winner_name === user?.username;

  return (
    <div className="coding-shell" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 75px)', background: '#e9e8e2' }}>
      {/* Top 1v1 Battle Status Bar */}
      <div className="battle-topbar" style={{
        padding: '0.65rem 1.5rem',
        background: 'rgba(247, 253, 252, 0.82)',
        borderBottom: '1px solid rgba(79, 142, 150, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Left: Leave & Room code */}
        <div className="battle-room-details" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button onClick={onLeave} className="secondary-btn" style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}>
            <ArrowLeft size={16} />
            <span>Leave</span>
          </button>

          <div 
            onClick={handleCopyRoomCode}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontFamily: 'var(--font-code)'
            }}
            title="Click to copy room code"
          >
            <span style={{ color: 'var(--text-muted)' }}>ROOM:</span>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>#{roomCode}</span>
            {copiedCode ? <Check size={14} color="#34d399" /> : <Copy size={14} color="var(--text-dim)" />}
          </div>

          {battle.is_ranked ? (
            <span style={{ 
              background: 'rgba(239, 68, 68, 0.15)', 
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              padding: '0.2rem 0.65rem',
              borderRadius: '3px',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.5px'
            }}>
              ⚔️ RANKED MATCH (ELO RATED)
            </span>
          ) : (
            <span style={{ 
              background: 'rgba(148, 163, 184, 0.15)', 
              border: '1px solid rgba(148, 163, 184, 0.3)',
              color: '#94a3b8',
              padding: '0.2rem 0.65rem',
              borderRadius: '3px',
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}>
              🎮 CUSTOM ROOM (UNRATED - NO POINTS)
            </span>
          )}
        </div>

        {/* Center: 1v1 Matchup Head-to-Head + Phase Timer */}
        <div className="battle-matchup" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Player 1 (You) */}
          <div className="battle-player battle-player-self" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textAlign: 'right' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
                {user?.username || 'You'} (You)
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                <span>{myRating ?? 0} pts</span>
                {(myStreak ?? 0) > 0 && <span style={{ color: '#f87171', fontWeight: 700 }}>🔥{myStreak}</span>}
              </div>
            </div>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#65786a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.85rem',
              color: '#fffefa'
            }}>
              {(user?.username || 'Y').charAt(0).toUpperCase()}
            </div>
          </div>

          {/* VS & Timer with Thinking vs Coding indicator */}
          <div className="battle-timer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontFamily: 'var(--font-code)',
              fontWeight: 800,
              fontSize: '1.25rem',
              color: isThinkingPhase ? '#8a6415' : (displayTimerSeconds < 180 ? '#c54857' : '#236a72')
            }}>
              {isThinkingPhase ? <Brain size={18} color="#8a6415" /> : <Clock size={16} color="#267f83" />}
              {formattedTime}
            </div>
            <div style={{
              fontSize: '0.65rem',
              color: isThinkingPhase ? '#8a6415' : '#b64f65',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>
              {isThinkingPhase ? 'Thinking Phase (5m)' : 'Coding Phase Live'}
            </div>
          </div>

          {/* Player 2 (Opponent) */}
          <div className="battle-player battle-player-opponent" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: oppName ? '#8c6960' : '#e5e4de',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.85rem',
              color: '#263029'
            }}>
              {oppName ? oppName.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="battle-submit">
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: oppName ? '#8c5f57' : 'var(--accent-amber)' }}>
                {oppName || 'Waiting for Challenger...'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>{oppName ? `${oppRating ?? 0} pts` : 'Share room code to invite'}</span>
                {oppName && (oppStreak ?? 0) > 0 && <span style={{ color: '#f87171', fontWeight: 700 }}>🔥{oppStreak}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Submit Button */}
        <div>
          <button 
            onClick={handleSubmit}
            disabled={submitting || isCompleted || !oppName}
            className="glow-btn"
            style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem' }}
          >
            {submitting ? (
              <>
                <div className="animate-spin" style={{ width: '14px', height: '14px', border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%' }} />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Send size={15} />
                <span>{isThinkingPhase ? 'Submit Early Solution' : 'Submit Solution'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Phase Notification Banner */}
      <div className="battle-phase-banner" style={{
        background: isThinkingPhase ? 'rgba(255, 247, 220, 0.86)' : 'rgba(222, 250, 237, 0.9)',
        borderBottom: '1px solid rgba(79, 142, 150, 0.18)',
        padding: '0.35rem 1.5rem',
        fontSize: '0.78rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: isThinkingPhase ? '#8a6415' : '#187b64'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isThinkingPhase ? <Brain size={14} /> : <Zap size={14} />}
          <span>
            {isThinkingPhase 
              ? 'Strategy / Thinking Phase (5 min): Read requirements & plan time complexity. Coding phase automatically kicks in after.' 
              : `Coding Battle Active: ${battle.problem_details?.difficulty || 'EASY'} duration allocated. First optimal solution wins!`}
          </span>
        </div>

        {oppName && (
          <div style={{ color: '#557078' }}>
            Opponent status: <strong style={{ color: '#17353c' }}>{opponentProgress.status === 'coding' ? 'Typing solution...' : opponentProgress.status === 'submitted' ? `Tested (${opponentProgress.testCasesPassed}/${opponentProgress.totalTestCases} passed)` : 'Observing challenge...'}</strong>
          </div>
        )}
      </div>

      <div className="problem-stage">
        <div className="problem-editor">
          {/* Language Selector Bar */}
          <div className="workspace-editor-toolbar" style={{
            padding: '0.45rem 1rem',
            background: '#222724',
            borderBottom: '1px solid rgba(154, 211, 209, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <ProblemSlideOver
              problem={battle.problem_details}
              isOpen={isProblemOpen}
              onToggle={() => setIsProblemOpen(true)}
              onClose={() => setIsProblemOpen(false)}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Language:
              </span>
              <select
                value={language}
                onChange={(e) => {
                  const newLang = e.target.value;
                  setLanguage(newLang);
                  updateStarterCode(battle, newLang);
                }}
                style={{
                  background: '#141b2a',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="python">Python 3</option>
                <option value="cpp">C++ 17</option>
                <option value="java">Java (OpenJDK)</option>
                <option value="c">C (GCC)</option>
                <option value="javascript">JavaScript (Node)</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => updateStarterCode(battle, language)}
              className="secondary-btn"
              title="Reset starter template"
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
            >
              Reset Template
            </button>
          </div>

          {/* Editor */}
          <div style={{ flex: 1, position: 'relative' }}>
            <Editor
              height="100%"
              theme="vs-dark"
              language={language === 'cpp' || language === 'c' ? 'cpp' : language === 'java' ? 'java' : language === 'javascript' ? 'javascript' : 'python'}
              value={code}
              onChange={handleEditorChange}
              options={{
                fontSize: 14,
                fontFamily: 'JetBrains Mono',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                automaticLayout: true,
                padding: { top: 12, bottom: 12 }
              }}
            />
          </div>

          {/* Result Console */}
          <div style={{ height: '180px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: '0.75rem 1rem', overflowY: 'auto', fontFamily: 'var(--font-code)', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Your Verdict:
              </span>
              {submissionResult && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    color: submissionResult.verdict === 'ACCEPTED' ? '#34d399' : '#f87171',
                    fontWeight: 700
                  }}>
                    {submissionResult.verdict} ({submissionResult.test_cases_passed}/{submissionResult.total_test_cases})
                  </span>
                  {submissionResult.execution_time_ms !== undefined && (
                    <span style={{ color: 'var(--accent-cyan)', fontSize: '0.78rem' }}>
                      ⚡ {submissionResult.execution_time_ms} ms
                    </span>
                  )}
                </div>
              )}
            </div>

            {submissionResult ? (
              <div style={{ color: submissionResult.verdict === 'ACCEPTED' ? '#86efac' : '#fca5a5', whiteSpace: 'pre-wrap' }}>
                {submissionResult.error_output || (submissionResult.verdict === 'ACCEPTED' ? 'Solution accepted! All sample and hidden test cases cleared!' : '')}
              </div>
            ) : (
              <div style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
                Write optimal algorithm and submit. Both sample and hidden test cases will be validated!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Duel Completed Modal with Complexity points breakdown */}
      {isCompleted && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(32, 35, 32, 0.72)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '520px',
            width: '100%',
            padding: '2.5rem',
            textAlign: 'center',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'none'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: isWinner ? '#65786a' : '#8c6960',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: isWinner ? 'var(--shadow-glow-cyan)' : 'var(--shadow-glow-battle)'
            }}>
              <Trophy size={32} color="#fffefa" />
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>
              {isWinner ? 'VICTORY ACHILLES!' : 'DEFEAT'}
            </h2>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              {isWinner ? (
                <>
                  You cleared all test cases for <strong style={{ color: 'var(--text-main)' }}>{battle.problem_details?.title}</strong> first with high time-complexity efficiency!
                </>
              ) : (
                <>
                  <strong style={{ color: '#f43f5e' }}>{battle.winner_name}</strong> submitted the winning accepted solution first.
                </>
              )}
            </p>

            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rating Adjustment</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: battle.is_ranked ? (isWinner ? '#34d399' : '#f87171') : '#94a3b8' }}>
                  {battle.is_ranked ? (
                    isWinner ? `+${battle.winner_points_gained || 35} pts` : '-15 pts'
                  ) : (
                    'Unrated (Custom Room)'
                  )}
                </div>
              </div>
              
              {battle.is_ranked && isWinner && battle.complexity_bonus > 0 && (
                <>
                  <div style={{ width: '1px', height: '36px', background: 'var(--border-subtle)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Time Complexity Bonus</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                      +{battle.complexity_bonus} pts
                    </div>
                  </div>
                </>
              )}

              {battle.is_ranked && isWinner && (
                <>
                  <div style={{ width: '1px', height: '36px', background: 'var(--border-subtle)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Win Streak</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f87171' }}>
                      🔥 {(myStreak ?? 0) + 1}
                    </div>
                  </div>
                </>
              )}

              <div style={{ width: '1px', height: '36px', background: 'var(--border-subtle)' }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Difficulty</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fbbf24' }}>
                  {battle.problem_details?.difficulty}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={onLeave} className="glow-btn" style={{ padding: '0.65rem 1.75rem' }}>
                <span>Return to Lobby</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
