import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Send, RotateCcw, Clock, Cpu, CheckCircle2, XCircle, AlertTriangle, ArrowLeft, Terminal, FileCode2 } from 'lucide-react';
import { api } from '../services/api';
import ProblemSlideOver from './ProblemSlideOver';

export default function CodeWorkspace({ problemId, onBack, onDuelThis }) {
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [activeConsoleTab, setActiveConsoleTab] = useState('output');
  const [isProblemOpen, setIsProblemOpen] = useState(false);

  useEffect(() => {
    fetchProblemDetails();
  }, [problemId]);

  const fetchProblemDetails = async () => {
    try {
      setLoading(true);
      const data = await api.getProblemDetail(problemId);
      setProblem(data);
      // set default starter code
      updateStarterCode(data, language);
    } catch (err) {
      console.error("Failed to load problem", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStarterCode = (prob, lang) => {
    if (!prob) return;
    if (lang === 'python') setCode(prob.starter_code_python || '# Write solution\n');
    else if (lang === 'cpp') setCode(prob.starter_code_cpp || '#include <iostream>\nusing namespace std;\nint main() { return 0; }\n');
    else if (lang === 'java') setCode(prob.starter_code_java || 'import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n    }\n}\n');
    else if (lang === 'c') setCode(prob.starter_code_c || '#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    return 0;\n}\n');
    else if (lang === 'javascript') setCode(prob.starter_code_javascript || 'const fs = require("fs");\n');
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (problem) {
      updateStarterCode(problem, newLang);
    }
  };

  const handleReset = () => {
    if (problem) {
      updateStarterCode(problem, language);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmissionResult(null);
    setActiveConsoleTab('output');

    try {
      const res = await api.submitCode({
        problem: problem.id,
        language,
        code
      });
      setSubmissionResult(res);
    } catch (err) {
      setSubmissionResult({
        verdict: 'RUNTIME_ERROR',
        error_output: err.message || 'Submission failed. Please make sure you are logged in.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !problem) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--text-muted)' }}>
        <div className="animate-spin" style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #dcdad2', borderTopColor: '#53766b', borderRadius: '50%', marginBottom: '1rem' }} />
        <div>Preparing workspace environment...</div>
      </div>
    );
  }

  const badgeClass = problem.difficulty === 'EASY' ? 'badge-easy' : problem.difficulty === 'MEDIUM' ? 'badge-medium' : 'badge-hard';

  return (
    <div className="coding-shell" style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 75px)',
      background: '#e9e8e2'
    }}>
      {/* Top action bar */}
      <div className="workspace-topbar" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.65rem 1.5rem',
        background: 'rgba(247, 253, 252, 0.82)',
        borderBottom: '1px solid rgba(79, 142, 150, 0.2)',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        {/* Left: back & problem title */}
        <div className="workspace-title-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} className="secondary-btn" style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={16} />
            <span>Library</span>
          </button>
          <div className="workspace-title" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: '#17353c' }}>
              {problem.title}
            </span>
            <span className={`badge ${badgeClass}`}>{problem.difficulty}</span>
          </div>
        </div>

        {/* Center: Language selector */}
        <div className="workspace-language" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-surface)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <FileCode2 size={16} color="var(--accent-cyan)" />
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="python" style={{ background: '#141b2a' }}>Python 3</option>
              <option value="cpp" style={{ background: '#141b2a' }}>C++ 17</option>
              <option value="java" style={{ background: '#141b2a' }}>Java (OpenJDK)</option>
              <option value="c" style={{ background: '#141b2a' }}>C (GCC)</option>
              <option value="javascript" style={{ background: '#141b2a' }}>JavaScript (Node)</option>
            </select>
          </div>

          <button onClick={handleReset} className="secondary-btn" title="Reset starter code" style={{ padding: '0.45rem 0.65rem' }}>
            <RotateCcw size={15} />
          </button>
        </div>

        {/* Right: Submit & Duel buttons */}
        <div className="workspace-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button 
            onClick={() => onDuelThis(problem.id)}
            className="battle-btn"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <span>Duel on This</span>
          </button>

          <button 
            onClick={handleSubmit} 
            disabled={submitting}
            className="glow-btn"
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
          >
            {submitting ? (
              <>
                <div className="animate-spin" style={{ width: '14px', height: '14px', border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%' }} />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Submit Solution</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="problem-stage">
        <div className="problem-editor">
          <div className="workspace-editor-toolbar">
            <span className="editor-context">Code editor <span>/</span> main</span>
            <ProblemSlideOver
              problem={problem}
              isOpen={isProblemOpen}
              onToggle={() => setIsProblemOpen(true)}
              onClose={() => setIsProblemOpen(false)}
            />
          </div>
          {/* Editor Container */}
          <div style={{ flex: 1, minHeight: '320px', position: 'relative' }}>
            <Editor
              height="100%"
              theme="vs-dark"
              language={language === 'cpp' || language === 'c' ? 'cpp' : language === 'java' ? 'java' : language === 'javascript' ? 'javascript' : 'python'}
              value={code}
              onChange={(val) => setCode(val || '')}
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

          {/* Console / Output Drawer */}
          <div style={{
            height: '240px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Drawer Tabs */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.4rem 1rem',
              background: 'rgba(13, 17, 26, 0.9)',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Terminal size={15} color="var(--accent-cyan)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Execution Verdict & Output
                </span>
              </div>

              {submissionResult && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: submissionResult.verdict === 'ACCEPTED' ? '#34d399' : '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    {submissionResult.verdict === 'ACCEPTED' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    {submissionResult.verdict}
                  </span>
                  {submissionResult.total_test_cases > 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Passed: {submissionResult.test_cases_passed} / {submissionResult.total_test_cases}
                    </span>
                  )}
                  {submissionResult.execution_time_ms !== undefined && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {submissionResult.execution_time_ms} ms
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Content */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0.85rem 1rem',
              fontFamily: 'var(--font-code)',
              fontSize: '0.85rem'
            }}>
              {submitting ? (
                <div style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="animate-spin" style={{ width: '14px', height: '14px', border: '2px solid var(--accent-cyan)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                  <span>Running solution through sandbox evaluation...</span>
                </div>
              ) : submissionResult ? (
                <div>
                  <div style={{
                    color: submissionResult.verdict === 'ACCEPTED' ? '#86efac' : '#fca5a5',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.5
                  }}>
                    {submissionResult.error_output || (submissionResult.verdict === 'ACCEPTED' ? 'All test cases passed cleanly!' : 'Evaluation concluded.')}
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
                  Click "Submit Solution" to run your code against automated test cases.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
