import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
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

      {/* 添加更多内容来测试滚动 */}
      <section className="px-6">
        <h2 className="text-2xl font-bold mb-4">系统概览</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-md border">
              <h3 className="text-lg font-semibold mb-2">模块 {i + 1}</h3>
              <p className="text-gray-600">
                这是模块 {i + 1} 的描述信息，用于测试页面滚动效果。
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6">
        <h2 className="text-2xl font-bold mb-4">数据统计</h2>
        <div className="space-y-4">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-md border">
              <h3 className="text-lg font-semibold mb-2">统计报告 {i + 1}</h3>
              <p className="text-gray-600 mb-4">
                这是第 {i + 1} 个统计报告的详细内容，包含各种数据指标和分析结果。
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-2xl font-bold text-blue-600">1,234</div>
                  <div className="text-sm text-gray-600">总数</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-2xl font-bold text-green-600">567</div>
                  <div className="text-sm text-gray-600">活跃</div>
                </div>
                <div className="bg-orange-50 p-3 rounded">
                  <div className="text-2xl font-bold text-orange-600">89</div>
                  <div className="text-sm text-gray-600">待处理</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6">
        <h2 className="text-2xl font-bold mb-4">最近活动</h2>
        <div className="space-y-3">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">活动 {i + 1}</h4>
                  <p className="text-sm text-gray-600">
                    这是第 {i + 1} 个活动的详细描述，记录了系统中的重要操作和变更。
                  </p>
                </div>
                <span className="text-xs text-gray-500">2小时前</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
