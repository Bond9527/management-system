import { title } from "@/components/primitives";

export default function SuppliesApprovePage() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-lg text-center justify-center">
        <h1 className={title()}>审批管理</h1>
        <p className="mt-4 text-gray-600">处理耗材申请审批和跟踪</p>
      </div>
    </section>
  );
} 