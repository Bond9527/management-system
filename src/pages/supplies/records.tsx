import { title } from "@/components/primitives";

export default function SuppliesRecordsPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-lg text-center justify-center">
        <h1 className={title()}>台账记录</h1>
        <p className="mt-4 text-gray-600">查看和管理耗材使用台账</p>
      </div>
    </section>
  );
} 