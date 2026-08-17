export type Post = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
};

export const posts: Post[] = [
  {
    slug: "yoi",
    title: "yoi",
    date: "2026-08-17",
    excerpt: "https://yoi-sigma.vercel.app/skills/yoi.md",
  },
  {
    slug: "hermes",
    title: "Hermes",
    date: "2026-08-17",
    excerpt: "终端里的命令行 agent。你选模型，它在对话里替你做事。",
  },
];

export function getPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}
