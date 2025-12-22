# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

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

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
