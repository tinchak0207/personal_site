import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface NodeData {
  id: string;
  label: string;
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

export function GraphEdgesManager({ setLoading, setErrorMsg }: GraphEdgesManagerProps) {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [edges, setEdges] = useState<EdgeData[]>([]);
  const [sourceId, setSourceId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchGraphData = async () => {
    setLoading(true);
    setErrorMsg('');
    
    try {
      const [nodesResponse, edgesResponse] = await Promise.all([
        supabase.from('graph_nodes').select('id, label').order('created_at', { ascending: true }),
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

  const handleAddEdge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId) {
      setErrorMsg('Please select both source and target nodes.');
      return;
    }
    if (sourceId === targetId) {
      setErrorMsg('Source and target nodes cannot be the same.');
      return;
    }
    
    // Check for existing connection
    const exists = edges.some(edge => 
      (edge.source === sourceId && edge.target === targetId) || 
      (edge.source === targetId && edge.target === sourceId)
    );
    
    if (exists) {
      setErrorMsg('Connection already exists between these nodes.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('graph_edges').insert([{ source: sourceId, target: targetId }]);
      if (error) throw error;
      
      setSourceId('');
      setTargetId('');
      setIsAdding(false);
      await fetchGraphData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add connection');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEdge = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this connection?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('graph_edges').delete().eq('id', id);
      if (error) throw error;
      await fetchGraphData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete connection');
    } finally {
      setLoading(false);
    }
  };

  const getNodeLabel = (id: string) => {
    const node = nodes.find(n => n.id === id);
    return node ? `${node.label} (${id})` : id;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-pixel text-[#A5D6B7]">MANAGE CONNECTIONS (EDGES)</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="text-[#030a07] bg-[#4ADE80] px-4 py-1 font-pixel text-sm hover:bg-[#E8F5E9] transition-colors"
        >
          {isAdding ? 'CANCEL' : 'ADD CONNECTION'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddEdge} className="mb-8 p-4 border border-[#1B3B2B] bg-[#0a140f]/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-pixel text-[10px] tracking-widest text-[#4a6b57] mb-2">SOURCE NODE</label>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full bg-[#030a07] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#E8F5E9] p-2 outline-none font-mono text-sm"
                required
              >
                <option value="">-- Select Source Node --</option>
                {nodes.map(node => (
                  <option key={node.id} value={node.id}>{node.label} ({node.id})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-pixel text-[10px] tracking-widest text-[#4a6b57] mb-2">TARGET NODE</label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full bg-[#030a07] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#E8F5E9] p-2 outline-none font-mono text-sm"
                required
              >
                <option value="">-- Select Target Node --</option>
                {nodes.map(node => (
                  <option key={node.id} value={node.id}>{node.label} ({node.id})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="text-[#030a07] bg-[#4ADE80] px-4 py-1.5 font-pixel text-sm hover:bg-[#E8F5E9] transition-colors">
              CONNECT
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {edges.length === 0 ? (
          <div className="text-[#4a6b57] font-pixel text-sm p-4 border border-[#1B3B2B] border-dashed text-center">
            NO CONNECTIONS FOUND. CLICK 'ADD CONNECTION' TO CREATE ONE.
          </div>
        ) : (
          edges.map((edge) => (
            <div key={edge.id} className="border border-[#1B3B2B] p-4 flex justify-between items-center bg-[#0a140f]/30 hover:bg-[#0a140f]/80 transition-colors">
              <div className="flex items-center gap-4">
                <div className="text-[#A5D6B7] font-mono text-sm">{getNodeLabel(edge.source)}</div>
                <div className="text-[#4a6b57]">{'<--->'}</div>
                <div className="text-[#A5D6B7] font-mono text-sm">{getNodeLabel(edge.target)}</div>
              </div>
              <button 
                onClick={() => handleDeleteEdge(edge.id)}
                className="text-red-400 hover:text-red-300 font-pixel text-xs transition-colors"
              >
                DELETE
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}