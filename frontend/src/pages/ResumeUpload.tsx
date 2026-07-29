import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  FileCheck, 
  Lightbulb, 
  Layers, 
  Tag, 
  RefreshCw 
} from 'lucide-react';

interface ResumeData {
  id: number;
  filename: string;
  ats_score: number;
  raw_text: string;
  analysis_json: string;
  created_at: string;
}

interface ResumeAnalysis {
  ats_score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  formatting_feedback: string[];
  keyword_suggestions: string[];
  action_verb_improvements: string[];
}

export const ResumeUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'suggestions' | 'keywords' | 'raw'>('overview');

  useEffect(() => {
    fetchLatestResume();
  }, []);

  const fetchLatestResume = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/resume/latest`);
      if (response.data) {
        setResume(response.data);
        if (response.data.analysis_json) {
          try {
            setAnalysis(JSON.parse(response.data.analysis_json));
          } catch (e) {
            console.error('Error parsing analysis json', e);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching resume', err);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf' || droppedFile.name.endsWith('.pdf')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please upload a PDF document.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload a PDF document.');
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/api/v1/resume/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResume(response.data);
      if (response.data.analysis_json) {
        setAnalysis(JSON.parse(response.data.analysis_json));
      }
      setFile(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload and analyze resume.');
    } finally {
      setUploading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 60) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <FileText className="h-8 w-8 text-indigo-400" />
            <span>ATS Resume Analyzer & Copilot</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Upload your resume PDF for instant ATS scoring, keyword gap analysis, and tailored bullet point suggestions.
          </p>
        </div>
        {resume && (
          <button 
            onClick={fetchLatestResume}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-sm hover:text-white hover:border-slate-700 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Re-sync Results</span>
          </button>
        )}
      </div>

      {/* Upload Zone */}
      <div className="glass-premium p-6 md:p-8 rounded-3xl border border-slate-800/80">
        <form onSubmit={handleUpload} className="space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 ${
              dragActive 
                ? 'border-indigo-500 bg-indigo-500/10' 
                : 'border-slate-800 hover:border-indigo-500/50 bg-slate-900/40'
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              id="resume-upload-input"
            />
            <label htmlFor="resume-upload-input" className="cursor-pointer flex flex-col items-center gap-3 w-full">
              <div className="h-16 w-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Upload className="h-8 w-8 animate-bounce-subtle" />
              </div>
              <div>
                <p className="text-base font-semibold text-white">
                  {file ? file.name : 'Click to upload or drag & drop your resume PDF'}
                </p>
                <p className="text-xs text-slate-400 mt-1">Supports PDF format up to 10MB</p>
              </div>
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {file && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={uploading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-900/30 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Analyzing Resume with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Analyze Resume Now</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Analysis Section */}
      {analysis && (
        <div className="space-y-6">
          {/* ATS Gauge Card */}
          <div className="glass p-6 md:p-8 rounded-3xl border border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-slate-800"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    stroke="currentColor"
                    strokeWidth="10"
                    className={analysis.ats_score >= 80 ? 'text-emerald-500' : analysis.ats_score >= 60 ? 'text-amber-500' : 'text-rose-500'}
                    fill="transparent"
                    strokeDasharray="326.72"
                    strokeDashoffset={326.72 - (326.72 * (analysis.ats_score || 0)) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-extrabold text-white">{analysis.ats_score}%</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">ATS Score</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className={`inline-flex px-3 py-1 rounded-full border text-xs font-semibold ${getScoreColor(analysis.ats_score)}`}>
                  {analysis.ats_score >= 80 ? 'ATS Optimized' : analysis.ats_score >= 60 ? 'Good Potential' : 'Needs Optimization'}
                </div>
                <h3 className="text-xl font-bold text-white">Resume Compatibility Summary</h3>
                <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
                  {analysis.summary || 'Your resume has been parsed and indexed into vector memory for interview customization.'}
                </p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/60 p-4 rounded-2xl space-y-2 w-full md:w-auto min-w-[220px]">
              <div className="flex justify-between text-xs text-slate-400">
                <span>File Name</span>
                <span className="text-white font-medium truncate max-w-[120px]">{resume?.filename}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Indexed Vector Chunks</span>
                <span className="text-emerald-400 font-medium">Ready</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Last Updated</span>
                <span className="text-slate-300">Just now</span>
              </div>
            </div>
          </div>

          {/* Details Navigation Tabs */}
          <div className="flex border-b border-slate-800 gap-2">
            {[
              { id: 'overview', name: 'Strengths & Gaps', icon: Layers },
              { id: 'suggestions', name: 'Formatting & Actions', icon: Lightbulb },
              { id: 'keywords', name: 'Recommended Keywords', icon: Tag },
              { id: 'raw', name: 'Extracted Resume Text', icon: FileCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass p-6 rounded-2xl border border-slate-800/50 space-y-4">
                <h4 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Key Resume Strengths</span>
                </h4>
                <ul className="space-y-2.5">
                  {analysis.strengths?.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                      <span>{item}</span>
                    </li>
                  )) || <p className="text-sm text-slate-500">No strengths data listed.</p>}
                </ul>
              </div>

              <div className="glass p-6 rounded-2xl border border-slate-800/50 space-y-4">
                <h4 className="text-lg font-bold text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Areas for Improvement</span>
                </h4>
                <ul className="space-y-2.5">
                  {analysis.weaknesses?.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-2 shrink-0" />
                      <span>{item}</span>
                    </li>
                  )) || <p className="text-sm text-slate-500">No weaknesses data listed.</p>}
                </ul>
              </div>
            </div>
          )}

          {/* Tab 2: Formatting & Action Verbs */}
          {activeTab === 'suggestions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass p-6 rounded-2xl border border-slate-800/50 space-y-4">
                <h4 className="text-lg font-bold text-purple-400 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  <span>Formatting & Structure Advice</span>
                </h4>
                <ul className="space-y-2.5">
                  {analysis.formatting_feedback?.map((item, idx) => (
                    <li key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 text-sm text-slate-300">
                      {item}
                    </li>
                  )) || <p className="text-sm text-slate-500">Formatting looks well-aligned.</p>}
                </ul>
              </div>

              <div className="glass p-6 rounded-2xl border border-slate-800/50 space-y-4">
                <h4 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  <span>Impact & Action Verb Upgrades</span>
                </h4>
                <ul className="space-y-2.5">
                  {analysis.action_verb_improvements?.map((item, idx) => (
                    <li key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 text-sm text-slate-300">
                      {item}
                    </li>
                  )) || <p className="text-sm text-slate-500">Action verbs are strong.</p>}
                </ul>
              </div>
            </div>
          )}

          {/* Tab 3: Keywords */}
          {activeTab === 'keywords' && (
            <div className="glass p-6 rounded-2xl border border-slate-800/50 space-y-4">
              <h4 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <Tag className="h-5 w-5" />
                <span>Industry Recommended Keywords to Add</span>
              </h4>
              <p className="text-slate-400 text-sm">
                Including these high-ranking domain terms and technologies will increase your resume score on ATS scanners:
              </p>
              <div className="flex flex-wrap gap-2.5 pt-2">
                {analysis.keyword_suggestions?.map((kw, idx) => (
                  <span 
                    key={idx}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-semibold text-xs flex items-center gap-1.5"
                  >
                    <span>+</span>
                    <span>{kw}</span>
                  </span>
                )) || <p className="text-sm text-slate-500">Keywords set is comprehensive.</p>}
              </div>
            </div>
          )}

          {/* Tab 4: Extracted Raw Text */}
          {activeTab === 'raw' && (
            <div className="glass p-6 rounded-2xl border border-slate-800/50 space-y-4">
              <h4 className="text-lg font-bold text-slate-200">Extracted PDF Text Preview</h4>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-900 text-slate-300 text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-96">
                {resume?.raw_text || 'No text available.'}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
