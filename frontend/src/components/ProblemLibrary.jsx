import React, { useState, useEffect } from 'react';
import { Search, Code2, Swords, CheckCircle2, Clock, Cpu, Filter, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function ProblemLibrary({ onSelectProblem, onDuelProblem }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('ALL');

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      const data = await api.getProblems();
      setProblems(data);
    } catch (err) {
      console.error("Failed to load problems", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = problems.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesDiff = filterDifficulty === 'ALL' || p.difficulty === filterDifficulty;
    return matchesSearch && matchesDiff;
  });

  return (
    <div className="problem-library-page" style={{ maxWidth: '1280px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* Header section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Problem <span style={{ color: 'var(--accent-cyan)' }}>Library</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            Curated algorithmic challenges. Practice in solo sandbox or challenge opponents in 1v1 duels.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', minWidth: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input 
              type="text"
              placeholder="Search problems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                color: 'var(--text-main)',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', padding: '0.2rem', border: '1px solid var(--border-subtle)' }}>
            {['ALL', 'EASY', 'MEDIUM', 'HARD'].map((diff) => (
              <button
                key={diff}
                onClick={() => setFilterDifficulty(diff)}
                style={{
                  background: filterDifficulty === diff ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  color: filterDifficulty === diff ? 'var(--text-main)' : 'var(--text-dim)',
                  border: 'none',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Problems List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <div className="animate-spin" style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #dcdad2', borderTopColor: '#53766b', borderRadius: '50%', marginBottom: '1rem' }} />
          <div>Loading competitive challenges...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <Code2 size={40} color="var(--text-dim)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>No problems found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.4rem' }}>
            Try adjusting your search query or difficulty filters.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filtered.map((prob) => {
            const badgeClass = prob.difficulty === 'EASY' ? 'badge-easy' : prob.difficulty === 'MEDIUM' ? 'badge-medium' : 'badge-hard';
            return (
              <div 
                key={prob.id}
                className="glass-panel"
                data-problem-card
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.5rem',
                  transition: 'all 0.2s ease',
                  flexWrap: 'wrap'
                }}
              >
                {/* Problem Info */}
                <div className="problem-card-info" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: '280px', flex: 1 }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-code)',
                    fontWeight: 700,
                    color: 'var(--text-dim)'
                  }}>
                    #{prob.id}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                        {prob.title}
                      </span>
                      <span className={`badge ${badgeClass}`}>
                        {prob.difficulty}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={14} />
                        {prob.time_limit_sec}s
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Cpu size={14} />
                        {prob.memory_limit_mb} MB
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle2 size={14} color="#34d399" />
                        {prob.acceptance_rate || 0}% acceptance
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="problem-card-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button 
                    onClick={() => onSelectProblem(prob.id)}
                    className="secondary-btn"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <Code2 size={16} />
                    <span>Solo Practice</span>
                  </button>

                  <button 
                    onClick={() => onDuelProblem(prob.id)}
                    className="battle-btn"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <Swords size={16} />
                    <span>Create 1v1 Room</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
