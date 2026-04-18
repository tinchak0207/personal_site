import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3-force';
import { motion, AnimatePresence } from 'framer-motion';

interface NodeData extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  address: string;
  group: 'center' | 'node';
  radius: number;
}

interface LinkData extends d3.SimulationLinkDatum<NodeData> {
  source: NodeData | string;
  target: NodeData | string;
}

const INITIAL_NODES: NodeData[] = [
  { id: 'ME', label: 'tinchak0207', address: 'ADDR_ME', group: 'center', radius: 8 },
  { id: 'INFP', label: 'INFP', address: 'ADDR_INFP', group: 'node', radius: 5 },
  { id: 'AI', label: 'AI NATIVE', address: 'ADDR_AI_NAT', group: 'node', radius: 5 },
  { id: '10', label: '10後', address: 'ADDR_POST10', group: 'node', radius: 5 },
  { id: 'ADHD', label: 'ADHD', address: 'ADDR_ADHD', group: 'node', radius: 5 },
  { id: 'Cat', label: '貓奴', address: 'ADDR_CAT', group: 'node', radius: 5 },
  { id: 'Otaku', label: '宅', address: 'ADDR_OTAKU', group: 'node', radius: 5 },
  { id: 'OI', label: 'OI', address: 'ADDR_OI', group: 'node', radius: 5 },
  { id: 'Math', label: '數競', address: 'ADDR_MATH', group: 'node', radius: 5 },
  { id: 'Founder', label: '創業者', address: 'ADDR_FOUNDER', group: 'node', radius: 5 },
];

export interface SubNode {
  id: string;
  label: string;
  desc?: string;
  link?: string;
}

const SUB_NODES_MAP: Record<string, SubNode[]> = {
  'ME': [
    { id: 'core', label: 'Core' },
    { id: 'root', label: 'Root' },
    { id: 'obs', label: 'Observer' }
  ],
  'INFP': [
    { id: 'fi', label: 'Fi' },
    { id: 'ne', label: 'Ne' },
    { id: 'si', label: 'Si' },
    { id: 'te', label: 'Te' }
  ],
  'AI': [
    { id: 'llm', label: 'LLM' },
    { id: 'agent', label: 'Agent' },
    { id: 'prompt', label: 'Prompt' }
  ],
  '10': [
    { id: 'genz', label: 'GenZ' },
    { id: 'alpha', label: 'Alpha' },
    { id: 'native', label: 'Native' }
  ],
  'ADHD': [
    { id: 'focus', label: 'Hyperfocus' },
    { id: 'dopa', label: 'Dopamine' },
    { id: 'chaos', label: 'Chaos' }
  ],
  'Cat': [
    { id: 'meow', label: 'Meow' },
    { id: 'sleep', label: 'Sleep' },
    { id: 'purr', label: 'Purr' }
  ],
  'Otaku': [
    { id: 'anime', label: 'Anime' },
    { id: 'manga', label: 'Manga' },
    { id: 'games', label: 'Games' }
  ],
  'OI': [
    { id: 'cpp', label: 'C++' },
    { id: 'algo', label: 'Algorithm' },
    { id: 'dp', label: 'DP' }
  ],
  'Math': [
    { id: 'geo', label: 'Geometry' },
    { id: 'alg', label: 'Algebra' },
    { id: 'log', label: 'Logic' }
  ],
  'Founder': [
    { 
      id: 'swipehire', 
      label: 'SwipeScout', 
      desc: '重構人才評估的舊系統，尋找世界的源代碼。',
      link: '/blog/swipescout' 
    }
  ]
};

