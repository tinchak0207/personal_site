import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface NodeData {
  id: string;
  label: string;
  group_type: string;
}

interface EdgeData {
  id: string;
  source: string;
  target: string;
}

interface GraphEdgesManagerProps {
  setLoading: (loading: boolean) => void;
  setErrorMsg: (msg: string) => void;
}

const INITIAL_LINKS = [
  { source: 'ME', target: 'INFP' },
  { source: 'ME', target: 'AI' },
  { source: 'ME', target: '10' },
  { source: 'ME', target: 'Cat' },
  { source: 'ME', target: 'OI' },
  { source: 'ME', target: 'Founder' },
  { source: 'INFP', target: 'ADHD' },
  { source: 'AI', target: 'ADHD' },
  { source: 'AI', target: 'Founder' },
  { source: 'Cat', target: 'Otaku' },
  { source: 'OI', target: 'Math' },
  { source: '10', target: 'Otaku' },
];

export function GraphEdgesManager({ setLoading, setErrorMsg }: GraphEdgesManagerProps) {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [edges, setEdges] = useState<EdgeData[]>([]);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);

  const fetchGraphData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [nodesResponse, edgesResponse] = await Promise.all([
        supabase.from('graph_nodes').select('id, label, group_type').order('created_at', { ascending: true }),
        supabase.from('graph_edges').select('*').order('created_at', { ascending: true })
      ]);
      
      if (nodesResponse.error) throw nodesResponse.error;
      if (edgesResponse.error && edgesResponse.error.code !== '42P01') throw edgesResponse.error;
      
      setNodes(nodesResponse.data || []);
      setEdges(edgesResponse.data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch graph data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphData();
  }, []);

  const isConnected = (idA: string, idB: string) => {
    return edges.some(e => (e.source === idA && e.target === idB) || (e.source === idB && e.target === idA));
  };

  const getEdgeId = (idA: string, idB: string) => {
    const edge = edges.find(e => (e.source === idA && e.target === idB) || (e.source === idB && e.target === idA));
    return edge?.id;
  };

  const toggleEdge = async (targetId: string) => {
    if (!focusNodeId) return;
    const edgeId = getEdgeId(focusNodeId, targetId);

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    if (edgeId) {
      setEdges(prev => prev.filter(e => e.id !== edgeId));
    } else {
      setEdges(prev => [...prev, { id: tempId, source: focusNodeId, target: targetId }]);
    }

    try {
      if (edgeId) {
        const { error } = await supabase.from('graph_edges').delete().eq('id', edgeId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('graph_edges').insert([{ source: focusNodeId, target: targetId }]).select();
        if (error) throw error;
        if (data) {
          setEdges(prev => prev.map(e => e.id === tempId ? data[0] : e));
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to toggle connection');
      fetchGraphData(); // Revert on failure
    }
  };

  const importDefaultEdges = async () => {
    if (!window.confirm('This will bulk import all missing default connections. Proceed?')) return;
    setLoading(true);
    try {
      const existingSet = new Set(edges.map(e => `${e.source}-${e.target}`));
      const existingReverseSet = new Set(edges.map(e => `${e.target}-${e.source}`));

      const toInsert = INITIAL_LINKS.filter(link => {
        const combo1 = `${link.source}-${link.target}`;
        const combo2 = `${link.target}-${link.source}`;
        return !existingSet.has(combo1) && !existingReverseSet.has(combo1) &&
               !existingSet.has(combo2) && !existingReverseSet.has(combo2);
      });

      if (toInsert.length > 0) {
        const { error } = await supabase.from('graph_edges').insert(toInsert);
        if (error) throw error;
      }
      
      await fetchGraphData();
      alert(`Successfully imported ${toInsert.length} new connections.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to import edges');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center border-b border-[#1B3B2B] pb-4">
        <h2 className="text-2xl font-pixel tracking-widest text-[#A5D6B7]">NEURAL CONNECTIONS (連線管理矩陣)</h2>
        <button
          onClick={importDefaultEdges}
          className="border border-[#B39DDB] text-[#B39DDB] px-4 py-2 font-pixel text-sm hover:bg-[#B39DDB] hover:text-[#030a07] transition-colors shadow-[0_0_10px_rgba(179,157,219,0.2)]"
        >
          [ BULK IMPORT DEFAULT EDGES ]
        </button>
      </div>

      {/* 1. SELECT FOCUS NODE */}
      <div className="border border-[#1B3B2B] bg-[#0a140f]/80 p-6 relative group">
        <div className="absolute top-0 right-0 p-2 text-[#4a6b57] font-pixel text-[10px]">STEP 1</div>
        <h3 className="font-pixel text-[#81D4FA] mb-6 tracking-widest flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
          SELECT FOCUS NODE (選擇核心節點)
        </h3>
        
        <div className="flex flex-wrap gap-3">
          {nodes.map(node => {
            const isCenter = node.group_type === 'center';
            const isSelected = focusNodeId === node.id;
            return (
              <button
                key={node.id}
                onClick={() => setFocusNodeId(node.id)}
                className={`px-4 py-2 font-pixel text-sm tracking-wider transition-all duration-300 border ${
                  isSelected
                    ? 'bg-[#81D4FA] text-[#030a07] border-[#81D4FA] shadow-[0_0_15px_rgba(129,212,250,0.5)] scale-105'
                    : isCenter
                      ? 'bg-[#1B3B2B]/50 text-[#4ADE80] border-[#4ADE80]/50 hover:border-[#4ADE80] hover:bg-[#1B3B2B]'
                      : 'bg-[#030a07] text-[#A5D6B7] border-[#1B3B2B] hover:border-[#81D4FA] hover:text-[#81D4FA]'
                }`}
              >
                {isCenter && !isSelected && <span className="mr-2 opacity-50">★</span>}
                {node.label}
              </button>
            );
          })}
          {nodes.length === 0 && (
            <div className="text-[#4a6b57] font-pixel text-xs py-4">NO NODES AVAILABLE. PLEASE CREATE NODES FIRST.</div>
          )}
        </div>
      </div>

      {/* 2. TOGGLE CONNECTIONS */}
      <div 
        className={`border border-[#1B3B2B] bg-[#0a140f]/80 p-6 transition-all duration-500 relative ${
          focusNodeId ? 'opacity-100 translate-y-0' : 'opacity-40 pointer-events-none translate-y-4 filter grayscale'
        }`}
      >
        <div className="absolute top-0 right-0 p-2 text-[#4a6b57] font-pixel text-[10px]">STEP 2</div>
        <h3 className="font-pixel text-[#4ADE80] mb-6 tracking-widest flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
          TOGGLE CONNECTIONS {focusNodeId ? `FOR [ ${nodes.find(n => n.id === focusNodeId)?.label} ]` : ''}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {nodes.filter(n => n.id !== focusNodeId).map(node => {
            const connected = focusNodeId ? isConnected(focusNodeId, node.id) : false;
            return (
              <div
                key={node.id}
                onClick={() => toggleEdge(node.id)}
                className={`cursor-pointer border p-4 flex flex-col items-center justify-center gap-3 transition-all duration-300 relative overflow-hidden group ${
                  connected
                    ? 'border-[#4ADE80] bg-[#4ADE80]/10 shadow-[0_0_15px_rgba(74,222,128,0.15)] hover:bg-[#4ADE80]/20 hover:border-[#E8F5E9] hover:shadow-[0_0_20px_rgba(74,222,128,0.3)]'
                    : 'border-[#1B3B2B] border-dashed bg-[#030a07] hover:border-[#4a6b57] hover:bg-[#1B3B2B]/30'
                }`}
              >
                {/* Background scanning effect for connected nodes */}
                {connected && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#4ADE80]/10 to-transparent h-[200%] animate-[scanlines_2s_linear_infinite] pointer-events-none opacity-50"></div>}
                
                <div className={`font-pixel text-2xl z-10 transition-colors duration-300 ${
                  connected ? 'text-[#4ADE80] drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]' : 'text-[#1B3B2B] group-hover:text-[#4a6b57]'
                }`}>
                  {connected ? '<--->' : '</>'}
                </div>
                
                <div className="text-center z-10 w-full">
                  <div className={`font-pixel text-sm mb-1 truncate px-2 transition-colors ${
                    connected ? 'text-[#E8F5E9]' : 'text-[#8FBC8F] group-hover:text-[#A5D6B7]'
                  }`}>
                    {node.label}
                  </div>
                  <div className={`text-[10px] font-mono tracking-wider transition-colors ${
                    connected ? 'text-[#4ADE80]/70' : 'text-[#4a6b57]'
                  }`}>
                    ID: {node.id}
                  </div>
                </div>
              </div>
            );
          })}
          
          {focusNodeId && nodes.length <= 1 && (
            <div className="col-span-full text-center py-8 text-[#4a6b57] font-pixel text-xs border border-dashed border-[#1B3B2B]">
              NO OTHER NODES AVAILABLE TO CONNECT.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}