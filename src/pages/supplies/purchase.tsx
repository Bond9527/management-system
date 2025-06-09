import { title } from "@/components/primitives";

export default function SuppliesPurchasePage() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-lg text-center justify-center">
        <h1 className={title()}>采购管理</h1>
        <p className="mt-4 text-gray-600">管理耗材采购计划和执行</p>
      </div>
    </section>
  );
} 