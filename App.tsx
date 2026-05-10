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
  cuetStatus: 'upload' | 'instructions' | 'exam' | 'terminated' | 'finished';
  setCuetStatus: (status: 'upload' | 'instructions' | 'exam' | 'terminated' | 'finished') => void;
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
  cuetStatus: 'upload' | 'instructions' | 'exam' | 'terminated' | 'finished';
  setCuetStatus: (status: 'upload' | 'instructions' | 'exam' | 'terminated' | 'finished') => void;
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
  // CUET Exam Hub State
  const [cuetStatus, setCuetStatus] = useState<'upload' | 'instructions' | 'exam' | 'terminated' | 'finished'>('upload');
  const [cuetQuestions, setCuetQuestions] = useState<any[]>([]);
  const [cuetAnswers, setCuetAnswers] = useState<Record<number, string>>({});
  const [cuetStatusMap, setCuetStatusMap] = useState<Record<number, 'not-visited' | 'not-answered' | 'answered' | 'marked' | 'answered-marked'>>({});
  const [cuetTimeLeft, setCuetTimeLeft] = useState(3600); // 60 minutes
  const [cuetIsLocked, setCuetIsLocked] = useState(false);
  const [cuetResult, setCuetResult] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Auto-fill candidate name
  const candidateName = "PALLAVI";

  const handleCuetTextUpload = (pastedText: string) => {
    if (!pastedText.trim()) {
      alert("Please paste some text first.");
      return;
    }

    const sections = pastedText.split(/\n\s*\n/);
    const extractedQuestions: any[] = [];

    sections.forEach(section => {
      const lines = section.split('\n').map(l => l.trim()).filter(l => l !== '');
      if (lines.length < 2) return;

      let questionText = '';
      const options: string[] = [];
      
      lines.forEach(line => {
        const optMatch = line.match(/^([A-Da-d][\.\)]|[A-D]:|\([A-Da-d]\))/);
        if (optMatch) {
          options.push(line.replace(optMatch[0], '').trim());
        } else {
          if (options.length === 0) {
            questionText += (questionText ? '\n' : '') + line;
          }
        }
      });

      if (questionText && options.length >= 2) {
        extractedQuestions.push({
          question: questionText,
          options: options.slice(0, 4),
          correct: 0 // Default to first for manual mode
        });
      }
    });

    if (extractedQuestions.length === 0) {
      // Fallback for non-spaced questions
      const allLines = pastedText.split('\n').filter(l => l.trim() !== '');
      let q: any = null;
      allLines.forEach(line => {
        const trimmed = line.trim();
        const qMatch = trimmed.match(/^(\d+[\.\)]|Q\d+|Question\s*\d+)/i);
        const oMatch = trimmed.match(/^([A-Da-d][\.\)]|[A-D]:|\([A-Da-d]\))/);
        
        if (qMatch) {
          if (q && q.options.length >= 2) extractedQuestions.push(q);
          q = { question: trimmed.replace(qMatch[0], '').trim(), options: [], correct: 0 };
        } else if (oMatch && q) {
          q.options.push(trimmed.replace(oMatch[0], '').trim());
        } else if (q) {
          if (q.options.length === 0) q.question += '\n' + trimmed;
        }
      });
      if (q && q.options.length >= 2) extractedQuestions.push(q);
    }

    if (extractedQuestions.length > 0) {
      setCuetQuestions(extractedQuestions);
      setCuetStatus('instructions');
      setCuetAnswers({});
      setCuetStatusMap({});
      setCuetTimeLeft(3600);
    } else {
      alert("No questions detected. Use format:\n\n1. Question text?\nA) Opt 1\nB) Opt 2...");
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
      const prompt = `Extract all questions from this CUET question paper image. 
      Format each question as an object with:
      1. question: the text of the question
      2. options: an array of 4 strings
      3. correct: the index (0-3) of the correct answer
      
      Return ONLY a JSON array of these objects: [{"question": "...", "options": ["...", "...", "...", "..."], "correct": 0}]`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
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
          isAiLoading={isAiLoading}
          cuetStatusMap={cuetStatusMap}
          setCuetStatusMap={setCuetStatusMap}
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
  currentUser, cuetStatus, setCuetStatus, cuetQuestions, setCuetQuestions,
  cuetAnswers, setCuetAnswers, cuetTimeLeft, setCuetTimeLeft,
  cuetIsLocked, setCuetIsLocked, cuetResult, setCuetResult,
  handleCuetImageUpload, handleCuetTextUpload, setStudentView, isAiLoading,
  cuetStatusMap, setCuetStatusMap
}: any) => {
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [unlockCode, setUnlockCode] = useState('');
  const [pastedText, setPastedText] = useState('');

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
    if (cuetQuestions.length > 0 && Object.keys(cuetStatusMap).length === 0) {
        const initialMap: any = {};
        cuetQuestions.forEach((_: any, i: number) => initialMap[i] = 'not-visited');
        // First question is viewed immediately
        initialMap[0] = 'not-answered';
        setCuetStatusMap(initialMap);
    }
  }, [cuetQuestions]);

  const updateStatus = (index: number, status: any) => {
      setCuetStatusMap({ ...cuetStatusMap, [index]: status });
  };

  const handleFinishExam = () => {
    let score = 0;
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;
    cuetQuestions.forEach((q: any, idx: number) => {
      const ans = cuetAnswers[idx];
      if (ans === undefined) unattempted++;
      else if (parseInt(ans) === q.correct) { score += 5; correct++; }
      else { score -= 1; incorrect++; }
    });
    setCuetResult({ score, correct, incorrect, unattempted, total: cuetQuestions.length * 5 });
    setCuetStatus('finished');
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
      }
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
    return (
      <div className="max-w-xl mx-auto py-20 space-y-8 px-4">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6"><img src="https://nta.ac.in/img/logo.png" className="h-16" alt="NTA" /></div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">CUET 2026 PRACTICE PORTAL</h2>
          <p className="text-slate-500 font-bold text-xs tracking-widest uppercase">Direct Question Data Import & Simulation</p>
        </div>
        <div className="bg-white shadow-2xl p-8 rounded-[40px] border border-slate-100 space-y-6">
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
            disabled={!pastedText.trim()}
            className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl uppercase tracking-tighter text-xl shadow-xl hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <Zap className="w-6 h-6" />
            START SIMULATION
          </button>
          
          <div className="text-center">
            <p className="text-slate-400 text-[10px] font-bold uppercase">Manual text parsing mode active (Instant)</p>
          </div>
        </div>
        <div className="bg-amber-50 p-8 rounded-3xl border border-amber-100 space-y-3">
            <div className="flex items-center gap-2 text-amber-700 font-black text-xs uppercase tracking-widest"><Info className="w-4 h-4"/> LEGAL DISCLAIMER</div>
            <p className="text-[10px] text-amber-800/70 leading-relaxed font-medium">This application is a PRIVATE SIMULATION TOOL. We are NOT affiliated with NTA (National Testing Agency). All logos and names are property of their respective owners. Used here under "Fair Use" for educational practice purposes ONLY.</p>
        </div>
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

    const StatusBadge = ({ type, count, label }: { type: any, count: number, label: string }) => {
        const shapes: any = {
            'not-visited': 'bg-white border text-slate-900 rounded',
            'not-answered': 'bg-red-500 text-white rounded-t-3xl rounded-b-lg',
            'answered': 'bg-green-600 text-white rounded-b-3xl rounded-t-lg',
            'marked': 'bg-indigo-600 text-white rounded-full',
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

    return (
      <div className="fixed inset-0 bg-[#f4f7f9] text-slate-800 z-[90] flex flex-col font-sans">
        {/* NTA Master Header */}
        <div className="bg-white border-b flex flex-col sm:flex-row justify-between items-center px-6 py-3 shadow-md z-[100]">
          <div className="flex items-center gap-4">
            <img src="https://nta.ac.in/img/logo.png" className="h-12" alt="NTA" />
            <div className="h-10 w-[2px] bg-slate-200 mx-2 hidden sm:block" />
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">NATIONAL TESTING AGENCY</h1>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Excellence in Assessment</p>
            </div>
          </div>
          <div className="flex gap-8 items-center bg-slate-50 px-6 py-2 rounded-2xl border border-slate-200 mt-3 sm:mt-0">
            <div className="hidden lg:block text-center border-r pr-6">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Candidate Name</p>
                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">PALLAVI</p>
            </div>
            <div className="text-center border-r pr-6">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Subject Name</p>
                <p className="text-xs font-black text-blue-600 uppercase tracking-tight">CUET Practice</p>
            </div>
            <div className="text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Remaining Time</p>
                <p className="text-lg font-mono font-black text-red-600 tabular-nums">{formatTime(cuetTimeLeft)}</p>
            </div>
          </div>
        </div>

        {/* Section Bar */}
        <div className="bg-[#ff9d00] px-6 py-2 flex items-center justify-between shadow-inner">
            <div className="flex gap-1">
                <button className="bg-blue-600 text-white px-6 py-1.5 rounded-t-lg font-black text-xs uppercase shadow-lg">GENERAL TEST</button>
            </div>
            <div className="flex items-center gap-4 text-white">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase"><Monitor className="w-4 h-4"/> Exam: CUET Simulation</div>
            </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Question Panel */}
          <div className="flex-1 flex flex-col bg-white border-r relative">
            <div className="bg-slate-50 px-8 py-3 border-b flex justify-between items-center">
                <h2 className="text-sm font-black text-slate-700 uppercase">Question No. {activeQuestion + 1}</h2>
                <div className="p-1.5 bg-blue-100 rounded-full"><Info className="w-4 h-4 text-blue-600"/></div>
            </div>
            
            <div className="flex-1 p-10 overflow-y-auto">
              <div className="text-lg font-bold text-slate-800 leading-relaxed mb-12 select-none whitespace-pre-wrap">{currentQ?.question}</div>
              <div className="grid grid-cols-1 gap-5">
                {currentQ?.options.map((opt: string, i: number) => (
                  <button 
                    key={i} 
                    onClick={() => setCuetAnswers({...cuetAnswers, [activeQuestion]: i.toString()})} 
                    className={`group flex items-center gap-5 p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${cuetAnswers[activeQuestion] === i.toString() ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-slate-100 hover:border-slate-300'}`}
                  >
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-black text-sm shrink-0 transition-colors ${cuetAnswers[activeQuestion] === i.toString() ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>({i+1})</div>
                    <span className={`text-sm font-bold transition-colors ${cuetAnswers[activeQuestion] === i.toString() ? 'text-blue-900' : 'text-slate-600'}`}>{opt}</span>
                    {cuetAnswers[activeQuestion] === i.toString() && <div className="absolute right-4 top-1/2 -translate-y-1/2"><CheckCircle2 className="w-6 h-6 text-blue-600" /></div>}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Bar from Reference Image */}
            <div className="bg-slate-50 border-t p-6 flex flex-wrap gap-4 items-center">
                <button onClick={() => handleAction('save')} className="bg-[#4caf50] text-white px-6 py-3 rounded-lg font-black text-[11px] uppercase tracking-tighter hover:brightness-110 active:scale-95 transition-all shadow-md">SAVE & NEXT</button>
                <button onClick={() => handleAction('save-mark')} className="bg-[#ff9800] text-white px-6 py-3 rounded-lg font-black text-[11px] uppercase tracking-tighter hover:brightness-110 active:scale-95 transition-all shadow-md">SAVE & MARK FOR REVIEW</button>
                <button onClick={() => handleAction('clear')} className="bg-white border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-black text-[11px] uppercase tracking-tighter hover:bg-slate-100 active:scale-95 transition-all shadow-sm">CLEAR RESPONSE</button>
                <button onClick={() => handleAction('mark')} className="bg-[#03a9f4] text-white px-6 py-3 rounded-lg font-black text-[11px] uppercase tracking-tighter hover:brightness-110 active:scale-95 transition-all shadow-md">MARK FOR REVIEW & NEXT</button>
            </div>

            {/* Fixed Bottom Navigation */}
            <div className="bg-white border-t p-4 flex justify-between items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                <div className="flex gap-3">
                    <button onClick={() => setActiveQuestion(prev => Math.max(0, prev - 1))} className="px-8 py-2.5 border-2 border-slate-400 rounded-lg font-black text-xs uppercase hover:bg-slate-100 transition-all">&lt;&lt; BACK</button>
                    <button onClick={() => setActiveQuestion(prev => Math.min(cuetQuestions.length - 1, prev + 1))} className="px-8 py-2.5 bg-slate-800 text-white rounded-lg font-black text-xs uppercase hover:bg-black transition-all">NEXT &gt;&gt;</button>
                </div>
                <button onClick={() => window.confirm('Final Submit?') && handleFinishExam()} className="bg-[#2e7d32] text-white px-10 py-2.5 rounded-lg font-black text-xs uppercase shadow-xl hover:brightness-110 transition-all">SUBMIT</button>
            </div>
          </div>

          {/* Right Palette Panel */}
          <div className="w-full sm:w-[360px] bg-white flex flex-col p-6 overflow-y-auto">
            <div className="flex flex-col gap-8">
                {/* Status Guide */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 p-4 bg-slate-50 border rounded-2xl">
                    <StatusBadge type="not-visited" count={counts['not-visited']} label="Not Visited" />
                    <StatusBadge type="not-answered" count={counts['not-answered']} label="Not Answered" />
                    <StatusBadge type="answered" count={counts['answered']} label="Answered" />
                    <StatusBadge type="marked" count={counts['marked']} label="Marked Review" />
                    <div className="col-span-2">
                        <StatusBadge type="answered-marked" count={counts['answered-marked']} label="Ans & Marked Review (evaluated)" />
                    </div>
                </div>

                {/* Candidate Sidebar Profile Style */}
                <div className="flex items-center gap-4 p-4 border rounded-2xl bg-gradient-to-r from-blue-50 to-white">
                    <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center p-1 border overflow-hidden">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=pallavi" alt="Profile" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Roll No.</p>
                        <p className="text-xs font-black text-slate-800">2026-X7Y-922</p>
                    </div>
                </div>

                {/* Palette */}
                <div className="bg-blue-600 px-4 py-2 rounded-t-xl text-white font-black text-[11px] uppercase tracking-wider text-center">Question Palette</div>
                <div className="bg-slate-50 border p-5 rounded-b-2xl shadow-inner max-h-[400px] overflow-y-auto">
                    <div className="grid grid-cols-5 gap-3">
                        {cuetQuestions.map((_: any, i: number) => {
                            const status = cuetStatusMap[i] || 'not-visited';
                            const shapes: any = {
                                'not-visited': 'bg-white border text-slate-900 rounded',
                                'not-answered': 'bg-red-500 text-white rounded-t-3xl rounded-b-lg',
                                'answered': 'bg-green-600 text-white rounded-b-3xl rounded-t-lg',
                                'marked': 'bg-indigo-600 text-white rounded-full',
                                'answered-marked': 'bg-indigo-600 text-white rounded-full relative after:content-[""] after:absolute after:bottom-0 after:right-0 after:w-3 after:h-3 after:bg-green-500 after:rounded-full after:border-2 after:border-white'
                            };
                            return (
                                <button 
                                    key={i} 
                                    onClick={() => setActiveQuestion(i)} 
                                    className={`h-10 w-10 flex items-center justify-center font-bold text-xs transition-all hover:scale-110 active:scale-90 ${shapes[status]} ${activeQuestion === i ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
                                >
                                    {i+1}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="mt-8 bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-[9px] font-bold text-blue-800 leading-tight italic uppercase">Candidate is advised to frequently Refresh the portal if question lag occurs.</p>
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
                    <button onClick={() => window.print()} className="flex-1 bg-white border-2 border-slate-200 text-slate-700 font-black py-4 rounded-2xl uppercase shadow-md hover:bg-slate-50 transition-all flex items-center justify-center gap-2"><Download className="w-5 h-5"/> Save Report</button>
                    <button onClick={() => setCuetStatus('upload')} className="flex-1 bg-slate-900 text-white font-black py-4 rounded-2xl uppercase shadow-xl hover:bg-black transition-all">New Practice Session</button>
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

