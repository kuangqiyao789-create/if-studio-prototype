import { useState, type KeyboardEvent } from "react";
import { Boxes, ChevronLeft, FileStack, MessageSquare, Search, Settings, Waypoints, X } from "lucide-react";
import { canvasElementCatalog } from "../data/canvas";
import { mediaCssUrl, mediaUrl } from "../utils/media";

export type AssetResult = { id: string; nodeId: string; label: string; type: string; src: string };

const assets: AssetResult[] = [
  { id: "character-hikaru", nodeId: "asset-characters-1", label: "Hikaru · 失忆探索期", type: "角色", src: mediaUrl("media/academy/character-hikaru.png") },
  { id: "character-doctor", nodeId: "asset-characters-2", label: "校医 · 基础常态期", type: "角色", src: mediaUrl("media/academy/character-doctor.png") },
  { id: "character-zhou", nodeId: "asset-characters-3", label: "周成 · 导师期", type: "角色", src: mediaUrl("media/academy/character-zhou-cheng.png") },
  { id: "character-lin", nodeId: "asset-characters-4", label: "林小光 · 学生期", type: "角色", src: mediaUrl("media/academy/character-lin-xiaoguang.png") },
  { id: "scene-medical", nodeId: "asset-scenes-1", label: "医务室_病床区全景_白天", type: "场景", src: mediaUrl("media/academy/scene-medical-room.png") },
  { id: "scene-corridor", nodeId: "asset-scenes-2", label: "教学楼走廊_完好状态_白天", type: "场景", src: mediaUrl("media/academy/scene-corridor-intact.png") },
  { id: "scene-damaged", nodeId: "asset-scenes-3", label: "教学楼走廊_破窗战损_白天", type: "场景", src: mediaUrl("media/academy/scene-corridor-damaged.png") },
  { id: "prop-tablet", nodeId: "asset-props-1", label: "临床平板终端", type: "道具", src: mediaUrl("media/academy/prop-clinical-tablet.png") },
  { id: "prop-baton", nodeId: "asset-props-2", label: "电击警棍", type: "道具", src: mediaUrl("media/academy/prop-electric-baton.png") }
];

type Props = {
  open: boolean;
  query: string;
  onOpenChange: (open: boolean) => void;
  onQueryChange: (value: string) => void;
  onLocate: (id: string) => void;
  availableAssetIds: ReadonlySet<string>;
  availableNodeCatalogIds: ReadonlySet<string>;
  generatedAssetIds: ReadonlySet<string>;
};

type PanelTab = "all" | "elements" | "assets";

export default function LeftNavigation({ open, query, onOpenChange, onQueryChange, onLocate, availableAssetIds, availableNodeCatalogIds, generatedAssetIds }: Props) {
  const [activeTab, setActiveTab] = useState<PanelTab>("all");
  const normalized = query.trim().toLowerCase();
  const visibleAssets = assets.filter((item) => availableAssetIds.has(item.nodeId) && `${item.label}${item.type}`.toLowerCase().includes(normalized));
  const visibleNodes = canvasElementCatalog.filter((item) => availableNodeCatalogIds.has(item.id) && `${item.label}${item.group}`.toLowerCase().includes(normalized));
  const showAssets = activeTab !== "elements";
  const showElements = activeTab !== "assets";
  const hasVisibleResults = (showAssets && visibleAssets.length > 0) || (showElements && visibleNodes.length > 0);
  const locateFirstResult = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    if (showElements && visibleNodes[0]) {
      onLocate(visibleNodes[0].id);
      return;
    }
    if (showAssets && visibleAssets[0]) onLocate(visibleAssets[0].nodeId);
  };

  return (
    <div className={`left-navigation ${open ? "is-open" : ""}`}>
      <nav className="left-rail" aria-label="主导航">
        <button className="rail-button active" aria-label="搜索与资产" onClick={() => { setActiveTab("all"); onOpenChange(true); }}><Search size={18} /></button>
        <button className="rail-button" aria-label="项目资产" onClick={() => { setActiveTab("assets"); onOpenChange(true); }}><Boxes size={18} /></button>
        <button className="rail-button" aria-label="画布结构"><Waypoints size={18} /></button>
        <button className="rail-button" aria-label="镜头文档"><FileStack size={18} /></button>
        <button className="rail-button" aria-label="评论"><MessageSquare size={18} /></button>
        <span className="rail-spacer" />
        <button className="rail-button" aria-label="设置"><Settings size={18} /></button>
      </nav>
      {open && <aside className="asset-panel">
        <div className="panel-heading"><div><strong>元素与资产</strong><span>当前项目</span></div><button className="icon-button" aria-label="收起侧栏" onClick={() => onOpenChange(false)}><ChevronLeft size={16} /></button></div>
        <label className="search-field"><Search size={15} /><input value={query} onChange={(event) => onQueryChange(event.target.value)} onKeyDown={locateFirstResult} placeholder="搜索画布元素或项目资产" />{query && <button aria-label="清空搜索" onClick={() => onQueryChange("")}><X size={13} /></button>}</label>
        <div className="segmented" role="tablist" aria-label="元素与资产筛选">
          <button className={activeTab === "all" ? "active" : ""} role="tab" aria-selected={activeTab === "all"} onClick={() => setActiveTab("all")}>全部</button>
          <button className={activeTab === "elements" ? "active" : ""} role="tab" aria-selected={activeTab === "elements"} onClick={() => setActiveTab("elements")}>画布元素</button>
          <button className={activeTab === "assets" ? "active" : ""} role="tab" aria-selected={activeTab === "assets"} onClick={() => setActiveTab("assets")}>项目资产</button>
        </div>
        <div className="panel-scroll">
          {showAssets && <section className="asset-section"><div className="section-title"><span>项目资产</span><b>{visibleAssets.length}</b></div>
            <div className="asset-list">{visibleAssets.map((item) => {
              const hasPreview = generatedAssetIds.has(item.nodeId);
              return <button className="asset-row" key={item.id} onClick={() => onLocate(item.nodeId)}>
                <span
                  className={`asset-row-thumb ${hasPreview ? "media-crop" : "is-empty"}`}
                  style={hasPreview ? { "--media-image": mediaCssUrl(item.src), "--media-fit": "cover", "--media-position": "50% 50%" } as React.CSSProperties : undefined}
                />
                <span><b>{item.label}</b><small>{item.type}</small></span><em>拖入</em>
              </button>;
            })}</div>
          </section>}
          {showElements && <section className="asset-section"><div className="section-title"><span>画布元素</span><b>{visibleNodes.length}</b></div>
            <div className="node-catalog">{visibleNodes.map((item) => <button key={item.id} onClick={() => onLocate(item.id)}><span>{item.label}</span><small>{item.group}</small></button>)}</div>
          </section>}
          {!hasVisibleResults && <div className="panel-empty"><Search size={18} /><span>{query ? "没有匹配结果" : "当前画布暂无内容"}</span></div>}
        </div>
      </aside>}
    </div>
  );
}
