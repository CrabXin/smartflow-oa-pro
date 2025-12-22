// 测试沙箱组件（smartflow-oa-pro）
// 说明：
// - 此文件位于 `sandbox` 目录中
// - 没有被任何路由或页面主动引入
// - 仅用于本地临时代码实验，删除不会影响系统
//
// 使用方式（任选其一）：
// 1. 在某个页面中临时引入：
//    import { TestPlayground } from "../sandbox/TestPlayground";
//    然后在 JSX 中使用 <TestPlayground />
// 2. 复制里面的代码片段到你的正式页面中再做调整

import React from "react";

export const TestPlayground: React.FC = () => {
  const [count, setCount] = React.useState(0);

  return (
    <div
      style={{
        padding: 24,
        border: "1px dashed #999",
        borderRadius: 8,
        margin: 24,
        background: "#fafafa",
      }}
    >
      <h2>测试沙箱组件</h2>
      <p>你可以在这里随便写临时代码，而不影响现有系统。</p>
      <p style={{ marginTop: 12 }}>当前计数：{count}</p>
      <button
        style={{
          marginTop: 8,
          padding: "6px 12px",
          borderRadius: 4,
          border: "1px solid #1677ff",
          background: "#1677ff",
          color: "#fff",
          cursor: "pointer",
        }}
        onClick={() => setCount((c) => c + 1)}
      >
        点击 +1（本地测试）
      </button>
    </div>
  );
};

