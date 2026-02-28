# PorcelainAI - 古陶瓷风格迁移系统 (Ancient Pottery Style Transfer)

PorcelainAI 是一个基于人工智能的古陶瓷风格迁移系统。该项目允许用户上传或选择陶瓷器物的内容图和风格图，通过 AI 技术将目标陶瓷的风格（如青花、粉彩、汝窑等）迁移到内容图上，生成具有特定历史时期或窑口风格的全新陶瓷图像。

## 项目结构

本项目包含前端和后端两部分：
- **前端**: 基于 React + Vite 构建的交互式 Web 界面，提供画廊、拖拽上传、风格选择和生成结果展示等功能。
- **后端**: 基于 Flask 的 API 服务 (`FlaskAPI/`)，负责处理图像风格迁移的 AI 模型推理和数据交互。

## 主要功能

- **风格迁移**: 支持将选定的古陶瓷风格应用到用户上传的器型上。
- **交互式生成**: 提供实时的生成状态反馈和候选结果展示。
- **博物馆级展示**: 内置精美的画廊和展示组件 (`MuseumCard`, `ShowcaseCarousel`)，提供沉浸式的文化体验。

## 快速开始

### 前端运行

1. 安装依赖:
   ```bash
   npm install
   ```
2. 启动开发服务器:
   ```bash
   npm run dev
   ```

### 后端运行

进入 `FlaskAPI` 目录并安装所需的 Python 依赖，然后启动 Flask 服务。

## 技术栈

- React 19
- Vite
- Tailwind CSS / Heroicons
- TypeScript
- Flask (Python)
