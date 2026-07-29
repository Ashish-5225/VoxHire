import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import { 
  Code, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Clock, 
  Database, 
  FileCode2, 
  Terminal, 
  RotateCcw,
  Copy,
  Check
} from 'lucide-react';

interface CodeEvaluation {
  verdict: string;
  score: number;
  syntax_score: number;
  readability_score: number;
  time_complexity: string;
  space_complexity: string;
  issues: string[];
  improvements: string[];
  refactored_code: string;
}

const PRESET_PROBLEMS = [
  {
    title: 'Two Sum',
    difficulty: 'Easy',
    statement: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.`,
    initialCode: `# Two Sum Solution
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []
`
  },
  {
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    statement: `Given the head of a singly linked list, reverse the list, and return the reversed list.`,
    initialCode: `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next

def reverse_list(head):
    prev = None
    curr = head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev
`
  },
  {
    title: 'LRU Cache Design',
    difficulty: 'Medium',
    statement: `Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\nImplement the LRUCache class with get(key) and put(key, value) in O(1) average time complexity.`,
    initialCode: `class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        val = self.cache.pop(key)
        self.cache[key] = val
        return val

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.pop(key)
        elif len(self.cache) >= self.capacity:
            # Pop first inserted key
            first_key = next(iter(self.cache))
            self.cache.pop(first_key)
        self.cache[key] = value
`
  }
];

export const CodingInterview: React.FC = () => {
  const [selectedProblemIdx, setSelectedProblemIdx] = useState(0);
  const [language, setLanguage] = useState('python');
  const [problemStatement, setProblemStatement] = useState(PRESET_PROBLEMS[0].statement);
  const [code, setCode] = useState(PRESET_PROBLEMS[0].initialCode);
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<CodeEvaluation | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSelectProblem = (idx: number) => {
    setSelectedProblemIdx(idx);
    setProblemStatement(PRESET_PROBLEMS[idx].statement);
    setCode(PRESET_PROBLEMS[idx].initialCode);
    setEvaluation(null);
  };

  const handleEvaluate = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/v1/coding/evaluate`, {
        language,
        problem_statement: problemStatement,
        code
      });
      setEvaluation(response.data);
    } catch (err) {
      console.error('Error evaluating code', err);
    } finally {
      setLoading(false);
    }
  };

  const copyRefactoredCode = () => {
    if (evaluation?.refactored_code) {
      navigator.clipboard.writeText(evaluation.refactored_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 15) }, (_, i) => i + 1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <Code className="h-8 w-8 text-emerald-400" />
            <span>Interactive Coding Arena</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Solve algorithmic challenges and receive automated AI complexity, edge-case, and readability analysis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="python font-mono">Python 3</option>
            <option value="javascript">JavaScript (ES6)</option>
            <option value="typescript">TypeScript</option>
            <option value="java">Java 17</option>
            <option value="cpp">C++ 20</option>
          </select>

          <button
            onClick={handleEvaluate}
            disabled={loading || !code.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-950/30 text-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <RotateCcw className="h-4 w-4 animate-spin" />
                <span>Evaluating Logic...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Run AI Audit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preset Problem Selection Bar */}
      <div className="flex flex-wrap gap-2 pb-2">
        {PRESET_PROBLEMS.map((prob, idx) => (
          <button
            key={prob.title}
            onClick={() => handleSelectProblem(idx)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border ${
              selectedProblemIdx === idx
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode2 className="h-4 w-4" />
            <span>{prob.title}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">{prob.difficulty}</span>
          </button>
        ))}
      </div>

      {/* Dual Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Code Editor & Problem Prompt */}
        <div className="lg:col-span-7 space-y-4">
          {/* Problem Statement Box */}
          <div className="glass p-5 rounded-2xl border border-slate-800/80 space-y-2">
            <h3 className="text-base font-bold text-white flex items-center justify-between">
              <span>Problem Statement: {PRESET_PROBLEMS[selectedProblemIdx]?.title}</span>
              <span className="text-xs text-emerald-400 font-semibold">{PRESET_PROBLEMS[selectedProblemIdx]?.difficulty}</span>
            </h3>
            <textarea
              rows={3}
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Code Editor Window */}
          <div className="glass rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
            {/* Editor Header */}
            <div className="h-10 bg-slate-900/90 border-b border-slate-800/80 px-4 flex items-center justify-between text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                <span>solution.{language === 'python' ? 'py' : language === 'javascript' ? 'js' : 'ts'}</span>
              </div>
              <span>UTF-8</span>
            </div>

            {/* Editor Content */}
            <div className="flex bg-slate-950/90 p-4 font-mono text-xs leading-relaxed overflow-x-auto min-h-[350px]">
              <div className="select-none text-slate-600 text-right pr-4 border-r border-slate-800/60">
                {lineNumbers.map((n) => (
                  <div key={n}>{n}</div>
                ))}
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="flex-1 bg-transparent text-emerald-300 focus:outline-none resize-none pl-4 font-mono leading-relaxed whitespace-pre"
                rows={Math.max(lineCount + 2, 16)}
              />
            </div>
          </div>
        </div>

        {/* Right Pane: AI Evaluation Feedback */}
        <div className="lg:col-span-5 space-y-4">
          {evaluation ? (
            <div className="space-y-4">
              {/* Verdict & Score Banner */}
              <div className="glass-premium p-6 rounded-2xl border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    <span>AI Audit Verdict</span>
                  </span>
                  <span className="text-2xl font-extrabold text-white">{evaluation.score}%</span>
                </div>
                <h3 className="text-xl font-bold text-white">{evaluation.verdict}</h3>
                
                {/* Metrics Badges */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
                    <Clock className="h-5 w-5 text-indigo-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400">Time Complexity</p>
                      <p className="text-xs font-bold text-white font-mono">{evaluation.time_complexity}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
                    <Database className="h-5 w-5 text-purple-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400">Space Complexity</p>
                      <p className="text-xs font-bold text-white font-mono">{evaluation.space_complexity}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bug Alerts / Issues */}
              <div className="glass p-5 rounded-2xl border border-slate-800/80 space-y-3">
                <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Detected Bugs & Edge Cases</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {evaluation.issues?.map((issue, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                      <span>{issue}</span>
                    </li>
                  )) || <p className="text-slate-500">No critical bugs found.</p>}
                </ul>
              </div>

              {/* Suggestions */}
              <div className="glass p-5 rounded-2xl border border-slate-800/80 space-y-3">
                <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Recommended Enhancements</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {evaluation.improvements?.map((imp, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>{imp}</span>
                    </li>
                  )) || <p className="text-slate-500">Code is optimal.</p>}
                </ul>
              </div>

              {/* Refactored Code Snippet */}
              {evaluation.refactored_code && (
                <div className="glass p-5 rounded-2xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-300 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <span>Refactored Production Solution</span>
                    </span>
                    <button
                      onClick={copyRefactoredCode}
                      className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-900 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre">
                    {evaluation.refactored_code}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="glass p-8 rounded-2xl border border-slate-800/80 flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
              <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Code className="h-8 w-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Ready for Code Audit</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Click 'Run AI Audit' to evaluate syntax correctness, asymptotic complexity, and receive instant refactored code.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
