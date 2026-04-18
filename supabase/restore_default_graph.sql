-- 先確保所有的 Nodes 都存在，因為 Edges 的 source 和 target 依賴於 Nodes 的 id
INSERT INTO graph_nodes (id, label, address, group_type, radius)
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
ON CONFLICT (id) DO UPDATE SET
    label = EXCLUDED.label,
    address = EXCLUDED.address,
    group_type = EXCLUDED.group_type,
    radius = EXCLUDED.radius;

-- 接著使用我們寫好的安全插入腳本來重建所有的預設連線 (Edges)
DO $$
DECLARE
    edge_data JSONB := '[
        {"source": "ME", "target": "INFP"},
        {"source": "ME", "target": "AI"},
        {"source": "ME", "target": "10"},
        {"source": "ME", "target": "Cat"},
        {"source": "ME", "target": "OI"},
        {"source": "ME", "target": "Founder"},
        {"source": "INFP", "target": "ADHD"},
        {"source": "AI", "target": "ADHD"},
        {"source": "AI", "target": "Founder"},
        {"source": "Cat", "target": "Otaku"},
        {"source": "OI", "target": "Math"},
        {"source": "10", "target": "Otaku"}
    ]';
    edge_item JSONB;
    s TEXT;
    t TEXT;
BEGIN
    FOR edge_item IN SELECT * FROM jsonb_array_elements(edge_data)
    LOOP
        s := edge_item->>'source';
        t := edge_item->>'target';
        
        -- 確保不會重複插入
        IF NOT EXISTS (
            SELECT 1 FROM graph_edges 
            WHERE (source = s AND target = t) OR (source = t AND target = s)
        ) THEN
            INSERT INTO graph_edges (source, target) VALUES (s, t);
        END IF;
    END LOOP;
END $$;