const INITIAL_LINKS: LinkData[] = [
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

export const Graph: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [links, setLinks] = useState<LinkData[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [zoomTarget, setZoomTarget] = useState<{x: number, y: number} | null>(null);
  const [mousePos, setMousePos] = useState({ x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0 });
  const simulationRef = useRef<d3.Simulation<NodeData, LinkData> | null>(null);
  const draggingNodeIdRef = useRef<string | null>(null);
  const [unfoldProgress, setUnfoldProgress] = useState(0);
  const [dimensions, setDimensions] = useState({ width: typeof window !== 'undefined' ? window.innerWidth : 1920, height: typeof window !== 'undefined' ? window.innerHeight : 1080 });

  const [lang, setLang] = useState('繁');

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const { width, height } = dimensions;

    const simNodes = INITIAL_NODES.map(d => ({ ...d }));
    const simLinks = INITIAL_LINKS.map(d => ({ ...d }));

    // Fix the center node strictly to the middle of the screen
    const centerNode = simNodes.find(n => n.group === 'center');
    if (centerNode) {
      centerNode.fx = width / 2;
      centerNode.fy = height / 2;
    }

    const simulation = d3.forceSimulation<NodeData, LinkData>(simNodes)
      .force('link', d3.forceLink<NodeData, LinkData>(simLinks).id(d => d.id))
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(width / 2, height / 2).strength(1))
      .force('collide', d3.forceCollide<NodeData>().radius(d => d.radius + 30));

    simulation.on('tick', () => {
      setNodes([...simulation.nodes()]);
      setLinks([...simLinks]);
    });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, []);

  useEffect(() => {
    if (!simulationRef.current) return;
    const sim = simulationRef.current;
    
    // Update center node position on resize
    const centerNode = sim.nodes().find(n => n.group === 'center');
    if (centerNode) {
      centerNode.fx = dimensions.width / 2;
      centerNode.fy = dimensions.height / 2;
    }
    
    // Update centering force
    (sim.force('center') as d3.ForceCenter<NodeData>).x(dimensions.width / 2).y(dimensions.height / 2);
    
    sim.alpha(0.3).restart();
  }, [dimensions]);

  useEffect(() => {
    if (!simulationRef.current) return;
    const sim = simulationRef.current;
    
    // Apply smooth quadratic scaling for a gentle, even expansion
    const cappedProgress = Math.min(1, unfoldProgress);
    const easeProgress = Math.pow(cappedProgress, 2);
    
    // Extreme tangled state: charge is positive (attracting to center)
    // Unfolded state: charge is very negative (repelling strongly)
    const isMobile = dimensions.width < 768;
    const maxCharge = isMobile ? -1000 : -2000; 
    const minCharge = 500;  
    
    // Limit maximum spread to ensure it stays well within screen bounds
    const maxLinkDistance = Math.min(dimensions.width, dimensions.height) * (isMobile ? 0.1 : 0.15);
    const minLinkDistance = 1;
    
    const currentCharge = minCharge + (maxCharge - minCharge) * easeProgress;
    const currentLinkDistance = minLinkDistance + (maxLinkDistance - minLinkDistance) * Math.pow(cappedProgress, 4); 

    sim.force('charge', d3.forceManyBody().strength(currentCharge));
    (sim.force('link') as d3.ForceLink<NodeData, LinkData>).distance(currentLinkDistance);
    
    // Center force logic - ALWAYS keep strong centering force to stay in middle of screen
    const centerStrength = 1 - easeProgress * 0.4; 
    (sim.force('center') as d3.ForceCenter<NodeData>).strength(centerStrength);
    
    // Bounding box force to strictly prevent nodes from leaving screen
    sim.force('bounding', () => {
      const padding = isMobile ? 30 : 80;
      const { width, height } = dimensions;
      
      for (let node of sim.nodes()) {
        // Skip the fixed center node
        if (node.group === 'center') continue;
        
        if (node.x !== undefined && node.x < padding) {
          node.vx! += (padding - node.x) * 0.8;
          node.x = padding; // Hard clamp
        }
        if (node.x !== undefined && node.x > width - padding) {
          node.vx! -= (node.x - (width - padding)) * 0.8;
          node.x = width - padding; // Hard clamp
        }
        if (node.y !== undefined && node.y < padding) {
          node.vy! += (padding - node.y) * 0.8;
          node.y = padding; // Hard clamp
        }
        if (node.y !== undefined && node.y > height - padding) {
          node.vy! -= (node.y - (height - padding)) * 0.8;
          node.y = height - padding; // Hard clamp
        }
      }
    });

    sim.alpha(easeProgress < 0.1 ? 1 : 0.6).restart(); 
  }, [unfoldProgress, dimensions]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      setUnfoldProgress(prev => {
        // Double the sensitivity of the scroll
        let delta = e.deltaY * 0.002;
        let newProgress = prev + delta;
        return Math.max(0, Math.min(3, newProgress));
      });
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (draggingNodeIdRef.current) return; // Prevent scrolling when dragging a node
      
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;
      touchStartY = touchY;
      
      setUnfoldProgress(prev => {
        let delta = deltaY * 0.003;
        let newProgress = prev + delta;
        return Math.max(0, Math.min(3, newProgress));
      });
    };

    window.addEventListener('wheel', handleWheel);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, node: NodeData) => {
    if (!simulationRef.current) return;
    const sim = simulationRef.current;
    
    draggingNodeIdRef.current = node.id;
    
    if (e.type === 'touchstart') {
      const touch = (e as React.TouchEvent).touches[0];
      node.fx = touch.clientX;
      node.fy = touch.clientY;
    } else {
      const mouse = e as React.MouseEvent;
      node.fx = mouse.clientX;
      node.fy = mouse.clientY;
    }
    sim.alphaTarget(0.3).restart();
  };

  const handleDrag = (e: React.MouseEvent | React.TouchEvent, node: NodeData) => {
    if (draggingNodeIdRef.current !== node.id) return;
    
    if (e.type === 'touchmove') {
      const touch = (e as React.TouchEvent).touches[0];
      node.fx = touch.clientX;
      node.fy = touch.clientY;
    } else {
      const mouse = e as React.MouseEvent;
      node.fx = mouse.clientX;
      node.fy = mouse.clientY;
    }
  };

  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent, node: NodeData) => {
    if (!simulationRef.current) return;
    
    draggingNodeIdRef.current = null;
    
    if (node.group === 'center') {
      // Snap center node back to the exact middle of the screen
      node.fx = window.innerWidth / 2;
      node.fy = window.innerHeight / 2;
    } else {
      node.fx = null;
      node.fy = null;
    }
    
    simulationRef.current.alphaTarget(0);
  };

  // Calculate hint color interpolating from Green to Cyan
  const calculateHintColor = () => {
    if (unfoldProgress < 1.0) return '#4ADE80';
    const ratio = Math.min(1, unfoldProgress - 1.0);
    const r = Math.round(74 + (129 - 74) * ratio);
    const g = Math.round(222 + (212 - 222) * ratio);
    const b = Math.round(128 + (250 - 128) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  };
  const hintColor = calculateHintColor();

  const [glitchText, setGlitchText] = useState('向下滾動');
  
  useEffect(() => {
    if (unfoldProgress <= 1.0) {
      setGlitchText('向下滾動');
      return;
    }
    
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        const chars = '向滾動下!@#$%^&*()_+-=';
        const glitched = '向下滾動'.split('').map(c => Math.random() > 0.7 ? chars[Math.floor(Math.random() * chars.length)] : c).join('');
        setGlitchText(glitched);
        setTimeout(() => setGlitchText('向下滾動'), 100);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [unfoldProgress]);

  // Opacities and progressions for HUD modules
  const getModuleProgress = (current: number, start: number, end: number) => {
    if (current <= start) return 0;
    if (current >= end) return 1;
    return (current - start) / (end - start);
  };

  const progArchive = getModuleProgress(unfoldProgress, 1.2, 1.6);
  const progProjects = getModuleProgress(unfoldProgress, 1.6, 2.0);
  const progSettings = getModuleProgress(unfoldProgress, 2.0, 2.4);
  const progLinks = getModuleProgress(unfoldProgress, 2.4, 2.8);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full z-10"
      onMouseMove={(e) => {
        setMousePos({ x: e.clientX, y: e.clientY });
        if (draggingNodeIdRef.current) {
          const draggedNode = nodes.find(n => n.id === draggingNodeIdRef.current);
          if (draggedNode) {
            handleDrag(e, draggedNode);
          }
        }
      }}
      onMouseUp={(e) => {
        if (draggingNodeIdRef.current) {
          const draggedNode = nodes.find(n => n.id === draggingNodeIdRef.current);
          if (draggedNode) {
            handleDragEnd(e, draggedNode);
          }
        }
      }}
      onTouchMove={(e) => {
        if (draggingNodeIdRef.current) {
          const draggedNode = nodes.find(n => n.id === draggingNodeIdRef.current);
          if (draggedNode) {
            handleDrag(e, draggedNode);
          }
        }
      }}
      onTouchEnd={(e) => {
        if (draggingNodeIdRef.current) {
          const draggedNode = nodes.find(n => n.id === draggingNodeIdRef.current);
          if (draggedNode) {
            handleDragEnd(e, draggedNode);
          }
        }
      }}
    >
      {/* Scroll Hint */}
      <div 
        className="absolute bottom-16 left-1/2 -translate-x-1/2 font-pixel text-sm opacity-80 tracking-[0.3em] pointer-events-none transition-all duration-700 flex flex-col items-center gap-3"
        style={{ 
          opacity: unfoldProgress < 0.8 ? 0.8 : 1, // Keep it visible after 0.8
          transform: `translate(-50%, ${unfoldProgress > 0.8 && unfoldProgress <= 1.0 ? '20px' : '0'})`,
          textShadow: `0 0 10px ${hintColor}`,
          color: hintColor
        }}
      >
        <div className="flex flex-col items-center gap-1 animate-bounce">
          <svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
            {/* Pixel Mouse Outline */}
            <path d="M8 0H16V2H18V4H20V6H22V20H20V24H18V28H16V30H8V28H6V24H4V20H2V6H4V4H6V2H8V0Z" fill="currentColor" fillOpacity="0.2"/>
            <path d="M8 2H16V4H18V6H20V20H18V24H16V26H8V24H6V20H4V6H6V4H8V2Z" fill="#030a07"/>
            <path d="M10 0H14V2H10V0ZM6 2H10V4H6V2ZM14 2H18V4H14V2ZM4 4H6V6H4V4ZM18 4H20V6H18V4ZM2 6H4V20H2V6ZM20 6H22V20H20V6ZM4 20H6V24H4V20ZM18 20H20V24H18V20ZM6 24H8V28H6V24ZM16 24H18V28H16V24ZM8 28H16V30H8V28Z" fill="currentColor"/>
            
            {/* Pixel Scroll Wheel */}
            <path d="M10 8H14V14H10V8Z" fill="currentColor" className="animate-pulse"/>
            
            {/* Inner Details */}
            <path d="M11 20H13V22H11V20Z" fill="currentColor" fillOpacity="0.5"/>
          </svg>
          <div className="w-0.5 h-6 mt-1" style={{ background: `linear-gradient(to bottom, ${hintColor}, transparent)` }}></div>
        </div>
        <p className="font-bold mt-1">{glitchText}</p>
      </div>

      <svg width="100%" height="100%" className="overflow-visible pointer-events-none absolute inset-0 z-0">
        {/* Starfield Background Layer (Dense Pixel Art Milky Way) */}
        <g style={{
          transform: typeof window !== 'undefined' 
            ? `translate(${(mousePos.x - window.innerWidth / 2) * -0.015}px, ${(mousePos.y - window.innerHeight / 2) * -0.015}px)` 
            : 'translate(0, 0)',
          transition: 'transform 0.5s ease-out'
        }}>
          {/* Base scattered tiny stars */}
          {Array.from({ length: 400 }).map((_, i) => {
            const x = ((Math.sin(i * 12.345) + 1) / 2) * (typeof window !== 'undefined' ? window.innerWidth + 800 : 2000) - 400;
            const y = ((Math.cos(i * 54.321) + 1) / 2) * (typeof window !== 'undefined' ? window.innerHeight + 800 : 1500) - 400;
            const size = ((Math.sin(i * 98.765) + 1) / 2) * 1 + 0.5; // Very small
            
            // Only start showing stars after 50% unfold progress, and ramp up quickly
            const starOpacity = unfoldProgress < 0.5 ? 0 : Math.max(0, Math.min(1, Math.pow((unfoldProgress - 0.5) * 2, 3) * ((Math.sin(i) + 1) / 2 * 0.4 + 0.1)));
            
            return (
              <rect 
                key={`star-base-${i}`} x={x} y={y} width={size} height={size} 
                fill={i % 3 === 0 ? "#8FBC8F" : "#A5D6B7"} 
                opacity={starOpacity}
                className={i % 10 === 0 ? "animate-pulse" : ""}
              />
            );
          })}

          {/* Milky Way Band (Dense cluster along a diagonal curve) */}
          {Array.from({ length: 800 }).map((_, i) => {
            const w = typeof window !== 'undefined' ? window.innerWidth : 1920;
            const h = typeof window !== 'undefined' ? window.innerHeight : 1080;
            
            // Progress along the diagonal (from bottom-left to top-right roughly)
            const t = ((Math.sin(i * 3.14159) + 1) / 2); 
            
            // Base curve for the milky way
            const baseX = t * (w + 800) - 400;
            const baseY = h - (t * (h + 800) - 400) + Math.sin(t * Math.PI * 3) * 150; 
            
            // Gaussian-like spread from the center of the band
            const spread = (Math.pow(Math.sin(i * 7.777), 3)) * 250;
            const offsetX = Math.cos(i * 11.11) * spread;
            const offsetY = Math.sin(i * 11.11) * spread;
            
            const x = baseX + offsetX;
            const y = baseY + offsetY;
            
            // Size is smaller closer to the band center to create density
            const distFromCenter = Math.abs(spread) / 250;
            const size = distFromCenter < 0.2 ? 0.8 : (distFromCenter < 0.6 ? 1.2 : 1.5);
            
            // Opacity is higher in the center of the band
            const baseOpacity = 1 - Math.pow(distFromCenter, 0.5);
            // Only start showing stars after 50% unfold progress
            const starOpacity = unfoldProgress < 0.5 ? 0 : Math.max(0, Math.min(1, Math.pow((unfoldProgress - 0.5) * 2, 4) * baseOpacity * 0.7));
            
            // Color variation: mostly blue/purple tint in the dense parts, some bright white
            const color = distFromCenter < 0.15 ? "#E8F5E9" : (i % 4 === 0 ? "#7da38a" : "#366B4E");

            return (
              <rect 
                key={`star-mw-${i}`} x={x} y={y} width={size} height={size} 
                fill={color} 
                opacity={starOpacity}
                className={i % 15 === 0 ? "animate-pulse" : ""}
              />
            );
          })}

          {/* Large cross-shaped twinkling stars (Pixel art style) */}
          {Array.from({ length: 15 }).map((_, i) => {
            const x = ((Math.sin(i * 33.33) + 1) / 2) * (typeof window !== 'undefined' ? window.innerWidth : 1920);
            const y = ((Math.cos(i * 44.44) + 1) / 2) * (typeof window !== 'undefined' ? window.innerHeight : 1080);
            
            const starOpacity = unfoldProgress < 0.6 ? 0 : Math.max(0, Math.min(1, Math.pow((unfoldProgress - 0.6) * 2.5, 3) * 0.8));
            const isYellowish = i % 3 === 0;
            const color = isYellowish ? "#F5DEB3" : "#E8F5E9"; // Wheat / Bright Mint

            return (
              <g 
                key={`star-cross-${i}`} 
                transform={`translate(${x}, ${y})`} 
                opacity={starOpacity}
                className="animate-pulse"
                style={{ animationDuration: `${2 + i % 3}s` }}
              >
                <rect x="-1" y="-4" width="2" height="8" fill={color} />
                <rect x="-4" y="-1" width="8" height="2" fill={color} />
                <rect x="-1" y="-1" width="2" height="2" fill="#FFF" />
              </g>
            );
          })}
        </g>

        {/* Foreground Graph Layer */}
        <g style={{
          transformOrigin: zoomTarget ? `${zoomTarget.x}px ${zoomTarget.y}px` : '50% 50%',
          transform: typeof window !== 'undefined' 
            ? `translate(${(mousePos.x - window.innerWidth / 2) * -0.05}px, ${(mousePos.y - window.innerHeight / 2) * -0.05}px) scale(${hoveredNode && unfoldProgress >= 1 ? 2.5 : 1})` 
            : 'translate(0, 0) scale(1)',
          opacity: 1, // Graph stays visible, never fades out
          pointerEvents: 'auto', // Graph always interactive
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform-origin 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease'
        }}>
          {/* Subtle background grid for parallax reference */}
          <g stroke="#1B3B2B" strokeOpacity={0.15} strokeWidth={1} strokeDasharray="2 10">
            {Array.from({ length: 30 }).map((_, i) => (
              <line key={`v-${i}`} x1={i * 100 - 1000} y1={-1000} x2={i * 100 - 1000} y2={window.innerHeight + 1000} />
            ))}
            {Array.from({ length: 30 }).map((_, i) => (
              <line key={`h-${i}`} x1={-1000} y1={i * 100 - 1000} x2={window.innerWidth + 1000} y2={i * 100 - 1000} />
            ))}
          </g>

          {/* Links */}
          <g strokeOpacity={unfoldProgress * 0.8 + 0.1}>
            {links.map((link, i) => {
              const source = link.source as NodeData;
              const target = link.target as NodeData;
              const isHovered = (hoveredNode === source.id || hoveredNode === target.id) && unfoldProgress >= 1;
              
              return (
                <line
                  key={i}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="#2F5A46"
                  strokeWidth={isHovered ? 1.5 : 1}
                  strokeDasharray="4 4"
                  className="transition-all duration-300"
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g>
            {nodes.map((node) => {
              const isHovered = hoveredNode === node.id && unfoldProgress >= 1;
              const isCenter = node.group === 'center';
              
              return (
                <g 
                  key={node.id} 
                  transform={`translate(${node.x || 0},${node.y || 0})`}
                  className={`pointer-events-auto ${unfoldProgress >= 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  onMouseEnter={() => {
                    if (unfoldProgress >= 1) {
                      setHoveredNode(node.id);
                      setZoomTarget({ x: node.x || 0, y: node.y || 0 });
                    }
                  }}
                  onMouseLeave={() => setHoveredNode(null)}
                  onMouseDown={(e) => {
                    if (unfoldProgress >= 1) {
                      handleDragStart(e, node);
                    }
                  }}
                  onTouchStart={(e) => {
                    if (unfoldProgress >= 1) {
                      handleDragStart(e, node);
                    }
                  }}
                >
                  {/* Invisible Hover Area to make hover detection looser */}
                  <circle r={50} fill="transparent" />

                  {/* Faint Outer Ring (Only show when not fully tangled) */}
                  <circle
                    r={node.radius * 2.5}
                    fill="none"
                    stroke="#4ADE80"
                    strokeOpacity={isHovered ? 0.3 : (unfoldProgress > 0.1 ? 0.08 : 0)}
                    strokeWidth={1}
                    className="transition-all duration-500"
                  />
                  
                  {/* Core Node */}
                  <circle
                    r={node.radius}
                    fill={isCenter ? "#C8E6C9" : (isHovered ? "rgba(200, 230, 201, 0.1)" : "none")}
                    stroke="#C8E6C9"
                    strokeWidth={1.5}
                    className="node-glow transition-all duration-300"
                    style={{ opacity: isCenter || unfoldProgress > 0.05 ? 1 : 0 }}
                  />
                  
                  {/* Main Label */}
                  <text
                    textAnchor="middle"
                    dy="2.5em"
                    fill={isCenter ? "#E8F5E9" : (isHovered ? "#E8F5E9" : "#A5D6B7")}
                    className="font-pixel tracking-[0.2em] text-sm transition-colors duration-300"
                    style={{ 
                      pointerEvents: 'none', 
                      userSelect: 'none',
                      opacity: isCenter || unfoldProgress > 0.15 ? 1 : 0,
                      transform: isCenter ? 'scale(1)' : `scale(${Math.min(1, unfoldProgress * 5)})`
                    }}
                  >
                    {node.label}
                  </text>

                  {/* Hex Address */}
                  <text
                    textAnchor="middle"
                    dy="4.5em"
                    fill="#366B4E"
                    className="font-pixel text-[10px] tracking-[0.3em] transition-colors duration-300"
                    style={{ 
                      pointerEvents: 'none', 
                      userSelect: 'none',
                      opacity: unfoldProgress > 0.4 ? (unfoldProgress - 0.4) * 2 : 0
                    }}
                  >
                    {node.address}
                  </text>

                  {/* Sub-nodes that pop out on hover */}
                  {isHovered && SUB_NODES_MAP[node.id]?.map((sub, idx, arr) => {
                    const angle = (idx / arr.length) * Math.PI * 2 - Math.PI / 2; 
                    const dist = 35; 
                    const sx = Math.cos(angle) * dist;
                    const sy = Math.sin(angle) * dist;
                    return (
                      <g 
                        key={`sub-${sub.id}`} 
                        className={`transition-all duration-300 ${sub.link ? 'cursor-pointer hover:opacity-80' : ''}`} 
                        style={{ animation: 'zoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                        onClick={(e) => {
                          if (sub.link) {
                            e.stopPropagation();
                            window.location.href = sub.link; // Or use React Router if implemented later
                          }
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                      >
                        <line x1={0} y1={0} x2={sx} y2={sy} stroke="#4ADE80" strokeWidth={0.5} strokeDasharray="1 2" opacity={0.5} />
                        <circle cx={sx} cy={sy} r={1.5} fill={sub.link ? "#4ADE80" : "#C8E6C9"} />
                        <text x={sx} y={sy - 4} textAnchor="middle" fill={sub.link ? "#4ADE80" : "#A5D6B7"} className="font-pixel text-[5px]">{sub.label}</text>
                      </g>
                    )
                  })}
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* HUD Modules Layer - Top Bar on Mobile, Vertical Left Sidebar on Desktop */}
      {unfoldProgress > 1.0 && (
        <div className="absolute top-8 md:top-0 left-1/2 md:left-12 -translate-x-1/2 md:translate-x-0 bottom-auto md:bottom-0 py-0 md:py-32 w-[90%] md:w-auto pointer-events-none z-20 flex flex-row md:flex-col justify-center md:justify-between gap-4 md:gap-0 font-pixel">
          
          {/* ARCHIVE / BLOG */}
          <div 
            className="pointer-events-auto flex items-center gap-4 cursor-pointer group"
            style={{ 
              opacity: progArchive,
              transform: dimensions.width < 768 ? `translateY(${(1 - progArchive) * -100}px)` : `translateX(${(1 - progArchive) * -100}px)`,
              display: progArchive === 0 ? 'none' : 'flex'
            }}
            onClick={() => window.location.href = '/blog'}
          >
            <div className="w-12 h-12 border border-[#4ADE80] flex items-center justify-center bg-[#0a140f]/90 group-hover:bg-[#1B3B2B] transition-colors relative z-10 shadow-[0_0_15px_rgba(74,222,128,0.2)]">
              <div className="absolute inset-0 noise"></div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="1.5" className={progArchive === 1 ? "group-hover:animate-pulse" : ""}>
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
            </div>
            <div 
              className="hidden md:block overflow-hidden"
              style={{
                maxWidth: `${progArchive * 200}px`,
                opacity: progArchive > 0.5 ? (progArchive - 0.5) * 2 : 0
              }}
            >
              <div className="pl-2 whitespace-nowrap">
                <h3 className="text-[#4ADE80] tracking-[0.3em] text-lg md:text-xl">碎碎念</h3>
                <p className="text-[#4a6b57] text-xs tracking-widest mt-1">/logs</p>
              </div>
            </div>
          </div>

          {/* PROJECTS */}
          <div 
            className="pointer-events-auto flex items-center gap-4 cursor-pointer group"
            style={{ 
              opacity: progProjects,
              transform: dimensions.width < 768 ? `translateY(${(1 - progProjects) * -100}px)` : `translateX(${(1 - progProjects) * -100}px)`,
              display: progProjects === 0 ? 'none' : 'flex'
            }}
            onClick={() => window.location.href = '/blog'}
          >
            <div className="w-12 h-12 border border-[#81D4FA] flex items-center justify-center bg-[#0a140f]/90 group-hover:bg-[#01579B]/30 transition-colors relative z-10 shadow-[0_0_15px_rgba(129,212,250,0.2)]">
              <div className="absolute inset-0 noise"></div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#81D4FA" strokeWidth="1.5" className={progProjects === 1 ? "group-hover:animate-pulse" : ""}>
                <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
                <rect x="9" y="9" width="6" height="6"/>
                <line x1="9" y1="1" x2="9" y2="4"/>
                <line x1="15" y1="1" x2="15" y2="4"/>
                <line x1="9" y1="20" x2="9" y2="23"/>
                <line x1="15" y1="20" x2="15" y2="23"/>
                <line x1="20" y1="9" x2="23" y2="9"/>
                <line x1="20" y1="14" x2="23" y2="14"/>
                <line x1="1" y1="9" x2="4" y2="9"/>
                <line x1="1" y1="14" x2="4" y2="14"/>
              </svg>
            </div>
            <div 
              className="hidden md:block overflow-hidden"
              style={{
                maxWidth: `${progProjects * 200}px`,
                opacity: progProjects > 0.5 ? (progProjects - 0.5) * 2 : 0
              }}
            >
              <div className="pl-2 whitespace-nowrap">
                <h3 className="text-[#81D4FA] tracking-[0.3em] text-lg md:text-xl">個人項目</h3>
                <p className="text-[#0277BD] text-xs tracking-widest mt-1">/projects</p>
              </div>
            </div>
          </div>

          {/* SETTINGS */}
          <div 
            className="pointer-events-auto flex items-center gap-4 group"
            style={{ 
              opacity: progSettings,
              transform: dimensions.width < 768 ? `translateY(${(1 - progSettings) * -100}px)` : `translateX(${(1 - progSettings) * -100}px)`,
              display: progSettings === 0 ? 'none' : 'flex'
            }}
          >
            <div className="w-12 h-12 border border-[#B39DDB] flex items-center justify-center bg-[#0a140f]/90 relative z-10 shadow-[0_0_15px_rgba(179,157,219,0.2)]">
              <div className="absolute inset-0 noise"></div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B39DDB" strokeWidth="1.5" className={progSettings === 1 ? "animate-[spin_4s_linear_infinite]" : ""}>
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </div>
            <div 
              className="hidden md:flex overflow-hidden flex-col gap-2"
              style={{
                maxWidth: `${progSettings * 200}px`,
                opacity: progSettings > 0.5 ? (progSettings - 0.5) * 2 : 0
              }}
            >
              <div className="pl-2 whitespace-nowrap">
                <h3 className="text-[#B39DDB] tracking-[0.3em] text-lg md:text-xl">系統設定</h3>
                <p className="text-[#7E57C2] text-xs tracking-widest mt-1">/sys_config</p>
              </div>
              <div className="pl-2 flex gap-2 text-[10px] whitespace-nowrap">
                {['繁', '简', 'EN'].map(l => (
                  <button 
                    key={l}
                    onClick={() => setLang(l)}
                    className={`transition-colors ${lang === l ? 'text-[#B39DDB] font-bold' : 'text-[#7E57C2] hover:text-[#D1C4E9]'}`}
                  >
                    [{l}]
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* LINKS */}
          <div 
            className="pointer-events-auto flex items-center gap-4 cursor-pointer group"
            style={{ 
              opacity: progLinks,
              transform: dimensions.width < 768 ? `translateY(${(1 - progLinks) * -100}px)` : `translateX(${(1 - progLinks) * -100}px)`,
              display: progLinks === 0 ? 'none' : 'flex'
            }}
            onClick={() => window.open('https://github.com/tinchak0207', '_blank')}
          >
            <div className="w-12 h-12 border border-[#FFCC80] flex items-center justify-center bg-[#0a140f]/90 group-hover:bg-[#E65100]/30 transition-colors relative z-10 shadow-[0_0_15px_rgba(255,204,128,0.2)]">
              <div className="absolute inset-0 noise"></div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFCC80" strokeWidth="1.5" className={progLinks === 1 ? "group-hover:animate-pulse" : ""}>
                <polyline points="4 17 10 11 4 5"/>
                <line x1="12" y1="19" x2="20" y2="19"/>
              </svg>
            </div>
            <div 
              className="hidden md:block overflow-hidden"
              style={{
                maxWidth: `${progLinks * 200}px`,
                opacity: progLinks > 0.5 ? (progLinks - 0.5) * 2 : 0
              }}
            >
              <div className="pl-2 whitespace-nowrap">
                <h3 className="text-[#FFCC80] tracking-[0.3em] text-lg md:text-xl">外部鏈接</h3>
                <p className="text-[#EF6C00] text-xs tracking-widest mt-1">/external_uplinks</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Hover Tooltip */}
      <AnimatePresence>
        {hoveredNode && unfoldProgress >= 1 && unfoldProgress <= 1.1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 pointer-events-none border border-[#4ADE80]/30 bg-[#030a07]/95 p-4 backdrop-blur-md shadow-[0_0_15px_rgba(74,222,128,0.15)] min-w-[150px] max-w-[250px]"
            style={{ left: mousePos.x + 20, top: mousePos.y + 20 }}
          >
            <h3 className="font-pixel text-[#E8F5E9] text-sm mb-1">
              {nodes.find(n => n.id === hoveredNode)?.label}
            </h3>
            <p className="font-pixel text-[#4a6b57] text-[10px] tracking-widest">
              {nodes.find(n => n.id === hoveredNode)?.address}
            </p>
            <div className="w-full h-px bg-[#1B3B2B] my-2"></div>
            
            {/* Display Subnodes in Tooltip */}
            {SUB_NODES_MAP[hoveredNode] && SUB_NODES_MAP[hoveredNode].length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                {SUB_NODES_MAP[hoveredNode].map(sub => (
                  <div key={sub.id} className="flex flex-col">
                    <span className="font-pixel text-[#A5D6B7] text-[10px]">• {sub.label}</span>
                    {sub.desc && (
                      <span className="font-pixel text-[#4a6b57] text-[8px] ml-2 leading-relaxed">{sub.desc}</span>
                    )}
                    {sub.link && (
                      <span className="font-pixel text-[#4ADE80] text-[8px] ml-2 mt-0.5 animate-pulse">
                        [ LINK: {sub.link} ]
                      </span>
                    )}
                  </div>
                ))}
                <div className="w-full h-px bg-[#1B3B2B] my-1"></div>
              </div>
            )}
            
            <p className="font-pixel text-[#4ADE80] text-[10px] animate-pulse mt-1">STATUS: ACTIVE // NEURAL SYNC</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};