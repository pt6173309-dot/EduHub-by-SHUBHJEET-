import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, Calculator, AlertTriangle, ChevronLeft, ChevronRight, CheckCircle2, 
  Info, Layers, HelpCircle, XCircle, FileText, Sparkles, LogOut, Check,
  ZoomIn, ZoomOut, ClipboardList
} from 'lucide-react';
import { PdfPageRenderer } from './PdfPageRenderer';
import { ScientificCalculator } from './ScientificCalculator';
import { UsefulConstants } from './MockExamData';

interface ActiveExamConsoleProps {
  candidateName: string;
  candidateId: string;
  candidatePhoto: string;
  examType: 'cuet' | 'neet' | 'nest';
  subjects: string[];
  subjectQuestions: Record<string, any[]>;
  pdfFiles: Record<string, Uint8Array>;
  onFinishAll: (allResults: any[]) => void;
}

export const ActiveExamConsole: React.FC<ActiveExamConsoleProps> = ({
  candidateName, candidateId, candidatePhoto, examType, subjects, subjectQuestions, pdfFiles, onFinishAll
}) => {
  const [activeSubject, setActiveSubject] = useState(subjects[0] || 'Physics');
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  // States
  // answers: Record <subjectKey, Record <questionIdx, optionIndexString> > 
  const [answers, setAnswers] = useState<Record<string, Record<number, number>>>({});
  // statusMap: Record <subjectKey, Record <questionIdx, 'not-visited' | 'not-answered' | 'answered' | 'marked' | 'answered-marked'> >
  const [statusMap, setStatusMap] = useState<Record<string, Record<number, string>>>({});
  // omrFilled: Record <subjectKey, Record <questionIdx, boolean> >
  const [omrFilled, setOmrFilled] = useState<Record<string, Record<number, boolean>>>({});

  // Timer: 180 minutes = 10800 seconds
  const [timeLeft, setTimeLeft] = useState(180 * 60);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [pdfScale, setPdfScale] = useState(1.25);
  const hasActivePdf = !!pdfFiles[activeSubject];
  const [viewMode, setViewMode] = useState<'pdf' | 'text'>(hasActivePdf ? 'pdf' : 'text');

  // Auto-sync viewMode based on PDF availability when activeSubject changes
  useEffect(() => {
    setViewMode(pdfFiles[activeSubject] ? 'pdf' : 'text');
  }, [activeSubject, pdfFiles]);

  const [proctorLock, setProctorLock] = useState(false);
  const [proctorAttempts, setProctorAttempts] = useState(0);

  const activeQuestions = subjectQuestions[activeSubject] || [];
  const currentQuestion = activeQuestions[activeQuestionIdx] || null;

  // Track window focus/blur proctoring
  useEffect(() => {
    const handleBlur = () => {
      setProctorLock(true);
      setProctorAttempts(p => p + 1);
    };
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Timer ticker
  useEffect(() => {
    const timerId = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) {
          clearInterval(timerId);
          triggerSubmission();
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timerId);
  }, [answers, statusMap, omrFilled]);

  // Set not-answered when visiting for the first time
  useEffect(() => {
    if (activeQuestions.length === 0) return;
    setStatusMap(prevSub => {
      const subMap = prevSub[activeSubject] || {};
      if (!subMap[activeQuestionIdx]) {
        // Mark not answered
        return {
          ...prevSub,
          [activeSubject]: {
            ...subMap,
            [activeQuestionIdx]: 'not-answered'
          }
        };
      }
      return prevSub;
    });
  }, [activeQuestionIdx, activeSubject, activeQuestions]);

  const activePage = currentQuestion?.page || 1;

  // Match user selection instantly on tap/click
  const handleOptionSelect = (optIdx: number) => {
    // 1. Lock answer
    setAnswers(prevAns => ({
      ...prevAns,
      [activeSubject]: {
        ...(prevAns[activeSubject] || {}),
        [activeQuestionIdx]: optIdx
      }
    }));
    // 2. Mark as answered
    setStatusMap(prevStatus => ({
      ...prevStatus,
      [activeSubject]: {
        ...(prevStatus[activeSubject] || {}),
        [activeQuestionIdx]: 'answered'
      }
    }));
  };

  const navNext = () => {
    if (activeQuestionIdx < activeQuestions.length - 1) {
      setActiveQuestionIdx(p => p + 1);
    }
  };

  const saveResponse = () => {
    const isAns = answers[activeSubject]?.[activeQuestionIdx] !== undefined;
    setStatusMap(prevStatus => ({
      ...prevStatus,
      [activeSubject]: {
        ...(prevStatus[activeSubject] || {}),
        [activeQuestionIdx]: isAns ? 'answered' : 'not-answered'
      }
    }));
    navNext();
  };

  const markForReview = () => {
    const isAns = answers[activeSubject]?.[activeQuestionIdx] !== undefined;
    setStatusMap(prevStatus => ({
      ...prevStatus,
      [activeSubject]: {
        ...(prevStatus[activeSubject] || {}),
        [activeQuestionIdx]: isAns ? 'answered-marked' : 'marked'
      }
    }));
    navNext();
  };

  const clearResponse = () => {
    setAnswers(prevAns => {
      const copy = { ...(prevAns[activeSubject] || {}) };
      delete copy[activeQuestionIdx];
      return { ...prevAns, [activeSubject]: copy };
    });

    setStatusMap(prevStatus => ({
      ...prevStatus,
      [activeSubject]: {
        ...(prevStatus[activeSubject] || {}),
        [activeQuestionIdx]: 'not-answered'
      }
    }));
  };

  // Switch subject block
  const handleSubjectClick = (sub: string) => {
    // Switch subject and resets to first question of the subject
    setActiveSubject(sub);
    setActiveQuestionIdx(0);
  };

  const verifyAndSubmit = () => {
    const agree = window.confirm("Are you absolutely sure you want to conclude and submit your exam assessments? This will close the exam hall permanently!");
    if (agree) {
      triggerSubmission();
    }
  };

  const triggerSubmission = () => {
    // Compile final score tally
    const isNest = examType === 'nest';
    const builtResults = subjects.map(sub => {
      const qList = subjectQuestions[sub] || [];
      const subAnswers = answers[sub] || {};

      let correct = 0;
      let incorrect = 0;
      let scoreVal = 0;

      qList.forEach((q, idx) => {
        const studentAns = subAnswers[idx];
        if (studentAns === undefined) {
          // Unattempted
          scoreVal += 0;
        } else if (studentAns === q.correct) {
          correct += 1;
          if (isNest) {
            scoreVal += 2.5; // +2.5 for NEST
          } else {
            scoreVal += 5; // standard +5
          }
        } else {
          incorrect += 1;
          if (isNest) {
            scoreVal -= 0.5; // -0.5 for NEST
          } else {
            scoreVal -= 1; // standard -1
          }
        }
      });

      // For NEST, Mathematics is excluded from the candidate's active track evaluation
      // (as their user takes Biology, Physics, Chemistry track based on registration parameters)
      const isMathExcludedInNest = isNest && (sub.toLowerCase() === 'mathematics' || sub.toLowerCase() === 'maths' || sub === 'Maths' || sub === 'Mathematics');

      return {
        subject: sub,
        score: isMathExcludedInNest ? 0 : Number(Math.max(0, scoreVal).toFixed(2)),
        total: isMathExcludedInNest ? 0 : (qList.length * (isNest ? 2.5 : 5)),
        correctCount: isMathExcludedInNest ? 0 : correct,
        incorrectCount: isMathExcludedInNest ? 0 : incorrect,
        answers: subAnswers,
        questions: qList,
        isExcluded: isMathExcludedInNest
      };
    });

    onFinishAll(builtResults);
  };

  // Calculate exam status metrics for live drawers
  const getSummaryStatsAcrossAllSubjects = () => {
    let answered = 0;
    let notAnswered = 0;
    let notVisited = 0;
    let marked = 0;
    let answeredMarked = 0;

    subjects.forEach(sub => {
      const questionsList = subjectQuestions[sub] || [];
      const subStatusMap = statusMap[sub] || {};
      
      questionsList.forEach((_, idx) => {
        const stat = subStatusMap[idx];
        if (stat === 'answered') answered++;
        else if (stat === 'not-answered') notAnswered++;
        else if (stat === 'marked') marked++;
        else if (stat === 'answered-marked') answeredMarked++;
        else notVisited++; // unvisited
      });
    });

    const total = answered + notAnswered + notVisited + marked + answeredMarked;
    return { answered, notAnswered, notVisited, marked, answeredMarked, total };
  };

  const getSummaryStatsForActiveSubject = () => {
    let answered = 0;
    let notAnswered = 0;
    let notVisited = 0;
    let marked = 0;
    let answeredMarked = 0;

    const questionsList = subjectQuestions[activeSubject] || [];
    const subStatusMap = statusMap[activeSubject] || {};
    
    questionsList.forEach((_, idx) => {
      const stat = subStatusMap[idx];
      if (stat === 'answered') answered++;
      else if (stat === 'not-answered') notAnswered++;
      else if (stat === 'marked') marked++;
      else if (stat === 'answered-marked') answeredMarked++;
      else notVisited++;
    });

    const total = questionsList.length;
    return { answered, notAnswered, notVisited, marked, answeredMarked, total };
  };

  // Clock format
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none relative" id="exam-dashboard">
      
      {/* Proctor key Lock Panel overlay */}
      {proctorLock && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-red-500/25 p-8 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
            <h3 className="text-xl font-orbitron font-black text-white uppercase">Proctor Violation</h3>
            <p className="text-xs text-slate-400">Window defocus/switch action detected. This activity blocks your terminal under examination center rules.</p>
            <div className="bg-red-500/10 border border-red-500/20 py-2 rounded-lg font-mono text-[10px] text-red-400 font-bold uppercase">
              Violation Tally Score: {proctorAttempts}
            </div>
            <button 
              onClick={() => setProctorLock(false)}
              className="w-full bg-red-600 hover:bg-red-500 py-3 rounded-xl font-orbitron font-black uppercase text-xs tracking-widest text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]"
            >
              Resume Test
            </button>
          </div>
        </div>
      )}

      {/* DRAGGABLE SCIENTIFIC CALCULATOR CONTAINER */}
      {showCalculator && (
        <ScientificCalculator onClose={() => setShowCalculator(false)} />
      )}

      {/* Top Section / Header bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <span className="font-orbitron font-black text-xs text-cyber-blue tracking-widest bg-cyber-blue/10 px-3 py-1.5 rounded-lg border border-cyber-blue/25">
            {examType === 'nest' ? 'NEST UG 2026 PRACTICE' : `${examType.toUpperCase()} 2026 PRACTICE`}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer element */}
          <div className="bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl flex items-center gap-3 text-red-400 animate-pulse font-mono font-bold text-sm shadow-inner shrink-0">
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button 
            onClick={() => setShowCalculator(!showCalculator)}
            className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl transition-colors tooltip flex items-center justify-center shrink-0"
            title="Scientific Calculator"
          >
            <Calculator className="w-5 h-5" />
          </button>

          {/* Dynamic Zoom Controls */}
          <button 
            onClick={() => setPdfScale(prev => Math.min(2.5, prev + 0.15))}
            className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl transition-colors tooltip flex items-center justify-center shrink-0"
            title="Zoom In (उच्च रिज़ॉल्यूशन)"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          <button 
            onClick={() => setPdfScale(prev => Math.max(0.75, prev - 0.15))}
            className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl transition-colors tooltip flex items-center justify-center shrink-0"
            title="Zoom Out (कम रिज़ॉल्यूशन)"
          >
            <ZoomOut className="w-5 h-5" />
          </button>

          {/* Exam status summary report trigger */}
          <button 
            onClick={() => setShowSummary(!showSummary)}
            className={`p-2.5 rounded-xl border transition-all flex items-center justify-center tooltip shrink-0 ${showSummary ? 'bg-cyber-blue border-cyber-blue text-slate-950 shadow-[0_0_12px_rgba(0,243,255,0.4)] font-bold' : 'bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'}`}
            title="Exam Status summary breakdown panel"
          >
            <ClipboardList className="w-5 h-5" />
          </button>

          <button
            onClick={verifyAndSubmit}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 font-orbitron font-black text-xs text-white uppercase tracking-widest rounded-xl transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)] shrink-0"
          >
            Submit Exam
          </button>
        </div>
      </div>

      {/* Sub-Header Category Tabs Section (Always visible, responsive) */}
      <div className="bg-slate-950 border-b border-slate-900 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-inner shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          {subjects.map(sub => {
            const isActive = activeSubject === sub;
            const isMathExcl = examType === 'nest' && (sub.toLowerCase() === 'mathematics' || sub.toLowerCase() === 'maths' || sub === 'Maths' || sub === 'Mathematics');
            
            return (
              <button
                key={sub}
                onClick={() => handleSubjectClick(sub)}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl border text-xs font-orbitron font-black tracking-wider transition-all active:scale-95 ${
                  isActive 
                    ? 'bg-cyber-blue border-cyber-blue text-slate-950 shadow-[0_0_15px_rgba(0,243,255,0.4)] scale-105' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <span>{sub.toUpperCase()}</span>
                {isMathExcl && (
                  <span className="text-[8px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded uppercase font-black tracking-widest font-sans">
                    Optional Track
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {examType === 'nest' && (
          <div className="text-[10px] font-semibold text-cyber-blue flex items-center gap-2 bg-cyber-blue/5 border border-cyber-blue/15 px-3 py-1.5 rounded-xl uppercase tracking-widest leading-none">
            <span className="w-2 h-2 rounded-full bg-cyber-blue animate-pulse shrink-0" />
            <span>Target Track: PCB Stream (Biology, Physics, Chemistry Evaluated)</span>
          </div>
        )}
      </div>

      {/* Exam Status Summary collapsible drawer */}
      {showSummary && (() => {
        const globalStats = getSummaryStatsAcrossAllSubjects();
        const activeStats = getSummaryStatsForActiveSubject();

        return (
          <div className="fixed right-6 top-20 bg-slate-900/95 backdrop-blur-md border border-slate-800 p-5 rounded-2xl w-80 max-h-[75vh] overflow-y-auto shadow-2xl z-[120] text-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-cyber-blue" />
                <h4 className="font-orbitron font-black text-xs text-cyber-blue uppercase tracking-widest">Exam Status Summary</h4>
              </div>
              <button onClick={() => setShowSummary(false)} className="text-slate-400 hover:text-white text-xs bg-slate-800 px-2 py-1 rounded">Close</button>
            </div>

            {/* Active Subject Stats */}
            <div className="space-y-2">
              <h5 className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">Active Stream: {activeSubject.toUpperCase()}</h5>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-950/40 p-2 border border-slate-800/60 rounded-xl flex flex-col">
                  <span className="text-slate-400 text-[9px] uppercase font-bold">Answered</span>
                  <span className="text-cyber-green font-mono font-bold text-base">{activeStats.answered} / {activeStats.total}</span>
                </div>
                <div className="bg-slate-950/40 p-2 border border-slate-800/60 rounded-xl flex flex-col">
                  <span className="text-slate-400 text-[9px] uppercase font-bold">Not Answered</span>
                  <span className="text-red-400 font-mono font-bold text-base">{activeStats.notAnswered}</span>
                </div>
                <div className="bg-slate-950/40 p-2 border border-slate-800/60 rounded-xl flex flex-col">
                  <span className="text-slate-400 text-[9px] uppercase font-bold">Marked Review</span>
                  <span className="text-blue-400 font-mono font-bold text-base">{activeStats.marked}</span>
                </div>
                <div className="bg-slate-950/40 p-2 border border-slate-800/60 rounded-xl flex flex-col">
                  <span className="text-slate-400 text-[9px] uppercase font-bold">Not Visited</span>
                  <span className="text-slate-500 font-mono font-bold text-base">{activeStats.notVisited}</span>
                </div>
              </div>
            </div>

            {/* Total Exam Tracker (HINDI / ENGLISH TALLY) */}
            <div className="border-t border-slate-800 pt-3 space-y-3">
              <h5 className="font-bold text-[10px] text-cyber-blue uppercase tracking-wider">All Subjects Grand Tally</h5>
              
              <div className="space-y-2">
                {/* 1. Answered */}
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-green-500 text-white rounded-t-xl rounded-b-sm flex items-center justify-center font-bold text-[10px]">✔</span>
                    <span className="text-[11px] font-semibold text-slate-300">Answered (अटेम्प्ट किए हुए)</span>
                  </div>
                  <span className="font-mono font-black text-xs text-green-400">{globalStats.answered}</span>
                </div>

                {/* 2. Not Answered */}
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-red-500 text-white rounded-b-xl rounded-t-sm flex items-center justify-center font-bold text-[10px]">✏</span>
                    <span className="text-[11px] font-semibold text-slate-300">Not Answered (अटेम्प्ट नहीं किया)</span>
                  </div>
                  <span className="font-mono font-black text-xs text-red-400">{globalStats.notAnswered}</span>
                </div>

                {/* 3. Marked for Review */}
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-[10px]">?</span>
                    <span className="text-[11px] font-semibold text-slate-300">Marked for Review (समीक्षा)</span>
                  </div>
                  <span className="font-mono font-black text-xs text-blue-400">{globalStats.marked}</span>
                </div>

                {/* 4. Answered and Marked for Review */}
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-[10px]">✔?</span>
                    <span className="text-[11px] font-semibold text-slate-300">Answered & Marked (बचत व समीक्षा)</span>
                  </div>
                  <span className="font-mono font-black text-xs text-indigo-400">{globalStats.answeredMarked}</span>
                </div>

                {/* 5. Not Visited */}
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-slate-950 border border-slate-850 text-slate-400 flex items-center justify-center font-bold text-[10px]">◌</span>
                    <span className="text-[11px] font-semibold text-slate-300">Not Visited (देखा नहीं गया)</span>
                  </div>
                  <span className="font-mono font-black text-xs text-slate-500">{globalStats.notVisited}</span>
                </div>
              </div>

              <div className="bg-cyber-blue/10 border border-cyber-blue/20 p-2.5 rounded-xl font-mono text-[10px] text-cyber-blue text-center uppercase tracking-wider font-bold">
                Total Exam questions: {globalStats.total}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Main Splitscreen Engine */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* LEFT COMPONENT: ORIGINAL EXAM PDF / CLEAN DIGITAL TEXT VIEWER */}
        <div className="flex-1 border-r border-slate-900 flex flex-col overflow-hidden bg-slate-950">
          
          {/* Sub-header inside pdf panel with toggle controls */}
          <div className="bg-slate-900/60 border-b border-slate-950 px-6 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 bg-cyber-blue/10 text-cyber-blue border border-cyber-blue/30 rounded flex items-center justify-center font-bold text-xs">Q</span>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Question {activeQuestionIdx + 1} of {activeQuestions.length} — Page {activePage}
              </h3>
            </div>

            {/* View Mode Switcher */}
            {hasActivePdf ? (
              <div className="bg-slate-950 border border-slate-800 p-1 rounded-xl flex">
                <button 
                  onClick={() => setViewMode('pdf')}
                  className={`px-3 py-1 rounded-lg text-[10px] tracking-wider uppercase font-bold transition-all ${viewMode === 'pdf' ? 'bg-cyber-blue text-slate-950' : 'text-slate-400 hover:text-white'}`}
                >
                  📄 High-Res PDF
                </button>
                <button 
                  onClick={() => setViewMode('text')}
                  className={`px-3 py-1 rounded-lg text-[10px] tracking-wider uppercase font-bold transition-all ${viewMode === 'text' ? 'bg-cyber-blue text-slate-950' : 'text-slate-400 hover:text-white'}`}
                >
                  📝 Extracted Text
                </button>
              </div>
            ) : (
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl text-[10px] uppercase font-bold tracking-wider">
                📝 Digital Exam Text (डिजिटल टेक्स्ट मोड)
              </span>
            )}
          </div>

          {/* Renders corresponding mode */}
          <div className="flex-1 p-6 overflow-hidden relative flex flex-col justify-center">
            {viewMode === 'pdf' ? (
              <div className="w-full h-full overflow-hidden" id="pdf-container-element">
                <PdfPageRenderer 
                  pdfData={pdfFiles[activeSubject] || null} 
                  pageNumber={activePage} 
                  scale={pdfScale}
                />
              </div>
            ) : (
              <div className="max-w-xl mx-auto bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-inner text-center">
                <span className="bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue px-3 py-1 rounded-full text-[9px] uppercase tracking-widest font-black">AI OCR Transcript</span>
                <p className="text-slate-200 text-sm md:text-base leading-relaxed tracking-tight font-medium">
                  {currentQuestion?.question}
                </p>
                <div className="border-t border-slate-800 pt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Refer directly to page {activePage} of the original PDF sheet to view visual layout models.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COMPONENT: INTERACTIVE OMR PAD & palette */}
        <div className="w-full lg:w-96 bg-slate-900 flex flex-col overflow-y-auto border-t lg:border-t-0 border-slate-800">
          
          {/* Candidate miniature file panel */}
          <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-cyber-blue shrink-0">
                <img src={candidatePhoto} alt="Candidate Profile Mini" className="w-full h-full object-cover" />
              </div>
              <div className="leading-tight">
                <h4 className="text-[11px] font-orbitron font-black text-cyber-blue uppercase tracking-wider">{candidateName}</h4>
                <p className="text-[9px] text-slate-500 font-mono">ID: {candidateId}</p>
              </div>
            </div>
            <div className="bg-slate-900 px-2 py-1 rounded text-[9px] font-semibold text-cyber-green border border-cyber-green/10 uppercase">
              ONLINE LAB ASSIGNED
            </div>
          </div>

          <div className="p-6 flex-1 space-y-6">
            
            {/* OMR Selector and Options list */}
            {currentQuestion ? (
              <div className="space-y-4">
                <h4 className="block text-xs font-black uppercase text-slate-400 tracking-wider">Choose Correct Option (Click to select/tick):</h4>
                
                <div className="space-y-3">
                  {currentQuestion.options.map((opt: string, optIdx: number) => {
                    const isSelectedIdx = answers[activeSubject]?.[activeQuestionIdx] === optIdx;
                    
                    let bubbleColor = "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700";
                    if (isSelectedIdx) {
                      bubbleColor = "bg-cyber-green text-slate-950 border-cyber-green shadow-[0_0_10px_rgba(0,255,159,0.3)]";
                    }

                    return (
                      <button 
                        key={optIdx}
                        onClick={() => handleOptionSelect(optIdx)}
                        className={`w-full flex items-center text-left gap-4 bg-slate-950/40 p-4 border rounded-2xl transition-all cursor-pointer ${isSelectedIdx ? 'border-cyber-green/50 bg-cyber-green/5 ring-1 ring-cyber-green/30' : 'border-slate-800 hover:border-slate-750 hover:bg-slate-900/20'}`}
                      >
                        {/* Custom digital checking circle */}
                        <div 
                          className={`w-9 h-9 rounded-full border-2 shrink-0 flex items-center justify-center font-bold text-sm tracking-none transition-all ${bubbleColor}`}
                        >
                          {isSelectedIdx ? (
                            <Check className="w-5 h-5 stroke-[3]" />
                          ) : (
                            <span className="uppercase font-mono">{String.fromCharCode(65 + optIdx)}</span>
                          )}
                        </div>

                        {/* Text option */}
                        <div className="flex-1">
                          <p className={`text-xs font-medium leading-relaxed uppercase tracking-tight ${isSelectedIdx ? 'text-cyber-green font-bold' : 'text-slate-300'}`}>{opt}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-slate-500 font-orbitron font-extrabold text-xs tracking-wider uppercase text-center py-10">No questions loaded.</div>
            )}

            {/* TCS Navigation items action controls */}
            <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-6">
              <button 
                onClick={saveResponse}
                className="py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold uppercase text-[10px] tracking-widest text-white transition-all shadow-[0_5px_10px_rgba(34,197,94,0.15)] active:scale-95"
              >
                Save & Next
              </button>
              <button 
                onClick={markForReview}
                className="py-3 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/20 rounded-xl font-bold uppercase text-[10px] tracking-widest text-white transition-all shadow-[0_5px_10px_rgba(79,70,229,0.15)] active:scale-95"
              >
                Mark For Review
              </button>
              <button 
                onClick={clearResponse}
                className="py-3 bg-slate-950 hover:bg-slate-800 rounded-xl font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-white border border-slate-800 transition-all active:scale-95"
              >
                Clear Response
              </button>
              <button 
                onClick={() => {
                  if (activeQuestionIdx > 0) setActiveQuestionIdx(p => p - 1);
                }}
                disabled={activeQuestionIdx === 0}
                className={`py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest border transition-all ${activeQuestionIdx === 0 ? 'opacity-40 border-slate-950 text-slate-600 cursor-not-allowed' : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800 active:scale-95'}`}
              >
                Previous
              </button>
            </div>

            {/* Questions List Map Palette Grid */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="block text-xs font-black uppercase text-slate-400 tracking-wider">Question Navigation Palette Map:</h4>
              <div className="grid grid-cols-5 gap-2.5 max-h-[160px] overflow-y-auto custom-scrollbar p-1">
                {activeQuestions.map((_, idx) => {
                  const stat = statusMap[activeSubject]?.[idx] || 'not-visited';
                  const isCur = activeQuestionIdx === idx;

                  let shapeStyle = "border-slate-800 bg-slate-950 text-slate-400";
                  if (stat === 'answered') {
                    shapeStyle = "bg-green-500 text-white border-green-400 rounded-t-xl rounded-b-sm shadow-md";
                  } else if (stat === 'not-answered') {
                    shapeStyle = "bg-red-500 text-white border-red-400 rounded-b-xl rounded-t-sm shadow-md";
                  } else if (stat === 'marked') {
                    shapeStyle = "bg-blue-600 text-white border-blue-500 rounded-full shadow-md";
                  } else if (stat === 'answered-marked') {
                    shapeStyle = "bg-indigo-600 text-white border-indigo-500 rounded-full shadow-md relative";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveQuestionIdx(idx)}
                      className={`h-10 text-xs font-black font-mono border-2 transition-all flex items-center justify-center relative ${shapeStyle} ${isCur ? 'ring-2 ring-cyber-blue ring-offset-2 ring-offset-slate-900 border-cyber-blue scale-110' : 'hover:scale-105'}`}
                    >
                      {idx + 1}
                      {stat === 'answered-marked' && (
                        <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-slate-900 text-[6px] text-slate-900 flex items-center justify-center leading-none">✔</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
