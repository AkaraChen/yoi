import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkCjkFriendly from "remark-cjk-friendly";

import { splitFrontmatter } from "@/lib/mdx";

const components: Components = {
  h1: ({ node: _node, ...props }) => (
    <h1 className="text-display text-3xl" {...props} />
  ),
  h2: ({ node: _node, ...props }) => (
    <h2 className="pt-4 text-display text-2xl" {...props} />
  ),
  ul: ({ node: _node, ...props }) => (
    <ul className="space-y-2 pl-5" {...props} />
  ),
  ol: ({ node: _node, ...props }) => (
    <ol className="space-y-2 pl-5" {...props} />
  ),
  strong: ({ node: _node, ...props }) => (
    <strong className="font-semibold" {...props} />
  ),
  code: ({ node: _node, ...props }) => (
    <code
      className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-sm"
      {...props}
    />
  ),
  pre: ({ node: _node, ...props }) => (
    <pre
      className="overflow-x-auto rounded-md bg-terminal p-4 font-mono text-sm text-terminal-foreground [&_code]:rounded-none [&_code]:bg-transparent [&_code]:p-0"
      {...props}
    />
  ),
  a: ({ node: _node, ...props }) => (
    <a
      className="font-medium text-accent underline-offset-4 hover:underline"
      {...props}
    />
  ),
};

export function MdxContent({ src }: { src: string }) {
  const { body } = splitFrontmatter(src);
  return (
    <ReactMarkdown remarkPlugins={[remarkCjkFriendly]} components={components}>
      {body}
    </ReactMarkdown>
  );
}
