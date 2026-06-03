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
import { getAuth, signInAnonymously } from 'firebase/auth';
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

const AppContent: React.FC = () => {
  // Exam Hub state
  const [examType, setExamType] = useState<'cuet' | 'neet' | 'jee' | 'nest' | null>(null);
  const [cuetStatus, setCuetStatus] = useState<'selection' | 'upload' | 'instructions' | 'exam' | 'terminated' | 'finished' | 'nest-login' | 'nest-instructions' | 'nest-other-instructions'>('selection');
  const [cuetQuestions, setCuetQuestions] = useState<any[]>([]);
  const [neetData, setNeetData] = useState<Record<string, any[]>>({ 'Physics': [], 'Chemistry': [], 'Biology': [] });
  const [nestData, setNestData] = useState<Record<string, any[]>>({ 'Biology': [], 'Chemistry': [], 'Physics': [] });
  const [activeNeetSubject, setActiveNeetSubject] = useState<string>('Physics');
  const [cuetAnswers, setCuetAnswers] = useState<Record<number, string>>({});
  const [cuetStatusMap, setCuetStatusMap] = useState<Record<number, 'not-visited' | 'not-answered' | 'answered' | 'marked' | 'answered-marked'>>({});
  const [cuetTimeLeft, setCuetTimeLeft] = useState(3600); // Default 60 mins
  const [cuetIsLocked, setCuetIsLocked] = useState(false);
  const [cuetResult, setCuetResult] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [neetOmrFilled, setNeetOmrFilled] = useState<Record<number, boolean>>({});

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

    // Dynamic timer: 1 hour per section, max 3 hours (10800 seconds)
    const duration = filledSectionsCount * 3600;
    setCuetTimeLeft(duration);
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
    setCuetTimeLeft(10800); // 3 hours (180 minutes)
    setCuetStatus('instructions');
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
          setCuetStatus('instructions');
          setCuetAnswers({});
          setCuetStatusMap({});
          setCuetTimeLeft(3600);
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
          setCuetStatus('instructions');
          setCuetAnswers({});
          setCuetStatusMap({});
          setCuetTimeLeft(3600);
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
  nestData, handleNestTextUpload, handleNestFileUpload, startNestSimulation
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

  // NEST specific states
  const [nestCandidateName, setNestCandidateName] = useState('John Smith');
  const [nestCandidatePhoto, setNestCandidatePhoto] = useState<string>('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200');
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
      setCuetStatusMap({ ...cuetStatusMap, [index]: status });
  };

  const handleFinishExam = () => {
    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;
    
    // NEET Marking: +4, -1, 0
    // CUET Marking: +5, -1, 0
    const correctScore = examType === 'neet' ? 4 : examType === 'nest' ? 4 : 5;
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

    setCuetResult({ 
      score, 
      correct: correctCount, 
      incorrect: incorrectCount, 
      unattempted: unattemptedCount, 
      total: cuetQuestions.length * correctScore,
      details: detailedResults
    });
    setCuetStatus('finished');
  };

  if (cuetStatus === 'selection') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setExamType('cuet'); setCuetStatus('upload'); }}
            className="bg-white p-12 rounded-[40px] text-center space-y-6 shadow-2xl border-4 border-transparent hover:border-blue-500 transition-all flex flex-col justify-between"
          >
            <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto">
              <GraduationCap className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">CUET 2026</h3>
              <p className="text-slate-500 font-bold uppercase text-xs mt-2 tracking-widest">Common University Entrance Test</p>
            </div>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setExamType('neet'); setCuetStatus('upload'); }}
            className="bg-white p-12 rounded-[40px] text-center space-y-6 shadow-2xl border-4 border-transparent hover:border-red-500 transition-all flex flex-col justify-between"
          >
            <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto">
              <TrendingUp className="w-10 h-10 text-red-600" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">NEET UG</h3>
              <p className="text-slate-500 font-bold uppercase text-xs mt-2 tracking-widest">National Eligibility cum Entrance Test</p>
            </div>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setExamType('nest'); setCuetStatus('upload'); }}
            className="bg-white p-12 rounded-[40px] text-center space-y-6 shadow-2xl border-4 border-transparent hover:border-emerald-500 transition-all flex flex-col justify-between"
          >
            <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto">
              <Monitor className="w-10 h-10 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">NEST Exam</h3>
              <p className="text-slate-500 font-bold uppercase text-xs mt-2 tracking-widest">National Entrance Screening Test</p>
            </div>
          </motion.button>
        </div>
      </div>
    );
  }

  const downloadDetailedPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 51, 153);
    doc.text(`${examType === 'neet' ? 'NEET UG' : examType === 'nest' ? 'NEST Exam' : 'CUET'} 2026 PRACTICE PORTAL`, pageWidth / 2, y, { align: 'center' });
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
    doc.text(`Candidate Name: ${currentUser?.name || "PALLAVI"}`, 20, y);
    doc.text(`Exam ID: ${examType === 'neet' ? 'NEET' : examType === 'nest' ? 'NEST' : 'CUET'}2026-X7Y`, 150, y);
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
    (cuetResult?.details || []).forEach((item: any, index: number) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      const questionText = item.subject ? `[${item.subject}] ${item.question}` : item.question;
      const questionLines = doc.splitTextToSize(`${index + 1}. ${questionText}`, pageWidth - 40);
      doc.text(questionLines, 20, y);
      y += (questionLines.length * 5) + 2;

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
    });

    doc.save(`${examType?.toUpperCase()}_Result_${currentUser?.name || "Candidate"}.pdf`);
  };

  const handleAction = (action: 'save' | 'mark' | 'clear' | 'save-mark') => {
      const currentAns = cuetAnswers[activeQuestion];
      
      if (action === 'clear') {
          const newAns = { ...cuetAnswers };
          delete newAns[activeQuestion];
          setCuetAnswers(newAns);
          updateStatus(activeQuestion, 'not-answered');
          return;
      }

      if (action === 'save') {
          if (currentAns === undefined) { alert("Please select an answer first."); return; }
          updateStatus(activeQuestion, 'answered');
      } else if (action === 'mark') {
          updateStatus(activeQuestion, 'marked');
      } else if (action === 'save-mark') {
          if (currentAns === undefined) { alert("Please select an answer first."); return; }
          updateStatus(activeQuestion, 'answered-marked');
      }

      // Move to next
      if (activeQuestion < cuetQuestions.length - 1) {
          const nextQ = activeQuestion + 1;
          setActiveQuestion(nextQ);
          if (cuetStatusMap[nextQ] === 'not-visited') {
              updateStatus(nextQ, 'not-answered');
          }
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
          <button onClick={() => unlockCode === 'DDYY22' ? (setCuetIsLocked(false), setCuetStatus('exam')) : alert('Invalid key. Contact proctor.')} className="w-full bg-red-600 text-white font-black py-3 rounded-xl uppercase tracking-tighter">Enter Exam Hall</button>
        </motion.div>
      </div>
    );
  }

  if (cuetStatus === 'upload') {
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
      return (
        <div className="max-w-4xl mx-auto py-12 space-y-8 px-4">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">NEET UG SIMULATOR</h2>
            <p className="text-red-500 font-bold text-xs tracking-widest uppercase">Multi-Subject Question Injection</p>
          </div>
          
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

          <button 
            onClick={startNeetSimulation}
            className="w-full bg-red-600 text-white font-black py-6 rounded-[30px] uppercase text-2xl shadow-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-4"
          >
            <Zap className="w-8 h-8" />
            INITIALIZE TEST ENVIRONMENT
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

              <button 
                onClick={() => {
                  if (nestPassword !== 'P@llavi76') {
                    setLoginError("Invalid password. Please use correct password: P@llavi76");
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
            onClick={() => {
              if (!nestDefaultLanguage) { alert("Please select your Default Language first."); return; }
              if (!isDisclaimerChecked) { alert("Please inspect and check the disclaimer to declare that you agree to the instructions."); return; }
              setCuetStatus('exam');
              setCuetAnswers({});
              const initialMap: any = {};
              cuetQuestions.forEach((_: any, i: number) => initialMap[i] = 'not-visited');
              initialMap[0] = 'not-answered';
              setCuetStatusMap(initialMap);
              setActiveQuestion(0);
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

            <button onClick={() => setCuetStatus('exam')} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl uppercase tracking-tighter text-xl shadow-xl hover:bg-black transition-all">Begin Examination</button>
            <div className="text-center">
                <button onClick={() => setCuetStatus('upload')} className="text-slate-400 font-bold text-[10px] uppercase hover:text-slate-900 transition-all underline underline-offset-4">Change Question Paper</button>
            </div>
        </div>
      </div>
    );
  }

  if (cuetStatus === 'exam') {
    const currentQ = cuetQuestions[activeQuestion];
    const formatTime = (s: number) => {
        const h = Math.floor(s/3600);
        const m = Math.floor((s % 3600)/60);
        const sec = s % 60;
        return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
    };

    // Subject filtering for Navigation Palette
    const subjects = examType === 'nest'
        ? ['Biology', 'Chemistry', 'Physics'].filter((sub: string) => cuetQuestions.some((q: any) => q.subject === sub))
        : examType === 'neet' 
        ? ['Physics', 'Chemistry', 'Biology'] 
        : ['General Test'];
    const filteredQuestions = (examType === 'neet' || examType === 'nest')
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

    if (examType === 'nest') {
      const currentAns = cuetAnswers[activeQuestion];
      return (
        <div key="nest-exam-container" className="fixed inset-0 bg-[#f4f7f9] text-slate-850 z-[90] flex flex-col font-sans select-none overflow-hidden">
          {/* Header Bar (TCS iON Custom High Fidelity Style) */}
          <header id="nest-header" className="h-[65px] bg-[#1e2833] text-white flex justify-between items-center px-4 sm:px-6 shrink-0 z-50 shadow-md border-b border-slate-900">
            <div className="flex items-center gap-3">
              <div className="bg-[#2f71b9] p-2 rounded">
                <Monitor className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div className="text-left">
                <h1 id="nest-title" className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-100">
                  NEST 2026 ONLINE SIMULATOR
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
          <div id="nest-section-bar" className="bg-[#2f71b9] px-4 py-1.5 flex items-center justify-between border-b border-[#245994] shadow-inner shrink-0 text-white">
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
                  className={`${activeNeetSubject === sub ? 'bg-white text-blue-900 font-extrabold border-b-2 border-orange-500 shadow-md' : 'bg-white/10 text-white/95 hover:bg-white/20'} px-5 py-2 rounded-md font-black text-[11px] uppercase tracking-wide transition-all`}
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
                  className="font-bold text-slate-900 leading-relaxed mb-4 select-text whitespace-pre-wrap"
                >
                  {currentQ?.question}
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
                        <span style={{ fontSize: `${0.875 * (nestTextZoom / 100)}rem` }} className={`font-bold transition-colors ${isSelected ? 'text-slate-900' : 'text-slate-650'}`}>{opt}</span>
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
                  {examType === 'neet' ? 'NEET UG 2026' : examType === 'nest' ? 'NEST Exam 2026' : 'CUET 2026'}
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
            <div className="hidden md:flex items-center gap-4 text-white">
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
              <div className="text-lg font-bold text-slate-800 leading-relaxed mb-6 select-none whitespace-pre-wrap">{currentQ?.question}</div>
              
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
                    <div key={i} className={`flex items-center gap-4 transition-all`}>
                      {isNeet ? (
                        <OmrCircle 
                          index={activeQuestion} 
                          optionIdx={i} 
                          isFilled={isSelected} 
                          onFill={() => {
                            if (!isSelected) {
                              setCuetAnswers({...cuetAnswers, [activeQuestion]: i.toString()});
                              setNeetOmrFilled({...neetOmrFilled, [activeQuestion]: true});
                            }
                          }}
                        />
                      ) : (
                        <button 
                          onClick={() => setCuetAnswers({...cuetAnswers, [activeQuestion]: i.toString()})}
                          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-black text-xs shrink-0 transition-colors ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-slate-500'}`}
                        >
                          {String.fromCharCode(65 + i)}
                        </button>
                      )}
                      
                      <div className={`flex-1 p-4 rounded-xl border-2 transition-all ${isSelected ? 'border-slate-800 bg-slate-50 shadow-sm' : 'border-slate-100'}`}>
                        <span className={`text-sm font-bold ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>{opt}</span>
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
                      <h4 className="text-sm font-bold text-slate-800 leading-relaxed mb-4">{item.question}</h4>
                      
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
                              <span>{String.fromCharCode(65 + optIdx)}) {opt}</span>
                              {isCorrectOpt && <CheckCircle2 className="w-4 h-4" />}
                              {isSelectedOpt && !isCorrectOpt && <AlertTriangle className="w-4 h-4" />}
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

