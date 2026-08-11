import React, { useState, useEffect, useRef, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Lock, 
  ArrowLeft,
  ChevronLeft,
  TrendingUp,
  Video, 
  FileText, 
  HelpCircle, 
  Plus, 
  LogOut, 
  ChevronRight, 
  MessageSquare, 
  Send,
  UserPlus,
  LayoutDashboard,
  GraduationCap,
  Search,
  X,
  Loader2,
  AlertCircle,
  Download,
  Monitor,
  RefreshCw,
  AlertTriangle,
  Zap,
  Smartphone,
  Info,
  Clock,
  CheckCircle2,
  Calculator,
  Menu,
  Mail,
  Upload
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  addDoc, 
  deleteDoc,
  onSnapshot, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import firebaseConfig from './firebase-applet-config.json';

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
const auth = getAuth(app);
const storage = getStorage(app);

// Sign in anonymously to allow Firebase operations
signInAnonymously(auth).catch(err => console.error("Anonymous auth failed:", err));

// --- Types ---
type UserRole = 'main-admin' | 'teacher' | 'student';

interface UserData {
  uid: string;
  name: string;
  role: UserRole;
  email?: string;
  studentId?: string;
  teacherId?: string;
  class?: string;
  classes?: string[];
  subjects?: string[];
  mobile?: string;
  createdAt?: any;
  lastPromotionDate?: any;
}

interface Resource {
  id: string;
  type: 'video' | 'note' | 'question';
  title: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  subject: string;
  className: string;
  authorId: string;
  authorName?: string;
  createdAt?: any;
  updatedAt?: any;
}

interface Notice {
  id: string;
  type: 'school' | 'subject';
  title: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  subject?: string;
  className?: string;
  authorId: string;
  authorName?: string;
  createdAt?: any;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface LoginViewProps {
  handleLogin: (id: string, pass: string, role: UserRole) => Promise<void>;
  isUploading: boolean;
  setView: (view: 'login' | 'signup' | 'dashboard') => void;
  setSignupType: (role: UserRole) => void;
}

interface SignupViewProps {
  handleSignup: (data: any) => Promise<void>;
  setView: (view: 'login' | 'signup' | 'dashboard') => void;
  signupType: UserRole;
  isUploading: boolean;
}

interface TeacherDashboardProps {
  currentUser: UserData | null;
  setCurrentUser: (user: UserData | null) => void;
  resources: Resource[];
  notices: Notice[];
  handleDeleteResource: (id: string) => void;
  handleDeleteNotice: (id: string) => void;
  setShowResourceForm: (show: boolean) => void;
  setShowNoticeForm: (show: boolean) => void;
  setSelectedResource: (res: Resource | null) => void;
  setEditingResource: (res: Resource | null) => void;
  setResourceForm: (form: any) => void;
  activeTab: 'video' | 'note' | 'question' | 'notice' | 'profile' | 'users' | 'ai-plan' | 'ai-test';
  setActiveTab: (tab: 'video' | 'note' | 'question' | 'notice' | 'profile' | 'users' | 'ai-plan' | 'ai-test') => void;
}

interface StudentDashboardProps {
  currentUser: UserData | null;
  setCurrentUser: (user: UserData | null) => void;
  resources: Resource[];
  notices: Notice[];
  studentView: 'main' | 'school' | 'self-study' | 'cuet-practice';
  setStudentView: (view: 'main' | 'school' | 'self-study' | 'cuet-practice') => void;
  activeTab: 'video' | 'note' | 'question' | 'notice' | 'profile' | 'users' | 'ai-plan' | 'ai-test';
  setActiveTab: (tab: 'video' | 'note' | 'question' | 'notice' | 'profile' | 'users' | 'ai-plan' | 'ai-test') => void;
  selectedSubjectFilter: string | null;
  setSelectedSubjectFilter: (sub: string | null) => void;
  setSelectedResource: (res: Resource | null) => void;
  handleAiAsk: (type: 'chat' | 'plan' | 'test' | 'evaluate', input: string) => Promise<void>;
  isAiLoading: boolean;
  aiPlan: string | null;
  setAiPlan: (plan: string | null) => void;
  currentTest: any | null;
  setCurrentTest: (test: any | null) => void;
  testAnswers: Record<string, string>;
  setTestAnswers: (answers: Record<string, string>) => void;
  testResult: any | null;
  setTestResult: (result: any | null) => void;
  cuetStatus: 'upload' | 'instructions' | 'exam' | 'terminated' | 'finished' | 'nest-login' | 'nest-instructions' | 'nest-other-instructions';
  setCuetStatus: (status: 'upload' | 'instructions' | 'exam' | 'terminated' | 'finished' | 'nest-login' | 'nest-instructions' | 'nest-other-instructions') => void;
  cuetQuestions: any[];
  setCuetQuestions: (qs: any[]) => void;
  cuetAnswers: Record<number, string>;
  setCuetAnswers: (as: Record<number, string>) => void;
  cuetTimeLeft: number;
  setCuetTimeLeft: (t: number | ((prev: number) => number)) => void;
  cuetIsLocked: boolean;
  setCuetIsLocked: (l: boolean) => void;
  cuetResult: any;
  setCuetResult: (r: any) => void;
  handleCuetImageUpload: (file: File) => Promise<void>;
}

interface MainAdminDashboardProps {
  currentUser: UserData | null;
  setCurrentUser: (user: UserData | null) => void;
  users: UserData[];
  resources: Resource[];
  notices: Notice[];
  handleDeleteUser: (id: string) => void;
  handleDeleteResource: (id: string) => void;
  handleDeleteNotice: (id: string) => void;
  setShowResourceForm: (show: boolean) => void;
  setShowNoticeForm: (show: boolean) => void;
  activeTab: 'video' | 'note' | 'question' | 'notice' | 'profile' | 'users' | 'ai-plan' | 'ai-test';
  setActiveTab: (tab: 'video' | 'note' | 'question' | 'notice' | 'profile' | 'users' | 'ai-plan' | 'ai-test') => void;
  adminUserTab: 'students' | 'teachers';
  setAdminUserTab: (tab: 'students' | 'teachers') => void;
  setSelectedResource: (res: Resource | null) => void;
  setEditingResource: (res: Resource | null) => void;
  setResourceForm: (form: any) => void;
  handlePromoteAllStudents: () => Promise<void>;
}

interface DashboardViewProps {
  currentUser: UserData | null;
  setCurrentUser: (user: UserData | null) => void;
  handleLogout: () => void;
  showResourceForm: boolean;
  setShowResourceForm: (show: boolean) => void;
  showNoticeForm: boolean;
  setShowNoticeForm: (show: boolean) => void;
  users: UserData[];
  resources: Resource[];
  notices: Notice[];
  handleDeleteUser: (id: string) => void;
  handleDeleteResource: (id: string) => void;
  handleDeleteNotice: (id: string) => void;
  studentView: 'main' | 'school' | 'self-study' | 'cuet-practice';
  setStudentView: (view: 'main' | 'school' | 'self-study' | 'cuet-practice') => void;
  activeTab: 'video' | 'note' | 'question' | 'notice' | 'profile' | 'users' | 'ai-plan' | 'ai-test';
  setActiveTab: (tab: 'video' | 'note' | 'question' | 'notice' | 'profile' | 'users' | 'ai-plan' | 'ai-test') => void;
  selectedSubjectFilter: string | null;
  setSelectedSubjectFilter: (sub: string | null) => void;
  onSelectResource: (res: Resource) => void;
  adminUserTab: 'students' | 'teachers';
  setAdminUserTab: (tab: 'students' | 'teachers') => void;
  setSelectedResource: (res: Resource | null) => void;
  setEditingResource: (res: Resource | null) => void;
  setResourceForm: (form: any) => void;
  setShowAiHelper: (show: boolean) => void;
  handleAiAsk: (type: 'chat' | 'plan' | 'test' | 'evaluate', input: string) => Promise<void>;
  isAiLoading: boolean;
  aiPlan: string | null;
  setAiPlan: (plan: string | null) => void;
  currentTest: any | null;
  setCurrentTest: (test: any | null) => void;
  testAnswers: Record<string, string>;
  setTestAnswers: (answers: Record<string, string>) => void;
  testResult: any | null;
  setTestResult: (result: any | null) => void;
  handlePromoteAllStudents: () => Promise<void>;
  cuetStatus: 'upload' | 'instructions' | 'exam' | 'terminated' | 'finished' | 'nest-login' | 'nest-instructions' | 'nest-other-instructions';
  setCuetStatus: (status: 'upload' | 'instructions' | 'exam' | 'terminated' | 'finished' | 'nest-login' | 'nest-instructions' | 'nest-other-instructions') => void;
  cuetQuestions: any[];
  setCuetQuestions: (qs: any[]) => void;
  cuetAnswers: Record<number, string>;
  setCuetAnswers: (as: Record<number, string>) => void;
  cuetTimeLeft: number;
  setCuetTimeLeft: (t: number | ((prev: number) => number)) => void;
  cuetIsLocked: boolean;
  setCuetIsLocked: (l: boolean) => void;
  cuetResult: any;
  setCuetResult: (r: any) => void;
  handleCuetImageUpload: (file: File) => Promise<void>;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
  }
}

// --- Error Handling ---
const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
};

// --- Error Boundary ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, errorMsg: string }> {
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h2>
            <p className="text-slate-500 mb-6">We encountered an error. Please try refreshing the page.</p>
            <div className="bg-red-50 p-4 rounded-xl text-left mb-6 overflow-auto max-h-40">
              <code className="text-xs text-red-600">{this.state.errorMsg}</code>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold"
            >
              Refresh App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Constants ---
const MAIN_ADMIN_EMAIL = "pt6173309@gmail.com";
const ALL_CLASSES = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
const CLASS_SUBJECTS: Record<string, string[]> = {
  'Class 6': ['Mathematics', 'Science', 'English', 'Social Science', 'Hindi', 'General Knowledge', 'Moral Science', 'Art', 'Music', 'Computer'],
  'Class 7': ['Mathematics', 'Science', 'English', 'Social Science', 'Hindi', 'General Knowledge', 'Moral Science', 'Art', 'Music', 'Computer'],
  'Class 8': ['Mathematics', 'Science', 'English', 'Social Science', 'Hindi', 'General Knowledge', 'Moral Science', 'Art', 'Music', 'Computer'],
  'Class 9': ['Mathematics', 'Science', 'English', 'Social Science', 'Hindi', 'Physical Education', 'Sanskrit', 'Computer'],
  'Class 10': ['Mathematics', 'Science', 'English', 'Social Science', 'Hindi', 'Physical Education', 'Sanskrit', 'Computer'],
  'Class 11': ['Mathematics', 'Science', 'English', 'Social Science', 'Hindi', 'Physical Education', 'Sanskrit', 'Computer'],
  'Class 12': ['Mathematics', 'Science', 'English', 'Social Science', 'Hindi', 'Physical Education', 'Sanskrit', 'Computer'],
};
const ALL_SUBJECTS = [
  'Mathematics', 'Science', 'English', 'Social Science', 'Hindi', 
  'Physical Education', 'Sanskrit', 'General Knowledge', 'Moral Science', 
  'Art', 'Music', 'Computer'
];

// --- Helper Components ---
interface ResourceCardProps {
  resource: Resource;
  onEdit?: () => void;
  onDelete?: () => void;
  setSelectedResource: (res: Resource | null) => void;
}

