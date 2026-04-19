import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { GraphNode } from '../../types';

interface EdgeData {
  id: string;
  source: string;
  target: string;
}

interface NodeEdgesPanelProps {
  focusNodeId: string;
  nodes: GraphNode[];
  setLoading: (loading: boolean) => void;
  setErrorMsg: (msg: string) => void;
}

export function NodeEdgesPanel({ focusNodeId, nodes, setLoading, setErrorMsg }: NodeEdgesPanelProps) {
  const [edges, setEdges] = useState<EdgeData[]>([]);

  const fetchEdges = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('graph_edges')
        .select('*')
        .or(`source.eq.${focusNodeId},target.eq.${focusNodeId}`);
        
      if (error && error.code !== '42P01') throw error;
      setEdges(data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch edges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEdges();
  }, [focusNodeId]);

  const isConnected = (idB: string) => {
    return edges.some(e => (e.source === focusNodeId && e.target === idB) || (e.source === idB && e.target === focusNodeId));
  };

  const getEdgeId = (idB: string) => {
    const edge = edges.find(e => (e.source === focusNodeId && e.target === idB) || (e.source === idB && e.target === focusNodeId));
    return edge?.id;
  };

  const toggleEdge = async (targetId: string) => {
    if (!focusNodeId) return;
    const edgeId = getEdgeId(targetId);

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
      fetchEdges(); // Revert on failure
    }
  };

  const otherNodes = nodes.filter(n => n.id !== focusNodeId);

  return (
    <div className="border border-[#1B3B2B] bg-[#030a07] p-4 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-pixel text-[#A5D6B7]">EDGES (連線管理)</h3>
        <div className="text-[10px] text-[#4a6b57] font-pixel">TOGGLE TO CONNECT</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {otherNodes.map(node => {
          const connected = isConnected(node.id);
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => toggleEdge(node.id)}
              className={`flex items-center justify-between p-2 font-pixel text-xs border transition-colors ${
                connected 
                  ? 'border-[#4ADE80] bg-[#4ADE80]/10 text-[#4ADE80]' 
                  : 'border-[#1B3B2B] bg-[#0a140f] text-[#4a6b57] hover:border-[#4a6b57] hover:text-[#8FBC8F]'
              }`}
            >
              <span className="truncate mr-2" title={node.label}>{node.label}</span>
              <span>{connected ? '[ON]' : '[OFF]'}</span>
            </button>
          );
        })}
        {otherNodes.length === 0 && (
          <div className="text-[#4a6b57] font-pixel text-xs italic">NO OTHER NODES AVAILABLE.</div>
        )}
      </div>
    </div>
  );
}
