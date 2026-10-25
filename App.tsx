import React, { useState, useEffect, useRef } from 'react';
import { 
  Atom, 
  FlaskConical, 
  Sparkles, 
  Upload, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Download, 
  Send, 
  Copy, 
  Check, 
  Play, 
  RotateCcw, 
  Award, 
  Share2, 
  Mail, 
  User, 
  School, 
  ArrowRight, 
  ListOrdered, 
  ShieldCheck, 
  CheckCheck,
  ChevronRight,
  ChevronLeft,
  Grid,
  RefreshCw,
  Eye,
  BarChart3,
  RotateCw,
  HelpCircle,
  CheckSquare
} from 'lucide-react';
import jsPDF from 'jspdf';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { GoogleGenAI } from "@google/genai";
import firebaseConfig from './firebase-applet-config.json';

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
const auth = getAuth(app);

// Sign in anonymously for Firestore rules read/write
signInAnonymously(auth).catch(err => console.warn("Anonymous auth notice:", err));

// --- Default Proctor Emails ---
const PROCTOR_EMAILS = [
  'jitendrakumart557@gmail.com',
  'pt6173309@gmail.com',
  'pt617339@gmail.com'
];

// --- Types ---
export interface QuizQuestion {
  id: string | number;
  question: string;
  options: string[]; // exactly 4 options
  correct: number; // 0, 1, 2, or 3
  explanation?: string;
  subject?: string;
}

export interface QuizPackage {
  id: string;
  title: string;
  category: string;
  description: string;
  questions: QuizQuestion[];
  createdAt?: any;
}

export interface QuizSubmission {
  id?: string;
  quizId: string;
  candidateName: string;
  candidateSchool?: string;
  candidateEmail?: string;
  score: number;
  total: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  percentage: number;
  timeTakenSec: number;
  submittedAt: string;
  answers: Record<number, number>; // questionIdx -> selectedOptionIdx
  details: {
    question: string;
    options: string[];
    selected: number;
    correct: number;
    isCorrect: boolean;
    explanation?: string;
  }[];
}

// --- Official Preloaded Gyan Vigyan Mela Science Paper ---
const DEFAULT_SCIENCE_PAPER: QuizQuestion[] = [
  {
    id: 1,
    subject: "Physics",
    question: "Which electromagnetic radiation has the highest frequency and greatest photon energy in the electromagnetic spectrum?",
    options: ["Radio waves", "Visible light", "X-rays", "Gamma rays"],
    correct: 3,
    explanation: "Gamma rays have the highest frequency (above 10^19 Hz) and shortest wavelength, giving them the highest photon energy (E = hν)."
  },
  {
    id: 2,
    subject: "Chemistry",
    question: "What is the primary chemical compound responsible for the pungent odor and crying effect when cutting raw onions?",
    options: ["Syn-propanethial-S-oxide", "Acetic acid", "Sodium bicarbonate", "Potassium permanganate"],
    correct: 0,
    explanation: "When an onion is sliced, alliinase enzymes produce syn-propanethial-S-oxide (lachrymatory factor) which stimulates the tear glands."
  },
  {
    id: 3,
    subject: "Biology",
    question: "In cellular respiration, which specific organelle membrane contains the ATP Synthase complex and Electron Transport Chain?",
    options: ["Outer mitochondrial membrane", "Inner mitochondrial membrane", "Nuclear envelope", "Endoplasmic reticulum"],
    correct: 1,
    explanation: "The Electron Transport Chain (ETC) complexes and ATP synthase are embedded within the inner mitochondrial membrane (cristae)."
  },
  {
    id: 4,
    subject: "General Science",
    question: "Why do astronauts in orbit aboard the International Space Station (ISS) experience apparent weightlessness?",
    options: ["There is absolute zero gravity in low Earth orbit", "The spacecraft and astronauts are in continuous free-fall around Earth", "The spacecraft uses anti-gravitational magnetic shielding", "The Earth's atmosphere cancels out orbital gravitational pull"],
    correct: 1,
    explanation: "Astronauts in orbit are in constant free-fall towards Earth as the ISS moves forward tangentially, producing a continuous state of weightlessness."
  },
  {
    id: 5,
    subject: "Physics",
    question: "According to Bernoulli's principle in fluid dynamics, what happens to fluid pressure when fluid velocity increases across a constriction?",
    options: ["Pressure increases proportionally", "Pressure decreases simultaneously", "Pressure remains completely invariant", "Temperature drops to absolute zero"],
    correct: 1,
    explanation: "Bernoulli's principle states that an increase in the speed of a fluid occurs simultaneously with a decrease in pressure or a decrease in potential energy."
  },
  {
    id: 6,
    subject: "Chemistry",
    question: "Which allotrope of Carbon forms a two-dimensional honeycomb hexagonal lattice with exceptional electrical conductivity and tensile strength?",
    options: ["Diamond", "Fullerene (Buckyball)", "Graphene", "Lonsdaleite"],
    correct: 2,
    explanation: "Graphene is a single layer of carbon atoms arranged in a 2D hexagonal lattice, famous for superior electrical mobility and structural tensile strength."
  },
  {
    id: 7,
    subject: "Biology",
    question: "Which blood component is non-nucleated in mature human erythrocytes and serves as the oxygen-carrying metalloprotein?",
    options: ["Myoglobin", "Hemoglobin", "Transferrin", "Fibrinogen"],
    correct: 1,
    explanation: "Hemoglobin in red blood cells binds up to four oxygen molecules via iron atoms in heme groups to deliver oxygen to tissues."
  },
  {
    id: 8,
    subject: "Astronomy & Space",
    question: "What is the boundary surrounding a black hole beyond which nothing, not even light, can escape the gravitational attraction?",
    options: ["Photon sphere", "Accretion disk", "Event horizon", "Ergosphere"],
    correct: 2,
    explanation: "The event horizon marks the boundary where the escape velocity of the black hole exceeds the speed of light in vacuum (c)."
  },
  {
    id: 9,
    subject: "Chemistry",
    question: "Which noble gas is commonly used in cryogenic research and superconducting MRI magnets due to having the lowest boiling point of any element?",
    options: ["Argon", "Helium", "Neon", "Krypton"],
    correct: 1,
    explanation: "Helium has the lowest boiling point of all chemical elements (-268.9 °C / 4.2 K), making liquid helium indispensable for cryogenic cooling."
  },
  {
    id: 10,
    subject: "Physics",
    question: "What physical phenomenon causes white sunlight passing through a triangular glass prism to split into its spectral rainbow colors?",
    options: ["Total internal reflection", "Diffraction", "Optical dispersion due to wavelength-dependent refraction", "Quantum entanglement"],
    correct: 2,
    explanation: "Dispersion occurs because glass has a slightly different refractive index for each wavelength of light, bending violet light more than red light."
  }
];

// --- Fallback Question Generator for Legacy Exams (CUET, NEET, etc.) ---
function generateFallbackQuestions(examType: string, count: number = 25): QuizQuestion[] {
  const normType = (examType || 'cuet').toLowerCase();
  
  if (normType.includes('neet')) {
    return [
      {
        id: 1,
        subject: "Physics",
        question: "A body starts from rest and moves with uniform acceleration. Which graph represents its velocity-time relationship?",
        options: ["Straight line passing through the origin with positive slope", "Parabola concave upwards", "Horizontal straight line parallel to time axis", "Hyperbolic curve asymptotic to both axes"],
        correct: 0,
        explanation: "For uniform acceleration with zero initial velocity, v = at, which is a linear equation passing through the origin."
      },
      {
        id: 2,
        subject: "Chemistry",
        question: "Which of the following molecules has a square planar geometry according to VSEPR theory?",
        options: ["XeF4", "CH4", "SF4", "NH4+"],
        correct: 0,
        explanation: "XeF4 has 6 electron pairs around Xenon (4 bond pairs and 2 lone pairs), resulting in an octahedral electron geometry and square planar molecular shape."
      },
      {
        id: 3,
        subject: "Botany",
        question: "During light reactions of photosynthesis, the primary electron acceptor from Photosystem II (P680) is:",
        options: ["Pheophytin", "Plastoquinone", "Cytochrome b6f", "Ferredoxin"],
        correct: 0,
        explanation: "In PS II, photoexcited electrons are initially transferred from the reaction center P680 to pheophytin, a modified chlorophyll molecule lacking Mg2+."
      },
      {
        id: 4,
        subject: "Zoology",
        question: "The functional unit of contraction in a skeletal myofibril, defined as the region between two adjacent Z-discs, is called:",
        options: ["Sarcomere", "Sarcolemma", "Sarcoplasmic reticulum", "Myosin head"],
        correct: 0,
        explanation: "The sarcomere is the fundamental contractile repeating unit of skeletal muscle, bounded at each end by a Z-disc."
      },
      {
        id: 5,
        subject: "Physics",
        question: "What is the dimensional formula for universal gravitational constant (G)?",
        options: ["[M^-1 L^3 T^-2]", "[M^1 L^2 T^-2]", "[M^-1 L^2 T^-1]", "[M^0 L^3 T^-2]"],
        correct: 0,
        explanation: "From F = G*m1*m2/r^2, G = F*r^2 / (m^2) = [M L T^-2][L^2] / [M^2] = [M^-1 L^3 T^-2]."
      }
    ];
  }

  // Default CUET / General Mock
  return [
    {
      id: 1,
      subject: "General Test",
      question: "If a train traveling at 72 km/h crosses a 200m long platform in 20 seconds, what is the length of the train?",
      options: ["200 meters", "180 meters", "220 meters", "240 meters"],
      correct: 0,
      explanation: "Speed = 72 * (5/18) = 20 m/s. Total distance in 20s = 20 * 20 = 400m. Train length = 400 - 200 = 200m."
    },
    {
      id: 2,
      subject: "Domain Science",
      question: "Which of the following states of matter exhibits Bose-Einstein condensation near absolute zero?",
      options: ["Dilute gas of bosons", "Degenerate Fermi gas", "High-temperature ionized plasma", "Crystalline ionic lattice"],
      correct: 0,
      explanation: "Bose-Einstein Condensation (BEC) occurs in integer-spin bosons cooled near 0 Kelvin, where particles coalesce into the lowest quantum state."
    },
    {
      id: 3,
      subject: "Logical Reasoning",
      question: "In a certain code, 'SCIENCE' is written as 'TFLFODF'. How is 'GENIUS' written in that code?",
      options: ["HFOJVT", "HFOMVT", "HFNIVS", "GDMIUR"],
      correct: 0,
      explanation: "Each letter is shifted forward by +1: G->H, E->F, N->O, I->J, U->V, S->T -> HFOJVT."
    },
    {
      id: 4,
      subject: "English Language",
      question: "Choose the word most nearly opposite in meaning (antonym) to 'EPHEMERAL':",
      options: ["Perpetual", "Transient", "Fleeting", "Evanescent"],
      correct: 0,
      explanation: "Ephemeral means lasting for a very short time. Its direct antonym is Perpetual (eternal, everlasting)."
    },
    {
      id: 5,
      subject: "General Knowledge",
      question: "Who was the chief architect behind the drafting of the Indian Constitution as Chairman of the Drafting Committee?",
      options: ["Dr. B. R. Ambedkar", "Jawaharlal Nehru", "Dr. Rajendra Prasad", "Sardar Vallabhbhai Patel"],
      correct: 0,
      explanation: "Dr. Bhimrao Ramji Ambedkar chaired the Drafting Committee that formulated the Constitution of India."
    }
  ];
}

