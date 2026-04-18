import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as d3 from 'd3-force';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

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
  sx?: number;
  sy?: number;
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

export interface GraphProps {
  onReady?: () => void;
  isBooting?: boolean;
}

const Starfield = React.memo(({ 
  unfoldProgress 
}: { 
  unfoldProgress: number 
}) => {
  // Pre-calculate all star data to prevent heavy math on every render tick
  const starData = React.useMemo(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const h = typeof window !== 'undefined' ? window.innerHeight : 1080;
    
    const baseStars = Array.from({ length: 400 }).map((_, i) => {
      const x = ((Math.sin(i * 12.345) + 1) / 2) * (w + 800) - 400;
      const y = ((Math.cos(i * 54.321) + 1) / 2) * (h + 800) - 400;
      const size = ((Math.sin(i * 98.765) + 1) / 2) * 1 + 0.5;
      const fill = i % 3 === 0 ? "#8FBC8F" : "#A5D6B7";
      const isPulse = i % 10 === 0;
      const opacityMult = (Math.sin(i) + 1) / 2 * 0.4 + 0.1;
      return { id: `base-${i}`, x, y, size, fill, isPulse, opacityMult };
    });

    const mwStars = Array.from({ length: 800 }).map((_, i) => {
      const t = ((Math.sin(i * 3.14159) + 1) / 2); 
      const baseX = t * (w + 800) - 400;
      const baseY = h - (t * (h + 800) - 400) + Math.sin(t * Math.PI * 3) * 150; 
      const spread = (Math.pow(Math.sin(i * 7.777), 3)) * 250;
      const x = baseX + Math.cos(i * 11.11) * spread;
      const y = baseY + Math.sin(i * 11.11) * spread;
      const distFromCenter = Math.abs(spread) / 250;
      const size = distFromCenter < 0.2 ? 0.8 : (distFromCenter < 0.6 ? 1.2 : 1.5);
      const baseOpacity = 1 - Math.pow(distFromCenter, 0.5);
      const fill = distFromCenter < 0.15 ? "#E8F5E9" : (i % 4 === 0 ? "#7da38a" : "#366B4E");
      const isPulse = i % 15 === 0;
      return { id: `mw-${i}`, x, y, size, fill, isPulse, baseOpacity };
    });

    const crossStars = Array.from({ length: 15 }).map((_, i) => {
      const x = ((Math.sin(i * 33.33) + 1) / 2) * w;
      const y = ((Math.cos(i * 44.44) + 1) / 2) * h;
      const isYellowish = i % 3 === 0;
      const fill = isYellowish ? "#F5DEB3" : "#E8F5E9";
      const animDuration = `${2 + i % 3}s`;
      return { id: `cross-${i}`, x, y, fill, animDuration };
    });

    return { baseStars, mwStars, crossStars };
  }, []); // Only recalculates on mount (or if we added dimensions dependency)

  return (
    <g style={{
      transform: 'translate(calc(var(--mouse-x, 0px) * -0.015), calc(var(--mouse-y, 0px) * -0.015))',
      transition: 'transform 0.1s ease-out'
    }}>
      {/* Base scattered tiny stars */}
      {starData.baseStars.map((star) => {
        const starOpacity = unfoldProgress < 0.5 ? 0 : Math.max(0, Math.min(1, Math.pow((unfoldProgress - 0.5) * 2, 3) * star.opacityMult));
        return (
          <rect 
            key={star.id} x={star.x} y={star.y} width={star.size} height={star.size} 
            fill={star.fill} 
            opacity={starOpacity}
            className={star.isPulse ? "animate-pulse" : ""}
          />
        );
      })}

      {/* Milky Way Band */}
      {starData.mwStars.map((star) => {
        const starOpacity = unfoldProgress < 0.5 ? 0 : Math.max(0, Math.min(1, Math.pow((unfoldProgress - 0.5) * 2, 4) * star.baseOpacity * 0.7));
        return (
          <rect 
            key={star.id} x={star.x} y={star.y} width={star.size} height={star.size} 
            fill={star.fill} 
            opacity={starOpacity}
            className={star.isPulse ? "animate-pulse" : ""}
          />
        );
      })}

      {/* Large cross-shaped twinkling stars */}
      {starData.crossStars.map((star) => {
        const starOpacity = unfoldProgress < 0.6 ? 0 : Math.max(0, Math.min(1, Math.pow((unfoldProgress - 0.6) * 2.5, 3) * 0.8));
        return (
          <g 
            key={star.id} 
            transform={`translate(${star.x}, ${star.y})`} 
            opacity={starOpacity}
            className="animate-pulse"
            style={{ animationDuration: star.animDuration }}
          >
            <rect x="-1" y="-4" width="2" height="8" fill={star.fill} />
            <rect x="-4" y="-1" width="8" height="2" fill={star.fill} />
            <rect x="-1" y="-1" width="2" height="2" fill="#FFF" />
          </g>
        );
      })}
    </g>
  );
});

