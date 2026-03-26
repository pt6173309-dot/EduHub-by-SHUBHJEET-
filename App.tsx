import React, { useState, useEffect, useRef, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Lock, 
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
  ArrowLeft,
  Sparkles,
  ChevronLeft,
  TrendingUp,
  Zap,
  Play,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
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
  activeTab: 'video' | 'note' | 'question' | 'notice' | 'profile' | 'users';
  setActiveTab: (tab: 'video' | 'note' | 'question' | 'notice' | 'profile' | 'users') => void;
}

interface StudentDashboardProps {
  currentUser: UserData | null;
  setCurrentUser: (user: UserData | null) => void;
  resources: Resource[];
  notices: Notice[];
  studentView: 'main' | 'school' | 'self';
  setStudentView: (view: 'main' | 'school' | 'self') => void;
  activeTab: 'video' | 'note' | 'question' | 'notice' | 'profile' | 'users';
  setActiveTab: (tab: 'video' | 'note' | 'question' | 'notice' | 'profile' | 'users') => void;
  selectedSubjectFilter: string | null;
  setSelectedSubjectFilter: (sub: string | null) => void;
  selfStudyTab: 'progress' | 'test' | 'ai';
  setSelfStudyTab: (tab: 'progress' | 'test' | 'ai') => void;
  aiPlan: string | null;
  setAiPlan: (plan: string | null) => void;
  aiPlanDetails: any;
  setAiPlanDetails: (details: any) => void;
  isAiLoading: boolean;
  handleAiAsk: (mode: 'chat' | 'plan' | 'test' | 'evaluate', prompt?: string) => void;
  currentTest: any;
  setCurrentTest: (test: any) => void;
  testAnswers: Record<number, string>;
  setTestAnswers: (answers: Record<number, string>) => void;
  testResult: any;
  setTestResult: (result: any) => void;
  chatMessages: any[];
  aiInput: string;
  setAiInput: (input: string) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  setSelectedResource: (res: Resource | null) => void;
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
  activeTab: 'video' | 'note' | 'question' | 'notice' | 'profile' | 'users';
  setActiveTab: (tab: 'video' | 'note' | 'question' | 'notice' | 'profile' | 'users') => void;
  adminUserTab: 'students' | 'teachers';
  setAdminUserTab: (tab: 'students' | 'teachers') => void;
  setSelectedResource: (res: Resource | null) => void;
  setEditingResource: (res: Resource | null) => void;
  setResourceForm: (form: any) => void;
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
  studentView: 'main' | 'school' | 'self';
  setStudentView: (view: 'main' | 'school' | 'self') => void;
  activeTab: 'video' | 'note' | 'question' | 'notice' | 'profile' | 'users';
  setActiveTab: (tab: 'video' | 'note' | 'question' | 'notice' | 'profile' | 'users') => void;
  selectedSubjectFilter: string | null;
  setSelectedSubjectFilter: (sub: string | null) => void;
  selfStudyTab: 'progress' | 'test' | 'ai';
  setSelfStudyTab: (tab: 'progress' | 'test' | 'ai') => void;
  aiPlan: string | null;
  setAiPlan: (plan: string | null) => void;
  aiPlanDetails: any;
  setAiPlanDetails: (details: any) => void;
  isAiLoading: boolean;
  handleAiAsk: (mode: 'chat' | 'plan' | 'test' | 'evaluate', prompt?: string) => void;
  currentTest: any;
  setCurrentTest: (test: any) => void;
  testAnswers: Record<number, string>;
  setTestAnswers: (answers: Record<number, string>) => void;
  testResult: any;
  setTestResult: (result: any) => void;
  chatMessages: any[];
  aiInput: string;
  setAiInput: (input: string) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  onSelectResource: (res: Resource) => void;
  adminUserTab: 'students' | 'teachers';
  setAdminUserTab: (tab: 'students' | 'teachers') => void;
  setSelectedResource: (res: Resource | null) => void;
  setEditingResource: (res: Resource | null) => void;
  setResourceForm: (form: any) => void;
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
        <p className="text-[10px] font-rajdhani font-bold text-white/20 uppercase tracking-[0.3em]">Neural Resource Interface • Shiksha AI</p>
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
      } catch (error) {
        console.error('Profile update error:', error);
      }
    };

    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-sm">
          <div className="flex justify-between items-start mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-orbitron font-black text-white tracking-tighter uppercase">My Profile</h3>
            <button 
              onClick={() => setEditingProfile(!editingProfile)}
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
                <label className="text-[10px] font-orbitron font-bold text-white/30 uppercase tracking-widest mb-1 block">Neural ID / Mobile</label>
                {editingProfile ? (
                  <input 
                    className="w-full px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl outline-none text-white font-rajdhani focus:border-cyber-blue/50 transition-all"
                    value={profileData.mobile}
                    onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
                  />
                ) : (
                  <p className="font-orbitron font-bold text-white text-base sm:text-lg tracking-tight">{currentUser?.mobile}</p>
                )}
              </div>
            </div>
            <div className="space-y-4 sm:space-y-6">
              {currentUser?.role === 'teacher' && (
                <>
                  <div>
                    <label className="text-[10px] font-orbitron font-bold text-white/30 uppercase tracking-widest mb-2 block">Specializations</label>
                    <div className="flex flex-wrap gap-2">
                      {currentUser.subjects?.map(s => <span key={s} className="px-3 py-1 bg-cyber-purple/20 text-cyber-purple rounded-lg text-[10px] font-orbitron font-bold uppercase tracking-widest border border-cyber-purple/20">{s}</span>)}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-orbitron font-bold text-white/30 uppercase tracking-widest mb-2 block">Assigned Sectors</label>
                    <div className="flex flex-wrap gap-2">
                      {currentUser.classes?.map(c => <span key={c} className="px-3 py-1 bg-cyber-blue/20 text-cyber-blue rounded-lg text-[10px] font-orbitron font-bold uppercase tracking-widest border border-cyber-blue/20">{c}</span>)}
                    </div>
                  </div>
                </>
              )}
              {currentUser?.role === 'student' && (
                <div>
                  <label className="text-[10px] font-orbitron font-bold text-white/30 uppercase tracking-widest mb-1 block">Sector / Class</label>
                  <p className="font-orbitron font-bold text-white text-base sm:text-lg tracking-tight">{currentUser.class}</p>
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
  setAdminUserTab, setSelectedResource, setEditingResource, setResourceForm
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
  // Connection Test
  const [dbStatus, setDbStatus] = useState<'checking' | 'online' | 'offline' | 'error'>('checking');
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log("Testing Firestore connection...");
        // Use getDocFromServer to force a network request
        await getDocFromServer(doc(db, '_connection_test', 'test'));
        console.log("Firestore connection successful");
        setDbStatus('online');
      } catch (error: any) {
        console.error("Firestore connection test failed:", error);
        if (error.message?.includes('the client is offline')) {
          setDbStatus('offline');
          setDbError("Firestore is offline. Please check your internet or Firebase config.");
        } else if (error.code === 'permission-denied') {
          // This is actually good, it means we reached the server but were denied
          setDbStatus('online');
        } else {
          setDbStatus('error');
          setDbError(error.message || "Unknown Firestore error");
        }
      }
    };
    testConnection();
  }, []);

  // Auth State
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [view, setView] = useState<'login' | 'signup' | 'dashboard'>('login');
  const [signupType, setSignupType] = useState<UserRole>('student');

  // App Data State
  const [resources, setResources] = useState<Resource[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  // Dashboard Navigation State
  const [activeTab, setActiveTab] = useState<'video' | 'note' | 'question' | 'notice' | 'profile' | 'users'>('video');
  const [adminUserTab, setAdminUserTab] = useState<'students' | 'teachers'>('students');
  const [studentView, setStudentView] = useState<'main' | 'school' | 'self'>('main');
  const [selfStudyTab, setSelfStudyTab] = useState<'progress' | 'test' | 'ai'>('progress');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string | null>(null);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string | null>(null);

  // Admin/Teacher Form State
  const [resourceForm, setResourceForm] = useState({
    title: '',
    content: '',
    type: 'video' as 'video' | 'note' | 'question',
    subject: '',
    className: ''
  });
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    type: 'subject' as 'school' | 'subject',
    subject: '',
    className: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [showAiHelper, setShowAiHelper] = useState(false);

  // AI Helper State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPlan, setAiPlan] = useState<string | null>(null);
  const [aiPlanDetails, setAiPlanDetails] = useState({ status: '', hours: '', goals: '' });
  const [currentTest, setCurrentTest] = useState<any | null>(null);
  const [testAnswers, setTestAnswers] = useState<Record<number, string>>({});
  const [testResult, setTestResult] = useState<any | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Validate Connection to Firestore
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();
  }, []);

  // Real-time Resources Listener
  useEffect(() => {
    const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const resList: Resource[] = [];
      snapshot.forEach((doc) => {
        resList.push({ id: doc.id, ...doc.data() } as Resource);
      });
      setResources(resList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'resources');
    });
    return () => unsubscribe();
  }, []);

  // Real-time Notices Listener
  useEffect(() => {
    const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const noticeList: Notice[] = [];
      snapshot.forEach((doc) => {
        noticeList.push({ id: doc.id, ...doc.data() } as Notice);
      });
      setNotices(noticeList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'notices');
    });
    return () => unsubscribe();
  }, []);

  // Real-time Users Listener (for Main Admin)
  useEffect(() => {
    if (currentUser?.role === 'main-admin') {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const userList: UserData[] = [];
        snapshot.forEach((doc) => {
          userList.push({ uid: doc.id, ...doc.data() } as UserData);
        });
        setAllUsers(userList);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'users');
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  // Class Promotion Logic (April 1st)
  useEffect(() => {
    const promoteStudents = async () => {
      if (currentUser?.role === 'student' && currentUser.uid) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const promotionDate = new Date(currentYear, 3, 1); // April 1st of current year

        const lastPromotion = currentUser.lastPromotionDate ? currentUser.lastPromotionDate.toDate() : new Date(0);
        
        if (now >= promotionDate && lastPromotion < promotionDate) {
          const classNum = parseInt(currentUser.class?.replace('Class ', '') || '0');
          if (classNum > 0 && classNum < 12) {
            const nextClass = `Class ${classNum + 1}`;
            try {
              await setDoc(doc(db, 'users', currentUser.uid), {
                class: nextClass,
                lastPromotionDate: serverTimestamp()
              }, { merge: true });
              setCurrentUser(prev => prev ? { ...prev, class: nextClass } : null);
              console.log(`Student promoted to ${nextClass}`);
            } catch (error) {
              console.error('Promotion error:', error);
            }
          }
        }
      }
    };
    promoteStudents();
  }, [currentUser]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // --- Auth Handlers ---
  const handleSignup = async (data: any) => {
    const id = (data.role === 'student' ? data.studentId : data.teacherId)?.trim();
    if (!id) {
      alert('ID is required');
      return;
    }
    if (!data.password) {
      alert('Password is required');
      return;
    }
    
    setIsUploading(true);
    try {
      // Ensure we are authenticated anonymously before any Firestore operation
      try {
        if (!auth.currentUser) {
          console.log('Not authenticated. Signing in anonymously...');
          await signInAnonymously(auth);
          console.log('Anonymous sign-in successful');
        }
      } catch (authErr: any) {
        console.error('Anonymous auth failed during signup:', authErr);
        alert(`Authentication failed: ${authErr.message}. Please ensure Anonymous Auth is enabled in Firebase Console.`);
        setIsUploading(false);
        return;
      }

      console.log('Checking if ID exists:', id);
      const q = query(
        collection(db, 'users'), 
        where(data.role === 'student' ? 'studentId' : 'teacherId', '==', id)
      );
      
      let querySnapshot;
      try {
        querySnapshot = await getDocs(q);
      } catch (err) {
        const errInfo = handleFirestoreError(err, OperationType.GET, 'users');
        alert(`Signup failed during check: ${errInfo.error}`);
        return;
      }
      
      if (!querySnapshot.empty) {
        alert('ID already exists');
        return;
      }

      console.log('Creating user document...');
      const userRef = doc(collection(db, 'users'));
      const userData: UserData = {
        uid: userRef.id,
        name: data.name,
        role: data.role,
        studentId: data.studentId?.trim() || '',
        teacherId: data.teacherId?.trim() || '',
        class: data.class || '',
        classes: data.classes || [],
        subjects: data.subjects || [],
        mobile: data.mobile || '',
        createdAt: serverTimestamp()
      };
      
      try {
        await setDoc(userRef, { ...userData, password: data.password });
      } catch (err) {
        const errInfo = handleFirestoreError(err, OperationType.WRITE, `users/${userRef.id}`);
        alert(`Signup failed during save: ${errInfo.error}`);
        return;
      }

      console.log('Signup successful');
      alert('Signup successful! Please login.');
      setView('login');
    } catch (error) {
      console.error('Signup error details:', error);
      alert('Signup failed. Check console for details.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogin = async (idInput: string, pass: string, role: UserRole) => {
    const id = idInput?.trim();
    console.log('Attempting login for:', id, 'Role:', role);
    
    setIsUploading(true);
    try {
      // Ensure Firebase Auth is active for everyone, including Main Admin
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (authErr: any) {
          console.error('Anonymous auth failed:', authErr);
          // We continue, but writes might fail if rules require auth
        }
      }

      if (id === MAIN_ADMIN_EMAIL && pass === '91868194p') {
        // Even for main admin, we wait for anonymous auth to ensure we have a valid token for Firestore
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
        setCurrentUser({ uid: auth.currentUser?.uid || 'main-admin', name: 'Main Admin', role: 'main-admin', email: MAIN_ADMIN_EMAIL });
        setView('dashboard');
        setIsUploading(false);
        return;
      }

      if (!id || !pass) {
        alert('Please enter both ID and Password');
        setIsUploading(false);
        return;
      }

      const q = query(
        collection(db, 'users'), 
        where(role === 'student' ? 'studentId' : 'teacherId', '==', id)
      );
      
      let querySnapshot;
      try {
        querySnapshot = await getDocs(q);
      } catch (err) {
        const errInfo = handleFirestoreError(err, OperationType.GET, 'users');
        alert(`Login failed: ${errInfo.error}`);
        return;
      }
      
      if (querySnapshot.empty) {
        alert('Invalid ID');
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      if (userData.role !== role) {
        alert('Invalid Role for this ID');
        return;
      }

      if (userData.password === pass) {
        setCurrentUser({ uid: userDoc.id, ...userData } as UserData);
        setView('dashboard');
      } else {
        alert('Invalid Password');
      }
    } catch (error) {
      console.error('Login error details:', error);
      alert('Login failed. Check console for details.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('login');
    setActiveTab('video');
    setSelectedSubjectFilter(null);
    setSelectedClassFilter(null);
  };

  // --- Resource/Notice Handlers ---
  const uploadFile = async (file: File, folder: string) => {
    const fileRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    return {
      url: await getDownloadURL(fileRef),
      name: file.name
    };
  };

  const handleAddResource = async () => {
    if (!resourceForm.title || (!resourceForm.content && !selectedFile) || !resourceForm.subject || !resourceForm.className) {
      alert('Please fill all fields (Title, Subject, Class, and either Content or File)');
      return;
    }

    setIsUploading(true);
    try {
      // Ensure Auth
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      let fileData = null;
      if (selectedFile) {
        fileData = await uploadFile(selectedFile, 'resources');
      }

      const dataToSave = {
        ...resourceForm,
        fileUrl: fileData?.url || editingResource?.fileUrl || '',
        fileName: fileData?.name || editingResource?.fileName || '',
        updatedAt: serverTimestamp()
      };

      if (editingResource) {
        await setDoc(doc(db, 'resources', editingResource.id), dataToSave, { merge: true });
        alert('Resource updated successfully!');
      } else {
        await addDoc(collection(db, 'resources'), {
          ...dataToSave,
          authorId: currentUser?.uid,
          authorName: currentUser?.name,
          createdAt: serverTimestamp()
        });
        alert('Resource added successfully!');
      }
      setResourceForm({ title: '', content: '', type: 'video', subject: '', className: '' });
      setSelectedFile(null);
      setEditingResource(null);
      setShowResourceForm(false);
    } catch (error: any) {
      console.error('Save error details:', error);
      const errInfo = handleFirestoreError(error, OperationType.WRITE, 'resources');
      // Show detailed error to the user so they can report it
      alert(`UPLOAD FAILED!\n\nError Code: ${error.code || 'unknown'}\nMessage: ${error.message}\n\nPlease ensure Firestore is initialized in your Firebase Console.`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddNotice = async () => {
    if (!noticeForm.title || (!noticeForm.content && !selectedFile) || (noticeForm.type === 'subject' && !noticeForm.subject)) {
      alert('Please fill all fields');
      return;
    }

    setIsUploading(true);
    try {
      // Ensure Auth
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      let fileData = null;
      if (selectedFile) {
        fileData = await uploadFile(selectedFile, 'notices');
      }

      await addDoc(collection(db, 'notices'), {
        ...noticeForm,
        fileUrl: fileData?.url || '',
        fileName: fileData?.name || '',
        authorId: currentUser?.uid,
        authorName: currentUser?.name,
        createdAt: serverTimestamp()
      });
      alert('Notice posted successfully!');
      setNoticeForm({ title: '', content: '', type: 'subject', subject: '', className: '' });
      setSelectedFile(null);
      setShowNoticeForm(false);
    } catch (error: any) {
      console.error('Notice error:', error);
      alert(`Failed to post notice: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await deleteDoc(doc(db, 'resources', id));
        alert('Resource deleted');
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  // --- AI Helper Handler ---
  const handleAiAsk = async (mode: 'chat' | 'plan' | 'test' | 'evaluate' = 'chat', customPrompt?: string) => {
    const input = typeof customPrompt === 'string' ? customPrompt : aiInput;
    if (!input.trim()) return;

    if (mode === 'chat') {
      const userMsg: ChatMessage = { role: 'user', text: input };
      setChatMessages(prev => [...prev, userMsg]);
      setAiInput('');
    }
    setIsAiLoading(true);

    try {
      // Robust API key retrieval for various environments (local, Netlify, etc.)
      const apiKey = 
        import.meta.env.VITE_GEMINI_API_KEY || 
        (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '') || 
        (typeof process !== 'undefined' ? process.env.VITE_GEMINI_API_KEY : '') ||
        (window as any).GEMINI_API_KEY ||
        (window as any).VITE_GEMINI_API_KEY;

      if (!apiKey || apiKey === "" || apiKey === "undefined") {
        throw new Error('API_KEY_MISSING: Gemini API Key is not configured. Please add VITE_GEMINI_API_KEY to your environment variables in Netlify settings and redeploy.');
      }
      const ai = new GoogleGenAI({ apiKey });
      const studentClass = currentUser?.role === 'student' ? currentUser.class : 'General';
      
      let systemInstruction = `You are an expert NCERT helper for ${studentClass}. Answer the following question accurately based on NCERT curriculum. Keep answers concise and helpful for students.`;
      
      if (mode === 'plan') {
        systemInstruction = `You are Shiksha AI, a study planner for ${studentClass}. Based on the student's details, create a monthly study plan for Maths, Science, Hindi, English, and SST. Also provide a weekly timetable to achieve this monthly plan. Use Markdown for formatting.`;
      } else if (mode === 'test') {
        systemInstruction = `You are Shiksha AI, a test generator for ${studentClass}. Generate a test for the requested subject and chapter. The test MUST have:
        - 5 MCQs (1 mark each)
        - 6 Short Answer Questions (2 marks each)
        - 1 Long Answer Question (3 marks)
        Return the test in a structured JSON format: 
        { 
          "subject": "Subject Name",
          "chapter": "Chapter Name",
          "mcqs": [ { "question": "...", "options": ["A", "B", "C", "D"], "answer": "Correct Option" } ], 
          "shortAnswers": [ { "question": "...", "answer": "Expected Answer Key Points" } ], 
          "longAnswer": { "question": "...", "answer": "Expected Detailed Answer Key Points" } 
        }`;
      } else if (mode === 'evaluate') {
        systemInstruction = `You are Shiksha AI. Evaluate the student's answers for the test provided in the input. 
        The input contains the original test questions, expected answers, and the student's provided answers.
        Provide a score out of 20, a performance rating (e.g., Excellent, Good, Needs Improvement), and detailed solutions for each question.
        Return the evaluation in a structured JSON format:
        {
          "score": number,
          "performance": "string",
          "solutions": "Markdown string containing detailed solutions and feedback for each question"
        }`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: input,
        config: {
          systemInstruction,
          responseMimeType: (mode === 'test' || mode === 'evaluate') ? "application/json" : "text/plain",
        }
      });

      if (mode === 'plan') {
        setAiPlan(response.text || "Failed to generate plan.");
      } else if (mode === 'test' || mode === 'evaluate') {
        try {
          const jsonData = JSON.parse(response.text || '{}');
          if (mode === 'test') {
            setCurrentTest(jsonData);
            setTestAnswers({});
            setTestResult(null);
          } else {
            setTestResult(jsonData);
          }
        } catch (e) {
          console.error(`Failed to parse ${mode} JSON`, e);
          alert(`Failed to ${mode === 'test' ? 'generate' : 'evaluate'} test. Please try again.`);
        }
      } else {
        const aiMsg: ChatMessage = { role: 'model', text: response.text || "I'm sorry, I couldn't process that request." };
        setChatMessages(prev => [...prev, aiMsg]);
      }
    } catch (error: any) {
      console.error('AI Error:', error);
      let errorText = "Error connecting to AI.";
      const errorMessage = error.message || "";
      
      if (errorMessage.includes('API_KEY_MISSING')) {
        errorText = errorMessage;
      } else if (errorMessage.toLowerCase().includes('quota')) {
        errorText = "AI Quota exceeded for today. Please try again tomorrow.";
      } else if (errorMessage.toLowerCase().includes('api key not valid') || errorMessage.toLowerCase().includes('invalid api key')) {
        errorText = "Invalid Gemini API Key. Please check your key in Netlify settings and redeploy.";
      } else if (errorMessage.includes('API key') && !errorMessage.includes('MISSING')) {
        // If it's a generic API key error from the SDK
        errorText = `AI Configuration Error: ${errorMessage}`;
      } else if (errorMessage) {
        errorText = `AI Error: ${errorMessage}`;
      }
      
      if (mode === 'chat') {
        setChatMessages(prev => [...prev, { role: 'model', text: errorText }]);
      } else {
        alert(errorText);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

// --- Components ---

const CyberBackground = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&family=Michroma&family=Audiowide&family=Exo+2:wght@100;200;300;400;500;600;700;800;900&display=swap');
      
      :root {
        --font-orbitron: "Orbitron", sans-serif;
        --font-rajdhani: "Rajdhani", sans-serif;
        --font-space: "Space Grotesk", sans-serif;
        --font-michroma: "Michroma", sans-serif;
        --font-audiowide: "Audiowide", sans-serif;
        --font-exo: "Exo 2", sans-serif;
        
        --color-cyber-blue: #00f3ff;
        --color-cyber-pink: #ff00ff;
        --color-cyber-purple: #9d00ff;
        --color-cyber-green: #00ff9f;
      }

      body {
        background-color: #020617;
        color: #e2e8f0;
        font-family: var(--font-space);
        overflow-x: hidden;
        margin: 0;
      }

      .glass-panel {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
      }
      
      .cyber-button {
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
        clip-path: polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%);
      }
      .cyber-button:active { transform: scale(0.95); }
      
      .neon-text { text-shadow: 0 0 10px currentColor; }
      .neon-border { box-shadow: 0 0 15px currentColor; }

      .cyber-bg {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
        background: radial-gradient(circle at 50% 50%, #0a0a1a 0%, #020205 100%);
        overflow: hidden;
      }

      .cyber-grid {
        position: absolute;
        width: 200%;
        height: 200%;
        top: -50%;
        left: -50%;
        background-image: 
          linear-gradient(to right, rgba(0, 243, 255, 0.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0, 243, 255, 0.05) 1px, transparent 1px);
        background-size: 50px 50px;
        transform: perspective(500px) rotateX(60deg);
        animation: grid-move 20s linear infinite;
      }

      @keyframes grid-move {
        0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
        100% { transform: perspective(500px) rotateX(60deg) translateY(50px); }
      }

      .cyber-scanline {
        position: absolute;
        width: 100%;
        height: 100px;
        background: linear-gradient(to bottom, transparent, rgba(0, 243, 255, 0.1), transparent);
        top: -100px;
        animation: scanline 8s linear infinite;
      }

      @keyframes scanline {
        0% { top: -100px; }
        100% { top: 100%; }
      }

      .cyber-orb {
        position: absolute;
        width: 400px;
        height: 400px;
        border-radius: 50%;
        filter: blur(50px);
        animation: orb-float 15s ease-in-out infinite alternate;
      }

      @keyframes orb-float {
        0% { transform: translate(-10%, -10%); }
        100% { transform: translate(20%, 20%); }
      }

      .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 243, 255, 0.2); border-radius: 10px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 243, 255, 0.4); }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <div className="cyber-bg">
      <div className="cyber-grid" />
      <div className="cyber-scanline" />
      <div className="cyber-orb" style={{ top: '10%', left: '10%', background: 'radial-gradient(circle, rgba(0, 243, 255, 0.1) 0%, transparent 70%)' }} />
      <div className="cyber-orb" style={{ bottom: '10%', right: '10%', background: 'radial-gradient(circle, rgba(157, 0, 255, 0.1) 0%, transparent 70%)', animationDelay: '-5s' }} />
    </div>
  );
};

const LoginView: React.FC<LoginViewProps> = ({ handleLogin, isUploading, setView, setSignupType }) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loginRole, setLoginRole] = useState<UserRole>('student');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 font-space relative overflow-hidden">
      <CyberBackground />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel p-5 sm:p-8 rounded-3xl max-w-md w-full border-cyber-blue/20 relative z-10"
      >
        <div className="text-center mb-5 sm:mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="bg-cyber-blue/20 w-14 h-14 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-cyber-blue/40 shadow-[0_0_20px_rgba(0,243,255,0.3)]"
          >
            <GraduationCap className="text-cyber-blue w-8 h-8 sm:w-12 sm:h-12" />
          </motion.div>
          <h1 className="text-xl sm:text-4xl font-orbitron font-black text-white tracking-tighter neon-text mb-1 sm:mb-2">EDUHUB</h1>
          <p className="text-cyber-blue/70 font-rajdhani font-bold uppercase tracking-[0.2em] text-[8px] sm:text-sm">Neural Learning Interface</p>
        </div>

        <div className="flex gap-1 sm:gap-2 mb-6 sm:mb-8 p-1 bg-white/5 rounded-xl border border-white/10">
          {(['student', 'teacher', 'main-admin'] as const).map(r => (
            <button
              key={r}
              onClick={() => setLoginRole(r)}
              className={`flex-1 py-2 sm:py-2.5 text-[8px] sm:text-[10px] font-orbitron font-bold rounded-lg transition-all uppercase tracking-wider ${
                loginRole === r ? 'bg-cyber-blue text-black shadow-[0_0_15px_rgba(0,243,255,0.5)]' : 'text-white/50 hover:text-white/80'
              }`}
            >
              {r.replace('-', ' ')}
            </button>
          ))}
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-[8px] sm:text-[10px] font-orbitron font-bold text-cyber-blue/60 mb-1 sm:mb-2 ml-1 uppercase tracking-widest">
              {loginRole === 'student' ? 'Student ID' : loginRole === 'teacher' ? 'Teacher ID' : 'Admin Access'}
            </label>
            <div className="relative group">
              <User className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-cyber-blue/40 w-4 h-4 sm:w-5 sm:h-5 group-focus-within:text-cyber-blue transition-colors" />
              <input 
                type="text" 
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl focus:border-cyber-blue/50 focus:ring-1 focus:ring-cyber-blue/20 outline-none transition-all font-rajdhani text-base sm:text-lg tracking-wider text-white"
                placeholder={loginRole === 'student' ? "STU-XXXX" : loginRole === 'teacher' ? "TCH-XXXX" : "ADMIN_AUTH"}
              />
            </div>
          </div>

          <div>
            <label className="block text-[8px] sm:text-[10px] font-orbitron font-bold text-cyber-blue/60 mb-1 sm:mb-2 ml-1 uppercase tracking-widest">Security Key</label>
            <div className="relative group">
              <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-cyber-blue/40 w-4 h-4 sm:w-5 sm:h-5 group-focus-within:text-cyber-blue transition-colors" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl focus:border-cyber-blue/50 focus:ring-1 focus:ring-cyber-blue/20 outline-none transition-all font-rajdhani text-base sm:text-lg tracking-wider text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            onClick={() => handleLogin(loginId, password, loginRole)}
            disabled={isUploading}
            className="w-full cyber-button bg-cyber-blue hover:bg-white text-black font-orbitron font-black py-3.5 sm:py-5 rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.3)] transition-all mt-2 sm:mt-4 flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-tighter text-xs sm:text-base"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                Initializing...
              </>
            ) : (
              'Access System'
            )}
          </button>

          {loginRole !== 'main-admin' && (
            <p className="text-center text-[10px] sm:text-xs font-rajdhani font-bold text-white/40 mt-6 sm:mt-8 uppercase tracking-widest">
              New User?{' '}
              <button 
                onClick={() => { setSignupType(loginRole); setView('signup'); }} 
                className="text-cyber-blue hover:text-white transition-colors underline underline-offset-4"
              >
                Register Identity
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const SignupView: React.FC<SignupViewProps> = ({ handleSignup, setView, signupType, isUploading }) => {
    const [formData, setFormData] = useState({
      name: '',
      studentId: '',
      teacherId: '',
      class: 'Class 6',
      classes: [] as string[],
      subjects: [] as string[],
      mobile: '',
      password: '',
      role: signupType
    });

    const toggleMultiSelect = (field: 'classes' | 'subjects', value: string) => {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].includes(value) 
          ? prev[field].filter(v => v !== value)
          : [...prev[field], value]
      }));
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-6 font-space relative overflow-hidden">
        <CyberBackground />
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel p-5 sm:p-8 rounded-3xl max-w-2xl w-full border-cyber-purple/20 relative z-10"
        >
          <div className="flex justify-between items-center mb-5 sm:mb-8">
            <button onClick={() => setView('login')} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-all text-white/60">
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="text-right">
              <h2 className="text-lg sm:text-3xl font-orbitron font-black text-white tracking-tighter neon-text">REGISTRATION</h2>
              <p className="text-cyber-purple/70 font-rajdhani font-bold uppercase tracking-widest text-[8px] sm:text-[10px]">New {signupType} Profile</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-[8px] sm:text-[10px] font-orbitron font-bold text-cyber-purple/60 mb-1 sm:mb-2 uppercase tracking-widest">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl focus:border-cyber-purple/50 outline-none text-white font-rajdhani text-sm sm:text-base"
                  placeholder="John Doe"
                />
              </div>

              {formData.role === 'student' ? (
                <>
                  <div>
                    <label className="block text-[8px] sm:text-[10px] font-orbitron font-bold text-cyber-purple/60 mb-1 sm:mb-2 uppercase tracking-widest">Student ID</label>
                    <input
                      type="text"
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                      className="w-full px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl focus:border-cyber-purple/50 outline-none text-white font-rajdhani text-sm sm:text-base"
                      placeholder="STU123"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] sm:text-[10px] font-orbitron font-bold text-cyber-purple/60 mb-1 sm:mb-2 uppercase tracking-widest">Class</label>
                    <select
                      value={formData.class}
                      onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                      className="w-full px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl focus:border-cyber-purple/50 outline-none text-white font-rajdhani appearance-none text-sm sm:text-base"
                    >
                      {ALL_CLASSES.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-[8px] sm:text-[10px] font-orbitron font-bold text-cyber-purple/60 mb-1 sm:mb-2 uppercase tracking-widest">Teacher ID</label>
                    <input
                      type="text"
                      value={formData.teacherId}
                      onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                      className="w-full px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl focus:border-cyber-purple/50 outline-none text-white font-rajdhani text-sm sm:text-base"
                      placeholder="TCH123"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-[8px] sm:text-[10px] font-orbitron font-bold text-cyber-purple/60 mb-1 sm:mb-2 uppercase tracking-widest">Mobile Number</label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl focus:border-cyber-purple/50 outline-none text-white font-rajdhani text-sm sm:text-base"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>

              <div>
                <label className="block text-[8px] sm:text-[10px] font-orbitron font-bold text-cyber-purple/60 mb-1 sm:mb-2 uppercase tracking-widest">Security Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl focus:border-cyber-purple/50 outline-none text-white font-rajdhani text-sm sm:text-base"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {formData.role === 'teacher' && (
                <>
                  <div>
                    <label className="block text-[8px] sm:text-[10px] font-orbitron font-bold text-cyber-purple/60 mb-1 sm:mb-2 uppercase tracking-widest">Assigned Classes</label>
                    <div className="grid grid-cols-2 gap-2 max-h-32 sm:max-h-40 overflow-y-auto p-2 bg-white/5 rounded-xl border border-white/10">
                      {ALL_CLASSES.map(c => (
                        <button
                          key={c}
                          onClick={() => toggleMultiSelect('classes', c)}
                          className={`px-2 py-1.5 sm:px-3 sm:py-2 text-[8px] sm:text-[10px] font-orbitron font-bold rounded-lg transition-all ${
                            formData.classes.includes(c) 
                              ? 'bg-cyber-purple text-white shadow-[0_0_10px_rgba(157,0,255,0.3)]' 
                              : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[8px] sm:text-[10px] font-orbitron font-bold text-cyber-purple/60 mb-1 sm:mb-2 uppercase tracking-widest">Subjects</label>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {ALL_SUBJECTS.map(s => (
                        <button
                          key={s}
                          onClick={() => toggleMultiSelect('subjects', s)}
                          className={`px-2 py-1.5 sm:px-3 sm:py-2 text-[8px] sm:text-[10px] font-orbitron font-bold rounded-lg transition-all ${
                            formData.subjects.includes(s) 
                              ? 'bg-cyber-purple text-white shadow-[0_0_10px_rgba(157,0,255,0.3)]' 
                              : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <button 
                onClick={() => handleSignup({...formData, role: signupType})}
                disabled={isUploading}
                className="w-full cyber-button bg-cyber-purple hover:bg-white text-white hover:text-black font-orbitron font-black py-3.5 sm:py-5 rounded-xl shadow-[0_0_20px_rgba(157,0,255,0.3)] transition-all mt-4 sm:mt-6 flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-tighter text-xs sm:text-base"
              >
                {isUploading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : 'Initialize Profile'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };






const StudentDashboard = ({ 
  currentUser, setCurrentUser, resources, notices, studentView, setStudentView, 
  activeTab, setActiveTab, selectedSubjectFilter, setSelectedSubjectFilter, 
  selfStudyTab, setSelfStudyTab, aiPlan, setAiPlan, aiPlanDetails, 
  setAiPlanDetails, isAiLoading, handleAiAsk, currentTest, 
  setCurrentTest, testAnswers, setTestAnswers, testResult, 
  setTestResult, chatMessages, aiInput, setAiInput, 
  chatEndRef, setSelectedResource 
}: StudentDashboardProps) => {
    const student = currentUser as UserData;
    const studentSubjects = CLASS_SUBJECTS[student.class!] || [];
    const filteredResources = resources.filter(r => 
      r.className === student.class && 
      r.type === activeTab && 
      (!selectedSubjectFilter || r.subject === selectedSubjectFilter)
    );

    if (studentView === 'main') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto py-10 sm:py-20">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setStudentView('school')}
            className="glass-panel p-8 sm:p-12 rounded-[40px] border-2 border-cyber-blue/20 hover:border-cyber-blue transition-all flex flex-col items-center justify-center gap-6 group relative overflow-hidden h-[200px] sm:h-[300px]"
          >
            <div className="absolute inset-0 bg-cyber-blue/5 group-hover:bg-cyber-blue/10 transition-all" />
            <div className="bg-cyber-blue/20 p-6 rounded-3xl border border-cyber-blue/40 shadow-[0_0_20px_rgba(0,243,255,0.2)] group-hover:shadow-[0_0_30px_rgba(0,243,255,0.4)] transition-all">
              <GraduationCap className="w-12 h-12 sm:w-16 sm:h-16 text-cyber-blue" />
            </div>
            <h3 className="font-orbitron font-black text-white text-xl sm:text-3xl uppercase tracking-tighter neon-text">School Study</h3>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setStudentView('self')}
            className="glass-panel p-8 sm:p-12 rounded-[40px] border-2 border-cyber-purple/20 hover:border-cyber-purple transition-all flex flex-col items-center justify-center gap-6 group relative overflow-hidden h-[200px] sm:h-[300px]"
          >
            <div className="absolute inset-0 bg-cyber-purple/5 group-hover:bg-cyber-purple/10 transition-all" />
            <div className="bg-cyber-purple/20 p-6 rounded-3xl border border-cyber-purple/40 shadow-[0_0_20px_rgba(157,0,255,0.2)] group-hover:shadow-[0_0_30px_rgba(157,0,255,0.4)] transition-all">
              <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-cyber-purple" />
            </div>
            <h3 className="font-orbitron font-black text-white text-xl sm:text-3xl uppercase tracking-tighter neon-text-purple">Self Study</h3>
          </motion.button>
        </div>
      );
    }

    if (studentView === 'school') {
      return (
        <div className="space-y-6 sm:space-y-8">
          <div className="flex items-center justify-between">
            <button onClick={() => setStudentView('main')} className="flex items-center gap-2 text-white/40 hover:text-cyber-blue transition-all font-orbitron font-bold text-xs uppercase tracking-widest">
              <ChevronLeft className="w-4 h-4" /> Back to Portal
            </button>
            <h3 className="font-orbitron font-black text-white text-lg sm:text-xl uppercase tracking-tighter">School Study</h3>
          </div>

          <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {[
                { id: 'video', label: 'Videos', icon: Video, color: 'bg-red-500/20 text-red-400' },
                { id: 'note', label: 'Notes', icon: FileText, color: 'bg-cyber-blue/20 text-cyber-blue' },
              ].map(box => (
                <button
                  key={box.id}
                  onClick={() => setActiveTab(box.id as any)}
                  className={`p-4 sm:p-8 rounded-3xl border transition-all flex flex-col items-center justify-center gap-2 sm:gap-4 ${activeTab === box.id ? 'border-cyber-blue bg-cyber-blue/10 shadow-[0_0_15px_rgba(0,243,255,0.2)]' : 'glass-panel border-white/10 hover:border-white/20'}`}
                >
                  <div className={`p-2 sm:p-4 rounded-xl sm:rounded-2xl ${box.color}`}>
                    <box.icon className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <span className="font-orbitron font-bold text-white text-[10px] sm:text-sm uppercase tracking-wider">{box.label}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {[
                { id: 'question', label: 'Practice', icon: HelpCircle, color: 'bg-amber-500/20 text-amber-400' },
                { id: 'notice', label: 'Notices', icon: AlertCircle, color: 'bg-cyber-purple/20 text-cyber-purple' },
              ].map(box => (
                <button
                  key={box.id}
                  onClick={() => setActiveTab(box.id as any)}
                  className={`p-4 sm:p-8 rounded-3xl border transition-all flex flex-col items-center justify-center gap-2 sm:gap-4 ${activeTab === box.id ? 'border-cyber-blue bg-cyber-blue/10 shadow-[0_0_15px_rgba(0,243,255,0.2)]' : 'glass-panel border-white/10 hover:border-white/20'}`}
                >
                  <div className={`p-2 sm:p-4 rounded-xl sm:rounded-2xl ${box.color}`}>
                    <box.icon className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <span className="font-orbitron font-bold text-white text-[10px] sm:text-sm uppercase tracking-wider">{box.label}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-center">
              {[
                { id: 'profile', label: 'Profile', icon: User, color: 'bg-emerald-500/20 text-emerald-400' },
              ].map(box => (
                <button
                  key={box.id}
                  onClick={() => setActiveTab(box.id as any)}
                  className={`w-1/2 p-4 sm:p-8 rounded-3xl border transition-all flex flex-col items-center justify-center gap-2 sm:gap-4 ${activeTab === box.id ? 'border-cyber-blue bg-cyber-blue/10 shadow-[0_0_15px_rgba(0,243,255,0.2)]' : 'glass-panel border-white/10 hover:border-white/20'}`}
                >
                  <div className={`p-2 sm:p-4 rounded-xl sm:rounded-2xl ${box.color}`}>
                    <box.icon className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <span className="font-orbitron font-bold text-white text-[10px] sm:text-sm uppercase tracking-wider">{box.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-12">
            {activeTab === 'profile' ? (
              <ProfileSection 
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                resources={resources}
                setEditingResource={() => {}}
                setResourceForm={() => {}}
                setShowResourceForm={() => {}}
                handleDeleteResource={() => {}}
                setSelectedResource={setSelectedResource}
              />
            ) : activeTab === 'notice' ? (
              <div className="space-y-6">
                <h3 className="text-lg sm:text-xl font-orbitron font-black text-white tracking-tighter uppercase">Notices & Updates</h3>
                <div className="grid grid-cols-1 gap-4">
                  {notices.filter(n => n.type === 'school' || n.subject === selectedSubjectFilter || n.subject === 'All Subjects' || n.className === 'All Classes' || n.className === student.class).map(n => (
                    <NoticeCard key={n.id} notice={n} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 no-scrollbar">
                  <button 
                    onClick={() => setSelectedSubjectFilter(null)}
                    className={`px-4 sm:px-6 py-2 rounded-full text-[10px] sm:text-sm font-orbitron font-bold whitespace-nowrap transition-all uppercase tracking-wider ${!selectedSubjectFilter ? 'bg-cyber-blue text-black shadow-[0_0_10px_rgba(0,243,255,0.3)]' : 'bg-white/5 text-white/40 border border-white/10'}`}
                  >
                    All Subjects
                  </button>
                  {studentSubjects.map(sub => (
                    <button 
                      key={sub}
                      onClick={() => setSelectedSubjectFilter(sub)}
                      className={`px-4 sm:px-6 py-2 rounded-full text-[10px] sm:text-sm font-orbitron font-bold whitespace-nowrap transition-all uppercase tracking-wider ${selectedSubjectFilter === sub ? 'bg-cyber-blue text-black shadow-[0_0_10px_rgba(0,243,255,0.3)]' : 'bg-white/5 text-white/40 border border-white/10'}`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredResources.map(res => (
                    <ResourceCard key={res.id} resource={res} setSelectedResource={setSelectedResource} />
                  ))}
                  {filteredResources.length === 0 && (
                    <div className="col-span-full py-12 sm:py-20 text-center glass-panel rounded-3xl border border-dashed border-white/10">
                      <Search className="w-10 h-10 sm:w-12 sm:h-12 text-white/20 mx-auto mb-4" />
                      <p className="text-white/40 font-orbitron font-bold text-xs sm:text-sm uppercase tracking-widest">No resources found for this subject.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (studentView === 'self') {
      return (
        <div className="space-y-6 sm:space-y-8">
          <div className="flex items-center justify-between">
            <button onClick={() => setStudentView('main')} className="flex items-center gap-2 text-white/40 hover:text-cyber-purple transition-all font-orbitron font-bold text-xs uppercase tracking-widest">
              <ChevronLeft className="w-4 h-4" /> Back to Portal
            </button>
            <h3 className="font-orbitron font-black text-white text-lg sm:text-xl uppercase tracking-tighter">Self Study</h3>
          </div>

          <div className="flex gap-2 sm:gap-4 p-1 bg-white/5 rounded-2xl border border-white/10">
            {[
              { id: 'progress', label: 'Study Progress', icon: TrendingUp },
              { id: 'test', label: 'Test Series', icon: HelpCircle },
              { id: 'ai', label: 'AI Assistance', icon: Sparkles },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelfStudyTab(tab.id as any)}
                className={`flex-1 py-3 sm:py-4 rounded-xl font-orbitron font-bold transition-all text-[10px] sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 ${selfStudyTab === tab.id ? 'bg-cyber-purple text-white shadow-[0_0_15px_rgba(157,0,255,0.3)]' : 'text-white/40 hover:text-white/60'}`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="glass-panel p-6 sm:p-10 rounded-[40px] border border-white/10 min-h-[400px]">
            {selfStudyTab === 'progress' && (
              <div className="space-y-8">
                {!aiPlan ? (
                  <div className="max-w-2xl mx-auto space-y-8">
                    <div className="text-center space-y-4">
                      <div className="bg-cyber-purple/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto border border-cyber-purple/40">
                        <Sparkles className="w-10 h-10 text-cyber-purple" />
                      </div>
                      <h4 className="text-2xl font-orbitron font-black text-white uppercase tracking-tighter">Generate Your Study Plan</h4>
                      <p className="text-white/60 font-rajdhani text-lg">Shiksha AI will create a personalized monthly plan and weekly timetable based on your class and subjects.</p>
                    </div>

                    <div className="space-y-6 bg-white/5 p-8 rounded-[32px] border border-white/10">
                      <div className="space-y-2">
                        <label className="text-[10px] font-orbitron font-bold text-white/40 uppercase tracking-widest">Current Study Status</label>
                        <textarea 
                          placeholder="e.g., I've completed 2 chapters of Maths, struggling with Science..."
                          className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-white font-rajdhani outline-none focus:border-cyber-purple/50"
                          value={aiPlanDetails.status}
                          onChange={(e) => setAiPlanDetails({ ...aiPlanDetails, status: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-orbitron font-bold text-white/40 uppercase tracking-widest">Study Hours / Day</label>
                          <input 
                            type="number"
                            placeholder="e.g., 4"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none text-white font-rajdhani"
                            value={aiPlanDetails.hours}
                            onChange={(e) => setAiPlanDetails({ ...aiPlanDetails, hours: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-orbitron font-bold text-white/40 uppercase tracking-widest">Monthly Goal</label>
                          <input 
                            type="text"
                            placeholder="e.g., Complete half syllabus"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none text-white font-rajdhani"
                            value={aiPlanDetails.goals}
                            onChange={(e) => setAiPlanDetails({ ...aiPlanDetails, goals: e.target.value })}
                          />
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const prompt = `
                            Student Details:
                            - Current Status: ${aiPlanDetails.status}
                            - Study Hours: ${aiPlanDetails.hours} hours/day
                            - Goals: ${aiPlanDetails.goals}
                          `;
                          handleAiAsk('plan', prompt);
                        }}
                        disabled={isAiLoading || !aiPlanDetails.status || !aiPlanDetails.hours}
                        className="w-full cyber-button bg-cyber-purple text-white px-10 py-4 rounded-2xl font-orbitron font-black uppercase tracking-tighter flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {isAiLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
                        Generate Neural Plan
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xl font-orbitron font-black text-cyber-purple uppercase tracking-tighter">Your Personalized Study Plan</h4>
                      <button onClick={() => setAiPlan(null)} className="text-white/40 hover:text-white transition-all text-xs font-orbitron font-bold uppercase tracking-widest">Regenerate</button>
                    </div>
                    <div className="prose prose-invert max-w-none bg-white/5 p-6 sm:p-8 rounded-3xl border border-white/10">
                      <ReactMarkdown>{aiPlan}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selfStudyTab === 'test' && (
              <div className="space-y-8">
                {!currentTest ? (
                  <div className="max-w-xl mx-auto space-y-6">
                    <div className="text-center space-y-4">
                      <div className="bg-amber-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto border border-amber-500/40">
                        <HelpCircle className="w-10 h-10 text-amber-400" />
                      </div>
                      <h4 className="text-2xl font-orbitron font-black text-white uppercase tracking-tighter">Neural Test Series</h4>
                      <p className="text-white/60 font-rajdhani text-lg">Select a subject and chapter to generate a comprehensive test.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-orbitron font-bold text-white/40 uppercase tracking-widest">Subject</label>
                        <select id="test-subject" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none text-white font-rajdhani">
                          {studentSubjects.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-orbitron font-bold text-white/40 uppercase tracking-widest">Chapter Name</label>
                        <input id="test-chapter" type="text" placeholder="Enter chapter name..." className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none text-white font-rajdhani" />
                      </div>
                      <button 
                        onClick={() => {
                          const sub = (document.getElementById('test-subject') as HTMLSelectElement).value;
                          const chap = (document.getElementById('test-chapter') as HTMLInputElement).value;
                          if (!chap) return alert('Please enter chapter name');
                          handleAiAsk('test', `Subject: ${sub}, Chapter: ${chap}`);
                        }}
                        disabled={isAiLoading}
                        className="w-full cyber-button bg-amber-500 text-black px-10 py-4 rounded-2xl font-orbitron font-black uppercase tracking-tighter flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {isAiLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6" />}
                        Initialize Assessment
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center border-b border-white/10 pb-6">
                      <div>
                        <h4 className="text-xl font-orbitron font-black text-amber-400 uppercase tracking-tighter">{currentTest.subject}</h4>
                        <p className="text-white/40 font-rajdhani text-sm uppercase tracking-widest">Chapter: {currentTest.chapter}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-orbitron font-black text-white">20 Marks</p>
                        <p className="text-[10px] font-rajdhani font-bold text-white/40 uppercase tracking-widest">Total Weightage</p>
                      </div>
                    </div>

                    <div className="space-y-10">
                      {/* MCQs */}
                      <div className="space-y-6">
                        <h5 className="font-orbitron font-bold text-white uppercase tracking-widest text-sm border-l-4 border-cyber-blue pl-4">Section A: MCQs (1 Mark Each)</h5>
                        {currentTest.mcqs.map((q: any, i: number) => (
                          <div key={i} className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/5">
                            <p className="text-white font-rajdhani text-lg"><span className="text-cyber-blue font-bold mr-2">Q{i+1}.</span> {q.question}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {q.options.map((opt: string, j: number) => (
                                <button 
                                  key={j}
                                  onClick={() => setTestAnswers({ ...testAnswers, [i]: opt })}
                                  className={`px-4 py-3 rounded-xl font-rajdhani text-left transition-all border ${testAnswers[i] === opt ? 'bg-cyber-blue/20 border-cyber-blue text-white' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'}`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Short Answers */}
                      <div className="space-y-6">
                        <h5 className="font-orbitron font-bold text-white uppercase tracking-widest text-sm border-l-4 border-cyber-purple pl-4">Section B: Short Answers (2 Marks Each)</h5>
                        {currentTest.shortAnswers.map((q: any, i: number) => (
                          <div key={i} className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/5">
                            <p className="text-white font-rajdhani text-lg"><span className="text-cyber-purple font-bold mr-2">Q{i+6}.</span> {q.question}</p>
                            <textarea 
                              placeholder="Type your answer here..."
                              className="w-full h-32 bg-slate-900/80 border border-white/20 rounded-xl p-4 text-white font-rajdhani outline-none focus:border-cyber-purple/50 shadow-inner"
                              value={testAnswers[i+5] || ''}
                              onChange={(e) => setTestAnswers({ ...testAnswers, [i+5]: e.target.value })}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Long Answer */}
                      <div className="space-y-6">
                        <h5 className="font-orbitron font-bold text-white uppercase tracking-widest text-sm border-l-4 border-amber-500 pl-4">Section C: Long Answer (3 Marks)</h5>
                        <div className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/5">
                          <p className="text-white font-rajdhani text-lg"><span className="text-amber-500 font-bold mr-2">Q12.</span> {currentTest.longAnswer.question}</p>
                          <textarea 
                            placeholder="Type your detailed answer here..."
                            className="w-full h-64 bg-slate-900/80 border border-white/20 rounded-xl p-4 text-white font-rajdhani outline-none focus:border-amber-500/50 shadow-inner"
                            value={testAnswers[11] || ''}
                            onChange={(e) => setTestAnswers({ ...testAnswers, 11: e.target.value })}
                          />
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          const evaluationPrompt = `
                            Test Data: ${JSON.stringify(currentTest)}
                            Student Answers: ${JSON.stringify(testAnswers)}
                          `;
                          handleAiAsk('evaluate', evaluationPrompt);
                        }}
                        disabled={isAiLoading}
                        className="w-full cyber-button bg-emerald-500 text-black px-10 py-5 rounded-2xl font-orbitron font-black uppercase tracking-tighter flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
                      >
                        {isAiLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                        Submit Neural Assessment
                      </button>
                    </div>
                  </div>
                )}

                {testResult && (
                  <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[60] flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="glass-panel w-full max-w-4xl max-h-[90vh] rounded-[40px] border border-white/10 flex flex-col overflow-hidden"
                    >
                      <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <h3 className="text-2xl font-orbitron font-black text-white uppercase tracking-tighter">Assessment Result</h3>
                        <button onClick={() => { setTestResult(null); setCurrentTest(null); setTestAnswers({}); }} className="p-2 hover:bg-white/10 rounded-full transition-all text-white/40"><X className="w-6 h-6" /></button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                          <div className="glass-panel p-6 rounded-3xl border border-white/10 text-center">
                            <p className="text-4xl font-orbitron font-black text-cyber-blue">{testResult.score}/20</p>
                            <p className="text-[10px] font-orbitron font-bold text-white/40 uppercase tracking-widest mt-2">Total Score</p>
                          </div>
                          <div className="glass-panel p-6 rounded-3xl border border-white/10 text-center">
                            <p className="text-4xl font-orbitron font-black text-cyber-purple">{Math.round((testResult.score/20)*100)}%</p>
                            <p className="text-[10px] font-orbitron font-bold text-white/40 uppercase tracking-widest mt-2">Accuracy</p>
                          </div>
                          <div className="glass-panel p-6 rounded-3xl border border-white/10 text-center">
                            <p className="text-xl font-orbitron font-bold text-emerald-400 uppercase">{testResult.performance}</p>
                            <p className="text-[10px] font-orbitron font-bold text-white/40 uppercase tracking-widest mt-2">Performance</p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <h4 className="text-lg font-orbitron font-black text-white uppercase tracking-widest border-l-4 border-cyber-blue pl-4">Detailed Solutions</h4>
                          <div className="prose prose-invert max-w-none bg-white/5 p-6 rounded-3xl border border-white/10">
                            <ReactMarkdown>{testResult.solutions}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                      <div className="p-8 bg-white/5 border-t border-white/10 flex justify-end">
                        <button 
                          onClick={() => { setTestResult(null); setCurrentTest(null); setTestAnswers({}); }}
                          className="cyber-button px-10 py-4 bg-cyber-blue text-black rounded-2xl font-orbitron font-black uppercase tracking-tighter"
                        >
                          Close Assessment
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
            )}

            {selfStudyTab === 'ai' && (
              <div className="h-full flex flex-col space-y-6">
                <div className="text-center space-y-2">
                  <h4 className="text-2xl font-orbitron font-black text-white uppercase tracking-tighter">AI Assistance</h4>
                  <p className="text-white/40 font-rajdhani uppercase tracking-widest text-xs">Direct Neural Link with Shiksha AI</p>
                </div>
                
                <div className="flex-1 glass-panel rounded-3xl border border-white/10 overflow-hidden flex flex-col h-[500px]">
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/30 custom-scrollbar">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-cyber-purple text-white rounded-tr-none' : 'bg-white/10 text-white rounded-tl-none border border-white/10'}`}>
                          <div className="text-sm font-rajdhani leading-relaxed prose prose-invert max-w-none">
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ))}
                    {isAiLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white/10 p-3 rounded-2xl rounded-tl-none flex items-center gap-2 border border-white/10">
                          <Loader2 className="w-3 h-3 animate-spin text-cyber-blue" />
                          <span className="text-xs font-rajdhani text-white/50">Processing...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-4 bg-white/5 border-t border-white/10">
                    <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Ask Shiksha AI anything..."
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-cyber-blue/50 text-white font-rajdhani"
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAiAsk('chat')}
                    />
                      <button 
                        onClick={() => handleAiAsk('chat')}
                        disabled={isAiLoading || !aiInput.trim()}
                        className="bg-cyber-blue text-black p-3 rounded-xl hover:bg-white transition-all disabled:opacity-50"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
};

const DashboardView = ({ 
  currentUser, 
  setCurrentUser,
  handleLogout, 
  showResourceForm, 
  setShowResourceForm, 
  showNoticeForm, 
  setShowNoticeForm, 
  users, 
  resources, 
  notices, 
  handleDeleteUser, 
  handleDeleteResource, 
  handleDeleteNotice, 
  studentView, 
  setStudentView, 
  activeTab, 
  setActiveTab, 
  selectedSubjectFilter, 
  setSelectedSubjectFilter, 
  selfStudyTab, 
  setSelfStudyTab, 
  aiPlan, 
  setAiPlan, 
  aiPlanDetails, 
  setAiPlanDetails, 
  isAiLoading, 
  handleAiAsk, 
  currentTest, 
  setCurrentTest, 
  testAnswers, 
  setTestAnswers, 
  testResult, 
  setTestResult, 
  chatMessages, 
  aiInput, 
  setAiInput, 
  chatEndRef, 
  onSelectResource, 
  adminUserTab, 
  setAdminUserTab,
  setSelectedResource,
  setEditingResource,
  setResourceForm
}: DashboardViewProps) => (
  <div className="min-h-screen flex flex-col font-space relative overflow-hidden">
    <CyberBackground />
    <nav className="glass-panel border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="bg-cyber-blue/20 p-2 rounded-xl border border-cyber-blue/40 shadow-[0_0_10px_rgba(0,243,255,0.2)]">
          <GraduationCap className="text-cyber-blue w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div>
          <h2 className="font-orbitron font-black text-white leading-tight uppercase tracking-tighter text-lg sm:text-2xl neon-text">EDUHUB</h2>
          <p className="text-[8px] sm:text-[10px] font-rajdhani font-bold text-cyber-blue/60 uppercase tracking-widest">{currentUser?.role}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:block text-right">
          <p className="text-sm font-orbitron font-bold text-white uppercase tracking-wider">{currentUser?.name}</p>
          <p className="text-[10px] font-rajdhani font-bold text-white/40 uppercase tracking-widest">{currentUser?.studentId || currentUser?.teacherId || currentUser?.email}</p>
        </div>
        <button onClick={handleLogout} className="p-2.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>

    <main className="max-w-7xl mx-auto p-4 sm:p-6 flex-1">
      {currentUser?.role === 'main-admin' && (
        <MainAdminDashboard 
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          users={users}
          resources={resources}
          notices={notices}
          handleDeleteUser={handleDeleteUser}
          handleDeleteResource={handleDeleteResource}
          handleDeleteNotice={handleDeleteNotice}
          setShowResourceForm={setShowResourceForm}
          setShowNoticeForm={setShowNoticeForm}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          adminUserTab={adminUserTab}
          setAdminUserTab={setAdminUserTab}
          setSelectedResource={setSelectedResource}
          setEditingResource={setEditingResource}
          setResourceForm={setResourceForm}
        />
      )}
      {currentUser?.role === 'teacher' && (
        <TeacherDashboard 
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          resources={resources}
          notices={notices}
          handleDeleteResource={handleDeleteResource}
          handleDeleteNotice={handleDeleteNotice}
          setShowResourceForm={setShowResourceForm}
          setShowNoticeForm={setShowNoticeForm}
          setSelectedResource={setSelectedResource}
          setEditingResource={setEditingResource}
          setResourceForm={setResourceForm}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}
      {currentUser?.role === 'student' && (
        <StudentDashboard 
          currentUser={currentUser}
          resources={resources}
          notices={notices}
          studentView={studentView}
          setStudentView={setStudentView}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedSubjectFilter={selectedSubjectFilter}
          setSelectedSubjectFilter={setSelectedSubjectFilter}
          selfStudyTab={selfStudyTab}
          setSelfStudyTab={setSelfStudyTab}
          aiPlan={aiPlan}
          setAiPlan={setAiPlan}
          aiPlanDetails={aiPlanDetails}
          setAiPlanDetails={setAiPlanDetails}
          isAiLoading={isAiLoading}
          handleAiAsk={handleAiAsk}
          currentTest={currentTest}
          setCurrentTest={setCurrentTest}
          testAnswers={testAnswers}
          setTestAnswers={setTestAnswers}
          testResult={testResult}
          setTestResult={setTestResult}
          chatMessages={chatMessages}
          aiInput={aiInput}
          setAiInput={setAiInput}
          chatEndRef={chatEndRef}
          setSelectedResource={setSelectedResource}
          setCurrentUser={setCurrentUser}
        />
      )}
    </main>
  </div>
);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-cyber-blue/30 selection:text-cyber-blue">
      <AnimatePresence mode="wait">
        {view === 'login' && (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoginView 
              handleLogin={handleLogin}
              isUploading={isUploading}
              setView={setView}
              setSignupType={setSignupType}
            />
          </motion.div>
        )}
        {view === 'signup' && (
          <motion.div key="signup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SignupView 
              handleSignup={handleSignup}
              setView={setView}
              signupType={signupType}
              isUploading={isUploading}
            />
          </motion.div>
        )}
        {view === 'dashboard' && (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DashboardView 
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              handleLogout={handleLogout}
              showResourceForm={showResourceForm}
              setShowResourceForm={setShowResourceForm}
              showNoticeForm={showNoticeForm}
              setShowNoticeForm={setShowNoticeForm}
              users={allUsers}
              resources={resources}
              notices={notices}
              handleDeleteUser={async (id) => {
                if (window.confirm('Delete this user?')) {
                  await deleteDoc(doc(db, 'users', id));
                }
              }}
              handleDeleteResource={handleDeleteResource}
              handleDeleteNotice={async (id) => {
                if (window.confirm('Delete this notice?')) {
                  await deleteDoc(doc(db, 'notices', id));
                }
              }}
              studentView={studentView}
              setStudentView={setStudentView}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              selectedSubjectFilter={selectedSubjectFilter}
              setSelectedSubjectFilter={setSelectedSubjectFilter}
              selfStudyTab={selfStudyTab}
              setSelfStudyTab={setSelfStudyTab}
              aiPlan={aiPlan}
              setAiPlan={setAiPlan}
              aiPlanDetails={aiPlanDetails}
              setAiPlanDetails={setAiPlanDetails}
              isAiLoading={isAiLoading}
              handleAiAsk={handleAiAsk}
              currentTest={currentTest}
              setCurrentTest={setCurrentTest}
              testAnswers={testAnswers}
              setTestAnswers={setTestAnswers}
              testResult={testResult}
              setTestResult={setTestResult}
              chatMessages={chatMessages}
              aiInput={aiInput}
              setAiInput={setAiInput}
              chatEndRef={chatEndRef}
              onSelectResource={(res) => setSelectedResource(res)}
              adminUserTab={adminUserTab}
              setAdminUserTab={setAdminUserTab}
              setSelectedResource={setSelectedResource}
              setEditingResource={setEditingResource}
              setResourceForm={setResourceForm}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Modals */}
      <AnimatePresence>
        {selectedResource && (
          <ResourceModal resource={selectedResource} onClose={() => setSelectedResource(null)} />
        )}
        {selectedNotice && (
          <NoticeModal notice={selectedNotice} onClose={() => setSelectedNotice(null)} />
        )}
        {showResourceForm && (
          <ResourceForm 
            onClose={() => { setShowResourceForm(false); setEditingResource(null); }} 
            resourceForm={resourceForm}
            setResourceForm={setResourceForm}
            handleAddResource={handleAddResource}
            isUploading={isUploading}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            editingResource={editingResource}
            currentUser={currentUser}
          />
        )}
        {showNoticeForm && (
          <NoticeForm 
            onClose={() => setShowNoticeForm(false)} 
            noticeForm={noticeForm}
            setNoticeForm={setNoticeForm}
            handleAddNotice={handleAddNotice}
            isUploading={isUploading}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            currentUser={currentUser}
          />
        )}
      </AnimatePresence>

      {/* AI Helper Floating Button */}
      {view === 'dashboard' && currentUser?.role === 'student' && (
        <button 
          onClick={() => setShowAiHelper(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-cyber-purple rounded-full shadow-[0_0_20px_rgba(157,0,255,0.5)] flex items-center justify-center text-white z-40 hover:scale-110 transition-all group"
        >
          <Sparkles className="w-8 h-8 group-hover:rotate-12 transition-transform" />
          <div className="absolute -top-12 right-0 bg-white text-black px-3 py-1 rounded-lg text-[10px] font-orbitron font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            ASK SHIKSHA AI
          </div>
        </button>
      )}

      {/* AI Helper Modal */}
      <AnimatePresence>
        {showAiHelper && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-panel w-full max-w-2xl h-[80vh] rounded-[40px] border border-white/10 flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="bg-cyber-purple/20 p-2 rounded-xl border border-cyber-purple/40">
                    <Sparkles className="text-cyber-purple w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-orbitron font-black text-white uppercase tracking-tighter">Shiksha AI Helper</h3>
                </div>
                <button onClick={() => setShowAiHelper(false)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white/40"><X className="w-6 h-6" /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-950/30">
                {chatMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                    <Cpu className="w-16 h-16" />
                    <p className="font-orbitron font-bold text-sm uppercase tracking-widest">How can I help you today?</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-cyber-purple text-white rounded-tr-none' : 'bg-white/10 text-white rounded-tl-none border border-white/10'}`}>
                      <div className="text-sm font-rajdhani leading-relaxed prose prose-invert max-w-none">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 p-3 rounded-2xl rounded-tl-none flex items-center gap-2 border border-white/10">
                      <Loader2 className="w-3 h-3 animate-spin text-cyber-blue" />
                      <span className="text-xs font-rajdhani text-white/50">Processing...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 bg-white/5 border-t border-white/10">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Ask anything about your studies..."
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-cyber-purple/50 text-white font-rajdhani"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAiAsk('chat')}
                  />
                  <button 
                    onClick={() => handleAiAsk('chat')}
                    disabled={isAiLoading || !aiInput.trim()}
                    className="bg-cyber-purple text-white p-3 rounded-xl hover:bg-white hover:text-black transition-all disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="py-10 text-center border-t border-white/5 mt-auto">
        <p className="text-[10px] font-orbitron font-bold text-white/20 uppercase tracking-[0.5em]">
          Powered by Neural Learning Systems &copy; 2024
        </p>
      </footer>
    </div>
  );
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
