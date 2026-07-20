import {
  AudioLines,
  BadgeCheck,
  Box,
  Brush,
  Clapperboard,
  ClipboardList,
  FileText,
  FileSearch,
  Film,
  Image,
  Map,
  Package,
  PanelsTopLeft,
  ScanSearch,
  UserRound,
  Video,
  type LucideIcon
} from "lucide-react";
import { nodeCatalog } from "../data/canvas";
import type { AssetCategory, NodeKind } from "../data/types";

type Props = {
  x: number;
  y: number;
  onAdd: (kind: NodeKind, label: string, assetCategory?: AssetCategory) => void;
  onClose: () => void;
};

const iconByKind: Record<NodeKind, LucideIcon> = {
  brief: FileText,
  "shot-plan": Clapperboard,
  "asset-group": Image,
  "asset-lane": Image,
  "storyboard-lane": PanelsTopLeft,
  "shot-lane": PanelsTopLeft,
  prompt: FileText,
  storyboard: PanelsTopLeft,
  "reference-analysis": FileSearch,
  "style-board": Brush,
  "product-brief": ClipboardList,
  "brand-guideline": BadgeCheck,
  "image-polish": Brush,
  "consistency-check": BadgeCheck,
  image: Image,
  video: Video,
  audio: AudioLines,
  "director-3d": Box,
  review: ScanSearch,
  timeline: Film
};

const assetIconByCategory: Record<AssetCategory, LucideIcon> = {
  character: UserRound,
  scene: Map,
  prop: Package
};

const menuGroups: Array<{ label?: string; ids: string[] }> = [
  { ids: ["brief", "image", "video", "director-3d", "audio"] },
  { label: "资产容器", ids: ["asset-character", "asset-scene", "asset-prop"] },
  { label: "工作流能力", ids: ["reference-analysis", "style-board", "product-brief", "brand-guideline", "image-polish", "consistency-check"] },
  { label: "辅助工具", ids: ["shot-plan", "storyboard"] },
  { label: "后期与输出", ids: ["review", "timeline"] }
];

export default function CanvasContextMenu({ x, y, onAdd, onClose }: Props) {
  return <div
    className="canvas-context-menu"
    role="menu"
    aria-label="添加节点"
    style={{ left: x, top: y }}
    onContextMenu={(event) => event.preventDefault()}
    onMouseDown={(event) => event.stopPropagation()}
  >
    <header><strong>添加节点</strong></header>
    <div className="canvas-context-menu-list">{menuGroups.map((group, groupIndex) => <section key={group.label ?? groupIndex}>
      {group.label && <span className="canvas-context-menu-group">{group.label}</span>}
      {group.ids.map((itemId) => {
        const item = nodeCatalog.find((entry) => entry.id === itemId);
        if (!item) return null;
        const Icon = item.assetCategory ? assetIconByCategory[item.assetCategory] : iconByKind[item.kind];
        return <button key={item.id} role="menuitem" onClick={() => onAdd(item.kind, item.label, item.assetCategory)}>
          <i><Icon size={17} /></i><b>{item.label}</b>
        </button>;
      })}
    </section>)}</div>
  </div>;
}
