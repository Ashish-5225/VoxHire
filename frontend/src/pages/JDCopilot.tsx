import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import { 
  FileText, 
  Sparkles, 
  BrainCircuit, 
  CheckCircle2, 
  AlertCircle, 
  Target, 
  Layers, 
  Award, 
  Send, 
  ChevronRight, 
  BarChart3, 
  Cpu, 
  ShieldCheck,
  RefreshCw,
  Zap
} from 'lucide-react';


interface JDMetadata {
  cleaned_text: string;
  job_role: string;
  expected_seniority: string;
  years_of_experience: number;
  required_skills: string[];
  preferred_skills: string[];
  programming_languages: string[];
  frameworks_and_libraries: string[];
  databases: string[];
  cloud_technologies: string[];
  tools_and_platforms: string[];
  soft_skills: string[];
  domain_knowledge: string[];
  responsibilities: string[];
  important_keywords: string[];
}

interface QuestionItem {
  question: string;
  category: string;
  skill: string;
  difficulty: string;
  question_type: string;
  relevance_score: number;
  reason: string;
  expected_topics: string[];
  ideal_answer?: string;
  follow_up_question?: string;
}

interface AnswerEvaluation {
  score: number;
  technical_accuracy: number;
  completeness: number;
  relevance: number;
  depth: number;
  reasoning: number;
  communication: number;
  feedback: string;
  missing_concepts: string[];
  strengths: string[];
  follow_up_question: string;
}

interface BenchmarkReport {
  summary: string;
  execution_time_seconds: number;
  classification_metrics: {
    baseline_model: string;
    transformer_model: string;
    category_f1: number;
    category_accuracy: number;
    difficulty_f1: number;
    difficulty_accuracy: number;
  };
  retrieval_metrics: {
    precision_at_3: number;
    recall_at_3: number;
    mrr: number;
    ndcg_at_3: number;
  };
  generation_and_relevance_metrics: {
    avg_question_quality_score: number;
    avg_skill_match_score: number;
    relevance_threshold: number;
    pass_rate_percent: number;
  };
  human_eval_benchmarks_5pt_scale: {
    relevance: number;
    technical_correctness: number;
    difficulty_accuracy: number;
    personalization: number;
    clarity: number;
    overall_usefulness: number;
  };
}

