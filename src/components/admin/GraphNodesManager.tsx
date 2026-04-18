import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { GraphNode } from '../../types';

const INITIAL_NODES = [
  { id: 'ME', label: 'tinchak0207', address: 'ADDR_ME', group_type: 'center', radius: 8 },
  { id: 'INFP', label: 'INFP', address: 'ADDR_INFP', group_type: 'node', radius: 5 },
  { id: 'AI', label: 'AI NATIVE', address: 'ADDR_AI_NAT', group_type: 'node', radius: 5 },
  { id: '10', label: '10後', address: 'ADDR_POST10', group_type: 'node', radius: 5 },
  { id: 'ADHD', label: 'ADHD', address: 'ADDR_ADHD', group_type: 'node', radius: 5 },
  { id: 'Cat', label: '貓奴', address: 'ADDR_CAT', group_type: 'node', radius: 5 },
  { id: 'Otaku', label: '宅', address: 'ADDR_OTAKU', group_type: 'node', radius: 5 },
  { id: 'OI', label: 'OI', address: 'ADDR_OI', group_type: 'node', radius: 5 },
  { id: 'Math', label: '數競', address: 'ADDR_MATH', group_type: 'node', radius: 5 },
  { id: 'Founder', label: '創業者', address: 'ADDR_FOUNDER', group_type: 'node', radius: 5 },
];

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

