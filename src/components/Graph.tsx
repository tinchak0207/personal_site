import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useStore } from '../store/useStore';
import { initialNodes, initialLinks, NodeData, LinkData } from '../data/graphData';

export function Graph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isBooting = useStore(state => state.isBooting);
  const isZoomMode = useStore(state => state.isZoomMode);
  const enterZoomMode = useStore(state => state.enterZoomMode);

  useEffect(() => {
    if (!containerRef.current) return;
    if (isBooting) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Clear previous SVG if any
    d3.select(containerRef.current).selectAll('svg').remove();

    const svg = d3.select(containerRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background', '#0a0a0a')
      .style('cursor', isZoomMode ? 'grab' : 'default');

    const g = svg.append('g');

    // Zoom & Pan behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    // Only allow zoom/pan if in zoom mode or via specific logic
    if (isZoomMode) {
      svg.call(zoom);
    } else {
      svg.on('.zoom', null); // disable d3 zoom
      // In global mode, we might want custom wheel scrolling logic
    }

    const simulation = d3.forceSimulation<NodeData>(initialNodes)
      .force('link', d3.forceLink<NodeData, LinkData>(initialLinks).id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-800))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => (d as NodeData).radius + 20));

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(initialLinks)
      .enter().append('line')
      .attr('stroke', '#00FF41')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', 2);

    // Nodes
    const node = g.append('g')
      .selectAll('.node')
      .data(initialNodes)
      .enter().append('g')
      .attr('class', 'node')
      .style('cursor', isZoomMode ? 'default' : 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        enterZoomMode(d.id);
        
        // Transition zoom to the clicked node
        const scale = 2; // Zoom level
        const tx = width / 2 - (d.x || 0) * scale;
        const ty = height / 2 - (d.y || 0) * scale;
        
        svg.transition().duration(750).call(
          zoom.transform, 
          d3.zoomIdentity.translate(tx, ty).scale(scale)
        );
      });

    // Node circles (Glow effect)
    node.append('circle')
      .attr('r', d => d.radius + 10)
      .attr('fill', '#00FF41')
      .attr('opacity', 0.1)
      .style('filter', 'blur(8px)');

    // Node core
    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', '#111')
      .attr('stroke', '#00FF41')
      .attr('stroke-width', 2);

    // Label
    node.append('text')
      .text(d => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .attr('fill', '#fff')
      .style('font-family', 'Playfair Display, serif')
      .style('font-size', '14px')
      .style('pointer-events', 'none');

    // Hex Address
    node.append('text')
      .text(d => d.addr)
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .attr('fill', '#00FF41')
      .style('font-family', 'VT323, monospace')
      .style('font-size', '12px')
      .style('opacity', 0.8)
      .style('pointer-events', 'none');

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Reset zoom when exiting zoom mode
    if (!isZoomMode) {
      svg.transition().duration(750).call(
        zoom.transform, 
        d3.zoomIdentity
      );
    }

    return () => {
      simulation.stop();
    };
  }, [isBooting, isZoomMode, enterZoomMode]);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full overflow-hidden bg-[#0a0a0a]" />;
}
