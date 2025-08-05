# Stream 模块浏览器兼容性修复

## 问题描述

在使用 `xlsx-js-style` 库时，遇到了以下错误：

```
Module "stream" has been externalized for browser compatibility. Cannot access "stream.Readable" in client code.
```

这是因为 `xlsx-js-style` 库在浏览器环境中尝试使用 Node.js 的 `stream` 模块，而该模块在浏览器中不可用。

## 解决方案

### 1. 创建 Stream Polyfill

创建了 `src/utils/streamPolyfill.js` 文件，为浏览器环境提供 Node.js stream 模块的兼容性实现：

```javascript
// Stream polyfill for browser compatibility
// This provides a minimal implementation for xlsx-js-style compatibility

if (typeof window !== 'undefined') {
  window.stream = {
    Readable: class {
      constructor() {
        this.readable = true;
        this.destroyed = false;
      }
      read() { return null; }
      destroy() { 
        this.destroyed = true; 
        this.readable = false; 
      }
      pipe() { return this; }
    },
    Writable: class {},
    Duplex: class {},
    Transform: class {},
    PassThrough: class {}
  };
}

if (typeof global !== 'undefined') {
  global.stream = {
    Readable: class {
      constructor() {
        this.readable = true;
        this.destroyed = false;
      }
      read() { return null; }
      destroy() { 
        this.destroyed = true; 
        this.readable = false; 
      }
      pipe() { return this; }
    },
    Writable: class {},
    Duplex: class {},
    Transform: class {},
    PassThrough: class {}
  };
}
```

### 2. 在主入口文件中导入 Polyfill

在 `src/main.tsx` 文件的最开始导入 polyfill，确保它在其他模块之前加载：

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// 导入 stream polyfill 以解决 xlsx-js-style 的兼容性问题
import "./utils/streamPolyfill.js";

// ... 其他导入
```

### 3. 更新 Vite 配置

在 `vite.config.ts` 中添加了必要的配置：

```typescript
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
```

## 验证结果

- ✅ 开发服务器 (`npm run dev`) 正常运行
- ✅ 生产构建 (`npm run build`) 成功完成
- ✅ 没有 stream 模块相关的错误
- ✅ `xlsx-js-style` 库可以正常使用

## 注意事项

1. 这个 polyfill 提供了最小化的 stream 模块实现，仅满足 `xlsx-js-style` 库的基本需求
2. 如果将来需要使用更完整的 stream 功能，可以考虑使用 `stream-browserify` 包
3. polyfill 需要在应用启动时最早加载，确保在其他模块使用 stream 之前就可用

## 相关文件

- `src/utils/streamPolyfill.js` - Stream polyfill 实现
- `src/main.tsx` - 主入口文件，导入 polyfill
- `vite.config.ts` - Vite 配置文件
- `package.json` - 项目依赖配置 