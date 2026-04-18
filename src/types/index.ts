export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type NewPost = Omit<Post, 'id' | 'created_at' | 'updated_at'>;