export const Graph: React.FC<GraphProps> = ({ onReady, isBooting = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [links, setLinks] = useState<LinkData[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [zoomTarget, setZoomTarget] = useState<{x: number, y: number} | null>(null);
  const simulationRef = useRef<d3.Simulation<NodeData, LinkData> | null>(null);
  const draggingNodeIdRef = useRef<string | null>(null);
  const [unfoldProgress, setUnfoldProgress] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('unfolded');
      if (saved === 'true') return 3;
    }
    return 0;
  });
  const [dimensions, setDimensions] = useState({ width: typeof window !== 'undefined' ? window.innerWidth : 1920, height: typeof window !== 'undefined' ? window.innerHeight : 1080 });

  const [lang, setLang] = useState('繁');

  const [dynamicNodes, setDynamicNodes] = useState<NodeData[]>(INITIAL_NODES);
  const [dynamicLinks, setDynamicLinks] = useState<LinkData[]>(INITIAL_LINKS);
  const [dynamicSubNodes, setDynamicSubNodes] = useState<Record<string, SubNode[]>>(SUB_NODES_MAP);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Graph Nodes and Edges
        const [{ data: graphNodes, error: graphNodesError }, { data: graphEdges, error: graphEdgesError }] = await Promise.all([
          supabase.from('graph_nodes').select('*'),
          supabase.from('graph_edges').select('*')
        ]);
        
        if (graphNodesError) {
          console.warn('Supabase graph_nodes table not found. Using default nodes:', graphNodesError.message);
        } else if (graphNodes && graphNodes.length > 0) {
          const formattedNodes: NodeData[] = graphNodes.map(n => ({
            id: n.id,
            label: n.label,
            address: n.address,
            group: n.group_type as 'center' | 'node',
            radius: n.radius,
          }));
          setDynamicNodes(formattedNodes);
        } else if (graphNodes && graphNodes.length === 0) {
          console.warn('No nodes found in DB. Falling back to INITIAL_NODES.');
          setDynamicNodes(INITIAL_NODES);
        }

        // Handle dynamic edges
        if (graphEdges && graphEdges.length > 0) {
          const formattedEdges: LinkData[] = graphEdges.map(e => ({
            source: e.source,
            target: e.target
          }));
          setDynamicLinks(formattedEdges);
        } else {
          setDynamicLinks(INITIAL_LINKS);
        }

        // Fetch Posts (Ramblings)
        const { data: posts } = await supabase.from('posts').select('id, title, slug, tags').eq('published', true);
        // Fetch Projects
        const { data: projects } = await supabase.from('projects').select('id, title, description, url, tags').eq('published', true);
        // Fetch Links
        const { data: links } = await supabase.from('external_links').select('id, title, url, tags').eq('published', true);

        // Fetch DB SubNodes
        const { data: dbSubNodes } = await supabase.from('graph_subnodes').select('*');

        // Build SubNodes map
        const newSubNodes = { ...SUB_NODES_MAP }; // Keep initial static ones or replace? Let's merge.

        const addToSubNodes = (tags: string[], subNode: SubNode) => {
          if (!tags || !tags.length) return;
          tags.forEach(tag => {
            if (!newSubNodes[tag]) newSubNodes[tag] = [];
            if (!newSubNodes[tag].find(s => s.id === subNode.id)) {
              newSubNodes[tag].push(subNode);
            }
          });
        };

        // Add dynamically created subnodes from Admin
        if (dbSubNodes) {
          dbSubNodes.forEach(s => {
            const parentId = s.parent_node_id;
            if (!newSubNodes[parentId]) newSubNodes[parentId] = [];
            if (!newSubNodes[parentId].find(n => n.id === s.id)) {
              newSubNodes[parentId].push({
                id: s.id,
                label: s.label,
                desc: s.description || undefined,
                link: s.url || undefined
              });
            }
          });
        }

        if (posts) {
          posts.forEach(p => addToSubNodes(p.tags, {
            id: `post-${p.id}`,
            label: p.title || 'Untitled Log',
            link: `/blog/${p.slug}`,
            desc: 'Log Entry'
          }));
        }
        if (projects) {
          projects.forEach(p => addToSubNodes(p.tags, {
            id: `proj-${p.id}`,
            label: p.title,
            link: p.url || '#',
            desc: 'Project'
          }));
        }
        if (links) {
          links.forEach(l => addToSubNodes(l.tags, {
            id: `link-${l.id}`,
            label: l.title,
            link: l.url || '#',
            desc: 'External Link'
          }));
        }

        setDynamicSubNodes(newSubNodes);
      } catch (err) {
        console.error('Failed to fetch graph data:', err);
      }
    };
    fetchData();
  }, []);

  // Handle window resize
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      setDimensions({
        width: containerRef.current?.clientWidth || window.innerWidth,
        height: containerRef.current?.clientHeight || window.innerHeight
      });
    };
    
    window.addEventListener('resize', updateDimensions);
    updateDimensions();
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Update dynamicSubNodes when window resizes or dimensions change
  useEffect(() => {
    // Generate sub-nodes dynamically based on DB sub_nodes or fallback to SUB_NODES_MAP
    const newDynamicSubNodes: Record<string, any[]> = {};
    
    nodes.forEach(node => {
      if (node.group === 'center') return;
      
      const subNodesData = SUB_NODES_MAP[node.id] || [];
      if (subNodesData.length > 0) {
        newDynamicSubNodes[node.id] = subNodesData.map((sub, idx, arr) => {
          const angle = (idx / arr.length) * Math.PI * 2 - Math.PI / 2;
          const dist = 35; // Initial intended distance
          let sx = Math.cos(angle) * dist;
          let sy = Math.sin(angle) * dist;
          
          // Calculate absolute screen position to check boundaries
          const absoluteX = (node.x || 0) + sx;
          const absoluteY = (node.y || 0) + sy;
          
          // Screen padding
          const padding = 20;
          
          // Adjust local offsets (sx, sy) if the absolute position goes out of bounds
          if (absoluteX < padding) sx += (padding - absoluteX);
          if (absoluteX > dimensions.width - padding) sx -= (absoluteX - (dimensions.width - padding));
          if (absoluteY < padding) sy += (padding - absoluteY);
          if (absoluteY > dimensions.height - padding) sy -= (absoluteY - (dimensions.height - padding));

          return { ...sub, sx, sy }; // Store pre-calculated, boundary-safe local offsets
        });
      }
    });
    
    setDynamicSubNodes(newDynamicSubNodes);
  }, [nodes, dimensions]); // Recalculate when nodes or screen size change

  const isBootingRef = useRef(isBooting);
  useEffect(() => {
    isBootingRef.current = isBooting;
    if (!isBooting && simulationRef.current) {
      // Wake up the simulation when booting finishes
      simulationRef.current.alpha(0.3).restart();
    }
  }, [isBooting]);

  useEffect(() => {
    if (!containerRef.current) return;
    const { width, height } = dimensions;

    const simNodes = dynamicNodes.map(d => ({ ...d }));
    // Generate links if they are not defined in DB yet? We just use INITIAL_LINKS for now
    let simLinks = INITIAL_LINKS.map(d => ({ ...d }));
    
    // If we loaded custom nodes, try to find matching links from dynamicLinks
    // If none match, we will create a dynamic web instead of a boring star shape
    if (dynamicNodes !== INITIAL_NODES) {
      // First, see if we have valid links from our dynamicLinks that match the current DB nodes
      const validInitialLinks = dynamicLinks.filter(l => 
        dynamicNodes.some(n => n.id === l.source) && dynamicNodes.some(n => n.id === l.target)
      );

      if (validInitialLinks.length > 0) {
        simLinks = validInitialLinks.map(d => ({ ...d }));
      } else {
        // Create a more dynamic, interconnected web rather than a static star
        const centerNode = dynamicNodes.find(n => n.group === 'center') || dynamicNodes[0];
        const otherNodes = dynamicNodes.filter(n => n.id !== centerNode.id);
        
        simLinks = [];
        if (centerNode) {
          otherNodes.forEach((n, i) => {
            // 1. Connect everything to center (base)
            simLinks.push({ source: centerNode.id, target: n.id });
            
            // 2. Connect to neighbors to create a web/ring (more dynamic tension)
            if (i > 0) {
              simLinks.push({ source: otherNodes[i-1].id, target: n.id });
            }
            
            // 3. Add some random cross-connections for organic chaos
            if (Math.random() > 0.6 && otherNodes.length > 3) {
              const randomTarget = otherNodes[Math.floor(Math.random() * otherNodes.length)];
              if (randomTarget.id !== n.id) {
                simLinks.push({ source: n.id, target: randomTarget.id });
              }
            }
          });
          
          // Close the ring
          if (otherNodes.length > 2) {
            simLinks.push({ source: otherNodes[otherNodes.length - 1].id, target: otherNodes[0].id });
          }
        }
      }
    }

    // Don't strictly fix the center node, just use strong centering force
    // This allows the whole graph to breathe and bounce organically
    const center = simNodes.find(n => n.group === 'center');
    if (center) {
      center.x = width / 2;
      center.y = height / 2;
      // We removed fx/fy to let it float slightly
    }

    const simulation = d3.forceSimulation<NodeData, LinkData>(simNodes)
      .force('link', d3.forceLink<NodeData, LinkData>(simLinks).id(d => d.id))
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(width / 2, height / 2).strength(1))
      .force('collide', d3.forceCollide<NodeData>().radius(d => d.radius + 30));

    simulation.on('tick', () => {
      // If we are booting, skip the expensive React re-renders to save CPU for the terminal typing animation.
      if (!isBootingRef.current) {
        setNodes([...simulation.nodes()]);
        setLinks([...simLinks]);
      }
    });

    // Remove the synchronous fast-forward loop to let the graph explode dynamically on screen
    // for (let i = 0; i < 50; ++i) simulation.tick();
    
    // Set initial positions even if booting
    setNodes([...simulation.nodes()]);
    setLinks([...simLinks]);

    simulationRef.current = simulation;

    // Signal that the heavy lifting is done
    if (onReady) {
      requestAnimationFrame(() => onReady());
    }

    return () => {
      simulation.stop();
    };
  }, [dynamicNodes, dynamicLinks]);

  useEffect(() => {
    if (!simulationRef.current) return;
    const sim = simulationRef.current;
    
    // Update center node position on resize
    const centerNode = sim.nodes().find(n => n.group === 'center');
    if (centerNode) {
      centerNode.x = dimensions.width / 2;
      centerNode.y = dimensions.height / 2;
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
    
    // Bounding box force to gently push nodes back into screen, but not hard clamp them
    sim.force('bounding', () => {
      const padding = isMobile ? 30 : 80;
      const { width, height } = dimensions;
      
      for (let node of sim.nodes()) {
        if (node.x !== undefined && node.x < padding) {
          node.vx! += (padding - node.x) * 0.1; // gentle push back
        }
        if (node.x !== undefined && node.x > width - padding) {
          node.vx! -= (node.x - (width - padding)) * 0.1;
        }
        if (node.y !== undefined && node.y < padding) {
          node.vy! += (padding - node.y) * 0.1;
        }
        if (node.y !== undefined && node.y > height - padding) {
          node.vy! -= (node.y - (height - padding)) * 0.1;
        }
      }
    });

    // Never let alpha hit exactly 0 so the graph has a permanent tiny breathing movement
    sim.alphaTarget(0.02).restart();
    sim.alpha(easeProgress < 0.1 ? 1 : 0.6).restart(); 
  }, [unfoldProgress, dimensions]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      setUnfoldProgress(prev => {
        // Slow down on mobile/small screens
        let delta = e.deltaY * (dimensions.width < 768 ? 0.001 : 0.002);
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
        // Slow down the mobile scroll to ensure users have time to see the modules
        let delta = deltaY * 0.0015;
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
    
    // We let ALL nodes float now, no hard fixing on drag end
    node.fx = null;
    node.fy = null;
    
    // Restore the tiny baseline alpha to keep breathing
    simulationRef.current.alphaTarget(0.02);
  };

  // Calculate hint color interpolating from Green to Cyan to Purple over the full 0-2.8 progress
  const calculateHintColor = () => {
    const ratio = Math.min(1, Math.max(0, unfoldProgress / 2.8));
    let r, g, b;
    if (ratio < 0.5) {
      const r1 = ratio * 2; // 0 to 1
      r = Math.round(74 + (129 - 74) * r1);
      g = Math.round(222 + (212 - 222) * r1);
      b = Math.round(128 + (250 - 128) * r1);
    } else {
      const r2 = (ratio - 0.5) * 2; // 0 to 1
      r = Math.round(129 + (179 - 129) * r2);
      g = Math.round(212 + (157 - 212) * r2);
      b = Math.round(250 + (219 - 250) * r2);
    }
    return `rgb(${r}, ${g}, ${b})`;
  };
  const hintColor = calculateHintColor();

  const isMobile = dimensions.width < 768;
  const defaultText = isMobile ? '向上滑動' : '向下滾動';
  const [glitchText, setGlitchText] = useState(defaultText);
  
  useEffect(() => {
    if (unfoldProgress >= 2.8 && typeof window !== 'undefined') {
      sessionStorage.setItem('unfolded', 'true');
    }
  }, [unfoldProgress]);

  useEffect(() => {
    if (unfoldProgress <= 1.0) {
      setGlitchText(defaultText);
      return;
    }
    
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        const chars = isMobile ? '向上滑動!@#$%^&*()_+-=' : '向滾動下!@#$%^&*()_+-=';
        const glitched = defaultText.split('').map(c => Math.random() > 0.7 ? chars[Math.floor(Math.random() * chars.length)] : c).join('');
        setGlitchText(glitched);
        setTimeout(() => setGlitchText(defaultText), 100);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [unfoldProgress, defaultText, isMobile]);

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
        const mx = e.clientX - window.innerWidth / 2;
        const my = e.clientY - window.innerHeight / 2;
        if (containerRef.current) {
          containerRef.current.style.setProperty('--mouse-x', `${mx}px`);
          containerRef.current.style.setProperty('--mouse-y', `${my}px`);
          // Also set raw mouse coords for the tooltip
          containerRef.current.style.setProperty('--raw-mouse-x', `${e.clientX}px`);
          containerRef.current.style.setProperty('--raw-mouse-y', `${e.clientY}px`);
        }

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
        className={`absolute bottom-16 left-1/2 -translate-x-1/2 font-pixel text-sm opacity-80 tracking-[0.3em] pointer-events-none transition-all duration-700 flex flex-col items-center gap-3 ${unfoldProgress >= 2.8 ? 'opacity-0 translate-y-10' : ''}`}
        style={{ 
          opacity: unfoldProgress >= 2.8 ? 0 : (unfoldProgress < 0.8 ? 0.8 : 1), // Fade out after 2.8
          transform: `translate(-50%, ${unfoldProgress > 0.8 && unfoldProgress < 2.8 ? '20px' : (unfoldProgress >= 2.8 ? '40px' : '0')})`,
          textShadow: `0 0 10px ${hintColor}`,
          color: hintColor
        }}
      >
        <div className="flex flex-col items-center gap-1 animate-bounce">
          {isMobile ? (
            <svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
              {/* Pixel Hand/Swipe Up Icon */}
              <path d="M12 0H14V4H16V8H18V14H20V20H22V30H20V34H18V36H6V34H4V30H2V20H4V14H6V8H8V4H10V0H12Z" fill="currentColor" fillOpacity="0.2"/>
              <path d="M12 2H14V4H16V8H18V14H20V20H22V30H20V32H18V34H6V32H4V30H2V20H4V14H6V8H8V4H10V2H12Z" fill="#030a07"/>
              <path d="M12 0H14V2H12V0ZM10 2H12V4H10V2ZM14 4H16V8H14V4ZM8 4H10V8H8V4ZM16 8H18V14H16V8ZM6 8H8V14H6V8ZM18 14H20V20H18V14ZM4 14H6V20H4V14ZM20 20H22V30H20V20ZM2 20H4V30H2V20ZM20 30H18V34H20V30ZM4 30H6V34H4V30ZM18 34H6V36H18V34Z" fill="currentColor"/>
              {/* Swipe Arrow Detail */}
              <path d="M10 12H14V14H10V12ZM8 14H10V16H8V14ZM14 14H16V16H14V14ZM12 16H14V24H12V16ZM10 16H12V24H10V16Z" fill="currentColor" className="animate-pulse"/>
            </svg>
          ) : (
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
          )}
          <div className="w-0.5 h-6 mt-1" style={{ background: `linear-gradient(to ${isMobile ? 'top' : 'bottom'}, ${hintColor}, transparent)` }}></div>
        </div>
        <p className="font-bold mt-1 transition-colors duration-500">{glitchText}</p>
        
        {/* Pixel SVG Charging Progress Bar */}
        <div className="flex flex-col items-center gap-1 mt-1" style={{ filter: `drop-shadow(0 0 5px ${hintColor})` }}>
          <svg width="120" height="24" viewBox="0 0 120 24">
            {/* Top and Bottom Borders */}
            <rect x="4" y="2" width="100" height="2" fill="currentColor" opacity="0.8"/>
            <rect x="4" y="20" width="100" height="2" fill="currentColor" opacity="0.8"/>
            {/* Left and Right Borders */}
            <rect x="2" y="4" width="2" height="16" fill="currentColor" opacity="0.8"/>
            <rect x="104" y="4" width="2" height="16" fill="currentColor" opacity="0.8"/>
            {/* Battery Terminal */}
            <rect x="106" y="8" width="4" height="8" fill="currentColor" opacity="0.8"/>
            
            {/* Segmented Fill for pixel effect (20 segments) */}
            <g>
              {Array.from({ length: 20 }).map((_, i) => (
                 <rect 
                   key={i} 
                   x={6 + i * 5} 
                   y="6" 
                   width="4" 
                   height="12" 
                   fill="currentColor" 
                   opacity={(unfoldProgress / 2.8) > (i / 20) ? 1 : 0.15} 
                   className="transition-opacity duration-300"
                 />
              ))}
            </g>
          </svg>
        </div>
      </div>

      <svg width="100%" height="100%" className="overflow-visible pointer-events-none absolute inset-0 z-0">
        {/* Starfield Background Layer (Dense Pixel Art Milky Way) */}
        <Starfield unfoldProgress={unfoldProgress} />

        {/* Foreground Graph Layer */}
        <g style={{
          transformOrigin: zoomTarget ? `${zoomTarget.x}px ${zoomTarget.y}px` : '50% 50%',
          transform: `translate(calc(var(--mouse-x, 0px) * -0.05), calc(var(--mouse-y, 0px) * -0.05)) scale(${hoveredNode && hoveredNode !== 'ME' && unfoldProgress >= 1 ? 2.5 : 1})`,
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
              const isHoveredNode = hoveredNode === source.id || hoveredNode === target.id;
              const isAnyHovered = hoveredNode !== null;
              
              // Only show center links after unfoldProgress starts
              // When unfoldProgress <= 0.1 (booting just finished), center links should be invisible
              const isCenterLink = source.group === 'center' || target.group === 'center';
              const baseOpacity = isCenterLink && unfoldProgress <= 0.1 ? 0 : 0.3;
              
              // Obsidian style link highlighting
              const linkOpacity = isAnyHovered ? (isHoveredNode ? 0.8 : 0.1) : baseOpacity;
              const linkColor = isHoveredNode ? "#A5D6B7" : "#4a6b57";
              const linkWidth = isHoveredNode ? 1.5 : 1;

              return (
                <line
                  key={i}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={linkColor}
                  strokeOpacity={linkOpacity}
                  strokeWidth={linkWidth}
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
              
              // Determine if this node is a neighbor of the hovered node
              const isNeighbor = hoveredNode && links.some(l => {
                const s = l.source as NodeData;
                const t = l.target as NodeData;
                return (s.id === hoveredNode && t.id === node.id) || (t.id === hoveredNode && s.id === node.id);
              });

              const isAnyHovered = hoveredNode !== null;
              const isHighlighted = isHovered || isNeighbor;
              
              // Obsidian style node opacity
              const nodeOpacity = isAnyHovered ? (isHighlighted ? 1 : 0.15) : 1;
              
              // Obsidian style node colors
              let nodeFill = "#8b949e"; // default gray
              if (isCenter) nodeFill = "#4ADE80"; // center is green
              if (isHovered) nodeFill = "#B39DDB"; // hovered is purple
              else if (isNeighbor) nodeFill = "#A5D6B7"; // neighbor is light green

              return (
                <React.Fragment key={node.id}>
                  <g 
                    transform={`translate(${node.x || 0},${node.y || 0})`}
                    className={`pointer-events-auto ${unfoldProgress >= 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    style={{ opacity: nodeOpacity, transition: 'opacity 0.3s ease' }}
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
                    {/* Invisible Hover Area */}
                    <circle r={25} fill="transparent" />
                    
                    {/* Core Node - Solid Circle like Obsidian */}
                    <circle
                      r={isHovered && !isCenter ? node.radius * 1.5 : node.radius}
                      fill={nodeFill}
                      className="transition-all duration-300"
                      style={{ opacity: isCenter || unfoldProgress > 0.05 ? 1 : 0 }}
                    />
                    
                    {/* Main Label */}
                    <text
                      textAnchor="middle"
                      dy="1.5em"
                      fill={isHighlighted ? "#E8F5E9" : "#8b949e"}
                      className="font-pixel tracking-widest text-xs transition-colors duration-300"
                      style={{ 
                        pointerEvents: 'none', 
                        userSelect: 'none',
                        opacity: isCenter || unfoldProgress > 0.15 ? (isAnyHovered && !isHighlighted ? 0.3 : 1) : 0,
                        transform: isCenter ? 'scale(1)' : `scale(${Math.min(1, unfoldProgress * 5)})`
                      }}
                    >
                      {node.label}
                    </text>

                  {/* Hex Address - Removed for Obsidian style, but kept the code commented just in case */}
                  {/*
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
                  */}

                  {/* Sub-nodes that pop out on hover */}
                  {isHovered && !isCenter && dynamicSubNodes[node.id]?.map((sub, idx, arr) => {
                    const sx = sub.sx || 0;
                    const sy = sub.sy || 0;
                    return (
                      <g 
                        key={`sub-${sub.id}`} 
                        className={`transition-all duration-300 ${sub.link ? 'cursor-pointer hover:opacity-80' : ''}`} 
                        style={{ animation: 'zoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                        onClick={(e) => {
                          if (sub.link) {
                            e.stopPropagation();
                            navigate(sub.link);
                          }
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                      >
                        {/* Sub-node connection line - Pixel style */}
                        <line x1={0} y1={0} x2={sx} y2={sy} stroke="#30363d" strokeWidth={1} opacity={0.8} strokeDasharray="2 2" />
                        {/* Sub-node dot - Pixel style (square instead of circle) */}
                        <rect x={sx - 1.5} y={sy - 1.5} width={3} height={3} fill={sub.link ? "#58a6ff" : "#8b949e"} />
                        {/* Sub-node label - Pixel style */}
                        <text x={sx} y={sy - 5} textAnchor="middle" fill={sub.link ? "#58a6ff" : "#8b949e"} className="font-pixel text-[8px] tracking-wide">{sub.label}</text>
                      </g>
                    )
                  })}
                </g>
              </React.Fragment>
            );
          })}
        </g>
        </g>
      </svg>

      {/* HUD Modules Layer - Mobile Top Bar */}
      {unfoldProgress > 1.0 && (
        <div className="md:hidden absolute top-8 left-0 right-0 pointer-events-none z-20 flex flex-col items-center gap-3 font-pixel px-4">
          <div className="flex justify-center gap-3 w-full">
          {/* ARCHIVE */}
          <div className="relative">
            {/* Mobile Firework */}
            {unfoldProgress >= 1.0 && unfoldProgress < 1.2 && (() => {
              const p = (unfoldProgress - 1.0) / 0.2;
              const easeOutQuart = 1 - Math.pow(1 - p, 4);
              const cx = dimensions.width / 2;
              const cy = dimensions.height / 2;
              const tx = dimensions.width / 2 - 78;
              const ty = 52;
              const fx = cx + (tx - cx) * easeOutQuart;
              const fy = cy + (ty - cy) * easeOutQuart;
              const tailLength = 60;
              const angle = Math.atan2(ty - cy, tx - cx);
              const tailX = fx - Math.cos(angle) * tailLength * p;
              const tailY = fy - Math.sin(angle) * tailLength * p;
              return (
                <div className="fixed pointer-events-none z-50" style={{ left: 0, top: 0 }}>
                  <svg width={dimensions.width} height={dimensions.height}>
                    <line x1={tailX} y1={tailY} x2={fx} y2={fy} stroke="#FFB74D" strokeWidth={2} opacity={0.9} strokeDasharray="4 4" filter="drop-shadow(0 0 3px #F57C00)" />
                    <rect x={fx - 2} y={fy - 2} width={4} height={4} fill="#FFE082" filter="drop-shadow(0 0 4px #FFB74D)" />
                  </svg>
                </div>
              );
            })()}
            {unfoldProgress >= 1.2 && unfoldProgress < 1.3 && (() => {
              const p = (unfoldProgress - 1.2) / 0.1;
              const easeOut = 1 - Math.pow(1 - p, 3);
              const radius = 15 + easeOut * 45;
              const opacity = 1 - p;
              return (
                <div className="fixed pointer-events-none z-50" style={{ left: dimensions.width / 2 - 78 - 60, top: 52 - 60, width: 120, height: 120 }}>
                  <svg width="120" height="120" className="absolute" style={{ overflow: 'visible' }}>
                    <g transform="translate(60, 60)" opacity={opacity}>
                      {Array.from({ length: 12 }).map((_, i) => {
                        const angle = (i / 12) * Math.PI * 2;
                        const dist = radius * (i % 2 === 0 ? 1 : 0.6);
                        const px = Math.cos(angle) * dist;
                        const py = Math.sin(angle) * dist;
                        const color = i % 3 === 0 ? "#FFE082" : (i % 2 === 0 ? "#FFB74D" : "#F57C00");
                        const size = i % 2 === 0 ? 4 : 2;
                        return (
                          <g key={`m-fw-arch-${i}`}>
                            <rect x={px - size/2} y={py - size/2} width={size} height={size} fill={color} />
                            {p < 0.6 && <rect x={px*0.7 - 1} y={py*0.7 - 1} width={2} height={2} fill={color} opacity={0.5} />}
                          </g>
                        );
                      })}
                      <rect x={-radius*0.4} y={-radius*0.4} width={radius*0.8} height={radius*0.8} fill="none" stroke="#FFB74D" strokeWidth={1} strokeDasharray="2 4" opacity={opacity * 0.7} />
                    </g>
                  </svg>
                </div>
              );
            })()}
            <div 
              className="pointer-events-auto flex items-center justify-center cursor-pointer group"
              style={{ 
                opacity: progArchive,
                transform: `translateY(${(1 - progArchive) * -20}px)`,
                display: progArchive === 0 ? 'none' : 'flex'
              }}
              onClick={() => navigate('/blog')}
            >
              <div className="w-10 h-10 border border-[#4ADE80] flex items-center justify-center bg-[#0a140f]/90 active:bg-[#1B3B2B] transition-colors relative z-10 shadow-[0_0_10px_rgba(74,222,128,0.2)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="1.5">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
              </div>
            </div>
          </div>

          {/* PROJECTS */}
          <div className="relative">
            {/* Mobile Firework */}
            {unfoldProgress >= 1.4 && unfoldProgress < 1.6 && (() => {
              const p = (unfoldProgress - 1.4) / 0.2;
              const easeOutQuart = 1 - Math.pow(1 - p, 4);
              const cx = dimensions.width / 2;
              const cy = dimensions.height / 2;
              const tx = dimensions.width / 2 - 26;
              const ty = 52;
              const fx = cx + (tx - cx) * easeOutQuart;
              const fy = cy + (ty - cy) * easeOutQuart;
              const tailLength = 60;
              const angle = Math.atan2(ty - cy, tx - cx);
              const tailX = fx - Math.cos(angle) * tailLength * p;
              const tailY = fy - Math.sin(angle) * tailLength * p;
              return (
                <div className="fixed pointer-events-none z-50" style={{ left: 0, top: 0 }}>
                  <svg width={dimensions.width} height={dimensions.height}>
                    <line x1={tailX} y1={tailY} x2={fx} y2={fy} stroke="#FFB74D" strokeWidth={2} opacity={0.9} strokeDasharray="4 4" filter="drop-shadow(0 0 3px #F57C00)" />
                    <rect x={fx - 2} y={fy - 2} width={4} height={4} fill="#FFE082" filter="drop-shadow(0 0 4px #FFB74D)" />
                  </svg>
                </div>
              );
            })()}
            {unfoldProgress >= 1.6 && unfoldProgress < 1.7 && (() => {
              const p = (unfoldProgress - 1.6) / 0.1;
              const easeOut = 1 - Math.pow(1 - p, 3);
              const radius = 15 + easeOut * 45;
              const opacity = 1 - p;
              return (
                <div className="fixed pointer-events-none z-50" style={{ left: dimensions.width / 2 - 26 - 60, top: 52 - 60, width: 120, height: 120 }}>
                  <svg width="120" height="120" className="absolute" style={{ overflow: 'visible' }}>
                    <g transform="translate(60, 60)" opacity={opacity}>
                      {Array.from({ length: 12 }).map((_, i) => {
                        const angle = (i / 12) * Math.PI * 2;
                        const dist = radius * (i % 2 === 0 ? 1 : 0.6);
                        const px = Math.cos(angle) * dist;
                        const py = Math.sin(angle) * dist;
                        const color = i % 3 === 0 ? "#FFE082" : (i % 2 === 0 ? "#FFB74D" : "#F57C00");
                        const size = i % 2 === 0 ? 4 : 2;
                        return (
                          <g key={`m-fw-proj-${i}`}>
                            <rect x={px - size/2} y={py - size/2} width={size} height={size} fill={color} />
                            {p < 0.6 && <rect x={px*0.7 - 1} y={py*0.7 - 1} width={2} height={2} fill={color} opacity={0.5} />}
                          </g>
                        );
                      })}
                      <rect x={-radius*0.4} y={-radius*0.4} width={radius*0.8} height={radius*0.8} fill="none" stroke="#FFB74D" strokeWidth={1} strokeDasharray="2 4" opacity={opacity * 0.7} />
                    </g>
                  </svg>
                </div>
              );
            })()}
            <div 
              className="pointer-events-auto flex items-center justify-center cursor-pointer group"
              style={{ 
                opacity: progProjects,
                transform: `translateY(${(1 - progProjects) * -20}px)`,
                display: progProjects === 0 ? 'none' : 'flex'
              }}
              onClick={() => navigate('/projects')}
            >
              <div className="w-10 h-10 border border-[#81D4FA] flex items-center justify-center bg-[#0a140f]/90 active:bg-[#01579B]/30 transition-colors relative z-10 shadow-[0_0_10px_rgba(129,212,250,0.2)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#81D4FA" strokeWidth="1.5">
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
            </div>
          </div>

          {/* LINKS */}
          <div className="relative">
            {/* Mobile Firework */}
            {unfoldProgress >= 2.2 && unfoldProgress < 2.4 && (() => {
              const p = (unfoldProgress - 2.2) / 0.2;
              const easeOutQuart = 1 - Math.pow(1 - p, 4);
              const cx = dimensions.width / 2;
              const cy = dimensions.height / 2;
              const tx = dimensions.width / 2 + 26;
              const ty = 52;
              const fx = cx + (tx - cx) * easeOutQuart;
              const fy = cy + (ty - cy) * easeOutQuart;
              const tailLength = 60;
              const angle = Math.atan2(ty - cy, tx - cx);
              const tailX = fx - Math.cos(angle) * tailLength * p;
              const tailY = fy - Math.sin(angle) * tailLength * p;
              return (
                <div className="fixed pointer-events-none z-50" style={{ left: 0, top: 0 }}>
                  <svg width={dimensions.width} height={dimensions.height}>
                    <line x1={tailX} y1={tailY} x2={fx} y2={fy} stroke="#FFB74D" strokeWidth={2} opacity={0.9} strokeDasharray="4 4" filter="drop-shadow(0 0 3px #F57C00)" />
                    <rect x={fx - 2} y={fy - 2} width={4} height={4} fill="#FFE082" filter="drop-shadow(0 0 4px #FFB74D)" />
                  </svg>
                </div>
              );
            })()}
            {unfoldProgress >= 2.4 && unfoldProgress < 2.5 && (() => {
              const p = (unfoldProgress - 2.4) / 0.1;
              const easeOut = 1 - Math.pow(1 - p, 3);
              const radius = 15 + easeOut * 45;
              const opacity = 1 - p;
              return (
                <div className="fixed pointer-events-none z-50" style={{ left: dimensions.width / 2 + 26 - 60, top: 52 - 60, width: 120, height: 120 }}>
                  <svg width="120" height="120" className="absolute" style={{ overflow: 'visible' }}>
                    <g transform="translate(60, 60)" opacity={opacity}>
                      {Array.from({ length: 12 }).map((_, i) => {
                        const angle = (i / 12) * Math.PI * 2;
                        const dist = radius * (i % 2 === 0 ? 1 : 0.6);
                        const px = Math.cos(angle) * dist;
                        const py = Math.sin(angle) * dist;
                        const color = i % 3 === 0 ? "#FFE082" : (i % 2 === 0 ? "#FFB74D" : "#F57C00");
                        const size = i % 2 === 0 ? 4 : 2;
                        return (
                          <g key={`m-fw-link-${i}`}>
                            <rect x={px - size/2} y={py - size/2} width={size} height={size} fill={color} />
                            {p < 0.6 && <rect x={px*0.7 - 1} y={py*0.7 - 1} width={2} height={2} fill={color} opacity={0.5} />}
                          </g>
                        );
                      })}
                      <rect x={-radius*0.4} y={-radius*0.4} width={radius*0.8} height={radius*0.8} fill="none" stroke="#FFB74D" strokeWidth={1} strokeDasharray="2 4" opacity={opacity * 0.7} />
                    </g>
                  </svg>
                </div>
              );
            })()}
            <div 
              className="pointer-events-auto flex items-center justify-center cursor-pointer group"
              style={{ 
                opacity: progLinks,
                transform: `translateY(${(1 - progLinks) * -20}px)`,
                display: progLinks === 0 ? 'none' : 'flex'
              }}
              onClick={() => navigate('/links')}
            >
              <div className="w-10 h-10 border border-[#FFCC80] flex items-center justify-center bg-[#0a140f]/90 active:bg-[#E65100]/30 transition-colors relative z-10 shadow-[0_0_10px_rgba(255,204,128,0.2)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFCC80" strokeWidth="1.5">
                  <polyline points="4 17 10 11 4 5"/>
                  <line x1="12" y1="19" x2="20" y2="19"/>
                </svg>
              </div>
            </div>
          </div>

          {/* SETTINGS */}
          <div className="relative">
            {/* Mobile Firework */}
            {unfoldProgress >= 1.8 && unfoldProgress < 2.0 && (() => {
              const p = (unfoldProgress - 1.8) / 0.2;
              const easeOutQuart = 1 - Math.pow(1 - p, 4);
              const cx = dimensions.width / 2;
              const cy = dimensions.height / 2;
              const tx = dimensions.width / 2 + 78;
              const ty = 52;
              const fx = cx + (tx - cx) * easeOutQuart;
              const fy = cy + (ty - cy) * easeOutQuart;
              const tailLength = 60;
              const angle = Math.atan2(ty - cy, tx - cx);
              const tailX = fx - Math.cos(angle) * tailLength * p;
              const tailY = fy - Math.sin(angle) * tailLength * p;
              return (
                <div className="fixed pointer-events-none z-50" style={{ left: 0, top: 0 }}>
                  <svg width={dimensions.width} height={dimensions.height}>
                    <line x1={tailX} y1={tailY} x2={fx} y2={fy} stroke="#FFB74D" strokeWidth={2} opacity={0.9} strokeDasharray="4 4" filter="drop-shadow(0 0 3px #F57C00)" />
                    <rect x={fx - 2} y={fy - 2} width={4} height={4} fill="#FFE082" filter="drop-shadow(0 0 4px #FFB74D)" />
                  </svg>
                </div>
              );
            })()}
            {unfoldProgress >= 2.0 && unfoldProgress < 2.1 && (() => {
              const p = (unfoldProgress - 2.0) / 0.1;
              const easeOut = 1 - Math.pow(1 - p, 3);
              const radius = 15 + easeOut * 45;
              const opacity = 1 - p;
              return (
                <div className="fixed pointer-events-none z-50" style={{ left: dimensions.width / 2 + 78 - 60, top: 52 - 60, width: 120, height: 120 }}>
                  <svg width="120" height="120" className="absolute" style={{ overflow: 'visible' }}>
                    <g transform="translate(60, 60)" opacity={opacity}>
                      {Array.from({ length: 12 }).map((_, i) => {
                        const angle = (i / 12) * Math.PI * 2;
                        const dist = radius * (i % 2 === 0 ? 1 : 0.6);
                        const px = Math.cos(angle) * dist;
                        const py = Math.sin(angle) * dist;
                        const color = i % 3 === 0 ? "#FFE082" : (i % 2 === 0 ? "#FFB74D" : "#F57C00");
                        const size = i % 2 === 0 ? 4 : 2;
                        return (
                          <g key={`m-fw-set-${i}`}>
                            <rect x={px - size/2} y={py - size/2} width={size} height={size} fill={color} />
                            {p < 0.6 && <rect x={px*0.7 - 1} y={py*0.7 - 1} width={2} height={2} fill={color} opacity={0.5} />}
                          </g>
                        );
                      })}
                      <rect x={-radius*0.4} y={-radius*0.4} width={radius*0.8} height={radius*0.8} fill="none" stroke="#FFB74D" strokeWidth={1} strokeDasharray="2 4" opacity={opacity * 0.7} />
                    </g>
                  </svg>
                </div>
              );
            })()}
            <div 
              className="pointer-events-auto flex items-center justify-center cursor-pointer group"
              style={{ 
                opacity: progSettings,
                transform: `translateY(${(1 - progSettings) * -20}px)`,
                display: progSettings === 0 ? 'none' : 'flex'
              }}
              onClick={() => navigate('/settings')}
            >
              <div className="w-10 h-10 border border-[#B39DDB] flex items-center justify-center bg-[#0a140f]/90 active:bg-[#4527A0]/30 transition-colors relative z-10 shadow-[0_0_10px_rgba(179,157,219,0.2)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B39DDB" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </div>
            </div>
          </div>
          </div>
          
          {/* Mobile Flashing Texts */}
          <div className="relative w-full h-8 flex justify-center mt-2">
            <div className="absolute transition-opacity duration-150" style={{ opacity: Math.max(0, 1 - Math.abs(unfoldProgress - 1.25) * 8) }}>
              <div className="text-center">
                <h3 className="text-[#4ADE80] tracking-[0.3em] text-sm">碎碎念</h3>
                <p className="text-[#4a6b57] text-[10px] tracking-widest">/logs</p>
              </div>
            </div>
            <div className="absolute transition-opacity duration-150" style={{ opacity: Math.max(0, 1 - Math.abs(unfoldProgress - 1.65) * 8) }}>
              <div className="text-center">
                <h3 className="text-[#81D4FA] tracking-[0.3em] text-sm">個人項目</h3>
                <p className="text-[#0277BD] text-[10px] tracking-widest">/projects</p>
              </div>
            </div>
            <div className="absolute transition-opacity duration-150" style={{ opacity: Math.max(0, 1 - Math.abs(unfoldProgress - 2.05) * 8) }}>
              <div className="text-center">
                <h3 className="text-[#B39DDB] tracking-[0.3em] text-sm">系統設定</h3>
                <p className="text-[#7E57C2] text-[10px] tracking-widest">/sys_config</p>
              </div>
            </div>
            <div className="absolute transition-opacity duration-150" style={{ opacity: Math.max(0, 1 - Math.abs(unfoldProgress - 2.45) * 8) }}>
              <div className="text-center">
                <h3 className="text-[#FFCC80] tracking-[0.3em] text-sm">外部鏈接</h3>
                <p className="text-[#EF6C00] text-[10px] tracking-widest">/external_uplinks</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* HUD Modules Layer - Desktop Vertical Left Sidebar */}
      {unfoldProgress > 1.0 && (
        <div className="hidden md:flex absolute left-6 md:left-12 top-0 bottom-0 py-32 pointer-events-none z-20 flex-col justify-between font-pixel">
          
          {/* ARCHIVE / BLOG */}
          <div className="relative">
            {/* Firework effect for ARCHIVE */}
            {unfoldProgress >= 1.0 && unfoldProgress < 1.2 && (() => {
              const p = (unfoldProgress - 1.0) / 0.2;
              const easeOutQuart = 1 - Math.pow(1 - p, 4);
              const cx = dimensions.width / 2;
              const cy = dimensions.height / 2;
              const tx = 48; // roughly left-12
              const ty = 128; // roughly top padding
              const fx = cx + (tx - cx) * easeOutQuart;
              const fy = cy + (ty - cy) * easeOutQuart;
              
              const tailLength = 60;
              const angle = Math.atan2(ty - cy, tx - cx);
              const tailX = fx - Math.cos(angle) * tailLength * p;
              const tailY = fy - Math.sin(angle) * tailLength * p;

              // Pixel art trail: dashed line + leading spark
              return (
                <div className="fixed pointer-events-none z-50" style={{ left: 0, top: 0 }}>
                  <svg width={dimensions.width} height={dimensions.height}>
                    <line x1={tailX} y1={tailY} x2={fx} y2={fy} stroke="#FFB74D" strokeWidth={2} opacity={0.9} strokeDasharray="4 4" filter="drop-shadow(0 0 3px #F57C00)" />
                    <rect x={fx - 2} y={fy - 2} width={4} height={4} fill="#FFE082" filter="drop-shadow(0 0 4px #FFB74D)" />
                  </svg>
                </div>
              );
            })()}
            {unfoldProgress >= 1.2 && unfoldProgress < 1.3 && (() => {
              const p = (unfoldProgress - 1.2) / 0.1;
              const easeOut = 1 - Math.pow(1 - p, 3);
              const radius = 15 + easeOut * 45;
              const opacity = 1 - p;
              
              // Pixel art explosion: jagged blocks flying out
              return (
                <div className="absolute left-0 top-0 w-12 h-12 flex items-center justify-center pointer-events-none z-50">
                  <svg width="120" height="120" className="absolute" style={{ overflow: 'visible' }}>
                    <g transform="translate(60, 60)" opacity={opacity}>
                      {Array.from({ length: 12 }).map((_, i) => {
                        const angle = (i / 12) * Math.PI * 2;
                        const dist = radius * (i % 2 === 0 ? 1 : 0.6); // Alternating lengths
                        const px = Math.cos(angle) * dist;
                        const py = Math.sin(angle) * dist;
                        const color = i % 3 === 0 ? "#FFE082" : (i % 2 === 0 ? "#FFB74D" : "#F57C00");
                        const size = i % 2 === 0 ? 4 : 2;
                        return (
                          <g key={`fw-arch-${i}`}>
                            <rect x={px - size/2} y={py - size/2} width={size} height={size} fill={color} />
                            {p < 0.6 && <rect x={px*0.7 - 1} y={py*0.7 - 1} width={2} height={2} fill={color} opacity={0.5} />}
                          </g>
                        );
                      })}
                      <rect x={-radius*0.4} y={-radius*0.4} width={radius*0.8} height={radius*0.8} fill="none" stroke="#FFB74D" strokeWidth={1} strokeDasharray="2 4" opacity={opacity * 0.7} />
                    </g>
                  </svg>
                </div>
              );
            })()}
            
            <div 
              className="pointer-events-auto flex items-center gap-4 cursor-pointer group"
              style={{ 
                opacity: progArchive,
                transform: `translateX(${(1 - progArchive) * -50}px)`,
                display: progArchive === 0 ? 'none' : 'flex'
              }}
              onClick={() => navigate('/blog')}
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
                className="overflow-hidden"
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
          </div>

          {/* PROJECTS */}
          <div className="relative">
            {/* Firework effect for PROJECTS */}
            {unfoldProgress >= 1.4 && unfoldProgress < 1.6 && (() => {
              const p = (unfoldProgress - 1.4) / 0.2;
              const easeOutQuart = 1 - Math.pow(1 - p, 4);
              const cx = dimensions.width / 2;
              const cy = dimensions.height / 2;
              const tx = 48;
              const ty = dimensions.height / 2; // middle left
              const fx = cx + (tx - cx) * easeOutQuart;
              const fy = cy + (ty - cy) * easeOutQuart;
              
              const tailLength = 60;
              const angle = Math.atan2(ty - cy, tx - cx);
              const tailX = fx - Math.cos(angle) * tailLength * p;
              const tailY = fy - Math.sin(angle) * tailLength * p;

              // Pixel art trail: dashed line + leading spark
              return (
                <div className="fixed pointer-events-none z-50" style={{ left: 0, top: 0 }}>
                  <svg width={dimensions.width} height={dimensions.height}>
                    <line x1={tailX} y1={tailY} x2={fx} y2={fy} stroke="#FFB74D" strokeWidth={2} opacity={0.9} strokeDasharray="4 4" filter="drop-shadow(0 0 3px #F57C00)" />
                    <rect x={fx - 2} y={fy - 2} width={4} height={4} fill="#FFE082" filter="drop-shadow(0 0 4px #FFB74D)" />
                  </svg>
                </div>
              );
            })()}
            {unfoldProgress >= 1.6 && unfoldProgress < 1.7 && (() => {
              const p = (unfoldProgress - 1.6) / 0.1;
              const easeOut = 1 - Math.pow(1 - p, 3);
              const radius = 15 + easeOut * 45;
              const opacity = 1 - p;
              
              // Pixel art explosion: jagged blocks flying out
              return (
                <div className="absolute left-0 top-0 w-12 h-12 flex items-center justify-center pointer-events-none z-50">
                  <svg width="120" height="120" className="absolute" style={{ overflow: 'visible' }}>
                    <g transform="translate(60, 60)" opacity={opacity}>
                      {Array.from({ length: 12 }).map((_, i) => {
                        const angle = (i / 12) * Math.PI * 2;
                        const dist = radius * (i % 2 === 0 ? 1 : 0.6); // Alternating lengths
                        const px = Math.cos(angle) * dist;
                        const py = Math.sin(angle) * dist;
                        const color = i % 3 === 0 ? "#FFE082" : (i % 2 === 0 ? "#FFB74D" : "#F57C00");
                        const size = i % 2 === 0 ? 4 : 2;
                        return (
                          <g key={`fw-proj-${i}`}>
                            <rect x={px - size/2} y={py - size/2} width={size} height={size} fill={color} />
                            {p < 0.6 && <rect x={px*0.7 - 1} y={py*0.7 - 1} width={2} height={2} fill={color} opacity={0.5} />}
                          </g>
                        );
                      })}
                      <rect x={-radius*0.4} y={-radius*0.4} width={radius*0.8} height={radius*0.8} fill="none" stroke="#FFB74D" strokeWidth={1} strokeDasharray="2 4" opacity={opacity * 0.7} />
                    </g>
                  </svg>
                </div>
              );
            })()}

            <div 
              className="pointer-events-auto flex items-center gap-4 cursor-pointer group"
              style={{ 
                opacity: progProjects,
                transform: `translateX(${(1 - progProjects) * -50}px)`,
                display: progProjects === 0 ? 'none' : 'flex'
              }}
              onClick={() => navigate('/projects')}
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
                className="overflow-hidden"
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
          </div>
          
          {/* SETTINGS */}
          <div className="relative">
            {/* Firework effect for SETTINGS */}
            {unfoldProgress >= 1.8 && unfoldProgress < 2.0 && (() => {
              const p = (unfoldProgress - 1.8) / 0.2;
              const easeOutQuart = 1 - Math.pow(1 - p, 4);
              const cx = dimensions.width / 2;
              const cy = dimensions.height / 2;
              const tx = 48;
              const ty = dimensions.height - 128; // roughly bottom padding
              const fx = cx + (tx - cx) * easeOutQuart;
              const fy = cy + (ty - cy) * easeOutQuart;
              
              const tailLength = 60;
              const angle = Math.atan2(ty - cy, tx - cx);
              const tailX = fx - Math.cos(angle) * tailLength * p;
              const tailY = fy - Math.sin(angle) * tailLength * p;

              // Pixel art trail: dashed line + leading spark
              return (
                <div className="fixed pointer-events-none z-50" style={{ left: 0, top: 0 }}>
                  <svg width={dimensions.width} height={dimensions.height}>
                    <line x1={tailX} y1={tailY} x2={fx} y2={fy} stroke="#FFB74D" strokeWidth={2} opacity={0.9} strokeDasharray="4 4" filter="drop-shadow(0 0 3px #F57C00)" />
                    <rect x={fx - 2} y={fy - 2} width={4} height={4} fill="#FFE082" filter="drop-shadow(0 0 4px #FFB74D)" />
                  </svg>
                </div>
              );
            })()}
            {unfoldProgress >= 2.0 && unfoldProgress < 2.1 && (() => {
              const p = (unfoldProgress - 2.0) / 0.1;
              const easeOut = 1 - Math.pow(1 - p, 3);
              const radius = 15 + easeOut * 45;
              const opacity = 1 - p;
              
              // Pixel art explosion: jagged blocks flying out
              return (
                <div className="absolute left-0 top-0 w-12 h-12 flex items-center justify-center pointer-events-none z-50">
                  <svg width="120" height="120" className="absolute" style={{ overflow: 'visible' }}>
                    <g transform="translate(60, 60)" opacity={opacity}>
                      {Array.from({ length: 12 }).map((_, i) => {
                        const angle = (i / 12) * Math.PI * 2;
                        const dist = radius * (i % 2 === 0 ? 1 : 0.6); // Alternating lengths
                        const px = Math.cos(angle) * dist;
                        const py = Math.sin(angle) * dist;
                        const color = i % 3 === 0 ? "#FFE082" : (i % 2 === 0 ? "#FFB74D" : "#F57C00");
                        const size = i % 2 === 0 ? 4 : 2;
                        return (
                          <g key={`fw-set-${i}`}>
                            <rect x={px - size/2} y={py - size/2} width={size} height={size} fill={color} />
                            {p < 0.6 && <rect x={px*0.7 - 1} y={py*0.7 - 1} width={2} height={2} fill={color} opacity={0.5} />}
                          </g>
                        );
                      })}
                      <rect x={-radius*0.4} y={-radius*0.4} width={radius*0.8} height={radius*0.8} fill="none" stroke="#FFB74D" strokeWidth={1} strokeDasharray="2 4" opacity={opacity * 0.7} />
                    </g>
                  </svg>
                </div>
              );
            })()}

            <div 
              className="pointer-events-auto flex items-center gap-4 cursor-pointer group"
              style={{ 
                opacity: progSettings,
                transform: `translateX(${(1 - progSettings) * -50}px)`,
                display: progSettings === 0 ? 'none' : 'flex'
              }}
              onClick={() => navigate('/settings')}
            >
              <div className="w-12 h-12 border border-[#B39DDB] flex items-center justify-center bg-[#0a140f]/90 group-hover:bg-[#4527A0]/30 transition-colors relative z-10 shadow-[0_0_15px_rgba(179,157,219,0.2)]">
                <div className="absolute inset-0 noise"></div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B39DDB" strokeWidth="1.5" className={progSettings === 1 ? "group-hover:animate-[spin_2s_linear_infinite]" : ""}>
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </div>
              <div 
                className="overflow-hidden flex flex-col gap-2"
                style={{
                  maxWidth: `${progSettings * 200}px`,
                  opacity: progSettings > 0.5 ? (progSettings - 0.5) * 2 : 0
                }}
              >
                <div className="pl-2 whitespace-nowrap">
                  <h3 className="text-[#B39DDB] tracking-[0.3em] text-lg md:text-xl">系統設定</h3>
                  <p className="text-[#7E57C2] text-xs tracking-widest mt-1">/sys_config</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

          {/* LINKS Module - Desktop Right Side */}
      {unfoldProgress > 1.0 && (
        <div className="hidden md:block absolute right-6 md:right-12 top-1/2 -translate-y-1/2 pointer-events-none z-20 font-pixel">
              
              <div className="relative">
                {/* Firework effect for LINKS */}
            {unfoldProgress >= 2.2 && unfoldProgress < 2.4 && (() => {
              const p = (unfoldProgress - 2.2) / 0.2;
              const easeOutQuart = 1 - Math.pow(1 - p, 4);
              const cx = dimensions.width / 2;
              const cy = dimensions.height / 2;
              const tx = dimensions.width - 48; // roughly right-12
              const ty = dimensions.height / 2;
              const fx = cx + (tx - cx) * easeOutQuart;
              const fy = cy + (ty - cy) * easeOutQuart;
              
              const tailLength = 60;
              const angle = Math.atan2(ty - cy, tx - cx);
              const tailX = fx - Math.cos(angle) * tailLength * p;
              const tailY = fy - Math.sin(angle) * tailLength * p;

              // Pixel art trail: dashed line + leading spark
              return (
                <div className="fixed pointer-events-none z-50" style={{ left: 0, top: 0 }}>
                  <svg width={dimensions.width} height={dimensions.height}>
                    <line x1={tailX} y1={tailY} x2={fx} y2={fy} stroke="#FFB74D" strokeWidth={2} opacity={0.9} strokeDasharray="4 4" filter="drop-shadow(0 0 3px #F57C00)" />
                    <rect x={fx - 2} y={fy - 2} width={4} height={4} fill="#FFE082" filter="drop-shadow(0 0 4px #FFB74D)" />
                  </svg>
                </div>
              );
            })()}
            {unfoldProgress >= 2.4 && unfoldProgress < 2.5 && (() => {
              const p = (unfoldProgress - 2.4) / 0.1;
              const easeOut = 1 - Math.pow(1 - p, 3);
              const radius = 15 + easeOut * 45;
              const opacity = 1 - p;
              
              // Pixel art explosion: jagged blocks flying out
              return (
                <div className="absolute right-0 top-0 w-12 h-12 flex items-center justify-center pointer-events-none z-50">
                  <svg width="120" height="120" className="absolute" style={{ overflow: 'visible' }}>
                    <g transform="translate(60, 60)" opacity={opacity}>
                      {Array.from({ length: 12 }).map((_, i) => {
                        const angle = (i / 12) * Math.PI * 2;
                        const dist = radius * (i % 2 === 0 ? 1 : 0.6); // Alternating lengths
                        const px = Math.cos(angle) * dist;
                        const py = Math.sin(angle) * dist;
                        const color = i % 3 === 0 ? "#FFE082" : (i % 2 === 0 ? "#FFB74D" : "#F57C00");
                        const size = i % 2 === 0 ? 4 : 2;
                        return (
                          <g key={`fw-link-${i}`}>
                            <rect x={px - size/2} y={py - size/2} width={size} height={size} fill={color} />
                            {p < 0.6 && <rect x={px*0.7 - 1} y={py*0.7 - 1} width={2} height={2} fill={color} opacity={0.5} />}
                          </g>
                        );
                      })}
                      <rect x={-radius*0.4} y={-radius*0.4} width={radius*0.8} height={radius*0.8} fill="none" stroke="#FFB74D" strokeWidth={1} strokeDasharray="2 4" opacity={opacity * 0.7} />
                    </g>
                  </svg>
                </div>
              );
            })()}
    
                <div 
                  className="pointer-events-auto flex items-center gap-4 flex-row-reverse cursor-pointer group"
                  style={{ 
                    opacity: progLinks,
                    transform: `translateX(${(1 - progLinks) * 50}px)`,
                    display: progLinks === 0 ? 'none' : 'flex'
                  }}
                  onClick={() => navigate('/links')}
                >
                  <div className="w-12 h-12 border border-[#FFCC80] flex items-center justify-center bg-[#0a140f]/90 group-hover:bg-[#E65100]/30 transition-colors relative z-10 shadow-[0_0_15px_rgba(255,204,128,0.2)]">
                    <div className="absolute inset-0 noise"></div>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFCC80" strokeWidth="1.5" className={progLinks === 1 ? "group-hover:animate-pulse" : ""}>
                      <polyline points="4 17 10 11 4 5"/>
                      <line x1="12" y1="19" x2="20" y2="19"/>
                    </svg>
                  </div>
                  <div 
                    className="overflow-hidden text-right"
                    style={{
                      maxWidth: `${progLinks * 200}px`,
                      opacity: progLinks > 0.5 ? (progLinks - 0.5) * 2 : 0
                    }}
                  >
                    <div className="pr-2 whitespace-nowrap">
                      <h3 className="text-[#FFCC80] tracking-[0.3em] text-lg md:text-xl">外部鏈接</h3>
                      <p className="text-[#EF6C00] text-xs tracking-widest mt-1">/external_uplinks</p>
                    </div>
                  </div>
                </div>
              </div>
    
            </div>
          )}
      
      {/* Hover Tooltip - Obsidian Style (Pixel variation) */}
      <AnimatePresence>
        {hoveredNode && hoveredNode !== 'ME' && unfoldProgress >= 1 && unfoldProgress <= 1.1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 pointer-events-none border-2 border-[#30363d] bg-[#161b22] p-3 shadow-lg min-w-[150px] max-w-[250px]"
            style={{ 
              left: 'calc(var(--raw-mouse-x, 0px) + 15px)', 
              top: 'calc(var(--raw-mouse-y, 0px) + 15px)' 
            }}
          >
            <h3 className="font-pixel text-[#c9d1d9] text-sm mb-1 tracking-wide">
              {nodes.find(n => n.id === hoveredNode)?.label}
            </h3>
            
            {/* Display Subnodes in Tooltip */}
            {dynamicSubNodes[hoveredNode] && dynamicSubNodes[hoveredNode].length > 0 && (
              <div className="flex flex-col gap-2 mt-2 pt-2 border-t-2 border-[#30363d] border-dotted">
                {dynamicSubNodes[hoveredNode].map(sub => (
                  <div key={sub.id} className="flex flex-col">
                    <span className="font-pixel text-[#8b949e] text-[10px] tracking-wider">• {sub.label}</span>
                    {sub.desc && (
                      <span className="font-pixel text-[#8b949e] text-[8px] ml-2 mt-1 leading-relaxed opacity-70 tracking-wide">{sub.desc}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};