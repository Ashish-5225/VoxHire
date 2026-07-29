import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import { 
  GitFork, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Target, 
  RefreshCw,
  ChevronRight
} from 'lucide-react';

interface RoadmapStep {
  title: string;
  description: string;
  duration: string;
  skills_to_master: string[];
  recommended_resources: string[];
}

interface RoadmapData {
  role: string;
  summary: string;
  timeline: RoadmapStep[];
}

export const Roadmap: React.FC = () => {
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const fetchRoadmap = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/v1/roadmap`);
      if (response.data && response.data.roadmap_json) {
        setRoadmap(JSON.parse(response.data.roadmap_json));
      }
    } catch (err) {
      console.error('Error fetching roadmap', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStepCompleted = (idx: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <RefreshCw className="h-10 w-10 text-indigo-400 animate-spin" />
        <p className="text-slate-400 text-sm">Synthesizing personalized study roadmap from your resume & mock history...</p>
      </div>
    );
  }

  const stepsCount = roadmap?.timeline?.length || 0;
  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercent = stepsCount > 0 ? Math.round((completedCount / stepsCount) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <GitFork className="h-8 w-8 text-amber-400" />
            <span>Personalized Learning Roadmap</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Custom career milestones tailored to your resume gaps and mock interview evaluations.
          </p>
        </div>

        <button
          onClick={fetchRoadmap}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-sm font-semibold hover:text-white hover:border-slate-700 transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Regenerate Roadmap</span>
        </button>
      </div>

      {/* Progress & Summary Banner */}
      <div className="glass-premium p-6 md:p-8 rounded-3xl border border-slate-800/80 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Target Role: {roadmap?.role || 'Senior Software Engineer'}</span>
            </div>
            <h2 className="text-xl font-bold text-white">Roadmap Strategy Overview</h2>
            <p className="text-slate-400 text-sm max-w-2xl">
              {roadmap?.summary || 'Focus on strengthening system architecture, concurrency, and behavioral STAR stories.'}
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl min-w-[200px] text-center space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-semibold">
              <span>Overall Progress</span>
              <span className="text-amber-400">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500">{completedCount} of {stepsCount} Phases Completed</p>
          </div>
        </div>
      </div>

      {/* Timeline Steps */}
      <div className="relative pl-6 md:pl-8 border-l-2 border-slate-800 space-y-8 my-6">
        {roadmap?.timeline?.map((step, idx) => {
          const isDone = !!completedSteps[idx];
          return (
            <div key={idx} className="relative group">
              {/* Timeline Bullet Node */}
              <button
                onClick={() => toggleStepCompleted(idx)}
                className={`absolute -left-[31px] md:-left-[39px] top-1.5 h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  isDone 
                    ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-900/40' 
                    : 'bg-slate-950 border-indigo-500/60 text-indigo-400 group-hover:border-indigo-400'
                }`}
              >
                {isDone ? <CheckCircle2 className="h-5 w-5 fill-current" /> : <span className="text-xs font-bold">{idx + 1}</span>}
              </button>

              {/* Step Card */}
              <div className={`glass p-6 rounded-2xl border transition-all ${
                isDone 
                  ? 'border-emerald-500/30 bg-emerald-950/10' 
                  : 'border-slate-800/80 hover:border-indigo-500/30'
              }`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-3">
                  <h3 className={`text-lg font-bold ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                    Phase {idx + 1}: {step.title}
                  </h3>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold">
                    <Clock className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Est. {step.duration || '1-2 Weeks'}</span>
                  </div>
                </div>

                <p className="text-slate-300 text-sm leading-relaxed mb-4">{step.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Skills to Master */}
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/50 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5" />
                      <span>Target Competencies</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {step.skills_to_master?.map((sk, sIdx) => (
                        <span key={sIdx} className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Resources */}
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/50 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>Study Resources</span>
                    </h4>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {step.recommended_resources?.map((res, rIdx) => (
                        <li key={rIdx} className="flex items-center gap-1.5">
                          <ChevronRight className="h-3 w-3 text-amber-400" />
                          <span>{res}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
