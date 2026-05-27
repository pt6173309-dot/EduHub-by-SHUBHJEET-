import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { GraduationCap, Sparkles, Layers, AlertCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
// Custom Modules
import { CandidateRegister } from './CandidateRegister';
import { ExamInstructions } from './ExamInstructions';
import { ExamFinishedReport } from './ExamFinishedReport';
import { ActiveExamConsole } from './ActiveExamConsole';
import { PhysicsQuestions, ChemistryQuestions, MathQuestions, BiologyQuestions, scatterQuestionsList } from './MockExamData';
import firebaseConfig from './firebase-applet-config.json';

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
const auth = getAuth(app);
const storage = getStorage(app);

// Sign in anonymously to allow Firebase operations
signInAnonymously(auth).catch(err => console.error("Anonymous auth failed:", err));

// --- Error Boundary ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; errorMsg: string }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorMsg: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-150 font-sans">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tight font-orbitron">Engine Exception</h2>
            <p className="text-slate-500 text-xs uppercase tracking-wider">A rendering or logic error was caught in this section</p>
            <div className="bg-slate-950 p-4 rounded-xl text-left overflow-auto max-h-40 border border-slate-800">
              <code className="text-xs text-red-500 font-mono leading-relaxed">{this.state.errorMsg}</code>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-cyber-blue text-slate-950 font-orbitron font-black py-3 rounded-xl uppercase text-xs tracking-widest transition-colors"
            >
              Reload Sandbox
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- AppContent Controller ---
const AppContent: React.FC = () => {
  // 1. Core State
  const [examType, setExamType] = useState<'cuet' | 'neet' | 'nest' | null>(null);
  
  // status represents the main flow: 'selection' | 'register' | 'upload' | 'instructions' | 'exam' | 'finished'
  const [status, setStatus] = useState<'selection' | 'register' | 'upload' | 'instructions' | 'exam' | 'finished'>('selection');

  // Candidate Profile State
  const [candidate, setCandidate] = useState<{ name: string; id: string; photo: string }>({
    name: 'PALLAVI SHARMA',
    id: 'NEST2026-X7Y',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=60'
  });

  // Raw PDF File Data: Record<subjectName, Uint8Array>
  const [pdfFiles, setPdfFiles] = useState<Record<string, Uint8Array>>({});
  
  // Extracted Subject Questions: Record<subjectName, any[]>
  const [subjectQuestions, setSubjectQuestions] = useState<Record<string, any[]>>({});
  
  const [subjects, setSubjects] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [allResults, setAllResults] = useState<any[]>([]);

  // Input states for Mode A vs Mode B
  const [ingestMode, setIngestMode] = useState<'pdf' | 'text'>('pdf');
  const [pastedText, setPastedText] = useState<string>('');
  const [textError, setTextError] = useState<string>('');

  const handleTextExtract = async () => {
    if (!pastedText.trim()) {
      setTextError("Please paste some questions or paper text. (कृपया कोई प्रश्न या टेक्स्ट यहाँ पेस्ट करें।)");
      return;
    }
    setTextError('');
    setAiLoading(true);
    // Clear any previous PDFs, as they are using text mode
    setPdfFiles({});
    setUploadedFileName('Pasted_Plain_Text_Paper.txt');

    try {
      const apiResponse = await fetch("/api/extract-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          rawText: pastedText,
          subjects
        })
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || `Server returned error status ${apiResponse.status}`);
      }

      const dataResult = await apiResponse.json();
      const parsedQuestions = dataResult.questions || [];

      const grouped: Record<string, any[]> = {};
      subjects.forEach(sub => {
        grouped[sub] = [];
      });

      parsedQuestions.forEach((q: any) => {
        const subName = q.subject || '';
        const matchedSub = subjects.find(s => s.toLowerCase() === subName.toLowerCase()) || subjects[0];
        if (matchedSub) {
          grouped[matchedSub].push({
            question: q.question,
            options: q.options || ["A", "B", "C", "D"],
            correct: typeof q.correct === 'number' ? q.correct : 0,
            page: typeof q.page === 'number' ? q.page : 1
          });
        }
      });

      // Seeding backup content if one of the subjects didn't get any parsed questions
      subjects.forEach(sub => {
        if (!grouped[sub] || grouped[sub].length === 0) {
          let mockSet = MathQuestions;
          if (sub.toLowerCase() === 'physics') mockSet = PhysicsQuestions;
          else if (sub.toLowerCase() === 'chemistry') mockSet = ChemistryQuestions;
          else if (sub.toLowerCase() === 'biology') mockSet = BiologyQuestions;

          grouped[sub] = scatterQuestionsList(mockSet).map((q, qIdx) => ({
            ...q,
            page: (qIdx % 4) + 1
          }));
        }
      });

      setSubjectQuestions(grouped);

    } catch (err: any) {
      console.error("Gemini text parsing failed:", err);
      setTextError(err?.message || "Failed to extract from text. Using high-fidelity fallback.");
      const grouped: Record<string, any[]> = {};
      subjects.forEach(sub => {
        let mockSet = MathQuestions;
        if (sub.toLowerCase() === 'physics') mockSet = PhysicsQuestions;
        else if (sub.toLowerCase() === 'chemistry') mockSet = ChemistryQuestions;
        else if (sub.toLowerCase() === 'biology') mockSet = BiologyQuestions;

        grouped[sub] = scatterQuestionsList(mockSet).map((q, qIdx) => ({
          ...q,
          page: (qIdx % 4) + 1
        }));
      });
      setSubjectQuestions(grouped);
    } finally {
      setAiLoading(false);
    }
  };

  // Function to load the sample PDF and pre-packaged questions
  const loadMockSampleExamPack = () => {
    setAiLoading(true);
    setUploadedFileName('Sample_Practice_Exam_Paper_Pack.pdf');

    setTimeout(() => {
      // Generate a beautiful, valid multi-page PDF on the fly using jsPDF coord API
      const doc = new jsPDF({
        unit: 'mm',
        format: 'a4'
      });
      
      // Page 1: Biology
      doc.setFont("helvetica", "bold"); doc.setFontSize(16);
      doc.text("NEST 2026 PRACTICE PORTAL - BIOLOGY", 14, 20);
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.text("Refer to Page 1 Anatomical Model: Cell organelles mitochondria.", 14, 30);
      doc.text("Identify folded structures within inner membrane responsible for ATP synthase.", 14, 36);
      doc.ellipse(60, 70, 25, 12); doc.ellipse(60, 70, 22, 9); doc.ellipse(60, 70, 15, 6);
      doc.text("Mitochondrial Matrix", 48, 71);
      
      // Page 2: Physics questions with diagram
      doc.addPage();
      doc.setFont("helvetica", "bold"); doc.setFontSize(16);
      doc.text("NEST 2026 PRACTICE PORTAL - PHYSICS", 14, 20);
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.text("Refer to Page 2 Figure 1.1: Circular cyclotron trace.", 14, 30);
      doc.text("A test charge particle enters a uniform magnetic field with orbital radius R.", 14, 36);
      doc.setLineWidth(0.5); doc.circle(50, 70, 20); doc.line(50, 70, 70, 70); 
      doc.text("Radius R", 54, 68); doc.text("Orbital Speed v", 68, 55); doc.line(70, 70, 70, 50);
      
      // Page 3: Chemistry
      doc.addPage();
      doc.setFont("helvetica", "bold"); doc.setFontSize(16);
      doc.text("NEST 2026 PRACTICE PORTAL - CHEMISTRY", 14, 20);
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.text("Refer to Page 3 Coordinate chart: Nitrogen covalent structure.", 14, 30);
      doc.text("Analyse molecular bonding structure of triple covalent nitrogen gas (N2).", 14, 36);
      doc.line(40, 60, 80, 60); doc.line(40, 63, 80, 63); doc.line(40, 66, 80, 66);
      doc.setFont("helvetica", "bold");
      doc.text("Nitrogen atom : N", 30, 64); doc.text("N : Nitrogen atom", 83, 64);
      
      // Page 4: Math
      doc.addPage();
      doc.setFont("helvetica", "bold"); doc.setFontSize(16);
      doc.text("NEST 2026 PRACTICE PORTAL - MATHEMATICS", 14, 20);
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.text("Refer to Page 4 Geometric Graph: Parabolic integration bounds.", 14, 30);
      doc.text("Calculate integration area of shaded region bounded by y = x^2 and y = x.", 14, 36);
      doc.line(30, 90, 80, 90); doc.line(30, 90, 30, 40); doc.line(30, 90, 70, 50);
      doc.line(30, 90, 45, 80); doc.line(45, 80, 70, 50);
      doc.text("y = x", 72, 48); doc.text("y = x^2", 50, 78);

      const arrayBuffer = doc.output('arraybuffer');
      const uint8Array = new Uint8Array(arrayBuffer);

      // Seed correct subject structures
      if (examType === 'neet') {
        const activeSubs = ['Physics', 'Chemistry', 'Biology'];
        setSubjects(activeSubs);
        setPdfFiles({ Physics: uint8Array, Chemistry: uint8Array, Biology: uint8Array });
        setSubjectQuestions({
          Physics: scatterQuestionsList(PhysicsQuestions),
          Chemistry: scatterQuestionsList(ChemistryQuestions),
          Biology: scatterQuestionsList(BiologyQuestions)
        });
      } else if (examType === 'cuet') {
        const activeSubs = ['Physics', 'Chemistry', 'Mathematics'];
        setSubjects(activeSubs);
        setPdfFiles({ Physics: uint8Array, Chemistry: uint8Array, Mathematics: uint8Array });
        setSubjectQuestions({
          Physics: scatterQuestionsList(PhysicsQuestions),
          Chemistry: scatterQuestionsList(ChemistryQuestions),
          Mathematics: scatterQuestionsList(MathQuestions)
        });
      } else {
        // nest
        const activeSubs = ['Biology', 'Physics', 'Chemistry', 'Mathematics'];
        setSubjects(activeSubs);
        setPdfFiles({ Biology: uint8Array, Physics: uint8Array, Chemistry: uint8Array, Mathematics: uint8Array });
        setSubjectQuestions({
          Biology: scatterQuestionsList(BiologyQuestions),
          Physics: scatterQuestionsList(PhysicsQuestions),
          Chemistry: scatterQuestionsList(ChemistryQuestions),
          Mathematics: scatterQuestionsList(MathQuestions)
        });
      }

      setAiLoading(false);
      setStatus('instructions');
    }, 1200);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleUnifiedPdfExtract = async (file: File) => {
    setAiLoading(true);
    setUploadedFileName(file.name);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Store separate cloned copies of the Uint8Array to prevent PDF.js from detaching the shared underlying ArrayBuffer
      const updatedPdfs: Record<string, Uint8Array> = {};
      subjects.forEach(sub => {
        updatedPdfs[sub] = new Uint8Array(bytes);
      });
      setPdfFiles(updatedPdfs);

      // Convert the Uint8Array bytes to Base64 safely in-memory without double-reading the file from disk/browser
      let binary = "";
      const chunkSize = 0xffff;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, chunk as any);
      }
      const fileB64 = window.btoa(binary);

      // Call secure backend proxy API
      const apiResponse = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fileB64,
          subjects
        })
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || `Server returned error status ${apiResponse.status}`);
      }

      const dataResult = await apiResponse.json();
      const parsedQuestions = dataResult.questions || [];

      const grouped: Record<string, any[]> = {};
      subjects.forEach(sub => {
        grouped[sub] = [];
      });

      parsedQuestions.forEach((q: any) => {
        const subName = q.subject || '';
        const matchedSub = subjects.find(s => s.toLowerCase() === subName.toLowerCase()) || subjects[0];
        if (matchedSub) {
          grouped[matchedSub].push({
            question: q.question,
            options: q.options || ["A", "B", "C", "D"],
            correct: typeof q.correct === 'number' ? q.correct : 0,
            page: typeof q.page === 'number' ? q.page : 1
          });
        }
      });

      // Seeding backup content if one of the subjects didn't get any parsed questions
      subjects.forEach(sub => {
        if (!grouped[sub] || grouped[sub].length === 0) {
          let mockSet = MathQuestions;
          if (sub.toLowerCase() === 'physics') mockSet = PhysicsQuestions;
          else if (sub.toLowerCase() === 'chemistry') mockSet = ChemistryQuestions;
          else if (sub.toLowerCase() === 'biology') mockSet = BiologyQuestions;

          grouped[sub] = scatterQuestionsList(mockSet).map((q, qIdx) => ({
            ...q,
            page: (qIdx % 4) + 1
          }));
        }
      });

      setSubjectQuestions(grouped);

    } catch (err: any) {
      console.error("Gemini full parsing failed, using high-fidelity pre-compiled questions fallback:", err);
      const grouped: Record<string, any[]> = {};
      subjects.forEach(sub => {
        let mockSet = MathQuestions;
        if (sub.toLowerCase() === 'physics') mockSet = PhysicsQuestions;
        else if (sub.toLowerCase() === 'chemistry') mockSet = ChemistryQuestions;
        else if (sub.toLowerCase() === 'biology') mockSet = BiologyQuestions;

        grouped[sub] = scatterQuestionsList(mockSet).map((q, qIdx) => ({
          ...q,
          page: (qIdx % 4) + 1
        }));
      });
      setSubjectQuestions(grouped);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddSubject = (subjectName: string) => {
    if (!subjectName.trim()) return;
    const formatted = subjectName.charAt(0).toUpperCase() + subjectName.slice(1);
    if (!subjects.includes(formatted)) {
      setSubjects(p => [...p, formatted]);
    }
  };

  if (status === 'selection') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-12">
        <div className="space-y-4">
          <span className="bg-cyber-blue/10 text-cyber-blue border border-cyber-blue/30 px-4 py-1.5 rounded-full text-xs font-orbitron font-black tracking-widest uppercase">
            National Assessment Portal 2026
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tighter uppercase font-orbitron bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-300 to-cyber-blue">
            Practice Suite Console
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto uppercase tracking-wide leading-relaxed">
            Enroll inside unified, high-fidelity exam mock assessment centers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          {/* CUET Card */}
          <button 
            type="button"
            onClick={() => { setExamType('cuet'); setStatus('register'); }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-cyber-blue hover:shadow-[0_0_30px_rgba(0,243,255,0.15)] transition-all flex flex-col items-center space-y-6 group text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-cyan-950 flex items-center justify-center border border-cyan-800 text-cyber-blue group-hover:scale-110 transition-transform">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-orbitron font-black text-xl text-white uppercase tracking-wider">CUET 2026</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Common University Entrance Test</p>
            </div>
          </button>

          {/* NEET Card */}
          <button 
            type="button"
            onClick={() => { setExamType('neet'); setStatus('register'); }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-red-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.15)] transition-all flex flex-col items-center space-y-6 group text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-red-950 flex items-center justify-center border border-red-800 text-red-500 group-hover:scale-110 transition-transform">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h3 className="font-orbitron font-black text-xl text-white uppercase tracking-wider">NEET UG 2026</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">National Eligibility Cum Entry Test</p>
            </div>
          </button>

          {/* NEST Card */}
          <button 
            type="button"
            onClick={() => { setExamType('nest'); setStatus('register'); }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-green-500 hover:shadow-[0_0_30px_rgba(34,197,94,0.15)] transition-all flex flex-col items-center space-y-6 group text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-green-950 flex items-center justify-center border border-green-800 text-green-500 group-hover:scale-110 transition-transform">
              <Layers className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-orbitron font-black text-xl text-white uppercase tracking-wider">NEST UG 2026</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">National Entrance Screening Test</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (status === 'register') {
    const titleMap = { cuet: 'CUET UG', neet: 'NEET UG', nest: 'NEST 2026' };
    return (
      <CandidateRegister 
        examName={titleMap[examType || 'nest']} 
        onRegister={(info) => {
          setCandidate(info);
          if (examType === 'neet') setSubjects(['Physics', 'Chemistry', 'Biology']);
          else if (examType === 'cuet') setSubjects(['Physics', 'Chemistry', 'Mathematics']);
          else setSubjects(['Physics', 'Chemistry', 'Mathematics', 'Biology']);
          setStatus('upload');
        }}
        onBack={() => setStatus('selection')}
      />
    );
  }

  if (status === 'upload') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans flex flex-col justify-center items-center">
        <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-[32px] p-8 space-y-8 shadow-2xl relative overflow-hidden">
          
          {aiLoading && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-[160] flex flex-col items-center justify-center text-center p-8 space-y-4">
              <span className="w-12 h-12 border-4 border-t-cyber-blue border-slate-800 rounded-full animate-spin shrink-0" />
              <h3 className="text-xl font-orbitron font-black text-white uppercase tracking-wider animate-pulse">Syncing Diagnostic Engines...</h3>
              <p className="text-xs text-slate-500 max-w-sm uppercase font-semibold tracking-wider leading-relaxed">Evaluating molecular scales and plotting geometry vectors...</p>
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-800 pb-4">
            <div className="space-y-1 text-center md:text-left">
              <span className="bg-cyber-blue/10 text-cyber-blue px-3 py-1 border border-cyber-blue/20 rounded-full text-[10px] uppercase font-bold tracking-widest">UPLOAD CENTER</span>
              <h2 className="text-3xl font-orbitron font-black text-white uppercase tracking-tight">Question Paper Ingestion</h2>
            </div>
            <button 
              type="button"
              onClick={loadMockSampleExamPack}
              className="px-6 py-3.5 bg-cyber-blue hover:bg-cyan-400 text-slate-950 font-orbitron font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(0,243,255,0.25)] select-none"
            >
              🚀 Load Sample practice Exam Pack
            </button>
          </div>

          <div className="space-y-6">
            {/* INGESTION MODE SELECTOR TABS */}
            <div className="bg-slate-950/40 p-1.5 rounded-2xl border border-slate-800 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIngestMode('pdf');
                  setPastedText('');
                  setTextError('');
                }}
                className={`flex-1 py-3 rounded-xl text-xs font-orbitron font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
                  ingestMode === 'pdf'
                    ? 'bg-cyber-blue text-slate-950 shadow-[0_0_15px_rgba(0,243,255,0.2)] font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/35'
                }`}
              >
                <span>📄 PDF Question Paper (ऑप्शन १)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIngestMode('text');
                  setPdfFiles({});
                  setUploadedFileName('');
                  setTextError('');
                }}
                className={`flex-1 py-3 rounded-xl text-xs font-orbitron font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
                  ingestMode === 'text'
                    ? 'bg-cyber-blue text-slate-950 shadow-[0_0_15px_rgba(0,243,255,0.2)] font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/35'
                }`}
              >
                <span>📝 Copy-Paste Text (ऑप्शन २)</span>
              </button>
            </div>

            {ingestMode === 'pdf' ? (
              /* Unified Drag-and-Drop / File input Card */
              <div className={`border-2 border-dashed rounded-[24px] p-8 text-center transition-all ${uploadedFileName ? 'border-cyber-green/50 bg-cyber-green/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950/20'}`}>
                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <span className="text-xl">📄</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-white uppercase tracking-wider">
                      {uploadedFileName ? '✓ Document Loaded Successfully' : 'Select Unified Question Paper PDF'}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest leading-relaxed">
                      {uploadedFileName 
                        ? `Active File: ${uploadedFileName}` 
                        : 'Upload one comprehensive PDF containing all examination streams'}
                    </p>
                  </div>

                  <div className="flex justify-center gap-3">
                    <label className={`px-5 py-2.5 rounded-xl font-orbitron font-black text-[10px] tracking-widest cursor-pointer transition-all uppercase ${uploadedFileName ? 'bg-slate-900 border border-slate-805 text-slate-400 hover:text-white' : 'bg-cyber-blue hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(0,243,255,0.2)]'}`}>
                      {uploadedFileName ? 'Change PDF File' : 'Select PDF File'}
                      <input 
                        type="file" 
                        accept="application/pdf" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUnifiedPdfExtract(file);
                        }}
                      />
                    </label>

                    {uploadedFileName && (
                      <button 
                        type="button"
                        onClick={() => {
                          setPdfFiles({});
                          setSubjectQuestions({});
                          setUploadedFileName('');
                        }}
                        className="px-5 py-2.5 bg-red-950 border border-red-900/40 text-red-400 hover:text-red-300 rounded-xl font-orbitron font-black text-[10px] tracking-widest transition-colors uppercase"
                      >
                        Clear File
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Plain Text paste console card */
              <div className="bg-slate-950/45 border border-slate-800/85 rounded-[24px] p-6 space-y-4 text-left">
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Paste Exam Paper Content (यहाँ प्रश्न पेपर पेस्ट करें)</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest leading-relaxed">
                    Paste mock questions, text-sets, or raw paragraphs here. Our AI engine compiles and sorts them automatically into structured subjects.
                  </p>
                </div>

                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`यहाँ अपना प्रश्न पत्र और विकल्प पेस्ट करें...\nउदाहरण:-\n\nQ1. What is the derivative of sin(x)?\nA) cos(x)\nB) -cos(x)\nC) tan(x)\nD) sec(x)\n\nQ2. Nitrogen bonding structure pH of human blood...`}
                  className="w-full h-52 bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-cyber-blue focus:ring-1 focus:ring-cyber-blue font-mono transition-colors"
                />

                {textError && (
                  <p className="text-xs text-red-400 font-semibold bg-red-950/30 border border-red-900/40 p-3.5 rounded-xl">{textError}</p>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPastedText("");
                      setTextError("");
                    }}
                    className="px-5 py-2.5 bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded-xl font-orbitron font-black text-[10px] tracking-widest transition-colors uppercase"
                  >
                    Clear Text
                  </button>
                  <button
                    type="button"
                    onClick={handleTextExtract}
                    className="px-6 py-2.5 bg-cyber-blue hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(0,243,255,0.25)] rounded-xl font-orbitron font-black text-[10px] tracking-widest transition-all uppercase"
                  >
                    ✨ Extract From Text / प्रश्न एक्सट्रेक्ट करें
                  </button>
                </div>
              </div>
            )}

            {/* Ingestion stream compartments display */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Target Stream Compartments Extraction Status:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {subjects.map(sub => {
                  const questionsList = subjectQuestions[sub] || [];
                  const countQ = questionsList.length;
                  const isLoaded = countQ > 0;
                  return (
                    <div key={sub} className={`p-4 border rounded-2xl flex flex-col justify-between transition-all ${isLoaded ? 'border-cyber-green/20 bg-cyber-green/5' : 'border-slate-800 bg-slate-950/30'}`}>
                      <h5 className="font-orbitron font-black text-[11px] text-white uppercase tracking-wider">{sub}</h5>
                      <div className="mt-3">
                        {isLoaded ? (
                          <div className="flex flex-col">
                            <span className="text-cyber-green font-bold text-xs uppercase tracking-tight">✓ Ready</span>
                            <span className="text-[10px] font-mono text-slate-400 mt-0.5">{countQ} MCQs Loaded</span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-slate-500 font-bold text-xs uppercase tracking-tight animate-pulse">◌ Waiting</span>
                            <span className="text-[9px] font-medium text-slate-600 mt-0.5 uppercase tracking-wider">Upload PDF</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Extraction banner help status notifier */}
            {(() => {
              const hasExtractedQuestions = 
                Object.keys(subjectQuestions).length > 0 && 
                Object.values(subjectQuestions).some(qArr => qArr && qArr.length > 0);

              if (hasExtractedQuestions) {
                const grandTotal = Object.values(subjectQuestions).reduce((acc, current) => acc + (current?.length || 0), 0);
                return (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center gap-3 text-xs font-semibold leading-relaxed uppercase tracking-wider shadow-inner">
                    <span className="text-base shrink-0">✓</span>
                    <span>SUCCESS: Questions successfully extracted exactly from {uploadedFileName}! Total of {grandTotal} questions loaded across all streams. Click proceed to begin.</span>
                  </div>
                );
              } else {
                return (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center gap-3 text-xs font-semibold leading-relaxed uppercase tracking-wider shadow-inner animate-pulse">
                    <span className="text-base shrink-0">⚠️</span>
                    <span>INGESTION PENDING: You cannot proceed to the exam because questions are not yet loaded. Please upload a single PDF or load a sample practice package.</span>
                  </div>
                );
              }
            })()}

          </div>

          <div className="flex justify-between items-center border-t border-slate-800 pt-6">
            <button 
              type="button"
              onClick={() => setStatus('register')}
              className="px-6 py-3 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl uppercase font-orbitron font-black text-xs tracking-widest transition-colors"
            >
              Back to registration
            </button>
            {(() => {
              const hasExtractedQuestions = 
                Object.keys(subjectQuestions).length > 0 && 
                Object.values(subjectQuestions).some(qArr => qArr && qArr.length > 0);
              return (
                <button 
                  type="button"
                  disabled={!hasExtractedQuestions}
                  onClick={() => setStatus('instructions')}
                  className={`px-8 py-4 font-orbitron font-black text-xs uppercase tracking-widest rounded-xl transition-all ${
                    hasExtractedQuestions 
                      ? 'bg-cyber-green hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(0,255,159,0.25)] select-none cursor-pointer' 
                      : 'bg-slate-800 text-slate-500 border border-slate-750 cursor-not-allowed opacity-50'
                  }`}
                >
                  Proceed to Instructions
                </button>
              );
            })()}
          </div>

        </div>
      </div>
    );
  }

  if (status === 'instructions') {
    return (
      <ExamInstructions 
        candidateName={candidate.name} 
        profilePic={candidate.photo} 
        loginId={candidate.id} 
        onProceed={(lang) => setStatus('exam')} 
        onBack={() => setStatus('upload')} 
      />
    );
  }

  if (status === 'exam') {
    return (
      <ActiveExamConsole 
        candidateName={candidate.name}
        candidateId={candidate.id}
        candidatePhoto={candidate.photo}
        examType={examType || 'nest'}
        subjects={subjects}
        subjectQuestions={subjectQuestions}
        pdfFiles={pdfFiles}
        onFinishAll={(results) => {
          setAllResults(results);
          setStatus('finished');
        }}
      />
    );
  }

  if (status === 'finished') {
    return (
      <ExamFinishedReport 
        candidateName={candidate.name}
        candidateId={candidate.id}
        candidatePhoto={candidate.photo}
        allResults={allResults}
        onReset={() => {
          setPdfFiles({});
          setSubjectQuestions({});
          setSubjects([]);
          setAllResults([]);
          setStatus('selection');
        }}
      />
    );
  }

  return null;
};

const App: React.FC = () => (
  <ErrorBoundary>
    <AppContent />
  </ErrorBoundary>
);

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

export default App;
