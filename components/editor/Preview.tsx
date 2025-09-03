import { Code } from "bright";
import { MDXRemote } from "next-mdx-remote/rsc";
import React from "react";

Code.theme = {
  light: "github-light",
  dark: "github-dark",
  lightSelector: "html.light",
};

const Preview = ({ content = "" }: { content: string }) => {
  // Formatting: usuwa niechciane znaki \ i &#x20; (spacje zakodowane jako HTML).
  const formattedContent = content.replace(/\\/g, "").replace(/&#x20;/g, "");
  return (
    <section className="markdown prose grid break-words">
      {/* // NOTE: MDXRemote pozwala Ci kontrolować, jak renderowane są poszczególne elementy MDX/Markdown.
      Przykład:
      normalnie blok kodu ```js ... ``` w Markdown wyrenderuje się jako <pre><code>...</code></pre>.
      możesz jednak powiedzieć: "hej, zawsze gdy renderujesz <pre>, użyj mojego komponentu zamiast domyślnego". */}

      <MDXRemote
        source={formattedContent}
        components={{
          pre: (props) => (
            <Code
              {...props}
              lineNumbers
              className="shadow-light-200 dark:shadow-dark-200"
            />
          ),
        }}
      />
    </section>
  );
};

export default Preview;
