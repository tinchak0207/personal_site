-- 腳本：一次性導入預設的圖譜連線 (Edges)
-- 這個腳本會檢查並插入預設連線，如果連線已經存在 (無論是 A->B 還是 B->A)，則會自動跳過，不會重複插入。

DO $$
DECLARE
    -- 預設的連線關係陣列
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
        
        -- 檢查是否已經存在這條連線 (考慮到無向圖，A->B 或 B->A 都算存在)
        IF NOT EXISTS (
            SELECT 1 FROM graph_edges 
            WHERE (source = s AND target = t) OR (source = t AND target = s)
        ) THEN
            -- 如果不存在，則插入新連線
            INSERT INTO graph_edges (source, target) VALUES (s, t);
        END IF;
    END LOOP;
END $$;
