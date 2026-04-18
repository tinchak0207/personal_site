import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { GraphNode } from '../../types';

interface NodeSelectorProps {
  selectedTags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export function NodeSelector({ selectedTags, onAddTag, onRemoveTag }: NodeSelectorProps) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNodes = async () => {
      const { data } = await supabase.from('graph_nodes').select('*').order('created_at', { ascending: true });
      if (data) setNodes(data);
      setLoading(false);
    };
    fetchNodes();
  }, []);

  if (loading) return <div className="text-xs text-[#4a6b57] animate-pulse">LOADING NEURAL NODES...</div>;

  return (
    <div className="mb-4">
      <label className="block font-pixel text-xs text-[#4a6b57] mb-2">NEURAL NODES (一鍵鏈接)</label>
      <div className="flex flex-wrap gap-2 p-3 bg-[#0a140f] border border-[#1B3B2B] min-h-[50px]">
        {nodes.map(node => {
          const isSelected = selectedTags.includes(node.id) || selectedTags.includes(node.label);
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => isSelected ? onRemoveTag(node.id) : onAddTag(node.id)}
              className={`px-3 py-1 font-pixel text-[10px] tracking-wider transition-colors border ${
                isSelected 
                  ? 'bg-[#4ADE80] text-[#030a07] border-[#4ADE80]' 
                  : 'bg-[#1B3B2B] text-[#A5D6B7] border-[#4a6b57] hover:border-[#4ADE80] hover:text-[#4ADE80]'
              }`}
            >
              {isSelected ? '✓ ' : '+ '}{node.label}
            </button>
          );
        })}
        {nodes.length === 0 && (
          <div className="text-[#4a6b57] font-pixel text-xs italic">NO NODES ALLOCATED. GO TO NODES TAB TO CREATE.</div>
        )}
      </div>
    </div>
  );
}