export const JDCopilot: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'parser' | 'generator' | 'practice' | 'benchmark'>('parser');

  // Input states
  const [jdText, setJdText] = useState(
    "Looking for a Backend Developer with 5+ years of experience in Java, Spring Boot, REST APIs, SQL, PostgreSQL, Docker, and AWS.\nResponsibilities:\n- Build and scale high throughput REST APIs\n- Containerize microservices with Docker\n- Optimize PostgreSQL database queries and indexes\n- Deploy cloud services on AWS"
  );
  const [candidateResume, setCandidateResume] = useState(
    "Developed a REST API using Spring Boot and PostgreSQL. Deployed backend microservices using Docker on AWS ECS."
  );
  const [targetRole, setTargetRole] = useState("Backend Developer");
  const [interviewType, setInterviewType] = useState("Technical");
  const [difficulty, setDifficulty] = useState("Medium");
  const [interviewRound, setInterviewRound] = useState("Technical Round 1");

  // Output states
  const [jdMetadata, setJdMetadata] = useState<JDMetadata | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [parsingLoading, setParsingLoading] = useState(false);
  const [generatingLoading, setGeneratingLoading] = useState(false);

  // Practice state
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionItem | null>(null);
  const [candidateAnswer, setCandidateAnswer] = useState("");
  const [evaluatingLoading, setEvaluatingLoading] = useState(false);
  const [answerEvaluation, setAnswerEvaluation] = useState<AnswerEvaluation | null>(null);
  const [adaptiveFollowup, setAdaptiveFollowup] = useState<any>(null);

  // Benchmark state
  const [benchmark, setBenchmark] = useState<BenchmarkReport | null>(null);

  // Analyze JD on click

  const handleAnalyzeJD = async () => {
    if (!jdText.trim()) return;
    setParsingLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/v1/copilot/process-jd`, { jd_text: jdText });
      setJdMetadata(res.data);
      if (res.data.job_role) {
        setTargetRole(res.data.job_role);
      }
    } catch (err) {
      console.error("Error analyzing JD", err);
    } finally {
      setParsingLoading(false);
    }
  };

  // Generate Questions
  const handleGenerateQuestions = async () => {
    if (!jdText.trim()) return;
    setGeneratingLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/v1/copilot/generate-questions`, {
        jd_text: jdText,
        candidate_resume: candidateResume,
        target_role: targetRole,
        interview_type: interviewType,
        difficulty: difficulty,
        interview_round: interviewRound,
        num_questions: 5
      });
      setQuestions(res.data.questions || []);
      if (res.data.jd_metadata) {
        setJdMetadata(res.data.jd_metadata);
      }
      setActiveTab('generator');
    } catch (err) {
      console.error("Error generating questions", err);
    } finally {
      setGeneratingLoading(false);
    }
  };

  // Evaluate Practice Answer
  const handleEvaluateAnswer = async () => {
    if (!selectedQuestion || !candidateAnswer.trim()) return;
    setEvaluatingLoading(true);
    try {
      const evalRes = await axios.post(`${API_URL}/api/v1/copilot/evaluate-answer`, {
        question: selectedQuestion.question,
        user_answer: candidateAnswer,
        expected_topics: selectedQuestion.expected_topics,
        ideal_answer: selectedQuestion.ideal_answer || "",
        jd_context: jdText
      });
      setAnswerEvaluation(evalRes.data);

      // Trigger adaptive follow-up
      const followRes = await axios.post(`${API_URL}/api/v1/copilot/adaptive-followup`, {
        previous_question: selectedQuestion.question,
        candidate_answer: candidateAnswer,
        jd_text: jdText,
        candidate_resume: candidateResume,
        score: evalRes.data.score,
        missing_concepts: evalRes.data.missing_concepts
      });
      setAdaptiveFollowup(followRes.data);
    } catch (err) {
      console.error("Error evaluating answer", err);
    } finally {
      setEvaluatingLoading(false);
    }
  };

  // Fetch Benchmark
  const fetchBenchmark = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/v1/copilot/benchmark`);
      setBenchmark(res.data);
    } catch (err) {
      console.error("Error fetching benchmark", err);
    }
  };


  useEffect(() => {
    if (activeTab === 'benchmark' && !benchmark) {
      fetchBenchmark();
    }
  }, [activeTab]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>ML / NLP Interview Copilot</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            JD-Aware Question Generator & Classification Engine
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl mt-1">
            Extract technical entities from Job Descriptions, generate candidate-grounded interview questions, score relevance, and evaluate answers adaptively.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleGenerateQuestions}
          disabled={generatingLoading || !jdText.trim()}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-950/40 flex items-center gap-2 disabled:opacity-50 shrink-0"
        >
          {generatingLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Generating Pipeline...</span>
            </>
          ) : (
            <>
              <BrainCircuit className="h-4 w-4" />
              <span>Generate Questions</span>
            </>
          )}
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 space-x-2 overflow-x-auto pb-1">
        {[
          { id: 'parser', label: '1. JD Entity Parser', icon: FileText },
          { id: 'generator', label: '2. Question Workbench', icon: Target },
          { id: 'practice', label: '3. Adaptive Evaluator', icon: Award },
          { id: 'benchmark', label: '4. ML Benchmarks', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: JD & RESUME PARSER */}
      {activeTab === 'parser' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-premium p-6 rounded-3xl border border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" />
                <span>Input Job Description (JD)</span>
              </h2>

              <textarea
                rows={7}
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste Job Description here..."
                className="w-full p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Candidate Resume Context (Optional)</label>
                <textarea
                  rows={4}
                  value={candidateResume}
                  onChange={(e) => setCandidateResume(e.target.value)}
                  placeholder="Paste Candidate Resume / Key Projects..."
                  className="w-full p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={handleAnalyzeJD}
                disabled={parsingLoading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {parsingLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                <span>Extract Technical Entities & Taxonomy</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-7">
            {jdMetadata ? (
              <div className="glass-premium p-6 rounded-3xl border border-slate-800 space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <span>{jdMetadata.job_role}</span>
                      <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                        {jdMetadata.expected_seniority}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Required Experience: <span className="text-slate-200 font-bold">{jdMetadata.years_of_experience} + Years</span>
                    </p>
                  </div>
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                </div>

                {/* Categorized Skills Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                    <span className="font-bold text-indigo-400 block uppercase tracking-wider text-[11px]">Programming Languages</span>
                    <div className="flex flex-wrap gap-1.5">
                      {jdMetadata.programming_languages.length > 0 ? jdMetadata.programming_languages.map(s => (
                        <span key={s} className="px-2.5 py-1 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-500/20 font-medium">{s}</span>
                      )) : <span className="text-slate-500 italic">None specified</span>}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                    <span className="font-bold text-purple-400 block uppercase tracking-wider text-[11px]">Frameworks & Libraries</span>
                    <div className="flex flex-wrap gap-1.5">
                      {jdMetadata.frameworks_and_libraries.length > 0 ? jdMetadata.frameworks_and_libraries.map(s => (
                        <span key={s} className="px-2.5 py-1 rounded-lg bg-purple-950/60 text-purple-300 border border-purple-500/20 font-medium">{s}</span>
                      )) : <span className="text-slate-500 italic">None specified</span>}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                    <span className="font-bold text-cyan-400 block uppercase tracking-wider text-[11px]">Databases & Storage</span>
                    <div className="flex flex-wrap gap-1.5">
                      {jdMetadata.databases.length > 0 ? jdMetadata.databases.map(s => (
                        <span key={s} className="px-2.5 py-1 rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-500/20 font-medium">{s}</span>
                      )) : <span className="text-slate-500 italic">None specified</span>}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                    <span className="font-bold text-amber-400 block uppercase tracking-wider text-[11px]">Cloud & DevOps</span>
                    <div className="flex flex-wrap gap-1.5">
                      {jdMetadata.cloud_technologies.length > 0 ? jdMetadata.cloud_technologies.map(s => (
                        <span key={s} className="px-2.5 py-1 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-500/20 font-medium">{s}</span>
                      )) : <span className="text-slate-500 italic">None specified</span>}
                    </div>
                  </div>
                </div>

                {/* Key Responsibilities */}
                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Extracted Key Responsibilities</span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {jdMetadata.responsibilities.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ChevronRight className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="glass p-12 rounded-3xl border border-slate-800 text-center space-y-3">
                <BrainCircuit className="h-12 w-12 text-slate-600 mx-auto" />
                <h3 className="text-lg font-bold text-white">No JD Analyzed Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Click "Extract Technical Entities & Taxonomy" to run NLP preprocessing on the Job Description.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: QUESTION WORKBENCH */}
      {activeTab === 'generator' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="glass p-5 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-medium">
            <div>
              <label className="block text-slate-400 mb-1">Target Role</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Interview Type</label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {['Technical', 'Behavioral', 'HR', 'System Design', 'Coding', 'Project-Based', 'Mixed'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Difficulty Level</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {['Easy', 'Medium', 'Hard', 'Expert'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Interview Round</label>
              <select
                value={interviewRound}
                onChange={(e) => setInterviewRound(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {['Screening', 'Technical Round 1', 'Technical Round 2', 'System Design', 'Managerial', 'HR'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Generated Questions List */}
          <div className="space-y-4">
            {questions.length > 0 ? (
              questions.map((q, idx) => (
                <div key={idx} className="glass-premium p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-indigo-600/30 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                        {idx + 1}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-semibold text-xs">
                        {q.category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-semibold text-xs">
                        {q.skill}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        q.difficulty === 'Easy' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
                        q.difficulty === 'Medium' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
                        'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      }`}>
                        {q.difficulty}
                      </span>
                    </div>

                    {/* Relevance Score Badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-medium">Relevance Score:</span>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold">
                        {Math.round(q.relevance_score * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Question Text */}
                  <h3 className="text-base font-bold text-white leading-relaxed">
                    {q.question}
                  </h3>

                  {/* Grounding Reason */}
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-indigo-300">Selection Grounding: </span>
                      <span>{q.reason}</span>
                    </div>
                  </div>

                  {/* Expected Topics */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 font-medium">Expected Topics:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {q.expected_topics.map((t, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono">{t}</span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        setSelectedQuestion(q);
                        setActiveTab('practice');
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <span>Practice Answer</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="glass p-12 rounded-3xl border border-slate-800 text-center space-y-3">
                <Target className="h-12 w-12 text-slate-600 mx-auto" />
                <h3 className="text-lg font-bold text-white">No Questions Generated</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Click "Generate Questions" to run the Hybrid RAG pipeline against the Job Description.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ADAPTIVE PRACTICE & EVALUATION */}
      {activeTab === 'practice' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 space-y-6">
            <div className="glass-premium p-6 rounded-3xl border border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="h-4 w-4 text-indigo-400" />
                <span>Practice Question</span>
              </h2>

              {selectedQuestion ? (
                <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">{selectedQuestion.category} • {selectedQuestion.skill}</span>
                  <p className="text-sm font-bold text-white">{selectedQuestion.question}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Select a question from the Question Workbench tab or practice the default question above.</p>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Your Candidate Response</label>
                <textarea
                  rows={6}
                  value={candidateAnswer}
                  onChange={(e) => setCandidateAnswer(e.target.value)}
                  placeholder="Type your response here..."
                  className="w-full p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={handleEvaluateAnswer}
                disabled={evaluatingLoading || !candidateAnswer.trim()}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {evaluatingLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>Evaluate Answer & Generate Adaptive Follow-Up</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            {answerEvaluation && (
              <div className="glass-premium p-6 rounded-3xl border border-slate-800 space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold">Evaluation Verdict</span>
                    <h3 className="text-2xl font-extrabold text-indigo-400">{answerEvaluation.score} / 10</h3>
                  </div>
                  <Sparkles className="h-7 w-7 text-amber-300" />
                </div>

                {/* Sub-scores */}
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Technical</span>
                    <span className="font-bold text-white text-sm">{answerEvaluation.technical_accuracy}/10</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Completeness</span>
                    <span className="font-bold text-white text-sm">{answerEvaluation.completeness}/10</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Depth</span>
                    <span className="font-bold text-white text-sm">{answerEvaluation.depth}/10</span>
                  </div>
                </div>

                {/* Feedback */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300">Feedback</span>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3.5 rounded-xl border border-slate-800">
                    {answerEvaluation.feedback}
                  </p>
                </div>

                {/* Missing Concepts */}
                {answerEvaluation.missing_concepts.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Missing Concepts</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {answerEvaluation.missing_concepts.map((c, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-rose-950/40 text-rose-300 border border-rose-500/20 text-xs font-medium">{c}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Adaptive Follow-up Question Card */}
                {adaptiveFollowup && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/30 space-y-2">
                    <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">Adaptive Follow-Up Question</span>
                    <p className="text-xs font-bold text-white leading-relaxed">{adaptiveFollowup.follow_up_question}</p>
                    <p className="text-[11px] text-purple-200/80 italic">Strategy: {adaptiveFollowup.strategy}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ML SYSTEM BENCHMARKS */}
      {activeTab === 'benchmark' && (
        <div className="space-y-6">
          {benchmark ? (
            <div className="space-y-6 animate-fade-in">
              <div className="glass-premium p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-indigo-400" />
                    <span>ML Pipeline Performance Benchmarks</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">{benchmark.summary}</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold">
                  Latency: {benchmark.execution_time_seconds}s
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Classification Metrics */}
                <div className="glass p-6 rounded-3xl border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    <span>Question Classification</span>
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Category Macro F1</span>
                      <span className="font-bold text-white">{benchmark.classification_metrics.category_f1}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Category Accuracy</span>
                      <span className="font-bold text-white">{benchmark.classification_metrics.category_accuracy}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Difficulty F1</span>
                      <span className="font-bold text-white">{benchmark.classification_metrics.difficulty_f1}</span>
                    </div>
                  </div>
                </div>

                {/* Semantic Retrieval Metrics */}
                <div className="glass p-6 rounded-3xl border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>Semantic Retrieval</span>
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Precision@3</span>
                      <span className="font-bold text-white">{benchmark.retrieval_metrics.precision_at_3}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Recall@3</span>
                      <span className="font-bold text-white">{benchmark.retrieval_metrics.recall_at_3}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">MRR (Mean Reciprocal Rank)</span>
                      <span className="font-bold text-white">{benchmark.retrieval_metrics.mrr}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">NDCG@3</span>
                      <span className="font-bold text-white">{benchmark.retrieval_metrics.ndcg_at_3}</span>
                    </div>
                  </div>
                </div>

                {/* Human Evaluation Benchmarks */}
                <div className="glass p-6 rounded-3xl border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    <span>Human Eval (1-5 Scale)</span>
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Relevance</span>
                      <span className="font-bold text-amber-300">{benchmark.human_eval_benchmarks_5pt_scale.relevance} / 5.0</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Technical Correctness</span>
                      <span className="font-bold text-amber-300">{benchmark.human_eval_benchmarks_5pt_scale.technical_correctness} / 5.0</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Personalization</span>
                      <span className="font-bold text-amber-300">{benchmark.human_eval_benchmarks_5pt_scale.personalization} / 5.0</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Overall Usefulness</span>
                      <span className="font-bold text-amber-300">{benchmark.human_eval_benchmarks_5pt_scale.overall_usefulness} / 5.0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Running ML system benchmark evaluation...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
