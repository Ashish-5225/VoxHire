import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import { 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Play, 
  Award, 
  Bot, 
  User as UserIcon, 
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Lightbulb,
  Plus,
  Trash2,
  ListOrdered,
  BrainCircuit,
  CheckCircle2,
  X,
  BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Message {
  id?: number;
  sender: 'ai' | 'user';
  text: string;
  feedback?: {
    score?: number;
    correctness_score?: number;
    technical_accuracy?: number;
    completeness?: number;
    depth?: number;
    communication_score?: number;
    tone_score?: number;
    feedback?: string;
    suggested_improvement?: string;
    missing_concepts?: string[];
    strengths?: string[];
  };
}

interface InterviewSession {
  id: number;
  role: string;
  type: string;
  difficulty?: string;
  round?: string;
  jd_text?: string;
  mode?: string;
  status: string;
  score?: number;
  feedback_summary?: string;
  messages: Message[];
}

export const MockInterview: React.FC = () => {
  // Session Configuration State
  const [mode, setMode] = useState<'adaptive_agent' | 'custom_questions'>('adaptive_agent');
  const [role, setRole] = useState('Backend Developer');
  const [type, setType] = useState('Technical');
  const [difficulty, setDifficulty] = useState('Medium');
  const [interviewRound, setInterviewRound] = useState('Technical Round 1');
  const [jdText, setJdText] = useState('');

  // Custom Question Bank state
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [selectedPresetPack, setSelectedPresetPack] = useState('');

  // Audio / Speech State
  const [voiceMode, setVoiceMode] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(true);
  
  // Session State
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  
  // Live AI Hint Modal state
  const [hintLoading, setHintLoading] = useState(false);
  const [activeHint, setActiveHint] = useState<{
    hint: string;
    key_concepts: string[];
    ideal_answer_structure?: string;
  } | null>(null);
  const [showHintModal, setShowHintModal] = useState(false);

  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Web Speech Synthesis (Text-to-Speech)
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Speech Recognition setup (Voice-to-Text)
  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Browser speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputText((prev) => (prev ? prev + ' ' + transcript : transcript));
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    }
  };

  // Preset topic packs for Custom Question Bank
  const TOPIC_PRESETS: Record<string, { label: string; questions: string[] }> = {
    system_design: {
      label: 'System Design & Architecture',
      questions: [
        'Design a high-throughput, low-latency URL Shortener service handling 100M daily active users.',
        'How would you design a distributed rate-limiting service across multiple microservice gateways?',
        'Explain how you would handle data consistency and replication lag in a multi-region database cluster.'
      ]
    },
    java_backend: {
      label: 'Java & Spring Boot Backend',
      questions: [
        'How does Java Garbage Collection work under the hood, and what are the key differences between G1GC and ZGC?',
        'Explain thread safety in Java: how do volatile, synchronized, and ReentrantLock differ in performance?',
        'How do you implement distributed transactions across microservices using the Saga Pattern?'
      ]
    },
    react_frontend: {
      label: 'React & Web Engineering',
      questions: [
        'Explain how React Fiber reconciliation works and how Concurrent Mode improves rendering performance.',
        'What strategies do you use to optimize Core Web Vitals (LCP, INP, CLS) in a large-scale frontend app?',
        'Compare Redux Toolkit, Zustand, and Context API for state management and persistence.'
      ]
    },
    ml_engineering: {
      label: 'Machine Learning & MLOps',
      questions: [
        'Explain the Self-Attention mechanism in Transformer architectures and why multi-head attention is essential.',
        'How do you address catastrophic forgetting and hallucination when fine-tuning Large Language Models?',
        'What metrics and evaluation pipelines do you use to assess RAG retrieval quality and generation accuracy?'
      ]
    },
    behavioral_star: {
      label: 'Behavioral & STAR Leadership',
      questions: [
        'Tell me about a time you experienced a major architectural disagreement with your team. How did you resolve it?',
        'Describe a high-severity production outage you triaged. What was the root cause and remediation?',
        'Give an example of a high-pressure project where requirements changed rapidly. How did you keep stakeholders aligned?'
      ]
    }
  };

  // Preset role appliers
  const applyRolePreset = (presetType: string) => {
    if (presetType === 'backend') {
      setRole('Backend Developer');
      setType('Technical');
      setJdText('Looking for a Backend Developer with experience in Java, Spring Boot, REST APIs, SQL, PostgreSQL, Docker, and AWS cloud infrastructure.');
    } else if (presetType === 'frontend') {
      setRole('Frontend Engineer');
      setType('Technical');
      setJdText('Looking for a Frontend Engineer skilled in React, TypeScript, Tailwind CSS, Next.js, Redux, State Management, and REST/GraphQL APIs.');
    } else if (presetType === 'ml') {
      setRole('Machine Learning Engineer');
      setType('Technical');
      setJdText('Looking for an ML Engineer experienced in Python, PyTorch, Deep Learning, NLP, Model Fine-tuning, and MLOps deployment.');
    } else if (presetType === 'behavioral') {
      setRole('Software Engineer');
      setType('Behavioral');
      setJdText('Looking for an engineer with strong leadership, stakeholder collaboration, dispute resolution, and STAR methodology communication.');
    }
  };

  // Add Custom Question to Queue
  const handleAddCustomQuestion = () => {
    if (!customInput.trim()) return;
    setCustomQuestions((prev) => [...prev, customInput.trim()]);
    setCustomInput('');
  };

  const handleRemoveCustomQuestion = (index: number) => {
    setCustomQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApplyPresetPack = (packKey: string) => {
    setSelectedPresetPack(packKey);
    if (packKey && TOPIC_PRESETS[packKey]) {
      setCustomQuestions(TOPIC_PRESETS[packKey].questions);
    }
  };

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setStarting(true);
    try {
      const response = await axios.post(`${API_URL}/api/v1/interview/start`, {
        role,
        type,
        difficulty,
        round: interviewRound,
        jd_text: jdText,
        mode,
        custom_questions: mode === 'custom_questions' ? customQuestions : []
      });

      const newSession = response.data;
      setSession(newSession);
      
      const initialMessages: Message[] = (newSession.messages || []).map((m: any) => ({
        id: m.id,
        sender: m.sender,
        text: m.text,
        feedback: m.feedback_json ? JSON.parse(m.feedback_json) : undefined
      }));

      setMessages(initialMessages);

      if (autoSpeak && initialMessages.length > 0) {
        speakText(initialMessages[0].text);
      }
    } catch (err) {
      console.error('Error starting interview session', err);
    } finally {
      setStarting(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !session || loading) return;

    const userMessageText = inputText.trim();
    setInputText('');

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    // Add candidate user message immediately
    const tempUserMsg: Message = { sender: 'user', text: userMessageText };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/v1/interview/${session.id}/message`, {
        text: userMessageText
      });

      const returnedUserMsg = response.data;
      const userFeedback = returnedUserMsg.feedback_json ? JSON.parse(returnedUserMsg.feedback_json) : undefined;

      // Update the user message with feedback
      setMessages((prev) => {
        const copy = [...prev];
        const lastIdx = copy.length - 1;
        if (lastIdx >= 0 && copy[lastIdx].sender === 'user') {
          copy[lastIdx].feedback = userFeedback;
        }
        return copy;
      });

      // Refresh session details from server
      const sessionDetails = await axios.get(`${API_URL}/api/v1/interview/${session.id}`);
      const updatedMessages: Message[] = (sessionDetails.data.messages || []).map((m: any) => ({
        id: m.id,
        sender: m.sender,
        text: m.text,
        feedback: m.feedback_json ? JSON.parse(m.feedback_json) : undefined
      }));

      setMessages(updatedMessages);

      // Auto speak last AI question
      const lastAiMsg = [...updatedMessages].reverse().find(m => m.sender === 'ai');
      if (autoSpeak && lastAiMsg) {
        speakText(lastAiMsg.text);
      }
    } catch (err) {
      console.error('Error sending response', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestHint = async () => {
    if (!session || hintLoading) return;
    const lastAiMsg = [...messages].reverse().find(m => m.sender === 'ai');
    if (!lastAiMsg) return;

    setHintLoading(true);
    setShowHintModal(true);
    try {
      const res = await axios.post(`${API_URL}/api/v1/interview/${session.id}/hint`, {
        question: lastAiMsg.text,
        user_draft: inputText
      });
      setActiveHint(res.data);
    } catch (err) {
      console.error('Error fetching hint', err);
      setActiveHint({
        hint: 'Structure your answer around: 1. Core concept definition, 2. Architecture & trade-offs, 3. Practical handling of edge cases.',
        key_concepts: ['Definition & Principles', 'Architectural Trade-offs', 'Production Edge Cases'],
        ideal_answer_structure: 'Start with high-level architecture, dive into specific technical mechanisms, and conclude with monitoring or performance trade-offs.'
      });
    } finally {
      setHintLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!session) return;
    setEnding(true);
    try {
      const response = await axios.post(`${API_URL}/api/v1/interview/${session.id}/end`);
      setSession(response.data);
      window.speechSynthesis.cancel();
    } catch (err) {
      console.error('Error ending interview session', err);
    } finally {
      setEnding(false);
    }
  };

  // Render Session Setup form
  if (!session) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in py-4">
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-2">
            <Mic className="h-10 w-10 animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            AI Voice & Adaptive Mock Interview
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Simulate realistic technical and behavioral interviews with real-time speech evaluation, adaptive AI follow-up questions, and custom question banks.
          </p>
        </div>

        <div className="glass-premium p-8 rounded-3xl border border-slate-800/80 shadow-2xl space-y-6">
          {/* Mode Switcher Tabs */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Interview Mode
            </label>
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-900/80 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setMode('adaptive_agent')}
                className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  mode === 'adaptive_agent'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-950/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BrainCircuit className="h-4 w-4" />
                <span>Autonomous AI Agent (Adaptive)</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('custom_questions')}
                className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  mode === 'custom_questions'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-950/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListOrdered className="h-4 w-4" />
                <span>Custom Question Bank / Topic Packs</span>
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Quick Role Presets
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { id: 'backend', label: 'Backend (Java/Spring)' },
                { id: 'frontend', label: 'Frontend (React/TS)' },
                { id: 'ml', label: 'Machine Learning' },
                { id: 'behavioral', label: 'Behavioral / STAR' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyRolePreset(p.id)}
                  className="py-2.5 px-3 rounded-xl bg-slate-900/60 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/30 text-xs font-semibold text-slate-300 transition-all text-center"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleStartSession} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Target Job Role
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Backend Engineer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Interview Category
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                >
                  {['Technical', 'Behavioral', 'System Design', 'HR Culture', 'Coding', 'Project-Based', 'Mixed'].map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                >
                  {['Easy', 'Medium', 'Hard', 'Expert'].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Interview Round
                </label>
                <select
                  value={interviewRound}
                  onChange={(e) => setInterviewRound(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                >
                  {['Screening', 'Technical Round 1', 'Technical Round 2', 'System Design', 'Managerial', 'HR'].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Question Bank UI */}
            {mode === 'custom_questions' && (
              <div className="space-y-4 p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-indigo-400" />
                    <span>Custom Question Queue ({customQuestions.length} Questions)</span>
                  </h3>
                  <span className="text-xs text-indigo-300">Pick a preset topic or add your own</span>
                </div>

                {/* Preset Topic Selection */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Pre-defined Topic Question Packs
                  </label>
                  <select
                    value={selectedPresetPack}
                    onChange={(e) => handleApplyPresetPack(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                  >
                    <option value="">-- Select a Question Pack --</option>
                    {Object.entries(TOPIC_PRESETS).map(([key, pack]) => (
                      <option key={key} value={key}>{pack.label} ({pack.questions.length} questions)</option>
                    ))}
                  </select>
                </div>

                {/* Add Custom Question Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter custom interview question..."
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomQuestion(); } }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomQuestion}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add</span>
                  </button>
                </div>

                {/* List of Queued Questions */}
                {customQuestions.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {customQuestions.map((q, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs text-slate-200 gap-3">
                        <span className="font-semibold text-indigo-400 shrink-0">Q{idx + 1}.</span>
                        <span className="flex-1 line-clamp-2">{q}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomQuestion(idx)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors shrink-0"
                          title="Remove Question"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No custom questions added yet. Add custom questions above or select a pre-defined pack.</p>
                )}
              </div>
            )}

            {/* Optional JD Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
                <span>Target Job Description (Optional)</span>
                <span className="text-[10px] text-indigo-400 font-normal">Grounds questions in JD requirements</span>
              </label>
              <textarea
                rows={4}
                placeholder="Paste the Job Description to generate role-grounded interview questions..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                className="w-full p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono leading-relaxed"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-indigo-400" />
                  <span>Voice Audio Synthesis & Speech Capture</span>
                </p>
                <p className="text-xs text-slate-400">Enables automatic question readouts and voice-to-text input</p>
              </div>
              <button
                type="button"
                onClick={() => setVoiceMode(!voiceMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  voiceMode ? 'bg-indigo-600' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    voiceMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <button
              type="submit"
              disabled={starting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 text-white font-bold text-base hover:from-indigo-500 hover:to-purple-500 active:scale-[0.99] transition-all shadow-xl shadow-indigo-950/40 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {starting ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Initializing Adaptive Interviewer...</span>
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 fill-current" />
                  <span>Begin Mock Session</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render active or completed session UI
  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-4 animate-fade-in">
      {/* Top Session Bar */}
      <div className="glass p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <span>{session.role}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-medium">
                {session.type}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-medium">
                {session.difficulty || 'Medium'}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {session.mode === 'custom_questions' ? 'Custom Queue' : 'AI Adaptive Agent'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Status: <span className={session.status === 'active' ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>{session.status.toUpperCase()}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {session.status === 'active' && (
            <button
              onClick={handleRequestHint}
              disabled={hintLoading}
              className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2 transition-all"
              title="Request AI Hint & Ideal Answer Guidance"
            >
              <Lightbulb className={`h-4 w-4 ${hintLoading ? 'animate-spin' : 'text-amber-400'}`} />
              <span className="hidden sm:inline">Request AI Hint</span>
            </button>
          )}

          <button
            onClick={() => setAutoSpeak(!autoSpeak)}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
              autoSpeak 
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' 
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title="Toggle Text-to-speech voice"
          >
            {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span className="hidden sm:inline">Voice TTS</span>
          </button>

          {session.status === 'active' && (
            <button
              onClick={handleEndSession}
              disabled={ending}
              className="px-4 py-2.5 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-300 font-semibold text-xs hover:bg-rose-600/30 transition-all"
            >
              {ending ? 'Finalizing...' : 'Complete Session'}
            </button>
          )}
        </div>
      </div>

      {/* Live AI Hint Modal */}
      {showHintModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-premium max-w-lg w-full p-6 rounded-3xl border border-indigo-500/30 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                <Lightbulb className="h-5 w-5" />
                <span>AI Interviewer Hint & Target Concepts</span>
              </div>
              <button
                onClick={() => setShowHintModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {hintLoading ? (
              <div className="py-8 text-center space-y-3">
                <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-400">AI Mentor is analyzing question trade-offs & formulating hints...</p>
              </div>
            ) : activeHint ? (
              <div className="space-y-4 text-xs">
                {/* Strategic Hint */}
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 leading-relaxed">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-amber-400 block mb-1">Strategic Hint</span>
                  {activeHint.hint}
                </div>

                {/* Key Concepts */}
                {activeHint.key_concepts && activeHint.key_concepts.length > 0 && (
                  <div>
                    <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block mb-1.5">Key Concepts to Mention</span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeHint.key_concepts.map((concept, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 font-semibold text-[11px]">
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ideal Response Structure */}
                {activeHint.ideal_answer_structure && (
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-200 leading-relaxed">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-indigo-400 block mb-1">Recommended Response Outline</span>
                    <p className="whitespace-pre-wrap font-mono text-[11px]">{activeHint.ideal_answer_structure}</p>
                  </div>
                )}
              </div>
            ) : null}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHintModal(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500"
              >
                Got It, Continue Answer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completed Summary Banner if session is finished */}
      {session.status === 'completed' && (
        <div className="glass p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-950/40 space-y-4 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="h-6 w-6 text-amber-400" />
              <span>Interview Session Completed</span>
            </h3>
            <span className="text-3xl font-extrabold text-indigo-400">{session.score || 75}%</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{session.feedback_summary}</p>

          <div className="pt-2 flex justify-end">
            <Link
              to="/roadmap"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center gap-2"
            >
              <span>Generate Target Learning Roadmap</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Chat Messages Feed */}
      <div className="flex-1 glass p-4 md:p-6 rounded-2xl border border-slate-800/80 overflow-y-auto space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col space-y-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-2 px-1">
              {msg.sender === 'ai' ? (
                <>
                  <Bot className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-indigo-300">AI Interviewer</span>
                </>
              ) : (
                <>
                  <span className="text-xs font-semibold text-slate-400">Candidate You</span>
                  <UserIcon className="h-4 w-4 text-purple-400" />
                </>
              )}
            </div>

            <div
              className={`p-4 md:p-5 rounded-2xl max-w-2xl text-sm leading-relaxed ${
                msg.sender === 'ai'
                  ? 'bg-slate-900/90 border border-slate-800 text-slate-100 rounded-tl-sm shadow-md'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-sm shadow-lg shadow-indigo-950/30'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <p className="whitespace-pre-wrap">{msg.text}</p>
                {msg.sender === 'ai' && (
                  <button
                    onClick={() => speakText(msg.text)}
                    className="p-1 rounded text-slate-400 hover:text-indigo-300 shrink-0"
                    title="Play voice readout"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Per-response Evaluation feedback card */}
              {msg.feedback && (
                <div className="mt-4 pt-3 border-t border-indigo-400/20 space-y-2 text-xs text-indigo-100 bg-indigo-950/40 p-4 rounded-xl">
                  <div className="flex justify-between items-center font-bold text-indigo-200">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                      <span>Response Feedback</span>
                    </span>
                    <span className="bg-indigo-500/30 px-2.5 py-0.5 rounded text-[11px] font-extrabold text-amber-300">
                      Score: {msg.feedback.score ? `${msg.feedback.score}/10` : `${msg.feedback.correctness_score || 80}%`}
                    </span>
                  </div>

                  <p className="text-slate-200">{msg.feedback.feedback}</p>

                  {/* Missing Concepts Badge Callout */}
                  {msg.feedback.missing_concepts && msg.feedback.missing_concepts.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>Missing Concepts to Cover:</span>
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {msg.feedback.missing_concepts.map((concept, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-500/30 text-[10px] font-semibold">{concept}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {msg.feedback.suggested_improvement && (
                    <p className="text-amber-300 font-medium pt-1">Tip: {msg.feedback.suggested_improvement}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 text-slate-400 text-sm">
            <div className="h-8 w-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
              <Bot className="h-4 w-4 text-indigo-400 animate-spin" />
            </div>
            <span className="italic">AI Interviewer is analyzing response & formulating adaptive question...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input controls zone */}
      {session.status === 'active' && (
        <form onSubmit={handleSendMessage} className="glass p-3 rounded-2xl border border-slate-800/80 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={toggleRecording}
            className={`p-3 rounded-xl border transition-all relative ${
              isRecording 
                ? 'bg-rose-600 text-white border-rose-500 animate-pulse' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
            title={isRecording ? 'Stop Recording' : 'Start Microphone Voice Capture'}
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}

            {isRecording && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            )}
          </button>

          <input
            type="text"
            placeholder={isRecording ? 'Listening to your voice...' : 'Type your answer to the interviewer...'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            className="flex-1 bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />

          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            <span>Send</span>
            <Send className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  );
};
