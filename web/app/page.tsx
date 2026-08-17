import Link from "next/link";

import { excerptFromMdx, listPackNames, readPackFile } from "@/lib/packs";

export default async function HomePage() {
  const names = await listPackNames();
  const posts = await Promise.all(
    names.map(async (slug) => {
      const raw = (await readPackFile(slug, "page.mdx")).toString("utf8");
      return { slug, excerpt: excerptFromMdx(raw) };
    }),
  );
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">文章</h1>
      <ul className="space-y-8">
        {posts.map((post) => (
          <li key={post.slug}>
            <article className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">
                <Link href={`/${post.slug}`} className="hover:underline">
                  {post.slug}
                </Link>
              </h2>
              <p className="text-muted-foreground">{post.excerpt}</p>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
