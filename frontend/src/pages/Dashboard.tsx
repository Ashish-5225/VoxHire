import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import { 
  FileText, 
  Mic, 
  Code, 
  GitFork, 
  Sparkles, 
  ArrowUpRight, 
  CheckCircle2, 
  TrendingUp, 
  Star,
  Clock
} from 'lucide-react';

interface AnalyticsData {
  ats_score: number | null;
  total_interviews: number;
  average_interview_score: number;
  skills_breakdown: {
    [key: string]: number;
  };
  score_timeline: Array<{
    date: string;
    score: number;
    type: string;
  }>;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/v1/analytics`);
        setData(response.data);
      } catch (err) {
        console.error('Error fetching dashboard analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const featureCards = [
    {
      title: 'Mock Interview',
      desc: 'Simulate full behavioral, HR, and technical rounds with Gemini AI.',
      icon: Mic,
      color: 'from-blue-600/30 to-indigo-600/30 border-indigo-500/20 text-indigo-400',
      action: 'Start Practice',
      link: '/interview'
    },
    {
      title: 'Resume Analyzer',
      desc: 'Get immediate ATS scores and detailed keyword recommendations.',
      icon: FileText,
      color: 'from-purple-600/30 to-pink-600/30 border-purple-500/20 text-purple-400',
      action: 'Optimize ATS',
      link: '/resume'
    },
    {
      title: 'Coding Arena',
      desc: 'Practice technical coding questions and get automated code complexity audits.',
      icon: Code,
      color: 'from-emerald-600/30 to-teal-600/30 border-emerald-500/20 text-emerald-400',
      action: 'Write Code',
      link: '/coding'
    },
    {
      title: 'Learning Roadmap',
      desc: 'Build step-by-step career path milestones to address resume gaps.',
      icon: GitFork,
      color: 'from-amber-600/30 to-orange-600/30 border-amber-500/20 text-amber-400',
      action: 'View Roadmap',
      link: '/roadmap'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  // Calculate coordinates for the SVG timeline chart
  const scores = data?.score_timeline || [];
  const svgWidth = 500;
  const svgHeight = 150;
  const padding = 20;

  const points = scores.map((s, idx) => {
    const x = padding + (idx / (scores.length - 1 || 1)) * (svgWidth - padding * 2);
    const y = svgHeight - padding - (s.score / 100) * (svgHeight - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative glass-premium p-6 md:p-8 rounded-3xl border border-slate-800/80 overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Preparation Co-pilot Status: Operational</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">Elevate your interview game.</h2>
          <p className="text-slate-400 text-sm md:text-base max-w-xl">
            Upload your resume, start dynamic simulated interviews, and get immediate metrics tracking to secure your next role.
          </p>
        </div>
        <Link 
          to="/interview" 
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-900/20 whitespace-nowrap active:scale-95"
        >
          <span>Start Instant Practice</span>
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* ATS Score card */}
        <div className="glass p-6 rounded-2xl border border-slate-800/50 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-slate-400 font-medium">ATS Score</p>
            <p className="text-3xl font-extrabold text-white">
              {data?.ats_score !== null ? `${data?.ats_score}%` : 'N/A'}
            </p>
            <p className="text-xs text-slate-500">Based on latest resume uploaded</p>
          </div>
          <div className="h-14 w-14 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        {/* Interviews Completed card */}
        <div className="glass p-6 rounded-2xl border border-slate-800/50 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-slate-400 font-medium">Completed Mocks</p>
            <p className="text-3xl font-extrabold text-white">{data?.total_interviews || 0}</p>
            <p className="text-xs text-slate-500">Practice sessions recorded</p>
          </div>
          <div className="h-14 w-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        {/* Average Score card */}
        <div className="glass p-6 rounded-2xl border border-slate-800/50 flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div className="space-y-1">
            <p className="text-sm text-slate-400 font-medium">Average Evaluation</p>
            <p className="text-3xl font-extrabold text-white">
              {data?.average_interview_score ? `${data.average_interview_score}%` : 'N/A'}
            </p>
            <p className="text-xs text-slate-500">Cumulative average performance</p>
          </div>
          <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline Chart */}
        <div className="glass p-6 rounded-3xl border border-slate-800/50 lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-400" />
              <span>Score Progression</span>
            </h3>
            <span className="text-xs text-slate-400 font-semibold">Latest sessions</span>
          </div>

          <div className="w-full flex justify-center bg-slate-900/30 p-4 rounded-xl border border-slate-800/30 relative">
            {scores.length > 1 ? (
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
                {/* Grids */}
                <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="#1e293b" strokeDasharray="4 4" />
                <line x1={padding} y1={svgHeight/2} x2={svgWidth - padding} y2={svgHeight/2} stroke="#1e293b" strokeDasharray="4 4" />
                <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#334155" />
                
                {/* Glow connection */}
                <polyline fill="none" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="6" points={points} className="blur-sm" />
                <polyline fill="none" stroke="#6366f1" strokeWidth="3" points={points} />
                
                {/* Dots */}
                {scores.map((s, idx) => {
                  const x = padding + (idx / (scores.length - 1)) * (svgWidth - padding * 2);
                  const y = svgHeight - padding - (s.score / 100) * (svgHeight - padding * 2);
                  return (
                    <g key={idx} className="group cursor-pointer">
                      <circle cx={x} cy={y} r="5" fill="#a855f7" className="transition-all duration-150 hover:r-7" />
                      <circle cx={x} cy={y} r="2" fill="#fff" />
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
                <Clock className="h-8 w-8 opacity-45 animate-spin" />
                <span>Not enough interview sessions to generate chart (min 2 required).</span>
              </div>
            )}
          </div>
          
          {scores.length > 0 && (
            <div className="flex justify-between px-2 text-[10px] text-slate-500 font-semibold">
              <span>{scores[0].date} ({scores[0].type})</span>
              <span>Latest Session</span>
            </div>
          )}
        </div>

        {/* Competencies Breakdown */}
        <div className="glass p-6 rounded-3xl border border-slate-800/50 space-y-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Star className="h-5 w-5 text-purple-400" />
            <span>Interview Competencies</span>
          </h3>

          <div className="space-y-4">
            {data?.skills_breakdown && Object.entries(data.skills_breakdown).length > 0 ? (
              Object.entries(data.skills_breakdown).map(([skill, val]) => (
                <div key={skill} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">{skill}</span>
                    <span className="text-indigo-400">{val}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/40">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${val}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-4">
                {['Communication', 'Technical Depth', 'Tone & Presence'].map((skill) => (
                  <div key={skill} className="space-y-1.5 opacity-40">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">{skill}</span>
                      <span className="text-indigo-400">0%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden" />
                  </div>
                ))}
                <p className="text-xs text-center text-slate-500 pt-2">Complete an interview session to compute scores</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Focus Area Features Grid */}
      <div className="space-y-4">
        <h3 className="text-xl font-extrabold text-white">Focus Areas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <div 
                key={card.title}
                className="glass rounded-2xl border border-slate-800/50 p-6 flex flex-col justify-between hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-950/10 group transition-all duration-300"
              >
                <div className="space-y-3">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${card.color} border`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-white text-lg">{card.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
                </div>
                <button
                  onClick={() => navigate(card.link)}
                  className="mt-6 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-slate-800 text-slate-300 font-semibold group-hover:bg-slate-900 group-hover:text-white transition-all text-sm"
                >
                  <span>{card.action}</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