export function GraphNodesManager({ setLoading, setErrorMsg }: { setLoading: (l: boolean) => void, setErrorMsg: (m: string) => void }) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [editingNode, setEditingNode] = useState<Partial<GraphNode> | null>(null);

  useEffect(() => {
    fetchNodes();
  }, []);

  const fetchNodes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('graph_nodes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('Could not find the table')) {
        setErrorMsg("Supabase 中尚未建立 'graph_nodes' 資料表，請在 SQL Editor 執行 schema.sql 建立表結構。");
      } else {
        setErrorMsg(error.message);
      }
    }
    else if (data) setNodes(data);
    setLoading(false);
  };

  const handleSaveNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNode || !editingNode.id || !editingNode.label || !editingNode.address) {
      setErrorMsg('ID, Label and Address are required');
      return;
    }
    
    setLoading(true);
    const nodeData = {
      id: editingNode.id, // custom string ID like 'INFP', 'AI'
      label: editingNode.label,
      address: editingNode.address,
      group_type: editingNode.group_type || 'node',
      radius: editingNode.radius || 5,
    };

    // Check if updating or inserting
    const existingNode = nodes.find(n => n.id === nodeData.id);
    if (existingNode) {
      const { error } = await supabase
        .from('graph_nodes')
        .update(nodeData)
        .eq('id', nodeData.id);
        
      if (error) setErrorMsg(error.message);
      else {
        setEditingNode(null);
        fetchNodes();
      }
    } else {
      const { error } = await supabase.from('graph_nodes').insert([nodeData]);
      if (error) setErrorMsg(error.message);
      else {
        setEditingNode(null);
        fetchNodes();
      }
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this node? This may break links.')) return;
    setLoading(true);
    const { error } = await supabase.from('graph_nodes').delete().eq('id', id);
    if (error) setErrorMsg(error.message);
    else fetchNodes();
    setLoading(false);
  };

  const handleSyncDefault = async () => {
    if (!confirm('This will insert default frontend nodes and links into the database. Existing nodes with the same ID will be updated. Continue?')) return;
    setLoading(true);
    
    const { error: nodeError } = await supabase.from('graph_nodes').upsert(INITIAL_NODES, { onConflict: 'id' });
    if (nodeError) {
      setErrorMsg(nodeError.message);
      setLoading(false);
      return;
    }

    const { error: linkError } = await supabase.from('graph_links').upsert(INITIAL_LINKS, { onConflict: 'source,target' });
    if (linkError) {
      // It might fail if the unique constraint is not named or setup perfectly, but we can try
      console.warn("Link upsert error:", linkError);
    }
    
    fetchNodes();
    setLoading(false);
  };

  if (editingNode) {
    return (
      <form onSubmit={handleSaveNode} className="flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-[#1B3B2B] pb-4">
          <h2 className="text-xl font-pixel text-[#A5D6B7]">
            {nodes.find(n => n.id === editingNode.id) ? 'EDIT NODE' : 'NEW NODE'}
          </h2>
          <div className="flex gap-4">
            <button type="button" onClick={() => setEditingNode(null)} className="text-[#4a6b57] hover:text-[#A5D6B7] font-pixel text-sm transition-colors">CANCEL</button>
            <button type="submit" className="text-[#030a07] bg-[#4ADE80] px-4 py-1 font-pixel text-sm hover:bg-[#E8F5E9] transition-colors">COMMIT</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-pixel text-xs text-[#4a6b57] mb-2">ID (Unique Identifier, e.g. "AI", "INFP")</label>
            <input 
              type="text" 
              value={editingNode.id || ''}
              onChange={(e) => setEditingNode({...editingNode, id: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '')})}
              className="w-full bg-[#0a140f] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#E8F5E9] p-3 outline-none placeholder-[#4a6b57]/50"
              placeholder="Unique ID"
              disabled={!!nodes.find(n => n.id === editingNode.id)} // disable if editing existing
              required
            />
          </div>
          <div>
            <label className="block font-pixel text-xs text-[#4a6b57] mb-2">LABEL (Display Text, e.g. "AI NATIVE")</label>
            <input 
              type="text" 
              value={editingNode.label || ''}
              onChange={(e) => setEditingNode({...editingNode, label: e.target.value})}
              className="w-full bg-[#0a140f] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#E8F5E9] p-3 outline-none placeholder-[#4a6b57]/50"
              placeholder="Display Name"
              required
            />
          </div>
          <div>
            <label className="block font-pixel text-xs text-[#4a6b57] mb-2">HEX ADDRESS (e.g. "ADDR_AI_NAT")</label>
            <input 
              type="text" 
              value={editingNode.address || ''}
              onChange={(e) => setEditingNode({...editingNode, address: e.target.value})}
              className="w-full bg-[#0a140f] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#E8F5E9] p-3 outline-none placeholder-[#4a6b57]/50"
              placeholder="Hex Address"
              required
            />
          </div>
          <div>
            <label className="block font-pixel text-xs text-[#4a6b57] mb-2">GROUP TYPE</label>
            <select 
              value={editingNode.group_type || 'node'}
              onChange={(e) => setEditingNode({...editingNode, group_type: e.target.value as 'center' | 'node'})}
              className="w-full bg-[#0a140f] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#E8F5E9] p-3 outline-none"
            >
              <option value="node">NODE (Normal)</option>
              <option value="center">CENTER (Core)</option>
            </select>
          </div>
          <div>
            <label className="block font-pixel text-xs text-[#4a6b57] mb-2">RADIUS (Size)</label>
            <input 
              type="number" 
              value={editingNode.radius || 5}
              onChange={(e) => setEditingNode({...editingNode, radius: parseInt(e.target.value)})}
              className="w-full bg-[#0a140f] border border-[#1B3B2B] focus:border-[#4ADE80] text-[#E8F5E9] p-3 outline-none placeholder-[#4a6b57]/50"
              min="1" max="20"
              required
            />
          </div>
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-pixel text-[#A5D6B7]">NEURAL NODES (圖譜節點)</h2>
        <div className="flex gap-2">
          <button 
            onClick={handleSyncDefault}
            className="border border-[#B39DDB] text-[#B39DDB] px-4 py-2 font-pixel text-sm hover:bg-[#B39DDB] hover:text-[#030a07] transition-colors"
          >
            SYNC DEFAULT NODES
          </button>
          <button 
            onClick={() => setEditingNode({ id: '', label: '', address: '', group_type: 'node', radius: 5 })}
            className="border border-[#4ADE80] text-[#4ADE80] px-4 py-2 font-pixel text-sm hover:bg-[#4ADE80] hover:text-[#030a07] transition-colors"
          >
            + ALLOCATE NEW NODE
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {nodes.map(node => (
          <div key={node.id} className="border border-[#1B3B2B] p-4 flex justify-between items-center bg-[#0a140f]/30 hover:border-[#4a6b57] transition-colors">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-pixel text-[#E8F5E9] text-lg">{node.label}</h3>
                <span className={`px-2 py-0.5 text-[10px] font-pixel ${node.group_type === 'center' ? 'bg-[#4ADE80]/20 text-[#4ADE80]' : 'bg-[#81D4FA]/20 text-[#81D4FA]'}`}>
                  {node.group_type.toUpperCase()}
                </span>
              </div>
              <div className="flex gap-4 font-pixel text-[10px] tracking-widest text-[#4a6b57]">
                <span>ID: {node.id}</span>
                <span>ADDR: {node.address}</span>
                <span>RAD: {node.radius}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setEditingNode(node)}
                className="text-[#4a6b57] hover:text-[#4ADE80] font-pixel text-xs px-3 py-1 border border-transparent hover:border-[#4ADE80] transition-all"
              >
                EDIT
              </button>
              <button 
                onClick={() => handleDelete(node.id)}
                className="text-[#4a6b57] hover:text-red-400 font-pixel text-xs px-3 py-1 border border-transparent hover:border-red-400 transition-all"
              >
                DELETE
              </button>
            </div>
          </div>
        ))}
        {nodes.length === 0 && (
          <div className="text-[#4a6b57] font-pixel text-center py-12 border border-dashed border-[#1B3B2B]">
            NO NODES FOUND. GRAPH IS EMPTY.
          </div>
        )}
      </div>
    </div>
  );
}
