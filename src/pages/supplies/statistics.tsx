import { title } from "@/components/primitives";

export default function SuppliesStatisticsPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-lg text-center justify-center">
        <h1 className={title()}>数据统计</h1>
        <p className="mt-4 text-gray-600">查看耗材使用统计和分析报表</p>
      </div>
    </section>
  );
} 