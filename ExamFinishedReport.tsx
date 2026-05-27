import React from 'react';
import { Download, RefreshCw, Layers, CheckCircle2, XCircle, HelpCircle, GraduationCap } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface SubjectResult {
  subject: string;
  score: number;
  total: number;
  correctCount: number;
  incorrectCount: number;
  answers: Record<number, string>;
  questions: any[];
  isExcluded?: boolean;
}

interface ExamFinishedReportProps {
  candidateName: string;
  candidateId: string;
  candidatePhoto: string;
  allResults: SubjectResult[];
  onReset: () => void;
}

export const ExamFinishedReport: React.FC<ExamFinishedReportProps> = ({
  candidateName, candidateId, candidatePhoto, allResults, onReset
}) => {
  // Aggregate stats
  const totalScore = allResults.reduce((sum, r) => sum + r.score, 0);
  const totalMax = allResults.reduce((sum, r) => sum + r.total, 0);

  const downloadConsolidatedPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    // Draw solid cyan-800 header tag
    doc.setFillColor(0, 71, 91);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Header branding
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text("NEST 2026 OFFICIAL MARKS CARD", pageWidth / 2, 18, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("NATIONAL ENTRANCE SCREENING TEST - PERFORMANCE ANALYSIS SUMMARY", pageWidth / 2, 26, { align: 'center' });

    y = 50;

    // Print Profile Image safely (CORS Protection)
    if (candidatePhoto && candidatePhoto.startsWith('data:image')) {
      try {
        doc.addImage(candidatePhoto, 'JPEG', 15, y, 32, 32);
      } catch (err) {
        console.error("CORS block or parsing issue adding candidate photo:", err);
        // Draw colored rectangle silhouette
        doc.setFillColor(220, 225, 230);
        doc.rect(15, y, 32, 32, 'F');
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text("PHOTO TEMPLATE", 18, y + 16);
      }
    } else {
      // Draw graphic background silhouette
      doc.setFillColor(225, 232, 240);
      doc.rect(15, y, 32, 32, 'F');
      doc.setDrawColor(180, 200, 220);
      doc.rect(15, y, 32, 32, 'D');
      doc.setFontSize(8);
      doc.setTextColor(110, 120, 130);
      doc.text("CANDIDATE", 22, y + 14);
      doc.text("PHOTO PRES", 22, y + 20);
    }

    // Candidate metadata
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont("helvetica", "bold");
    doc.text(candidateName.toUpperCase(), 55, y + 8);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Login Enrollment ID: ${candidateId}`, 55, y + 15);
    doc.text(`Lab Terminal Node: LN-04A`, 55, y + 21);
    doc.text(`Evaluation Date: ${new Date().toLocaleDateString()}`, 55, y + 27);

    y += 45;

    // Draw total marks display
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, pageWidth - 30, 22, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, y, pageWidth - 30, 22, 'D');

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text("GRAND SECURED EXAMINATION METRICS:", 22, y + 9);
    doc.setFontSize(15);
    doc.setTextColor(0, 150, 136); // Teal-600
    doc.text(`${totalScore} / ${totalMax} Marks`, 22, y + 16);

    // Percentage
    const pct = ((totalScore / (totalMax || 1)) * 100).toFixed(2);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Performance Index: ${pct}%`, pageWidth - 80, y + 13);

    y += 35;

    // Section Breakdown Header
    doc.setFontSize(13);
    doc.setTextColor(0, 71, 91);
    doc.setFont("helvetica", "bold");
    doc.text("SUBJECT-WISE PERFORMANCE SUMMARIES:", 15, y);
    doc.line(15, y + 2, pageWidth - 15, y + 2);
    y += 10;

    // Loop results and print subject charts
    doc.setFontSize(10);
    allResults.forEach((res, idx) => {
      if (y > 250) {
        doc.addPage();
        y = 30;
      }

      doc.setFillColor(248, 250, 252);
      doc.rect(15, y, pageWidth - 30, 20, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, y, pageWidth - 30, 20, 'D');

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      
      if (res.isExcluded) {
        doc.text(`${idx + 1}. SUBJECT: ${res.subject.toUpperCase()} (OPTIONAL SECTOR)`, 20, y + 7);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(120, 130, 140);
        doc.text("Optional track section — Excluded from official PCB stream score aggregates.", 20, y + 14);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(150, 150, 150);
        doc.text("EXCLUDED", pageWidth - 45, y + 12);
      } else {
        doc.text(`${idx + 1}. SUBJECT: ${res.subject.toUpperCase()}`, 20, y + 7);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(
          `Correct: ${res.correctCount}  |  Incorrect: ${res.incorrectCount}  |  Unattempted: ${res.questions.length - (res.correctCount + res.incorrectCount)}`,
          20,
          y + 14
        );

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 71, 91);
        doc.text(`${res.score} / ${res.total}`, pageWidth - 45, y + 12);
      }

      doc.setFontSize(10);
      y += 26;
    });

    // Verification Signoffs
    y += 15;
    if (y > 240) {
      doc.addPage();
      y = 30;
    }
    doc.setDrawColor(200);
    doc.line(15, y, 75, y);
    doc.line(pageWidth - 75, y, pageWidth - 15, y);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Candidate Signature", 30, y + 5);
    doc.text("Assessment Controller (NEST)", pageWidth - 60, y + 5);

    // Save
    doc.save(`NEST_2026_Report_${candidateName.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 font-sans text-slate-100 flex items-center justify-center">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main report column */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div className="text-center md:text-left space-y-1">
              <span className="bg-cyber-green/10 text-cyber-green border border-cyber-green/30 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-orbitron font-black">
                Evaluation Scorecard
              </span>
              <h2 className="text-3xl font-orbitron font-black text-white tracking-tighter uppercase">NEST UG Finished</h2>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={downloadConsolidatedPDF} 
                className="bg-cyber-blue hover:bg-cyan-400 text-slate-950 font-orbitron font-black px-6 py-3 rounded-xl uppercase text-xs tracking-widest transition-all shadow-[0_0_15px_rgba(0,243,255,0.2)] flex items-center gap-2 active:scale-95"
              >
                <Download className="w-4 h-4" /> Export Report (PDF)
              </button>
              <button 
                onClick={onReset} 
                className="border-2 border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-slate-300 font-orbitron font-black px-6 py-3 rounded-xl uppercase text-xs tracking-widest transition-all flex items-center gap-2 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" /> Retry Test
              </button>
            </div>
          </div>

          {/* Grand secured display card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-blue/5 rounded-full blur-2xl" />
            <div className="space-y-2 text-center md:text-left">
              <p className="text-xs uppercase font-mono tracking-widest text-slate-500">AGGREGATED SECURED SCALE Score</p>
              <h3 className="text-5xl font-orbitron font-black text-cyber-green tracking-tight">
                {totalScore} <span className="text-lg text-slate-500">/ {totalMax} Marks</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                AGGREGATE INDEX: {((totalScore / (totalMax || 1)) * 100).toFixed(2)} % PERFORMANCE ACCURACY
              </p>
            </div>

            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-cyber-green shrink-0 bg-slate-900 shadow-xl">
              <img src={candidatePhoto} alt="Candidate Face" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* BENTO GRID OF SUBJECT HIGHLIGHTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allResults.map((res) => {
              const countUnattempted = res.questions.length - (res.correctCount + res.incorrectCount);
              
              if (res.isExcluded) {
                return (
                  <div key={res.subject} className="bg-slate-950/20 border border-slate-800/40 opacity-60 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-red-500/10 text-red-500 border-b border-l border-red-500/20 px-3 py-1 rounded-bl-xl text-[8px] font-bold uppercase tracking-widest leading-none">
                      Excluded from PCB Track
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2 block">
                      <h4 className="font-orbitron font-black text-xs text-slate-500 tracking-wider uppercase">{res.subject} (OPTIONAL)</h4>
                      <span className="font-mono font-black text-xs text-slate-500 uppercase">Not Evaluated</span>
                    </div>
                    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/40 text-center">
                      <p className="text-[10px] text-slate-400 font-medium">
                        This section is omitted because the applicant chose the **Physics, Chemistry, and Biology (PCB)** track. 
                        No marks are accumulated or deducted for this category.
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={res.subject} className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-sm hover:border-slate-700 transition-colors">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                    <h4 className="font-orbitron font-black text-xs text-cyber-blue tracking-wider uppercase">{res.subject} PERFORMANCE</h4>
                    <span className="font-mono font-black text-sm text-cyber-green">{res.score} / {res.total}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-green-500/10">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto mb-1.5" />
                      <p className="text-[9px] text-slate-500 uppercase font-black">Correct</p>
                      <p className="text-xs font-bold text-slate-200 mt-1 font-mono">{res.correctCount}</p>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-red-500/10">
                      <XCircle className="w-4 h-4 text-red-500 mx-auto mb-1.5" />
                      <p className="text-[9px] text-slate-500 uppercase font-black">Wrong</p>
                      <p className="text-xs font-bold text-slate-200 mt-1 font-mono">{res.incorrectCount}</p>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-500/10">
                      <HelpCircle className="w-4 h-4 text-slate-400 mx-auto mb-1.5" />
                      <p className="text-[9px] text-slate-500 uppercase font-black">Empty</p>
                      <p className="text-xs font-bold text-slate-200 mt-1 font-mono">{countUnattempted}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Info/Status Logs */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-fit space-y-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <GraduationCap className="w-5 h-5 text-cyber-blue" />
            <h4 className="font-orbitron font-black text-xs text-slate-200 uppercase tracking-widest">Candidate Info File</h4>
          </div>

          <div className="space-y-4 text-xs font-medium text-slate-400">
            <div className="flex justify-between">
              <span className="uppercase text-slate-500 font-bold">Candidate:</span>
              <span className="text-slate-100 uppercase font-black">{candidateName}</span>
            </div>
            <div className="flex justify-between">
              <span className="uppercase text-slate-500 font-bold">Enrollment ID:</span>
              <span className="text-slate-100 font-mono tracking-wider">{candidateId}</span>
            </div>
            <div className="flex justify-between">
              <span className="uppercase text-slate-500 font-bold">Assigned Room:</span>
              <span className="text-cyber-green font-bold">LAB NODE 04-A</span>
            </div>
            <div className="flex justify-between">
              <span className="uppercase text-slate-500 font-bold">Status:</span>
              <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded uppercase font-black text-[9px] tracking-widest">VERIFIED SUCCESS</span>
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-[10px] leading-relaxed text-slate-500 space-y-2">
            <p className="font-extrabold uppercase text-slate-400 tracking-wider">Note to Applicant</p>
            <p>Your practice score responses has been recorded and evaluated based on official NEET and NEST UG marking policies (+5 for correct, -1 for incorrect, and 0 for unattempted answers).</p>
            <p>Click on exported scorecard to print or download a digital authenticated record of your trial review paper.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
