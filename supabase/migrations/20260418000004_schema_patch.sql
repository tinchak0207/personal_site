-- 1. 確保 graph_nodes 和 graph_edges 存在
CREATE TABLE IF NOT EXISTS graph_nodes (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    address TEXT NOT NULL,
    group_type TEXT DEFAULT 'node',
    radius INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS graph_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    target TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 確保主要內容資料表存在
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS external_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 安全地補齊所有缺失的欄位 (包含 folder, tags, github_url 等)
DO $$ 
BEGIN 
    -- POSTS 缺失欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='folder') THEN 
        ALTER TABLE posts ADD COLUMN folder TEXT DEFAULT '/'; 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='tags') THEN 
        ALTER TABLE posts ADD COLUMN tags TEXT[] DEFAULT '{}'; 
    END IF;

    -- PROJECTS 缺失欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='folder') THEN 
        ALTER TABLE projects ADD COLUMN folder TEXT DEFAULT '/'; 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='tags') THEN 
        ALTER TABLE projects ADD COLUMN tags TEXT[] DEFAULT '{}'; 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='github_url') THEN 
        ALTER TABLE projects ADD COLUMN github_url TEXT; 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='image_url') THEN 
        ALTER TABLE projects ADD COLUMN image_url TEXT; 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='published') THEN 
        ALTER TABLE projects ADD COLUMN published BOOLEAN DEFAULT false; 
    END IF;

    -- EXTERNAL_LINKS 缺失欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='external_links' AND column_name='folder') THEN 
        ALTER TABLE external_links ADD COLUMN folder TEXT DEFAULT '/'; 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='external_links' AND column_name='tags') THEN 
        ALTER TABLE external_links ADD COLUMN tags TEXT[] DEFAULT '{}'; 
    END IF;

END $$;

-- 4. 確保 images 儲存桶存在 (供 Markdown 圖片上傳使用)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- 5. 強制刷新 Supabase 的 Schema Cache (解決 Could not find column in schema cache 錯誤)
NOTIFY pgrst, 'reload schema';