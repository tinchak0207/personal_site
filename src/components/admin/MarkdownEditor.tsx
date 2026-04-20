import React, { useRef } from 'react';
import { supabase } from '../../lib/supabase';

interface MarkdownEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  setLoading: (loading: boolean) => void;
  setErrorMsg: (msg: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export function MarkdownEditor({ 
  id, 
  value, 
  onChange, 
  setLoading, 
  setErrorMsg, 
  placeholder, 
  className,
  required = false
}: MarkdownEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload an image file.');
      return;
    }

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `markdown/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);

      if (data?.publicUrl) {
        insertMarkdown(`![${file.name}](${data.publicUrl})`, '');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Image upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          handleImageUpload(file);
          break;
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById(id) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    const newText = value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  return (
    <div className={`flex flex-col flex-1 min-w-0 ${className || ''}`}>
      <div className="flex gap-1 p-2 bg-[#0a140f] border-b border-[#1B3B2B] shrink-0 overflow-x-auto custom-scrollbar">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('**', '**')} className="px-2 py-1 text-[#A5D6B7] font-mono text-xs hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors rounded shrink-0" title="Bold">B</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('*', '*')} className="px-2 py-1 text-[#A5D6B7] font-mono text-xs hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors italic rounded shrink-0" title="Italic">I</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('### ', '')} className="px-2 py-1 text-[#A5D6B7] font-mono text-xs hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors font-bold rounded shrink-0" title="Heading">H</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('[', '](url)')} className="px-2 py-1 text-[#A5D6B7] font-mono text-xs hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors rounded shrink-0" title="Link">L</button>
        
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => fileInputRef.current?.click()} className="px-2 py-1 text-[#A5D6B7] font-mono text-xs hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors rounded flex items-center gap-1 shrink-0" title="Upload Image">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          IMG
        </button>

        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertMarkdown('```\n', '\n```')} className="px-2 py-1 text-[#A5D6B7] font-mono text-xs hover:bg-[#1B3B2B] hover:text-[#4ADE80] transition-colors rounded shrink-0" title="Code Block">{'<>'}</button>
      </div>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="flex-1 w-full h-full min-h-[200px] bg-transparent border-none text-[#A5D6B7] p-6 font-mono outline-none resize-none placeholder-[#4a6b57]/30 custom-scrollbar leading-relaxed"
        placeholder={placeholder || "Markdown supported... Drag & drop or paste images here."}
        required={required}
      />
    </div>
  );
}
