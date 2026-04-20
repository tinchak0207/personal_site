export type NodeData = {
  id: string;
  label: string;
  addr: string;
  group: number;
  radius: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
};

export type LinkData = {
  source: string;
  target: string;
};

export const initialNodes: NodeData[] = [
  { id: 'root', label: 'Cognitive Kernel', addr: 'ADDR_0x000', group: 0, radius: 45 },
  { id: 'infp', label: 'INFP', addr: 'ADDR_0x0A1', group: 1, radius: 35 },
  { id: 'ai', label: 'AI Native', addr: 'ADDR_0x0A2', group: 1, radius: 35 },
  { id: 'gen10', label: '10後', addr: 'ADDR_0x0A3', group: 1, radius: 35 },
  { id: 'adhd', label: 'ADHD', addr: 'ADDR_0x0A4', group: 1, radius: 35 },
  { id: 'rebel', label: '天生反骨', addr: 'ADDR_0x0A5', group: 1, radius: 35 },
  { id: 'cat', label: '貓奴', addr: 'ADDR_0x0A6', group: 1, radius: 35 },
  { id: 'otaku', label: '宅', addr: 'ADDR_0x0A7', group: 1, radius: 35 },
  { id: 'oi', label: 'OI', addr: 'ADDR_0x0A8', group: 1, radius: 35 },
  { id: 'math', label: '數競', addr: 'ADDR_0x0A9', group: 1, radius: 35 },
  { id: 'music', label: '音樂', addr: 'ADDR_0x0B1', group: 2, radius: 25 },
  { id: 'lit', label: '文學', addr: 'ADDR_0x0B2', group: 2, radius: 25 },
  { id: 'weather', label: '氣象', addr: 'ADDR_0x0B3', group: 2, radius: 25 },
];

export const initialLinks: LinkData[] = [
  { source: 'root', target: 'infp' },
  { source: 'root', target: 'ai' },
  { source: 'root', target: 'gen10' },
  { source: 'root', target: 'adhd' },
  { source: 'root', target: 'rebel' },
  { source: 'root', target: 'cat' },
  { source: 'root', target: 'otaku' },
  { source: 'root', target: 'oi' },
  { source: 'root', target: 'math' },
  { source: 'infp', target: 'music' },
  { source: 'infp', target: 'lit' },
  { source: 'infp', target: 'weather' },
];
