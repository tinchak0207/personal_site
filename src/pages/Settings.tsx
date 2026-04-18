import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Settings() {
  const [lang, setLang] = useState('繁');

  return (
    <div className="min-h-screen bg-[#030a07] text-[#A5D6B7] font-mono p-6 selection:bg-[#4ADE80] selection:text-[#030a07] noise relative">
      {/* Grid Background */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(to right, #1B3B2B 1px, transparent 1px),
          linear-gradient(to bottom, #1B3B2B 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        opacity: 0.1
      }}></div>

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="flex justify-between items-end mb-12 border-b-2 border-[#1B3B2B] pb-4">
          <div>
            <h1 className="text-4xl font-pixel text-[#B39DDB] tracking-widest">系統設定</h1>
            <p className="text-[#7E57C2] text-sm tracking-widest mt-2">/sys_config</p>
          </div>
          <Link to="/" className="text-[#4a6b57] hover:text-[#4ADE80] transition-colors font-pixel tracking-widest text-sm">
            [RETURN TO CORE]
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Language Section */}
          <section className="border border-[#1B3B2B] bg-[#0a140f]/80 p-6 relative group hover:border-[#B39DDB] transition-colors">
            <div className="absolute top-0 left-0 w-2 h-2 bg-[#B39DDB] -translate-x-1 -translate-y-1 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute top-0 right-0 w-2 h-2 bg-[#B39DDB] translate-x-1 -translate-y-1 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 bg-[#B39DDB] -translate-x-1 translate-y-1 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#B39DDB] translate-x-1 translate-y-1 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <h2 className="text-xl font-pixel text-[#E8F5E9] mb-6 flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              LANGUAGE / 語言
            </h2>
            
            <div className="flex flex-col gap-3 font-pixel">
              {['繁', '简', 'EN'].map(l => (
                <button 
                  key={l}
                  onClick={() => setLang(l)}
                  className={`text-left px-4 py-3 border transition-all ${
                    lang === l 
                      ? 'border-[#B39DDB] text-[#E8F5E9] bg-[#4527A0]/20' 
                      : 'border-[#1B3B2B] text-[#7E57C2] hover:border-[#7E57C2] hover:text-[#B39DDB]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>
                      {l === '繁' && '繁體中文 (Traditional Chinese)'}
                      {l === '简' && '简体中文 (Simplified Chinese)'}
                      {l === 'EN' && 'English (English)'}
                    </span>
                    {lang === l && <span className="text-[#B39DDB] text-xs">SELECTED</span>}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* About Section */}
          <section className="border border-[#1B3B2B] bg-[#0a140f]/80 p-6 relative group hover:border-[#B39DDB] transition-colors">
            <div className="absolute top-0 left-0 w-2 h-2 bg-[#B39DDB] -translate-x-1 -translate-y-1 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute top-0 right-0 w-2 h-2 bg-[#B39DDB] translate-x-1 -translate-y-1 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 bg-[#B39DDB] -translate-x-1 translate-y-1 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#B39DDB] translate-x-1 translate-y-1 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <h2 className="text-xl font-pixel text-[#E8F5E9] mb-6 flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              ABOUT / 關於
            </h2>
            
            <div className="space-y-6 text-sm leading-relaxed">
              <p className="text-[#8FBC8F]">
                NEURAL NETWORK INTERFACE v2.0.4<br/>
                CREATED BY: TINCHAK0207<br/>
                SYSTEM STATUS: ONLINE
              </p>
              
              <div className="pt-4 border-t border-[#1B3B2B] flex flex-col gap-4">
                <a href="https://github.com/tinchak0207" target="_blank" rel="noopener noreferrer" className="inline-block hover:opacity-80 transition-opacity self-start">
                  <img src="https://img.shields.io/github/followers/tinchak0207?style=for-the-badge&label=GitHub&color=4527A0&logo=github&logoColor=white" alt="GitHub followers" />
                </a>
                
                <a href="/admin" className="text-[#7E57C2] hover:text-[#B39DDB] transition-colors flex items-center gap-2 font-pixel text-xs">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  ADMIN ACCESS
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}