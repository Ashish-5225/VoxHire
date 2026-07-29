import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import { 
  History as HistoryIcon, 
  Calendar, 
  Award, 
  Bot, 
  User as UserIcon, 
  Eye, 
  X, 
  Search, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface SessionItem {
  id: number;
  role: string;
  type: string;
  status: string;
  score: number;
  created_at: string;
}

interface FullSession {
  id: number;
  role: string;
  type: string;
  status: string;
  score: number;
  feedback_summary: string;
  created_at: string;
  messages: Array<{
    id: number;
    sender: 'ai' | 'user';
    text: string;
    feedback_json?: string;
  }>;
}

export const History: React.FC = () => {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState<FullSession | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/v1/interview/history`);
      setSessions(response.data);
    } catch (err) {
      console.error('Error fetching interview history', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (sessionId: number) => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/interview/${sessionId}`);
      setSelectedSession(response.data);
    } catch (err) {
      console.error('Error fetching session details', err);
    }
  };

  const filteredSessions = sessions.filter(
    (s) =>
      s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <HistoryIcon className="h-8 w-8 text-indigo-400" />
            <span>Interview History & Review Log</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Review past mock interview transcripts, question evaluations, and long-term score performance.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Filter by role or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* History Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <RefreshCw className="h-10 w-10 text-indigo-400 animate-spin" />
        </div>
      ) : filteredSessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className="glass p-6 rounded-2xl border border-slate-800/80 hover:border-indigo-500/30 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-semibold">
                    {session.type}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(session.created_at).toLocaleDateString()}</span>
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-white text-lg group-hover:text-indigo-300 transition-colors">
                    {session.role}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Session ID: #{session.id}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-lg">
                  <Award className="h-5 w-5" />
                  <span>{session.score || 70}%</span>
                </div>

                <button
                  onClick={() => handleViewDetails(session.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-indigo-500/40 transition-all"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Transcript</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass p-12 rounded-3xl border border-slate-800/80 text-center space-y-3">
          <HistoryIcon className="h-12 w-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Mock Interviews Recorded Yet</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Start your first mock interview practice round to store detailed line-by-line transcripts.
          </p>
        </div>
      )}

      {/* Transcript Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-premium w-full max-w-3xl max-h-[85vh] rounded-3xl border border-slate-800/80 flex flex-col overflow-hidden shadow-2xl animate-fade-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>{selectedSession.role}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                    {selectedSession.type}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">Score: {selectedSession.score}% • {new Date(selectedSession.created_at).toLocaleString()}</p>
              </div>

              <button
                onClick={() => setSelectedSession(null)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content - Messages */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* Aggregate Summary */}
              {selectedSession.feedback_summary && (
                <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-1">
                  <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>Executive Session Review</span>
                  </h4>
                  <p className="text-xs text-slate-200 leading-relaxed">{selectedSession.feedback_summary}</p>
                </div>
              )}

              {/* Chat Thread */}
              {selectedSession.messages?.map((msg, idx) => {
                const feedback = msg.feedback_json ? JSON.parse(msg.feedback_json) : null;
                return (
                  <div key={idx} className={`flex flex-col space-y-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 px-1">
                      {msg.sender === 'ai' ? (
                        <>
                          <Bot className="h-4 w-4 text-indigo-400" />
                          <span className="text-xs font-semibold text-indigo-300">AI Interviewer</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs font-semibold text-slate-400">Candidate Answer</span>
                          <UserIcon className="h-4 w-4 text-purple-400" />
                        </>
                      )}
                    </div>

                    <div
                      className={`p-4 rounded-2xl max-w-xl text-xs leading-relaxed ${
                        msg.sender === 'ai'
                          ? 'bg-slate-900 border border-slate-800 text-slate-100'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>

                      {feedback && (
                        <div className="mt-3 pt-2.5 border-t border-indigo-400/20 space-y-1 text-[11px] bg-indigo-950/40 p-2.5 rounded-xl text-slate-200">
                          <div className="flex justify-between font-bold text-indigo-200">
                            <span>Evaluated Score</span>
                            <span>{feedback.correctness_score || 80}%</span>
                          </div>
                          <p>{feedback.feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
