# if studio 交互映射

## 核心操作

| 入口 | 操作 | 结果 |
|---|---|---|
| 画布 | 拖拽、滚轮、框选 | 平移、缩放、多选节点 |
| 节点端口 | 拖到另一节点端口 | 创建平滑连接线 |
| 顶部流程轨道 | 选择阶段 | 聚焦创作输入、镜头确认、准备资产、合成提示词、生成质检或剪辑导出 |
| 三步引导 | 选择步骤 | 更新步骤内容并聚焦镜头、共享资产或逐镜提示词 |
| 任意生产节点 | 单击 | 在节点下方展开内联参数与生成操作，不出现右侧栏 |
| 镜头容器 | 单击一键创建 | 由用户自主创建分镜图容器或分镜视频容器 |
| 顶栏整组执行 | 单击 | 图像、视频和质检节点进入生成中，完成后转为结果状态 |
| 左侧搜索 | 输入并选择结果 | 聚焦对应画布节点或共享资产区 |
| 底部添加节点 | 选择节点类型 | 在当前视口中心创建空节点并选中节点 |
| 底部工作流 | 选择模板 | 展示工作流预览入口 |
| 底部角色库 | 选择角色 | 展示可绑定角色资产 |
| 底部历史记录 | 选择版本 | 展示可恢复的操作时间线 |
| 右下 Agent 桌宠 | 单击 | 展开或收起 304 x 366px 的紧凑对话窗 |
| 顶栏导出 | 单击 | 下载当前画布 JSON |

## Figma 评审场景

开发服务器启动后，使用以下 URL 获取稳定画面：

| Frame | URL |
|---|---|
| Canvas / Main / Populated | `http://127.0.0.1:4173/` |
| Canvas / Empty | `http://127.0.0.1:4173/?scenario=empty` |
| Flow / Shot Confirmation | `http://127.0.0.1:4173/?scenario=flow-confirm` |
| Flow / Asset Preparation | `http://127.0.0.1:4173/?scenario=flow-assets` |
| Flow / Prompt Synthesis | `http://127.0.0.1:4173/?scenario=flow-prompt` |
| Flow / Container Choice | `http://127.0.0.1:4173/?scenario=container-choice` |
| Canvas / Inline Parameters | `http://127.0.0.1:4173/?scenario=node-params` |
| Canvas / Review | `http://127.0.0.1:4173/?scenario=review` |
| Flow / Edit & Export | `http://127.0.0.1:4173/?scenario=export` |
| Canvas / Agent Open | `http://127.0.0.1:4173/?scenario=agent` |
| Canvas / Asset Search | `http://127.0.0.1:4173/?scenario=search` |
| Canvas / Add Node | `http://127.0.0.1:4173/?scenario=add` |
| Canvas / Batch Running | `http://127.0.0.1:4173/?scenario=running` |

## 键盘与无障碍

- 所有产品命令均为原生按钮，可通过 Tab 聚焦并以 Enter/Space 激活。
- 搜索框、对话输入和参数控件保留可见焦点环。
- 图标按钮均提供中文 `aria-label`。
- 画布节点的拖拽、缩放和连接由 XYFlow 提供。
