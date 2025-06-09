import { title } from "@/components/primitives";

export default function SuppliesOutboundPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-lg text-center justify-center">
        <h1 className={title()}>出库管理</h1>
        <p className="mt-4 text-gray-600">管理耗材出库和领用记录</p>
      </div>
    </section>
  );
} 