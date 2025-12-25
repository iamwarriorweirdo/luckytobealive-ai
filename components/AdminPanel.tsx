
import React, { useState } from 'react';
import { useStore } from '../store';
import { Settings, Database, Terminal, Save, X, FileText, Upload, Cpu } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const { 
    isAdminOpen, toggleAdmin, 
    customSystemInstruction, updateSystemInstruction, 
    logs, 
    knowledgeBase, addKnowledge, addLog 
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<'core' | 'brain' | 'logs'>('core');
  const [tempInstruction, setTempInstruction] = useState(customSystemInstruction);

  if (!isAdminOpen) return null;

  const handleSaveCore = () => {
    updateSystemInstruction(tempInstruction);
    addLog('info', 'System Core updated successfully.');
  };

  const handleFileUpload = () => {
    // Simulating file upload
    const mockFile = {
      id: Date.now().toString(),
      name: `knowledge_batch_${Math.floor(Math.random() * 1000)}.pdf`,
      type: 'PDF',
      size: '2.4 MB',
      status: 'indexed' as const
    };
    addKnowledge(mockFile);
    addLog('info', `Ingested knowledge: ${mockFile.name}`);
  };

  return (
    <div className="absolute right-0 top-0 h-full w-full lg:w-[450px] bg-[#0A0A0C]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Cpu className="text-violet-500" size={20} />
          <h2 className="font-outfit font-bold text-lg text-white">Command Center</h2>
        </div>
        <button onClick={toggleAdmin} className="text-white/50 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        <button 
          onClick={() => setActiveTab('core')}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'core' ? 'text-violet-400 border-b-2 border-violet-500' : 'text-white/30 hover:text-white/50'}`}
        >
          Core Tuning
        </button>
        <button 
          onClick={() => setActiveTab('brain')}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'brain' ? 'text-amber-400 border-b-2 border-amber-500' : 'text-white/30 hover:text-white/50'}`}
        >
          Brain / RAG
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'logs' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-white/30 hover:text-white/50'}`}
        >
          Logs
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'core' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white/70">System Instruction (Persona)</span>
              <button 
                onClick={handleSaveCore}
                className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs font-bold text-white transition-colors"
              >
                <Save size={14} /> SAVE
              </button>
            </div>
            <textarea
              value={tempInstruction}
              onChange={(e) => setTempInstruction(e.target.value)}
              className="w-full h-[500px] bg-black/30 border border-white/10 rounded-xl p-4 text-xs font-mono text-white/80 focus:outline-none focus:border-violet-500/50 resize-none leading-relaxed"
            />
          </div>
        )}

        {activeTab === 'brain' && (
          <div className="space-y-6">
            <div 
              onClick={handleFileUpload}
              className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload size={20} className="text-white/50" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white">Drop knowledge files here</p>
                <p className="text-xs text-white/30 mt-1">Supports PDF, DOCX, TXT (Max 50MB)</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Indexed Memory</h3>
              {knowledgeBase.length === 0 ? (
                <div className="text-center py-8 text-white/20 text-xs italic">No external knowledge ingested yet.</div>
              ) : (
                knowledgeBase.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 glass-morphism rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/10 rounded-lg">
                        <FileText size={16} className="text-amber-500" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white/90">{file.name}</div>
                        <div className="text-[10px] text-white/40">{file.size} • {file.type}</div>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded uppercase">
                      {file.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="font-mono text-xs space-y-2">
            {logs.length === 0 && <div className="text-white/20 italic">System initialized. Waiting for events...</div>}
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3 border-b border-white/5 pb-2">
                <span className="text-white/30 shrink-0">{log.timestamp.toLocaleTimeString()}</span>
                <span className={`uppercase font-bold shrink-0 w-12 ${
                  log.type === 'error' ? 'text-rose-500' :
                  log.type === 'tool' ? 'text-amber-400' :
                  log.type === 'thought' ? 'text-cyan-400' : 'text-white/50'
                }`}>[{log.type}]</span>
                <span className="text-white/80 break-all">{log.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
