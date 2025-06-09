import { title } from "@/components/primitives";

export default function DepartmentsPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-lg text-center justify-center">
        <h1 className={title()}>部门管理</h1>
        <p className="mt-4 text-gray-600">管理系统组织架构和部门设置</p>
      </div>
    </section>
  );
} 