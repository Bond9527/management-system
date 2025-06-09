import { title } from "@/components/primitives";

export default function RolesPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-lg text-center justify-center">
        <h1 className={title()}>角色管理</h1>
        <p className="mt-4 text-gray-600">管理系统角色和权限分配</p>
      </div>
    </section>
  );
} 