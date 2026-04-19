import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { CRTFilter } from '../components/CRTFilter';
import { RamblingsManager } from '../components/admin/RamblingsManager';
import { ProjectsManager } from '../components/admin/ProjectsManager';
import { ExternalLinksManager } from '../components/admin/ExternalLinksManager';
import { GraphNodesManager } from '../components/admin/GraphNodesManager';
import { TimelineManager } from '../components/admin/TimelineManager';

type AdminTab = 'ramblings' | 'projects' | 'timeline' | 'links' | 'nodes';

export function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('ramblings');

  useEffect(() => {
    let isMounted = true;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setSession(session);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
      }
    });

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setErrorMsg(error.message);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading && !session && !errorMsg) {
    return (
      <div className="min-h-screen bg-[#030a07] text-[#4ADE80] font-pixel p-12 flex items-center justify-center">
        LOADING SYSTEM...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="relative min-h-screen bg-[#030a07] text-[#8FBC8F] font-mono flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="border border-[#1B3B2B] p-8 max-w-md w-full bg-[#0a140f]/50 backdrop-blur-sm relative z-10">
          <h2 className="text-2xl font-pixel tracking-widest text-[#E8F5E9] mb-6">SYS_ADMIN // LOGIN</h2>
          
          {errorMsg && <div className="text-red-400 font-pixel text-sm mb-4 border border-red-900 p-2">{errorMsg}</div>}
          
          <div className="mb-4">
            <label className="block font-pixel text-xs tracking-widest text-[#4a6b57] mb-2">IDENTIFIER (EMAIL)</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#030a07] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#A5D6B7] p-2 font-mono outline-none transition-colors placeholder-[#4a6b57]/50"
              placeholder="admin@system.local"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block font-pixel text-xs tracking-widest text-[#4a6b57] mb-2">PASSPHRASE</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#030a07] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#A5D6B7] p-2 font-mono outline-none transition-colors placeholder-[#4a6b57]/50"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full border border-[#4ADE80] text-[#4ADE80] font-pixel tracking-widest p-3 hover:bg-[#4ADE80] hover:text-[#030a07] transition-colors disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING...' : 'INITIALIZE CONNECTION'}
          </button>
        </form>
        <CRTFilter />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#030a07] text-[#8FBC8F] font-mono p-8 md:p-12">
      <div className="max-w-6xl mx-auto relative z-10 pb-24">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 border-b border-[#1B3B2B] pb-6 gap-4">
          <h1 className="text-2xl font-pixel tracking-widest text-[#E8F5E9]">
            NEURAL ADMIN_CONSOLE
          </h1>
          <button 
            onClick={handleLogout}
            className="text-[#4a6b57] hover:text-red-400 font-pixel tracking-widest text-xs transition-colors self-start md:self-auto"
          >
            [ DISCONNECT ]
          </button>
        </header>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-4 mb-8 font-pixel text-sm">
          <button 
            onClick={() => setActiveTab('ramblings')}
            className={`px-4 py-2 border transition-colors ${activeTab === 'ramblings' ? 'border-[#4ADE80] text-[#4ADE80] bg-[#0a140f]' : 'border-[#1B3B2B] text-[#4a6b57] hover:border-[#4a6b57]'}`}
          >
            1. 碎碎念 (RAMBLINGS)
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 border transition-colors ${activeTab === 'projects' ? 'border-[#4ADE80] text-[#4ADE80] bg-[#0a140f]' : 'border-[#1B3B2B] text-[#4a6b57] hover:border-[#4a6b57]'}`}
          >
            2. 個人項目 (PROJECTS)
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 border transition-colors ${activeTab === 'timeline' ? 'border-[#4ADE80] text-[#4ADE80] bg-[#0a140f]' : 'border-[#1B3B2B] text-[#4a6b57] hover:border-[#4a6b57]'}`}
          >
            3. 時間線 (TIMELINE)
          </button>
          <button
            onClick={() => setActiveTab('links')}
            className={`px-4 py-2 border transition-colors ${activeTab === 'links' ? 'border-[#4ADE80] text-[#4ADE80] bg-[#0a140f]' : 'border-[#1B3B2B] text-[#4a6b57] hover:border-[#4a6b57]'}`}
          >
            4. 外部鏈接 (EXTERNAL LINKS)
          </button>
          <button 
            onClick={() => setActiveTab('nodes')}
            className={`px-4 py-2 border transition-colors ${activeTab === 'nodes' ? 'border-[#4ADE80] text-[#4ADE80] bg-[#0a140f]' : 'border-[#1B3B2B] text-[#4a6b57] hover:border-[#4a6b57]'}`}
          >
            5. 節點管理 (NODES)
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 border border-red-900 text-red-400 font-pixel text-sm">
            ERROR: {errorMsg}
          </div>
        )}

        {/* Tab Content */}
        <div className="bg-[#0a140f]/30 p-6 border border-[#1B3B2B]">
          {activeTab === 'ramblings' && (
            <RamblingsManager setLoading={setLoading} setErrorMsg={setErrorMsg} />
          )}
          {activeTab === 'projects' && (
            <ProjectsManager setLoading={setLoading} setErrorMsg={setErrorMsg} />
          )}
          {activeTab === 'timeline' && (
            <TimelineManager setLoading={setLoading} setErrorMsg={setErrorMsg} />
          )}
          {activeTab === 'links' && (
            <ExternalLinksManager setLoading={setLoading} setErrorMsg={setErrorMsg} />
          )}
          {activeTab === 'nodes' && (
            <GraphNodesManager setLoading={setLoading} setErrorMsg={setErrorMsg} />
          )}
        </div>
      </div>
      <CRTFilter />
    </div>
  );
}