const ResourceCard = ({ resource, onEdit, onDelete, setSelectedResource }: ResourceCardProps) => (
  <motion.div 
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="glass-panel p-4 sm:p-5 rounded-2xl border border-white/10 hover:border-cyber-blue/30 transition-all group relative overflow-hidden"
  >
    <div className="flex justify-between items-start mb-3">
      <div className={`p-2 rounded-lg ${resource.type === 'video' ? 'bg-red-500/10 text-red-400' : resource.type === 'note' ? 'bg-cyber-blue/10 text-cyber-blue' : 'bg-amber-500/10 text-amber-400'}`}>
        {resource.type === 'video' && <Video className="w-4 h-4 sm:w-5 sm:h-5" />}
        {resource.type === 'note' && <FileText className="w-4 h-4 sm:w-5 sm:h-5" />}
        {resource.type === 'question' && <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[8px] sm:text-[10px] font-orbitron font-bold uppercase tracking-wider text-white/40">{resource.className} • {resource.subject}</span>
        <span className="text-[8px] sm:text-[9px] font-rajdhani font-bold text-white/20 mt-1 uppercase tracking-widest">By {resource.authorName}</span>
      </div>
    </div>
    <h4 className="font-orbitron font-bold text-white text-sm sm:text-lg mb-2 line-clamp-1 tracking-tight">{resource.title}</h4>
    
    {resource.fileName && (
      <div className="flex items-center gap-2 mb-3 text-cyber-blue/60">
        <FileText className="w-3 h-3" />
        <span className="text-[10px] font-rajdhani font-bold truncate">{resource.fileName}</span>
      </div>
    )}

    <div className="flex gap-2 mt-4">
      {resource.type === 'video' ? (
        <a 
          href={resource.content} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 bg-white/10 text-white rounded-xl text-[10px] sm:text-sm font-orbitron font-bold hover:bg-white/20 transition-all border border-white/10 uppercase tracking-tighter"
        >
          Watch
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </a>
      ) : (
        <div className="flex-1 flex gap-2">
          <button 
            onClick={() => setSelectedResource(resource)}
            className="flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 bg-cyber-blue text-black rounded-xl text-[10px] sm:text-sm font-orbitron font-black hover:bg-white transition-all uppercase tracking-tighter"
          >
            Read
            <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
          {resource.fileUrl && (
            <a 
              href={resource.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 flex items-center justify-center bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all border border-white/10"
              title="Download Attachment"
            >
              <Plus className="w-4 h-4" />
            </a>
          )}
        </div>
      )}
      {(onEdit || onDelete) && (
        <div className="flex gap-1">
          {onEdit && (
            <button onClick={onEdit} className="p-2 text-white/40 hover:text-cyber-blue hover:bg-cyber-blue/10 rounded-lg transition-all border border-transparent hover:border-cyber-blue/20">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 rotate-45" />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/20">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  </motion.div>
);

const NoticeCard = ({ notice, onDelete }: { notice: Notice, onDelete?: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="glass-panel p-4 sm:p-5 rounded-2xl border-l-4 border-l-cyber-blue border-white/10 shadow-sm"
  >
    <div className="flex justify-between items-start mb-2">
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded text-[8px] sm:text-[10px] font-orbitron font-bold uppercase tracking-widest ${notice.type === 'school' ? 'bg-cyber-purple/20 text-cyber-purple' : 'bg-cyber-blue/20 text-cyber-blue'}`}>
          {notice.type === 'school' ? 'School Wide' : notice.subject}
        </span>
        <span className="text-[8px] sm:text-[10px] font-rajdhani font-bold text-white/30 uppercase tracking-widest">{new Date(notice.createdAt?.toDate()).toLocaleDateString()}</span>
      </div>
      {onDelete && (
        <button onClick={onDelete} className="text-white/20 hover:text-red-400 transition-all">
          <X className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      )}
    </div>
    <h4 className="font-orbitron font-bold text-white mb-1 text-sm sm:text-base tracking-tight">{notice.title}</h4>
    <p className="text-xs sm:text-sm text-white/60 font-rajdhani leading-relaxed whitespace-pre-wrap">{notice.content}</p>
    
    {notice.fileUrl && (
      <a 
        href={notice.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-orbitron font-bold text-cyber-purple hover:bg-white/10 transition-all uppercase tracking-widest"
      >
        <FileText className="w-3 h-3" />
        View Attachment: {notice.fileName}
      </a>
    )}

    <div className="mt-3 text-[8px] sm:text-[10px] text-white/30 font-rajdhani font-bold uppercase tracking-widest">— {notice.authorName}</div>
  </motion.div>
);

const ResourceModal = ({ resource, onClose }: { resource: Resource, onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel w-full max-w-2xl max-h-[90vh] rounded-[40px] border border-white/10 flex flex-col overflow-hidden"
    >
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${resource.type === 'video' ? 'bg-red-500/10 text-red-400' : resource.type === 'note' ? 'bg-cyber-blue/10 text-cyber-blue' : 'bg-amber-500/10 text-amber-400'}`}>
            {resource.type === 'video' && <Video className="w-5 h-5" />}
            {resource.type === 'note' && <FileText className="w-5 h-5" />}
            {resource.type === 'question' && <HelpCircle className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-orbitron font-black text-white tracking-tighter uppercase">{resource.title}</h3>
            <p className="text-[10px] font-rajdhani font-bold text-white/40 uppercase tracking-widest">{resource.subject} • {resource.className}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
        <div className="prose prose-invert max-w-none">
          <div className="text-white/80 font-rajdhani text-base sm:text-lg leading-relaxed">
            <ReactMarkdown>
              {resource.content}
            </ReactMarkdown>
          </div>
        </div>
        {resource.fileUrl && (
          <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5 text-cyber-blue" />
              <div>
                <p className="text-xs font-orbitron font-bold text-white uppercase tracking-wider">Attachment</p>
                <p className="text-[10px] font-rajdhani font-bold text-white/40">{resource.fileName || 'Resource File'}</p>
              </div>
            </div>
            <a 
              href={resource.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-cyber-blue text-black rounded-xl font-orbitron font-black text-xs hover:bg-white transition-all uppercase tracking-tighter"
            >
              Download
            </a>
          </div>
        )}
      </div>
      <div className="p-4 bg-white/5 border-t border-white/10 text-center">
        <p className="text-[10px] font-rajdhani font-bold text-white/20 uppercase tracking-[0.3em]">Neural Resource Interface</p>
      </div>
    </motion.div>
  </div>
);

const NoticeModal = ({ notice, onClose }: { notice: Notice, onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel w-full max-w-xl rounded-[40px] border border-white/10 flex flex-col overflow-hidden"
    >
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${notice.type === 'school' ? 'bg-cyber-purple/10 text-cyber-purple' : 'bg-cyber-blue/10 text-cyber-blue'}`}>
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-orbitron font-black text-white tracking-tighter uppercase">{notice.title}</h3>
            <p className="text-[10px] font-rajdhani font-bold text-white/40 uppercase tracking-widest">{notice.type === 'school' ? 'School Wide' : notice.subject}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
        <p className="text-white/80 font-rajdhani text-base sm:text-lg leading-relaxed whitespace-pre-wrap mb-6">
          {notice.content}
        </p>
        {notice.fileUrl && (
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-cyber-purple" />
              <div>
                <p className="text-xs font-orbitron font-bold text-white uppercase tracking-wider">Official Document</p>
                <p className="text-[10px] font-rajdhani font-bold text-white/40">{notice.fileName || 'Notice Attachment'}</p>
              </div>
            </div>
            <a 
              href={notice.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-cyber-purple text-white rounded-xl font-orbitron font-black text-xs hover:bg-white hover:text-black transition-all uppercase tracking-tighter"
            >
              View
            </a>
          </div>
        )}
        <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
          <div className="text-[10px] font-rajdhani font-bold text-white/30 uppercase tracking-widest">
            Posted: {new Date(notice.createdAt?.toDate()).toLocaleDateString()}
          </div>
          <div className="text-[10px] font-rajdhani font-bold text-white/30 uppercase tracking-widest">
            By: {notice.authorName}
          </div>
        </div>
      </div>
    </motion.div>
  </div>
);


const ResourceForm = ({ 
  onClose, 
  isUploading, 
  resourceForm, 
  setResourceForm, 
  handleAddResource, 
  editingResource, 
  currentUser, 
  selectedFile, 
  setSelectedFile 
}: { 
  onClose: () => void, 
  isUploading: boolean, 
  resourceForm: any, 
  setResourceForm: (form: any) => void, 
  handleAddResource: () => void,
  editingResource: Resource | null,
  currentUser: UserData | null,
  selectedFile: File | null,
  setSelectedFile: (file: File | null) => void
}) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="glass-panel w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border-cyber-blue/20"
    >
      <div className="p-4 sm:p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
        <h3 className="text-lg sm:text-xl font-orbitron font-black text-white tracking-tighter uppercase">{editingResource ? 'Edit Resource' : 'Add New Resource'}</h3>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-white/40"><X className="w-5 h-5 sm:w-6 sm:h-6" /></button>
      </div>
      <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-orbitron font-bold text-cyber-blue/60 uppercase tracking-widest">Resource Type</label>
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
              {(['video', 'note', 'question'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setResourceForm({ ...resourceForm, type: t })}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-orbitron font-bold transition-all uppercase tracking-wider ${resourceForm.type === t ? 'bg-cyber-blue text-black shadow-[0_0_10px_rgba(0,243,255,0.3)]' : 'text-white/40 hover:text-white/60'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-orbitron font-bold text-cyber-blue/60 uppercase tracking-widest">Class</label>
            <select 
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl outline-none text-white font-rajdhani"
              value={resourceForm.className}
              onChange={(e) => setResourceForm({ ...resourceForm, className: e.target.value })}
            >
              <option value="" className="bg-slate-900">Select Class</option>
              {currentUser?.role === 'teacher' 
                ? currentUser.classes?.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)
                : ALL_CLASSES.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)
              }
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-orbitron font-bold text-cyber-blue/60 uppercase tracking-widest">Subject</label>
          <select 
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl outline-none text-white font-rajdhani"
            value={resourceForm.subject}
            onChange={(e) => setResourceForm({ ...resourceForm, subject: e.target.value })}
          >
            <option value="" className="bg-slate-900">Select Subject</option>
            {currentUser?.role === 'teacher'
              ? currentUser.subjects?.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)
              : ALL_SUBJECTS.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)
            }
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-orbitron font-bold text-cyber-blue/60 uppercase tracking-widest">Title</label>
          <input 
            type="text"
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl outline-none text-white font-rajdhani"
            placeholder="Chapter 1: Introduction..."
            value={resourceForm.title}
            onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-orbitron font-bold text-cyber-blue/60 uppercase tracking-widest">
            {resourceForm.type === 'video' ? 'Video URL' : 'Content (Text)'}
          </label>
          <textarea 
            rows={4}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl outline-none text-white font-rajdhani"
            placeholder={resourceForm.type === 'video' ? "https://youtube.com/..." : "Enter your notes or questions here..."}
            value={resourceForm.content}
            onChange={(e) => setResourceForm({ ...resourceForm, content: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-orbitron font-bold text-cyber-blue/60 uppercase tracking-widest">Attachment (Optional)</label>
          <div className="flex items-center gap-4">
            <input 
              type="file"
              id="resource-file"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            <label 
              htmlFor="resource-file"
              className="flex-1 px-4 py-3 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-cyber-blue/50 transition-all text-center"
            >
              <span className="text-xs font-rajdhani text-white/60">
                {selectedFile ? selectedFile.name : editingResource?.fileName || 'Click to upload PDF, Image, etc.'}
              </span>
            </label>
            {selectedFile && (
              <button onClick={() => setSelectedFile(null)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <button 
          onClick={handleAddResource}
          disabled={isUploading}
          className="w-full cyber-button bg-cyber-blue text-black font-orbitron font-black py-4 rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:bg-white transition-all disabled:opacity-50 uppercase tracking-tighter"
        >
          {isUploading ? 'Syncing...' : 'Save Resource'}
        </button>
      </div>
    </motion.div>
  </div>
);

const NoticeForm = ({ 
  onClose, 
  isUploading, 
  noticeForm, 
  setNoticeForm, 
  handleAddNotice, 
  currentUser, 
  selectedFile, 
  setSelectedFile 
}: { 
  onClose: () => void, 
  isUploading: boolean, 
  noticeForm: any, 
  setNoticeForm: (form: any) => void, 
  handleAddNotice: () => void,
  currentUser: UserData | null,
  selectedFile: File | null,
  setSelectedFile: (file: File | null) => void
}) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="glass-panel w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border-cyber-purple/20"
    >
      <div className="p-4 sm:p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
        <h3 className="text-lg sm:text-xl font-orbitron font-black text-white tracking-tighter uppercase">Post New Notice</h3>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-white/40"><X className="w-5 h-5 sm:w-6 sm:h-6" /></button>
      </div>
      <div className="p-6 sm:p-8 space-y-6">
        {currentUser?.role === 'main-admin' && (
          <div className="space-y-2">
            <label className="text-[10px] font-orbitron font-bold text-cyber-purple/60 uppercase tracking-widest">Notice Type</label>
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
              {(['school', 'subject'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setNoticeForm({ ...noticeForm, type: t })}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-orbitron font-bold transition-all uppercase tracking-wider ${noticeForm.type === t ? 'bg-cyber-purple text-white shadow-[0_0_10px_rgba(157,0,255,0.3)]' : 'text-white/40 hover:text-white/60'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {(noticeForm.type === 'subject' || currentUser?.role === 'teacher') && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-orbitron font-bold text-cyber-purple/60 uppercase tracking-widest">Subject</label>
              <select 
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl outline-none text-white font-rajdhani"
                value={noticeForm.subject}
                onChange={(e) => setNoticeForm({ ...noticeForm, subject: e.target.value })}
              >
                <option value="" className="bg-slate-900">Select Subject</option>
                <option value="All Subjects" className="bg-slate-900">All Subjects</option>
                {currentUser?.role === 'teacher'
                  ? currentUser.subjects?.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)
                  : ALL_SUBJECTS.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)
                }
              </select>
            </div>
            {currentUser?.role === 'main-admin' && (
              <div className="space-y-2">
                <label className="text-[10px] font-orbitron font-bold text-cyber-purple/60 uppercase tracking-widest">Target Class</label>
                <select 
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl outline-none text-white font-rajdhani"
                  value={noticeForm.className}
                  onChange={(e) => setNoticeForm({ ...noticeForm, className: e.target.value })}
                >
                  <option value="" className="bg-slate-900">Select Class</option>
                  <option value="All Classes" className="bg-slate-900">All Classes</option>
                  {ALL_CLASSES.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-orbitron font-bold text-cyber-purple/60 uppercase tracking-widest">Title</label>
          <input 
            type="text"
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl outline-none text-white font-rajdhani"
            placeholder="Notice Title"
            value={noticeForm.title}
            onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-orbitron font-bold text-cyber-purple/60 uppercase tracking-widest">Message</label>
          <textarea 
            rows={3}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl outline-none text-white font-rajdhani"
            placeholder="Enter notice content..."
            value={noticeForm.content}
            onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-orbitron font-bold text-cyber-purple/60 uppercase tracking-widest">Attachment (Optional)</label>
          <div className="flex items-center gap-4">
            <input 
              type="file"
              id="notice-file"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            <label 
              htmlFor="notice-file"
              className="flex-1 px-4 py-3 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-cyber-purple/50 transition-all text-center"
            >
              <span className="text-xs font-rajdhani text-white/60">
                {selectedFile ? selectedFile.name : 'Click to upload notice file'}
              </span>
            </label>
            {selectedFile && (
              <button onClick={() => setSelectedFile(null)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <button 
          onClick={handleAddNotice}
          disabled={isUploading}
          className="w-full cyber-button bg-cyber-purple text-white font-orbitron font-black py-4 rounded-xl shadow-[0_0_20px_rgba(157,0,255,0.3)] hover:bg-white hover:text-black transition-all disabled:opacity-50 uppercase tracking-tighter"
        >
          {isUploading ? 'Broadcasting...' : 'Post Notice'}
        </button>
      </div>
    </motion.div>
  </div>
);

interface ProfileSectionProps {
  currentUser: UserData | null;
  setCurrentUser: (user: UserData | null) => void;
  resources: Resource[];
  setEditingResource: (res: Resource | null) => void;
  setResourceForm: (form: any) => void;
  setShowResourceForm: (show: boolean) => void;
  handleDeleteResource: (id: string) => void;
  setSelectedResource: (res: Resource | null) => void;
}

const ProfileSection = ({ 
  currentUser, 
  setCurrentUser, 
  resources, 
  setEditingResource, 
  setResourceForm, 
  setShowResourceForm, 
  handleDeleteResource,
  setSelectedResource
}: ProfileSectionProps) => {
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileData, setProfileData] = useState({ ...currentUser });
    const userResources = resources.filter(r => r.authorId === currentUser?.uid);

    const handleUpdateProfile = async () => {
      try {
        await setDoc(doc(db, 'users', currentUser!.uid), profileData, { merge: true });
        setCurrentUser(profileData as UserData);
        setEditingProfile(false);
        alert('Profile updated successfully!');
      } catch (error) {
        console.error('Profile update error:', error);
        alert('Failed to update profile.');
      }
    };

    const toggleMultiSelect = (field: 'classes' | 'subjects', value: string) => {
      setProfileData(prev => ({
        ...prev,
        [field]: (prev as any)[field]?.includes(value) 
          ? (prev as any)[field].filter((v: string) => v !== value)
          : [...((prev as any)[field] || []), value]
      }));
    };

    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-sm">
          <div className="flex justify-between items-start mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-orbitron font-black text-white tracking-tighter uppercase">My Profile</h3>
            <button 
              onClick={() => {
                setEditingProfile(!editingProfile);
                if (!editingProfile) setProfileData({ ...currentUser });
              }}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/5 text-white/40 rounded-xl font-orbitron font-bold text-[10px] sm:text-xs hover:text-white hover:bg-white/10 transition-all border border-white/10 uppercase tracking-widest"
            >
              {editingProfile ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="text-[10px] font-orbitron font-bold text-white/30 uppercase tracking-widest mb-1 block">Full Name</label>
                {editingProfile ? (
                  <input 
                    className="w-full px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl outline-none text-white font-rajdhani focus:border-cyber-blue/50 transition-all"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  />
                ) : (
                  <p className="font-orbitron font-bold text-white text-base sm:text-lg tracking-tight">{currentUser?.name}</p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-orbitron font-bold text-white/30 uppercase tracking-widest mb-1 block">Mobile Number</label>
                {editingProfile ? (
                  <input 
                    className="w-full px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl outline-none text-white font-rajdhani focus:border-cyber-blue/50 transition-all"
                    value={profileData.mobile}
                    onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
                  />
                ) : (
                  <p className="font-orbitron font-bold text-white text-base sm:text-lg tracking-tight">{currentUser?.mobile || 'Not Set'}</p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-orbitron font-bold text-white/30 uppercase tracking-widest mb-1 block">Neural ID</label>
                {editingProfile ? (
                  <input 
                    className="w-full px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl outline-none text-white font-rajdhani focus:border-cyber-blue/50 transition-all"
                    value={currentUser?.role === 'student' ? profileData.studentId : profileData.teacherId}
                    onChange={(e) => setProfileData({ ...profileData, [currentUser?.role === 'student' ? 'studentId' : 'teacherId']: e.target.value })}
                  />
                ) : (
                  <p className="font-orbitron font-bold text-white text-base sm:text-lg tracking-tight">{currentUser?.studentId || currentUser?.teacherId || currentUser?.email}</p>
                )}
              </div>
            </div>
            <div className="space-y-4 sm:space-y-6">
              {currentUser?.role === 'teacher' && (
                <>
                  <div>
                    <label className="text-[10px] font-orbitron font-bold text-white/30 uppercase tracking-widest mb-2 block">Specializations</label>
                    {editingProfile ? (
                      <div className="flex flex-wrap gap-2 p-2 bg-white/5 rounded-xl border border-white/10">
                        {ALL_SUBJECTS.map(s => (
                          <button
                            key={s}
                            onClick={() => toggleMultiSelect('subjects', s)}
                            className={`px-2 py-1 rounded-lg text-[8px] font-orbitron font-bold uppercase transition-all ${profileData.subjects?.includes(s) ? 'bg-cyber-purple text-white' : 'bg-white/5 text-white/40'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {currentUser.subjects?.map(s => <span key={s} className="px-3 py-1 bg-cyber-purple/20 text-cyber-purple rounded-lg text-[10px] font-orbitron font-bold uppercase tracking-widest border border-cyber-purple/20">{s}</span>)}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-orbitron font-bold text-white/30 uppercase tracking-widest mb-2 block">Assigned Sectors</label>
                    {editingProfile ? (
                      <div className="grid grid-cols-2 gap-2 p-2 bg-white/5 rounded-xl border border-white/10 max-h-32 overflow-y-auto">
                        {ALL_CLASSES.map(c => (
                          <button
                            key={c}
                            onClick={() => toggleMultiSelect('classes', c)}
                            className={`px-2 py-1 rounded-lg text-[8px] font-orbitron font-bold uppercase transition-all ${profileData.classes?.includes(c) ? 'bg-cyber-blue text-black' : 'bg-white/5 text-white/40'}`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {currentUser.classes?.map(c => <span key={c} className="px-3 py-1 bg-cyber-blue/20 text-cyber-blue rounded-lg text-[10px] font-orbitron font-bold uppercase tracking-widest border border-cyber-blue/20">{c}</span>)}
                      </div>
                    )}
                  </div>
                </>
              )}
              {currentUser?.role === 'student' && (
                <div>
                  <label className="text-[10px] font-orbitron font-bold text-white/30 uppercase tracking-widest mb-1 block">Sector / Class</label>
                  {editingProfile ? (
                    <select
                      value={profileData.class}
                      onChange={(e) => setProfileData({ ...profileData, class: e.target.value })}
                      className="w-full px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl outline-none text-white font-rajdhani focus:border-cyber-blue/50 transition-all appearance-none"
                    >
                      {ALL_CLASSES.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                    </select>
                  ) : (
                    <p className="font-orbitron font-bold text-white text-base sm:text-lg tracking-tight">{currentUser.class}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          {editingProfile && (
            <button 
              onClick={handleUpdateProfile}
              className="mt-8 w-full cyber-button bg-cyber-blue text-black font-orbitron font-black py-3 sm:py-4 rounded-xl hover:bg-white transition-all uppercase tracking-tighter text-sm sm:text-base shadow-[0_0_20px_rgba(0,243,255,0.3)]"
            >
              Sync Profile Data
            </button>
          )}
        </div>

        {currentUser?.role === 'teacher' && (
          <div className="space-y-6">
            <h3 className="text-lg sm:text-xl font-orbitron font-black text-white tracking-tighter uppercase">My Transmissions</h3>
            {ALL_CLASSES.map(className => {
              const classResources = userResources.filter(r => r.className === className);
              if (classResources.length === 0) return null;
              return (
                <div key={className} className="space-y-4">
                  <h4 className="font-orbitron font-black text-white/40 border-b border-white/10 pb-2 text-[10px] sm:text-xs uppercase tracking-[0.2em]">{className}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {classResources.map(res => (
                      <ResourceCard 
                        key={res.id} 
                        resource={res} 
                        onEdit={() => { setEditingResource(res); setResourceForm(res); setShowResourceForm(true); }}
                        onDelete={() => handleDeleteResource(res.id)}
                        setSelectedResource={setSelectedResource}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };


// --- Dashboard Components ---

const MainAdminDashboard = ({ 
  currentUser, setCurrentUser, users, resources, notices, handleDeleteUser, 
  handleDeleteResource, handleDeleteNotice, setShowResourceForm, 
  setShowNoticeForm, activeTab, setActiveTab, adminUserTab, 
  setAdminUserTab, setSelectedResource, setEditingResource, setResourceForm,
  handlePromoteAllStudents
}: MainAdminDashboardProps) => (
  <div className="space-y-6 sm:space-y-8">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
      <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-white/10 shadow-sm">
        <div className="bg-cyber-blue/20 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-4 border border-cyber-blue/20">
          <User className="text-cyber-blue w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <h4 className="text-white/40 text-[10px] font-orbitron font-bold uppercase tracking-widest">Total Users</h4>
        <p className="text-2xl sm:text-3xl font-orbitron font-black text-white tracking-tighter neon-text">{users.length}</p>
      </div>
      <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-white/10 shadow-sm">
        <div className="bg-cyber-purple/20 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-4 border border-cyber-purple/20">
          <FileText className="text-cyber-purple w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <h4 className="text-white/40 text-[10px] font-orbitron font-bold uppercase tracking-widest">Total Resources</h4>
        <p className="text-2xl sm:text-3xl font-orbitron font-black text-white tracking-tighter neon-text">{resources.length}</p>
      </div>
      <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-white/10 shadow-sm">
        <div className="bg-amber-500/20 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-4 border border-amber-500/20">
          <AlertCircle className="text-amber-400 w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <h4 className="text-white/40 text-[10px] font-orbitron font-bold uppercase tracking-widest">Active Notices</h4>
        <p className="text-2xl sm:text-3xl font-orbitron font-black text-white tracking-tighter neon-text">{notices.length}</p>
      </div>
    </div>

    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-4">
      {[
        { id: 'video', label: 'Videos', icon: Video, color: 'bg-red-500/20 text-red-400' },
        { id: 'note', label: 'Notes', icon: FileText, color: 'bg-cyber-blue/20 text-cyber-blue' },
        { id: 'question', label: 'Practice', icon: HelpCircle, color: 'bg-amber-500/20 text-amber-400' },
        { id: 'notice', label: 'Notices', icon: AlertCircle, color: 'bg-cyber-purple/20 text-cyber-purple' },
        { id: 'users', label: 'Users', icon: User, color: 'bg-emerald-500/20 text-emerald-400' },
        { id: 'profile', label: 'Profile', icon: User, color: 'bg-slate-500/20 text-slate-400' },
      ].map(box => (
        <button
          key={box.id}
          onClick={() => setActiveTab(box.id as any)}
          className={`aspect-square p-1.5 sm:p-4 rounded-xl sm:rounded-3xl border transition-all flex flex-col items-center justify-center gap-1 sm:gap-2 ${activeTab === box.id ? 'border-cyber-blue bg-cyber-blue/10 shadow-[0_0_15px_rgba(0,243,255,0.2)]' : 'glass-panel border-white/10 hover:border-white/20'}`}
        >
          <div className={`p-1 sm:p-2.5 rounded-lg sm:rounded-xl ${box.color}`}>
            <box.icon className="w-3.5 h-3.5 sm:w-6 sm:h-6" />
          </div>
          <span className="font-orbitron font-bold text-white text-[7px] sm:text-xs uppercase tracking-wider text-center leading-tight">{box.label}</span>
        </button>
      ))}
    </div>

    {activeTab === 'users' ? (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-2 sm:gap-4 p-1 bg-white/5 rounded-2xl border border-white/10 w-fit">
            <button 
              onClick={() => setAdminUserTab('students')}
              className={`px-6 py-2 rounded-xl font-orbitron font-bold transition-all text-[10px] sm:text-xs uppercase tracking-wider ${adminUserTab === 'students' ? 'bg-cyber-blue text-black shadow-[0_0_10px_rgba(0,243,255,0.3)]' : 'text-white/40 hover:text-white/60'}`}
            >
              Students
            </button>
            <button 
              onClick={() => setAdminUserTab('teachers')}
              className={`px-6 py-2 rounded-xl font-orbitron font-bold transition-all text-[10px] sm:text-xs uppercase tracking-wider ${adminUserTab === 'teachers' ? 'bg-cyber-purple text-white shadow-[0_0_10px_rgba(157,0,255,0.3)]' : 'text-white/40 hover:text-white/60'}`}
            >
              Teachers
            </button>
          </div>
          
          {adminUserTab === 'students' && (
            <button 
              onClick={handlePromoteAllStudents}
              className="cyber-button bg-amber-500 text-black font-orbitron font-bold py-2.5 px-6 rounded-xl text-[10px] sm:text-xs uppercase tracking-widest flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Promote All Students (April 1st)
            </button>
          )}
        </div>
        <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-[10px] font-orbitron font-bold text-white/40 uppercase tracking-widest">Name</th>
                  <th className="px-4 sm:px-6 py-4 text-[10px] font-orbitron font-bold text-white/40 uppercase tracking-widest">Role</th>
                  <th className="px-4 sm:px-6 py-4 text-[10px] font-orbitron font-bold text-white/40 uppercase tracking-widest">ID / Email</th>
                  <th className="px-4 sm:px-6 py-4 text-[10px] font-orbitron font-bold text-white/40 uppercase tracking-widest">Details</th>
                  <th className="px-4 sm:px-6 py-4 text-[10px] font-orbitron font-bold text-white/40 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.filter(u => adminUserTab === 'students' ? u.role === 'student' : u.role === 'teacher').map(u => (
                  <tr key={u.uid} className="hover:bg-white/5 transition-all">
                    <td className="px-4 sm:px-6 py-4 font-orbitron font-bold text-white text-xs sm:text-sm">{u.name}</td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[8px] sm:text-[10px] font-orbitron font-bold uppercase tracking-widest ${u.role === 'main-admin' ? 'bg-red-500/20 text-red-400' : u.role === 'teacher' ? 'bg-cyber-purple/20 text-cyber-purple' : 'bg-cyber-blue/20 text-cyber-blue'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-rajdhani font-bold text-white/40 uppercase tracking-widest">{u.studentId || u.teacherId || u.email}</td>
                    <td className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-rajdhani font-bold text-white/30 uppercase tracking-widest">
                      {u.role === 'student' ? u.class : u.subjects?.join(', ')}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <button onClick={() => handleDeleteUser(u.uid)} className="p-2 text-white/20 hover:text-red-400 transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    ) : activeTab === 'profile' ? (
      <ProfileSection 
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        resources={resources}
        setEditingResource={setEditingResource}
        setResourceForm={setResourceForm}
        setShowResourceForm={setShowResourceForm}
        handleDeleteResource={handleDeleteResource}
        setSelectedResource={setSelectedResource}
      />
    ) : activeTab === 'notice' ? (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg sm:text-xl font-orbitron font-black text-white tracking-tighter uppercase">All Notices</h3>
          <button onClick={() => setShowNoticeForm(true)} className="cyber-button bg-cyber-purple text-white px-4 sm:px-6 py-2 rounded-xl font-orbitron font-black flex items-center gap-2 text-[10px] sm:text-sm uppercase tracking-tighter">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Post Notice
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {notices.map(n => (
            <NoticeCard key={n.id} notice={n} onDelete={() => handleDeleteNotice(n.id)} />
          ))}
        </div>
      </div>
    ) : (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg sm:text-xl font-orbitron font-black text-white tracking-tighter uppercase capitalize">{activeTab} Resources</h3>
          <button onClick={() => setShowResourceForm(true)} className="cyber-button bg-cyber-blue text-black px-4 sm:px-6 py-2 rounded-xl font-orbitron font-black flex items-center gap-2 text-[10px] sm:text-sm uppercase tracking-tighter">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Add New
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.filter(r => r.type === activeTab).map(res => (
            <ResourceCard 
              key={res.id} 
              resource={res} 
              onDelete={() => handleDeleteResource(res.id)}
              setSelectedResource={setSelectedResource}
            />
          ))}
        </div>
      </div>
    )}
  </div>
);

const TeacherDashboard = ({ 
  currentUser, setCurrentUser, resources, notices, handleDeleteResource, 
  handleDeleteNotice, setShowResourceForm, setShowNoticeForm, 
  setSelectedResource, setEditingResource, setResourceForm, 
  activeTab, setActiveTab 
}: TeacherDashboardProps) => (
  <div className="space-y-6 sm:space-y-8">
    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-4">
      {[
        { id: 'video', label: 'Videos', icon: Video, color: 'bg-red-500/20 text-red-400' },
        { id: 'note', label: 'Notes', icon: FileText, color: 'bg-cyber-blue/20 text-cyber-blue' },
        { id: 'question', label: 'Practice', icon: HelpCircle, color: 'bg-amber-500/20 text-amber-400' },
        { id: 'notice', label: 'Notices', icon: AlertCircle, color: 'bg-cyber-purple/20 text-cyber-purple' },
        { id: 'profile', label: 'Profile', icon: User, color: 'bg-emerald-500/20 text-emerald-400' },
      ].map(box => (
        <button
          key={box.id}
          onClick={() => setActiveTab(box.id as any)}
          className={`aspect-square p-1.5 sm:p-4 rounded-xl sm:rounded-3xl border transition-all flex flex-col items-center justify-center gap-1 sm:gap-2 ${activeTab === box.id ? 'border-cyber-blue bg-cyber-blue/10 shadow-[0_0_15px_rgba(0,243,255,0.2)]' : 'glass-panel border-white/10 hover:border-white/20'}`}
        >
          <div className={`p-1 sm:p-2.5 rounded-lg sm:rounded-xl ${box.color}`}>
            <box.icon className="w-3.5 h-3.5 sm:w-6 sm:h-6" />
          </div>
          <span className="font-orbitron font-bold text-white text-[7px] sm:text-xs uppercase tracking-wider text-center leading-tight">{box.label}</span>
        </button>
      ))}
    </div>

    {activeTab === 'profile' ? (
      <ProfileSection 
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        resources={resources}
        setEditingResource={setEditingResource}
        setResourceForm={setResourceForm}
        setShowResourceForm={setShowResourceForm}
        handleDeleteResource={handleDeleteResource}
        setSelectedResource={setSelectedResource}
      />
    ) : activeTab === 'notice' ? (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg sm:text-xl font-orbitron font-black text-white tracking-tighter uppercase">Subject Notices</h3>
          <button onClick={() => setShowNoticeForm(true)} className="cyber-button bg-cyber-purple text-white px-4 sm:px-6 py-2 rounded-xl font-orbitron font-black flex items-center gap-2 text-[10px] sm:text-sm uppercase tracking-tighter">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Post Notice
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {notices.filter(n => n.authorId === currentUser?.uid).map(n => (
            <NoticeCard key={n.id} notice={n} onDelete={() => handleDeleteNotice(n.id)} />
          ))}
        </div>
      </div>
    ) : (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg sm:text-xl font-orbitron font-black text-white tracking-tighter uppercase capitalize">{activeTab} Lectures</h3>
          <button onClick={() => { setEditingResource(null); setResourceForm({ title: '', content: '', type: activeTab as any, subject: '', className: '' }); setShowResourceForm(true); }} className="cyber-button bg-cyber-blue text-black px-4 sm:px-6 py-2 rounded-xl font-orbitron font-black flex items-center gap-2 text-[10px] sm:text-sm uppercase tracking-tighter">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Add New
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.filter(r => r.type === activeTab && r.authorId === currentUser?.uid).map(res => (
            <ResourceCard 
              key={res.id} 
              resource={res} 
              onEdit={() => { setEditingResource(res); setResourceForm(res); setShowResourceForm(true); }}
              onDelete={() => handleDeleteResource(res.id)}
              setSelectedResource={setSelectedResource}
            />
          ))}
        </div>
      </div>
    )}
  </div>
);

const MathOrImageRenderer: React.FC<{ text: string; className?: string; imgClassName?: string }> = ({ text, className = "", imgClassName = "" }) => {
  if (!text) return null;

  const trimmed = text.trim();

  // Parse out prefix like "A. ", "B) ", etc if present, to inspect the actual payload
  const prefixMatch = trimmed.match(/^([A-D])(?:[\.\)\s-]+\s*)(.*)$/i);
  let prefix = "";
  let payload = trimmed;
  if (prefixMatch) {
    prefix = prefixMatch[1] + ". ";
    payload = prefixMatch[2].trim();
  }

  // Check if payload is a direct image URL or base64 image
  const isDirectImage = /^data:image\/[a-zA-Z+-]+;base64,[a-zA-Z0-9+/=]+$/i.test(payload) || 
    /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg|bmp))(?:\?.*)?$/i.test(payload);

  if (isDirectImage) {
    return (
      <div className="flex flex-col items-start gap-1">
        {prefix && <span className={`${className} font-extrabold mr-2`}>{prefix}</span>}
        <img 
          src={payload} 
          alt="Option Diagram/Image" 
          className={`max-h-56 max-w-full rounded-lg object-contain my-1 select-none bg-white p-2 border border-slate-200 shadow-sm ${imgClassName}`}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Check if it's markdown image format: ![alt](url)
  const markdownImgRegex = /!\[.*?\]\((.*?)\)/;
  const mdMatch = payload.match(markdownImgRegex);
  if (mdMatch && mdMatch[1]) {
    const imageUrl = mdMatch[1];
    const textWithoutImg = payload.replace(markdownImgRegex, '').trim();
    return (
      <div className="flex flex-col gap-1 items-start">
        <div className="flex items-center">
          {prefix && <span className={`${className} font-extrabold mr-1`}>{prefix}</span>}
          {textWithoutImg && <span className={className}>{textWithoutImg}</span>}
        </div>
        <img 
          src={imageUrl} 
          alt="Option Diagram/Image" 
          className={`max-h-56 max-w-full rounded-lg object-contain my-1 select-none bg-white p-2 border border-slate-200 shadow-sm ${imgClassName}`}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Check if it contains an image URL inside the payload
  const urlRegex = /(https?:\/\/[^\s]+(?:\.(?:png|jpg|jpeg|gif|webp|svg|bmp))(?:\?[^\s]+)?)/i;
  const urlMatch = payload.match(urlRegex);
  if (urlMatch && urlMatch[1]) {
    const imageUrl = urlMatch[1];
    const textWithoutImg = payload.replace(urlRegex, '').trim();
    return (
      <div className="flex flex-col gap-1 items-start">
        <div className="flex items-center">
          {prefix && <span className={`${className} font-extrabold mr-1`}>{prefix}</span>}
          {textWithoutImg && <span className={className}>{textWithoutImg}</span>}
        </div>
        <img 
          src={imageUrl} 
          alt="Option Diagram/Image" 
          className={`max-h-56 max-w-full rounded-lg object-contain my-1 select-none bg-white p-2 border border-slate-200 shadow-sm ${imgClassName}`}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Fallback for general image-like URLs (e.g. cloud bucket urls or base64 data URLs)
  const startsWithHttp = /^https?:\/\/[^\s]+$/i.test(payload);
  const isBase64 = /^data:image\//i.test(payload);
  if (startsWithHttp || isBase64) {
    const hasImageKeywords = payload.includes("/image") || 
      payload.includes("drive.google.com/uc") || 
      payload.includes("googleapis.com") || 
      payload.includes("cloudinary.com") ||
      payload.includes("img") ||
      payload.includes("photo") ||
      isBase64;
      
    if (hasImageKeywords) {
      return (
        <div className="flex flex-col items-start gap-1">
          {prefix && <span className={`${className} font-extrabold mr-2`}>{prefix}</span>}
          <img 
            src={payload} 
            alt="Option Diagram/Image" 
            className={`max-h-56 max-w-full rounded-lg object-contain my-1 select-none bg-white p-2 border border-slate-200 shadow-sm ${imgClassName}`}
            referrerPolicy="no-referrer"
          />
        </div>
      );
    }
  }

  // Default fallback: return normal text with its prefix if present
  return (
    <span className={className}>
      {prefix}{payload}
    </span>
  );
};

export const getNestEstimation = (score: number) => {
  if (score >= 115) {
    return {
      percentile: "99.5+",
      chanceGen: "Excellent (Top Ranks)",
      chanceEws: "Guaranteed Selection",
      suggestion: "Outstanding performance! You are on track for a top merit rank at NISER/UM-DAE CEBS. Keep polishing your time management and stay calm on the actual exam day to lock in your top position.",
      badgeColor: [34, 197, 94] // Emerald
    };
  } else if (score >= 95) {
    return {
      percentile: "98.5 - 99.4",
      chanceGen: "Very High Chance",
      chanceEws: "Very High Chance",
      suggestion: "Excellent score! Your grasp over the syllabus is highly competitive. Focus on analyzing your minor error patterns and reducing silly mistakes to secure a solid rank.",
      badgeColor: [132, 204, 22] // Light green
    };
  } else if (score >= 80) {
    return {
      percentile: "96.0 - 98.4",
      chanceGen: "Borderline / Moderate",
      chanceEws: "Good Chance",
      suggestion: "Decent score, but on the borderline of the general category cutoff. To be safe, focus on error analysis of your weaker topics and solve more timed mock tests.",
      badgeColor: [234, 179, 8] // Yellow
    };
  } else if (score >= 65) {
    return {
      percentile: "90.0 - 95.9",
      chanceGen: "Low Chance",
      chanceEws: "Borderline",
      suggestion: "Your concepts are moderately clear, but your speed and accuracy require reinforcement. Focus on revising high-weightage chapters and avoid guessing answers to save negative marking.",
      badgeColor: [249, 115, 22] // Orange
    };
  } else {
    return {
      percentile: "Below 90",
      chanceGen: "Very Low",
      chanceEws: "Low",
      suggestion: "Extensive study and foundational revision are needed across all subjects. Make a strict study plan, focus heavily on textbook key exercises, and avoid guessing since negative marks (-1) damage your rank.",
      badgeColor: [239, 68, 68] // Red
    };
  }
};

const AppContent: React.FC = () => {
  // Exam Hub state
  const [examType, setExamType] = useState<'cuet' | 'neet' | 'jee' | 'nest' | 'jipmat' | null>(null);
  const [cuetStatus, setCuetStatus] = useState<'selection' | 'upload' | 'instructions' | 'exam' | 'terminated' | 'finished' | 'nest-login' | 'nest-instructions' | 'nest-other-instructions'>('selection');
  const [cuetQuestions, setCuetQuestions] = useState<any[]>([]);
  const [neetData, setNeetData] = useState<Record<string, any[]>>({ 'Physics': [], 'Chemistry': [], 'Biology': [] });
  const [nestData, setNestData] = useState<Record<string, any[]>>({ 'Biology': [], 'Chemistry': [], 'Physics': [] });
  
  // NEET specific states
  const [neetUploadMethods, setNeetUploadMethods] = useState<Record<string, 'text' | 'file'>>({
    'Physics': 'text',
    'Chemistry': 'text',
    'Biology': 'text'
  });
  const [neetFiles, setNeetFiles] = useState<Record<string, File | null>>({
    'Physics': null,
    'Chemistry': null,
    'Biology': null
  });
  const [neetPastedTexts, setNeetPastedTexts] = useState<Record<string, string>>({
    'Physics': '',
    'Chemistry': '',
    'Biology': ''
  });

  // JIPMAT specific states
  const [jipmatData, setJipmatData] = useState<Record<string, any[]>>({
    'Quantitative Aptitude (QA)': [],
    'Data Interpretation & Logical Reasoning (DILR)': [],
    'Verbal Ability & Reading Comprehension (VARC)': []
  });
  const [jipmatUploadMethods, setJipmatUploadMethods] = useState<Record<string, 'text' | 'file'>>({
    'Quantitative Aptitude (QA)': 'text',
    'Data Interpretation & Logical Reasoning (DILR)': 'text',
    'Verbal Ability & Reading Comprehension (VARC)': 'text'
  });
  const [jipmatFiles, setJipmatFiles] = useState<Record<string, File | null>>({
    'Quantitative Aptitude (QA)': null,
    'Data Interpretation & Logical Reasoning (DILR)': null,
    'Verbal Ability & Reading Comprehension (VARC)': null
  });
  const [jipmatPastedTexts, setJipmatPastedTexts] = useState<Record<string, string>>({
    'Quantitative Aptitude (QA)': '',
    'Data Interpretation & Logical Reasoning (DILR)': '',
    'Verbal Ability & Reading Comprehension (VARC)': ''
  });
  const [activeNeetSubject, setActiveNeetSubject] = useState<string>('Physics');
  const [cuetAnswers, setCuetAnswers] = useState<Record<number, string>>({});
  const [cuetStatusMap, setCuetStatusMap] = useState<Record<number, 'not-visited' | 'not-answered' | 'answered' | 'marked' | 'answered-marked'>>({});
  const [cuetTimeLeft, setCuetTimeLeft] = useState(3600); // Default 60 mins
  const [cuetIsLocked, setCuetIsLocked] = useState(false);
  const [cuetResult, setCuetResult] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [neetOmrFilled, setNeetOmrFilled] = useState<Record<number, boolean>>({});
  const [neetFullPaperFile, setNeetFullPaperFile] = useState<File | null>(null);
  const [neetFullPaperText, setNeetFullPaperText] = useState<string>('');
  const [neetFullUploadMethod, setNeetFullUploadMethod] = useState<'file' | 'text'>('file');
  const [neetUploadMode, setNeetUploadMode] = useState<'full' | 'subject'>('full');

  const [isFullscreenActive, setIsFullscreenActive] = useState<boolean>(false);

  const requestFullscreen = async () => {
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if ((docEl as any).webkitRequestFullscreen) {
        await (docEl as any).webkitRequestFullscreen();
      } else if ((docEl as any).mozRequestFullScreen) {
        await (docEl as any).mozRequestFullScreen();
      } else if ((docEl as any).msRequestFullscreen) {
        await (docEl as any).msRequestFullscreen();
      }
      setIsFullscreenActive(true);
    } catch (err) {
      console.error("Fullscreen request failed:", err);
    }
  };

  const isFullscreenSupported = typeof document !== 'undefined' && typeof document.documentElement !== 'undefined' && (
    typeof document.documentElement.requestFullscreen === 'function' ||
    typeof (document.documentElement as any).webkitRequestFullscreen === 'function' ||
    typeof (document.documentElement as any).mozRequestFullScreen === 'function' ||
    typeof (document.documentElement as any).msRequestFullscreen === 'function'
  );

  // Monitor fullscreen changes automatically
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreenActive(isFs);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    handleFullscreenChange(); // Run once immediately

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  // Alert on back/reload while exam is active
  useEffect(() => {
    if (cuetStatus === 'exam') {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = "Exam is in progress! If you refresh or exit, your performance data might be lost.";
        return e.returnValue;
      };

      // Push history state to intercept browser Back button
      window.history.pushState(null, "", window.location.href);
      const handlePopState = () => {
        window.history.pushState(null, "", window.location.href);
        alert("The back/home gestures are disabled during the live mock exam to preserve process reliability. Please use the on-screen controls to submit your paper when finished.");
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [cuetStatus]);

  // Auto-fill candidate name
  const candidateName = "PALLAVI";

  const handleNestTextUpload = async (subject: string, pastedText: string) => {
    const apiKey = process.env.GEMINI_API_KEY || (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY);
    if (!apiKey) { alert("AI Service is currently unavailable. Please ensure GEMINI_API_KEY is set."); return; }
    if (!pastedText.trim()) { alert("Please paste some text first."); return; }

    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an AI that extracts exam questions specifically for the NEST Exam (National Entrance Screening Test).
      Extract all multiple choice questions for the section ${subject} from the following text. 
      Format each question as an object with:
      1. question: the full text of the question. Keep it exactly literal to the source text with NO custom changes, rewrites, or omissions to prevent mistakes.
      2. options: an array of EXACTLY 4 strings.
         CRITICAL: You MUST sanitize every option string by completely removing any correct-answer indicators, asterisks (*), bold formatting markdown (like **option** or *option*), ticks, checkmarks, arrows, or trailing suffixes like "(correct)", "(ans)", "(Answer)", "Ans:", "Answer is Option", etc. All 4 options MUST look completely identical, standard, and uniform in formatting so that there is absolutely NO textual clue or bolding pointing to the correct choice.
      3. diagramSvg: A string containing beautifully structured standard inline vector <svg> code representing any diagram, graph, drawing, coordinates, pulleys on incline slope, physics circuit diagram, or chemical compound mentioned or present in the question. Include coordinate axes with clear labels, visual nodes, vectors, arrows, and elegant styling. Note: Background should be transparent or white, stroke colors MUST use dark grays (#333333, #475569) so they are outstanding. Width of this <svg> should be 100% and height should be around 150-250px. If no diagram/graph is needed or present for the question, set this field to null or "".
      4. diagramTitle: A short string title of the diagram (e.g., "Pulley Incline Slope Diagram", "Resistor Parallel Circuit") if diagramSvg is present, otherwise null or "".
      5. correct: the index (0-3) of the correct answer (if marked, or deduce if possible. If you can't deduce the correct answer, pick index 0 as default)
      
      Text to process:
      ${pastedText}
      
      Return ONLY a JSON array of these objects: [{"question": "...", "options": ["...", "...", "...", "..."], "diagramSvg": "...", "diagramTitle": "...", "correct": 0}]. If none found, return [].`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
      });
      const text = response.text;
      const jsonMatch = text ? text.match(/\[[\s\S]*\]/) : null;
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        if (extracted.length > 0) {
          // NEST Exam structure has exactly 20 questions per section. Limit to 20.
          const slicedExtracted = extracted.slice(0, 20);
          setNestData(prev => ({ ...prev, [subject]: slicedExtracted }));
          alert(`${slicedExtracted.length} questions extracted for NEST ${subject}.`);
        } else {
          alert(`No questions found for ${subject}.`);
        }
      } else {
        alert("Failed to parse questions from AI response. Please try again with clear question text.");
      }
    } catch (error: any) {
      console.error('NEST Extraction Error:', error);
      alert('Failed: ' + error.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleNestFileUpload = async (subject: string, file: File) => {
    const apiKey = process.env.GEMINI_API_KEY || (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY);
    if (!apiKey) { alert("AI Service is currently unavailable. Please ensure GEMINI_API_KEY is set."); return; }

    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const fileToGenerativePart = async (f: File) => {
        const base64EncodedDataPromise = new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(f);
        });
        return {
          inlineData: { data: await base64EncodedDataPromise as string, mimeType: f.type },
        };
      };

      const fileData = await fileToGenerativePart(file);
      const prompt = `You are an AI that extracts exam questions specifically for the NEST Exam (National Entrance Screening Test).
      Extract all multiple choice questions for the section ${subject} from this NEST question paper file (image or PDF). 
      Format each question as an object with:
      1. question: the full text of the question. Keep it exactly literal to the source text with NO custom changes, rewrites, or omissions to prevent mistakes.
      2. options: an array of EXACTLY 4 strings.
         CRITICAL: You MUST sanitize every option string by completely removing any correct-answer indicators, asterisks (*), bold formatting markdown (like **option** or *option*), ticks, checkmarks, arrows, or trailing suffixes like "(correct)", "(ans)", "(Answer)", "Ans:", "Answer is Option", etc. All 4 options MUST look completely identical, standard, and uniform in formatting so that there is absolutely NO textual clue or bolding pointing to the correct choice.
      3. diagramSvg: A string containing beautifully structured standard inline vector <svg> code representing any diagram, graph, drawing, coordinates, pulleys on incline slope, physics circuit diagram, or chemical compound mentioned or present in the question. Include coordinate axes with clear labels, visual nodes, vectors, arrows, and elegant styling. Note: Background should be transparent or white, stroke colors MUST use dark grays (#333333, #475569) so they are outstanding. Width of this <svg> should be 100% and height should be around 150-250px. If no diagram/graph is needed or present for the question, set this field to null or "".
      4. diagramTitle: A short string title of the diagram (e.g., "Pulley Incline Slope Diagram", "Resistor Parallel Circuit") if diagramSvg is present, otherwise null or "".
      5. correct: the index (0-3) of the correct answer (if marked, or deduce if possible. If you can't deduce the correct answer, pick index 0 as default)
      
      Return ONLY a JSON array of these objects: [{"question": "...", "options": ["...", "...", "...", "..."], "diagramSvg": "...", "diagramTitle": "...", "correct": 0}]. If none found, return [].`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ parts: [{ text: prompt }, fileData] }],
      });
      const text = response.text;
      const jsonMatch = text ? text.match(/\[[\s\S]*\]/) : null;
      if (jsonMatch) {
         const extracted = JSON.parse(jsonMatch[0]);
         if (extracted.length > 0) {
           // NEST Exam structure has exactly 20 questions per section. Limit to 20.
           const slicedExtracted = extracted.slice(0, 20);
           setNestData(prev => ({ ...prev, [subject]: slicedExtracted }));
           alert(`${slicedExtracted.length} questions extracted for NEST ${subject}.`);
         } else {
           alert(`No questions found for ${subject}.`);
         }
      } else {
        alert("Found issue parsing AI response. Please try again.");
      }
    } catch (error: any) {
      console.error('NEST File Extraction Error:', error);
      alert('Failed: ' + error.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const startNestSimulation = () => {
    const allQs: any[] = [];
    const subjects = ['Biology', 'Chemistry', 'Physics'];
    let filledSectionsCount = 0;
    let firstAvailableSubject = 'Biology';
    let foundFirst = false;

    subjects.forEach(sub => {
      const qs = nestData[sub] || [];
      if (qs.length > 0) {
        filledSectionsCount++;
        if (!foundFirst) {
          firstAvailableSubject = sub;
          foundFirst = true;
        }
        qs.forEach((q, idx) => {
          allQs.push({ ...q, subject: sub, sectionIndex: idx });
        });
      }
    });

    if (allQs.length === 0) {
      alert("Please upload and extract questions for subjects first.");
      return;
    }

    setCuetQuestions(allQs);
    setCuetAnswers({});
    setCuetStatusMap({});
    setActiveNeetSubject(firstAvailableSubject);

    // Dynamic timer: 1.5 minutes (90 seconds) per question
    setCuetTimeLeft(allQs.length * 90);
    setCuetStatus('nest-login');
  };

  const handleJipmatTextUpload = async (subject: string, pastedText: string) => {
    const apiKey = process.env.GEMINI_API_KEY || (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY);
    if (!apiKey) { alert("AI Service is currently unavailable. Please ensure GEMINI_API_KEY is set."); return; }
    if (!pastedText.trim()) { alert("Please paste some text first."); return; }

    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an AI that extracts exam questions specifically for the JIPMAT Exam (Joint Integrated Programme in Management Admission Test).
      Extract all multiple choice questions for the section ${subject} from the following text.
      Format each question as an object with:
      1. question: the full text of the question. Keep it exactly literal to the source text with NO custom changes, rewrites, or omissions to prevent mistakes.
      2. options: an array of EXACTLY 4 strings.
         CRITICAL: You MUST sanitize every option string by completely removing any correct-answer indicators, asterisks (*), bold formatting markdown (like **option** or *option*), ticks, checkmarks, arrows, or trailing suffixes like "(correct)", "(ans)", "(Answer)", "Ans:", "Answer is Option", etc. All 4 options MUST look completely identical, standard, and uniform in formatting so that there is absolutely NO textual clue or bolding pointing to the correct choice.
      3. diagramSvg: A string containing beautifully structured standard inline vector <svg> code representing any diagram, graph, drawing, coordinates, pulleys on incline slope, physics circuit diagram, or chemical compound mentioned or present in the question. Include coordinate axes with clear labels, visual nodes, vectors, arrows, and elegant styling. Note: Background should be transparent or white, stroke colors MUST use dark grays (#333333, #475569) so they are outstanding. Width of this <svg> should be 100% and height should be around 150-250px. If no diagram/graph is needed or present for the question, set this field to null or "".
      4. diagramTitle: A short string title of the diagram (e.g., "Pulley Incline Slope Diagram", "Resistor Parallel Circuit") if diagramSvg is present, otherwise null or "".
      5. correct: the index (0-3) of the correct answer (if marked, or deduce if possible. If you can't deduce the correct answer, pick index 0 as default)
      
      Text to process:
      ${pastedText}
      
      Return ONLY a JSON array of these objects: [{"question": "...", "options": ["...", "...", "...", "..."], "diagramSvg": "...", "diagramTitle": "...", "correct": 0}]. If none found, return [].`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
      });
      const text = response.text;
      const jsonMatch = text ? text.match(/\[[\s\S]*\]/) : null;
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        if (extracted.length > 0) {
          const limit = subject.includes('VARC') ? 34 : 33;
          const slicedExtracted = extracted.slice(0, limit);
          setJipmatData(prev => ({ ...prev, [subject]: slicedExtracted }));
          alert(`${slicedExtracted.length} questions extracted for JIPMAT ${subject}.`);
        } else {
          alert(`No questions found for ${subject}.`);
        }
      } else {
        alert("Failed to parse questions from AI response. Please try again with clear question text.");
      }
    } catch (error: any) {
      console.error('JIPMAT Extraction Error:', error);
      alert('Failed: ' + error.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleJipmatFileUpload = async (subject: string, file: File) => {
    const apiKey = process.env.GEMINI_API_KEY || (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY);
    if (!apiKey) { alert("AI Service is currently unavailable. Please ensure GEMINI_API_KEY is set."); return; }

    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const fileToGenerativePart = async (f: File) => {
        const base64EncodedDataPromise = new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(f);
        });
        return {
          inlineData: { data: await base64EncodedDataPromise as string, mimeType: f.type },
        };
      };

      const fileData = await fileToGenerativePart(file);
      const prompt = `You are an AI that extracts exam questions specifically for the JIPMAT Exam (Joint Integrated Programme in Management Admission Test).
      Extract all multiple choice questions for the section ${subject} from this question paper file (image or PDF).
      Format each question as an object with:
      1. question: the full text of the question. Keep it exactly literal to the source text with NO custom changes, rewrites, or omissions to prevent mistakes.
      2. options: an array of EXACTLY 4 strings.
         CRITICAL: You MUST sanitize every option string by completely removing any correct-answer indicators, asterisks (*), bold formatting markdown (like **option** or *option*), ticks, checkmarks, arrows, or trailing suffixes like "(correct)", "(ans)", "(Answer)", "Ans:", "Answer is Option", etc. All 4 options MUST look completely identical, standard, and uniform in formatting so that there is absolutely NO textual clue or bolding pointing to the correct choice.
      3. diagramSvg: A string containing beautifully structured standard inline vector <svg> code representing any diagram, graph, drawing, coordinates, pulleys on incline slope, physics circuit diagram, or chemical compound mentioned or present in the question. Include coordinate axes with clear labels, visual nodes, vectors, arrows, and elegant styling. Note: Background should be transparent or white, stroke colors MUST use dark grays (#333333, #475569) so they are outstanding. Width of this <svg> should be 100% and height should be around 150-250px. If no diagram/graph is needed or present for the question, set this field to null or "".
      4. diagramTitle: A short string title of the diagram (e.g., "Pulley Incline Slope Diagram", "Resistor Parallel Circuit") if diagramSvg is present, otherwise null or "".
      5. correct: the index (0-3) of the correct answer (if marked, or deduce if possible. If you can't deduce the correct answer, pick index 0 as default)
      
      Return ONLY a JSON array of these objects: [{"question": "...", "options": ["...", "...", "...", "..."], "diagramSvg": "...", "diagramTitle": "...", "correct": 0}]. If none found, return [].`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ parts: [{ text: prompt }, fileData] }],
      });
      const text = response.text;
      const jsonMatch = text ? text.match(/\[[\s\S]*\]/) : null;
      if (jsonMatch) {
         const extracted = JSON.parse(jsonMatch[0]);
         if (extracted.length > 0) {
           const limit = subject.includes('VARC') ? 34 : 33;
           const slicedExtracted = extracted.slice(0, limit);
           setJipmatData(prev => ({ ...prev, [subject]: slicedExtracted }));
           alert(`${slicedExtracted.length} questions extracted for JIPMAT ${subject}.`);
         } else {
           alert(`No questions found for ${subject}.`);
         }
      } else {
        alert("Found issue parsing AI response. Please try again.");
      }
    } catch (error: any) {
      console.error('JIPMAT File Extraction Error:', error);
      alert('Failed: ' + error.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const startJipmatSimulation = () => {
    const allQs: any[] = [];
    const subjects = [
      'Quantitative Aptitude (QA)',
      'Data Interpretation & Logical Reasoning (DILR)',
      'Verbal Ability & Reading Comprehension (VARC)'
    ];

    subjects.forEach(sub => {
      const qs = jipmatData[sub] || [];
      qs.forEach((q, idx) => {
        allQs.push({ ...q, subject: sub, sectionIndex: idx });
      });
    });

    if (allQs.length === 0) {
      alert("Please upload and extract questions for JIPMAT sections first.");
      return;
    }

    setCuetQuestions(allQs);
    setCuetAnswers({});
    setCuetStatusMap({});
    setActiveNeetSubject('Quantitative Aptitude (QA)');

    // JIPMAT duration scales dynamically: 1.5 minutes (90 seconds) per question
    setCuetTimeLeft(allQs.length * 90);
    setCuetStatus('nest-login');
  };

  const handleNeetTextUpload = async (subject: string, pastedText: string) => {
    const apiKey = process.env.GEMINI_API_KEY || (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY);
    if (!apiKey) { alert("AI Service is currently unavailable. Please ensure GEMINI_API_KEY is set."); return; }
    if (!pastedText.trim()) { alert("Please paste some text first."); return; }

    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Extract all multiple choice questions for ${subject} from the following text. 
      Format each question as an object with:
      1. question: the full text of the question. Keep it exactly literal to the source text with NO custom changes, rewrites, or omissions to prevent mistakes.
      2. options: an array of EXACTLY 4 strings.
         CRITICAL: You MUST sanitize every option string by completely removing any correct-answer indicators, asterisks (*), bold formatting markdown (like **option** or *option*), ticks, checkmarks, arrows, or trailing suffixes like "(correct)", "(ans)", "(Answer)", "Ans:", "Answer is Option", etc. All 4 options MUST look completely identical, standard, and uniform in formatting so that there is absolutely NO textual clue or bolding pointing to the correct choice.
      3. diagramSvg: A string containing beautifully structured standard inline vector <svg> code representing any diagram, graph, drawing, coordinates, pulleys on incline slope, physics circuit diagram, or chemical compound mentioned or present in the question. Include coordinate axes with clear labels, visual nodes, vectors, arrows, and elegant styling. Note: Background should be transparent or white, stroke colors MUST use dark grays (#333333, #475569) so they are outstanding. Width of this <svg> should be 100% and height should be around 150-250px. If no diagram/graph is needed or present for the question, set this field to null or "".
      4. diagramTitle: A short string title of the diagram (e.g., "Coordinate Plot", "Chemical Structure Benzene Ring") if diagramSvg is present, otherwise null or "".
      5. correct: the index (0-3) of the correct answer (if marked)
      
      Text to process:
      ${pastedText}
      
      Return ONLY a JSON array of these objects: [{"question": "...", "options": ["...", "...", "...", "..."], "diagramSvg": "...", "diagramTitle": "...", "correct": 0}]. If none found, return [].`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
      });
      const text = response.text;
      const jsonMatch = text ? text.match(/\[[\s\S]*\]/) : null;
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        if (extracted.length > 0) {
          setNeetData(prev => ({ ...prev, [subject]: extracted }));
          alert(`${extracted.length} questions extracted for ${subject}.`);
        } else {
          alert(`No questions found for ${subject}.`);
        }
      }
    } catch (error: any) {
      console.error('NEET Extraction Error:', error);
      alert('Failed: ' + error.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleNeetFileUpload = async (subject: string, file: File) => {
    const apiKey = process.env.GEMINI_API_KEY || (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY);
    if (!apiKey) { alert("AI Service is currently unavailable. Please ensure GEMINI_API_KEY is set."); return; }

    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const fileToGenerativePart = async (f: File) => {
        const base64EncodedDataPromise = new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(f);
        });
        return {
          inlineData: { data: await base64EncodedDataPromise as string, mimeType: f.type },
        };
      };

      const fileData = await fileToGenerativePart(file);
      const prompt = `Extract all multiple choice questions for ${subject} from this NEET question paper file (image or PDF). 
      Format each question as an object with:
      1. question: the full text of the question. Keep it exactly literal to the source text with NO custom changes, rewrites, or omissions to prevent mistakes.
      2. options: an array of EXACTLY 4 strings.
         CRITICAL: You MUST sanitize every option string by completely removing any correct-answer indicators, asterisks (*), bold formatting markdown (like **option** or *option*), ticks, checkmarks, arrows, or trailing suffixes like "(correct)", "(ans)", "(Answer)", "Ans:", "Answer is Option", etc. All 4 options MUST look completely identical, standard, and uniform in formatting so that there is absolutely NO textual clue or bolding pointing to the correct choice.
      3. diagramSvg: A string containing beautifully structured standard inline vector <svg> code representing any diagram, graph, drawing, coordinates, pulleys on incline slope, physics circuit diagram, or chemical compound mentioned or present in the question. Include coordinate axes with clear labels, visual nodes, vectors, arrows, and elegant styling. Note: Background should be transparent or white, stroke colors MUST use dark grays (#333333, #475569) so they are outstanding. Width of this <svg> should be 100% and height should be around 150-250px. If no diagram/graph is needed or present for the question, set this field to null or "".
      4. diagramTitle: A short string title of the diagram (e.g., "Coordinate Plot", "Chemical Structure Benzene Ring") if diagramSvg is present, otherwise null or "".
      5. correct: the index (0-3) of the correct answer (if marked)
      
      Return ONLY a JSON array of these objects: [{"question": "...", "options": ["...", "...", "...", "..."], "diagramSvg": "...", "diagramTitle": "...", "correct": 0}]. If none found, return [].`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ parts: [{ text: prompt }, fileData] }],
      });
      const text = response.text;
      const jsonMatch = text ? text.match(/\[[\s\S]*\]/) : null;
      if (jsonMatch) {
         const extracted = JSON.parse(jsonMatch[0]);
         if (extracted.length > 0) {
           setNeetData(prev => ({ ...prev, [subject]: extracted }));
           alert(`${extracted.length} questions extracted for ${subject}.`);
         } else {
           alert(`No questions found for ${subject}.`);
         }
      } else {
        alert("Found issue parsing AI response. Please try again.");
      }
    } catch (error: any) {
      console.error('NEET File Extraction Error:', error);
      alert('Failed: ' + error.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleNeetFullPaperFileUpload = async (file: File) => {
    const apiKey = process.env.GEMINI_API_KEY || (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY);
    if (!apiKey) { alert("AI Service is currently unavailable. Please ensure GEMINI_API_KEY is set."); return; }

    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const fileToGenerativePart = async (f: File) => {
        const base64EncodedDataPromise = new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(f);
        });
        return {
          inlineData: { data: await base64EncodedDataPromise as string, mimeType: f.type },
        };
      };

      const fileData = await fileToGenerativePart(file);
      const prompt = `Extract ALL multiple choice questions from this complete NEET UG question paper (image or PDF file). 
      Classify each extracted question into its appropriate subject: "Physics", "Chemistry", or "Biology".
      Format each question as an object with:
      1. subject: "Physics" | "Chemistry" | "Biology" (if subject is not explicitly stated in header, infer from question content)
      2. question: the full text of the question. Keep it exactly literal to the source text with NO custom changes, rewrites, or omissions to prevent mistakes.
      3. options: an array of EXACTLY 4 strings.
         CRITICAL: You MUST sanitize every option string by completely removing any correct-answer indicators, asterisks (*), bold formatting markdown (like **option** or *option*), ticks, checkmarks, arrows, or trailing suffixes like "(correct)", "(ans)", "(Answer)", "Ans:", "Answer is Option", etc. All 4 options MUST look completely identical, standard, and uniform in formatting so that there is absolutely NO textual clue or bolding pointing to the correct choice.
      4. diagramSvg: A string containing beautifully structured standard inline vector <svg> code representing any diagram, graph, drawing, coordinates, pulleys on incline slope, physics circuit diagram, or chemical compound mentioned or present in the question. Include coordinate axes with clear labels, visual nodes, vectors, arrows, and elegant styling. Note: Background should be transparent or white, stroke colors MUST use dark grays (#333333, #475569) so they are outstanding. Width of this <svg> should be 100% and height should be around 150-250px. If no diagram/graph is needed or present for the question, set this field to null or "".
      5. diagramTitle: A short string title of the diagram (e.g., "Coordinate Plot", "Chemical Structure Benzene Ring") if diagramSvg is present, otherwise null or "".
      6. correct: the index (0-3) of the correct answer (if marked, or default 0)

      Return ONLY a JSON array of these objects: [{"subject": "Physics", "question": "...", "options": ["...", "...", "...", "..."], "diagramSvg": "...", "diagramTitle": "...", "correct": 0}]. If none found, return [].`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ parts: [{ text: prompt }, fileData] }],
      });
      const text = response.text;
      const jsonMatch = text ? text.match(/\[[\s\S]*\]/) : null;
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        if (extracted.length > 0) {
          const newNeetData = { Physics: [] as any[], Chemistry: [] as any[], Biology: [] as any[] };
          extracted.forEach((q: any) => {
            const sub = (q.subject && ['Physics', 'Chemistry', 'Biology'].includes(q.subject)) ? q.subject : 'Biology';
            newNeetData[sub as keyof typeof newNeetData].push({
              question: q.question,
              options: q.options,
              diagramSvg: q.diagramSvg || null,
              diagramTitle: q.diagramTitle || null,
              correct: typeof q.correct === 'number' ? q.correct : 0,
              subject: sub
            });
          });
          setNeetData(newNeetData);
          alert(`Successfully extracted ${extracted.length} total questions from NEET paper! (Physics: ${newNeetData.Physics.length}, Chemistry: ${newNeetData.Chemistry.length}, Biology: ${newNeetData.Biology.length})`);
        } else {
          alert("No questions found in the file.");
        }
      } else {
        alert("Found issue parsing AI response. Please try again.");
      }
    } catch (error: any) {
      console.error('NEET Full Paper Extraction Error:', error);
      alert('Failed: ' + error.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleNeetFullPaperTextUpload = async (pastedText: string) => {
    const apiKey = process.env.GEMINI_API_KEY || (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY);
    if (!apiKey) { alert("AI Service is currently unavailable. Please ensure GEMINI_API_KEY is set."); return; }
    if (!pastedText.trim()) { alert("Please paste text first."); return; }

    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Extract ALL multiple choice questions from this NEET UG question paper text.
      Classify each extracted question into its appropriate subject: "Physics", "Chemistry", or "Biology".
      Format each question as an object with:
      1. subject: "Physics" | "Chemistry" | "Biology"
      2. question: the full text of the question. Keep it exactly literal to the source text.
      3. options: an array of EXACTLY 4 strings.
         CRITICAL: You MUST sanitize every option string by completely removing any correct-answer indicators, asterisks (*), bold formatting markdown (like **option** or *option*), ticks, checkmarks, arrows, or trailing suffixes like "(correct)", "(ans)", "(Answer)", "Ans:", "Answer is Option", etc. All 4 options MUST look completely identical, standard, and uniform in formatting so that there is absolutely NO textual clue or bolding pointing to the correct choice.
      4. diagramSvg: A string containing beautifully structured standard inline vector <svg> code representing any diagram or compound mentioned.
      5. diagramTitle: Title or null.
      6. correct: index 0-3.

      Text to process:
      ${pastedText}

      Return ONLY a JSON array of these objects: [{"subject": "Physics", "question": "...", "options": ["...", "...", "...", "..."], "diagramSvg": "...", "diagramTitle": "...", "correct": 0}]. If none found, return [].`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
      });
      const text = response.text;
      const jsonMatch = text ? text.match(/\[[\s\S]*\]/) : null;
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        if (extracted.length > 0) {
          const newNeetData = { Physics: [] as any[], Chemistry: [] as any[], Biology: [] as any[] };
          extracted.forEach((q: any) => {
            const sub = (q.subject && ['Physics', 'Chemistry', 'Biology'].includes(q.subject)) ? q.subject : 'Biology';
            newNeetData[sub as keyof typeof newNeetData].push({
              question: q.question,
              options: q.options,
              diagramSvg: q.diagramSvg || null,
              diagramTitle: q.diagramTitle || null,
              correct: typeof q.correct === 'number' ? q.correct : 0,
              subject: sub
            });
          });
          setNeetData(newNeetData);
          alert(`Successfully extracted ${extracted.length} total questions from text! (Physics: ${newNeetData.Physics.length}, Chemistry: ${newNeetData.Chemistry.length}, Biology: ${newNeetData.Biology.length})`);
        } else {
          alert("No questions found.");
        }
      }
    } catch (error: any) {
      console.error('NEET Full Paper Extraction Error:', error);
      alert('Failed: ' + error.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const startNeetSimulation = () => {
    // Collect all subjects into one array but track subject indices
    const allQs: any[] = [];
    const subjects = ['Physics', 'Chemistry', 'Biology'];
    subjects.forEach(sub => {
      neetData[sub].forEach(q => allQs.push({ ...q, subject: sub }));
    });

    if (allQs.length === 0) {
      alert("Please upload and extract questions for subjects first.");
      return;
    }

    setCuetQuestions(allQs);
    setCuetAnswers({});
    setCuetStatusMap({});
    // NEET duration scales dynamically: 1.5 minutes (90 seconds) per question
    setCuetTimeLeft(allQs.length * 90);
    setCuetStatus('nest-login');
  };

  const handleCuetTextUpload = async (pastedText: string) => {
    const apiKey = process.env.GEMINI_API_KEY || (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY);
    
    if (!apiKey) {
      alert("AI Service is currently unavailable. Please ensure GEMINI_API_KEY is set.");
      return;
    }

    if (!pastedText.trim()) {
      alert("Please paste some text first.");
      return;
    }

    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Extract all multiple choice questions from the following text. 
      The text may contain up to 50 or more questions. Ensure you find ALL of them.
      Format each question as an object with:
      1. question: the full text of the question. Keep it exactly literal to the source text with NO custom changes, rewrites, or omissions to prevent mistakes.
      2. options: an array of EXACTLY 4 strings (fill with placeholders if fewer than 4 are found).
         CRITICAL: You MUST sanitize every option string by completely removing any correct-answer indicators, asterisks (*), bold formatting markdown (like **option** or *option*), ticks, checkmarks, arrows, or trailing suffixes like "(correct)", "(ans)", "(Answer)", "Ans:", "Answer is Option", etc. All 4 options MUST look completely identical, standard, and uniform in formatting so that there is absolutely NO textual clue or bolding pointing to the correct choice.
      3. diagramSvg: A string containing beautifully structured standard inline vector <svg> code representing any diagram, graph, drawing, coordinates, pulleys on incline slope, physics circuit diagram, or chemical compound mentioned or present in the question. Include coordinate axes with clear labels, visual nodes, vectors, arrows, and elegant styling. Note: Background should be transparent or white, stroke colors MUST use dark grays (#333333, #475569) so they are outstanding. Width of this <svg> should be 100% and height should be around 150-250px. If no diagram/graph is needed or present for the question, set this field to null or "".
      4. diagramTitle: A short string title of the diagram (e.g., "Math Function Plot", "Force Vector Diagram") if diagramSvg is present, otherwise null or "".
      5. correct: the index (0-3) of the correct answer based on the content (if marked with * or "(correct)")
      
      Text to process:
      ${pastedText}
      
      Return ONLY a JSON array of these objects: [{"question": "...", "options": ["...", "...", "...", "..."], "diagramSvg": "...", "diagramTitle": "...", "correct": 0}]. If no questions are found, return [].`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
      });
      const text = response.text;
      
      if (!text) {
        alert("AI returned an empty response. Please try again.");
        return;
      }
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const extractedQuestions = JSON.parse(jsonMatch[0]);
        if (extractedQuestions.length > 0) {
          setCuetQuestions(extractedQuestions);
          setCuetStatus('nest-login');
          setCuetAnswers({});
          setCuetStatusMap({});
          // Dynamic timer: 1.5 minutes (90 seconds) per extracted question
          setCuetTimeLeft(extractedQuestions.length * 90);
        } else {
          alert("AI couldn't find any questions in the text provided. Please check the format.");
        }
      } else {
        alert("Found issue parsing AI response. Please try again.");
      }
    } catch (error: any) {
      console.error('CUET Text Extraction Error:', error);
      alert('Failed to process text: ' + (error.message || 'Unknown error'));
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCuetImageUpload = async (file: File) => {
    const apiKey = process.env.GEMINI_API_KEY || (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY);
    
    if (!apiKey) {
      alert("AI Service is currently unavailable. Please ensure GEMINI_API_KEY is set.");
      return;
    }

    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const fileToGenerativePart = async (file: File) => {
        const base64EncodedDataPromise = new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });
        return {
          inlineData: { data: await base64EncodedDataPromise as string, mimeType: file.type },
        };
      };

      const imageData = await fileToGenerativePart(file);
      const prompt = `Extract all questions from this CUET question paper file (image or PDF). 
      Format each question as an object with:
      1. question: the text of the question. Keep it exactly literal to the source text with NO custom changes, rewrites, or omissions to prevent mistakes.
      2. options: an array of 4 strings.
         CRITICAL: You MUST sanitize every option string by completely removing any correct-answer indicators, asterisks (*), bold formatting markdown (like **option** or *option*), ticks, checkmarks, arrows, or trailing suffixes like "(correct)", "(ans)", "(Answer)", "Ans:", "Answer is Option", etc. All 4 options MUST look completely identical, standard, and uniform in style so that there is absolutely NO clue, asterisk, or bolding pointing to the correct choice.
      3. diagramSvg: A string containing beautifully structured standard inline vector <svg> code representing any diagram, graph, drawing, coordinates, pulleys on incline slope, physics circuit diagram, or chemical compound mentioned or present in this question. Include coordinate axes with clear labels, visual nodes, vectors, arrows, and elegant styling. Note: Background should be transparent or white, stroke colors MUST use dark grays (#333333, #475569) so they are outstanding. Width of this <svg> should be 100% and height should be around 150-250px. If no diagram/graph is needed or present for the question, set this field to null or "".
      4. diagramTitle: A short string title of the diagram (e.g., "Pulley Incline Slope Diagram", "Resistor Parallel Circuit") if diagramSvg is present, otherwise null or "".
      5. correct: the index (0-3) of the correct answer
      
      Return ONLY a JSON array of these objects: [{"question": "...", "options": ["...", "...", "...", "..."], "diagramSvg": "...", "diagramTitle": "...", "correct": 0}]`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ parts: [{ text: prompt }, imageData] }],
      });
      const text = response.text;
      
      if (!text) {
        alert("AI returned an empty response. Please try again.");
        return;
      }
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const extractedQuestions = JSON.parse(jsonMatch[0]);
        if (extractedQuestions.length > 0) {
          setCuetQuestions(extractedQuestions);
          setCuetStatus('nest-login');
          setCuetAnswers({});
          setCuetStatusMap({});
          // Dynamic timer: 1.5 minutes (90 seconds) per extracted question
          setCuetTimeLeft(extractedQuestions.length * 90);
        } else {
          alert("AI couldn't find any questions in the image. Please try a clearer one.");
        }
      } else {
        alert("Found issue parsing AI response. Please try again.");
      }
    } catch (error: any) {
      console.error('CUET Extraction Error:', error);
      alert('Failed to process image: ' + (error.message || 'Unknown error'));
    } finally {
      setIsAiLoading(false);
    }
  };



  // We force the app into the CUET flow directly as requested
  return (
    <div className="min-h-screen bg-slate-950 font-sans flex flex-col">
      <div className="flex-1">
        <CUETExamView 
          currentUser={{ name: candidateName }}
          examType={examType}
          setExamType={setExamType}
          cuetStatus={cuetStatus}
          setCuetStatus={setCuetStatus}
          cuetQuestions={cuetQuestions}
          setCuetQuestions={setCuetQuestions}
          cuetAnswers={cuetAnswers}
          setCuetAnswers={setCuetAnswers}
          cuetTimeLeft={cuetTimeLeft}
          setCuetTimeLeft={setCuetTimeLeft}
          cuetIsLocked={cuetIsLocked}
          setCuetIsLocked={setCuetIsLocked}
          cuetResult={cuetResult}
          setCuetResult={setCuetResult}
          handleCuetImageUpload={handleCuetImageUpload}
          handleCuetTextUpload={handleCuetTextUpload}
          handleNeetTextUpload={handleNeetTextUpload}
          handleNeetFileUpload={handleNeetFileUpload}
          neetData={neetData}
          startNeetSimulation={startNeetSimulation}
          activeNeetSubject={activeNeetSubject}
          setActiveNeetSubject={setActiveNeetSubject}
          isAiLoading={isAiLoading}
          cuetStatusMap={cuetStatusMap}
          setCuetStatusMap={setCuetStatusMap}
          neetOmrFilled={neetOmrFilled}
          setNeetOmrFilled={setNeetOmrFilled}
          nestData={nestData}
          handleNestTextUpload={handleNestTextUpload}
          handleNestFileUpload={handleNestFileUpload}
          startNestSimulation={startNestSimulation}
          jipmatData={jipmatData}
          handleJipmatTextUpload={handleJipmatTextUpload}
          handleJipmatFileUpload={handleJipmatFileUpload}
          startJipmatSimulation={startJipmatSimulation}
          isFullscreenActive={isFullscreenActive}
          setIsFullscreenActive={setIsFullscreenActive}
          isFullscreenSupported={isFullscreenSupported}
          requestFullscreen={requestFullscreen}
          neetFullPaperFile={neetFullPaperFile}
          setNeetFullPaperFile={setNeetFullPaperFile}
          neetFullPaperText={neetFullPaperText}
          setNeetFullPaperText={setNeetFullPaperText}
          neetFullUploadMethod={neetFullUploadMethod}
          setNeetFullUploadMethod={setNeetFullUploadMethod}
          neetUploadMode={neetUploadMode}
          setNeetUploadMode={setNeetUploadMode}
          handleNeetFullPaperFileUpload={handleNeetFullPaperFileUpload}
          handleNeetFullPaperTextUpload={handleNeetFullPaperTextUpload}
        />
      </div>
      <footer className="py-8 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] leading-relaxed">
            © edu hub india 2026 || Designed & Developed by SHUBHJEET RAM TRIPATHI with 🩷
          </p>
        </div>
      </footer>
    </div>
  );
};

const CUETExamView = ({
  currentUser, examType, setExamType, cuetStatus, setCuetStatus, cuetQuestions, setCuetQuestions,
  cuetAnswers, setCuetAnswers, cuetTimeLeft, setCuetTimeLeft,
  cuetIsLocked, setCuetIsLocked, cuetResult, setCuetResult,
  handleCuetImageUpload, handleCuetTextUpload, handleNeetTextUpload, handleNeetFileUpload,
  neetData, startNeetSimulation, activeNeetSubject, setActiveNeetSubject,
  isAiLoading, cuetStatusMap, setCuetStatusMap,
  neetOmrFilled, setNeetOmrFilled,
  nestData, handleNestTextUpload, handleNestFileUpload, startNestSimulation,
  jipmatData, handleJipmatTextUpload, handleJipmatFileUpload, startJipmatSimulation,
  isFullscreenActive, setIsFullscreenActive, isFullscreenSupported, requestFullscreen,
  neetFullPaperFile, setNeetFullPaperFile,
  neetFullPaperText, setNeetFullPaperText,
  neetFullUploadMethod, setNeetFullUploadMethod,
  neetUploadMode, setNeetUploadMode,
  handleNeetFullPaperFileUpload, handleNeetFullPaperTextUpload
}: any) => {
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [unlockCode, setUnlockCode] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [neetPastedTexts, setNeetPastedTexts] = useState<Record<string, string>>({
    'Physics': '', 'Chemistry': '', 'Biology': ''
  });
  const [nestPastedTexts, setNestPastedTexts] = useState<Record<string, string>>({
    'Biology': '', 'Chemistry': '', 'Physics': ''
  });
  const [omrError, setOmrError] = useState<string | null>(null);

  // Custom PDF/Image Upload tabs for CUET Simulator input
  const [uploadMethod, setUploadMethod] = useState<'text' | 'file'>('text');
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // For NEET/NEST multi-subject tabs
  const [neetUploadMethods, setNeetUploadMethods] = useState<Record<string, 'text' | 'file'>>({
    'Physics': 'text', 'Chemistry': 'text', 'Biology': 'text'
  });
  const [nestUploadMethods, setNestUploadMethods] = useState<Record<string, 'text' | 'file'>>({
    'Biology': 'text', 'Chemistry': 'text', 'Physics': 'text'
  });
  const [neetFiles, setNeetFiles] = useState<Record<string, File | null>>({
    'Physics': null, 'Chemistry': null, 'Biology': null
  });
  const [nestFiles, setNestFiles] = useState<Record<string, File | null>>({
    'Biology': null, 'Chemistry': null, 'Physics': null
  });
  const [jipmatUploadMethods, setJipmatUploadMethods] = useState<Record<string, 'text' | 'file'>>({
    'Quantitative Aptitude (QA)': 'text',
    'Data Interpretation & Logical Reasoning (DILR)': 'text',
    'Verbal Ability & Reading Comprehension (VARC)': 'text'
  });
  const [jipmatFiles, setJipmatFiles] = useState<Record<string, File | null>>({
    'Quantitative Aptitude (QA)': null,
    'Data Interpretation & Logical Reasoning (DILR)': null,
    'Verbal Ability & Reading Comprehension (VARC)': null
  });
  const [jipmatPastedTexts, setJipmatPastedTexts] = useState<Record<string, string>>({
    'Quantitative Aptitude (QA)': '',
    'Data Interpretation & Logical Reasoning (DILR)': '',
    'Verbal Ability & Reading Comprehension (VARC)': ''
  });

  // NEST specific states
  const [nestCandidateName, setNestCandidateName] = useState('John Smith');
  const [nestCandidateEmail, setNestCandidateEmail] = useState('candidate@example.com');
  const [nestCandidatePhoto, setNestCandidatePhoto] = useState<string>('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200');

  // Unique Session and Persistence States for Test Resuming
  const [sessionId, setSessionId] = useState<string>('');
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [restoredToast, setRestoredToast] = useState<string | null>(null);

  // Past Sessions Modal States
  const [isPastModalOpen, setIsPastModalOpen] = useState<boolean>(false);
  const [pastSessionsList, setPastSessionsList] = useState<any[]>([]);
  const [isLoadingPastSessions, setIsLoadingPastSessions] = useState<boolean>(false);
  const [searchPastQuery, setSearchPastQuery] = useState<string>('');
  const [manualSessionInput, setManualSessionInput] = useState<string>('');

  const generateSessionId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  };

  const loadPastSessions = async () => {
    setIsLoadingPastSessions(true);
    setIsPastModalOpen(true);
    const sessionMap = new Map<string, any>();

    // 1. Scan LocalStorage for instant cached tests
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('testSession_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const item = JSON.parse(raw);
            if (item && item.sessionId) {
              sessionMap.set(item.sessionId, item);
            }
          }
        }
      }
    } catch (e) {
      console.warn("LocalStorage scan warning:", e);
    }

    // 2. Fetch from Firestore collections testSessions and examSessions
    try {
      const q1 = query(collection(db, "testSessions"));
      const snap1 = await getDocs(q1);
      snap1.forEach(docSnap => {
        const data = docSnap.data();
        if (data && (data.sessionId || docSnap.id)) {
          sessionMap.set(data.sessionId || docSnap.id, { ...data, sessionId: data.sessionId || docSnap.id });
        }
      });

      const q2 = query(collection(db, "examSessions"));
      const snap2 = await getDocs(q2);
      snap2.forEach(docSnap => {
        const data = docSnap.data();
        if (data && (data.sessionId || docSnap.id)) {
          if (!sessionMap.has(data.sessionId || docSnap.id)) {
            sessionMap.set(data.sessionId || docSnap.id, { ...data, sessionId: data.sessionId || docSnap.id });
          }
        }
      });
    } catch (err) {
      console.warn("Firestore past sessions query warning:", err);
    }

    const list = Array.from(sessionMap.values());
    list.sort((a, b) => {
      const tA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const tB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return tB - tA;
    });

    setPastSessionsList(list);
    setIsLoadingPastSessions(false);
  };

  const restoreSelectedSession = (data: any) => {
    if (!data) return;
    if (data.examType) setExamType(data.examType);
    if (data.cuetQuestions && data.cuetQuestions.length > 0) setCuetQuestions(data.cuetQuestions);
    if (data.cuetAnswers) setCuetAnswers(data.cuetAnswers);
    if (data.cuetStatusMap) setCuetStatusMap(data.cuetStatusMap);
    if (data.cuetTimeLeft !== undefined) setCuetTimeLeft(data.cuetTimeLeft);
    if (data.activeQuestion !== undefined) setActiveQuestion(data.activeQuestion);
    if (data.candidateName) setNestCandidateName(data.candidateName);
    if (data.cuetResult) setCuetResult(data.cuetResult);

    setSessionId(data.sessionId);

    const status = data.cuetStatus || (data.cuetResult ? 'finished' : 'exam');
    if (status === 'finished' || status === 'submitted' || status === 'result') {
      setCuetStatus('finished');
    } else {
      setCuetStatus('exam');
    }

    try {
      window.history.replaceState({}, '', `/${data.examType || 'neet'}/${data.sessionId}`);
    } catch (e) {}

    setIsPastModalOpen(false);
    setRestoredToast(`✨ Test Session [${data.sessionId}] loaded successfully!`);
    setTimeout(() => setRestoredToast(null), 7000);
  };

  const handleManualSearchSubmit = async () => {
    const cleanId = manualSessionInput.trim();
    if (!cleanId) return;

    // Check local
    try {
      const localRaw = localStorage.getItem(`testSession_${cleanId}`);
      if (localRaw) {
        const parsed = JSON.parse(localRaw);
        restoreSelectedSession(parsed);
        return;
      }
    } catch (e) {}

    // Check Firestore
    try {
      let snap = await getDoc(doc(db, "testSessions", cleanId));
      if (!snap.exists()) {
        snap = await getDoc(doc(db, "examSessions", cleanId));
      }
      if (snap.exists()) {
        const remoteData = snap.data();
        restoreSelectedSession({ ...remoteData, sessionId: cleanId });
        return;
      }
    } catch (err) {}

    alert(`No saved test found for Session ID: "${cleanId}"`);
  };

  const saveTestSession = async (targetSessionId: string, statusOverride?: string, resultOverride?: any) => {
    if (!targetSessionId) return;
    try {
      const finalStatus = statusOverride || cuetStatus || 'exam';
      const finalResult = resultOverride !== undefined ? resultOverride : cuetResult || null;

      const sessionData = {
        sessionId: targetSessionId,
        examType: examType || 'neet',
        candidateName: currentUser?.name || nestCandidateName || "PALLAVI",
        cuetQuestions: cuetQuestions || [],
        cuetAnswers: cuetAnswers || {},
        cuetStatusMap: cuetStatusMap || {},
        cuetTimeLeft: cuetTimeLeft ?? 3600,
        cuetStatus: finalStatus,
        cuetResult: finalResult,
        activeQuestion: activeQuestion || 0,
        neetData: neetData || {},
        nestData: nestData || {},
        jipmatData: jipmatData || {},
        updatedAt: new Date().toISOString()
      };

      // Save to localStorage for instant offline/browser recovery
      try {
        localStorage.setItem('currentTestSessionId', targetSessionId);
        localStorage.setItem(`testSession_${targetSessionId}`, JSON.stringify(sessionData));
      } catch (e) {
        console.warn("localStorage write error:", e);
      }

      // Save to Firestore for cross-device persistence
      const firestoreData = {
        ...sessionData,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, "testSessions", targetSessionId), firestoreData, { merge: true });
      await setDoc(doc(db, "examSessions", targetSessionId), firestoreData, { merge: true });
    } catch (err) {
      console.error("Error saving test session to Firestore:", err);
    }
  };

  const initializeNewTestSession = async (overrideExamType?: string) => {
    const newId = generateSessionId();
    const selectedType = overrideExamType || examType || 'neet';
    setSessionId(newId);

    const resumeUrl = `${window.location.origin}/${selectedType}/${newId}`;
    
    try {
      window.history.pushState({}, '', `/${selectedType}/${newId}`);
    } catch (e) {
      console.warn("History pushState failed:", e);
    }

    await saveTestSession(newId, 'exam');

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(resumeUrl);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 9000);
      }
    } catch (e) {
      console.warn("Clipboard auto-copy failed:", e);
    }
  };

  const copyResumeLinkToClipboard = async () => {
    let sid = sessionId;
    if (!sid) {
      sid = generateSessionId();
      setSessionId(sid);
    }
    const exType = examType || 'neet';
    const resumeUrl = `${window.location.origin}/${exType}/${sid}`;
    
    await saveTestSession(sid);
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(resumeUrl);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 7000);
      } else {
        alert(`Resume Link: ${resumeUrl}`);
      }
    } catch (err) {
      alert(`Resume Link: ${resumeUrl}`);
    }
  };

  // On Mount: Check URL or localStorage for session restore parameter
  useEffect(() => {
    const restoreSessionFromUrl = async () => {
      try {
        const pathname = window.location.pathname; // e.g. "/neet/k8x2m9a1"
        const searchParams = new URLSearchParams(window.location.search);
        let sidFromUrl = searchParams.get('sessionId') || searchParams.get('session');

        if (!sidFromUrl && pathname && pathname !== '/') {
          const parts = pathname.split('/').filter(Boolean);
          if (parts.length >= 2) {
            sidFromUrl = parts[1];
          } else if (parts.length === 1 && parts[0].length >= 5) {
            sidFromUrl = parts[0];
          }
        }

        if (!sidFromUrl) {
          const savedSid = localStorage.getItem('currentTestSessionId');
          if (savedSid) {
            sidFromUrl = savedSid;
          }
        }

        if (sidFromUrl) {
          let data: any = null;

          // Check local storage first
          try {
            const localRaw = localStorage.getItem(`testSession_${sidFromUrl}`);
            if (localRaw) {
              data = JSON.parse(localRaw);
            }
          } catch (e) {}

          // Fetch from Firestore
          try {
            let snap = await getDoc(doc(db, "testSessions", sidFromUrl));
            if (!snap.exists()) {
              snap = await getDoc(doc(db, "examSessions", sidFromUrl));
            }

            if (snap.exists()) {
              const remoteData = snap.data();
              if (remoteData) {
                data = remoteData;
              }
            }
          } catch (err) {
            console.warn("Firestore restore fetch warning:", err);
          }

          if (data) {
            if (data.examType) setExamType(data.examType);
            if (data.cuetQuestions && data.cuetQuestions.length > 0) setCuetQuestions(data.cuetQuestions);
            if (data.cuetAnswers) setCuetAnswers(data.cuetAnswers);
            if (data.cuetStatusMap) setCuetStatusMap(data.cuetStatusMap);
            if (data.cuetTimeLeft !== undefined) setCuetTimeLeft(data.cuetTimeLeft);
            if (data.activeQuestion !== undefined) setActiveQuestion(data.activeQuestion);
            if (data.candidateName) setNestCandidateName(data.candidateName);
            if (data.cuetResult) setCuetResult(data.cuetResult);

            setSessionId(sidFromUrl);

            const restoredStatus = data.cuetStatus || (data.cuetResult ? 'finished' : 'exam');

            // CRITICAL DIRECT ROUTING:
            // If already submitted -> Directly open Result Scorecard
            // If mid-way in progress -> Directly open Live Exam view where left off
            if (restoredStatus === 'finished' || restoredStatus === 'submitted' || restoredStatus === 'result') {
              setCuetStatus('finished');
              setRestoredToast(`🎉 Test already submitted! Direct Scorecard Result loaded for session [${sidFromUrl}]`);
            } else {
              setCuetStatus('exam');
              setRestoredToast(`⚡ Test Session Restored! Continued directly from Question ${ (data.activeQuestion || 0) + 1 }`);
            }

            try {
              window.history.replaceState({}, '', `/${data.examType || 'neet'}/${sidFromUrl}`);
            } catch (e) {}

            setTimeout(() => setRestoredToast(null), 9000);
          } else if (sidFromUrl) {
            setRestoredToast(`⚠️ Test Session ID [${sidFromUrl}] not found.`);
            setTimeout(() => setRestoredToast(null), 8000);
          }
        }
      } catch (err) {
        console.error("Error restoring session:", err);
      }
    };

    restoreSessionFromUrl();
  }, []);

  // When exam becomes active, ensure session is created
  useEffect(() => {
    if (cuetStatus === 'exam' && !sessionId) {
      initializeNewTestSession();
    }
  }, [cuetStatus]);

  // Auto-Save periodic timer during live exam
  useEffect(() => {
    if (cuetStatus === 'exam' && sessionId) {
      const timer = setInterval(() => {
        saveTestSession(sessionId);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [cuetStatus, sessionId, cuetAnswers, cuetStatusMap, cuetTimeLeft, activeQuestion]);
  const [nestDefaultLanguage, setNestDefaultLanguage] = useState<'English' | 'Hindi' | ''>('');
  const [isDisclaimerChecked, setIsDisclaimerChecked] = useState(false);
  const [nestTextZoom, setNestTextZoom] = useState(100);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [drawerActiveTab, setDrawerActiveTab] = useState<'profile' | 'more'>('profile');
  const [moreTabSubModal, setMoreTabSubModal] = useState<'instructions' | 'useful-data' | 'group' | 'question' | null>(null);
  const [calculatorTab, setCalculatorTab] = useState<'keypad' | 'help'>('keypad');
  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState('');
  const [keyboardActive, setKeyboardActive] = useState(false);
  const [activeInput, setActiveInput] = useState<'id' | 'password' | null>(null);
  const [nestUserId, setNestUserId] = useState('');
  const [nestPassword, setNestPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const [nestLangSelectModal, setNestLangSelectModal] = useState(false);
  const [calcMemory, setCalcMemory] = useState<number>(0);
  const [isDraggingOverPhoto, setIsDraggingOverPhoto] = useState(false);

  // High Fidelity calculator.net State Variables
  const [cValue, setCValue] = useState<number>(0);
  const [cMemory, setCMemory] = useState<number>(0);
  const [cLevel, setCLevel] = useState<number>(0);
  const [cEntered, setCEntered] = useState<boolean>(true);
  const [cDecimal, setCDecimal] = useState<number>(0);
  const [cFixed, setCFixed] = useState<number>(0);
  const [cExponent, setCExponent] = useState<boolean>(false);
  const [cDigits, setCDigits] = useState<number>(0);
  const [cHj, setCHj] = useState<number>(0);
  const [cStack, setCStack] = useState<{ value: number; op: string; vg: number }[]>([]);
  const [cDegree, setCDegree] = useState<string>('degree'); // 'degree' or 'radians'

  const isDegrees = cDegree === 'degree';

  // Gmail integration states
  const [gmailToken, setGmailToken] = useState<string | null>(() => localStorage.getItem('gmailToken'));
  const [gmailUserEmail, setGmailUserEmail] = useState<string>(() => localStorage.getItem('gmailUserEmail') || '');
  const [gmailUserName, setGmailUserName] = useState<string>(() => localStorage.getItem('gmailUserName') || '');

  useEffect(() => {
    // Attempt to load the shared admin gmail token from Firestore so normal users don't need to authorize
    const loadSharedGmailToken = async () => {
      try {
        const docSnap = await getDoc(doc(db, "adminConfig", "gmail"));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.accessToken) {
            setGmailToken(data.accessToken);
            if (data.email) setGmailUserEmail(data.email);
            if (data.name) setGmailUserName(data.name);
          }
        }
      } catch (err) {
        console.warn("Could not fetch shared gmail token from Firestore, falling back to local:", err);
      }
    };
    loadSharedGmailToken();
  }, []);
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);
  const [emailSentStatus, setEmailSentStatus] = useState<'idle' | 'success' | 'failure' | 'sending'>('idle');
  const [emailErrorMsg, setEmailErrorMsg] = useState<string>('');
  const [gmailAuthError, setGmailAuthError] = useState<string | null>(null);

  const base64SafeUrl = (str: string) => {
    const utf8Bytes = new TextEncoder().encode(str);
    let binary = '';
    const len = utf8Bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const sendResultEmail = async (token: string, results: any) => {
    if (!results) return;
    setEmailSentStatus('sending');
    setEmailErrorMsg('');

    try {
      const name = currentUser?.name || nestCandidateName || "PALLAVI";
      const rollNo = nestUserId || "N/A";
      const formattedExamType = examType === 'nest' ? 'NEST Exam' : examType === 'jipmat' ? 'JIPMAT' : examType === 'neet' ? 'NEET UG' : 'CUET';
      const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

      // Calculate time specs
      const formatSecToMinSec = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = Math.round(s % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      };

      const totalTimeSpentSec = 3600 - cuetTimeLeft;
      const overallTimeSpentStr = formatSecToMinSec(totalTimeSpentSec);

      const correct = results.correct ?? 0;
      const incorrect = results.incorrect ?? 0;
      const left = results.unattempted ?? 0;
      const totalQuestions = results.details?.length ?? 20;
      const score = results.score ?? 0;
      const totalMaxScore = results.total ?? 0;
      const overallAccuracy = (correct + incorrect) > 0 ? (correct / (correct + incorrect)) * 100 : 0;
      const attemptRatio = (((correct + incorrect) / Math.max(1, totalQuestions)) * 100).toFixed(0);

      // Build subject-wise rows if NEST or JIPMAT
      let subjectRows = '';
      if (examType === 'nest' || examType === 'jipmat') {
        const subjectsList = examType === 'jipmat'
          ? ['Quantitative Aptitude (QA)', 'Data Interpretation & Logical Reasoning (DILR)', 'Verbal Ability & Reading Comprehension (VARC)']
          : ['Biology', 'Chemistry', 'Physics'];
        const detailsList = results.details || [];
        
        subjectsList.forEach((sub, idx) => {
          const subQuestions = detailsList.filter((q: any) => q.subject?.toLowerCase() === sub.toLowerCase() || q.subject === sub);
          const subCorrect = subQuestions.filter((q: any) => q.isCorrect).length;
          const subIncorrect = subQuestions.filter((q: any) => q.selectedIdx !== -1 && !q.isCorrect).length;
          const subLeft = subQuestions.filter((q: any) => q.selectedIdx === -1).length;
          const schemeMul = examType === 'jipmat' ? 4 : 3;
          const subScore = subCorrect * schemeMul - subIncorrect;
          const subMax = subQuestions.length * schemeMul;
          const subAccuracyVal = (subCorrect + subIncorrect) > 0 ? ((subCorrect / (subCorrect + subIncorrect)) * 100).toFixed(1) + "%" : "0.0%";
          
          // Est. Section Time
          const subAnswered = subCorrect + subIncorrect;
          const overallAnswered = correct + incorrect || 1;
          const subTimeSpentSec = Math.round((subAnswered / overallAnswered) * totalTimeSpentSec);
          const subTimeStr = formatSecToMinSec(subTimeSpentSec);

          const rowBg = idx % 2 === 0 ? '#f8fafc' : '#eff6ff';

          subjectRows += `
            <tr style="background-color: ${rowBg}; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #334155;">
              <td style="padding: 10px; font-weight: bold; color: #1e293b;">${sub.toUpperCase()}</td>
              <td style="padding: 10px; text-align: center;">${subQuestions.length}</td>
              <td style="padding: 10px; text-align: center; color: #166534; font-weight: bold;">+${subCorrect}</td>
              <td style="padding: 10px; text-align: center; color: #991b1b; font-weight: bold;">-${subIncorrect}</td>
              <td style="padding: 10px; text-align: center; color: #64748b;">${subLeft}</td>
              <td style="padding: 10px; text-align: center; font-weight: bold; color: #0f172a;">${subScore} / ${subMax}</td>
              <td style="padding: 10px; text-align: center;">${subTimeStr}</td>
              <td style="padding: 10px; text-align: center; font-weight: bold; color: #2563eb;">${subAccuracyVal}</td>
            </tr>
          `;
        });

        // Overall Totals Row
        subjectRows += `
          <tr style="background-color: #1e293b; color: #ffffff; font-weight: bold; font-size: 11px;">
            <td style="padding: 10px;">TOTALS</td>
            <td style="padding: 10px; text-align: center;">${totalQuestions}</td>
            <td style="padding: 10px; text-align: center; color: #4ade80;">+${correct}</td>
            <td style="padding: 10px; text-align: center; color: #f87171;">-${incorrect}</td>
            <td style="padding: 10px; text-align: center; color: #94a3b8;">${left}</td>
            <td style="padding: 10px; text-align: center;">${score} / ${totalMaxScore}</td>
            <td style="padding: 10px; text-align: center;">${overallTimeSpentStr}</td>
            <td style="padding: 10px; text-align: center; color: #60a5fa;">${overallAccuracy.toFixed(1)}%</td>
          </tr>
        `;
      }

      // Build selection chance block if NEST
      let selectivityHtml = '';
      if (examType === 'nest') {
        const niserInfo = getNestEstimation(score);
        const rgbColor = `rgb(${niserInfo.badgeColor[0]}, ${niserInfo.badgeColor[1]}, ${niserInfo.badgeColor[2]})`;
        
        selectivityHtml = `
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; margin-top: 16px; border-radius: 12px;">
            <h2 style="margin: 0 0 12px 0; font-size: 15px; font-weight: bold; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px;">NISER Selection Zone & Benchmark Analysis</h2>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 12px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; width: 60%;"><strong>Estimated Percentile Range:</strong></td>
                <td style="padding: 6px 0; color: #166534; font-weight: bold; font-size: 14px;">${niserInfo.percentile}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>NISER Selection Chance (General):</strong></td>
                <td style="padding: 6px 0; color: ${rgbColor}; font-weight: bold;">${niserInfo.chanceGen}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>NISER Selection Chance (EWS):</strong></td>
                <td style="padding: 6px 0; color: ${rgbColor}; font-weight: bold;">${niserInfo.chanceEws}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Suggestive Critique State:</strong></td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${score >= 95 ? "Highly Receptive Zone" : score >= 80 ? "Progressive Border" : "Needs Re-Evaluation"}</td>
              </tr>
            </table>

            <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 12px; border-radius: 4px; font-size: 12.5px; line-height: 1.5; color: #1e3a8a;">
              <strong>Diagnostic Critique & Core Suggestions:</strong><br/>
              ${niserInfo.suggestion}
            </div>
          </div>
        `;
      }

      // Build question by question analysis in HTML
      let questionAnalysisHtml = '';
      (results.details || []).forEach((item: any, idx: number) => {
        const isQCorrect = item.isCorrect;
        const isQUnattempted = item.selectedIdx === -1;
        
        let statusText = '';
        let statusColor = '';
        let statusBg = '';
        
        if (isQUnattempted) {
          statusText = 'Unattempted';
          statusColor = '#475569';
          statusBg = '#f1f5f9';
        } else if (isQCorrect) {
          statusText = 'Correct';
          statusColor = '#15803d';
          statusBg = '#f0fdf4';
        } else {
          const correctChoice = String.fromCharCode(65 + item.correct);
          const candidateChoice = String.fromCharCode(65 + item.selectedIdx);
          statusText = `Incorrect (Selected: ${candidateChoice}, Correct: ${correctChoice})`;
          statusColor = '#b91c1c';
          statusBg = '#fef2f2';
        }

        let optionsHtml = '';
        item.options.forEach((opt: string, optIdx: number) => {
          const isCorrectOption = optIdx === item.correct;
          const isSelectedOption = optIdx === item.selectedIdx;
          
          let optBg = '#ffffff';
          let optBorder = '#e2e8f0';
          let optColor = '#1e293b';
          
          if (isCorrectOption) {
            optBg = '#15803d';
            optColor = '#ffffff';
            optBorder = '#15803d';
          } else if (isSelectedOption) {
            optBg = '#b91c1c';
            optColor = '#ffffff';
            optBorder = '#b91c1c';
          }

          optionsHtml += `
            <div style="background-color: ${optBg}; border: 1px solid ${optBorder}; color: ${optColor}; padding: 8px 12px; margin-bottom: 6px; border-radius: 6px; font-size: 13px;">
              ${String.fromCharCode(65 + optIdx)}) ${opt}
            </div>
          `;
        });

        const hasDiagram = item.diagramSvg ? '<em style="color:#64748b; font-size:11px; display:block; margin: 4px 0 8px 0;">[Contains embedded math/science vector diagram]</em>' : '';
        const qSub = item.subject ? `<span style="font-size:11px; font-weight:bold; color:#4f46e5; text-transform:uppercase;">[${item.subject}]</span>` : '';

        questionAnalysisHtml += `
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 16px; margin-bottom: 12px; border-radius: 8px;">
            <p style="margin: 0 0 4px 0; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold;">Question ${idx + 1} ${qSub}</p>
            <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #0f172a;">${item.question}</p>
            ${hasDiagram}
            <div style="margin-top: 8px;">
              ${optionsHtml}
            </div>
            <div style="margin-top: 10px; display: inline-block; background-color: ${statusBg}; color: ${statusColor}; padding: 4px 10px; font-size: 12px; font-weight: bold; border-radius: 12px;">
              Status: ${statusText}
            </div>
          </div>
        `;
      });

      // Construct detailed email layout
      const emailHtmlBody = `
        <div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px;">
          <div style="background-color: #1e293b; padding: 24px; text-align: center; border-radius: 12px 12px 0 0; color: #ffffff;">
            <h1 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: -0.5px;">${formattedExamType} 2026</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #93c5fd; font-weight: bold; text-transform: uppercase;">Official Examination Performance Report</p>
          </div>

          <div style="background-color: #ffffff; border-left: 4px solid #4f46e5; padding: 16px; margin-top: 16px; border-radius: 0 12px 12px 0; background-color: #eef2ff;">
            <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #312e81;">
              <strong>Software Developer Intimation:</strong> This performance report has been compiled and dispatched automatically by <strong>Shubhjeet Ram Tripathi (Software Developer)</strong> on behalf of the candidate who just completed their mock evaluation.
            </p>
          </div>

          <div style="background-color: #ffffff; padding: 20px; margin-top: 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <h2 style="margin: 0 0 12px 0; font-size: 15px; font-weight: bold; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px;">Candidate Profile</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 4px 0; color: #64748b; width: 40%;"><strong>Candidate Name:</strong></td>
                <td style="padding: 4px 0; color: #0f172a;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;"><strong>Roll / Login ID:</strong></td>
                <td style="padding: 4px 0; color: #0f172a;">${rollNo}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;"><strong>Evaluation Stream:</strong></td>
                <td style="padding: 4px 0; color: #0f172a;">${formattedExamType}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;"><strong>Date of Exam:</strong></td>
                <td style="padding: 4px 0; color: #0f172a;">${timestamp}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;"><strong>Proctor Shield:</strong></td>
                <td style="padding: 4px 0; color: #16a34a; font-weight: bold;">TCS iON Security Shield Enforced</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #ffffff; padding: 24px; margin-top: 16px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center;">
            <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; letter-spacing: 1px;">Overall Marks Obtained</p>
            <h3 style="margin: 8px 0; font-size: 44px; font-weight: 800; color: #0f172a;">${score} <span style="font-size: 18px; color: #64748b;">/ ${totalMaxScore}</span></h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
              <tr>
                <td style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px; text-align: center; width: 25%;">
                  <p style="margin: 0; font-size: 10px; color: #166534; font-weight: bold; text-transform: uppercase;">Correct</p>
                  <p style="margin: 2px 0 0 0; font-size: 18px; font-weight: bold; color: #15803d;">${correct}</p>
                </td>
                <td style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px; text-align: center; width: 25%;">
                  <p style="margin: 0; font-size: 10px; color: #991b1b; font-weight: bold; text-transform: uppercase;">Incorrect</p>
                  <p style="margin: 2px 0 0 0; font-size: 18px; font-weight: bold; color: #b91c1c;">${incorrect}</p>
                </td>
                <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; width: 25%;">
                  <p style="margin: 0; font-size: 10px; color: #475569; font-weight: bold; text-transform: uppercase;">Left</p>
                  <p style="margin: 2px 0 0 0; font-size: 18px; font-weight: bold; color: #334155;">${left}</p>
                </td>
                <td style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px; text-align: center; width: 25%;">
                  <p style="margin: 0; font-size: 10px; color: #1e40af; font-weight: bold; text-transform: uppercase;">Accuracy</p>
                  <p style="margin: 2px 0 0 0; font-size: 18px; font-weight: bold; color: #2563eb;">${overallAccuracy.toFixed(1)}%</p>
                </td>
              </tr>
            </table>

            <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
              <tr>
                <td style="font-size: 12px; color: #64748b; text-align: left;"><strong>Total Time Spent:</strong> ${overallTimeSpentStr}</td>
                <td style="font-size: 12px; color: #64748b; text-align: right;"><strong>Attempt Rate:</strong> ${correct + incorrect} / ${totalQuestions} (${attemptRatio}%)</td>
              </tr>
            </table>
          </div>

          <!-- Selectivity and Benchmark block (NEST only) -->
          ${selectivityHtml}

          ${(examType === 'nest' || examType === 'jipmat') ? `
          <div style="background-color: #ffffff; padding: 20px; margin-top: 16px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <h2 style="margin: 0 0 12px 0; font-size: 15px; font-weight: bold; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px;">Subject Section Performance Matrix</h2>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                  <tr style="background-color: #1e293b; color: #ffffff;">
                    <th style="padding: 10px; text-align: left;">Section</th>
                    <th style="padding: 10px; text-align: center;">Total Qs</th>
                    <th style="padding: 10px; text-align: center;">Correct (+${examType === 'jipmat' ? '4' : '3'})</th>
                    <th style="padding: 10px; text-align: center;">Incorrect (-1)</th>
                    <th style="padding: 10px; text-align: center;">Left (0)</th>
                    <th style="padding: 10px; text-align: center;">Sec Score</th>
                    <th style="padding: 10px; text-align: center;">Est. Time</th>
                    <th style="padding: 10px; text-align: center;">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  ${subjectRows}
                </tbody>
              </table>
            </div>
          </div>
          ` : ''}

          <div style="margin-top: 20px;">
            <h2 style="margin: 0 0 12px 0; font-size: 15px; font-weight: bold; color: #0f172a;">Option-by-Option Submissions Report</h2>
            ${questionAnalysisHtml}
          </div>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; line-height: 1.5;">
            <p style="margin: 0;">This email is a certified secure intimation of the digital testing platform.</p>
            <p style="margin: 6px 0 0 0; font-size: 12px; color: #0f172a; font-weight: bold;">
              Shubhjeet Ram Tripathi — Senior Software Developer
            </p>
          </div>
        </div>
      `;

      const recipientList = ['jitendrakumart557@gmail.com', 'pt617339@gmail.com'];
      if (nestCandidateEmail && nestCandidateEmail.trim()) {
        recipientList.push(nestCandidateEmail.trim());
      }
      const toValue = recipientList.join(', ');

      const rfcMailString = [
        `From: me`,
        `To: ${toValue}`,
        `Subject: ${formattedExamType} 2026 Submission Report - Candidate: ${name}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=utf-8`,
        ``,
        emailHtmlBody
      ].join('\r\n');

      const encodedMailRaw = base64SafeUrl(rfcMailString);

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          raw: encodedMailRaw
        })
      });

      if (!response.ok) {
        const errorDetails = await response.json();
        throw new Error(errorDetails.error?.message || 'Failed to dispatch email');
      }

      setEmailSentStatus('success');
    } catch (err: any) {
      console.error("Email send failed:", err);
      setEmailSentStatus('failure');
      setEmailErrorMsg(err?.message || String(err));
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGmailAuthError(null);
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/gmail.send');
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGmailToken(credential.accessToken);
        localStorage.setItem('gmailToken', credential.accessToken);
        setGmailAuthError(null);
        
        let userEmail = result.user.email || '';
        let userName = result.user.displayName || '';

        if (userEmail) {
          setGmailUserEmail(userEmail);
          localStorage.setItem('gmailUserEmail', userEmail);
        }
        if (userName) {
          setGmailUserName(userName);
          localStorage.setItem('gmailUserName', userName);
        }

        // Save token & user infomation to Firestore globally
        try {
          await setDoc(doc(db, "adminConfig", "gmail"), {
            accessToken: credential.accessToken,
            email: userEmail || "pt617339@gmail.com",
            name: userName || "Admin",
            updatedAt: new Date().toISOString()
          });
          console.log("Admin config gmail token successfully synchronized to Firestore.");
        } catch (dbErr) {
          console.error("Failed to write gmail token to Firestore:", dbErr);
        }

        if (cuetStatus === 'finished' && cuetResult) {
          sendResultEmail(credential.accessToken, cuetResult);
        }
      }
    } catch (err: any) {
      console.error("Gmail authorization issue:", err);
      setEmailSentStatus('failure');
      const errCode = err?.code || "";
      const errMsg = err?.message || "";
      
      if (errCode === 'auth/popup-closed-by-user' || errCode === 'auth/cancelled-popup-request' || errMsg.includes('closed') || errMsg.includes('cancel')) {
        setGmailAuthError("The Google sign-in window was closed. To link your account: click 'Authorize Gmail Account' again, then click on 'Advanced' -> 'Go to react-example (unsafe)' inside the popup to bypass the validation screen.");
        setEmailErrorMsg("Authorization popup was closed. Click 'Advanced' -> 'Go to react-example (unsafe)' to proceed.");
      } else {
        setGmailAuthError(errMsg || "Google Authentication failed. Please try again.");
        setEmailErrorMsg(errMsg || "Google Authentication failed. Please try again.");
      }
    }
  };

  useEffect(() => {
    if (cuetStatus === 'finished' && cuetResult && gmailToken && emailSentStatus === 'idle') {
      sendResultEmail(gmailToken, cuetResult);
    }
  }, [cuetStatus, cuetResult, gmailToken, emailSentStatus]);

  const formatCalcValue = (val: number, enteredVal: boolean, fixedVal: number): string => {
    let E = "" + val;
    if (E.indexOf("N") >= 0 || (val === 2 * val && val === 1 + val)) {
      return "Error ";
    }
    let G = E.indexOf("e");
    if (G >= 0) {
      let A = E.substring(G + 1, E.length);
      if (G > 11) G = 11;
      E = E.substring(0, G);
      if (E.indexOf(".") < 0) {
        E += ".";
      } else {
        let j = E.length - 1;
        while (j >= 0 && E.charAt(j) === "0") {
          --j;
        }
        E = E.substring(0, j + 1);
      }
      E += " " + A;
    } else {
      let J = false;
      if (val < 0) {
        val = -val;
        J = true;
      }
      let C = Math.floor(val);
      let K = val - C;
      let D = 12 - ("" + C).length - 1;
      if (!enteredVal && fixedVal > 0) {
        D = fixedVal;
      }
      let FStr = " 1000000000000000000".substring(1, D + 2);
      let F = (FStr === "" || FStr === " ") ? 1 : parseInt(FStr);
      let B = Math.floor(K * F + 0.5);
      C = Math.floor(Math.floor(val * F + 0.5) / F);
      if (J) {
        E = "-" + C;
      } else {
        E = "" + C;
      }
      let H = "00000000000000" + B;
      H = H.substring(H.length - D, H.length);
      G = H.length - 1;
      if (enteredVal || fixedVal === 0) {
        while (G >= 0 && H.charAt(G) === "0") {
          --G;
        }
        H = H.substring(0, G + 1);
      }
      if (G >= 0) {
        E += "." + H;
      }
    }
    return E;
  };

  const getCalcFormattedDisplay = (): string => {
    let A = formatCalcValue(cValue, cEntered, cFixed);
    if (cExponent) {
      if (cHj < 0) {
        A += " " + cHj;
      } else {
        A += " +" + cHj;
      }
    }
    if (A.indexOf(".") < 0 && A !== "Error ") {
      if (cEntered || cDecimal > 0) {
        A += ".";
      } else {
        A += " ";
      }
    }
    return A;
  };

  const pushStack = (val: number, op: string, vg: number, currentLevel: number, currentStack: any[]) => {
    if (currentLevel === 12) return null;
    const nextStack = [{ value: val, op, vg }, ...currentStack];
    return {
      stack: nextStack,
      level: currentLevel + 1
    };
  };

  const runEvalx = (currentVal: number, currentLevel: number, currentStack: any[]) => {
    if (currentLevel === 0) return { val: currentVal, lvl: currentLevel, stk: currentStack, keepGoing: false };
    const top = currentStack[0];
    const op = top.op;
    const Qk = top.value;
    let newVal = currentVal;
    if (op === "+") {
      newVal = parseFloat(Qk) + currentVal;
    } else if (op === "-") {
      newVal = Qk - currentVal;
    } else if (op === "*") {
      newVal = Qk * currentVal;
    } else if (op === "/") {
      newVal = Qk / currentVal;
    } else if (op === "pow") {
      newVal = Math.pow(Qk, currentVal);
    } else if (op === "apow") {
      newVal = Math.pow(Qk, 1 / currentVal);
    }

    const nextStack = currentStack.slice(1);
    const nextLevel = currentLevel - 1;

    if (op === "(") {
      return { val: newVal, lvl: nextLevel, stk: nextStack, keepGoing: false };
    }
    return { val: newVal, lvl: nextLevel, stk: nextStack, keepGoing: true };
  };

  const runEnter = (currentVal: number, isExp: boolean, explVal: number) => {
    let newVal = currentVal;
    if (isExp) {
      newVal = currentVal * Math.exp(explVal * Math.LN10);
    }
    return {
      val: newVal,
      entered: true,
      exponent: false,
      decimal: 0,
      fixed: 0
    };
  };

  const runNumInput = (
    A: number,
    currentVal: number,
    digits: number,
    entered: boolean,
    isExponent: boolean,
    valHj: number,
    decimal: number,
    fixed: number
  ) => {
    let newVal = currentVal;
    let newDigits = digits;
    let newEntered = entered;
    let newHj = valHj;
    let newDecimal = decimal;
    let newFixed = fixed;

    if (newEntered) {
      newVal = 0;
      newDigits = 0;
      newEntered = false;
    }

    if (A === 0 && newDigits === 0) {
      return { val: newVal, digits: newDigits, entered: newEntered, hj: newHj, decimal: newDecimal, fixed: newFixed };
    }

    if (isExponent) {
      let appendA = A;
      if (newHj < 0) appendA = -A;
      if (newDigits < 3) {
        newHj = newHj * 10 + appendA;
        newDigits = newDigits + 1;
      }
      return { val: newVal, digits: newDigits, entered: newEntered, hj: newHj, decimal: newDecimal, fixed: newFixed };
    }

    if (newVal < 0) {
      A = -A;
    }

    if (newDigits < 11) {
      newDigits = newDigits + 1;
      if (newDecimal > 0) {
        newDecimal = newDecimal * 10;
        newVal = newVal + (A / newDecimal);
        newFixed = newFixed + 1;
      } else {
        newVal = newVal * 10 + A;
      }
    }

    return { val: newVal, digits: newDigits, entered: newEntered, hj: newHj, decimal: newDecimal, fixed: newFixed };
  };

  const runOpt = (
    A: string,
    currentVal: number,
    currentLevel: number,
    currentStack: any[],
    isExp: boolean,
    valHj: number
  ) => {
    const ent = runEnter(currentVal, isExp, valHj);
    let newVal = ent.val;

    let vg = 1;
    if (A === "+" || A === "-") vg = 1;
    else if (A === "*" || A === "/") vg = 2;
    else if (A === "pow" || A === "apow") vg = 3;

    let nextLvl = currentLevel;
    let nextStk = [...currentStack];

    if (nextLvl > 0 && vg <= nextStk[0].vg) {
      const ev = runEvalx(newVal, nextLvl, nextStk);
      newVal = ev.val;
      nextLvl = ev.lvl;
      nextStk = ev.stk;
    }

    const p = pushStack(newVal, A, vg, nextLvl, nextStk);
    if (!p) {
      return {
        val: NaN,
        lvl: nextLvl,
        stk: nextStk,
        entered: true,
        exponent: false,
        decimal: 0,
        fixed: 0
      };
    }

    return {
      val: newVal,
      lvl: p.level,
      stk: p.stack,
      entered: true,
      exponent: false,
      decimal: 0,
      fixed: 0
    };
  };

  const runPopen = (
    currentVal: number,
    currentLevel: number,
    currentStack: any[],
    isExp: boolean,
    valHj: number
  ) => {
    const ent = runEnter(currentVal, isExp, valHj);
    const p = pushStack(0, "(", 0, currentLevel, currentStack);
    if (!p) {
      return {
        val: NaN,
        lvl: currentLevel,
        stk: currentStack,
        entered: ent.entered,
        exponent: ent.exponent,
        decimal: ent.decimal,
        fixed: ent.fixed
      };
    }
    return {
      val: ent.val,
      lvl: p.level,
      stk: p.stack,
      entered: ent.entered,
      exponent: ent.exponent,
      decimal: ent.decimal,
      fixed: ent.fixed
    };
  };

  const runPclose = (
    currentVal: number,
    currentLevel: number,
    currentStack: any[],
    isExp: boolean,
    valHj: number
  ) => {
    const ent = runEnter(currentVal, isExp, valHj);
    let newVal = ent.val;
    let nextLvl = currentLevel;
    let nextStk = [...currentStack];

    let keepGoing = true;
    while (keepGoing && nextLvl > 0) {
      const ev = runEvalx(newVal, nextLvl, nextStk);
      newVal = ev.val;
      nextLvl = ev.lvl;
      nextStk = ev.stk;
      keepGoing = ev.keepGoing;
    }

    return {
      val: newVal,
      lvl: nextLvl,
      stk: nextStk,
      entered: ent.entered,
      exponent: ent.exponent,
      decimal: ent.decimal,
      fixed: ent.fixed
    };
  };

  const runFunc = (
    D: string,
    currentVal: number,
    isExp: boolean,
    valHj: number,
    memory: number,
    degreeMode: string
  ) => {
    const ent = runEnter(currentVal, isExp, valHj);
    let newVal = ent.val;
    let nextMemory = memory;

    if (D === "1/x") {
      newVal = 1 / newVal;
    } else if (D === "pc") {
      newVal = newVal / 100;
    } else if (D === "qc") {
      newVal = newVal / 1000;
    } else if (D === "n!") {
      if (newVal < 0 || newVal > 200 || newVal !== Math.round(newVal)) {
        newVal = NaN;
      } else {
        let E = 1;
        for (let A = 1; A <= newVal; ++A) {
          E *= A;
        }
        newVal = E;
      }
    } else if (D === "MR") {
      newVal = memory;
    } else if (D === "M+") {
      nextMemory = memory + newVal;
    } else if (D === "MS") {
      nextMemory = newVal;
    } else if (D === "MC") {
      nextMemory = 0;
    } else if (D === "M-") {
      nextMemory = memory - newVal;
    } else if (D === "asin") {
      if (degreeMode === "degree") {
        newVal = (Math.asin(newVal) * 180) / Math.PI;
      } else {
        newVal = Math.asin(newVal);
      }
    } else if (D === "acos") {
      if (degreeMode === "degree") {
        newVal = (Math.acos(newVal) * 180) / Math.PI;
      } else {
        newVal = Math.acos(newVal);
      }
    } else if (D === "atan") {
      if (degreeMode === "degree") {
        newVal = (Math.atan(newVal) * 180) / Math.PI;
      } else {
        newVal = Math.atan(newVal);
      }
    } else if (D === "e^x" || D === "ex") {
      newVal = Math.pow(Math.E, newVal);
    } else if (D === "2^x") {
      newVal = Math.exp(newVal * Math.LN2);
    } else if (D === "10x") {
      newVal = Math.pow(10, newVal);
    } else if (D === "x^2" || D === "x2") {
      newVal = newVal * newVal;
    } else if (D === "x3" || D === "x^3" || D === "x3") {
      newVal = newVal * newVal * newVal;
    } else if (D === "3x") {
      newVal = Math.pow(newVal, 1 / 3);
    } else if (D === "e") {
      newVal = Math.E;
    } else if (D === "pi") {
      newVal = Math.PI;
    } else if (D === "RND") {
      newVal = Math.random();
    } else if (D === "sin") {
      if (degreeMode === "degree") {
        newVal = Math.sin((newVal / 180) * Math.PI);
      } else {
        newVal = Math.sin(newVal);
      }
    } else if (D === "cos") {
      if (degreeMode === "degree") {
        let C = newVal % 360;
        if (C < 0) C = C + 360;
        if (C === 90 || C === 270) {
          newVal = 0;
        } else {
          newVal = Math.cos((newVal / 180) * Math.PI);
        }
      } else {
        let C = ((newVal * 180) / Math.PI) % 360;
        if (C < 0) C = C + 360;
        if (Math.abs(C - 90) < 1e-10 || Math.abs(C - 270) < 1e-10) {
          newVal = 0;
        } else {
          newVal = Math.cos(newVal);
        }
      }
    } else if (D === "tan") {
      if (degreeMode === "degree") {
        newVal = Math.tan((newVal / 180) * Math.PI);
      } else {
        newVal = Math.tan(newVal);
      }
    } else if (D === "log") {
      newVal = Math.log(newVal) / Math.LN10;
    } else if (D === "log2") {
      newVal = Math.log(newVal) / Math.LN2;
    } else if (D === "ln") {
      newVal = Math.log(newVal);
    } else if (D === "sqrt") {
      newVal = Math.sqrt(newVal);
    }

    return {
      val: newVal,
      memory: nextMemory,
      entered: ent.entered,
      exponent: ent.exponent,
      decimal: ent.decimal,
      fixed: ent.fixed
    };
  };

  const handleKeyboardKeyPress = (key: string) => {
    setLoginError('');
    if (activeInput === null) return;
    const isId = activeInput === 'id';
    const currentVal = isId ? nestUserId : nestPassword;
    const setVal = isId ? setNestUserId : setNestPassword;

    if (key === 'Backspace') {
      setVal(currentVal.slice(0, -1));
    } else if (key === 'Clear') {
      setVal('');
    } else if (key === 'Space') {
      setVal(currentVal + ' ');
    } else if (key === 'Tab' || key === 'Enter' || key === 'Close' || key === 'Caps' || key === 'Shift') {
      if (key === 'Close' || key === 'Enter') {
        setKeyboardActive(false);
        setActiveInput(null);
      }
    } else {
      setVal(currentVal + key);
    }
  };

  const handleCalcKeyPress = (key: string) => {
    if (key === "sin" || key === "cos" || key === "tan" || key === "asin" || key === "acos" || key === "atan" || key === "e" || key === "pi" || key === "n!" || key === "x2" || key === "1/x" || key === "swap" || key === "x3" || key === "3x" || key === "RND" || key === "M-" || key === "qc" || key === "MC" || key === "MR" || key === "MS" || key === "M+" || key === "sqrt" || key === "pc" || key === "ex" || key === "10x") {
      if (key === "swap" && cLevel > 0 && cStack.length > 0) {
        const ent = runEnter(cValue, cExponent, cHj);
        let activeVal = ent.val;
        let topVal = cStack[0].value;
        const nextStack = [...cStack];
        nextStack[0] = { ...nextStack[0], value: activeVal };
        setCValue(topVal);
        setCStack(nextStack);
        setCEntered(ent.entered);
        setCExponent(ent.exponent);
        setCDecimal(ent.decimal);
        setCFixed(ent.fixed);
        return;
      }
      
      const res = runFunc(key, cValue, cExponent, cHj, cMemory, cDegree);
      setCValue(res.val);
      setCMemory(res.memory);
      setCEntered(res.entered);
      setCExponent(res.exponent);
      setCDecimal(res.decimal);
      setCFixed(res.fixed);
    } else if (typeof key === "number" || /^[0-9]$/.test(key)) {
      const num = parseInt(key);
      const res = runNumInput(num, cValue, cDigits, cEntered, cExponent, cHj, cDecimal, cFixed);
      setCValue(res.val);
      setCDigits(res.digits);
      setCEntered(res.entered);
      setCHj(res.hj);
      setCDecimal(res.decimal);
      setCFixed(res.fixed);
    } else if (key === "pow" || key === "apow" || key === "+" || key === "-" || key === "*" || key === "/") {
      const res = runOpt(key, cValue, cLevel, cStack, cExponent, cHj);
      setCValue(res.val);
      setCLevel(res.lvl);
      setCStack(res.stk);
      setCEntered(res.entered);
      setCExponent(res.exponent);
      setCDecimal(res.decimal);
      setCFixed(res.fixed);
    } else if (key === "(") {
      const res = runPopen(cValue, cLevel, cStack, cExponent, cHj);
      setCValue(res.val);
      setCLevel(res.lvl);
      setCStack(res.stk);
      setCEntered(res.entered);
      setCExponent(res.exponent);
      setCDecimal(res.decimal);
      setCFixed(res.fixed);
    } else if (key === ")") {
      const res = runPclose(cValue, cLevel, cStack, cExponent, cHj);
      setCValue(res.val);
      setCLevel(res.lvl);
      setCStack(res.stk);
      setCEntered(res.entered);
      setCExponent(res.exponent);
      setCDecimal(res.decimal);
      setCFixed(res.fixed);
    } else if (key === "EXP") {
      if (cEntered || cExponent) return;
      setCExponent(true);
      setCHj(0);
      setCDigits(0);
      setCDecimal(0);
    } else if (key === ".") {
      let nextEntered = cEntered;
      let nextValue = cValue;
      let nextDigits = cDigits;
      let nextDecimal = cDecimal;

      if (nextEntered) {
        nextValue = 0;
        nextDigits = 1;
        nextEntered = false;
      }
      if (nextDecimal === 0 && nextValue === 0 && nextDigits === 0) {
        nextDigits = 1;
      }
      if (nextDecimal === 0) {
        nextDecimal = 1;
      }

      setCEntered(nextEntered);
      setCValue(nextValue);
      setCDigits(nextDigits);
      setCDecimal(nextDecimal);
    } else if (key === "+/-") {
      if (cExponent) {
        setCHj(-cHj);
      } else {
        setCValue(-cValue);
      }
    } else if (key === "C" || key === "Backspace") {
      if (key === "Backspace") {
        if (!cEntered) {
          const s = String(cValue);
          if (s.length > 1) {
            const next = parseFloat(s.slice(0, -1));
            setCValue(isNaN(next) ? 0 : next);
          } else {
            setCValue(0);
          }
        }
      } else {
        setCLevel(0);
        setCExponent(false);
        setCValue(0);
        setCStack([]);
        setCEntered(true);
        setCDecimal(0);
        setCFixed(0);
      }
    } else if (key === "=") {
      const ent = runEnter(cValue, cExponent, cHj);
      let newVal = ent.val;
      let nextLvl = cLevel;
      let nextStk = [...cStack];

      while (nextLvl > 0) {
        const ev = runEvalx(newVal, nextLvl, nextStk);
        newVal = ev.val;
        nextLvl = ev.lvl;
        nextStk = ev.stk;
      }

      setCValue(newVal);
      setCLevel(nextLvl);
      setCStack(nextStk);
      setCEntered(ent.entered);
      setCExponent(ent.exponent);
      setCDecimal(ent.decimal);
      setCFixed(ent.fixed);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNestCandidatePhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverPhoto(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNestCandidatePhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Proctoring logic
  useEffect(() => {
    if (cuetStatus === 'exam') {
      const handleBlur = () => {
        setCuetStatus('terminated');
        setCuetIsLocked(true);
      };
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          setCuetStatus('terminated');
          setCuetIsLocked(true);
        }
      };
      window.addEventListener('blur', handleBlur);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        window.removeEventListener('blur', handleBlur);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [cuetStatus, setCuetStatus, setCuetIsLocked]);

  // Timer
  useEffect(() => {
    if (cuetStatus === 'exam' && cuetTimeLeft > 0) {
      const timer = setInterval(() => setCuetTimeLeft((prev: number) => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (cuetStatus === 'exam' && cuetTimeLeft === 0) {
      handleFinishExam();
    }
  }, [cuetStatus, cuetTimeLeft]);

  // Initialize status map for new questions
  useEffect(() => {
    if (cuetQuestions.length > 0 && (Object.keys(cuetStatusMap).length === 0 || cuetQuestions.length !== Object.keys(cuetStatusMap).length)) {
        const initialMap: any = {};
        cuetQuestions.forEach((_: any, i: number) => initialMap[i] = 'not-visited');
        initialMap[0] = 'not-answered';
        setCuetStatusMap(initialMap);
    }
  }, [cuetQuestions]);

  const updateStatus = (index: number, status: any) => {
      setCuetStatusMap((prev: any) => ({ ...prev, [index]: status }));
  };

  const handleFinishExam = () => {
    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;
    
    // NEET Marking: +4, -1, 0
    // CUET Marking: +5, -1, 0
    // NEST Marking: +3, -1, 0
    // JIPMAT Marking: +4, -1, 0
    const correctScore = examType === 'neet' ? 4 : examType === 'jipmat' ? 4 : examType === 'nest' ? 3 : 5;
    const incorrectPenalty = 1;

    const detailedResults = cuetQuestions.map((q: any, idx: number) => {
      const selected = cuetAnswers[idx];
      const selectedIdx = selected !== undefined ? parseInt(selected) : -1;
      const isCorrect = selectedIdx === q.correct;
      
      if (selected === undefined) {
        unattemptedCount++;
      } else if (isCorrect) {
        score += correctScore;
        correctCount++;
      } else {
        score -= incorrectPenalty;
        incorrectCount++;
      }

      return {
        ...q,
        selectedIdx,
        isCorrect
      };
    });

    const finalResult = { 
      score, 
      correct: correctCount, 
      incorrect: incorrectCount, 
      unattempted: unattemptedCount, 
      total: cuetQuestions.length * correctScore,
      details: detailedResults
    };

    setCuetResult(finalResult);
    setCuetStatus('finished');

    if (sessionId) {
      saveTestSession(sessionId, 'finished', finalResult);
    }
  };

  if (cuetStatus === 'selection') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 space-y-10">
        {/* Portal Header */}
        <div className="text-center space-y-3 max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
            Mock Assessment Portal
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed">
            Select an examination stream to launch your timed practice evaluation. Your detailed diagnostic scorecard and question analysis will be compiled after submission.
          </p>
        </div>

        {/* 4-Column Exams Grid */}
        <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setExamType('cuet'); setCuetStatus('upload'); }}
            className="bg-white p-8 rounded-[40px] text-center space-y-6 shadow-2xl border-4 border-transparent hover:border-blue-500 transition-all flex flex-col justify-between items-center"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">CUET 2026</h3>
              <p className="text-slate-500 font-bold uppercase text-[10px] mt-2 tracking-widest">Common University Entrance Test</p>
            </div>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setExamType('neet'); setCuetStatus('upload'); }}
            className="bg-white p-8 rounded-[40px] text-center space-y-6 shadow-2xl border-4 border-transparent hover:border-red-500 transition-all flex flex-col justify-between items-center"
          >
            <div className="w-16 h-16 bg-red-100 rounded-3xl flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">NEET UG</h3>
              <p className="text-slate-500 font-bold uppercase text-[10px] mt-2 tracking-widest">National Eligibility cum Entrance Test</p>
            </div>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setExamType('nest'); setCuetStatus('upload'); }}
            className="bg-white p-8 rounded-[40px] text-center space-y-6 shadow-2xl border-4 border-transparent hover:border-emerald-500 transition-all flex flex-col justify-between items-center"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center">
              <Monitor className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">NEST Exam</h3>
              <p className="text-slate-500 font-bold uppercase text-[10px] mt-2 tracking-widest">National Entrance Screening Test</p>
            </div>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setExamType('jipmat'); setCuetStatus('upload'); }}
            className="bg-white p-8 rounded-[40px] text-center space-y-6 shadow-2xl border-4 border-transparent hover:border-orange-500 transition-all flex flex-col justify-between items-center"
          >
            <div className="w-16 h-16 bg-orange-100 rounded-3xl flex items-center justify-center">
              <Zap className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">JIPMAT</h3>
              <p className="text-slate-500 font-bold uppercase text-[10px] mt-2 tracking-widest">Joint Integrated Programme in Management</p>
            </div>
          </motion.button>
        </div>

        {/* View / Search Saved Test Results Button */}
        <div className="pt-4 flex flex-col items-center">
          <button
            onClick={loadPastSessions}
            className="bg-slate-800 hover:bg-slate-700 text-emerald-400 font-black text-xs uppercase px-8 py-3.5 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 transition-all active:scale-95 cursor-pointer"
          >
            <Search className="w-4 h-4 text-emerald-400" />
            <span>📜 View / Search All Saved Test Results & History</span>
          </button>
        </div>
      </div>
    );
  }

  const downloadDetailedPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const formatSecToMinSec = (s: number) => {
      const mins = Math.floor(s / 60);
      const secs = Math.round(s % 60);
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Helper to capitalize strings
    const statToCapital = (str: string) => {
      if (!str) return "General";
      return str.charAt(0).toUpperCase() + str.slice(1);
    };

    // Helper to convert SVG to image
    const svgToBase64Image = (svgString: string): Promise<string> => {
      return new Promise((resolve) => {
        if (!svgString || !svgString.trim()) {
          resolve('');
          return;
        }
        const img = new Image();
        let cleanSvg = svgString.trim();
        if (!cleanSvg.startsWith('<svg')) {
          const svgMatch = cleanSvg.match(/<svg[\s\S]*<\/svg>/);
          if (svgMatch) {
             cleanSvg = svgMatch[0];
          }
        }
        if (!cleanSvg.includes('xmlns=')) {
          cleanSvg = cleanSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        try {
          const svgBlob = new Blob([cleanSvg], { type: 'image/svg+xml;charset=utf-8' });
          const reader = new FileReader();
          reader.onloadend = () => {
            const b64 = reader.result as string;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width || 400;
              canvas.height = img.height || 200;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              }
              resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = () => resolve('');
            img.src = b64;
          };
          reader.onerror = () => resolve('');
          reader.readAsDataURL(svgBlob);
        } catch (e) {
          console.error(e);
          resolve('');
        }
      });
    };

    if (examType === 'nest' || examType === 'jipmat') {
      // OVERVIEW PAGE (Page 1)
      let y = 15;

      // Header Banner
      doc.setFillColor(30, 41, 59); // Slate Hue
      doc.rect(0, 0, pageWidth, 42, 'F');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      if (examType === 'jipmat') {
        doc.text("JIPMAT CBT TEST SIMULATOR", pageWidth / 2, 16, { align: 'center' });
        doc.setFontSize(11);
        doc.setTextColor(249, 115, 22); // Orange
        doc.text("JIPMAT INTEGRATED MANAGEMENT ADMISSION TEST - PERFORMANCE REPORT", pageWidth / 2, 25, { align: 'center' });
      } else {
        doc.text("NEST 2026 PRACTICE PORTAL", pageWidth / 2, 16, { align: 'center' });
        doc.setFontSize(11);
        doc.setTextColor(147, 197, 253);
        doc.text("NATIONAL ENTRANCE SCREENING TEST - OFFICIAL PERFORMANCE REPORT", pageWidth / 2, 25, { align: 'center' });
      }

      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(203, 213, 225);
      doc.text("Conducted via TCS iON Assessment Systems • Powered by Google Gemini AI Engine", pageWidth / 2, 32, { align: 'center' });

      // Core profile block
      y = 48;
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, y, 180, 48, 4, 4, 'FD');

      // Candidate silhouette photo drawing on the right side of the card
      const photoX = 160;
      const photoY = y + 5;
      const photoW = 28;
      const photoH = 38;
      doc.setFillColor(219, 234, 254);
      doc.rect(photoX, photoY, photoW, photoH, 'F');
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.rect(photoX, photoY, photoW, photoH, 'D');

      // Draw head and shoulder silhouette representing candidate portrait
      doc.setFillColor(37, 99, 235);
      // Head circle
      doc.ellipse(photoX + photoW/2, photoY + 14, 6, 6, 'F');
      // Body arc/ellipse
      doc.ellipse(photoX + photoW/2, photoY + 31, 11, 8, 'F');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(37, 99, 235);
      doc.text("CANDIDATE PHOTO", photoX + photoW/2, photoY + photoH - 2, { align: 'center' });

      // Candidate Text Info (Left side of card)
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("CANDIDATE DOSSIER PROFILE", 20, y + 8);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text("Candidate Name: ", 20, y + 16);
      doc.text("Exam ID (Roll): ", 20, y + 22);
      doc.text("Session ID: ", 20, y + 28);
      doc.text("Assessment Date: ", 20, y + 34);
      doc.text("System Protocol: ", 20, y + 40);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(currentUser?.name || nestCandidateName || "PALLAVI", 52, y + 16);
      doc.text(`NEST2026-${currentUser?.studentId || "NISER-93K2"}`, 52, y + 22);
      doc.text("EXAM-SESSION-NEST-X7Y", 52, y + 28);
      doc.text(new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString(), 52, y + 34);
      doc.text("TCS iON Security Shield Enforced", 52, y + 40);

      // Section total marks breakdown
      const score = cuetResult?.score || 0;
      const total = cuetResult?.total || 0;
      const correct = cuetResult?.correct || 0;
      const incorrect = cuetResult?.incorrect || 0;
      const left = cuetResult?.unattempted || 0;
      const totalQuestions = cuetResult?.details?.length || 20;
      const totalTimeLeft = cuetTimeLeft;
      const totalTimeSpentSec = 3600 - totalTimeLeft;
      
      const overallTimeSpentStr = formatSecToMinSec(totalTimeSpentSec);
      const overallAccuracy = (correct + incorrect) > 0 ? (correct / (correct + incorrect)) * 100 : 0;

      // Stats Quick-Read Row
      y = 101;
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(15, y, 180, 18, 2, 2, 'F');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text("TOTAL MARKS ACHIEVED", 20, y + 6);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text(`${score} / ${total}`, 20, y + 13);

      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text("ACCURACY %", 65, y + 6);
      doc.setTextColor(34, 197, 94);
      doc.setFontSize(11);
      doc.text(`${overallAccuracy.toFixed(1)}%`, 65, y + 13);

      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text("TOTAL TIME SPENT", 100, y + 6);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text(overallTimeSpentStr, 100, y + 13);

      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text("ATTEMPTED QUESTIONS", 145, y + 6);
      doc.setTextColor(79, 70, 229);
      doc.setFontSize(11);
      const attemptRatio = (((correct + incorrect) / Math.max(1, totalQuestions)) * 100).toFixed(0);
      doc.text(`${correct + incorrect} / ${totalQuestions} (${attemptRatio}%)`, 145, y + 13);

      // Section breakdown Grid
      y = 124;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`SUBJECT-WISE PERFORMANCE MATRIX (+${examType === 'jipmat' ? 4 : 3} Correct / -1 Penalty / 0 Left)`, 15, y);

      y += 4;
      // Drawing table
      doc.setFillColor(30, 41, 59);
      doc.rect(15, y, 180, 7, 'F');
      
      doc.setFontSize(8);
      doc.setTextColor(255);
      doc.setFont("helvetica", "bold");
      doc.text("Subject Section", 18, y + 5);
      doc.text("Total Qs", 58, y + 5);
      doc.text(`Correct (+${examType === 'jipmat' ? 4 : 3})`, 78, y + 5);
      doc.text("Incorrect (-1)", 100, y + 5);
      doc.text("Left (0)", 125, y + 5);
      doc.text("Sec Marks", 143, y + 5);
      doc.text("Est. Time Taken", 161, y + 5);
      doc.text("Accuracy", 184, y + 5);

      const subjectsList = examType === 'jipmat'
        ? ['Quantitative Aptitude (QA)', 'Data Interpretation & Logical Reasoning (DILR)', 'Verbal Ability & Reading Comprehension (VARC)']
        : ['Biology', 'Chemistry', 'Physics'];
      let rowY = y + 7;

      const detailsList = cuetResult?.details || [];
      const sectionStats = subjectsList.map((sub, sIdx) => {
        const subQuestions = detailsList.filter((q: any) => q.subject?.toLowerCase() === sub.toLowerCase() || q.subject === sub);
        const subCorrect = subQuestions.filter((q: any) => q.isCorrect).length;
        const subIncorrect = subQuestions.filter((q: any) => q.selectedIdx !== -1 && !q.isCorrect).length;
        const subLeft = subQuestions.filter((q: any) => q.selectedIdx === -1).length;
        const subTotalIn = subQuestions.length || 20;
        const schemeMul = examType === 'jipmat' ? 4 : 3;
        const subScoreVal = subCorrect * schemeMul - subIncorrect;
        const subMaxVal = subTotalIn * schemeMul;
        const subAccuracyVal = (subCorrect + subIncorrect) > 0 ? ((subCorrect / (subCorrect + subIncorrect)) * 100).toFixed(1) + "%" : "0.0%";
        
        // Estimated section time
        const subAnswered = subCorrect + subIncorrect;
        const overallAnswered = correct + incorrect || 1;
        const subTimeSpentSec = Math.round((subAnswered / overallAnswered) * totalTimeSpentSec);
        const subTimeStr = formatSecToMinSec(subTimeSpentSec);

        return {
          subject: sub,
          total: subTotalIn,
          correct: subCorrect,
          incorrect: subIncorrect,
          left: subLeft,
          score: subScoreVal,
          max: subMaxVal,
          timeSpent: subTimeStr,
          accuracy: subAccuracyVal,
          correctRatio: subTotalIn > 0 ? subCorrect / subTotalIn : 0,
          incorrectRatio: subTotalIn > 0 ? subIncorrect / subTotalIn : 0,
          leftRatio: subTotalIn > 0 ? subLeft / subTotalIn : 0
        };
      });

      sectionStats.forEach((stat, idx) => {
        // Draw alternate rows colors
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
        } else {
          doc.setFillColor(239, 246, 255);
        }
        doc.rect(15, rowY, 180, 8, 'F');

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(stat.subject.toUpperCase(), 18, rowY + 5.5);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        doc.text(stat.total.toString(), 62, rowY + 5.5);
        
        doc.setTextColor(22, 101, 52); // green
        doc.text(`+${stat.correct}`, 82, rowY + 5.5);
        
        doc.setTextColor(185, 28, 28); // red
        doc.text(`-${stat.incorrect}`, 104, rowY + 5.5);
        
        doc.setTextColor(100, 116, 139); // gray
        doc.text(stat.left.toString(), 129, rowY + 5.5);
        
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(`${stat.score} / ${stat.max}`, 145, rowY + 5.5);
        
        doc.setFont("helvetica", "normal");
        doc.text(stat.timeSpent, 163, rowY + 5.5);
        doc.text(stat.accuracy, 186, rowY + 5.5);

        rowY += 8;
      });

      // Overall Total row
      doc.setFillColor(30, 41, 59);
      doc.rect(15, rowY, 180, 8, 'F');
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255);
      doc.text("TOTALS (Practice)", 18, rowY + 5.5);
      doc.text(totalQuestions.toString(), 62, rowY + 5.5);
      doc.text(correct.toString(), 82, rowY + 5.5);
      doc.text(incorrect.toString(), 104, rowY + 5.5);
      doc.text(left.toString(), 129, rowY + 5.5);
      doc.text(`${score} / ${total}`, 145, rowY + 5.5);
      doc.text(overallTimeSpentStr, 163, rowY + 5.5);
      doc.text(`${overallAccuracy.toFixed(1)}%`, 186, rowY + 5.5);

      // SECTION BAR CHART GRAPH
      y = rowY + 13;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text("GRAPHICAL SECTIONAL OUTCOME (Correct segment in Green, Incorrect in Red, Left in Gray)", 15, y);

      // Stacked Bar Graph rendering
      y += 4;
      sectionStats.forEach((stat, idx) => {
        const barX = 65;
        const barY = y + (idx * 8.5);
        const barW = 100;
        const barH = 4.5;

        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(71, 85, 105);
        doc.text(stat.subject.toUpperCase() + ":", 15, barY + 3.2);

        // Draw segmented track
        const correctW = stat.correctRatio * barW;
        const incorrectW = stat.incorrectRatio * barW;
        const leftW = stat.leftRatio * barW;

        let currentW = barX;
        // Green segment
        if (correctW > 0) {
          doc.setFillColor(34, 197, 94);
          doc.rect(currentW, barY, correctW, barH, 'F');
          currentW += correctW;
        }
        // Red segment
        if (incorrectW > 0) {
          doc.setFillColor(239, 68, 68);
          doc.rect(currentW, barY, incorrectW, barH, 'F');
          currentW += incorrectW;
        }
        // Gray segment
        if (leftW > 0) {
          doc.setFillColor(148, 163, 184);
          doc.rect(currentW, barY, leftW, barH, 'F');
        }

        // Write mini stats labels
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(`${stat.correct} [Correct] / ${stat.incorrect} [Incorrect] / ${stat.left} [Left]`, barX + barW + 2, barY + 3.2);
      });

      // NISER SELECTIVITY ESTIMATION GRAPH & SCALE
      const niserInfo = getNestEstimation(score);
      y = y + 31;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text("NISER SELECTION CHANCE & BENCHMARK GRAPH", 15, y);

      y += 4;
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(250, 250, 250);
      doc.rect(15, y, 180, 15, 'FD');

      // Draw horizontal segmented spectrum gauge bar representing score zone
      const gaugeX = 35;
      const gaugeY = y + 4;
      const gaugeSegW = 28;
      const gaugeH = 4;

      const segments = [
        { label: "<65", color: [239, 68, 68] },
        { label: "65-79", color: [249, 115, 22] },
        { label: "80-94", color: [234, 179, 8] },
        { label: "95-114", color: [132, 204, 22] },
        { label: "115+", color: [34, 197, 94] }
      ];

      segments.forEach((seg, i) => {
        const segX = gaugeX + (i * gaugeSegW);
        doc.setFillColor(seg.color[0], seg.color[1], seg.color[2]);
        doc.rect(segX, gaugeY, gaugeSegW, gaugeH, 'F');
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100);
        doc.text(seg.label, segX + (gaugeSegW/2), gaugeY + 7.5, { align: 'center' });
      });

      // Calculate indicator arrow X coordinate
      let arrowX = gaugeX + 5;
      if (score < 65) {
        arrowX = gaugeX + (Math.max(0, score) / 65) * gaugeSegW;
      } else if (score < 80) {
        arrowX = gaugeX + gaugeSegW + ((score - 65) / 15) * gaugeSegW;
      } else if (score < 95) {
        arrowX = gaugeX + (2 * gaugeSegW) + ((score - 80) / 15) * gaugeSegW;
      } else if (score < 115) {
        arrowX = gaugeX + (3 * gaugeSegW) + ((score - 95) / 20) * gaugeSegW;
      } else {
        arrowX = gaugeX + (4 * gaugeSegW) + Math.min(1, (score - 115) / 35) * gaugeSegW;
      }

      // Draw actual candidate score arrow
      doc.setFillColor(15, 23, 42);
      doc.triangle(arrowX, gaugeY - 2, arrowX - 1.5, gaugeY - 3.5, arrowX + 1.5, gaugeY - 3.5, 'F');
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text(`YOUR SCORE: ${score}`, arrowX, gaugeY - 4.5, { align: 'center' });

      // Suggestions and outcomes box
      y = y + 18;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, y, 180, 25, 3, 3, 'F');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text("ESTIMATED PERCENTILE RANGE:", 20, y + 5);
      doc.setFontSize(10);
      doc.setTextColor(34, 197, 94);
      doc.text(niserInfo.percentile, 85, y + 5);

      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text("NISER SELECTION CHANCE (GENERAL):", 20, y + 11);
      doc.setFontSize(8.5);
      doc.setTextColor(niserInfo.badgeColor[0], niserInfo.badgeColor[1], niserInfo.badgeColor[2]);
      doc.text(niserInfo.chanceGen, 85, y + 11);

      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text("NISER SELECTION CHANCE (EWS):", 20, y + 17);
      doc.setFontSize(8.5);
      doc.setTextColor(niserInfo.badgeColor[0], niserInfo.badgeColor[1], niserInfo.badgeColor[2]);
      doc.text(niserInfo.chanceEws, 85, y + 17);

      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text("SUGGESTIVE PREP RATING:", 20, y + 22);
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(score >= 95 ? "Highly Receptive" : score >= 80 ? "Progressive Border" : "Needs Re-Evaluation", 85, y + 22);

      // Suggestions text detail
      y = y + 28;
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("DIAGNOSTIC CRITIQUE & CORE SUGGESTIONS:", 15, y);

      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      const suggestionsWords = doc.splitTextToSize(niserInfo.suggestion, 180);
      doc.text(suggestionsWords, 15, y);

      // Footer notice on first page
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(148, 163, 184);
      doc.text("OFFICIAL NISER SCREENING COMPLIANCE SCORECARD. REMAINING PAGES CONTAIN YOUR DETAILED CORRECTED EXAM PAPERS.", pageWidth / 2, pageHeight - 8, { align: 'center' });

      // PAGE 2+: DETAILED A-Z REPORT
      doc.addPage();
      y = 20;

      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.text("EXAMINATION QUESTION-BY-QUESTION REVIEWS (A-Z REPORT)", 15, y);
      y += 8;

      for (let index = 0; index < detailsList.length; index++) {
        const item = detailsList[index];
        if (y > pageHeight - 45) {
          doc.addPage();
          y = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);

        const questionText = item.subject ? `[${statToCapital(item.subject)}] ${item.question}` : item.question;
        const questionLines = doc.splitTextToSize(`Q${index + 1}. ${questionText}`, pageWidth - 35);
        
        doc.text(questionLines, 15, y);
        y += (questionLines.length * 4.5) + 3;

        // Render question graph/SVG inside details
        if (item.diagramSvg) {
          try {
            const svgUrl = await svgToBase64Image(item.diagramSvg);
            if (svgUrl && svgUrl.startsWith("data:image")) {
              if (y > pageHeight - 75) {
                doc.addPage();
                y = 20;
              }
              doc.addImage(svgUrl, 'PNG', 20, y, 70, 35);
              y += 38;
            }
          } catch (err) {
            console.error("Failed adding math/science SVG to report PDF:", err);
          }
        }

        // Draw selection options
        item.options.forEach((opt: string, optIdx: number) => {
          const prefix = String.fromCharCode(65 + optIdx) + ") ";
          let color = [51, 65, 85];
          let style = "normal";

          if (optIdx === item.correct) {
            color = [22, 101, 52];
            style = "bold";
          }

          doc.setTextColor(color[0], color[1], color[2]);
          doc.setFont("helvetica", style);
          doc.setFontSize(8);
          
          const optionTextLines = doc.splitTextToSize(`${prefix}${opt}`, pageWidth - 45);
          doc.text(optionTextLines, 20, y);
          y += (optionTextLines.length * 4) + 1;
        });

        // Question Attempt Stats Footer banner
        y += 2.5;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        if (item.selectedIdx === -1) {
          doc.setTextColor(148, 163, 184);
          doc.text("Candidate Choice: UNATTEMPTED [Awarded: 0 marks]", 18, y);
        } else if (item.isCorrect) {
          doc.setTextColor(22, 101, 52);
          doc.text(`Candidate Choice: ${String.fromCharCode(65 + item.selectedIdx)} (CORRECT) [Awarded: +3 marks]`, 18, y);
        } else {
          doc.setTextColor(185, 28, 28);
          const correctLetter = String.fromCharCode(65 + item.correct);
          doc.text(`Candidate Choice: ${String.fromCharCode(65 + item.selectedIdx)} (INCORRECT, Correct is: ${correctLetter}) [Penalty: -1 mark]`, 18, y);
        }

        y += 7.5;
        doc.setDrawColor(241, 245, 249);
        doc.line(15, y, pageWidth - 15, y);
        y += 7.5;
      }
    } else {
      // STANDARD PDF IN ALL OTHER CASES (NEET / CUET / etc.)
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // Header
      doc.setFontSize(22);
      doc.setTextColor(0, 51, 153);
      doc.text(`${examType === 'neet' ? 'NEET UG' : 'CUET'} 2026 PRACTICE PORTAL`, pageWidth / 2, y, { align: 'center' });
      y += 10;
      doc.setFontSize(14);
      doc.setTextColor(100);
      doc.text("EXAMINATION PERFORMANCE REPORT", pageWidth / 2, y, { align: 'center' });
      y += 15;

      // Candidate Info
      doc.setDrawColor(200);
      doc.line(15, y, pageWidth - 15, y);
      y += 10;
      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text(`Candidate Name: ${currentUser?.name || nestCandidateName || "PALLAVI"}`, 20, y);
      doc.text(`Exam ID: ${examType === 'neet' ? 'NEET' : 'CUET'}2026-X7Y`, 150, y);
      y += 10;
      doc.text(`Total Score: ${cuetResult?.score} / ${cuetResult?.total}`, 20, y);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, y);
      y += 10;
      doc.line(15, y, pageWidth - 15, y);
      y += 15;

      // Results Summary
      doc.setFontSize(12);
      doc.text("SUMMARY STATISTICS", 20, y);
      y += 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`- Correct Answers: ${cuetResult?.correct}`, 25, y);
      y += 7;
      doc.text(`- Incorrect Answers: ${cuetResult?.incorrect}`, 25, y);
      y += 7;
      doc.text(`- Unattempted: ${cuetResult?.unattempted}`, 25, y);
      y += 15;

      // Detailed Report Title
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("QUESTION-BY-QUESTION ANALYSIS (A-Z REPORT)", 20, y);
      y += 10;

      // Questions
      doc.setFontSize(9);
      for (let index = 0; index < (cuetResult?.details || []).length; index++) {
        const item = (cuetResult?.details || [])[index];
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        doc.setFont("helvetica", "bold");
        const questionText = item.subject ? `[${statToCapital(item.subject)}] ${item.question}` : item.question;
        const questionLines = doc.splitTextToSize(`${index + 1}. ${questionText}`, pageWidth - 40);
        doc.text(questionLines, 20, y);
        y += (questionLines.length * 5) + 2;

        // Render question graph/SVG inside standard details
        if (item.diagramSvg) {
          try {
            const svgUrl = await svgToBase64Image(item.diagramSvg);
            if (svgUrl && svgUrl.startsWith("data:image")) {
              if (y > 270 - 45) {
                doc.addPage();
                y = 20;
              }
              doc.addImage(svgUrl, 'PNG', 25, y, 70, 35);
              y += 38;
            }
          } catch (err) {
            console.error(err);
          }
        }

        item.options.forEach((opt: string, optIdx: number) => {
          const prefix = String.fromCharCode(65 + optIdx) + ") ";
          let color = [0, 0, 0];
          let style = "normal";

          if (optIdx === item.correct) {
            color = [0, 153, 51]; // Green for correct
            style = "bold";
          }
          
          doc.setTextColor(color[0], color[1], color[2]);
          doc.setFont("helvetica", style);
          const optLines = doc.splitTextToSize(`${prefix}${opt}`, pageWidth - 50);
          doc.text(optLines, 25, y);
          y += (optLines.length * 5);
        });

        y += 2;
        doc.setFont("helvetica", "bold");
        if (item.selectedIdx === -1) {
          doc.setTextColor(150, 150, 150);
          doc.text("STATUS: UNATTEMPTED", 20, y);
        } else if (item.isCorrect) {
          doc.setTextColor(0, 153, 51);
          doc.text(`STATUS: CORRECT (Selected: ${String.fromCharCode(65 + item.selectedIdx)})`, 20, y);
        } else {
          doc.setTextColor(204, 0, 0);
          const correctLetter = item.correct !== undefined ? String.fromCharCode(65 + item.correct) : 'N/A';
          doc.text(`STATUS: INCORRECT (Selected: ${String.fromCharCode(65 + item.selectedIdx)}, Correct: ${correctLetter})`, 20, y);
        }
        
        doc.setTextColor(0);
        y += 8;
        doc.setDrawColor(240);
        doc.line(20, y, pageWidth - 20, y);
        y += 8;
      }
    }

    doc.save(`${examType?.toUpperCase()}_Result_${currentUser?.name || nestCandidateName || "Candidate"}.pdf`);
  };

  const handleAction = (action: 'save' | 'mark' | 'clear' | 'save-mark') => {
      const currentAns = cuetAnswers[activeQuestion];
      
      if (action === 'clear') {
          const newAns = { ...cuetAnswers };
          delete newAns[activeQuestion];
          setCuetAnswers(newAns);
          
          setCuetStatusMap((prev: any) => {
              const updated = { ...prev, [activeQuestion]: 'not-answered' };
              return updated;
          });
          return;
      }

      let targetStatus: 'answered' | 'marked' | 'answered-marked' | 'not-answered' = 'not-answered';
      if (action === 'save') {
          if (currentAns === undefined) { alert("Please select an answer first."); return; }
          targetStatus = 'answered';
      } else if (action === 'mark') {
          targetStatus = 'marked';
      } else if (action === 'save-mark') {
          if (currentAns === undefined) { alert("Please select an answer first."); return; }
          targetStatus = 'answered-marked';
      }

      setCuetStatusMap((prev: any) => {
          const updated = { ...prev, [activeQuestion]: targetStatus };
          
          if (activeQuestion < cuetQuestions.length - 1) {
              const nextQ = activeQuestion + 1;
              if ((prev[nextQ] || 'not-visited') === 'not-visited') {
                  updated[nextQ] = 'not-answered';
              }
          }
          return updated;
      });

      // Move to next
      if (activeQuestion < cuetQuestions.length - 1) {
          const nextQ = activeQuestion + 1;
          setActiveQuestion(nextQ);
          // If we switch subjects automatically when moving next
          const nextSubject = cuetQuestions[nextQ].subject;
          if (nextSubject && nextSubject !== activeNeetSubject) {
            setActiveNeetSubject(nextSubject);
          }
      }
  };

  const OmrCircle = ({ index, optionIdx, isFilled, onFill }: { index: number, optionIdx: number, isFilled: boolean, onFill: () => void }) => {
    const [progress, setProgress] = useState(0);
    const [isPressing, setIsPressing] = useState(false);
    const intervalRef = useRef<any>(null);

    const startFilling = () => {
        if (isFilled) return;
        setIsPressing(true);
        setOmrError(null);
        intervalRef.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(intervalRef.current);
                    onFill();
                    return 100;
                }
                return prev + 5; // Fill speed
            });
        }, 30);
    };

    const stopFilling = () => {
        setIsPressing(false);
        clearInterval(intervalRef.current);
        if (progress < 100 && progress > 0) {
            setOmrError("Correct way to fill circle: Hold until fully filled");
            setProgress(0);
        }
    };

    return (
        <div 
            className="relative w-10 h-10 rounded-full border-2 border-slate-400 cursor-pointer overflow-hidden bg-white shrink-0"
            onMouseDown={startFilling}
            onMouseUp={stopFilling}
            onMouseLeave={stopFilling}
            onTouchStart={startFilling}
            onTouchEnd={stopFilling}
        >
            {/* Fill Progress Layer */}
            <div 
                className="absolute inset-0 bg-slate-900 transition-all duration-75 origin-center"
                style={{ clipPath: `circle(${isFilled ? 100 : progress}% at 50% 50%)` }}
            />
            {/* Outline and Label */}
            <div className={`absolute inset-0 flex items-center justify-center font-black text-xs transition-colors ${isFilled || progress > 50 ? 'text-white' : 'text-slate-500'}`}>
                {String.fromCharCode(65 + optionIdx)}
            </div>
        </div>
    );
  };

  if (cuetIsLocked) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white p-8 rounded-3xl border border-red-500/30 max-w-md w-full text-center space-y-6">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-2xl font-black text-slate-900 uppercase">Exam Terminated</h2>
          <p className="text-slate-600 text-sm">Window switch detected. This event has been logged.</p>
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-red-700 text-[10px] font-bold uppercase">Candidate: PALLAVI | ID: CUET2026-X7Y</div>
          <input 
            type="text" value={unlockCode} onChange={(e) => setUnlockCode(e.target.value)}
            placeholder="PROCTOR KEY" className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-center font-bold text-slate-900 uppercase tracking-widest outline-none"
          />
          <button onClick={() => {
            if (unlockCode === 'DDYY22') {
              setCuetIsLocked(false);
              setCuetStatus('exam');
              requestFullscreen();
            } else {
              alert('Invalid key. Contact proctor.');
            }
          }} className="w-full bg-red-600 text-white font-black py-3 rounded-xl uppercase tracking-tighter">Enter Exam Hall</button>
        </motion.div>
      </div>
    );
  }

  if (cuetStatus === 'upload') {
    if (examType === 'jipmat') {
      return (
        <div className="max-w-4xl mx-auto py-12 space-y-8 px-4">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase font-orbitron">JIPMAT 2026 ONLINE SIMULATOR</h2>
            <p className="text-orange-600 font-bold text-xs tracking-widest uppercase font-mono">Joint Integrated Programme in Management Admission Test</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['Quantitative Aptitude (QA)', 'Data Interpretation & Logical Reasoning (DILR)', 'Verbal Ability & Reading Comprehension (VARC)'] as const).map(sub => {
              const method = jipmatUploadMethods[sub] || 'text';
              const file = jipmatFiles[sub];
              const targetCount = sub.includes('VARC') ? 34 : 33;
              return (
                <div key={sub} className="bg-white p-6 rounded-3xl border border-slate-200/80 space-y-4 shadow-xl flex flex-col justify-between">
                  <div className="space-y-3">
                    <h3 className="font-orbitron font-black text-[11px] text-slate-800 uppercase tracking-wider">{sub}</h3>
                    
                    {/* Tab selection */}
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                      <button
                        onClick={() => setJipmatUploadMethods({...jipmatUploadMethods, [sub]: 'text'})}
                        className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${
                          method === 'text' 
                            ? 'bg-orange-600 text-white shadow-xs' 
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Paste Text
                      </button>
                      <button
                        onClick={() => setJipmatUploadMethods({...jipmatUploadMethods, [sub]: 'file'})}
                        className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${
                          method === 'file' 
                            ? 'bg-orange-600 text-white shadow-xs' 
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Upload File
                      </button>
                    </div>

                    {method === 'text' ? (
                      <textarea 
                        value={jipmatPastedTexts[sub] || ''}
                        onChange={(e) => setJipmatPastedTexts({...jipmatPastedTexts, [sub]: e.target.value})}
                        placeholder={`Paste questions with 4 options for ${sub}...`}
                        className="w-full h-40 p-3 bg-slate-50 border rounded-2xl text-xs font-mono outline-none focus:border-orange-500 transition-all leading-relaxed resize-none"
                      />
                    ) : (
                      <div 
                        onClick={() => document.getElementById(`jipmat-file-${sub}`)?.click()}
                        className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${
                          file 
                            ? 'border-orange-500 bg-orange-50/10' 
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-400'
                        }`}
                      >
                        <input 
                          id={`jipmat-file-${sub}`}
                          type="file" 
                          accept="application/pdf,image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) setJipmatFiles({...jipmatFiles, [sub]: f});
                          }}
                          className="hidden" 
                        />
                        {file ? (
                          <div className="space-y-1">
                            <FileText className="w-6 h-6 text-orange-500 mx-auto" />
                            <p className="text-[10px] font-black text-slate-800 truncate max-w-[140px] mx-auto">{file.name}</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                            <span className="inline-block text-[7px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-md uppercase">Click to replace</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <FileText className="w-6 h-6 text-slate-400 mx-auto" />
                            <p className="text-[10px] font-bold text-slate-700">Choose PDF or Image</p>
                            <p className="text-[8px] text-slate-400">Click or Drag & Drop</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 mt-4">
                    <button 
                      onClick={() => {
                        if (method === 'text') {
                          handleJipmatTextUpload(sub, jipmatPastedTexts[sub]);
                        } else {
                          if (file) {
                            handleJipmatFileUpload(sub, file);
                          } else {
                            alert('Please select a PDF or Image file first.');
                          }
                        }
                      }}
                      disabled={isAiLoading || (method === 'text' ? !jipmatPastedTexts[sub]?.trim() : !file)}
                      className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-orange-700 disabled:opacity-50 transition-colors"
                    >
                      {isAiLoading ? 'Analyzing...' : `Extract ${sub}`}
                    </button>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400">
                        {jipmatData[sub]?.length || 0} / {targetCount} Qs Ready
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 font-bold">DYNAMIC EXAM PARAMETERS</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-[9px] font-black text-slate-400 uppercase font-bold">Uploaded Sections</span>
                <p className="text-sm font-black text-slate-800 tracking-tight">
                  {['Quantitative Aptitude (QA)', 'Data Interpretation & Logical Reasoning (DILR)', 'Verbal Ability & Reading Comprehension (VARC)'].filter(sub => (jipmatData[sub]?.length || 0) > 0).join(', ') || 'No sections ready'}
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-[9px] font-black text-slate-400 uppercase font-bold">Target Pattern & Timing</span>
                <p className="text-xs font-bold text-orange-600 uppercase tracking-tight">
                  100 Multiple Choice Questions | 150 Minutes (2h 30m)
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={startJipmatSimulation}
            className="w-full bg-orange-600 text-white font-black py-6 rounded-[30px] uppercase text-xl sm:text-2xl shadow-2xl hover:bg-orange-700 transition-all flex items-center justify-center gap-4 hover:shadow-orange-500/10 active:scale-[0.99]"
          >
            <Zap className="w-8 h-8" />
            INITIALIZE JIPMAT TEST
          </button>
          
          <div className="text-center">
            <button onClick={() => setCuetStatus('selection')} className="text-slate-400 font-bold text-xs uppercase underline hover:text-slate-900 transition-all">Back to Selection</button>
          </div>
        </div>
      );
    }

    if (examType === 'nest') {
      return (
        <div className="max-w-4xl mx-auto py-12 space-y-8 px-4">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">NEST EXAM SIMULATOR</h2>
            <p className="text-emerald-600 font-bold text-xs tracking-widest uppercase">Multi-Section Question Injection</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['Biology', 'Chemistry', 'Physics'].map(sub => {
              const method = nestUploadMethods[sub] || 'text';
              const file = nestFiles[sub];
              return (
                <div key={sub} className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-xl flex flex-col justify-between">
                  <div className="space-y-3">
                    <h3 className="font-orbitron font-black text-sm text-slate-800 uppercase tracking-widest">{sub} SECTION</h3>
                    
                    {/* Tab selection */}
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                      <button
                        onClick={() => setNestUploadMethods({...nestUploadMethods, [sub]: 'text'})}
                        className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${
                          method === 'text' 
                            ? 'bg-emerald-600 text-white shadow-xs' 
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Paste Text
                      </button>
                      <button
                        onClick={() => setNestUploadMethods({...nestUploadMethods, [sub]: 'file'})}
                        className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${
                          method === 'file' 
                            ? 'bg-emerald-600 text-white shadow-xs' 
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Upload File
                      </button>
                    </div>

                    {method === 'text' ? (
                      <textarea 
                        value={nestPastedTexts[sub] || ''}
                        onChange={(e) => setNestPastedTexts({...nestPastedTexts, [sub]: e.target.value})}
                        placeholder="Paste your question text block here..."
                        className="w-full h-40 p-3 bg-slate-50 border rounded-2xl text-xs font-mono outline-none focus:border-emerald-500 transition-all leading-relaxed resize-none"
                      />
                    ) : (
                      <div 
                        onClick={() => document.getElementById(`nest-file-${sub}`)?.click()}
                        className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${
                          file 
                            ? 'border-emerald-500 bg-emerald-50/10' 
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-400'
                        }`}
                      >
                        <input 
                          id={`nest-file-${sub}`}
                          type="file" 
                          accept="application/pdf,image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) setNestFiles({...nestFiles, [sub]: f});
                          }}
                          className="hidden" 
                        />
                        {file ? (
                          <div className="space-y-1">
                            <FileText className="w-6 h-6 text-emerald-500 mx-auto" />
                            <p className="text-[10px] font-black text-slate-800 truncate max-w-[140px] mx-auto">{file.name}</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                            <span className="inline-block text-[7px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-md uppercase">Click to replace</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <FileText className="w-6 h-6 text-slate-400 mx-auto" />
                            <p className="text-[10px] font-bold text-slate-700">Choose PDF or Image</p>
                            <p className="text-[8px] text-slate-400">Click or Drag & Drop</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 mt-4">
                    <button 
                      onClick={() => {
                        if (method === 'text') {
                          handleNestTextUpload(sub, nestPastedTexts[sub]);
                        } else {
                          if (file) {
                            handleNestFileUpload(sub, file);
                          } else {
                            alert('Please select a PDF or Image file first.');
                          }
                        }
                      }}
                      disabled={isAiLoading || (method === 'text' ? !nestPastedTexts[sub]?.trim() : !file)}
                      className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      {isAiLoading ? 'Analyzing...' : `Extract ${sub}`}
                    </button>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400">
                        {nestData[sub]?.length || 0} / 20 Questions Ready
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">DYNAMIC EXAM PARAMETERS</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-[9px] font-black text-slate-400 uppercase font-bold">Uploaded Sections</span>
                <p className="text-sm font-black text-slate-800 tracking-tight">
                  {['Biology', 'Chemistry', 'Physics'].filter(sub => (nestData[sub]?.length || 0) > 0).join(', ') || 'No sections ready'}
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-[9px] font-black text-slate-400 uppercase font-bold">Calculated Exam Duration</span>
                <p className="text-sm font-black text-emerald-600 uppercase tracking-tight">
                  {(() => {
                    const filledCount = ['Biology', 'Chemistry', 'Physics'].filter(sub => (nestData[sub]?.length || 0) > 0).length;
                    if (filledCount === 0) return '0 minutes (Add questions)';
                    return `${filledCount} hour${filledCount > 1 ? 's' : ''} (${filledCount * 60} minutes)`;
                  })()}
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={startNestSimulation}
            className="w-full bg-emerald-600 text-white font-black py-6 rounded-[30px] uppercase text-xl sm:text-2xl shadow-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-4 hover:shadow-emerald-500/10 active:scale-[0.99]"
          >
            <Zap className="w-8 h-8" />
            INITIALIZE TEST ENVIRONMENT
          </button>
          
          <div className="text-center">
            <button onClick={() => setCuetStatus('selection')} className="text-slate-400 font-bold text-xs uppercase underline hover:text-slate-900 transition-all">Back to Selection</button>
          </div>
        </div>
      );
    }

    if (examType === 'neet') {
      const totalNeetQs = (neetData['Physics']?.length || 0) + (neetData['Chemistry']?.length || 0) + (neetData['Biology']?.length || 0);

      return (
        <div className="max-w-4xl mx-auto py-12 space-y-8 px-4">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">NEET UG SIMULATOR</h2>
            <p className="text-red-500 font-bold text-xs tracking-widest uppercase">Multi-Subject Question Injection & Full Paper Import</p>
          </div>

          {/* Mode Switcher: Full Paper vs Subject-wise */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl max-w-md mx-auto border border-slate-200 shadow-sm">
            <button
              onClick={() => setNeetUploadMode('full')}
              className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 ${
                neetUploadMode === 'full' 
                  ? 'bg-red-600 text-white shadow-md' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              Upload Entire Paper (1 PDF)
            </button>
            <button
              onClick={() => setNeetUploadMode('subject')}
              className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 ${
                neetUploadMode === 'subject' 
                  ? 'bg-red-600 text-white shadow-md' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-4 h-4" />
              Subject-wise Upload
            </button>
          </div>

          {neetUploadMode === 'full' ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6 max-w-2xl mx-auto">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Upload Entire NEET Question Paper PDF</h3>
                <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                  Upload your full NEET question paper PDF or image. Gemini AI will automatically extract all questions and categorize them into Physics, Chemistry, and Biology.
                </p>
              </div>

              {/* Toggle File vs Text */}
              <div className="flex bg-slate-100 p-1 rounded-xl max-w-xs mx-auto border border-slate-200">
                <button
                  onClick={() => setNeetFullUploadMethod('file')}
                  className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${
                    neetFullUploadMethod === 'file' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Upload File / PDF
                </button>
                <button
                  onClick={() => setNeetFullUploadMethod('text')}
                  className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${
                    neetFullUploadMethod === 'text' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Paste Full Text
                </button>
              </div>

              {neetFullUploadMethod === 'file' ? (
                <div 
                  onClick={() => document.getElementById('neet-full-pdf-file')?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[180px] ${
                    neetFullPaperFile 
                      ? 'border-red-500 bg-red-50/20' 
                      : 'border-slate-300 bg-slate-50 hover:bg-slate-100/60 hover:border-slate-400'
                  }`}
                >
                  <input 
                    id="neet-full-pdf-file"
                    type="file" 
                    accept="application/pdf,image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setNeetFullPaperFile(f);
                    }}
                    className="hidden" 
                  />
                  {neetFullPaperFile ? (
                    <div className="space-y-2">
                      <FileText className="w-10 h-10 text-red-600 mx-auto" />
                      <p className="text-sm font-black text-slate-800 truncate max-w-[260px] mx-auto">{neetFullPaperFile.name}</p>
                      <p className="text-xs text-slate-400 font-bold uppercase">{(neetFullPaperFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      <span className="inline-block text-[9px] bg-red-100 text-red-700 font-black px-2.5 py-1 rounded-md uppercase">Click to change PDF</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-10 h-10 text-slate-400 mx-auto" />
                      <p className="text-sm font-black text-slate-700">Select Entire NEET Paper (PDF or Image)</p>
                      <p className="text-xs text-slate-400 font-medium">Supports all subjects in 1 file • AI Auto-Categorization</p>
                    </div>
                  )}
                </div>
              ) : (
                <textarea 
                  value={neetFullPaperText}
                  onChange={(e) => setNeetFullPaperText(e.target.value)}
                  placeholder="Paste complete NEET question paper text here..."
                  className="w-full h-48 p-4 bg-slate-50 border rounded-2xl text-xs font-mono outline-none focus:border-red-500 transition-all leading-relaxed resize-none"
                />
              )}

              <button 
                onClick={() => {
                  if (neetFullUploadMethod === 'file') {
                    if (neetFullPaperFile) {
                      handleNeetFullPaperFileUpload(neetFullPaperFile);
                    } else {
                      alert('Please select a NEET paper PDF or Image file first.');
                    }
                  } else {
                    if (neetFullPaperText.trim()) {
                      handleNeetFullPaperTextUpload(neetFullPaperText);
                    } else {
                      alert('Please paste question paper text first.');
                    }
                  }
                }}
                disabled={isAiLoading || (neetFullUploadMethod === 'file' ? !neetFullPaperFile : !neetFullPaperText.trim())}
                className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {isAiLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    AI Analyzing Full Paper...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Extract All Questions with AI
                  </>
                )}
              </button>

              {/* Live Count Overview */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-200">
                  <span className="text-[9px] font-black uppercase text-slate-400">Physics</span>
                  <p className="text-base font-black text-slate-800">{neetData['Physics']?.length || 0} Qs</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-200">
                  <span className="text-[9px] font-black uppercase text-slate-400">Chemistry</span>
                  <p className="text-base font-black text-slate-800">{neetData['Chemistry']?.length || 0} Qs</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-200">
                  <span className="text-[9px] font-black uppercase text-slate-400">Biology</span>
                  <p className="text-base font-black text-slate-800">{neetData['Biology']?.length || 0} Qs</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['Physics', 'Chemistry', 'Biology'].map(sub => {
                const method = neetUploadMethods[sub] || 'text';
                const file = neetFiles[sub];
                return (
                  <div key={sub} className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-xl flex flex-col justify-between">
                    <div className="space-y-3">
                      <h3 className="font-orbitron font-black text-sm text-slate-800 uppercase tracking-widest">{sub}</h3>
                      
                      {/* Tab selection */}
                      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                        <button
                          onClick={() => setNeetUploadMethods({...neetUploadMethods, [sub]: 'text'})}
                          className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${
                            method === 'text' 
                              ? 'bg-slate-900 text-white shadow-xs' 
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Paste Text
                        </button>
                        <button
                          onClick={() => setNeetUploadMethods({...neetUploadMethods, [sub]: 'file'})}
                          className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${
                            method === 'file' 
                              ? 'bg-slate-900 text-white shadow-xs' 
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Upload File
                        </button>
                      </div>

                      {method === 'text' ? (
                        <textarea 
                          value={neetPastedTexts[sub] || ''}
                          onChange={(e) => setNeetPastedTexts({...neetPastedTexts, [sub]: e.target.value})}
                          placeholder={`Paste ${sub} questions here...`}
                          className="w-full h-40 p-3 bg-slate-50 border rounded-2xl text-xs font-mono outline-none focus:border-slate-500 transition-all leading-relaxed resize-none"
                        />
                      ) : (
                        <div 
                          onClick={() => document.getElementById(`neet-file-${sub}`)?.click()}
                          className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${
                            file 
                              ? 'border-emerald-500 bg-emerald-50/10' 
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-400'
                          }`}
                        >
                          <input 
                            id={`neet-file-${sub}`}
                            type="file" 
                            accept="application/pdf,image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) setNeetFiles({...neetFiles, [sub]: f});
                            }}
                            className="hidden" 
                          />
                          {file ? (
                            <div className="space-y-1">
                              <FileText className="w-6 h-6 text-emerald-500 mx-auto" />
                              <p className="text-[10px] font-black text-slate-800 truncate max-w-[140px] mx-auto">{file.name}</p>
                              <p className="text-[8px] text-slate-400 font-bold uppercase">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                              <span className="inline-block text-[7px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-md uppercase">Click to replace</span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <FileText className="w-6 h-6 text-slate-400 mx-auto" />
                              <p className="text-[10px] font-bold text-slate-700">Choose PDF or Image</p>
                              <p className="text-[8px] text-slate-400">Click or Drag & Drop</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 mt-4">
                      <button 
                        onClick={() => {
                          if (method === 'text') {
                            handleNeetTextUpload(sub, neetPastedTexts[sub]);
                          } else {
                            if (file) {
                              handleNeetFileUpload(sub, file);
                            } else {
                              alert('Please select a PDF or Image file first.');
                            }
                          }
                        }}
                        disabled={isAiLoading || (method === 'text' ? !neetPastedTexts[sub]?.trim() : !file)}
                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-black disabled:opacity-50 transition-colors"
                      >
                        {isAiLoading ? 'Analyzing...' : `Extract ${sub}`}
                      </button>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400">
                          {neetData[sub]?.length || 0} Questions Ready
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button 
            onClick={startNeetSimulation}
            disabled={totalNeetQs === 0}
            className="w-full bg-red-600 text-white font-black py-6 rounded-[30px] uppercase text-xl sm:text-2xl shadow-2xl hover:bg-red-700 disabled:opacity-50 transition-all flex items-center justify-center gap-4"
          >
            <Zap className="w-8 h-8" />
            INITIALIZE TEST ENVIRONMENT ({totalNeetQs} Qs Ready)
          </button>
          
          <div className="text-center">
            <button onClick={() => setCuetStatus('selection')} className="text-slate-400 font-bold text-xs uppercase underline">Back to Selection</button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-xl mx-auto py-20 space-y-8 px-4">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6"><img src="https://nta.ac.in/img/logo.png" className="h-16" alt="NTA" /></div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">CUET 2026 PRACTICE PORTAL</h2>
          <p className="text-slate-500 font-bold text-xs tracking-widest uppercase">Direct Question Data Import & Simulation</p>
        </div>
        <div className="bg-white shadow-2xl p-8 rounded-[40px] border border-slate-100 space-y-6">
          {/* Choice Selection Tabs: Text Paste vs File Upload */}
          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <button
              onClick={() => setUploadMethod('text')}
              className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all ${
                uploadMethod === 'text' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Paste Text Pattern
            </button>
            <button
              onClick={() => setUploadMethod('file')}
              className={`flex-1 py-3 text-xs font-black uppercase rounded-xl transition-all ${
                uploadMethod === 'file' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Upload PDF or Image File
            </button>
          </div>

          {uploadMethod === 'text' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Paste Question Paper Content Here</label>
                <textarea 
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="1. Question text here...&#10;A) Option 1&#10;B) Option 2&#10;C) Option 3&#10;D) Option 4..."
                  className="w-full h-64 p-6 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:border-blue-500 transition-all font-mono text-sm leading-relaxed"
                />
              </div>
              
              <button 
                onClick={() => handleCuetTextUpload(pastedText)}
                disabled={isAiLoading || !pastedText.trim()}
                className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl uppercase tracking-tighter text-xl shadow-xl hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    NEURAL ANALYSIS IN PROGRESS...
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6" />
                    START SIMULATION
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Upload Question paper file</label>
                
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
                      setSelectedUploadFile(file);
                    } else {
                      alert('Please upload a valid PDF file or Image.');
                    }
                  }}
                  onClick={() => document.getElementById('paper-input-file')?.click()}
                  className={`border-3 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
                    isDragging 
                      ? 'border-blue-600 bg-blue-50/20' 
                      : selectedUploadFile 
                        ? 'border-emerald-500 bg-emerald-50/10' 
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400'
                  }`}
                >
                  <input 
                    id="paper-input-file"
                    type="file" 
                    accept="application/pdf,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setSelectedUploadFile(file);
                    }}
                    className="hidden" 
                  />
                  
                  {selectedUploadFile ? (
                    <div className="space-y-3">
                      <div className="p-4 bg-emerald-100 text-emerald-600 rounded-full w-14 h-14 mx-auto flex items-center justify-center">
                        <FileText className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 truncate max-w-xs mx-auto">{selectedUploadFile.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">{(selectedUploadFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedUploadFile.type || 'Document'}</p>
                      </div>
                      <span className="inline-block text-[9px] bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded-md uppercase">Click to replace file</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-4 bg-blue-50 text-blue-500 rounded-full w-14 h-14 mx-auto flex items-center justify-center transition-transform">
                        <FileText className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Drag & drop your question paper PDF or Image here</p>
                        <p className="text-xs text-slate-400 mt-1">Supports standard PDF papers or scanned page images</p>
                      </div>
                      <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider">Browse File</button>
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={() => {
                  if (selectedUploadFile) {
                    handleCuetImageUpload(selectedUploadFile);
                  } else {
                    alert('Please select a file first.');
                  }
                }}
                disabled={isAiLoading || !selectedUploadFile}
                className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl uppercase tracking-tighter text-xl shadow-xl hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    AI PROCESSING ENTIRE PAPER...
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6" />
                    EXTRACT & START PRACTICE
                  </>
                )}
              </button>
            </div>
          )}
          
          <div className="text-center">
            <button onClick={() => setCuetStatus('selection')} className="text-slate-400 font-bold text-xs uppercase underline hover:text-slate-900 transition-all">Back to Selection</button>
          </div>
        </div>
        <div className="bg-amber-50 p-8 rounded-3xl border border-amber-100 space-y-3">
            <div className="flex items-center gap-2 text-amber-700 font-black text-xs uppercase tracking-widest"><Info className="w-4 h-4"/> LEGAL DISCLAIMER</div>
            <p className="text-[10px] text-amber-800/70 leading-relaxed font-medium">This application is a PRIVATE SIMULATION TOOL. We are NOT affiliated with NTA (National Testing Agency). All logos and names are property of their respective owners. Used here under "Fair Use" for educational practice purposes ONLY.</p>
        </div>
      </div>
    );
  }

  if (cuetStatus === 'nest-login') {
    return (
      <div className="min-h-screen bg-[#f7f7f7] font-sans flex flex-col select-none text-slate-800">
        {/* Sticky Admin/Developer Setup Panel */}
        <div className="sticky top-0 bg-indigo-50 border-b border-indigo-200 z-[999] px-4 py-3 shadow-sm">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 font-sans">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-600 text-white font-black text-[10px] px-2 py-1 rounded">DEV PANEL</span>
              <p className="text-xs font-bold text-indigo-900">Custom Profile Injection Center (TCS iON Sync)</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 shrink-0">Candidate Name:</span>
                <input 
                  type="text" 
                  value={nestCandidateName} 
                  onChange={(e) => setNestCandidateName(e.target.value)} 
                  placeholder="Enter name (e.g. John Smith)" 
                  className="bg-white border text-xs px-2.5 py-1.5 rounded font-bold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 w-44"
                />
              </div>
              <div 
                className={`flex items-center gap-2 border-2 border-dashed rounded px-3 py-1 bg-white cursor-pointer transition-colors ${isDraggingOverPhoto ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingOverPhoto(true); }}
                onDragLeave={() => setIsDraggingOverPhoto(false)}
                onDrop={handlePhotoDrop}
                onClick={() => document.getElementById('nest-photo-upload-input')?.click()}
              >
                <Smartphone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="text-[10px] font-bold text-slate-500">Drag/Click Profile Photo</span>
                <input 
                  id="nest-photo-upload-input" 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                  className="hidden" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Screen 1 Top Bar (Header) */}
        <header className="h-[60px] bg-[#111111] text-white flex justify-between items-center px-4 sm:px-6 shrink-0 relative z-50">
          <div className="flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">System Name :</span>
            <span className="text-lg font-black text-[#ffcc00] uppercase tracking-tight leading-none text-left">C001</span>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase m-0 leading-none">Candidate Name</p>
              <h4 className="text-sm font-black text-[#ffcc00] tracking-tight uppercase leading-none mt-1">{nestCandidateName}</h4>
              <p className="text-[10px] text-[#e38d13] font-bold uppercase mt-1 leading-none">Mock Exam</p>
            </div>
            <div className="w-10 h-10 border border-slate-700 bg-slate-900 rounded-sm overflow-hidden flex items-center justify-center shrink-0">
              {nestCandidatePhoto ? (
                <img src={nestCandidatePhoto} className="w-full h-full object-cover" alt="Profile" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-6 h-6 text-slate-400" />
              )}
            </div>
          </div>
        </header>

        {/* Sub-Header Banner with scrolling instruction text */}
        <div className="h-7 bg-[#ffff00] border-y border-[#e6e600] flex items-center overflow-hidden shrink-0">
          <div className="whitespace-nowrap text-[11px] font-bold text-black px-4 select-none">
            Kindly contact the invigilator if there are any discrepancies in the Name and Photograph displayed on the screen or if the photograph is not yours.
          </div>
        </div>

        {/* Centered Login Box and Body Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
          <div className="w-full max-w-[420px] bg-white rounded-md shadow-lg border border-slate-200 overflow-hidden">
            {/* Header of Login Form */}
            <div className="bg-[#f1f1f1] px-5 py-3 border-b flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-slate-600" />
              </div>
              <span className="text-sm font-black text-slate-700 uppercase tracking-tight">Login</span>
            </div>

            {/* Login fields and Form body */}
            <div className="p-6 space-y-4">
              {loginError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded font-bold leading-normal">
                  {loginError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Candidate Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input 
                    type="text" 
                    value={nestCandidateName}
                    onChange={(e) => { setNestCandidateName(e.target.value); setLoginError(''); }}
                    placeholder="Enter Candidate Name" 
                    className="w-full bg-white border border-slate-300 rounded pl-10 pr-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-1 focus:ring-[#46b8da] focus:border-[#46b8da] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Candidate Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input 
                    type="email" 
                    value={nestCandidateEmail}
                    onChange={(e) => { setNestCandidateEmail(e.target.value); setLoginError(''); }}
                    placeholder="Enter Candidate Email Address" 
                    className="w-full bg-white border border-slate-300 rounded pl-10 pr-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-1 focus:ring-[#46b8da] focus:border-[#46b8da] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Roll No. / Login ID Center</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input 
                    type="text" 
                    value={nestUserId}
                    onFocus={() => { setActiveInput('id'); setKeyboardActive(true); }}
                    onChange={(e) => { setNestUserId(e.target.value); setLoginError(''); }}
                    placeholder="Roll No. or Login ID" 
                    className="w-full bg-white border border-slate-300 rounded pl-10 pr-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-1 focus:ring-[#46b8da] focus:border-[#46b8da] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Password (Required: P@llavi76)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input 
                    type="password" 
                    value={nestPassword}
                    onFocus={() => { setActiveInput('password'); setKeyboardActive(true); }}
                    onChange={(e) => { setNestPassword(e.target.value); setLoginError(''); }}
                    placeholder="Password" 
                    className="w-full bg-white border border-slate-300 rounded pl-10 pr-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:ring-1 focus:ring-[#46b8da] focus:border-[#46b8da] transition-all"
                  />
                </div>
              </div>

              <button 
                onClick={() => {
                  if (nestPassword !== 'P@llavi76') {
                    setLoginError("Invalid password. Please use correct password: P@llavi76");
                    return;
                  }
                  if (!nestCandidateName.trim()) {
                    setLoginError("Please enter candidate name.");
                    return;
                  }
                  if (!nestCandidateEmail.trim() || !nestCandidateEmail.includes('@')) {
                    setLoginError("Please enter a valid candidate email address.");
                    return;
                  }
                  setLoginError('');
                  setCuetStatus('nest-instructions');
                  setKeyboardActive(false);
                  setActiveInput(null);
                }}
                className="w-full bg-[#46b8da] hover:bg-[#31b0d5] text-white font-black py-2.5 rounded text-xs uppercase tracking-wider transition-all"
              >
                Sign In
              </button>
            </div>
          </div>

          {/* Absolute positioned Virtual US physical keyboard */}
          {keyboardActive && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-[640px] bg-[#222] p-3 rounded-lg shadow-2xl border border-slate-700 z-[999] transition-all font-sans">
              <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-[10px] font-black text-[#ffcc00] uppercase tracking-wider">TCS Virtual Keyboard (US International)</span>
                <button 
                  onClick={() => { setKeyboardActive(false); setActiveInput(null); }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid gap-1">
                {/* Keyboard keys rendering */}
                {[
                  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Backspace'],
                  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
                  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
                  ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'Space'],
                  ['Clear', 'Close']
                ].map((row, rIdx) => (
                  <div key={rIdx} className="flex justify-center gap-1">
                    {row.map(key => {
                      let keyStyle = "bg-[#fff]/10 hover:bg-[#fff]/20 text-white text-xs font-bold py-2 px-2.5 rounded min-w-[32px] sm:min-w-[40px] text-center capitalize transition-all select-none cursor-pointer active:scale-95";
                      if (key === 'Backspace') keyStyle = "bg-red-900/60 hover:bg-red-900 text-white text-xs font-bold py-2 px-3 rounded shrink-0";
                      else if (key === 'Clear') keyStyle = "bg-orange-800/60 hover:bg-orange-800 text-white text-xs font-bold py-2 px-3 rounded shrink-0";
                      else if (key === 'Close') keyStyle = "bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2 px-3 rounded shrink-0";
                      else if (key === 'Space') keyStyle = "bg-blue-600/60 hover:bg-blue-600 text-white text-xs font-bold py-2 rounded flex-1 max-w-[200px]";

                      return (
                        <div 
                          key={key} 
                          onClick={() => handleKeyboardKeyPress(key)}
                          className={keyStyle}
                        >
                          {key}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (cuetStatus === 'nest-instructions') {
    return (
      <div className="min-h-screen bg-white font-sans flex flex-col text-slate-800 select-none">
        {/* Screen 2 Header banner */}
        <header className="bg-gradient-to-r from-blue-700 via-[#2f71b9] to-blue-800 text-white h-[60px] flex items-center px-4 shrink-0 shadow-md">
          <div className="flex items-center gap-3 w-full justify-center relative">
            <div className="absolute left-4 bg-white/20 p-1.5 rounded-full">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-sm sm:text-base font-black uppercase tracking-tight text-center">
              NATIONAL ENTRANCE SCREENING TEST / NEST 2026
            </h1>
          </div>
        </header>

        {/* Sub Header bar */}
        <div className="bg-[#2f71b9] text-white px-4 py-2 border-t border-blue-400/30 flex justify-between items-center shrink-0">
          <span className="text-xs font-black uppercase tracking-wider">Instructions</span>
          <div className="flex items-center gap-2 text-slate-800">
            <span className="text-[10px] font-bold text-white">View In:</span>
            <select className="bg-white border text-xs px-2 py-1 rounded outline-none font-bold">
              <option>English</option>
            </select>
          </div>
        </div>

        {/* Instruction main scrollable box */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-6">
          <h2 className="text-sm font-black text-slate-900 border-b pb-2 uppercase tracking-tight">
            Please read the instructions carefully
          </h2>

          <div className="text-xs text-slate-700 space-y-4 leading-relaxed font-bold">
            <p className="font-extrabold text-slate-900 text-sm">General Instructions:</p>
            <ol className="list-decimal pl-4 space-y-3">
              <li>Total duration of examination is 12 minutes.</li>
              <li>The clock will be set at the server. The countdown timer in the top right corner of screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself. You will not be required to end or submit your examination.</li>
              <li>
                <p>The Question Palette displayed on the right side of screen will show the status of each question using one of the following symbols:</p>
                <div className="grid grid-cols-1 gap-2 mt-2 pl-2">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 bg-white border border-slate-300 text-[10px] flex items-center justify-center font-black rounded shrink-0 text-slate-900">1</span>
                    <span>You have not visited the question yet.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 bg-[#d9534f] text-white text-[10px] flex items-center justify-center font-black rounded-t-3xl rounded-b-lg border-b-2 border-red-700 shrink-0">2</span>
                    <span>You have not answered the question.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 bg-[#5cb85c] text-white text-[10px] flex items-center justify-center font-black rounded-b-3xl rounded-t-lg border-t-2 border-green-800 shrink-0">3</span>
                    <span>You have answered the question.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 bg-[#7a43b6] text-white text-[10px] flex items-center justify-center font-black rounded-full shrink-0">4</span>
                    <span>You have NOT answered the question, but have marked the question for review.</span>
                  </div>
                  <div className="flex items-center gap-3 font-bold">
                    <span className="w-5 h-5 bg-[#7a43b6] text-white text-[10px] flex items-center justify-center font-black rounded-full relative after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-2 after:h-2 after:bg-[#5cb85c] after:rounded-full after:border after:border-white shrink-0">5</span>
                    <span>The question(s) "Answered and Marked for Review" will be considered for evaluation. The Marked for Review status for a question simply indicates that you would like to look at that question again.</span>
                  </div>
                </div>
              </li>
              <li>You can click on the "&gt;" arrow which appears to the left of question palette to collapse the question palette thereby maximizing the question window. To view the question palette again, you can click on "&lt;" which appears on the right side of question window.</li>
              <li>You can click on your "Profile" image on top right corner of your screen to change the language during the exam for entire question paper. On clicking of Profile image you will get a drop-down to change the question content to the desired language.</li>
              <li>You can click on [Up Arrow] to navigate to the bottom and [Down Arrow] to navigate to the top of the question area, without scrolling.</li>
            </ol>

            <p className="font-extrabold text-slate-900 text-sm mt-4">Navigating to a Question:</p>
            <ol start={7} className="list-decimal pl-4 space-y-3">
              <li>
                <p>To answer a question, do the following:</p>
                <ol className="list-alpha pl-4 space-y-1.5 mt-1.5">
                  <li>Click on the question number in the Question Palette at the right of your screen to go to that numbered question directly. Note that using this option does NOT save your answer to the current question.</li>
                  <li>Click on <span className="font-extrabold uppercase text-slate-900	">Save & Next</span> to save your answer for the current question and then go to the next question.</li>
                  <li>Click on <span className="font-extrabold uppercase text-slate-900">Mark for Review & Next</span> to save your answer for the current question, mark it for review, and then go to the next question.</li>
                </ol>
              </li>
            </ol>

            <p className="font-extrabold text-slate-900 text-sm mt-4">Answering a Question:</p>
            <ol start={8} className="list-decimal pl-4 space-y-2">
              <li>
                <p>Procedure for answering a multiple choice type question:</p>
                <ol className="list-alpha pl-4 space-y-1.5 mt-1.5">
                  <li>To select your answer, click on the button of one of the options.</li>
                  <li>To deselect your chosen answer, click on the button of the chosen option again or click on the <span className="font-extrabold uppercase text-slate-900">Clear Response</span> button.</li>
                  <li>To change your chosen answer, click on the button of another option.</li>
                  <li>To save your answer, you MUST click on the <span className="font-extrabold uppercase text-slate-900">Save & Next</span> button.</li>
                  <li>To mark the question for review, click on the <span className="font-extrabold uppercase text-slate-900">Mark for Review & Next</span> button.</li>
                </ol>
              </li>
              <li>To change your answer to a question that has already been answered, first select that question for answering and then follow the procedure for answering that type of question.</li>
            </ol>

            <p className="font-extrabold text-slate-900 text-sm mt-4">Navigating through sections:</p>
            <ol start={10} className="list-decimal pl-4 space-y-3">
              <li>Sections in this question paper are displayed on the top bar of the screen. Questions in a section can be viewed by clicking on the section name. The section you are currently viewing is highlighted.</li>
              <li>After clicking the Save & Next button on the last question for a section, you will automatically be taken to the first question of the next section.</li>
              <li>Candidate can view the corresponding section summary as per the table depicted that appears in every section above the question palette.</li>
              <li>Candidate can view the corresponding section summary as part of the legend that appears in every section above the question palette.</li>
            </ol>
          </div>
        </div>

        {/* Footer fixed navbar */}
        <footer className="h-14 bg-slate-100 border-t flex items-center justify-end px-6 shrink-0 gap-3 z-50">
          <button 
            onClick={() => setCuetStatus('nest-other-instructions')} 
            className="bg-[#2f71b9] hover:bg-blue-700 text-white font-black text-xs uppercase px-5 py-2.5 rounded tracking-wider shadow-md transition-all active:scale-[0.98]"
          >
            Next &gt;
          </button>
        </footer>
      </div>
    );
  }

  if (cuetStatus === 'nest-other-instructions') {
    return (
      <div className="min-h-screen bg-white font-sans flex flex-col text-slate-800 select-none">
        {/* Screen 2 Header banner */}
        <header className="bg-gradient-to-r from-blue-700 via-[#2f71b9] to-blue-800 text-white h-[60px] flex items-center px-4 shrink-0 shadow-md">
          <div className="flex items-center gap-3 w-full justify-center relative">
            <div className="absolute left-4 bg-white/20 p-1.5 rounded-full">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-sm sm:text-base font-black uppercase tracking-tight text-center">
              NATIONAL ENTRANCE SCREENING TEST / NEST 2026
            </h1>
          </div>
        </header>

        {/* Sub Header bar */}
        <div className="bg-[#2f71b9] text-white px-4 py-2 border-t border-blue-400/30 flex justify-between items-center shrink-0">
          <span className="text-xs font-black uppercase tracking-wider">Other Important Instructions</span>
          <div className="flex items-center gap-2 text-slate-800">
            <span className="text-[10px] font-bold text-white">View In:</span>
            <select className="bg-white border text-xs px-2 py-1 rounded outline-none font-bold">
              <option>English</option>
            </select>
          </div>
        </div>

        {/* Other Instructions area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-6">
          <div className="p-10 border border-slate-200 bg-slate-50 rounded-xl space-y-6 text-center">
            <p className="text-sm font-black text-slate-700 uppercase tracking-tight leading-relaxed">
              The instructions are not available in the chosen language.
            </p>
          </div>

          <div className="border border-slate-200 p-5 rounded-xl space-y-5 bg-white relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Choose your Default Language:
              </label>
              <div className="relative text-slate-850">
                <button 
                  onClick={() => setNestLangSelectModal(!nestLangSelectModal)} 
                  className="w-full bg-slate-100 hover:bg-slate-200 border text-slate-800 text-xs px-4 py-2 rounded font-black tracking-wider text-left flex justify-between items-center gap-3 min-w-[150px]"
                >
                  <span>{nestDefaultLanguage || '--Select--'}</span>
                  <span className="text-[10px]">▼</span>
                </button>
                {nestLangSelectModal && (
                  <div className="absolute z-50 mt-1 left-0 right-0 bg-white border rounded shadow-xl overflow-hidden py-1">
                    {['English', 'Hindi'].map(lang => (
                      <div 
                        key={lang} 
                        onClick={() => { setNestDefaultLanguage(lang as any); setNestLangSelectModal(false); }} 
                        className="px-4 py-2 hover:bg-indigo-50 text-xs font-bold text-slate-700 cursor-pointer text-left"
                      >
                        {lang}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 items-start select-text leading-relaxed">
              <input 
                id="disclaimer-chk" 
                type="checkbox" 
                checked={isDisclaimerChecked} 
                onChange={(e) => setIsDisclaimerChecked(e.target.checked)} 
                className="w-4 h-4 mt-1 rounded text-[#2f71b9] outline-none border-slate-300 pointer-events-auto shrink-0 cursor-pointer"
              />
              <label htmlFor="disclaimer-chk" className="text-[10px] text-slate-600 font-bold select-none cursor-pointer text-left">
                Please read all inputs carefully in your default language. This language can be changed for a particular question later on. I have read and understood the instructions. All computer hardwares assigned to me are in proper working condition. I declare that I am not in possession of any prohibited material such as mobile phones, bluetooth devices etc. I am fully aware that if found with any such items inside the Examination Hall, I agree that it is a case of violating regulations / I shall be liable to be debarred from the Test and or to disciplinary action, which may include bar from future Tests / Examinations.
              </label>
            </div>
          </div>
        </div>

        {/* Footer actions bar */}
        <footer className="h-14 bg-slate-100 border-t flex items-center justify-between px-6 shrink-0 z-50">
          <button 
            onClick={() => setCuetStatus('nest-instructions')} 
            className="border border-[#2f71b9] hover:bg-slate-200 font-black text-xs uppercase px-5 py-2.5 rounded tracking-wider text-[#2f71b9]"
          >
            &lt; Previous
          </button>
          
          <button 
            onClick={async () => {
              if (!nestDefaultLanguage) { alert("Please select your Default Language first."); return; }
              if (!isDisclaimerChecked) { alert("Please inspect and check the disclaimer to declare that you agree to the instructions."); return; }
              setCuetStatus('exam');
              setCuetAnswers({});
              const initialMap: any = {};
              cuetQuestions.forEach((_: any, i: number) => initialMap[i] = 'not-visited');
              initialMap[0] = 'not-answered';
              setCuetStatusMap(initialMap);
              setActiveQuestion(0);
              requestFullscreen();
              await initializeNewTestSession();
            }} 
            className="bg-[#5cb85c] hover:bg-green-700 text-white font-black text-xs uppercase px-5 py-2.5 rounded tracking-wider shadow-md transition-all active:scale-[0.98]"
          >
            I am ready to begin
          </button>
        </footer>
      </div>
    );
  }

  if (cuetStatus === 'instructions') {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4">
        <div className="bg-white shadow-2xl p-10 rounded-[40px] border border-slate-100 space-y-10">
            <div className="text-center space-y-2">
                <Monitor className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Exam Environment Check</h2>
                <div className="h-1 w-20 bg-blue-600 mx-auto rounded-full" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Display Device</p>
                    <p className="font-bold text-slate-900">Desktop/Laptop Preferred</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Orientation</p>
                    <p className="font-bold text-slate-900">Landscape Mode (Mobile)</p>
                </div>
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 sm:col-span-2">
                    <p className="text-[10px] font-black text-red-400 uppercase mb-2">Proctoring Guard</p>
                    <p className="font-bold text-red-900">DO NOT SWITCH TABS. ESCAPING FULLSCREEN LOCKS THE EXAM.</p>
                </div>
            </div>

            <button 
              onClick={() => {
                setCuetStatus('exam');
                requestFullscreen();
              }} 
              className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl uppercase tracking-tighter text-xl shadow-xl hover:bg-black transition-all"
            >
              Begin Examination
            </button>
            <div className="text-center">
                <button onClick={() => setCuetStatus('upload')} className="text-slate-400 font-bold text-[10px] uppercase hover:text-slate-900 transition-all underline underline-offset-4">Change Question Paper</button>
            </div>
        </div>
      </div>
    );
  }

  if (cuetStatus === 'exam') {
    if (isFullscreenSupported && !isFullscreenActive) {
      return (
        <div id="fullscreen-lockout-overlay" className="fixed inset-0 z-[1000] bg-slate-900 flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl space-y-6">
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-500 animate-pulse">
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-black text-white uppercase tracking-tight">Full Screen Mode Required</h2>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                This simulated examination requires continuous fullscreen block to mimic real physical centers.
                Address bar, tab switching tools, and home gestures are fully locked out in this layer.
              </p>
            </div>

            <div className="bg-amber-950/20 border border-amber-500/20 text-amber-400 p-4 rounded-2xl text-[10px] leading-relaxed font-bold uppercase text-left">
              ⚠️ PROCTOR RULES FOR CANDIDATE (PALLAVI):<br/>
              • DO NOT use phone gestures or physical back buttons.<br/>
              • DO NOT pull down the notifications bar or trigger multi-tasking.<br/>
              • Closing this window or changing tabs terminates the exam.
            </div>

            <button 
              onClick={requestFullscreen}
              className="w-full bg-[#185adb] hover:bg-indigo-700 text-white font-black py-4 rounded-xl uppercase tracking-wider text-xs transition-all focus:outline-none shadow-lg scale-100 hover:scale-[1.02] active:scale-[0.98]"
            >
              Resume Exam in Full Screen
            </button>
            <p className="text-[10px] text-slate-500">
              Exam Guard Active | Sec ID: CUET2026-X7Y
            </p>
          </div>
        </div>
      );
    }

    const currentQ = cuetQuestions[activeQuestion];
    const formatTime = (s: number) => {
        const h = Math.floor(s/3600);
        const m = Math.floor((s % 3600)/60);
        const sec = s % 60;
        return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
    };

    // Subject filtering for Navigation Palette
    const subjects = (examType === 'nest' || examType === 'jipmat')
        ? (examType === 'jipmat'
            ? ['Quantitative Aptitude (QA)', 'Data Interpretation & Logical Reasoning (DILR)', 'Verbal Ability & Reading Comprehension (VARC)']
            : ['Biology', 'Chemistry', 'Physics']
          ).filter((sub: string) => cuetQuestions.some((q: any) => q.subject === sub))
        : examType === 'neet' 
        ? ['Physics', 'Chemistry', 'Biology'] 
        : ['General Test'];
    const filteredQuestions = (examType === 'neet' || examType === 'nest' || examType === 'jipmat')
        ? cuetQuestions.map((q: any, i: number) => ({...q, originalIndex: i})).filter((q: any) => q.subject === activeNeetSubject)
        : cuetQuestions.map((q: any, i: number) => ({...q, originalIndex: i}));

    const StatusBadge = ({ type, count, label }: { type: any, count: number, label: string }) => {
        const shapes: any = {
            'not-visited': 'bg-white border text-slate-900 rounded',
            'not-answered': 'bg-red-500 text-white rounded-t-3xl rounded-b-lg border-b-4 border-red-700',
            'answered': 'bg-green-600 text-white rounded-b-3xl rounded-t-lg border-t-4 border-green-800',
            'marked': 'bg-indigo-600 text-white rounded-full border-2 border-indigo-200',
            'answered-marked': 'bg-indigo-600 text-white rounded-full relative after:content-[""] after:absolute after:bottom-0 after:right-0 after:w-3 after:h-3 after:bg-green-500 after:rounded-full after:border-2 after:border-white'
        };
        return (
            <div className="flex items-center gap-3">
                <div className={`${shapes[type]} w-6 h-6 flex items-center justify-center font-bold text-[10px] shadow-sm`}>{count}</div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
            </div>
        );
    };

    const counts = {
        'not-visited': Object.values(cuetStatusMap).filter(v => v === 'not-visited').length,
        'not-answered': Object.values(cuetStatusMap).filter(v => v === 'not-answered').length,
        'answered': Object.values(cuetStatusMap).filter(v => v === 'answered').length,
        'marked': Object.values(cuetStatusMap).filter(v => v === 'marked').length,
        'answered-marked': Object.values(cuetStatusMap).filter(v => v === 'answered-marked').length,
    };

    if (false) {
      const currentAns = cuetAnswers[activeQuestion];
      return (
        <div key="nest-exam-container" className="fixed inset-0 bg-[#f4f7f9] text-slate-850 z-[90] flex flex-col font-sans select-none overflow-hidden">
          {/* Header Bar (TCS iON Custom High Fidelity Style) */}
          <header id="nest-header" className="h-[65px] bg-[#1e2833] text-white flex justify-between items-center px-4 sm:px-6 shrink-0 z-50 shadow-md border-b border-slate-900">
            <div className="flex items-center gap-3">
              <div className={`${examType === 'jipmat' ? 'bg-[#ea580c]' : 'bg-[#2f71b9]'} p-2 rounded`}>
                <Monitor className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div className="text-left">
                <h1 id="nest-title" className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-100">
                  {examType === 'jipmat' ? 'JIPMAT 2026 ONLINE SIMULATOR' : 'NEST 2026 ONLINE SIMULATOR'}
                </h1>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">TCS iON Assessment Systems</p>
              </div>
            </div>

            {/* Quick Timer Dashboard Info */}
            <div className="flex gap-4 sm:gap-6 items-center bg-[#121921] border border-slate-800 px-4 py-2 rounded-lg">
              <div className="text-right">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-wider">Remaining Exam Time</p>
                <div className="flex items-center gap-1.5 text-orange-400 font-mono font-black text-sm sm:text-lg tabular-nums">
                  <Clock className="w-4 h-4 text-orange-400 animate-spin-slow shrink-0" />
                  {formatTime(cuetTimeLeft)}
                </div>
              </div>
            </div>
          </header>

          {/* Section Selector Custom Bar */}
          <div id="nest-section-bar" className={`${examType === 'jipmat' ? 'bg-[#ea580c] border-[#c2410c]' : 'bg-[#2f71b9] border-[#245994]'} px-4 py-1.5 flex items-center justify-between border-b shadow-inner shrink-0 text-white`}>
            <div className="flex gap-1.5">
              {subjects.map(sub => (
                <button
                  id={`sub-btn-${sub}`}
                  key={sub}
                  onClick={() => {
                    setActiveNeetSubject(sub);
                    const firstInSub = cuetQuestions.findIndex((q: any) => q.subject === sub);
                    if (firstInSub !== -1) setActiveQuestion(firstInSub);
                  }}
                  className={`${activeNeetSubject === sub ? `bg-white ${examType === 'jipmat' ? 'text-orange-950 border-orange-600' : 'text-blue-900 border-orange-500'} font-extrabold border-b-2 shadow-md` : 'bg-white/10 text-white/95 hover:bg-white/20'} px-5 py-2 rounded-md font-black text-[11px] uppercase tracking-wide transition-all`}
                >
                  {sub}
                </button>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-blue-100 font-black uppercase">TCS SECURITY PORTAL ENABLED</span>
            </div>
          </div>

          {/* Top Utilities Toolbar */}
          <div id="nest-toolbar" className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between shadow-sm text-xs text-slate-700 shrink-0 select-none">
            <div className="flex items-center gap-2 font-bold">
              <span className="text-slate-500 font-extrabold uppercase text-[9px] tracking-wider">Text Size Control:</span>
              <button 
                id="zoom-in"
                onClick={() => setNestTextZoom((prev: number) => Math.min(150, prev + 10))} 
                className="w-7 h-7 bg-white hover:bg-slate-50 rounded border border-slate-300 flex items-center justify-center font-black text-sm active:scale-95 transition-all text-slate-900 hover:border-slate-400 outline-none"
                title="Zoom In Text (+)"
              >
                +
              </button>
              <button 
                id="zoom-out"
                onClick={() => setNestTextZoom((prev: number) => Math.max(70, prev - 10))} 
                className="w-7 h-7 bg-white hover:bg-slate-50 rounded border border-slate-300 flex items-center justify-center font-black text-sm active:scale-95 transition-all text-slate-900 hover:border-slate-400 outline-none"
                title="Zoom Out Text (-)"
              >
                -
              </button>
              <span className="text-[10px] font-mono bg-white border border-slate-250 px-2 py-1 rounded font-bold text-slate-600 shrink-0 shadow-xs">
                {nestTextZoom}%
              </span>
            </div>

            <div className="flex items-center gap-2 relative">
              {/* Scientific Calculator Trigger Icon button */}
              <button 
                id="calc-trigger"
                onClick={() => setIsCalculatorOpen((prev: boolean) => !prev)} 
                className={`p-2 rounded border flex items-center gap-1.5 font-bold uppercase text-[10px] shadow-xs tracking-wider transition-all outline-none ${isCalculatorOpen ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 hover:border-slate-350'}`}
                title="Interactive Scientific Calculator"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Calculator</span>
              </button>

              {/* Floating Tooltip/Popover Legend trigger icon */}
              <button 
                id="legend-trigger"
                onClick={() => setIsInfoOpen((prev: boolean) => !prev)} 
                className={`p-2 rounded border flex items-center gap-1.5 font-bold text-[10px] shadow-xs tracking-wider transition-all outline-none ${isInfoOpen ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950'}`}
                title="Detailed Legend Checklist"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Legend Status</span>
              </button>

              {/* Top Right Legend Info Tooltip Popup */}
              {isInfoOpen && (
                <div id="legend-popup" className="absolute right-0 top-11 bg-white p-4.5 rounded-lg shadow-2xl border border-slate-250 z-[999] w-[260px] cursor-default text-left select-none space-y-3 font-semibold text-slate-700 animate-fadeIn">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-[10px] font-black uppercase text-slate-900 tracking-wider">Question Legend</span>
                    <button onClick={() => setIsInfoOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2.5 text-[11px] font-bold text-slate-600">
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 bg-[#5cb85c] text-white text-[10px] flex items-center justify-center font-black rounded-b-3xl rounded-t-lg border-t-2 border-green-800 shrink-0">3</span>
                      <span>Answered Questions</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 bg-[#d9534f] text-white text-[10px] flex items-center justify-center font-black rounded-t-3xl rounded-b-lg border-b-2 border-red-700 shrink-0">2</span>
                      <span>Not Answered Questions</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 bg-white border border-slate-350 text-[10px] flex items-center justify-center font-black rounded shrink-0 text-slate-900 text-center">1</span>
                      <span>Not Visited Questions</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 bg-[#7a43b6] text-white text-[10px] flex items-center justify-center font-black rounded-full shrink-0">4</span>
                      <span>Marked for Review</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 bg-[#7a43b6] text-white text-[10px] flex items-center justify-center font-black rounded-full relative after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-2 after:h-2 after:bg-[#5cb85c] after:rounded-full after:border after:border-white shrink-0">5</span>
                      <span>Answered & Marked Review</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
                {/* Interactive Draggable Scientific Calculator Widget Popup */}
          {isCalculatorOpen && (
            <div id="calculator-popup" className="fixed top-28 left-4 xs:left-auto xs:right-[350px] w-[320px] bg-[#eeeeee] border-2 border-[#87996b] rounded shadow-2xl z-[999] text-slate-800 flex flex-col font-sans select-none overflow-hidden pb-1 hover:border-[#2f71b9] transition-all duration-300">
              {/* Calculator header bar */}
              <div className="bg-[#2f71b9] text-white px-3 py-1.5 flex items-center justify-between text-xs font-black">
                <span className="uppercase tracking-wider">Scientific Calculator</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsCalculatorOpen(false)} className="text-white hover:text-red-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Pad Container */}
              <div className="p-2 space-y-2">
                {/* OutPut display screen area */}
                <div id="sciOutPut" className="bg-[#B8C6A3] text-[#000000] font-mono text-right px-2.5 py-1.5 rounded border border-[#87996b] shadow-inner font-extrabold text-[#000000] text-xl min-h-[46px] select-text tracking-normal flex items-center justify-end break-all overflow-hidden">
                  {getCalcFormattedDisplay()}
                </div>

                {/* Keyboard Grid - Exact 5 Columns */}
                <div className="grid grid-cols-5 gap-1 select-none">
                  {/* Row 1 */}
                  <button onClick={() => handleCalcKeyPress('sin')} className="bg-[#C8D8E8] border border-[#262626] rounded-[3px] text-[#185290] font-bold text-[11px] h-7 flex items-center justify-center cursor-pointer hover:bg-[#b0c8e0] active:bg-[#013f7d] active:text-white transition-all outline-none">sin</button>
                  <button onClick={() => handleCalcKeyPress('cos')} className="bg-[#C8D8E8] border border-[#262626] rounded-[3px] text-[#185290] font-bold text-[11px] h-7 flex items-center justify-center cursor-pointer hover:bg-[#b0c8e0] active:bg-[#013f7d] active:text-white transition-all outline-none">cos</button>
                  <button onClick={() => handleCalcKeyPress('tan')} className="bg-[#C8D8E8] border border-[#262626] rounded-[3px] text-[#185290] font-bold text-[11px] h-7 flex items-center justify-center cursor-pointer hover:bg-[#b0c8e0] active:bg-[#013f7d] active:text-white transition-all outline-none">tan</button>
                  <div className="col-span-2 flex items-center justify-around text-[11px] text-[#262626] font-bold leading-none bg-[#e8e8e8]/50 border border-slate-300 rounded-[3px] h-7 px-1">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="sci_deg_rad" 
                        checked={cDegree === 'degree'} 
                        onChange={() => setCDegree('degree')} 
                        className="cursor-pointer scale-90"
                      />
                      <span>Deg</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="sci_deg_rad" 
                        checked={cDegree === 'radians'} 
                        onChange={() => setCDegree('radians')} 
                        className="cursor-pointer scale-90"
                      />
                      <span>Rad</span>
                    </label>
                  </div>

                  {/* Row 2 */}
                  <button onClick={() => handleCalcKeyPress('asin')} className="bg-[#C8D8E8] border border-[#262626] rounded-[3px] text-[#185290] font-bold text-[10px] h-7 flex items-center justify-center cursor-pointer hover:bg-[#b0c8e0] active:bg-[#013f7d] active:text-white transition-all outline-none">sin⁻¹</button>
                  <button onClick={() => handleCalcKeyPress('acos')} className="bg-[#C8D8E8] border border-[#262626] rounded-[3px] text-[#185290] font-bold text-[10px] h-7 flex items-center justify-center cursor-pointer hover:bg-[#b0c8e0] active:bg-[#013f7d] active:text-white transition-all outline-none">cos⁻¹</button>
                  <button onClick={() => handleCalcKeyPress('atan')} className="bg-[#C8D8E8] border border-[#262626] rounded-[3px] text-[#185290] font-bold text-[10px] h-7 flex items-center justify-center cursor-pointer hover:bg-[#b0c8e0] active:bg-[#013f7d] active:text-white transition-all outline-none">tan⁻¹</button>
                  <button onClick={() => handleCalcKeyPress('pi')} className="bg-[#C8D8E8] border border-[#262626] rounded-[3px] text-[#185290] font-bold text-[11px] h-7 flex items-center justify-center cursor-pointer hover:bg-[#b0c8e0] active:bg-[#013f7d] active:text-white transition-all outline-none">π</button>
                  <button onClick={() => handleCalcKeyPress('e')} className="bg-[#C8D8E8] border border-[#262626] rounded-[3px] text-[#185290] font-bold text-[11px] h-7 flex items-center justify-center cursor-pointer hover:bg-[#b0c8e0] active:bg-[#013f7d] active:text-white transition-all outline-none font-sans italic">e</button>

                  {/* Row 3 */}
                  <button onClick={() => handleCalcKeyPress('pow')} className="bg-[#C8D8E8] border border-[#262626] rounded-[3px] text-[#185290] font-bold text-[11px] h-7 flex items-center justify-center cursor-pointer hover:bg-[#b0c8e0] active:bg-[#013f7d] active:text-white transition-all outline-none">xʸ</button>
                  <button onClick={() => handleCalcKeyPress('x3')} className="bg-[#C8D8E8] border border-[#262626] rounded-[3px] text-[#185290] font-bold text-[11px] h-7 flex items-center justify-center cursor-pointer hover:bg-[#b0c8e0] active:bg-[#013f7d] active:text-white transition-all outline-none">x³</button>
                  <button onClick={() => handleCalcKeyPress('x2')} className="bg-[#C8D8E8] border border-[#262626] rounded-[3px] text-[#185290] font-bold text-[11px] h-7 flex items-center justify-center cursor-pointer hover:bg-[#b0c8e0] active:bg-[#013f7d] active:text-white transition-all outline-none">x²</button>
                  <button onClick={() => handleCalcKeyPress('ex')} className="bg-[#C8D8E8] border border-[#262626] rounded-[3px] text-[#185290] font-bold text-[11px] h-7 flex items-center justify-center cursor-pointer hover:bg-[#b0c8e0] active:bg-[#013f7d] active:text-white transition-all outline-none">eˣ</button>
                  <button onClick={() => handleCalcKeyPress('10x')} className="bg-[#C8D8E8] border border-[#262626] rounded-[3px] text-[#185290] font-bold text-[11px] h-7 flex items-center justify-center cursor-pointer hover:bg-[#b0c8e0] active:bg-[#013f7d] active:text-white transition-all outline-none">10ˣ</button>

                  {/* Row 4 */}
                  <button onClick={() => handleCalcKeyPress('apow')} className="bg-[#C8D8E8] border border-[#262626] rounded-[3px] text-[#185290] font-bold text-[11px] h-7 flex items-center justify-center cursor-pointer hover:bg-[#b0c8e0] active:bg-[#013f7d] active:text-white transition-all outline-none">ʸ√x</button>
                  <button onClick={() => handleCalcKeyPress('3x')} className="bg-[#C8D8E8] border border-[#262626] rounded-[3px] text-[#185290] font-bold text-[11px] h-7 flex items-center justify-center cursor-pointer hover:bg-[#b0c8e0] active:bg-[#013f7d] active:text-white transition-all outline-none">³√x</button>
                  <button onClick={() => handleCalcKeyPress('sqrt')} className="bg-[#C8D8E8] border border-[#262626] rounded-[3px] text-[#185290] font-bold text-[11px] h-7 flex items-center justify-center cursor-pointer hover:bg-[#b0c8e0] active:bg-[#013f7d] active:text-white transition-all outline-none">√x</button>
                  <button onClick={() => handleCalcKeyPress('ln')} className="bg-[#C8D8E8] border border-[#262626] rounded-[3px] text-[#185290] font-bold text-[11px] h-7 flex items-center justify-center cursor-pointer hover:bg-[#b0c8e0] active:bg-[#013f7d] active:text-white transition-all outline-none">ln</button>
                  <button onClick={() => handleCalcKeyPress('log')} className="bg-[#C8D8E8] border border-[#262626] rounded-[3px] text-[#185290] font-bold text-[11px] h-7 flex items-center justify-center cursor-pointer hover:bg-[#b0c8e0] active:bg-[#013f7d] active:text-white transition-all outline-none">log</button>

                  {/* Row 5 */}
                  <button onClick={() => handleCalcKeyPress('(')} className="bg-[#C8D8E8] border border-[#262626] rounded-[3px] text-[#185290] font-bold text-[11px] h-7 flex items-center justify-center cursor-pointer hover:bg-[#b0c8e0] active:bg-[#013f7d] active:text-white transition-all outline-none">(</button>
                  <button onClick={() => handleCalcKeyPress(')')} className="bg-[#C8D8E8] border border-[#262626] rounded-[3px] text-[#185290] font-bold text-[11px] h-7 flex items-center justify-center cursor-pointer hover:bg-[#b0c8e0] active:bg-[#013f7d] active:text-white transition-all outline-none">)</button>
                  <button onClick={() => handleCalcKeyPress('1/x')} className="bg-[#C8D8E8] border border-[#262626] rounded-[3px] text-[#185290] font-bold text-[11px] h-7 flex items-center justify-center cursor-pointer hover:bg-[#b0c8e0] active:bg-[#013f7d] active:text-white transition-all outline-none">1/x</button>
                  <button onClick={() => handleCalcKeyPress('pc')} className="bg-[#C8D8E8] border border-[#262626] rounded-[3px] text-[#185290] font-bold text-[11px] h-7 flex items-center justify-center cursor-pointer hover:bg-[#b0c8e0] active:bg-[#013f7d] active:text-white transition-all outline-none">%</button>
                  <button onClick={() => handleCalcKeyPress('n!')} className="bg-[#C8D8E8] border border-[#262626] rounded-[3px] text-[#185290] font-bold text-[11px] h-7 flex items-center justify-center cursor-pointer hover:bg-[#b0c8e0] active:bg-[#013f7d] active:text-white transition-all outline-none">n!</button>

                  {/* Row 6 */}
                  <button onClick={() => handleCalcKeyPress('7')} className="bg-[#262626] border border-[#262626] rounded-[3px] text-white font-bold text-sm h-8 flex items-center justify-center cursor-pointer hover:bg-slate-700 active:bg-slate-500 transition-all outline-none">7</button>
                  <button onClick={() => handleCalcKeyPress('8')} className="bg-[#262626] border border-[#262626] rounded-[3px] text-white font-bold text-sm h-8 flex items-center justify-center cursor-pointer hover:bg-slate-700 active:bg-slate-500 transition-all outline-none">8</button>
                  <button onClick={() => handleCalcKeyPress('9')} className="bg-[#262626] border border-[#262626] rounded-[3px] text-white font-bold text-sm h-8 flex items-center justify-center cursor-pointer hover:bg-slate-700 active:bg-slate-500 transition-all outline-none">9</button>
                  <button onClick={() => handleCalcKeyPress('+')} className="bg-[#cccccc] border border-[#262626] rounded-[3px] text-[#262626] font-bold text-lg h-8 flex items-center justify-center cursor-pointer hover:bg-[#b8b8b8] active:bg-[#111111] active:text-white transition-all outline-none">+</button>
                  <button onClick={() => handleCalcKeyPress('MS')} className="bg-[#cccccc] border border-[#262626] rounded-[3px] text-[#262626] font-bold text-xs h-8 flex items-center justify-center cursor-pointer hover:bg-[#b8b8b8] active:bg-[#111111] active:text-white transition-all outline-none">MS</button>

                  {/* Row 7 */}
                  <button onClick={() => handleCalcKeyPress('4')} className="bg-[#262626] border border-[#262626] rounded-[3px] text-white font-bold text-sm h-8 flex items-center justify-center cursor-pointer hover:bg-slate-700 active:bg-slate-500 transition-all outline-none">4</button>
                  <button onClick={() => handleCalcKeyPress('5')} className="bg-[#262626] border border-[#262626] rounded-[3px] text-white font-bold text-sm h-8 flex items-center justify-center cursor-pointer hover:bg-slate-700 active:bg-slate-500 transition-all outline-none">5</button>
                  <button onClick={() => handleCalcKeyPress('6')} className="bg-[#262626] border border-[#262626] rounded-[3px] text-white font-bold text-sm h-8 flex items-center justify-center cursor-pointer hover:bg-slate-700 active:bg-slate-500 transition-all outline-none">6</button>
                  <button onClick={() => handleCalcKeyPress('-')} className="bg-[#cccccc] border border-[#262626] rounded-[3px] text-[#262626] font-bold text-lg h-8 flex items-center justify-center cursor-pointer hover:bg-[#b8b8b8] active:bg-[#111111] active:text-white transition-all outline-none">-</button>
                  <button onClick={() => handleCalcKeyPress('M+')} className="bg-[#cccccc] border border-[#262626] rounded-[3px] text-[#262626] font-bold text-xs h-8 flex items-center justify-center cursor-pointer hover:bg-[#b8b8b8] active:bg-[#111111] active:text-white transition-all outline-none">M+</button>

                  {/* Row 8 */}
                  <button onClick={() => handleCalcKeyPress('1')} className="bg-[#262626] border border-[#262626] rounded-[3px] text-white font-bold text-sm h-8 flex items-center justify-center cursor-pointer hover:bg-slate-700 active:bg-slate-500 transition-all outline-none">1</button>
                  <button onClick={() => handleCalcKeyPress('2')} className="bg-[#262626] border border-[#262626] rounded-[3px] text-white font-bold text-sm h-8 flex items-center justify-center cursor-pointer hover:bg-slate-700 active:bg-slate-500 transition-all outline-none">2</button>
                  <button onClick={() => handleCalcKeyPress('3')} className="bg-[#262626] border border-[#262626] rounded-[3px] text-white font-bold text-sm h-8 flex items-center justify-center cursor-pointer hover:bg-slate-700 active:bg-slate-500 transition-all outline-none">3</button>
                  <button onClick={() => handleCalcKeyPress('*')} className="bg-[#cccccc] border border-[#262626] rounded-[3px] text-[#262626] font-bold text-[15px] h-8 flex items-center justify-center cursor-pointer hover:bg-[#b8b8b8] active:bg-[#111111] active:text-white transition-all outline-none">×</button>
                  <button onClick={() => handleCalcKeyPress('M-')} className="bg-[#cccccc] border border-[#262626] rounded-[3px] text-[#262626] font-bold text-xs h-8 flex items-center justify-center cursor-pointer hover:bg-[#b8b8b8] active:bg-[#111111] active:text-white transition-all outline-none">M-</button>

                  {/* Row 9 */}
                  <button onClick={() => handleCalcKeyPress('0')} className="bg-[#262626] border border-[#262626] rounded-[3px] text-white font-bold text-sm h-8 flex items-center justify-center cursor-pointer hover:bg-slate-700 active:bg-slate-500 transition-all outline-none">0</button>
                  <button onClick={() => handleCalcKeyPress('.')} className="bg-[#262626] border border-[#262626] rounded-[3px] text-white font-bold text-sm h-8 flex items-center justify-center cursor-pointer hover:bg-slate-700 active:bg-slate-500 transition-all outline-none">.</button>
                  <button onClick={() => handleCalcKeyPress('EXP')} className="bg-[#262626] border border-[#262626] rounded-[3px] text-white font-bold text-[10px] h-8 flex items-center justify-center cursor-pointer hover:bg-slate-700 active:bg-slate-500 transition-all outline-none">EXP</button>
                  <button onClick={() => handleCalcKeyPress('/')} className="bg-[#cccccc] border border-[#262626] rounded-[3px] text-[#262626] font-bold text-sm h-8 flex items-center justify-center cursor-pointer hover:bg-[#b8b8b8] active:bg-[#111111] active:text-white transition-all outline-none">÷</button>
                  <button onClick={() => handleCalcKeyPress('MR')} className="bg-[#cccccc] border border-[#262626] rounded-[3px] text-[#262626] font-bold text-xs h-8 flex items-center justify-center cursor-pointer hover:bg-[#b8b8b8] active:bg-[#111111] active:text-white transition-all outline-none">MR</button>

                  {/* Row 10 */}
                  <button onClick={() => handleCalcKeyPress('+/-')} className="bg-[#cccccc] border border-[#262626] rounded-[3px] text-[#262626] font-bold text-xs h-8 flex items-center justify-center cursor-pointer hover:bg-[#b8b8b8] active:bg-[#111111] active:text-white transition-all outline-none">±</button>
                  <button onClick={() => handleCalcKeyPress('RND')} className="bg-[#cccccc] border border-[#262626] rounded-[3px] text-[#262626] font-bold text-[9px] h-8 flex items-center justify-center cursor-pointer hover:bg-[#b8b8b8] active:bg-[#111111] active:text-white transition-all outline-none">RND</button>
                  <button onClick={() => handleCalcKeyPress('C')} className="bg-[#DCADB0] border border-[#262626] rounded-[3px] text-[#FF0000] font-bold text-sm h-8 flex items-center justify-center cursor-pointer hover:bg-[#d0999c] active:bg-[#ff0000] active:text-white transition-all outline-none">C</button>
                  <button onClick={() => handleCalcKeyPress('=')} className="bg-[#DCADB0] border border-[#262626] rounded-[3px] text-[#FF0000] font-bold text-[16px] h-8 flex items-center justify-center cursor-pointer hover:bg-[#d0999c] active:bg-[#ff0000] active:text-white transition-all outline-none font-black">=</button>
                  <button onClick={() => handleCalcKeyPress('MC')} className="bg-[#cccccc] border border-[#262626] rounded-[3px] text-[#262626] font-bold text-xs h-8 flex items-center justify-center cursor-pointer hover:bg-[#b8b8b8] active:bg-[#111111] active:text-white transition-all outline-none">MC</button>
                </div>
              </div>
            </div>
          )}

          {/* Core Layout Split */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Left Main Question Content Panel */}
            <div className="flex-1 flex flex-col bg-white border-r relative select-text overflow-hidden">
              {/* Question Index sub-toolbar */}
              <div className="bg-slate-50 px-6 py-2.5 border-b flex justify-between items-center shrink-0">
                <h2 className="text-xs sm:text-xs font-black text-slate-700 uppercase tracking-wider">
                  Question Block - {activeQuestion + 1}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-100 border border-indigo-200 text-indigo-800 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wide">
                    {currentQ?.subject || 'general'} section
                  </span>
                </div>
              </div>

              {/* Main scrollable body for Question + Form options */}
              <div className="flex-1 p-6 sm:p-10 overflow-y-auto select-none">
                {/* Dynamically zoomed question content */}
                <div 
                  style={{ fontSize: `${1 * (nestTextZoom / 100)}rem` }} 
                  className="font-bold text-slate-900 leading-relaxed mb-4 select-text whitespace-pre-wrap animate-fade-in"
                >
                  <MathOrImageRenderer text={currentQ?.question || ''} />
                </div>

                {/* Dynamically Rendered SVG Diagrams/Figures */}
                {currentQ?.diagramSvg && (
                  <div className="my-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center select-none max-w-2xl">
                    {currentQ?.diagramTitle && (
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 font-orbitron">{currentQ.diagramTitle}</div>
                    )}
                    <div 
                      className="p-4 bg-white rounded-xl shadow-xs border border-slate-100 flex items-center justify-center max-w-full overflow-auto text-slate-800"
                      dangerouslySetInnerHTML={{ __html: currentQ.diagramSvg }} 
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3.5 max-w-2xl select-text">
                  {currentQ?.options.map((opt: string, i: number) => {
                    const isSelected = cuetAnswers[activeQuestion] === i.toString();
                    return (
                      <div 
                        key={i} 
                        onClick={() => setCuetAnswers({...cuetAnswers, [activeQuestion]: i.toString()})}
                        className={`flex items-center gap-4 group p-4 bg-white hover:bg-slate-50 border-2 rounded-xl transition-all cursor-pointer ${isSelected ? 'border-blue-605 bg-blue-50/10 shadow-xs' : 'border-slate-100'}`}
                      >
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCuetAnswers({...cuetAnswers, [activeQuestion]: i.toString()});
                          }}
                          className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-black text-xs shrink-0 transition-colors ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-xs' : 'border-slate-350 text-slate-500 group-hover:border-slate-400'}`}
                        >
                          {String.fromCharCode(65 + i)}
                        </button>
                        <span style={{ fontSize: `${0.875 * (nestTextZoom / 100)}rem` }} className={`font-bold transition-colors ${isSelected ? 'text-black font-extrabold' : 'text-neutral-950'}`}>
                          <MathOrImageRenderer text={opt} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Collapsing arrow inside left panel right border */}
              <button 
                onClick={() => setIsRightDrawerOpen((prev: boolean) => !prev)}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-16 bg-[#2f71b9] hover:bg-blue-700 text-white rounded-l-md border-y border-l border-blue-400 flex items-center justify-center cursor-pointer shadow-lg outline-none transition-all group z-30"
                title={isRightDrawerOpen ? "Collapse Right Palette Dashboard" : "Expand Right Palette Dashboard"}
              >
                <span className="text-[10px] font-black text-center flex items-center justify-center select-none text-white transition-transform group-hover:scale-110">
                  {isRightDrawerOpen ? '❯' : '❮'}
                </span>
              </button>

              {/* Compliance Bottom Action bar */}
              <div id="nest-action-bar" className="bg-[#f4f7f9] border-t p-4 flex flex-wrap gap-2 items-center justify-between shrink-0">
                <div className="flex flex-wrap gap-2">
                  <button 
                    id="mark-review-next"
                    onClick={() => handleAction('save-mark')} 
                    className="bg-[#f0ad4e] hover:bg-[#ec971f] text-white px-5 py-2.5 rounded border border-[#eea236] font-bold text-[11px] uppercase shadow-xs active:scale-98 transition-all"
                  >
                    Mark for Review & Next
                  </button>
                  <button 
                    id="clear-response"
                    onClick={() => handleAction('clear')} 
                    className="bg-white hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded border border-slate-300 font-bold text-[11px] uppercase shadow-xs active:scale-98 transition-all"
                  >
                    Clear Response
                  </button>
                </div>
                <button 
                  id="save-next"
                  onClick={() => handleAction('save')} 
                  className="bg-[#2a75d3] hover:bg-blue-700 text-white px-8 py-2.5 rounded border border-blue-600 font-black text-[11px] uppercase shadow-sm active:scale-98 transition-all"
                >
                  Save & Next
                </button>
              </div>

              {/* Bottom Submit bar */}
              <div id="nest-footer-bar" className="bg-[#121921] border-t border-slate-950 p-4 flex justify-between items-center text-white px-6 shrink-0 z-40">
                <div className="flex gap-2">
                  <button 
                    id="prev-btn"
                    onClick={() => setActiveQuestion((prev: number) => Math.max(0, prev - 1))} 
                    className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded font-black text-[10px] uppercase transition-all select-none"
                  >
                    &lt;&lt; BACK
                  </button>
                  <button 
                    id="next-btn"
                    onClick={() => setActiveQuestion((prev: number) => Math.min(cuetQuestions.length - 1, prev + 1))} 
                    className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded font-black text-[10px] uppercase transition-all select-none"
                  >
                    NEXT &gt;&gt;
                  </button>
                </div>
                {/* Submit button inside panel bottom bar */}
                <button 
                  id="submit-paper"
                  onClick={() => window.confirm('Are you sure you want to finalize and submit your Nest Exam?') && handleFinishExam()} 
                  className="bg-[#2f71b9] hover:bg-blue-600 text-white border border-blue-500 px-9 py-2.5 rounded font-black text-[11px] uppercase shadow-md transition-all active:scale-98 shrink-0 tracking-wider font-extrabold"
                >
                  SUBMIT Paper
                </button>
              </div>
            </div>

            {/* Right Collapsible menu sidebar */}
            {isRightDrawerOpen && (
              <div id="nest-palette-drawer" className="relative w-full max-w-[300px] bg-[#1e2833] border-l border-slate-950 text-white flex flex-col transition-all z-20 shrink-0">
                {/* Two main dual navigation tabs header */}
                <div className="flex bg-[#121921] border-b border-slate-950 text-xs shrink-0 select-none">
                  {/* Tab 1: Profile Tab */}
                  <button
                    id="tab-profile"
                    onClick={() => setDrawerActiveTab('profile')}
                    className={`flex-1 py-3 text-center font-black uppercase tracking-wider transition-colors border-r border-slate-950 ${drawerActiveTab === 'profile' ? 'bg-[#1e2833] text-orange-400 border-b-2 border-orange-500' : 'text-slate-400 hover:bg-[#1b2530] hover:text-white'}`}
                  >
                    Profile
                  </button>
                  {/* Tab 2: MORE Tab */}
                  <button
                    id="tab-more"
                    onClick={() => setDrawerActiveTab('more')}
                    className={`flex-1 py-3 text-center font-black uppercase tracking-wider transition-colors ${drawerActiveTab === 'more' ? 'bg-[#1e2833] text-orange-400 border-b-2 border-orange-500' : 'text-slate-400 hover:bg-[#1b2530] hover:text-white'}`}
                  >
                    More
                  </button>
                </div>

                {/* Tab content area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                  {drawerActiveTab === 'profile' ? (
                    <div className="space-y-4">
                      {/* Sub Profile photo display containing injected User Information layout */}
                      <div className="bg-[#121921] p-4 rounded-lg border border-slate-900 flex flex-col items-center text-center space-y-3 shadow-inner">
                        <div className="w-20 h-20 bg-slate-950 rounded border-2 border-slate-800 overflow-hidden shadow-sm flex items-center justify-center shrink-0">
                          {nestCandidatePhoto ? (
                            <img src={nestCandidatePhoto} className="w-full h-full object-cover" alt="Avatar" referrerPolicy="no-referrer" />
                          ) : (
                            <User className="w-10 h-10 text-slate-500" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block">Candidate Name</p>
                          <h4 id="perf-candidate-name" className="text-xs font-black text-orange-400 uppercase tracking-tight truncate max-w-[180px]">{nestCandidateName}</h4>
                        </div>
                        <div className="w-full h-[0.5px] bg-slate-800 my-0.5" />
                        <div className="space-y-0.5">
                          <p className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block">Login ID</p>
                          <p className="font-mono text-xs text-white font-extrabold pb-1">{nestUserId || '11111'}</p>
                        </div>
                      </div>

                      {/* Display Question metrics counters summary */}
                      <div className="bg-[#121921] p-3 rounded-lg border border-slate-900 space-y-2">
                        <span className="text-[8px] uppercase tracking-wider text-slate-450 font-black block border-b border-slate-800 pb-1 mb-1">Status Summary</span>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-1.5 text-[9px] font-bold">
                          <div className="flex items-center gap-1.5 leading-none">
                            <span className="w-4 h-4 rounded bg-[#5cb85c] text-white flex items-center justify-center font-black text-[9px] shrink-0">A</span>
                            <span className="text-slate-300 uppercase block truncate">Ans: {counts['answered']}</span>
                          </div>
                          <div className="flex items-center gap-1.5 leading-none">
                            <span className="w-4 h-4 rounded bg-[#d9534f] text-white flex items-center justify-center font-black text-[9px] shrink-0">NA</span>
                            <span className="text-slate-300 uppercase block truncate">Unans: {counts['not-answered']}</span>
                          </div>
                          <div className="flex items-center gap-1.5 leading-none">
                            <span className="w-4 h-4 bg-white text-slate-900 border flex items-center justify-center font-black text-[9px] shrink-0">NV</span>
                            <span className="text-slate-300 uppercase block truncate">Novis: {counts['not-visited']}</span>
                          </div>
                          <div className="flex items-center gap-1.5 leading-none">
                            <span className="w-4 h-4 rounded-full bg-[#7a43b6] text-white flex items-center justify-center font-black text-[9px] shrink-0">MR</span>
                            <span className="text-slate-300 uppercase block truncate">Marked: {counts['marked']}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold block border-b border-slate-800 pb-1 mb-2">Exam Asset Menus</span>
                      
                      <button 
                        id="view-inst-trigger"
                        onClick={() => setMoreTabSubModal('instructions')}
                        className="w-full bg-[#121921] hover:bg-slate-800 text-slate-200 hover:text-orange-400 transition-colors border border-slate-900 p-2.5 rounded text-[10px] font-black text-left flex items-center justify-between outline-none"
                      >
                        <span>📄 General Instructions</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </button>

                      <button 
                        id="view-scientific-trigger"
                        onClick={() => setMoreTabSubModal('useful-data')}
                        className="w-full bg-[#121921] hover:bg-slate-800 text-slate-200 hover:text-orange-400 transition-colors border border-slate-900 p-2.5 rounded text-[10px] font-black text-left flex items-center justify-between outline-none"
                      >
                        <span>🧪 Constants Useful Data</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </button>

                      <button 
                        id="view-group-trigger"
                        onClick={() => setMoreTabSubModal('group')}
                        className="w-full bg-[#121921] hover:bg-slate-800 text-slate-200 hover:text-orange-400 transition-colors border border-slate-900 p-2.5 rounded text-[10px] font-black text-left flex items-center justify-between outline-none"
                      >
                        <span>📁 Group Instructions</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </button>

                      <button 
                        id="view-question-trigger"
                        onClick={() => setMoreTabSubModal('question')}
                        className="w-full bg-[#121921] hover:bg-slate-800 text-slate-200 hover:text-orange-400 transition-colors border border-slate-900 p-2.5 rounded text-[10px] font-black text-left flex items-center justify-between outline-none"
                      >
                        <span>❓ Question Instructions</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    </div>
                  )}

                  {/* High Fidelity Question Palette Grid */}
                  <div className="border-t border-slate-800 pt-4 space-y-2">
                    <span className="text-[10px] font-black uppercase text-orange-400 tracking-wider block">Question Palette</span>
                    
                    <div className="bg-[#121921] border border-slate-900 p-3 rounded shadow-inner">
                      <div className="grid grid-cols-4 gap-2">
                        {filteredQuestions.map((q: any) => {
                          const i = q.originalIndex;
                          const status = cuetStatusMap[i] || 'not-visited';
                          const shapes: any = {
                            'not-visited': 'bg-white border text-slate-900 rounded',
                            'not-answered': 'bg-[#d9534f] text-white rounded-t-3xl rounded-b-lg border-b-2 border-red-700',
                            'answered': 'bg-[#5cb85c] text-white rounded-b-3xl rounded-t-lg border-t-2 border-green-800',
                            'marked': 'bg-[#7a43b6] text-white rounded-full border border-indigo-200',
                            'answered-marked': 'bg-[#7a43b6] text-white rounded-full relative after:content-[""] after:absolute after:bottom-0 after:right-0 after:w-2 after:h-2 after:bg-[#5cb85c] after:rounded-full after:border after:border-white'
                          };
                          return (
                            <button 
                              key={i} 
                              onClick={() => setActiveQuestion(i)} 
                              className={`h-9 w-9 flex items-center justify-center font-black text-[11px] transition-all hover:brightness-110 shrink-0 ${shapes[status]} ${activeQuestion === i ? 'ring-2 ring-orange-500 ring-offset-1 select-none ring-offset-[#121921]' : ''}`}
                            >
                              {i + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* More Tab SubModals structures */}
          {moreTabSubModal && (
            <div id="submodal-backdrop" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[1000] p-4 select-none">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-xl overflow-hidden flex flex-col border border-slate-200 max-h-[80vh]">
                {/* Modal Header */}
                <div className="bg-[#2f71b9] text-white px-5 py-3 flex items-center justify-between shrink-0">
                  <span className="text-[11px] font-black uppercase tracking-wider">
                    {moreTabSubModal === 'instructions' && '📄 General Exam Guidelines'}
                    {moreTabSubModal === 'useful-data' && '🧪 Fundamental Constants'}
                    {moreTabSubModal === 'group' && '📁 Group Specific Instructions'}
                    {moreTabSubModal === 'question' && '❓ Question Guidelines'}
                  </span>
                  <button onClick={() => setMoreTabSubModal(null)} className="text-white hover:text-slate-200 outline-none">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Sub Modals Body Content */}
                <div id="submodal-body" className="p-5 overflow-y-auto text-xs leading-relaxed font-bold text-slate-700">
                  {moreTabSubModal === 'instructions' && (
                    <div className="space-y-3.5">
                      <p className="font-extrabold text-slate-900 border-b pb-1">TCS iON Examination Guidelines:</p>
                      <ol className="list-decimal pl-4.5 space-y-2 text-slate-650">
                        <li>The clock will be set at the server. The countdown timer in the top right will display the remaining time. When the timer reaches zero, the examination will end by itself automatically.</li>
                        <li>
                          <p>Question states color-coded symbol palette glossary checklist:</p>
                          <div className="grid grid-cols-1 gap-2 mt-2.5 pl-1">
                            <div className="flex items-center gap-3">
                              <span className="w-5 h-5 bg-white border border-slate-350 text-[10px] flex items-center justify-center font-black rounded shrink-0 text-slate-900">1</span>
                              <span>Not Visited yet.</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="w-5 h-5 bg-[#d9534f] text-white text-[10px] flex items-center justify-center font-black rounded-t-3xl rounded-b-lg border-b-2 border-red-700 shrink-0">2</span>
                              <span>Not Answered.</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="w-5 h-5 bg-[#5cb85c] text-white text-[10px] flex items-center justify-center font-black rounded-b-3xl rounded-t-lg border-t-2 border-green-800 shrink-0">3</span>
                              <span>Answered Question.</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="w-5 h-5 bg-[#7a43b6] text-white text-[10px] flex items-center justify-center font-black rounded-full shrink-0">4</span>
                              <span>Marked for Review but unanswered.</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="w-5 h-5 bg-[#7a43b6] text-white text-[10px] flex items-center justify-center font-black rounded-full relative after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-2 after:h-2 after:bg-[#5cb85c] after:rounded-full after:border after:border-white shrink-0">5</span>
                              <span>Answered & Marked for Review (Evaluated).</span>
                            </div>
                          </div>
                        </li>
                      </ol>
                    </div>
                  )}

                  {moreTabSubModal === 'useful-data' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-slate-50 border p-2.5 rounded mb-2">
                        <span className="font-extrabold uppercase text-[9px] text-slate-500">Language preference:</span>
                        <select className="bg-white border text-xs px-2 py-0.5 rounded font-black outline-none border-slate-350">
                          <option>English</option>
                          <option>Hindi</option>
                        </select>
                      </div>
                      
                      <div className="border border-slate-200 rounded overflow-hidden">
                        <table className="w-full text-left border-collapse text-[10px] font-bold">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-205 font-black text-slate-800">
                              <th className="p-2 border-r">Physical Constant</th>
                              <th className="p-2 border-r">Symbol</th>
                              <th className="p-2">Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y text-slate-650 font-medium">
                            <tr>
                              <td className="p-2 border-r capitalization bg-slate-50/20 font-bold text-slate-800">Planck's Constant</td>
                              <td className="p-2 border-r font-mono font-bold">h</td>
                              <td className="p-2 font-mono text-slate-900 font-extrabold">6.626 x 10⁻³⁴ J·s</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-r capitalization bg-slate-50/20 font-bold text-slate-800">Speed of light in vacuum</td>
                              <td className="p-2 border-r font-mono font-bold">c</td>
                              <td className="p-2 font-mono text-slate-900 font-extrabold">3.00 x 10⁸ m/s</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-r capitalization bg-slate-50/20 font-bold text-slate-800">Gas constant</td>
                              <td className="p-2 border-r font-mono font-bold">R</td>
                              <td className="p-2 font-mono text-slate-900 font-extrabold">8.314 J/(mol·K)</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-r capitalization bg-slate-50/20 font-bold text-slate-800">Avogadro constant</td>
                              <td className="p-2 border-r font-mono font-bold">N_A</td>
                              <td className="p-2 font-mono text-slate-900 font-extrabold">6.022 x 10²³ mol⁻¹</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {(moreTabSubModal === 'group' || moreTabSubModal === 'question') && (
                    <div className="space-y-4">
                      {/* Warning Banner at top representing running timer banner alert */}
                      <div className="bg-amber-50 border border-amber-250 p-3 rounded-lg flex items-start gap-2 h-auto shadow-inner">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
                        <div>
                          <p className="text-[10px] font-black text-amber-900 uppercase">Attention Exam Taker:</p>
                          <p className="text-[10px] font-bold text-amber-850 mt-0.5">
                            Note that the timer is ticking. Kindly close this window to attend to the questions.
                          </p>
                        </div>
                      </div>

                      <div className="py-8 border border-dashed rounded bg-slate-50 text-center text-slate-500 font-extrabold">
                        The instructions are not available in the selected language.
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="bg-slate-50 px-4 py-2.5 border-t flex justify-end shrink-0">
                  <button 
                    onClick={() => setMoreTabSubModal(null)} 
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-black uppercase text-[10px] px-3.5 py-1.5 rounded"
                  >
                    Close Dialog
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-[#f4f7f9] text-slate-800 z-[90] flex flex-col font-sans">
        {/* Past Test Sessions Modal */}
        <AnimatePresence>
          {isPastModalOpen && (
            <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 font-sans">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
              >
                {/* Modal Header */}
                <div className="bg-slate-900 text-white p-6 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Search className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black tracking-tight uppercase">Saved Test History & Results</h3>
                      <p className="text-xs text-slate-400 font-medium">Browse or search all tests stored in database & browser cache</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsPastModalOpen(false)} 
                    className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Manual Search & Direct Session ID Input */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="Search by candidate name or exam type..."
                      value={searchPastQuery}
                      onChange={(e) => setSearchPastQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Enter Session ID (e.g. k8x2m9a1)"
                      value={manualSessionInput}
                      onChange={(e) => setManualSessionInput(e.target.value)}
                      className="px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
                    />
                    <button 
                      onClick={handleManualSearchSubmit}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-4 py-2.5 rounded-xl uppercase tracking-wider shrink-0 cursor-pointer"
                    >
                      Load Test
                    </button>
                  </div>
                </div>

                {/* Modal Body - Session List */}
                <div className="p-6 overflow-y-auto flex-1 space-y-3">
                  {isLoadingPastSessions ? (
                    <div className="py-16 text-center space-y-3">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                      <p className="text-xs font-bold text-slate-500">Searching database & local storage for saved tests...</p>
                    </div>
                  ) : pastSessionsList.filter(item => {
                      const q = searchPastQuery.toLowerCase().trim();
                      if (!q) return true;
                      const name = (item.candidateName || '').toLowerCase();
                      const sid = (item.sessionId || '').toLowerCase();
                      const type = (item.examType || '').toLowerCase();
                      return name.includes(q) || sid.includes(q) || type.includes(q);
                    }).length === 0 ? (
                    <div className="py-12 text-center space-y-2 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                      <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                      <p className="text-sm font-extrabold text-slate-700">No matching test sessions found</p>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        If you have a direct Session ID or URL from a previous test, paste it in the box above to open it directly!
                      </p>
                    </div>
                  ) : (
                    pastSessionsList.filter(item => {
                      const q = searchPastQuery.toLowerCase().trim();
                      if (!q) return true;
                      const name = (item.candidateName || '').toLowerCase();
                      const sid = (item.sessionId || '').toLowerCase();
                      const type = (item.examType || '').toLowerCase();
                      return name.includes(q) || sid.includes(q) || type.includes(q);
                    }).map((item, idx) => {
                      const isSubmitted = item.cuetStatus === 'finished' || item.cuetStatus === 'submitted' || !!item.cuetResult;
                      const dateStr = item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'Recent';
                      const exTypeUpper = (item.examType || 'NEET').toUpperCase();

                      return (
                        <div 
                          key={item.sessionId || idx}
                          className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-blue-400 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-slate-900 text-white text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                                {exTypeUpper}
                              </span>
                              <span className="text-xs font-black text-slate-800">
                                {item.candidateName || 'PALLAVI'}
                              </span>
                              <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                ID: {item.sessionId}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium pt-1">
                              <span>🕒 {dateStr}</span>
                              <span>•</span>
                              <span>{item.cuetQuestions?.length || 0} Questions</span>
                              {isSubmitted && item.cuetResult?.score !== undefined && (
                                <>
                                  <span>•</span>
                                  <span className="font-extrabold text-emerald-600">
                                    Score: {item.cuetResult.score} / {item.cuetResult.total || (item.cuetQuestions?.length * 4)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                            <button
                              onClick={() => restoreSelectedSession(item)}
                              className={`${
                                isSubmitted 
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              } px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5 w-full sm:w-auto cursor-pointer`}
                            >
                              {isSubmitted ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>View Scorecard</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-4 h-4" />
                                  <span>Resume Test</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Modal Footer */}
                <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center text-xs font-medium text-slate-500">
                  <span>Found {pastSessionsList.length} test record(s)</span>
                  <button 
                    onClick={() => setIsPastModalOpen(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl uppercase text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Floating Toast Notification for Link Copy & Session Restore */}
        <AnimatePresence>
          {(copiedToast || restoredToast) && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] max-w-lg w-full px-4"
            >
              <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border-2 border-emerald-500 flex items-center justify-between gap-3 font-sans">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                      {copiedToast ? 'Exam Resume Link Saved & Copied!' : 'Exam Status'}
                    </h4>
                    <p className="text-[11px] font-bold text-slate-200 leading-snug mt-0.5">
                      {copiedToast 
                        ? `URL: ${window.location.origin}/${examType}/${sessionId} (Auto-saved to clipboard! Open anytime on any device to resume)`
                        : restoredToast}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => { setCopiedToast(false); setRestoredToast(null); }}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* NTA Master Header */}
        <div className="bg-white border-b flex flex-col sm:flex-row justify-between items-center px-6 py-3 shadow-md z-[100]">
          <div className="flex items-center gap-4">
            <img src="https://nta.ac.in/img/logo.png" className="h-10 sm:h-12" alt="NTA" />
            <div className="h-10 w-[2px] bg-slate-200 mx-2 hidden sm:block" />
            <div className="hidden xs:block">
              <h1 className="text-sm sm:text-lg font-black text-slate-900 tracking-tighter uppercase leading-none">NATIONAL TESTING AGENCY</h1>
              <p className="text-[8px] sm:text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Excellence in Assessment</p>
            </div>
          </div>
          <div className="flex gap-4 sm:gap-8 items-center bg-slate-50 px-4 sm:px-6 py-2 rounded-2xl border border-slate-200 mt-2 sm:mt-0">
            <div className="hidden lg:block text-center border-r pr-6">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Candidate Name</p>
                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{currentUser?.name || "PALLAVI"}</p>
            </div>
            <div className="text-center border-r pr-4 sm:pr-6">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Subject Name</p>
                <p className="text-xs font-black text-blue-600 uppercase tracking-tight">
                  {examType === 'neet' ? 'NEET UG 2026' : examType === 'jipmat' ? 'JIPMAT 2026' : examType === 'nest' ? 'NEST Exam 2026' : 'CUET 2026'}
                </p>
            </div>
            <div className="text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Time Left</p>
                <p className="text-base sm:text-lg font-mono font-black text-red-600 tabular-nums leading-none">{formatTime(cuetTimeLeft)}</p>
            </div>
          </div>
        </div>

        {/* Section Bar / Subject Switching */}
        <div className="bg-[#ff9d00] px-6 py-1 flex items-center justify-between shadow-inner">
            <div className="flex gap-1">
                {subjects.map(sub => (
                    <button 
                        key={sub}
                        onClick={() => {
                            setActiveNeetSubject(sub);
                            const firstInSub = cuetQuestions.findIndex((q: any) => q.subject === sub);
                            if (firstInSub !== -1) setActiveQuestion(firstInSub);
                        }}
                        className={`${activeNeetSubject === sub || examType === 'cuet' ? 'bg-blue-600 text-white' : 'bg-white/20 text-white/80 hover:bg-white/30'} px-6 py-2.5 rounded-t-lg font-black text-xs uppercase shadow-lg transition-all`}
                    >
                        {sub}
                    </button>
                ))}
            </div>
            <div className="hidden md:flex items-center gap-3 text-white">
                <button
                  onClick={loadPastSessions}
                  className="bg-slate-900/80 hover:bg-slate-900 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                  title="Search & view past test records"
                >
                  <Search className="w-3.5 h-3.5 text-emerald-400" />
                  <span>All Past Tests</span>
                </button>
                <button
                  onClick={copyResumeLinkToClipboard}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                  title="Copy test resume link to clipboard"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Copy Resume Link</span>
                </button>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase"><Monitor className="w-4 h-4"/> NTA PRACTICE PORTAL V2.6</div>
            </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Question Panel */}
          <div className="flex-1 flex flex-col bg-white border-r relative">
            <div className="bg-slate-50 px-8 py-3 border-b flex justify-between items-center">
                <h2 className="text-sm font-black text-slate-700 uppercase">Question No. {activeQuestion + 1}</h2>
                <div className="p-1.5 bg-blue-100 rounded-full"><Info className="w-4 h-4 text-blue-600"/></div>
            </div>
            
            <div className="flex-1 p-6 sm:p-10 overflow-y-auto">
              <div className="text-lg font-bold text-slate-800 leading-relaxed mb-6 select-none whitespace-pre-wrap">
                <MathOrImageRenderer text={currentQ?.question || ''} />
              </div>
              
              {/* Dynamically Rendered SVG Diagrams/Figures */}
              {currentQ?.diagramSvg && (
                <div className="my-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center select-none max-w-2xl">
                  {currentQ?.diagramTitle && (
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 font-orbitron">{currentQ.diagramTitle}</div>
                  )}
                  <div 
                    className="p-4 bg-white rounded-xl shadow-xs border border-slate-100 flex items-center justify-center max-w-full overflow-auto text-slate-800"
                    dangerouslySetInnerHTML={{ __html: currentQ.diagramSvg }} 
                  />
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-4 max-w-2xl">
                {currentQ?.options.map((opt: string, i: number) => {
                  const isSelected = cuetAnswers[activeQuestion] === i.toString();
                  const isNeet = examType === 'neet';
                  
                  return (
                    <div 
                      key={i} 
                      onClick={() => {
                        setCuetAnswers({...cuetAnswers, [activeQuestion]: i.toString()});
                        setCuetStatusMap((prev: any) => ({...prev, [activeQuestion]: 'answered'}));
                        if (isNeet) {
                          setNeetOmrFilled({...neetOmrFilled, [activeQuestion]: true});
                        }
                      }}
                      className="flex items-center gap-4 transition-all cursor-pointer group"
                    >
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setCuetAnswers({...cuetAnswers, [activeQuestion]: i.toString()});
                          setCuetStatusMap((prev: any) => ({...prev, [activeQuestion]: 'answered'}));
                          if (isNeet) {
                            setNeetOmrFilled({...neetOmrFilled, [activeQuestion]: true});
                          }
                        }}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-black text-xs shrink-0 transition-colors ${isSelected ? (isNeet ? 'bg-red-600 border-red-600 text-white' : 'bg-blue-600 border-blue-600 text-white') : 'border-slate-300 text-slate-500 hover:border-slate-400'}`}
                      >
                        {String.fromCharCode(65 + i)}
                      </button>
                      
                      <div className={`flex-1 p-4 rounded-xl border-2 transition-all ${isSelected ? (isNeet ? 'border-red-600 bg-red-50/30 shadow-xs' : 'border-slate-800 bg-slate-50 shadow-xs') : 'border-slate-100 group-hover:border-slate-200'}`}>
                        <span className={`text-sm font-bold ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                          <MathOrImageRenderer text={opt} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {omrError && (
                 <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 font-bold text-xs uppercase">{omrError}</span>
                 </div>
              )}
            </div>

            {/* NTA Action Bar */}
            <div className="bg-[#f0f4f7] border-t p-4 flex flex-wrap gap-2 items-center justify-between">
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleAction('save-mark')} className="bg-[#f0ad4e] hover:bg-[#ec971f] text-white px-4 py-2 rounded border border-[#eea236] font-bold text-[11px] uppercase shadow-sm">Mark for Review & Next</button>
                    <button onClick={() => handleAction('clear')} className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded border border-slate-300 font-bold text-[11px] uppercase shadow-sm">Clear Response</button>
                </div>
                <button onClick={() => handleAction('save')} className="bg-[#337ab7] hover:bg-[#286090] text-white px-8 py-2 rounded border border-[#2e6da4] font-bold text-[11px] uppercase shadow-sm">Save & Next</button>
            </div>

            <div className="bg-slate-800 border-t p-3 flex justify-between items-center text-white px-6">
                <div className="flex gap-2">
                    <button onClick={() => setActiveQuestion(prev => Math.max(0, prev - 1))} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded font-black text-[10px] uppercase transition-all">&lt;&lt; BACK</button>
                    <button onClick={() => setActiveQuestion(prev => Math.min(cuetQuestions.length - 1, prev + 1))} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded font-black text-[10px] uppercase transition-all">NEXT &gt;&gt;</button>
                </div>
                <button onClick={() => window.confirm('Are you sure you want to submit your paper?') && handleFinishExam()} className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded font-black text-[11px] uppercase shadow-lg transition-all">SUBMIT</button>
            </div>
          </div>

          {/* Right Palette Panel */}
          <div className="w-full sm:w-[320px] bg-white flex flex-col p-4 overflow-y-auto">
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4 p-3 border rounded-xl bg-slate-50">
                    <div className="w-10 h-10 bg-slate-200 rounded flex items-center justify-center p-1 border overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name || "PALLAVI"}`} alt="Profile" />
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">Candidate Name:</p>
                        <p className="text-[10px] font-black text-slate-800">{currentUser?.name || "PALLAVI"}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-2 p-3 bg-slate-50 border rounded-xl">
                    <StatusBadge type="answered" count={counts['answered']} label="Answered" />
                    <StatusBadge type="not-answered" count={counts['not-answered']} label="Not Answered" />
                    <StatusBadge type="not-visited" count={counts['not-visited']} label="Not Visited" />
                    <StatusBadge type="marked" count={counts['marked']} label="Marked Review" />
                    <div className="col-span-2">
                        <StatusBadge type="answered-marked" count={counts['answered-marked']} label="Ans & Marked Review" />
                    </div>
                </div>

                <div className="bg-blue-600 px-4 py-2 rounded-t text-white font-black text-[10px] uppercase text-center shadow-md">{activeNeetSubject || 'GENERAL TEST'}</div>
                <div className="bg-slate-50 border p-3 rounded-b shadow-inner">
                    <div className="grid grid-cols-5 gap-2">
                        {filteredQuestions.map((q: any) => {
                            const i = q.originalIndex;
                            const status = cuetStatusMap[i] || 'not-visited';
                            const shapes: any = {
                                'not-visited': 'bg-white border text-slate-900 rounded',
                                'not-answered': 'bg-red-500 text-white rounded-t-3xl rounded-b-lg border-b-2 border-red-700',
                                'answered': 'bg-green-600 text-white rounded-b-3xl rounded-t-lg border-t-2 border-green-800',
                                'marked': 'bg-indigo-600 text-white rounded-full border border-indigo-200',
                                'answered-marked': 'bg-indigo-600 text-white rounded-full relative after:content-[""] after:absolute after:bottom-0 after:right-0 after:w-3 after:h-3 after:bg-green-500 after:rounded-full after:border-2 after:border-white'
                            };
                            return (
                                <button 
                                    key={i} 
                                    onClick={() => setActiveQuestion(i)} 
                                    className={`h-9 w-9 flex items-center justify-center font-bold text-[10px] transition-all hover:brightness-110 ${shapes[status]} ${activeQuestion === i ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                                >
                                    {i + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-100 rounded text-[9px] font-bold text-blue-700 leading-tight">
                    NOTE: QUESTIONS MARKED FOR REVIEW WILL BE CONSIDERED FOR EVALUATION IF ANSWERED.
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cuetStatus === 'finished') {
    return (
        <div className="max-w-2xl mx-auto py-20 px-4">
            <div className="text-center space-y-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-lg border-4 border-white">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                </motion.div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Evaluation Report Generated</h2>
                
                <div className="bg-white shadow-2xl p-10 rounded-[40px] border border-slate-100 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Final Corrected Score</p>
                    <span className="text-7xl font-black text-slate-900 tracking-tighter">{cuetResult?.score}</span>
                    <p className="text-slate-400 font-bold uppercase text-[10px] mt-2 tracking-widest">Out of {cuetResult?.total}</p>

                    <div className="grid grid-cols-3 gap-6 mt-12">
                        <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
                             <p className="text-[10px] text-green-600 uppercase font-black mb-1">Correct</p>
                             <p className="text-2xl font-black text-green-700">{cuetResult?.correct}</p>
                        </div>
                        <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
                             <p className="text-[10px] text-red-600 uppercase font-black mb-1">Incorrect</p>
                             <p className="text-2xl font-black text-red-700">{cuetResult?.incorrect}</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                             <p className="text-[10px] text-slate-600 uppercase font-black mb-1">Left</p>
                             <p className="text-2xl font-black text-slate-700">{cuetResult?.unattempted}</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button onClick={downloadDetailedPDF} className="flex-1 bg-white border-2 border-slate-200 text-slate-700 font-black py-4 rounded-2xl uppercase shadow-md hover:bg-slate-50 transition-all flex items-center justify-center gap-2"><Download className="w-5 h-5"/> Download A-Z Report</button>
                    <button onClick={() => setCuetStatus('upload')} className="flex-1 bg-slate-900 text-white font-black py-4 rounded-2xl uppercase shadow-xl hover:bg-black transition-all">New Practice Session</button>
                </div>

                <div className="mt-12 space-y-6 text-left">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter border-b-2 border-slate-100 pb-2">Detailed Answer Key Analysis</h3>
                  {cuetResult?.details?.map((item: any, idx: number) => (
                    <div key={idx} className={`p-6 rounded-3xl border ${item.isCorrect ? 'bg-green-50 border-green-100' : item.selectedIdx === -1 ? 'bg-slate-50 border-slate-100' : 'bg-red-50 border-red-100'} transition-all`}>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Question {idx + 1}</p>
                      <h4 className="text-sm font-bold text-slate-800 leading-relaxed mb-4">
                        <MathOrImageRenderer text={item.question} />
                      </h4>
                      
                      {/* Dynamically Rendered SVG Diagrams/Figures inside Review */}
                      {item.diagramSvg && (
                        <div className="my-4 p-3 bg-white/60 rounded-2xl border border-slate-200/50 flex flex-col items-center select-none max-w-xl">
                          {item.diagramTitle && (
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 font-orbitron">{item.diagramTitle}</div>
                          )}
                          <div 
                            className="p-3 bg-white rounded-xl shadow-xs border border-slate-100 flex items-center justify-center max-w-full overflow-auto text-slate-800"
                            dangerouslySetInnerHTML={{ __html: item.diagramSvg }} 
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-2">
                        {item.options.map((opt: string, optIdx: number) => {
                          const isCorrectOpt = optIdx === item.correct;
                          const isSelectedOpt = optIdx === item.selectedIdx;
                          return (
                            <div key={optIdx} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-between ${isCorrectOpt ? 'bg-green-600 text-white' : isSelectedOpt ? 'bg-red-600 text-white' : 'bg-white text-slate-600 border border-slate-100'}`}>
                              <span className="flex items-center gap-1.5 flex-wrap">
                                {String.fromCharCode(65 + optIdx)}) <MathOrImageRenderer text={opt} className={isCorrectOpt || isSelectedOpt ? 'text-white' : 'text-slate-600'} />
                              </span>
                              {isCorrectOpt && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                              {isSelectedOpt && !isCorrectOpt && <AlertTriangle className="w-4 h-4 shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        {item.selectedIdx === -1 ? (
                          <span className="text-[10px] font-black uppercase text-slate-400">Not Attempted</span>
                        ) : item.isCorrect ? (
                          <span className="text-[10px] font-black uppercase text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Correct Answer</span>
                        ) : (
                          <span className="text-[10px] font-black uppercase text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Incorrect Choice</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
            </div>
        </div>
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

