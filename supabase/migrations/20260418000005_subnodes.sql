-- 建立 graph_subnodes 資料表
CREATE TABLE IF NOT EXISTS graph_subnodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_node_id TEXT NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 強制刷新 Schema Cache
NOTIFY pgrst, 'reload schema';