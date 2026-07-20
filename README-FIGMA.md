# if studio Figma 交付说明

## 源文件定位

该交互稿使用 React + TypeScript + XYFlow。界面不是一张合成图：导航、流程轨道、面板、节点、端口、连接线、节点内联参数、底栏和助手均为独立 DOM/组件，可继续映射为 Figma 图层。

关键文件：

- `design-tokens.json`：颜色、字体、间距、圆角和动效变量。
- `src/styles/tokens.css`：Web 端同源变量。
- `src/nodes/StudioNode.tsx`：节点及状态 Variant 的实现来源。
- `src/data/canvas-example.json`：画布示例数据。
- `interaction-map.md`：13 个 Frame 与完整体验路径。

## 推荐 Figma 页面

1. `00 Cover & Notes`
2. `01 Foundations`
3. `02 Components`
4. `03 Canvas Screens`
5. `04 Prototype Flows`

## 推荐组件

`AppShell`、`TopBar`、`JourneyRail`、`LeftRail`、`AssetPanel`、`BottomDock`、`Minimap`、`InlineNodeControls`、`AgentPet`、`AgentPanel`、`NodeBase`、`ContainerCaption`、`Port`、`Connection`、`StatusChip`、`CandidateCard`。

节点组件应使用 `kind` 和 `state` 建立 Variants。媒体缩略图只作为可替换的内容 Fill；所有 UI、文字、图标、容器、端口和连接线必须保持矢量或原生图层，不得以截图扁平化。

## 写入顺序

1. 将 `design-tokens.json` 映射为 Figma Variables，暗色为默认 Mode。
2. 创建字体、按钮、输入、状态、端口和节点基础组件。
3. 创建资产、镜头、图像、视频、音频、3D、质检和时间线 Variant。
4. 按 `interaction-map.md` 中的 13 个 URL 组装 Frame。
5. 连接三步引导、添加节点、搜索、一键创建分镜容器、节点内联调参、批量运行、质检和助手展开原型。

## 验收

- Frame 尺寸以 `1440 x 900` 为主，同时检查 `1280 x 800` 和 `1920 x 1080`。
- UI 图层保持独立可编辑。
- 使用 Auto Layout、Constraints、Variables、Component Properties 和 Variants。
- 可见文案使用中文，组件和图层使用稳定英文命名。
- 仅左上角 Logo 使用品牌光谱渐变；其余强调色使用蓝、紫、粉、橙、黄的独立纯色变量。
