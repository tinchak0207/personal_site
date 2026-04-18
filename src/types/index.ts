export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  tags: string[];
  folder: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  url?: string;
  github_url?: string;
  image_url?: string;
  published: boolean;
  tags: string[];
  folder: string;
  created_at: string;
  updated_at: string;
}

export interface ExternalLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  published: boolean;
  tags: string[];
  folder: string;
  created_at: string;
  updated_at: string;
}

export interface GraphNode {
  id: string;
  label: string;
  address: string;
  group_type: 'center' | 'node';
  radius: number;
  created_at: string;
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  created_at: string;
}

export type NewPost = Omit<Post, 'id' | 'created_at' | 'updated_at'>;
export type NewProject = Omit<Project, 'id' | 'created_at' | 'updated_at'>;
export type NewExternalLink = Omit<ExternalLink, 'id' | 'created_at' | 'updated_at'>;

