import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";

export default function DashboardPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-lg text-center justify-center">
        <span className={title()}>欢迎来到&nbsp;</span>
        <span className={title({ color: "violet" })}>管理后台&nbsp;</span>
        <br />
        <span className={title()}>
          这里是您的控制中心
        </span>
        <div className={subtitle({ class: "mt-4" })}>
          您可以在这里管理所有系统功能!
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow",
          })}
          href="/docs"
        >
          使用文档
        </Link>
        <Link
          isExternal
          className={buttonStyles({ variant: "bordered", radius: "full" })}
          href={siteConfig.links.github}
        >
          <GithubIcon size={20} />
          GitHub
        </Link>
      </div>

      <div className="mt-8">
        <Snippet hideCopyButton hideSymbol variant="bordered">
          <span>
            开始使用{" "}
            <Code color="primary">管理后台</Code>
          </span>
        </Snippet>
      </div>
    </section>
  );
}