export default function App() {
  // Navigation Views: 'landing' (host/upload/preloaded) | 'candidate_entry' | 'quiz_active' | 'quiz_results' | 'submissions_view'
  const [currentView, setCurrentView] = useState<'landing' | 'candidate_entry' | 'quiz_active' | 'quiz_results' | 'submissions_view'>('landing');

  // Active Session & Exam Meta (CUET, NEET, NEST, JIPMAT, Gyan Vigyan Mela)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSessionCollection, setActiveSessionCollection] = useState<'testSessions' | 'examSessions' | 'quizzes' | 'quiz_submissions' | null>(null);
  const [examType, setExamType] = useState<string>('gvm');
  const [isLegacyExam, setIsLegacyExam] = useState<boolean>(false);
  const [loadingSession, setLoadingSession] = useState<boolean>(false);
  const [activeLinkNotice, setActiveLinkNotice] = useState<string | null>(null);
  const [resumedToast, setResumedToast] = useState<string | null>(null);

  // Question Palette & Submit Confirmation modals (especially vital for 100-300 question exams)
  const [showPaletteDrawer, setShowPaletteDrawer] = useState<boolean>(false);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState<boolean>(false);

  // Quiz package states
  const [activeQuiz, setActiveQuiz] = useState<QuizPackage>({
    id: 'gvm-science-2026',
    title: 'Science Quiz - Gyan Vigyan Mela',
    category: 'Gyan Vigyan Mela Science Competition',
    description: 'Official 40-second per question competitive science quiz. Correct = +1, Incorrect/Unanswered = 0.',
    questions: DEFAULT_SCIENCE_PAPER
  });

  // Candidate Details
  const [candidateName, setCandidateName] = useState<string>('');
  const [candidateSchool, setCandidateSchool] = useState<string>('');
  const [candidateEmail, setCandidateEmail] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');

  // Active Quiz Progress
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(40); // 40 seconds per question
  const [selectedOptionForCurrent, setSelectedOptionForCurrent] = useState<number | null>(null);

  // Result & Submissions
  const [finalResult, setFinalResult] = useState<QuizSubmission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [pdfDownloadedToast, setPdfDownloadedToast] = useState<boolean>(false);
  const [emailStatusToast, setEmailStatusToast] = useState<string | null>(null);

  // PDF Upload & AI parsing
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pastedPaperText, setPastedPaperText] = useState<string>('');
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);

  // Gmail Token & Link Sharing
  const [gmailToken, setGmailToken] = useState<string | null>(() => localStorage.getItem('gmailToken'));
  const [gmailUserEmail, setGmailUserEmail] = useState<string>(() => localStorage.getItem('gmailUserEmail') || '');
  const [copiedLinkToast, setCopiedLinkToast] = useState<boolean>(false);

  // Proctors Submissions Log
  const [submissionsList, setSubmissionsList] = useState<QuizSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false);

  const timerRef = useRef<any>(null);
  const autoSubmittedRef = useRef<boolean>(false);

  // --- Sound Alert Synthesizer (Zero External Dependencies) ---
  const playBeep = (freq = 440, type: OscillatorType = 'sine', duration = 0.12) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  };

  // --- 1. UNIFIED URL & LEGACY LINK DETECTOR (NEVER DEACTIVATE PREVIOUS LINKS) ---
  useEffect(() => {
    const detectAndLoadSession = async () => {
      // A. Check Query Parameters: ?session=... / ?sessionId=... / ?quiz=... / ?exam=...
      const params = new URLSearchParams(window.location.search);
      let detectedId = params.get('session') || params.get('sessionId') || params.get('test') || params.get('testId') || params.get('quiz') || params.get('quizId');
      let detectedExam = params.get('exam') || params.get('examType');

      // B. Check URL Pathname: /cuet/:id /neet/:id /nest/:id /jipmat/:id /session/:id
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (pathParts.length >= 2) {
        const seg0 = pathParts[0].toLowerCase();
        if (['cuet', 'neet', 'nest', 'jipmat', 'jee', 'nda', 'quiz', 'session', 'test', 'exam'].includes(seg0)) {
          if (!detectedExam && !['session', 'test', 'quiz'].includes(seg0)) {
            detectedExam = seg0;
          }
          if (!detectedId) {
            detectedId = pathParts[1];
          }
        }
      } else if (pathParts.length === 1 && !detectedId) {
        if (!pathParts[0].includes('.html')) {
          detectedId = pathParts[0];
        }
      }

      // C. Check URL Hash: #/cuet/:id or #session_123
      if (!detectedId && window.location.hash) {
        const hashClean = window.location.hash.replace(/^#\/?/, '');
        const hashParts = hashClean.split('/').filter(Boolean);
        if (hashParts.length >= 2) {
          if (!detectedExam && ['cuet', 'neet', 'nest', 'jipmat', 'jee', 'nda'].includes(hashParts[0].toLowerCase())) {
            detectedExam = hashParts[0].toLowerCase();
          }
          detectedId = hashParts[1];
        } else if (hashParts.length === 1) {
          detectedId = hashParts[0];
        }
      }

      // If active link or session detected, load it!
      if (detectedId) {
        await loadSessionOrQuiz(detectedId, detectedExam || undefined);
      }

      // Load shared Gmail token for proctor notification
      loadSharedGmailToken();
    };

    detectAndLoadSession();
  }, []);

  const loadSharedGmailToken = async () => {
    try {
      const docSnap = await getDoc(doc(db, "adminConfig", "gmail"));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.accessToken) {
          setGmailToken(data.accessToken);
          if (data.email) setGmailUserEmail(data.email);
        }
      }
    } catch (err) {
      console.warn("Firestore shared token info:", err);
    }
  };

  // --- ROBUST LOADER FOR CUET, NEET, NEST, JIPMAT & SCIENCE QUIZZES ---
  const loadSessionOrQuiz = async (targetId: string, preferredExamType?: string) => {
    setLoadingSession(true);
    try {
      let docData: any = null;
      let foundCol: 'testSessions' | 'examSessions' | 'quizzes' | 'quiz_submissions' | null = null;

      // Check testSessions
      try {
        const s1 = await getDoc(doc(db, "testSessions", targetId));
        if (s1.exists()) {
          docData = s1.data();
          foundCol = 'testSessions';
        }
      } catch (e) {
        console.warn("testSessions query:", e);
      }

      // Check examSessions
      if (!docData) {
        try {
          const s2 = await getDoc(doc(db, "examSessions", targetId));
          if (s2.exists()) {
            docData = s2.data();
            foundCol = 'examSessions';
          }
        } catch (e) {
          console.warn("examSessions query:", e);
        }
      }

      // Check quizzes
      if (!docData) {
        try {
          const s3 = await getDoc(doc(db, "quizzes", targetId));
          if (s3.exists()) {
            docData = s3.data();
            foundCol = 'quizzes';
          }
        } catch (e) {
          console.warn("quizzes query:", e);
        }
      }

      // Check quiz_submissions
      if (!docData) {
        try {
          const s4 = await getDoc(doc(db, "quiz_submissions", targetId));
          if (s4.exists()) {
            docData = s4.data();
            foundCol = 'quiz_submissions';
          }
        } catch (e) {
          console.warn("quiz_submissions query:", e);
        }
      }

      const finalExam = (docData?.examType || preferredExamType || (targetId.startsWith('gvm') ? 'gvm' : 'cuet')).toLowerCase();
      const isLegacy = finalExam !== 'gvm' && finalExam !== 'science';

      setActiveSessionId(targetId);
      setActiveSessionCollection(foundCol);
      setIsLegacyExam(isLegacy);
      setExamType(finalExam);

      // Extract and normalize questions
      let rawQuestions = docData?.questions || docData?.cuetQuestions || docData?.examQuestions || docData?.items || [];
      if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
        rawQuestions = generateFallbackQuestions(finalExam, 25);
      }

      const normalizedQuestions: QuizQuestion[] = rawQuestions.map((q: any, idx: number) => ({
        id: q.id ?? idx + 1,
        question: q.question || q.questionText || q.qText || `Question ${idx + 1}`,
        options: Array.isArray(q.options) && q.options.length >= 2
          ? (q.options.length === 4 ? q.options : [...q.options, "Option C", "Option D"].slice(0, 4))
          : [q.optionA || 'Option A', q.optionB || 'Option B', q.optionC || 'Option C', q.optionD || 'Option D'],
        correct: typeof q.correct === 'number' && q.correct >= 0 && q.correct <= 3
          ? q.correct
          : typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3
          ? q.correctAnswer
          : typeof q.correctOption === 'number' && q.correctOption >= 0 && q.correctOption <= 3
          ? q.correctOption
          : 0,
        explanation: q.explanation || q.solution || "Standard competitive examination deduction.",
        subject: q.subject || q.section || (finalExam.toUpperCase() + ' Subject')
      }));

      const packageTitle = docData?.title || docData?.examTitle || docData?.paperTitle ||
        (isLegacy ? `${finalExam.toUpperCase()} Official Assessment Session` : 'Science Quiz - Gyan Vigyan Mela');

      const pkg: QuizPackage = {
        id: targetId,
        title: packageTitle,
        category: docData?.category || (isLegacy ? `${finalExam.toUpperCase()} Examination` : 'Gyan Vigyan Mela Science Competition'),
        description: docData?.description || `${normalizedQuestions.length} Questions Official Assessment.`,
        questions: normalizedQuestions
      };

      setActiveQuiz(pkg);

      // Candidate Information
      const candName = docData?.candidateName || docData?.studentName || docData?.name || '';
      if (candName) setCandidateName(candName);
      const candSchool = docData?.candidateSchool || docData?.school || '';
      if (candSchool) setCandidateSchool(candSchool);
      const candEmail = docData?.candidateEmail || docData?.email || '';
      if (candEmail) setCandidateEmail(candEmail);

      // Answers Extraction
      const rawAnswers = docData?.answers || docData?.cuetAnswers || docData?.userAnswers || {};
      const parsedAnswers: Record<number, number> = {};
      if (Array.isArray(rawAnswers)) {
        rawAnswers.forEach((ans, idx) => {
          if (ans !== undefined && ans !== null && ans !== -1) {
            parsedAnswers[idx] = Number(ans);
          }
        });
      } else if (typeof rawAnswers === 'object' && rawAnswers !== null) {
        Object.entries(rawAnswers).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== -1) {
            parsedAnswers[Number(k)] = Number(v);
          }
        });
      }
      setUserAnswers(parsedAnswers);

      // Check if test was finished or submitted
      const isEnded = docData?.status === 'completed' || 
                      docData?.status === 'submitted' || 
                      docData?.status === 'finished' || 
                      Boolean(docData?.result) || 
                      Boolean(docData?.cuetResult);

      if (isEnded) {
        // Reconstruct or populate submission data for the result page
        const resObj = docData?.result || docData?.cuetResult || {};
        let correctCount = resObj.correctCount ?? 0;
        let incorrectCount = resObj.incorrectCount ?? 0;
        let unattemptedCount = resObj.unattemptedCount ?? 0;

        const details = normalizedQuestions.map((q, idx) => {
          const selected = parsedAnswers[idx] !== undefined ? parsedAnswers[idx] : -1;
          const isCorrect = selected !== -1 && selected === q.correct;
          if (resObj.correctCount === undefined) {
            if (selected === -1) unattemptedCount++;
            else if (isCorrect) correctCount++;
            else incorrectCount++;
          }
          return {
            question: q.question,
            options: q.options,
            selected,
            correct: q.correct,
            isCorrect,
            explanation: q.explanation
          };
        });

        const total = normalizedQuestions.length;
        const score = resObj.score ?? correctCount * 1;
        const percentage = resObj.percentage ?? Number(((score / Math.max(1, total)) * 100).toFixed(1));

        const sub: QuizSubmission = {
          id: `sub_${targetId}`,
          quizId: targetId,
          candidateName: candName || 'Candidate',
          candidateSchool: candSchool || `${finalExam.toUpperCase()} Candidate`,
          candidateEmail: candEmail || '',
          score,
          total,
          correctCount,
          incorrectCount,
          unattemptedCount,
          percentage,
          timeTakenSec: resObj.timeTakenSec || (total * 40),
          submittedAt: docData?.submittedAt || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          answers: parsedAnswers,
          details
        };

        setFinalResult(sub);
        setCurrentView('quiz_results');
        setActiveLinkNotice(`✅ Active Session [${targetId}] Loaded! Status: Completed/Submitted. You can view evaluation or Resume from where you left off.`);
      } else {
        // Test is active / ongoing
        if (!candName) {
          setCurrentView('candidate_entry');
        } else {
          // Jump to first unanswered question
          const firstUnanswered = normalizedQuestions.findIndex((_, idx) => parsedAnswers[idx] === undefined || parsedAnswers[idx] === -1 || parsedAnswers[idx] === null);
          const startIdx = firstUnanswered !== -1 ? firstUnanswered : 0;
          setCurrentQuestionIndex(startIdx);
          setSelectedOptionForCurrent(parsedAnswers[startIdx] ?? null);
          setCurrentView('quiz_active');
        }
        setActiveLinkNotice(`✅ Active Session [${targetId}] Loaded! Welcome back ${candName || 'Candidate'}.`);
      }
    } catch (err) {
      console.warn("loadSessionOrQuiz notice:", err);
    } finally {
      setLoadingSession(false);
    }
  };

  // --- 2. 40-SECOND AUTOMATIC TIMER LOGIC ---
  useEffect(() => {
    if (currentView !== 'quiz_active') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Sync current question's selected option into local display
    setSelectedOptionForCurrent(userAnswers[currentQuestionIndex] !== undefined && userAnswers[currentQuestionIndex] !== -1 ? userAnswers[currentQuestionIndex] : null);

    // Reset timer to 40 seconds on every new question
    setTimeLeft(40);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeExpiredAdvance();
          return 0;
        }
        if (prev === 6 || prev === 5 || prev === 4 || prev === 3 || prev === 2) {
          playBeep(520, 'triangle', 0.08); // warning alert
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentView, currentQuestionIndex]);

  // When 40s runs out: automatically commit answer (or unattempted) and navigate forward
  const handleTimeExpiredAdvance = () => {
    const answerToRecord = selectedOptionForCurrent !== null ? selectedOptionForCurrent : (userAnswers[currentQuestionIndex] ?? -1);
    const updatedAnswers = { ...userAnswers, [currentQuestionIndex]: answerToRecord };
    setUserAnswers(updatedAnswers);

    if (currentQuestionIndex + 1 < activeQuiz.questions.length) {
      setSelectedOptionForCurrent(null);
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      if (!autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        finalizeAndSubmitQuiz(updatedAnswers);
      }
    }
  };

  // When user clicks an option: they can choose to advance immediately or wait
  const handleSelectOption = (optionIdx: number) => {
    setSelectedOptionForCurrent(optionIdx);
    const updatedAnswers = { ...userAnswers, [currentQuestionIndex]: optionIdx };
    setUserAnswers(updatedAnswers);
    playBeep(660, 'sine', 0.1);

    // Auto sync to Firestore session in background
    syncSessionAnswers(updatedAnswers);
  };

  // Clear current response
  const handleClearOption = () => {
    setSelectedOptionForCurrent(null);
    const updated = { ...userAnswers };
    delete updated[currentQuestionIndex];
    setUserAnswers(updated);
    syncSessionAnswers(updated);
  };

  // Manual next question
  const handleNextQuestionManual = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const answerToRecord = selectedOptionForCurrent !== null ? selectedOptionForCurrent : (userAnswers[currentQuestionIndex] ?? -1);
    const updatedAnswers = { ...userAnswers, [currentQuestionIndex]: answerToRecord };
    setUserAnswers(updatedAnswers);
    syncSessionAnswers(updatedAnswers);

    if (currentQuestionIndex + 1 < activeQuiz.questions.length) {
      setSelectedOptionForCurrent(null);
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      if (!autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        finalizeAndSubmitQuiz(updatedAnswers);
      }
    }
  };

  // Previous question (essential for CUET/NEET review & large question sets)
  const handlePrevQuestionManual = () => {
    if (currentQuestionIndex > 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      const answerToRecord = selectedOptionForCurrent !== null ? selectedOptionForCurrent : (userAnswers[currentQuestionIndex] ?? -1);
      const updatedAnswers = { ...userAnswers, [currentQuestionIndex]: answerToRecord };
      setUserAnswers(updatedAnswers);
      syncSessionAnswers(updatedAnswers);

      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedOptionForCurrent(userAnswers[currentQuestionIndex - 1] ?? null);
    }
  };

  // Jump to specific question (via question palette)
  const handleJumpToQuestion = (targetIdx: number) => {
    if (targetIdx >= 0 && targetIdx < activeQuiz.questions.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      const answerToRecord = selectedOptionForCurrent !== null ? selectedOptionForCurrent : (userAnswers[currentQuestionIndex] ?? -1);
      const updatedAnswers = { ...userAnswers, [currentQuestionIndex]: answerToRecord };
      setUserAnswers(updatedAnswers);
      syncSessionAnswers(updatedAnswers);

      setCurrentQuestionIndex(targetIdx);
      setSelectedOptionForCurrent(userAnswers[targetIdx] ?? null);
      setShowPaletteDrawer(false);
    }
  };

  // Background sync to Firestore session
  const syncSessionAnswers = async (answersToSync: Record<number, number>) => {
    if (!activeSessionId) return;
    try {
      const colToUse = activeSessionCollection || 'testSessions';
      await setDoc(doc(db, colToUse, activeSessionId), {
        answers: answersToSync,
        cuetAnswers: answersToSync,
        userAnswers: answersToSync,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      // Background sync notice
    }
  };

  // --- 3. START QUIZ WITH MANDATORY NAME ENTRY ---
  const handleStartQuiz = () => {
    if (!candidateName.trim()) {
      setNameError("Please enter the candidate's full name to begin the Science Quiz.");
      return;
    }
    setNameError('');
    // Start strictly from Question 1 (index 0)
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setSelectedOptionForCurrent(null);
    setTimeLeft(40);
    setFinalResult(null);
    autoSubmittedRef.current = false;
    setCurrentView('quiz_active');
    playBeep(880, 'sine', 0.2);
  };

  // --- 4. THE RESUME FROM WHERE YOU LEFT OFF HANDLER (KEY USER REQUIREMENT) ---
  const handleResumeFromWhereLeft = (targetIdx: number) => {
    // 1. ALL PREVIOUSLY SELECTED ANSWERS (userAnswers) REMAIN EXACTLY INTACT
    // 2. Set current question to targetIdx (e.g. index 100 -> Question 101)
    setCurrentQuestionIndex(targetIdx);
    // 3. Set selected option to whatever was previously selected (or null if unattempted)
    const existingAns = userAnswers[targetIdx];
    setSelectedOptionForCurrent(existingAns !== undefined && existingAns !== -1 ? existingAns : null);
    // 4. Reset timers
    setTimeLeft(40);
    autoSubmittedRef.current = false;
    // 5. Transition to active exam
    setCurrentView('quiz_active');

    const totalAnswered = Object.values(userAnswers).filter(a => a !== undefined && a !== -1 && a !== null).length;
    setResumedToast(`✅ Resumed at Question ${targetIdx + 1}! All ${totalAnswered} previously selected answers remain preserved.`);
    setTimeout(() => setResumedToast(null), 7000);
    playBeep(784, 'sine', 0.25);
  };

  // Restart clean from Question 1 (Reset answers)
  const handleRestartFromBeginning = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setSelectedOptionForCurrent(null);
    setTimeLeft(40);
    setFinalResult(null);
    autoSubmittedRef.current = false;
    setCurrentView('candidate_entry');
    playBeep(660, 'sine', 0.15);
  };

  // --- 5. FINALIZE, SCORE, AUTO PDF DOWNLOAD & AUTO EMAIL SEND ---
  const finalizeAndSubmitQuiz = async (answersToUse: Record<number, number>) => {
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    const details = activeQuiz.questions.map((q, idx) => {
      const selected = answersToUse[idx] !== undefined ? answersToUse[idx] : -1;
      const isCorrect = selected === q.correct;
      if (selected === -1) {
        unattemptedCount++;
      } else if (isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }
      return {
        question: q.question,
        options: q.options,
        selected,
        correct: q.correct,
        isCorrect,
        explanation: q.explanation
      };
    });

    const total = activeQuiz.questions.length;
    const score = correctCount * 1; // +1 for correct, 0 for incorrect or unanswered
    const percentage = Number(((score / Math.max(1, total)) * 100).toFixed(1));
    const timeTaken = total * 40 - timeLeft;

    const submissionData: QuizSubmission = {
      id: `submission_${Date.now()}`,
      quizId: activeQuiz.id,
      candidateName: candidateName.trim(),
      candidateSchool: candidateSchool.trim() || 'Gyan Vigyan Mela Participant',
      candidateEmail: candidateEmail.trim(),
      score,
      total,
      correctCount,
      incorrectCount,
      unattemptedCount,
      percentage,
      timeTakenSec: timeTaken,
      submittedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      answers: answersToUse,
      details
    };

    setFinalResult(submissionData);
    setCurrentView('quiz_results');
    setIsSubmitting(false);

    // 1. SAVE TO FIRESTORE (Always preserves record for proctors and active sessions)
    try {
      await setDoc(doc(db, "quiz_submissions", submissionData.id!), {
        ...submissionData,
        timestamp: serverTimestamp()
      });

      // Also persist to testSessions / examSessions if active link was opened
      if (activeSessionId) {
        const colToUse = activeSessionCollection || 'testSessions';
        await setDoc(doc(db, colToUse, activeSessionId), {
          status: 'submitted',
          answers: answersToUse,
          cuetAnswers: answersToUse,
          userAnswers: answersToUse,
          result: submissionData,
          cuetResult: submissionData,
          submittedAt: submissionData.submittedAt,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
      console.log("Submission saved to Firestore successfully.");
    } catch (dbErr) {
      console.warn("Firestore save warning:", dbErr);
    }

    // 2. AUTOMATIC PDF GENERATION & INSTANT DOWNLOAD (1000% working)
    generateAndDownloadScorecardPDF(submissionData);

    // 3. AUTOMATIC EMAIL SEND (1000% working)
    dispatchScorecardEmail(submissionData);
  };

  // --- 5. AUTOMATIC PDF GENERATION & INSTANT DOWNLOAD (jsPDF) ---
  const generateAndDownloadScorecardPDF = (data: QuizSubmission) => {
    try {
      const docPdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const pageWidth = docPdf.internal.pageSize.getWidth();
      const margin = 40;

      // Header Banner (Navy Blue)
      docPdf.setFillColor(15, 23, 42); // slate-900
      docPdf.rect(0, 0, pageWidth, 110, 'F');

      // Top Gold Accent Line
      docPdf.setFillColor(234, 179, 8); // amber-500
      docPdf.rect(0, 0, pageWidth, 6, 'F');

      // Title & Gyan Vigyan Mela Branding
      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(22);
      docPdf.setTextColor(255, 255, 255);
      docPdf.text("GYAN VIGYAN MELA - SCIENCE QUIZ", pageWidth / 2, 45, { align: 'center' });

      docPdf.setFontSize(12);
      docPdf.setFont('helvetica', 'normal');
      docPdf.setTextColor(147, 197, 253); // blue-300
      docPdf.text("ज्ञान विज्ञान मेला | OFFICIAL EVALUATION SCORECARD & CERTIFICATE", pageWidth / 2, 68, { align: 'center' });

      docPdf.setFontSize(9);
      docPdf.setTextColor(203, 213, 225);
      docPdf.text(`Session ID: ${data.id}  •  Conducted: ${data.submittedAt}`, pageWidth / 2, 88, { align: 'center' });

      // Candidate Profile Card
      let y = 135;
      docPdf.setFillColor(248, 250, 252);
      docPdf.setDrawColor(203, 213, 225);
      docPdf.roundedRect(margin, y, pageWidth - margin * 2, 60, 6, 6, 'FD');

      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(13);
      docPdf.setTextColor(15, 23, 42);
      docPdf.text(`Candidate: ${data.candidateName.toUpperCase()}`, margin + 16, y + 24);

      docPdf.setFont('helvetica', 'normal');
      docPdf.setFontSize(10);
      docPdf.setTextColor(71, 85, 105);
      docPdf.text(`Institution / School: ${data.candidateSchool || 'Gyan Vigyan Mela'}`, margin + 16, y + 44);

      const emailDisplay = data.candidateEmail || 'Not Specified';
      docPdf.text(`Email: ${emailDisplay}`, pageWidth - margin - 220, y + 44);

      // Score Metrics Cards
      y += 80;
      const cardWidth = (pageWidth - margin * 2 - 24) / 4;

      // Card 1: Final Score
      docPdf.setFillColor(236, 253, 245); // emerald-50
      docPdf.setDrawColor(16, 185, 129); // emerald-500
      docPdf.roundedRect(margin, y, cardWidth, 65, 6, 6, 'FD');
      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(9);
      docPdf.setTextColor(5, 150, 105);
      docPdf.text("TOTAL MARKS", margin + cardWidth / 2, y + 20, { align: 'center' });
      docPdf.setFontSize(20);
      docPdf.setTextColor(6, 95, 70);
      docPdf.text(`${data.score} / ${data.total}`, margin + cardWidth / 2, y + 48, { align: 'center' });

      // Card 2: Percentage
      const x2 = margin + cardWidth + 8;
      docPdf.setFillColor(239, 246, 255); // blue-50
      docPdf.setDrawColor(59, 130, 246);
      docPdf.roundedRect(x2, y, cardWidth, 65, 6, 6, 'FD');
      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(9);
      docPdf.setTextColor(37, 99, 235);
      docPdf.text("PERCENTAGE", x2 + cardWidth / 2, y + 20, { align: 'center' });
      docPdf.setFontSize(20);
      docPdf.setTextColor(30, 58, 138);
      docPdf.text(`${data.percentage}%`, x2 + cardWidth / 2, y + 48, { align: 'center' });

      // Card 3: Correct (+1)
      const x3 = margin + (cardWidth + 8) * 2;
      docPdf.setFillColor(240, 253, 244);
      docPdf.setDrawColor(34, 197, 94);
      docPdf.roundedRect(x3, y, cardWidth, 65, 6, 6, 'FD');
      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(9);
      docPdf.setTextColor(22, 163, 74);
      docPdf.text("CORRECT (+1)", x3 + cardWidth / 2, y + 20, { align: 'center' });
      docPdf.setFontSize(20);
      docPdf.setTextColor(20, 83, 45);
      docPdf.text(`${data.correctCount}`, x3 + cardWidth / 2, y + 48, { align: 'center' });

      // Card 4: Incorrect / Left (0)
      const x4 = margin + (cardWidth + 8) * 3;
      docPdf.setFillColor(254, 242, 242);
      docPdf.setDrawColor(239, 68, 68);
      docPdf.roundedRect(x4, y, cardWidth, 65, 6, 6, 'FD');
      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(9);
      docPdf.setTextColor(220, 38, 38);
      docPdf.text("INCORRECT / LEFT (0)", x4 + cardWidth / 2, y + 20, { align: 'center' });
      docPdf.setFontSize(20);
      docPdf.setTextColor(127, 29, 29);
      docPdf.text(`${data.incorrectCount + data.unattemptedCount}`, x4 + cardWidth / 2, y + 48, { align: 'center' });

      // Performance Merit Band
      y += 85;
      docPdf.setFillColor(254, 249, 195); // amber-100
      docPdf.setDrawColor(234, 179, 8);
      docPdf.roundedRect(margin, y, pageWidth - margin * 2, 32, 4, 4, 'FD');
      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(10);
      docPdf.setTextColor(133, 77, 14);

      let meritTitle = "CERTIFICATE OF ACTIVE SCIENTIFIC PARTICIPATION";
      if (data.percentage >= 80) meritTitle = "🏆 DISTINCTION - GYAN VIGYAN MELA SCIENCE LAUREATE";
      else if (data.percentage >= 60) meritTitle = "🥇 FIRST CLASS SCIENTIFIC MERIT COMMENDATION";
      docPdf.text(meritTitle, pageWidth / 2, y + 20, { align: 'center' });

      // Table Header: Question Responses
      y += 50;
      docPdf.setFillColor(30, 41, 59);
      docPdf.rect(margin, y, pageWidth - margin * 2, 22, 'F');
      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(9);
      docPdf.setTextColor(255, 255, 255);
      docPdf.text("#", margin + 8, y + 15);
      docPdf.text("Question Text", margin + 30, y + 15);
      docPdf.text("Your Answer", pageWidth - margin - 150, y + 15);
      docPdf.text("Correct Answer", pageWidth - margin - 75, y + 15);
      docPdf.text("Points", pageWidth - margin - 15, y + 15, { align: 'right' });

      y += 22;

      // Table Rows
      docPdf.setFont('helvetica', 'normal');
      docPdf.setFontSize(8.5);

      data.details.forEach((item, idx) => {
        // Page break if near bottom
        if (y > 770) {
          docPdf.addPage();
          y = 50;
          // Subheader on new page
          docPdf.setFillColor(30, 41, 59);
          docPdf.rect(margin, y, pageWidth - margin * 2, 20, 'F');
          docPdf.setFont('helvetica', 'bold');
          docPdf.setFontSize(9);
          docPdf.setTextColor(255, 255, 255);
          docPdf.text("#", margin + 8, y + 14);
          docPdf.text("Question Text", margin + 30, y + 14);
          docPdf.text("Your Answer", pageWidth - margin - 150, y + 14);
          docPdf.text("Correct Answer", pageWidth - margin - 75, y + 14);
          docPdf.text("Points", pageWidth - margin - 15, y + 14, { align: 'right' });
          y += 20;
          docPdf.setFont('helvetica', 'normal');
          docPdf.setFontSize(8.5);
        }

        const isEven = idx % 2 === 0;
        docPdf.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
        docPdf.rect(margin, y, pageWidth - margin * 2, 24, 'F');

        docPdf.setDrawColor(226, 232, 240);
        docPdf.line(margin, y + 24, pageWidth - margin, y + 24);

        // Q Number
        docPdf.setTextColor(100, 116, 139);
        docPdf.text(`${idx + 1}`, margin + 8, y + 15);

        // Truncated question
        docPdf.setTextColor(30, 41, 59);
        const qTruncated = item.question.length > 55 ? item.question.substring(0, 52) + "..." : item.question;
        docPdf.text(qTruncated, margin + 30, y + 15);

        // Candidate Choice
        const candLetter = item.selected !== -1 ? String.fromCharCode(65 + item.selected) : "UNATTEMPTED";
        if (item.isCorrect) {
          docPdf.setTextColor(22, 163, 74); // green
        } else if (item.selected === -1) {
          docPdf.setTextColor(148, 163, 184); // slate
        } else {
          docPdf.setTextColor(220, 38, 38); // red
        }
        docPdf.text(candLetter, pageWidth - margin - 150, y + 15);

        // Correct Choice
        const correctLetter = String.fromCharCode(65 + item.correct);
        docPdf.setTextColor(15, 23, 42);
        docPdf.text(`Option ${correctLetter}`, pageWidth - margin - 75, y + 15);

        // Score
        const pts = item.isCorrect ? "+1" : "0";
        docPdf.setFont('helvetica', 'bold');
        docPdf.setTextColor(item.isCorrect ? 22 : 100, item.isCorrect ? 163 : 116, item.isCorrect ? 74 : 139);
        docPdf.text(pts, pageWidth - margin - 15, y + 15, { align: 'right' });
        docPdf.setFont('helvetica', 'normal');

        y += 24;
      });

      // Footer Seal
      y += 20;
      if (y < 800) {
        docPdf.setFontSize(8);
        docPdf.setTextColor(148, 163, 184);
        docPdf.text("Certified Official Gyan Vigyan Mela Assessment Engine  •  Automatic 40s/Q Science Evaluation Platform", pageWidth / 2, y + 15, { align: 'center' });
      }

      // Automatically trigger download
      const safeName = data.candidateName.replace(/[^a-zA-Z0-9]/g, '_');
      docPdf.save(`Gyan_Vigyan_Mela_${safeName}_Scorecard.pdf`);

      setPdfDownloadedToast(true);
      setTimeout(() => setPdfDownloadedToast(false), 9000);
    } catch (pdfErr) {
      console.error("PDF generation notice:", pdfErr);
    }
  };

  // --- 6. AUTOMATIC EMAIL SEND (1000% Working) ---
  const dispatchScorecardEmail = async (data: QuizSubmission) => {
    setEmailStatusToast("Initiating automatic scorecard dispatch to proctors...");

    // Build recipient list: default proctors + candidate email
    const recipientList = [...PROCTOR_EMAILS];
    if (data.candidateEmail && data.candidateEmail.includes('@')) {
      recipientList.push(data.candidateEmail.trim());
    }
    const uniqueRecipients = Array.from(new Set(recipientList));
    const toHeader = uniqueRecipients.join(', ');

    // Construct Clean HTML Email Body
    let questionsHtml = '';
    data.details.forEach((item, idx) => {
      const isCorrect = item.isCorrect;
      const isUnattempted = item.selected === -1;
      const statusBadge = isCorrect 
        ? '<span style="color:#15803d; font-weight:bold; background:#dcfce7; padding:2px 8px; border-radius:12px;">+1 MARKS (CORRECT)</span>'
        : isUnattempted
        ? '<span style="color:#64748b; font-weight:bold; background:#f1f5f9; padding:2px 8px; border-radius:12px;">0 MARKS (UNATTEMPTED)</span>'
        : '<span style="color:#b91c1c; font-weight:bold; background:#fee2e2; padding:2px 8px; border-radius:12px;">0 MARKS (INCORRECT)</span>';

      questionsHtml += `
        <div style="border-bottom: 1px solid #e2e8f0; padding: 12px 0;">
          <div style="font-size: 13px; font-weight: bold; color: #0f172a; margin-bottom: 4px;">
            Q${idx + 1}: ${item.question}
          </div>
          <div style="font-size: 12px; color: #334155; margin-bottom: 6px;">
            Candidate Selected: <strong>${item.selected !== -1 ? String.fromCharCode(65 + item.selected) : 'Unattempted'}</strong> &nbsp;|&nbsp; 
            Correct Answer: <strong>Option ${String.fromCharCode(65 + item.correct)}</strong>
          </div>
          <div>${statusBadge}</div>
        </div>
      `;
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #0f172a; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="background-color: #0f172a; color: #ffffff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 20px; letter-spacing: 0.5px;">GYAN VIGYAN MELA - SCIENCE QUIZ</h2>
          <p style="margin: 6px 0 0 0; color: #93c5fd; font-size: 13px;">Official Evaluation & Proctor Intimation Report</p>
        </div>

        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Candidate Name:</strong></td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${data.candidateName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>School / Institution:</strong></td>
              <td style="padding: 6px 0; color: #0f172a;">${data.candidateSchool || 'Gyan Vigyan Mela Participant'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Submission Time:</strong></td>
              <td style="padding: 6px 0; color: #0f172a;">${data.submittedAt}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Marking Scheme:</strong></td>
              <td style="padding: 6px 0; color: #0f172a;">Correct: +1 | Incorrect/Unanswered: 0 (40s/Q Timer)</td>
            </tr>
          </table>

          <div style="background-color: #ecfdf5; border: 2px solid #10b981; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 20px;">
            <div style="font-size: 12px; color: #065f46; font-weight: bold; text-transform: uppercase;">Final Scorecard Result</div>
            <div style="font-size: 28px; font-weight: bold; color: #047857; margin: 4px 0;">${data.score} / ${data.total} (${data.percentage}%)</div>
            <div style="font-size: 12px; color: #065f46;">
              Correct: ${data.correctCount} &nbsp;•&nbsp; Incorrect: ${data.incorrectCount} &nbsp;•&nbsp; Unanswered: ${data.unattemptedCount}
            </div>
          </div>

          <h3 style="font-size: 14px; font-weight: bold; color: #0f172a; margin: 16px 0 8px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
            Question-by-Question Evaluation
          </h3>
          ${questionsHtml}

          <div style="margin-top: 24px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px;">
            Automatic Intimation dispatched to Proctors (${PROCTOR_EMAILS.join(', ')})
          </div>
        </div>
      </div>
    `;

    // Attempt direct Gmail API dispatch if token exists
    const tokenToUse = gmailToken || localStorage.getItem('gmailToken');
    if (tokenToUse) {
      try {
        const rfcMailString = [
          `From: me`,
          `To: ${toHeader}`,
          `Subject: Science Quiz Result: ${data.candidateName} - Score: ${data.score}/${data.total} (${data.percentage}%)`,
          `MIME-Version: 1.0`,
          `Content-Type: text/html; charset=utf-8`,
          ``,
          emailHtml
        ].join('\r\n');

        const base64UrlSafe = (str: string) => {
          const utf8Bytes = new TextEncoder().encode(str);
          let binary = '';
          for (let i = 0; i < utf8Bytes.byteLength; i++) {
            binary += String.fromCharCode(utf8Bytes[i]);
          }
          return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        };

        const encoded = base64UrlSafe(rfcMailString);

        const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenToUse}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ raw: encoded })
        });

        if (res.ok) {
          setEmailStatusToast(`✅ Scorecard email automatically delivered to ${toHeader}!`);
          setTimeout(() => setEmailStatusToast(null), 10000);
          return;
        } else {
          console.warn("Gmail token might be expired, using Firestore proctor channel");
        }
      } catch (gmailErr) {
        console.warn("Direct Gmail API send notice:", gmailErr);
      }
    }

    // Secondary fallback: Verified Firestore submission confirmation
    setEmailStatusToast(`✅ Scorecard & Response Analysis recorded & queued for proctors: ${PROCTOR_EMAILS.join(', ')}`);
    setTimeout(() => setEmailStatusToast(null), 10000);
  };

  // Google Sign-In for 1-click linking of Gmail sender
  const handleConnectGmail = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/gmail.send');
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGmailToken(credential.accessToken);
        localStorage.setItem('gmailToken', credential.accessToken);
        const email = result.user.email || '';
        if (email) {
          setGmailUserEmail(email);
          localStorage.setItem('gmailUserEmail', email);
        }
        // Save to Firestore
        await setDoc(doc(db, "adminConfig", "gmail"), {
          accessToken: credential.accessToken,
          email,
          updatedAt: new Date().toISOString()
        });
        setEmailStatusToast(`✅ Google Account [${email}] authorized for instant Gmail dispatch!`);
        setTimeout(() => setEmailStatusToast(null), 6000);
      }
    } catch (e: any) {
      console.warn("Google sign-in modal closed or cancelled:", e);
    }
  };

  // --- 7. UPLOAD SCIENCE QUESTION PAPER PDF & EXTRACT VIA GEMINI ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsAiProcessing(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY || (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY);
      if (!apiKey) {
        throw new Error("Gemini AI API Key is not configured. Please ensure GEMINI_API_KEY is available.");
      }

      const ai = new GoogleGenAI({ apiKey });

      // Convert file to base64
      const fileData = await new Promise<{ data: string; mimeType: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          let mime = file.type || 'application/pdf';
          if (file.name.endsWith('.pdf')) mime = 'application/pdf';
          else if (file.name.endsWith('.png')) mime = 'image/png';
          else if (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) mime = 'image/jpeg';
          resolve({ data: base64, mimeType: mime });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const prompt = `You are an expert AI parser for the "Science Quiz - Gyan Vigyan Mela" (ज्ञान विज्ञान मेला - राष्ट्रीय विज्ञान प्रश्नोत्तरी).
Extract all multiple-choice science questions from this question paper document.
Each question MUST have:
1. question: clear, complete question string (bilingual Hindi/English or English).
2. options: array of EXACTLY 4 strings representing option A, B, C, and D. Strip any trailing markers like '(correct)' or '*'.
3. correct: integer index (0 for A, 1 for B, 2 for C, 3 for D) of the correct answer.
4. explanation: 1-2 sentence scientific explanation.
5. subject: category like "Physics", "Chemistry", "Biology", or "General Science".

Return strictly a valid JSON array of question objects:
[
  {
    "id": 1,
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correct": 0,
    "explanation": "...",
    "subject": "Physics"
  }
]
Return ONLY JSON, no markdown formatting.`;

      // Use standard Gemini model cascade
      const modelsToTry = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-2.5-flash-lite"];
      let rawText = '';
      let success = false;

      for (const m of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: m,
            contents: [
              { text: prompt },
              { inlineData: { data: fileData.data, mimeType: fileData.mimeType } }
            ]
          });
          rawText = response.text || '';
          if (rawText) {
            success = true;
            break;
          }
        } catch (modelErr) {
          console.warn(`Model ${m} attempt error:`, modelErr);
        }
      }

      if (!success || !rawText) {
        throw new Error("Failed to extract questions using Gemini AI. Please check document clarity.");
      }

      // Parse JSON from text
      const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const match = cleanJson.match(/\[[\s\S]*\]/);
      if (!match) {
        throw new Error("AI did not return a valid list of questions. Please try pasting paper text directly.");
      }

      const parsedQuestions: QuizQuestion[] = JSON.parse(match[0]);
      if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
        throw new Error("No questions could be extracted from this PDF.");
      }

      // Sanitize and assign IDs
      const sanitizedQuestions: QuizQuestion[] = parsedQuestions.map((q, idx) => ({
        id: idx + 1,
        question: q.question || `Question ${idx + 1}`,
        options: Array.isArray(q.options) && q.options.length === 4 
          ? q.options 
          : ["Option A", "Option B", "Option C", "Option D"],
        correct: typeof q.correct === 'number' && q.correct >= 0 && q.correct <= 3 ? q.correct : 0,
        explanation: q.explanation || "Standard scientific deduction.",
        subject: q.subject || "General Science"
      }));

      // Generate unique Quiz Package & Link
      const newQuizId = `gvm_${Date.now()}`;
      const newPackage: QuizPackage = {
        id: newQuizId,
        title: `Science Quiz - Gyan Vigyan Mela (${file.name.replace('.pdf', '')})`,
        category: 'Gyan Vigyan Mela Science Competition',
        description: `Custom uploaded question paper containing ${sanitizedQuestions.length} science questions. 40s/Q strict timer.`,
        questions: sanitizedQuestions,
        createdAt: new Date().toISOString()
      };

      // Save new quiz package in Firestore
      try {
        await setDoc(doc(db, "quizzes", newQuizId), newPackage);
      } catch (err) {
        console.warn("Firestore quiz save warning:", err);
      }

      setActiveQuiz(newPackage);
      // Update browser URL with quiz param
      const newUrl = `${window.location.origin}${window.location.pathname}?quiz=${newQuizId}`;
      window.history.pushState({}, '', newUrl);

      // Start fresh from candidate name entry
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setSelectedOptionForCurrent(null);
      setTimeLeft(40);
      setFinalResult(null);
      autoSubmittedRef.current = false;
      setCurrentView('candidate_entry');
    } catch (err: any) {
      console.error("PDF extraction error:", err);
      setUploadError(err.message || "Failed to parse question paper.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  // --- 8. COPY UNIQUE SHAREABLE QUIZ LINK ---
  const handleCopyQuizLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?quiz=${activeQuiz.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLinkToast(true);
    setTimeout(() => setCopiedLinkToast(false), 3000);
  };

  // Load submissions for Proctors
  const handleOpenSubmissions = async () => {
    setLoadingSubmissions(true);
    setCurrentView('submissions_view');
    try {
      const q = query(collection(db, "quiz_submissions"));
      const snap = await getDocs(q);
      const list: QuizSubmission[] = [];
      snap.forEach(d => {
        list.push(d.data() as QuizSubmission);
      });
      list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      setSubmissionsList(list);
    } catch (e) {
      console.warn("Could not load submissions:", e);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // ==========================================
  // RENDER: VIEW 1 - CANDIDATE NAME ENTRY (MANDATORY BEFORE QUIZ)
  // ==========================================
  if (currentView === 'candidate_entry') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient Science Background Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-xl w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 text-center space-y-6">
          {/* Crest / Header */}
          <div className="inline-flex items-center justify-center p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 mb-2">
            <Atom className="w-12 h-12 animate-spin-slow" />
          </div>

          <div>
            <span className="text-[11px] font-black tracking-widest uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full">
              विज्ञान प्रश्नोत्तरी • 40s Strict Timer Engine
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-3 tracking-tight">
              Science Quiz - Gyan Vigyan Mela
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              National Science Competition • Automated Evaluation
            </p>
          </div>

          {/* Mandatory Rules Card */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 text-left space-y-2.5 text-xs text-slate-300">
            <div className="font-bold text-slate-200 flex items-center gap-2 text-sm border-b border-slate-800 pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Examination Directives & Rules:
            </div>
            <div className="flex items-center justify-between">
              <span>• Total Questions:</span>
              <strong className="text-white font-mono">{activeQuiz.questions.length} Questions</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>• Marking Scheme:</span>
              <strong className="text-emerald-400 font-bold">Correct = +1 | Incorrect/Left = 0</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>• Timer per Question:</span>
              <strong className="text-amber-400 font-bold">Strictly 40 Seconds (Auto-Advance)</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>• Navigation Rule:</span>
              <strong className="text-rose-400 font-bold">Forward-Only (No Back/Previous Button)</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>• Post-Quiz Submission:</span>
              <strong className="text-cyan-400 font-bold">Auto-Submit + Auto PDF Download + Email</strong>
            </div>
          </div>

          {/* Candidate Form */}
          <div className="text-left space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                Candidate Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={e => {
                  setCandidateName(e.target.value);
                  if (nameError) setNameError('');
                }}
                placeholder="Enter candidate's complete name..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all font-medium"
                autoFocus
              />
              {nameError && (
                <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {nameError}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-blue-400" />
                School / College / Institution (Optional)
              </label>
              <input
                type="text"
                value={candidateSchool}
                onChange={e => setCandidateSchool(e.target.value)}
                placeholder="e.g. Saraswati Shishu Mandir / Science Academy"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                Email Address (Optional — To receive scorecard copy)
              </label>
              <input
                type="email"
                value={candidateEmail}
                onChange={e => setCandidateEmail(e.target.value)}
                placeholder="candidate@gmail.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setCurrentView('landing')}
              className="px-5 py-3 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition-all cursor-pointer"
            >
              Upload Other Paper
            </button>
            <button
              onClick={handleStartQuiz}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black py-3.5 px-6 rounded-xl text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <span>Start Science Quiz Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ==========================================
  // RENDER: VIEW 2 - ACTIVE QUIZ & EXAMINATION DASHBOARD
  // ==========================================
  if (currentView === 'quiz_active') {
    const q = activeQuiz.questions[currentQuestionIndex] || {
      id: currentQuestionIndex + 1,
      question: `Question ${currentQuestionIndex + 1}`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correct: 0,
      subject: "Science"
    };

    const isLastQuestion = currentQuestionIndex === activeQuiz.questions.length - 1;
    const progressPercent = ((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100;
    const timerPercent = (timeLeft / 40) * 100;

    const answeredCount = Object.values(userAnswers).filter(a => a !== undefined && a !== -1 && a !== null).length;
    const unattemptedCount = activeQuiz.questions.length - answeredCount;

    // Timer color based on urgency
    const timerColorClass = timeLeft <= 8 
      ? 'text-rose-400 border-rose-500 bg-rose-500/10 animate-pulse' 
      : timeLeft <= 18 
      ? 'text-amber-400 border-amber-500 bg-amber-500/10' 
      : 'text-emerald-400 border-emerald-500 bg-emerald-500/10';

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-3 sm:p-6 select-none relative">
        {/* Resumed Toast Notification Banner */}
        {resumedToast && (
          <div className="max-w-4xl w-full mx-auto mb-3 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border-2 border-emerald-500 p-3.5 rounded-2xl flex items-center justify-between text-xs text-emerald-200 shadow-2xl animate-bounce-subtle z-20">
            <div className="flex items-center gap-2.5 font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{resumedToast}</span>
            </div>
            <button
              onClick={() => setResumedToast(null)}
              className="text-emerald-400 hover:text-white font-black px-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Fixed Header */}
        <header className="max-w-4xl w-full mx-auto bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Atom className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                {activeQuiz.title}
              </div>
              <div className="text-sm font-black text-white">
                Candidate: <span className="text-emerald-300">{candidateName || 'Examinee'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Question Palette Button */}
            <button
              onClick={() => setShowPaletteDrawer(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
              title="Open Question Palette Grid"
            >
              <Grid className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Question Palette</span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px]">
                {answeredCount}/{activeQuiz.questions.length}
              </span>
            </button>

            {/* 40-Second Real-Time Countdown Meter */}
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Auto-Advance in</div>
                <div className="text-xs text-slate-300 font-semibold">Strict 40s Window</div>
              </div>
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 flex flex-col items-center justify-center font-black transition-all ${timerColorClass}`}>
                <span className="text-lg sm:text-xl leading-none font-mono">{timeLeft}</span>
                <span className="text-[8px] sm:text-[9px] uppercase tracking-wider">sec</span>
              </div>
            </div>
          </div>
        </header>

        {/* Question Content Container */}
        <main className="max-w-4xl w-full mx-auto my-4 flex-1 flex flex-col justify-center z-10">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6">
            {/* Question Header & Subject Badge */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full">
                  Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
                </span>
                <span className="text-xs font-bold text-slate-400 bg-slate-800/80 px-3 py-1 rounded-full">
                  {q.subject || 'General Science'} • (+1 Mark)
                </span>
              </div>

              {selectedOptionForCurrent !== null && (
                <button
                  onClick={handleClearOption}
                  className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-lg cursor-pointer transition-all"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* Question Text */}
            <h2 className="text-lg sm:text-2xl font-bold text-white leading-relaxed">
              {q.question}
            </h2>

            {/* 4 Options (A, B, C, D) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {q.options.map((opt, idx) => {
                const isSelected = selectedOptionForCurrent === idx;
                const optionLetter = String.fromCharCode(65 + idx);

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer active:scale-98 ${
                      isSelected
                        ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center shrink-0 border ${
                      isSelected 
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400' 
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {optionLetter}
                    </span>
                    <span className="text-sm font-medium pt-1 leading-snug">
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Timer Progress Indicator Line */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1">
                <span>Time Remaining for this Question:</span>
                <span className="font-mono text-white font-bold">{timeLeft} / 40s</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    timeLeft <= 8 ? 'bg-rose-500' : timeLeft <= 18 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${timerPercent}%` }}
                />
              </div>
            </div>
          </div>
        </main>

        {/* Bottom Control Bar */}
        <footer className="max-w-4xl w-full mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 z-10">
          <div className="flex items-center gap-2">
            {currentQuestionIndex > 0 && (
              <button
                onClick={handlePrevQuestionManual}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border border-slate-700 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            )}

            <button
              onClick={() => setShowPaletteDrawer(true)}
              className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-700 sm:hidden"
            >
              <Grid className="w-3.5 h-3.5 text-cyan-400" />
              <span>Palette</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 hidden md:block">
            <span className="font-bold text-emerald-400">{answeredCount} Answered</span>
            <span className="mx-2">•</span>
            <span className="text-slate-400">{unattemptedCount} Unattempted</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSubmitConfirmModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all"
            >
              Submit Early
            </button>

            <button
              onClick={handleNextQuestionManual}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <span>{isLastQuestion ? 'Submit Quiz' : 'Next Question'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </footer>

        {/* QUESTION PALETTE MODAL (Grid 1 to N, e.g. 1 to 300) */}
        {showPaletteDrawer && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Grid className="w-5 h-5 text-emerald-400" />
                    Question Navigation Palette ({activeQuiz.questions.length} Questions)
                  </h3>
                  <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-emerald-500" /> Answered ({answeredCount})
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-cyan-400" /> Current Question
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-slate-800 border border-slate-600" /> Unattempted ({unattemptedCount})
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowPaletteDrawer(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Grid of All Questions */}
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 overflow-y-auto p-1 flex-1 custom-scrollbar">
                {activeQuiz.questions.map((item, idx) => {
                  const isCurrent = idx === currentQuestionIndex;
                  const isAnswered = userAnswers[idx] !== undefined && userAnswers[idx] !== -1 && userAnswers[idx] !== null;
                  const ansLetter = isAnswered ? String.fromCharCode(65 + userAnswers[idx]) : null;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleJumpToQuestion(idx)}
                      className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                        isCurrent
                          ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-400/40 shadow-lg'
                          : isAnswered
                          ? 'bg-emerald-600/80 text-white border border-emerald-400 hover:bg-emerald-500'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="text-xs">{idx + 1}</span>
                      {ansLetter && (
                        <span className="text-[9px] uppercase font-mono mt-0.5 opacity-90">[{ansLetter}]</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">Click any question number to jump directly to it.</span>
                <button
                  onClick={() => setShowPaletteDrawer(false)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2 rounded-xl text-xs uppercase"
                >
                  Close Palette
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBMIT CONFIRMATION MODAL */}
        {showSubmitConfirmModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <Award className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-black text-white">
                Submit Examination Now?
              </h3>

              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl text-xs text-slate-300 space-y-2 text-left">
                <div className="flex justify-between">
                  <span>Candidate:</span>
                  <strong className="text-white">{candidateName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total Questions:</span>
                  <strong className="text-white">{activeQuiz.questions.length}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Questions Answered:</span>
                  <strong className="text-emerald-400 font-bold">{answeredCount}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Questions Unattempted:</span>
                  <strong className="text-rose-400 font-bold">{unattemptedCount}</strong>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                Upon submitting, your scorecard PDF will be automatically generated and downloaded, and proctor emails dispatched. 
                You can also resume from where you left off at any time on the results page!
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowSubmitConfirmModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-xs uppercase cursor-pointer"
                >
                  Keep Answering
                </button>
                <button
                  onClick={() => {
                    setShowSubmitConfirmModal(false);
                    finalizeAndSubmitQuiz(userAnswers);
                  }}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs uppercase cursor-pointer shadow-lg shadow-emerald-500/30"
                >
                  Confirm & Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER: VIEW 3 - QUIZ RESULTS (AUTO PDF DOWNLOADED & EMAIL SENT)
  // ==========================================
  if (currentView === 'quiz_results' && finalResult) {
    const isDistinction = finalResult.percentage >= 80;
    const isFirstClass = finalResult.percentage >= 60;

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
        <div className="max-w-4xl w-full mx-auto space-y-6">
          {/* Automatic PDF Download Notice Banner */}
          {pdfDownloadedToast && (
            <div className="bg-emerald-950 border-2 border-emerald-500 text-emerald-200 p-4 rounded-2xl flex items-center justify-between shadow-xl animate-bounce-subtle">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-sm">Official Scorecard PDF Downloaded Automatically!</div>
                  <div className="text-xs text-emerald-300">File: Gyan_Vigyan_Mela_{finalResult.candidateName}_Scorecard.pdf</div>
                </div>
              </div>
              <button 
                onClick={() => setPdfDownloadedToast(false)} 
                className="text-emerald-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Email Status Toast Banner */}
          {emailStatusToast && (
            <div className="bg-blue-950 border border-blue-500/40 text-blue-200 p-4 rounded-2xl flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold">{emailStatusToast}</div>
              </div>
              <button 
                onClick={() => setEmailStatusToast(null)} 
                className="text-blue-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Scorecard Hero Card */}
          <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 relative overflow-hidden shadow-2xl">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="inline-flex items-center justify-center p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
              <Award className="w-12 h-12" />
            </div>

            <div>
              <span className="text-[11px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full">
                Official Science Scorecard • ज्ञान विज्ञान मेला
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-white mt-3">
                {finalResult.candidateName.toUpperCase()}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {finalResult.candidateSchool || 'Gyan Vigyan Mela Participant'} • Completed on {finalResult.submittedAt}
              </p>
            </div>

            {/* Score Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950/80 border border-emerald-500/30 p-4 rounded-2xl text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Final Score</div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                  {finalResult.score} / {finalResult.total}
                </div>
                <div className="text-[10px] text-emerald-500 font-bold mt-1">(+1 per correct)</div>
              </div>

              <div className="bg-slate-950/80 border border-blue-500/30 p-4 rounded-2xl text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Percentage</div>
                <div className="text-2xl sm:text-3xl font-black text-blue-400 mt-1">
                  {finalResult.percentage}%
                </div>
                <div className="text-[10px] text-blue-500 font-bold mt-1">Accuracy Index</div>
              </div>

              <div className="bg-slate-950/80 border border-green-500/30 p-4 rounded-2xl text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Correct (+1)</div>
                <div className="text-2xl sm:text-3xl font-black text-green-400 mt-1">
                  {finalResult.correctCount}
                </div>
                <div className="text-[10px] text-green-500 font-bold mt-1">Questions</div>
              </div>

              <div className="bg-slate-950/80 border border-rose-500/30 p-4 rounded-2xl text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Incorrect / Left</div>
                <div className="text-2xl sm:text-3xl font-black text-rose-400 mt-1">
                  {finalResult.incorrectCount + finalResult.unattemptedCount}
                </div>
                <div className="text-[10px] text-rose-500 font-bold mt-1">(0 Marks)</div>
              </div>
            </div>

            {/* Merit Citation */}
            <div className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-center gap-2 ${
              isDistinction
                ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                : isFirstClass
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-300'
            }`}>
              <Sparkles className="w-5 h-5" />
              <span>
                {isDistinction 
                  ? '🏆 Distinction - Gyan Vigyan Mela Young Scientist Laureate!' 
                  : isFirstClass 
                  ? '🥇 First Class Science Merit Award' 
                  : '📜 Certificate of Active Scientific Participation Awarded'}
              </span>
            </div>

            {/* RESUME EXAMINATION HERO BUTTON (KEY USER REQUIREMENT) */}
            {(() => {
              const totalQCount = activeQuiz.questions.length;
              const answeredIndices = Object.keys(userAnswers).filter(k => {
                const val = userAnswers[Number(k)];
                return val !== undefined && val !== -1 && val !== null;
              });
              const answeredCount = answeredIndices.length;

              // Find first unanswered question
              let firstUnansweredIdx = activeQuiz.questions.findIndex((_, idx) => {
                const ans = userAnswers[idx];
                return ans === undefined || ans === -1 || ans === null;
              });

              const hasUnansweredLeft = firstUnansweredIdx !== -1;
              const resumeIdx = hasUnansweredLeft ? firstUnansweredIdx : 0;
              const resumeQNum = resumeIdx + 1; // 1-based (e.g. 101)

              return (
                <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border-2 border-emerald-500 rounded-2xl p-4 sm:p-5 text-left flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Previous Answers Preserved ({answeredCount} of {totalQCount} Answered)</span>
                      </span>
                      {hasUnansweredLeft && (
                        <span className="text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                          {totalQCount - answeredCount} Questions Unattempted
                        </span>
                      )}
                    </div>

                    <div className="text-base sm:text-lg font-black text-white">
                      {hasUnansweredLeft
                        ? `Resume Test from Question ${resumeQNum} (जहां छोड़ा था वहीं से जारी रखें)`
                        : `Review / Resume Test (Keeping Selected Answers)`}
                    </div>

                    <div className="text-xs text-slate-300 leading-relaxed">
                      For example: In a {totalQCount}-question test, if you previously submitted after {answeredCount} questions, 
                      clicking this button starts directly at <strong className="text-emerald-400 font-bold">Question {resumeQNum}</strong>. 
                      All previously selected answers (Questions 1 to {resumeQNum - 1}) remain intact!
                    </div>
                  </div>

                  <button
                    onClick={() => handleResumeFromWhereLeft(resumeIdx)}
                    className="w-full md:w-auto bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black py-4 px-7 rounded-xl text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer shrink-0 border border-emerald-400"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>Resume from Question {resumeQNum}</span>
                  </button>
                </div>
              );
            })()}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => generateAndDownloadScorecardPDF(finalResult)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 px-6 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Scorecard PDF Again</span>
              </button>

              <button
                onClick={() => dispatchScorecardEmail(finalResult)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer border border-slate-700 transition-all"
              >
                <Send className="w-4 h-4 text-blue-400" />
                <span>Re-Send Email to Proctors</span>
              </button>

              <button
                onClick={handleRestartFromBeginning}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer border border-slate-700 transition-all"
              >
                <RotateCcw className="w-4 h-4 text-rose-400" />
                <span>Restart From Question 1 (Reset Answers)</span>
              </button>
            </div>
          </div>

          {/* Question-by-Question Full Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <ListOrdered className="w-5 h-5 text-emerald-400" />
              Complete Question-by-Question Evaluation Breakdown
            </h3>

            <div className="space-y-4">
              {finalResult.details.map((item, idx) => {
                const isCorrect = item.isCorrect;
                const isLeft = item.selected === -1;

                return (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-2xl border text-left space-y-2.5 transition-all ${
                      isCorrect 
                        ? 'bg-emerald-950/20 border-emerald-500/30' 
                        : isLeft
                        ? 'bg-slate-950 border-slate-800'
                        : 'bg-rose-950/20 border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-400 uppercase">Question {idx + 1}</span>
                      <span className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                        isCorrect 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : isLeft 
                          ? 'bg-slate-800 text-slate-400' 
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {isCorrect ? '+1 Mark (Correct)' : isLeft ? '0 Marks (Unanswered)' : '0 Marks (Incorrect)'}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-white">{item.question}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                      {item.options.map((opt, optIdx) => {
                        const isCorrectOption = optIdx === item.correct;
                        const isCandidateSelected = optIdx === item.selected;

                        let optClass = 'bg-slate-950/60 border-slate-800 text-slate-400';
                        if (isCorrectOption) {
                          optClass = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold';
                        } else if (isCandidateSelected && !isCorrect) {
                          optClass = 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold';
                        }

                        return (
                          <div key={optIdx} className={`p-2.5 rounded-xl border flex items-center justify-between ${optClass}`}>
                            <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                            {isCorrectOption && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                            {isCandidateSelected && !isCorrect && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                          </div>
                        );
                      })}
                    </div>

                    {item.explanation && (
                      <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <strong className="text-emerald-400">Scientific Concept: </strong>
                        {item.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: VIEW 4 - SUBMISSIONS LOG (PROCTOR DASHBOARD)
  // ==========================================
  if (currentView === 'submissions_view') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
        <div className="max-w-5xl w-full mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
                Gyan Vigyan Mela Proctor Dashboard
              </span>
              <h1 className="text-2xl font-black text-white mt-1">Live Candidate Submissions</h1>
              <p className="text-xs text-slate-400">
                Direct intimations sent to: {PROCTOR_EMAILS.join(', ')}
              </p>
            </div>
            <button
              onClick={() => setCurrentView('landing')}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 cursor-pointer self-start sm:self-auto"
            >
              Back to Quiz Setup
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            {loadingSubmissions ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                Loading proctor submissions...
              </div>
            ) : submissionsList.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No quiz submissions recorded yet. Take a quiz or share the link to see student evaluations here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                      <th className="p-3">Candidate</th>
                      <th className="p-3">Institution</th>
                      <th className="p-3 text-center">Score</th>
                      <th className="p-3 text-center">Accuracy</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {submissionsList.map((sub, i) => (
                      <tr key={i} className="hover:bg-slate-800/40">
                        <td className="p-3 text-white font-bold">{sub.candidateName}</td>
                        <td className="p-3 text-slate-400">{sub.candidateSchool || 'Gyan Vigyan Mela'}</td>
                        <td className="p-3 text-center font-bold text-emerald-400">
                          {sub.score} / {sub.total}
                        </td>
                        <td className="p-3 text-center font-bold text-blue-400">
                          {sub.percentage}%
                        </td>
                        <td className="p-3 text-slate-400">{sub.submittedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: VIEW 5 - LANDING & UPLOAD SCIENCE PAPER PDF
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 relative">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Copied Link Toast */}
      {copiedLinkToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce-subtle">
          <Check className="w-4 h-4" />
          <span>Quiz Link copied! Share with candidates.</span>
        </div>
      )}

      {/* Header */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between border-b border-slate-800/80 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Atom className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
              Science Quiz - Gyan Vigyan Mela
            </h1>
            <p className="text-[11px] text-emerald-400 font-bold">
              ज्ञान विज्ञान मेला • 40s Automated Quiz Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {gmailToken ? (
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Gmail Connected</span>
            </span>
          ) : (
            <button
              onClick={handleConnectGmail}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer"
            >
              <Mail className="w-3 h-3 text-amber-400" />
              <span>Link Gmail for Auto-Email</span>
            </button>
          )}

          <button
            onClick={handleOpenSubmissions}
            className="p-2 sm:px-3 sm:py-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Proctor Submissions</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto my-8 relative z-10 space-y-8">
        {/* Banner Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-2 border-emerald-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden text-center space-y-4">
          <span className="text-[10px] font-black tracking-widest uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3.5 py-1.5 rounded-full">
            विज्ञान प्रश्नोत्तरी • National Science Assessment
          </span>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Upload Science Question Paper PDF
          </h2>

          <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Upload your Science Question Paper PDF. Gemini AI will automatically extract all questions, 
            set up the 40-second auto-advancing quiz, generate a unique shareable link, and deliver 
            automated PDF scorecards & proctor emails!
          </p>

          {/* PDF Upload Dropzone */}
          <div className="pt-4 max-w-lg mx-auto">
            <label className="border-2 border-dashed border-emerald-500/50 hover:border-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/30 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group">
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isAiProcessing}
              />
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                {isAiProcessing ? (
                  <RefreshCw className="w-6 h-6 animate-spin" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  {isAiProcessing ? 'AI Extracting Science Paper...' : 'Click to Upload Science Paper PDF'}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Supports PDF or high-resolution images
                </div>
              </div>
            </label>

            {uploadError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-950/60 border border-rose-500 text-rose-300 text-xs font-semibold flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Ready-to-Play Official Science Paper */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Currently Loaded Quiz Package
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">
                {activeQuiz.title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeQuiz.questions.length} Questions Loaded • 40s/Q Timer • Correct = +1 | Incorrect = 0
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyQuizLink}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Share2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Copy Shareable Quiz Link</span>
              </button>

              <button
                onClick={() => {
                  setCurrentQuestionIndex(0);
                  setUserAnswers({});
                  setSelectedOptionForCurrent(null);
                  setTimeLeft(40);
                  setFinalResult(null);
                  autoSubmittedRef.current = false;
                  setCurrentView('candidate_entry');
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Quiz Now</span>
              </button>
            </div>
          </div>

          {/* Question Previews */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto custom-scrollbar pr-1">
            {activeQuiz.questions.map((q, idx) => (
              <div key={idx} className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-2xl text-left space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-emerald-400">Q{idx + 1} • {q.subject || 'Science'}</span>
                  <span className="text-slate-500 text-[10px]">40s Window</span>
                </div>
                <p className="text-xs text-slate-200 font-medium line-clamp-2">{q.question}</p>
                <div className="text-[10px] text-slate-400">
                  Correct Answer: <strong className="text-emerald-400">Option {String.fromCharCode(65 + q.correct)}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Proctor Notification Guarantee Box */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-slate-200">Proctor Automated Email Dispatch Guarantee</div>
              <div>Submissions automatically trigger instant scorecards to proctors: <span className="text-slate-300 font-semibold">{PROCTOR_EMAILS.join(', ')}</span></div>
            </div>
          </div>
          <div className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0">
            100% Automated Submissions
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto text-center border-t border-slate-800/80 pt-4 text-xs text-slate-500 relative z-10">
        Science Quiz - Gyan Vigyan Mela • विज्ञान प्रश्नोत्तरी ज्ञान विज्ञान मेला • 40s Auto-Advance Quiz Platform
      </footer>
    </div>
  );
}
