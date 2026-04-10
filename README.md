
## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## AI 聊天功能配置

项目包含一个 AI 聊天页面，使用 **DeepSeek** 的 OpenAI 兼容接口。要使用此功能，需要配置 API 密钥：

1. 获取 DeepSeek API Key（在 DeepSeek 官网控制台中获取）
2. 在项目根目录创建 `.env` 文件（如果不存在）
3. 添加至少以下内容：
   ```bash
   # 必填：DeepSeek API Key
   VITE_DEEPSEEK_API_KEY=your_deepseek_api_key_here

   # 可选：自定义模型或 Base URL（不填则使用默认）
   # VITE_DEEPSEEK_MODEL=deepseek-chat
   # VITE_DEEPSEEK_API_BASE_URL=https://api.deepseek.com
   ```
4. 重启开发服务器：`npm run dev`

AI 聊天页面位于 `/ai-chat` 路由，也可以通过侧边栏导航菜单访问。

