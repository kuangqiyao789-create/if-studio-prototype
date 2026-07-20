import type { CSSProperties } from "react";
import { Clock3, History, Layers3, Plus, Search, Sparkles, UserRound, Users, Workflow, X } from "lucide-react";
import { nodeCatalog } from "../data/canvas";
import type { NodeCreationOptions, NodeKind } from "../data/types";
import { mediaCssUrl, mediaUrl } from "../utils/media";

export type DockView = "add" | "workflow" | "roles" | "history" | null;
export type WorkflowTemplateId = "design-expert" | "product-ad" | "asset-setting";

type Props = {
  active: DockView;
  onActiveChange: (view: DockView) => void;
  onAddNode: (kind: NodeKind, label: string, options?: NodeCreationOptions) => void;
  onApplyWorkflow: (id: WorkflowTemplateId) => void;
};

const items = [
  { id: "add", label: "添加节点", icon: Plus },
  { id: "workflow", label: "工作流", icon: Workflow },
  { id: "roles", label: "角色库", icon: Users },
  { id: "history", label: "历史记录", icon: History }
] as const;

function AddPanel({ onAddNode }: Pick<Props, "onAddNode">) {
  return <div className="dock-panel dock-panel--add">
    <div className="dock-panel-head"><div><strong>添加节点</strong><span>最近使用与全部节点</span></div><Search size={15} /></div>
    <div className="recent-nodes"><button onClick={() => onAddNode("video", "生视频")}><span><VideoGlyph /></span><b>生视频</b><small>最近使用</small></button><button onClick={() => onAddNode("storyboard", "分镜板")}><span><Layers3 size={18} /></span><b>分镜板</b><small>最近使用</small></button><button onClick={() => onAddNode("audio", "音频")}><span><Sparkles size={18} /></span><b>音频</b><small>最近使用</small></button></div>
    <div className="node-menu-list">{nodeCatalog.map((item) => <button key={item.id} onClick={() => onAddNode(item.kind, item.label, { assetCategory: item.assetCategory })}><span>{item.label}</span><small>{item.group}</small><Plus size={13} /></button>)}</div>
  </div>;
}

function VideoGlyph() {
  return <span className="video-glyph"><i /></span>;
}

const workflowCards: Array<{
  id: WorkflowTemplateId;
  visual: string;
  visualClass: string;
  title: string;
  subtitle: string;
}> = [
  {
    id: "design-expert",
    visual: mediaUrl("media/workflows/design-expert-cover.png"),
    visualClass: "workflow-visual--design",
    title: "设计专家生图流",
    subtitle: "参考片解析 · 风格板 · 生图 · 精修"
  },
  {
    id: "product-ad",
    visual: mediaUrl("media/workflows/product-ad-cover.png"),
    visualClass: "workflow-visual--product",
    title: "产品广告成片流",
    subtitle: "卖点拆解 · 产品场景 · 视频 · 剪辑"
  },
  {
    id: "asset-setting",
    visual: mediaUrl("media/workflows/asset-setting-cover.png"),
    visualClass: "workflow-visual--asset",
    title: "资产设定工作流",
    subtitle: "角色 · 场景 · 道具 · 一致性"
  }
];

function WorkflowPanel({ onApplyWorkflow }: Pick<Props, "onApplyWorkflow">) {
  return <div className="dock-panel dock-panel--workflow"><div className="dock-panel-head"><div><strong>工作流</strong><span>应用前可预览放置位置</span></div><Workflow size={15} /></div><div className="workflow-tabs"><button className="active">官方模板</button><button>我的工作流</button><button>收藏</button></div><div className="workflow-cards">{workflowCards.map((card) => <button key={card.id} onClick={() => onApplyWorkflow(card.id)}><span className={`workflow-visual ${card.visualClass}`}><img src={card.visual} alt="" /></span><b>{card.title}</b><small>{card.subtitle}</small></button>)}</div></div>;
}

const roles = [
  { name: "Hikaru", src: mediaUrl("media/academy/character-hikaru.png") },
  { name: "校医", src: mediaUrl("media/academy/character-doctor.png") },
  { name: "周成", src: mediaUrl("media/academy/character-zhou-cheng.png") },
  { name: "林小光", src: mediaUrl("media/academy/character-lin-xiaoguang.png") }
];

function RolesPanel() {
  return <div className="dock-panel dock-panel--roles"><div className="dock-panel-head"><div><strong>角色库</strong><span>4 个可用角色</span></div><UserRound size={15} /></div><label className="dock-search"><Search size={14} /><input placeholder="搜索角色" /></label><div className="role-grid">{roles.map((role) => <button key={role.name}><span className="media-crop" style={{ "--media-image": mediaCssUrl(role.src), "--media-fit": "contain", "--media-position": "50% 18%" } as CSSProperties} /><b>{role.name}</b><small>已认证 · v1</small></button>)}</div></div>;
}

function HistoryPanel() {
  const events = [["刚刚", "更新 SHOT 03 角色引用"], ["2 分钟前", "采用 SHOT 01 候选 A"], ["8 分钟前", "生成 4 格分镜板"], ["16 分钟前", "铺设画布生产骨架"]];
  return <div className="dock-panel dock-panel--history"><div className="dock-panel-head"><div><strong>历史记录</strong><span>自动保存已开启</span></div><Clock3 size={15} /></div><div className="history-list">{events.map(([time, label], index) => <button key={label} className={index === 0 ? "current" : ""}><i /><span><b>{label}</b><small>{time}</small></span>{index > 0 && <em>恢复</em>}</button>)}</div></div>;
}

export default function BottomDock({ active, onActiveChange, onAddNode, onApplyWorkflow }: Props) {
  return <div className="dock-wrap">
    {active && <div className="dock-popover"><button className="dock-close icon-button" aria-label="关闭面板" onClick={() => onActiveChange(null)}><X size={15} /></button>{active === "add" && <AddPanel onAddNode={onAddNode} />}{active === "workflow" && <WorkflowPanel onApplyWorkflow={onApplyWorkflow} />}{active === "roles" && <RolesPanel />}{active === "history" && <HistoryPanel />}</div>}
    <nav className="bottom-dock" aria-label="画布功能栏">{items.map((item) => { const Icon = item.icon; return <button className={active === item.id ? "active" : ""} key={item.id} onClick={() => onActiveChange(active === item.id ? null : item.id)}><Icon size={17} /><span>{item.label}</span></button>; })}</nav>
  </div>;
}
