import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface NodeData {
  id: string;
  label: string;
}

interface SubNodeData {
  id: string;
  parent_node_id: string;
  label: string;
  description: string | null;
  url: string | null;
}

interface GraphSubNodesManagerProps {
  setLoading: (loading: boolean) => void;
  setErrorMsg: (msg: string) => void;
}

export function GraphSubNodesManager({ setLoading, setErrorMsg }: GraphSubNodesManagerProps) {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [subNodes, setSubNodes] = useState<SubNodeData[]>([]);
  const [editingSubNode, setEditingSubNode] = useState<Partial<SubNodeData> | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [nodesRes, subNodesRes] = await Promise.all([
        supabase.from('graph_nodes').select('id, label').order('created_at', { ascending: true }),
        supabase.from('graph_subnodes').select('*').order('created_at', { ascending: true })
      ]);
      if (nodesRes.error) throw nodesRes.error;
      if (subNodesRes.error && subNodesRes.error.code !== '42P01') throw subNodesRes.error;
      
      setNodes(nodesRes.data || []);
      setSubNodes(subNodesRes.data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch sub-nodes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingSubNode || !editingSubNode.parent_node_id || !editingSubNode.label) {
      setErrorMsg('Parent Node and Label are required');
      return;
    }
    
    setLoading(true);
    setSaveStatus('saving');

    const data = {
      parent_node_id: editingSubNode.parent_node_id,
      label: editingSubNode.label,
      description: editingSubNode.description || null,
      url: editingSubNode.url || null,
    };

    if (editingSubNode.id) {
      const { error } = await supabase.from('graph_subnodes').update(data).eq('id', editingSubNode.id);
      if (error) {
        setErrorMsg(error.message);
        setSaveStatus('error');
      } else {
        setSubNodes(prev => prev.map(s => s.id === editingSubNode.id ? { ...s, ...data } as SubNodeData : s));
        setSaveStatus('saved');
        setEditingSubNode(null);
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } else {
      const { data: newData, error } = await supabase.from('graph_subnodes').insert([data]).select();
      if (error) {
        setErrorMsg(error.message);
        setSaveStatus('error');
      } else if (newData && newData.length > 0) {
        setSubNodes(prev => [...prev, newData[0]]);
        setSaveStatus('saved');
        setEditingSubNode(null);
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this sub-node?')) return;
    setLoading(true);
    const { error } = await supabase.from('graph_subnodes').delete().eq('id', id);
    if (error) setErrorMsg(error.message);
    else setSubNodes(prev => prev.filter(s => s.id !== id));
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center border-b border-[#1B3B2B] pb-4">
        <h2 className="text-2xl font-pixel tracking-widest text-[#A5D6B7]">SUB-NODES (二級子節點)</h2>
        <button
          onClick={() => setEditingSubNode({ parent_node_id: nodes[0]?.id || '', label: '' })}
          className="border border-[#4ADE80] text-[#4ADE80] px-4 py-2 font-pixel text-sm hover:bg-[#4ADE80] hover:text-[#030a07] transition-colors"
        >
          [ NEW SUB-NODE ]
        </button>
      </div>

      {editingSubNode && (
        <form onSubmit={handleSave} className="border border-[#4ADE80] p-6 bg-[#0a140f] flex flex-col gap-4 relative">
          <div className="absolute top-0 right-0 p-2 text-[#4ADE80] font-pixel text-[10px]">EDIT MODE</div>
          <h3 className="font-pixel text-[#4ADE80] tracking-widest mb-2">
            {editingSubNode.id ? 'EDIT SUB-NODE' : 'CREATE SUB-NODE'}
          </h3>
          
          <div className="flex flex-col gap-1">
            <label className="font-pixel text-xs text-[#A5D6B7]">PARENT NODE (父節點 ID)</label>
            <select
              value={editingSubNode.parent_node_id || ''}
              onChange={e => setEditingSubNode({ ...editingSubNode, parent_node_id: e.target.value })}
              className="bg-[#030a07] border border-[#1B3B2B] p-2 text-[#A5D6B7] font-pixel text-sm outline-none focus:border-[#4ADE80]"
              required
            >
              <option value="" disabled>-- SELECT PARENT --</option>
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.label} ({n.id})</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-pixel text-xs text-[#A5D6B7]">LABEL (顯示文字)</label>
            <input
              type="text"
              value={editingSubNode.label || ''}
              onChange={e => setEditingSubNode({ ...editingSubNode, label: e.target.value })}
              className="bg-[#030a07] border border-[#1B3B2B] p-2 text-[#A5D6B7] font-pixel text-sm outline-none focus:border-[#4ADE80]"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-pixel text-xs text-[#A5D6B7]">DESCRIPTION (描述 - 選填)</label>
            <input
              type="text"
              value={editingSubNode.description || ''}
              onChange={e => setEditingSubNode({ ...editingSubNode, description: e.target.value })}
              className="bg-[#030a07] border border-[#1B3B2B] p-2 text-[#A5D6B7] font-pixel text-sm outline-none focus:border-[#4ADE80]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-pixel text-xs text-[#A5D6B7]">URL (對應連結 - 選填)</label>
            <input
              type="text"
              placeholder="/blog/slug 或 https://..."
              value={editingSubNode.url || ''}
              onChange={e => setEditingSubNode({ ...editingSubNode, url: e.target.value })}
              className="bg-[#030a07] border border-[#1B3B2B] p-2 text-[#A5D6B7] font-pixel text-sm outline-none focus:border-[#4ADE80]"
            />
          </div>

          <div className="flex justify-end gap-4 mt-4">
            {saveStatus === 'error' && <span className="text-red-400 font-pixel text-[10px] tracking-widest mt-2">ERROR</span>}
            <button type="button" onClick={() => setEditingSubNode(null)} className="text-[#A5D6B7] font-pixel text-sm hover:text-white">
              CANCEL
            </button>
            <button type="submit" className="bg-[#4ADE80] text-[#030a07] px-6 py-2 font-pixel text-sm hover:bg-[#81D4FA] transition-colors">
              SAVE SUB-NODE
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subNodes.map(sub => {
          const parent = nodes.find(n => n.id === sub.parent_node_id);
          return (
            <div key={sub.id} className="border border-[#1B3B2B] p-4 bg-[#030a07] hover:border-[#A5D6B7] transition-colors flex flex-col group">
              <div className="flex justify-between items-start mb-2">
                <div className="font-pixel text-[#4ADE80] text-lg">{sub.label}</div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditingSubNode(sub)} className="text-[#81D4FA] hover:text-white font-pixel text-[10px]">[EDIT]</button>
                  <button onClick={() => handleDelete(sub.id)} className="text-red-400 hover:text-red-300 font-pixel text-[10px]">[DEL]</button>
                </div>
              </div>
              <div className="font-pixel text-[#A5D6B7] text-[10px] tracking-widest mb-3 opacity-70">
                PARENT: {parent ? parent.label : sub.parent_node_id}
              </div>
              {sub.description && <div className="text-[#A5D6B7] text-xs font-mono mb-2">{sub.description}</div>}
              {sub.url && <div className="text-[#81D4FA] text-[10px] font-mono truncate">{sub.url}</div>}
            </div>
          );
        })}
        {subNodes.length === 0 && (
          <div className="col-span-full text-center py-12 text-[#4a6b57] font-pixel border border-dashed border-[#1B3B2B]">
            NO SUB-NODES FOUND.
          </div>
        )}
      </div>
    </div>
  );
}