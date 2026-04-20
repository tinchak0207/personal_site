import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MarkdownEditor } from './MarkdownEditor';

interface SubNodeData {
  id: string;
  parent_node_id: string;
  label: string;
  description: string | null;
  url: string | null;
}

interface NodeSubNodesPanelProps {
  parentNodeId: string;
  setLoading: (loading: boolean) => void;
  setErrorMsg: (msg: string) => void;
}

export function NodeSubNodesPanel({ parentNodeId, setLoading, setErrorMsg }: NodeSubNodesPanelProps) {
  const [subNodes, setSubNodes] = useState<SubNodeData[]>([]);
  const [editingSubNode, setEditingSubNode] = useState<Partial<SubNodeData> | null>(null);

  const fetchSubNodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('graph_subnodes')
        .select('*')
        .eq('parent_node_id', parentNodeId)
        .order('created_at', { ascending: true });
        
      if (error && error.code !== '42P01') throw error;
      setSubNodes(data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch sub-nodes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubNodes();
  }, [parentNodeId]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingSubNode || !editingSubNode.label) {
      setErrorMsg('Label is required');
      return;
    }
    
    setLoading(true);

    const data = {
      parent_node_id: parentNodeId,
      label: editingSubNode.label,
      description: editingSubNode.description || null,
      url: editingSubNode.url || null,
    };

    if (editingSubNode.id) {
      const { error } = await supabase.from('graph_subnodes').update(data).eq('id', editingSubNode.id);
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSubNodes(prev => prev.map(s => s.id === editingSubNode.id ? { ...s, ...data } as SubNodeData : s));
        setEditingSubNode(null);
      }
    } else {
      const { data: newData, error } = await supabase.from('graph_subnodes').insert([data]).select();
      if (error) {
        setErrorMsg(error.message);
      } else if (newData && newData.length > 0) {
        setSubNodes(prev => [...prev, newData[0]]);
        setEditingSubNode(null);
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
    <div className="border border-[#1B3B2B] bg-[#030a07] p-4 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-pixel text-[#A5D6B7]">SUB-NODES (二級節點)</h3>
        <button 
          type="button"
          onClick={() => setEditingSubNode({ parent_node_id: parentNodeId, label: '', description: '', url: '' })}
          className="text-[#4ADE80] font-pixel text-xs border border-[#4ADE80] px-2 py-1 hover:bg-[#4ADE80] hover:text-[#030a07] transition-colors"
        >
          + ADD SUB-NODE
        </button>
      </div>

      {editingSubNode && (
        <form onSubmit={handleSave} className="mb-6 p-4 border border-[#4a6b57] bg-[#0a140f]">
          <div className="grid gap-4">
            <div>
              <label className="block font-pixel text-xs text-[#4a6b57] mb-2">LABEL</label>
              <input 
                type="text" 
                value={editingSubNode.label || ''}
                onChange={e => setEditingSubNode({...editingSubNode, label: e.target.value})}
                className="w-full bg-[#030a07] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#E8F5E9] p-2 outline-none font-mono text-sm"
                required
              />
            </div>
            <div>
              <label className="block font-pixel text-xs text-[#4a6b57] mb-2">DESCRIPTION</label>
              <MarkdownEditor
                id="subnode-description-editor"
                value={editingSubNode.description || ''}
                onChange={(val) => setEditingSubNode({...editingSubNode, description: val})}
                setLoading={setLoading}
                setErrorMsg={setErrorMsg}
                placeholder="Subnode description (Markdown supported)..."
                className="h-64 border border-[#1B3B2B] focus-within:border-[#4ADE80]"
              />
            </div>
            <div>
              <label className="block font-pixel text-xs text-[#4a6b57] mb-2">URL</label>
              <input 
                type="url" 
                value={editingSubNode.url || ''}
                onChange={e => setEditingSubNode({...editingSubNode, url: e.target.value})}
                className="w-full bg-[#030a07] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#E8F5E9] p-2 outline-none font-mono text-sm"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setEditingSubNode(null)} className="text-[#4a6b57] font-pixel text-xs px-3 py-1">CANCEL</button>
              <button type="submit" className="bg-[#4ADE80] text-[#030a07] font-pixel text-xs px-3 py-1">SAVE</button>
            </div>
          </div>
        </form>
      )}

      <div className="grid gap-2">
        {subNodes.length === 0 && !editingSubNode && (
          <div className="text-[#4a6b57] font-pixel text-xs italic">NO SUB-NODES FOUND.</div>
        )}
        {subNodes.map(sub => (
          <div key={sub.id} className="flex justify-between items-start border border-[#1B3B2B] p-3 hover:border-[#4a6b57]">
            <div>
              <div className="font-pixel text-[#E8F5E9] text-sm">{sub.label}</div>
              {sub.description && <div className="text-[#8FBC8F] text-xs font-mono mt-1">{sub.description}</div>}
              {sub.url && <div className="text-[#4a6b57] text-[10px] font-mono mt-1 truncate max-w-xs">{sub.url}</div>}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => setEditingSubNode(sub)} className="text-[#4a6b57] hover:text-[#4ADE80] font-pixel text-[10px]">EDIT</button>
              <button onClick={() => handleDelete(sub.id)} className="text-[#4a6b57] hover:text-red-400 font-pixel text-[10px]">DEL</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
