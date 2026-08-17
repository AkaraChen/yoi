import Link from "next/link";

import { posts } from "@/lib/posts";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">文章</h1>
      <ul className="space-y-8">
        {posts.map((post) => (
          <li key={post.slug}>
            <article className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">
                <Link href={`/${post.slug}`} className="hover:underline">
                  {post.title}
                </Link>
              </h2>
              <time
                dateTime={post.date}
                className="block text-sm text-muted-foreground"
              >
                {post.date}
              </time>
              <p className="text-muted-foreground">{post.excerpt}</p>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
