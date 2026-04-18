-- Seed data for graph_nodes
INSERT INTO public.graph_nodes (id, label, address, group_type, radius)
VALUES 
  ('ME', 'tinchak0207', 'ADDR_ME', 'center', 8),
  ('INFP', 'INFP', 'ADDR_INFP', 'node', 5),
  ('AI', 'AI NATIVE', 'ADDR_AI_NAT', 'node', 5),
  ('10', '10後', 'ADDR_POST10', 'node', 5),
  ('ADHD', 'ADHD', 'ADDR_ADHD', 'node', 5),
  ('Cat', '貓奴', 'ADDR_CAT', 'node', 5),
  ('Otaku', '宅', 'ADDR_OTAKU', 'node', 5),
  ('OI', 'OI', 'ADDR_OI', 'node', 5),
  ('Math', '數競', 'ADDR_MATH', 'node', 5),
  ('Founder', '創業者', 'ADDR_FOUNDER', 'node', 5)
ON CONFLICT (id) DO UPDATE 
SET label = EXCLUDED.label,
    address = EXCLUDED.address,
    group_type = EXCLUDED.group_type,
    radius = EXCLUDED.radius;

-- Seed data for graph_links
INSERT INTO public.graph_links (source, target)
VALUES 
  ('ME', 'INFP'),
  ('ME', 'AI'),
  ('ME', '10'),
  ('ME', 'Cat'),
  ('ME', 'OI'),
  ('ME', 'Founder'),
  ('INFP', 'ADHD'),
  ('AI', 'ADHD'),
  ('AI', 'Founder'),
  ('Cat', 'Otaku'),
  ('OI', 'Math'),
  ('10', 'Otaku')
ON CONFLICT (source, target) DO NOTHING;
