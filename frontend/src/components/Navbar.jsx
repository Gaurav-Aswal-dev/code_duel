import React from 'react';
import { Swords, Code2, Trophy, Flame, User, LogOut, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, user, onOpenAuth, onLogout }) {
  return (
    <header className="site-header" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: '#f4f3ef',
      borderBottom: '1px solid #dcdad2',
      padding: '0.75rem 2rem'
    }}>
      <div className="site-header-inner site-brand-name" style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        {/* Brand */}
        <div 
          className="site-brand"
          onClick={() => setActiveTab('lobby')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '3px',
            background: '#35443a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'none'
          }}>
            <Swords size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.35rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#263029',
              lineHeight: 1.1
            }}>
              CODEDUEL
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
              1v1 Code Arena
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="site-nav" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            onClick={() => setActiveTab('lobby')}
            className={`secondary-btn${activeTab === 'lobby' ? ' is-active' : ''}`}
            style={{
              background: activeTab === 'lobby' ? '#e6e5de' : 'transparent',
              borderColor: activeTab === 'lobby' ? '#bdbbb2' : 'transparent',
              color: activeTab === 'lobby' ? '#263029' : '#68716b'
            }}
          >
            <Swords size={18} />
            <span>1v1 Arena</span>
          </button>

          <button 
            onClick={() => setActiveTab('problems')}
            className={`secondary-btn${activeTab === 'problems' ? ' is-active' : ''}`}
            style={{
              background: activeTab === 'problems' ? '#e6e5de' : 'transparent',
              borderColor: activeTab === 'problems' ? '#bdbbb2' : 'transparent',
              color: activeTab === 'problems' ? '#263029' : '#68716b'
            }}
          >
            <Code2 size={18} />
            <span>Problem Library</span>
          </button>

          <button 
            onClick={() => setActiveTab('leaderboard')}
            className={`secondary-btn${activeTab === 'leaderboard' ? ' is-active' : ''}`}
            style={{
              background: activeTab === 'leaderboard' ? '#e6e5de' : 'transparent',
              borderColor: activeTab === 'leaderboard' ? '#bdbbb2' : 'transparent',
              color: activeTab === 'leaderboard' ? '#263029' : '#68716b'
            }}
          >
            <Trophy size={18} />
            <span>Leaderboard</span>
          </button>
        </nav>

        {/* User state / Auth */}
        <div className="site-account" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                background: 'transparent',
                padding: '0.25rem 0.4rem',
                borderRadius: '3px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#65786a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: '#fffefa'
                }}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.username}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '1px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Flame size={12} fill="#fbbf24" />
                      {user.profile?.rating ?? 0} pts
                    </span>
                    {(user.profile?.current_streak ?? 0) > 0 && (
                      <span 
                        title={`Current Win Streak: ${user.profile.current_streak}`}
                        style={{ 
                          fontSize: '0.65rem', 
                          fontWeight: 700, 
                          color: '#f87171', 
                          background: 'rgba(239, 68, 68, 0.2)', 
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          padding: '0.05rem 0.35rem', 
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                      >
                        🔥 {user.profile.current_streak}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={onLogout}
                className="secondary-btn"
                title="Logout"
                style={{ padding: '0.5rem', borderRadius: '3px' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={onOpenAuth} className="glow-btn">
              <Sparkles size={16} />
              <span>Enter Arena</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
