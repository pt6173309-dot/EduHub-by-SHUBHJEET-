import React, { useState } from 'react';
import { User, Lock, ArrowLeft, Camera, Check } from 'lucide-react';

interface CandidateRegisterProps {
  examName: string;
  onRegister: (info: { name: string; id: string; photo: string }) => void;
  onBack: () => void;
}

const AVATAR_PRESETS = [
  { id: 'pres1', name: 'Rohan Sharma (M)', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=60' },
  { id: 'pres2', name: 'Ananya Iyer (F)', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=60' },
  { id: 'pres3', name: 'Vikram Patel (M)', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60' },
  { id: 'pres4', name: 'Nisha Reddy (F)', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=60' }
];

export const CandidateRegister: React.FC<CandidateRegisterProps> = ({ examName, onRegister, onBack }) => {
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [photo, setPhoto] = useState(AVATAR_PRESETS[0].url);
  const [selectedPreset, setSelectedPreset] = useState('pres1');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
        setSelectedPreset('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { alert("Please enter Candidate Name"); return; }
    if (!userId.trim()) { alert("Please enter Login ID"); return; }
    if (!password.trim()) { alert("Please enter Password"); return; }

    onRegister({
      name: name.toUpperCase(),
      id: userId.toUpperCase(),
      photo: photo
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
      <div className="absolute top-6 left-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors uppercase font-orbitron font-black text-xs tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Exams
        </button>
      </div>

      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-[32px] p-8 md:p-10 shadow-2xl space-y-8">
        <div className="text-center space-y-2">
          <span className="bg-cyber-blue/10 text-cyber-blue border border-cyber-blue/30 px-4 py-1.5 rounded-full font-orbitron font-black text-[10px] tracking-widest uppercase">
            REGISTRATION FOR {examName}
          </span>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase font-orbitron">Candidate Entry Form</h2>
          <p className="text-slate-500 text-xs uppercase tracking-wider">Please provide official enrollment credentials for practice exams</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar selector */}
          <div className="space-y-3">
            <label className="block text-xs font-black uppercase text-slate-400 tracking-wider">Candidate Photo Profile</label>
            <div className="flex flex-col md:flex-row items-center gap-6 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-cyber-blue shrink-0">
                <img src={photo} alt="Candidate Profile" className="w-full h-full object-cover" />
                <label className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                  <Camera className="w-5 h-5 text-cyber-blue" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>

              <div className="space-y-2 w-full">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Select an Avatar Preset or upload your own file</p>
                <div className="grid grid-cols-4 gap-2">
                  {AVATAR_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setPhoto(preset.url);
                        setSelectedPreset(preset.id);
                      }}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedPreset === preset.id ? 'border-cyber-blue scale-105' : 'border-slate-800 hover:border-slate-600'}`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      {selectedPreset === preset.id && (
                        <div className="absolute inset-0 bg-cyber-blue/40 flex items-center justify-center">
                          <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Candidate Name */}
            <div className="space-y-2">
              <label htmlFor="student-name" className="block text-xs font-black uppercase text-slate-400 tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                <input 
                  id="student-name"
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.G. PALLAVI SHARMA"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 font-medium tracking-tight outline-none focus:border-cyber-blue transition-colors uppercase"
                />
              </div>
            </div>

            {/* Candidate Login ID */}
            <div className="space-y-2">
              <label htmlFor="student-id" className="block text-xs font-black uppercase text-slate-400 tracking-wider">Candidate Login ID</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                <input 
                  id="student-id"
                  type="text" 
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="E.G. NEST2026-88F"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 font-medium tracking-tight outline-none focus:border-cyber-blue transition-colors uppercase"
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="student-pass" className="block text-xs font-black uppercase text-slate-400 tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              <input 
                id="student-pass"
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 tracking-tight outline-none focus:border-cyber-blue transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            id="register-submit"
            className="w-full bg-cyber-blue hover:bg-cyan-400 dark:bg-cyan-500 text-slate-950 font-black py-4 rounded-xl uppercase text-xs tracking-widest font-orbitron transition-all shadow-[0_0_20px_rgba(0,243,255,0.2)] active:scale-98"
          >
            Submit & Upload Paper
          </button>
        </form>
      </div>
    </div>
  );
};
