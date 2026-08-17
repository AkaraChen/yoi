export default function HomePage() {
  return (
    <main>
      <h1>先认识产品</h1>
      <p className="lede">
        这里介绍可以自己架起来的 agent 产品。先看它是什么、怎么用，再决定要不要装。
      </p>
      <section className="products">
        <a className="card" href="/hermes">
          <h2>Hermes</h2>
          <p>终端里的命令行 agent。你选模型，它在对话里替你做事。</p>
        </a>
      </section>
    </main>
  );
}
