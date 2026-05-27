import React, { useState, useEffect, useRef } from 'react';
import { X, GripHorizontal } from 'lucide-react';

interface ScientificCalculatorProps {
  onClose: () => void;
}

export const ScientificCalculator: React.FC<ScientificCalculatorProps> = ({ onClose }) => {
  const [calcExpr, setCalcExpr] = useState('');
  const [calcPos, setCalcPos] = useState({ x: window.innerWidth - 380, y: 150 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - calcPos.x, y: e.clientY - calcPos.y };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      // Constraint it to the window viewport
      const x = Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragStart.current.x));
      const y = Math.max(0, Math.min(window.innerHeight - 450, e.clientY - dragStart.current.y));
      setCalcPos({ x, y });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const appendToken = (token: string) => {
    setCalcExpr(prev => prev + token);
  };

  const clearCalc = () => {
    setCalcExpr('');
  };

  const backspaceCalc = () => {
    setCalcExpr(prev => prev.slice(0, -1));
  };

  const executeCalculation = () => {
    try {
      // Build safe mathematical replacement string for common trigonometry and logarithm functions
      let expr = calcExpr
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/sqrt/g, 'Math.sqrt')
        .replace(/log/g, 'Math.log10')
        .replace(/ln/g, 'Math.log')
        .replace(/pi/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/\^/g, '**');

      // Simple evaluation of safety bounds
      const func = new Function(`return (${expr})`);
      const res = func();
      if (res === undefined || isNaN(res)) {
        setCalcExpr('Error');
      } else {
        setCalcExpr(Number(res).toLocaleString(undefined, { maximumFractionDigits: 6 }));
      }
    } catch (err) {
      setCalcExpr('Error');
    }
  };

  const calcButtons = [
    ['C', '(', ')', '/'],
    ['7', '8', '9', '*'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '=', '^'],
    ['sin', 'cos', 'tan', 'sqrt'],
    ['log', 'ln', 'pi', 'e']
  ];

  return (
    <div 
      className="fixed z-[150] w-76 bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans"
      style={{ left: calcPos.x, top: calcPos.y }}
    >
      {/* Draggable header */}
      <div 
        className="bg-slate-950 px-4 py-3 flex items-center justify-between cursor-grab active:cursor-grabbing select-none border-b border-slate-800"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-slate-500" />
          <span className="font-orbitron font-black text-xs text-cyber-blue uppercase tracking-widest">SCIENTIFIC CALC</span>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Screen */}
      <div className="p-4 bg-slate-950/80">
        <input 
          type="text" 
          value={calcExpr}
          onChange={(e) => setCalcExpr(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-right font-mono text-lg text-cyber-green outline-none"
          placeholder="0"
        />
      </div>

      {/* Grid */}
      <div className="p-3 bg-slate-900 grid grid-cols-4 gap-2">
        {calcButtons.map((row, rIdx) => (
          row.map((btn) => {
            let btnClass = "py-2 text-xs font-bold font-mono rounded-lg transition-all active:scale-95";
            if (btn === '=') {
              btnClass += " bg-cyber-green/20 text-cyber-green border border-cyber-green/50 hover:bg-cyber-green/30 col-span-1";
            } else if (btn === 'C') {
              btnClass += " bg-cyber-pink/20 text-cyber-pink border border-cyber-pink/50 hover:bg-cyber-pink/30";
            } else if (['sin', 'cos', 'tan', 'sqrt', 'log', 'ln', 'pi', 'e', '^'].includes(btn)) {
              btnClass += " bg-slate-800 text-cyan-300 hover:bg-slate-700";
            } else if (['+', '-', '*', '/'].includes(btn)) {
              btnClass += " bg-slate-800 text-yellow-400 hover:bg-slate-700";
            } else {
              btnClass += " bg-slate-800 text-slate-300 hover:bg-slate-700";
            }

            return (
              <button
                key={btn}
                onClick={() => {
                  if (btn === '=') executeCalculation();
                  else if (btn === 'C') clearCalc();
                  else appendToken(btn);
                }}
                className={btnClass}
              >
                {btn}
              </button>
            );
          })
        ))}
      </div>
    </div>
  );
};
