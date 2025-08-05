import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// Custom plugin to fix xlsx-js-style dependencies
const xlsxStyleFix = () => {
  return {
    name: 'xlsx-js-style-fix',
    transform(code: string, id: string) {
      if (id.includes('xlsx-js-style')) {
        // Replace problematic require statements
        return code.replace(
          /var cpt = require\('\.\/cpt' \+ 'able'\);/g,
          'var cpt = cptable;'
        );
      }
      return code;
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), xlsxStyleFix()],
  optimizeDeps: {
    include: ['xlsx-js-style'],
    exclude: ['xlsx-js-style/dist/cpexcel.js']
  },
  resolve: {
    alias: {
      './cptable': 'xlsx-js-style/dist/cpexcel.js'
    }
  },
  define: {
    // 为 Node.js 模块提供浏览器兼容的 polyfill
    global: 'globalThis',
  }
});
