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
  ArrowRight
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
  status: string;
  score?: number;
  feedback_summary?: string;
  messages: Message[];
}

export const MockInterview: React.FC = () => {
  const [role, setRole] = useState('Backend Developer');
  const [type, setType] = useState('Technical');
  const [difficulty, setDifficulty] = useState('Medium');
  const [interviewRound, setInterviewRound] = useState('Technical Round 1');
  const [jdText, setJdText] = useState('');

  const [voiceMode, setVoiceMode] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(true);
  
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  
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

  // Quick Preset Handlers
  const applyPreset = (presetType: string) => {
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

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setStarting(true);
    try {
      const response = await axios.post(`${API_URL}/api/v1/interview/start`, {
        role,
        type,
        difficulty,
        round: interviewRound,
        jd_text: jdText
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
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in py-4">
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-2">
            <Mic className="h-10 w-10 animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            AI Voice & Adaptive Mock Interview
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Simulate realistic, JD-grounded technical and behavioral interviews. Receive instant evaluation on technical depth, completeness, and missing concepts.
          </p>
        </div>

        <div className="glass-premium p-8 rounded-3xl border border-slate-800/80 shadow-2xl space-y-6">
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
                  onClick={() => applyPreset(p.id)}
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
            </h2>
            <p className="text-xs text-slate-400">
              Status: <span className={session.status === 'active' ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>{session.status.toUpperCase()}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
