import React, { useState } from 'react';
import { ArrowLeft, Info } from 'lucide-react';

interface ExamInstructionsProps {
  candidateName: string;
  profilePic: string;
  loginId: string;
  onProceed: (language: string) => void;
  onBack: () => void;
}

export const ExamInstructions: React.FC<ExamInstructionsProps> = ({
  candidateName, profilePic, loginId, onProceed, onBack
}) => {
  const [stage, setStage] = useState<'instructions' | 'declaration'>('instructions');
  const [selectedLang, setSelectedLang] = useState('');
  const [agreed, setAgreed] = useState(false);

  const headingText = "NATIONAL ENTRANCE SCREENING TEST - NEST 2026";

  if (stage === 'instructions') {
    return (
      <div className="min-h-screen bg-slate-900 border-t-8 border-cyan-800 text-slate-100 font-sans flex flex-col md:flex-row shadow-2xl overflow-hidden">
        {/* Main instructions content */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto max-h-[85vh] md:max-h-screen custom-scrollbar bg-slate-900/60">
          <div className="border-b border-slate-800 pb-4 mb-6">
            <h1 className="text-xl md:text-2xl font-orbitron font-extrabold text-cyber-blue uppercase tracking-tight">{headingText}</h1>
            <p className="text-xs text-slate-400 font-bold uppercase mt-1">Read general instructions and layout definitions carefully</p>
          </div>

          <div className="space-y-6 text-sm text-slate-300 leading-relaxed max-w-4xl">
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
              <Info className="w-5 h-5 text-cyber-blue shrink-0 animate-bounce" />
              <span className="font-orbitron font-bold text-xs uppercase tracking-wider text-cyber-blue">General Guidelines Checklist</span>
            </div>

            <ol className="list-decimal list-inside space-y-4 pl-2 font-medium">
              <li>
                <span className="font-bold text-slate-100">Total duration of the examination is 180 Minutes.</span> The clock will be set at the server. A countdown timer in the top right corner of the screen will display the remaining time available for you to answer. When the timer reaches zero, the examination will automatically auto-save and terminate.
              </li>
              <li>
                The Question Palette displayed on the right side of screen will show the status of each question using one of the following symbols:
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-white/20 border border-slate-400 rounded-sm flex items-center justify-center text-slate-300 text-xs font-bold font-mono">1</span>
                    <span className="text-xs text-slate-400 uppercase font-semibold">You have not visited the question yet.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-red-600 rounded-b-2xl rounded-t-sm flex items-center justify-center text-white text-xs font-bold font-mono">2</span>
                    <span className="text-xs text-slate-400 uppercase font-semibold">You have not answered the question.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-green-500 rounded-t-2xl rounded-b-sm flex items-center justify-center text-white text-xs font-bold font-mono font-sans">3</span>
                    <span className="text-xs text-slate-400 uppercase font-semibold">You have answered the question.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold font-mono">4</span>
                    <span className="text-xs text-slate-400 uppercase font-semibold">You have marked the question for review.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold relative font-mono">5<span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full flex items-center justify-center text-[8px] text-slate-900 border border-slate-900">✔</span></span>
                    <span className="text-xs text-slate-400 uppercase font-semibold text-left">Answered & Marked for Review (will be evaluated).</span>
                  </div>
                </div>
              </li>
              <li>
                You can click on the section headers displayed at the top bar to switch between subjects (Physics, Chemistry, Maths, Biology) at any point during the stipulated examination time.
              </li>
              <li>
                To submit an answer, you must select one of the interactive option bubbles and click <span className="font-bold text-cyber-blue bg-cyber-blue/10 px-2 py-0.5 rounded">Save & Next</span>. Alternatively, click <span className="font-bold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded">Mark for Review & Next</span> to flag it.
              </li>
              <li>
                A fully functional virtual Scientific Calculator is available on the top bar of the screen to perform complex scientific operations and calculations.
              </li>
            </ol>
          </div>

          <div className="mt-12 flex justify-between gap-4 border-t border-slate-800 pt-6">
            <button 
              onClick={onBack}
              className="px-6 py-3 border border-slate-700 bg-slate-950 text-slate-400 hover:text-white rounded-xl uppercase font-orbitron font-black text-xs tracking-widest transition-colors"
            >
              Back to Uploads
            </button>
            <button 
              onClick={() => setStage('declaration')}
              className="px-8 py-3 bg-cyber-blue text-slate-950 hover:bg-cyan-400 font-orbitron font-black text-xs tracking-widest uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(0,243,255,0.2)]"
            >
              Next Guidelines
            </button>
          </div>
        </div>

        {/* Right candidate info sidebar */}
        <div className="w-full md:w-80 bg-slate-950 border-l border-slate-800 p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-cyber-blue">
            <img src={profilePic} alt="Candidate" className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-orbitron font-black text-sm text-cyber-blue uppercase tracking-wider">{candidateName}</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">ID: {loginId}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-[10px] font-bold uppercase text-slate-400">
            Assigned Lab Terminal: <span className="text-cyber-green">LN-04A</span>
          </div>
        </div>
      </div>
    );
  }

  // Declaration stage
  return (
    <div className="min-h-screen bg-slate-900 border-t-8 border-cyber-blue text-slate-100 font-sans flex flex-col justify-center p-6 md:p-12">
      <div className="max-w-3xl mx-auto bg-slate-950 border border-slate-800 rounded-[32px] p-8 md:p-10 shadow-2xl space-y-8">
        <div className="text-center space-y-2 border-b border-slate-800 pb-4">
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase font-orbitron text-cyber-blue">Candidate Declaration</h2>
          <p className="text-xs text-slate-400 uppercase tracking-widest">Read & accept terms to activate the exam console</p>
        </div>

        <div className="space-y-6">
          {/* Default Language Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase text-slate-400 tracking-wider">Choose your default language:</label>
            <select 
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-sm text-white rounded-xl px-4 py-3 outline-none focus:border-cyber-blue transition-colors font-medium tracking-tight"
            >
              <option value="">- Select -</option>
              <option value="english">English</option>
              <option value="hindi">Hindi</option>
            </select>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Please note all questions will appear on your panel in this language. You can toggle this inside the exam hall anytime.</p>
          </div>

          {/* Legal checkbox container */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex gap-4 items-start shadow-inner">
            <input 
              type="checkbox" 
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-5 h-5 accent-cyber-blue mt-1 shrink-0 rounded border-slate-800 cursor-pointer"
            />
            <div className="text-xs font-medium text-slate-400 space-y-2 leading-relaxed">
              <p className="font-semibold text-slate-200">I have read and understood the instructions. All computer hardware allotted to me is in proper working condition.</p>
              <p>I declare that I am not in possession of, not wearing, or carrying any prohibited gadgets (such as mobile phones, smartwatch, bluetooth devices, calculators, tablets) or any written paper in the exam hall.</p>
              <p>I agree that in case of not adhering to the instructions or using unfair means, I shall be liable to be immediately debarred from this Test and future exams under the National Assessment Policies.</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between gap-4 pt-4 border-t border-slate-800">
          <button 
            onClick={() => setStage('instructions')}
            className="px-6 py-3 border border-slate-800 bg-slate-900 text-slate-400 hover:text-white rounded-xl uppercase font-orbitron font-black text-xs tracking-widest transition-colors"
          >
            Previous Stage
          </button>
          <button 
            onClick={() => {
              if (!selectedLang) { alert("Please select your default language"); return; }
              if (!agreed) { alert("You must agree to the instructions and declaration first"); return; }
              onProceed(selectedLang);
            }}
            disabled={!selectedLang || !agreed}
            className={`px-8 py-4 uppercase font-orbitron font-black text-xs tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(0,243,255,0.15)] ${selectedLang && agreed ? 'bg-cyber-blue hover:bg-cyan-400 text-slate-950 cursor-pointer' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800/10'}`}
          >
            I am ready to begin
          </button>
        </div>
      </div>
    </div>
  );
};
