import { useEffect, useRef, useState, type CSSProperties, type ComponentType, type MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";
import {
  AudioLines,
  BadgeCheck,
  Box,
  Boxes,
  Brush,
  Check,
  CircleAlert,
  Clapperboard,
  ClipboardList,
  Download,
  FileText,
  FileSearch,
  Film,
  Image as ImageIcon,
  LoaderCircle,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RefreshCw,
  ScanSearch,
  SlidersHorizontal,
  Sparkles,
  Video,
  X
} from "lucide-react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import Inspector from "../components/Inspector";
import {
  characters as academyCharacters,
  props as academyProps,
  scenes as academyScenes,
  shotDetails as academyShotDetails,
  storyboardFrames as academyStoryboardFrames
} from "../data/demo";
import type { ShotDetailData, StudioNode as StudioNodeType, StudioNodeData } from "../data/types";
import { mediaCssUrl } from "../utils/media";

const iconMap: Record<StudioNodeData["kind"], ComponentType<{ size?: number }>> = {
  brief: FileText,
  "shot-plan": Clapperboard,
  "asset-group": Boxes,
  "asset-lane": Boxes,
  "storyboard-lane": Clapperboard,
  "shot-lane": Film,
  prompt: Sparkles,
  storyboard: Clapperboard,
  "reference-analysis": FileSearch,
  "style-board": Brush,
  "product-brief": ClipboardList,
  "brand-guideline": BadgeCheck,
  "image-polish": Brush,
  "consistency-check": BadgeCheck,
  image: ImageIcon,
  video: Video,
  audio: AudioLines,
  "director-3d": Box,
  review: ScanSearch,
  timeline: Film
};

const stateLabel: Record<StudioNodeData["state"], string> = {
  empty: "空",
  "needs-config": "待上游",
  ready: "就绪",
  running: "生成中",
  success: "完成",
  review: "待质检",
  failed: "失败",
  stale: "需刷新"
};

const mediaStyle = (
  position: StudioNodeData["mediaPosition"] | "50% 50%" = "50% 50%",
  src?: string,
  fit: StudioNodeData["mediaFit"] = "cover"
) => ({
  "--media-position": src ? "50% 50%" : position,
  "--media-image": mediaCssUrl(src ?? academyStoryboardFrames[0]),
  "--media-fit": fit
} as CSSProperties);

function NodeHeader({ data }: { data: StudioNodeData }) {
  const Icon = iconMap[data.kind];
  const quietWaiting = Boolean(data.workflowId) && data.state === "needs-config";
  return <div className="node-header">
    <div className="node-title-wrap"><span className="node-icon"><Icon size={15} /></span><div><strong>{data.label}</strong>{data.subtitle && <small>{data.subtitle}</small>}</div></div>
    <div className={`node-state node-state--${data.state} ${quietWaiting ? "node-state--quiet" : ""}`}>{!quietWaiting && data.state === "running" && <LoaderCircle size={11} className="spin" />}{!quietWaiting && data.state === "failed" && <CircleAlert size={11} />}{!quietWaiting && stateLabel[data.state]}</div>
    <button className="icon-button node-more" aria-label="更多节点操作"><MoreHorizontal size={15} /></button>
  </div>;
}

function WorkflowRunButton({ id, data, label }: { id: string; data: StudioNodeData; label?: string }) {
  const isWaiting = data.state === "needs-config";
  const isRunning = data.state === "running";
  const isDone = data.state === "success" || data.state === "review";
  const buttonLabel = isWaiting
    ? "等待上游"
    : isRunning
      ? "执行中"
      : isDone
        ? data.kind === "review" ? "等待质检" : "已完成"
        : label ?? data.workflowActionLabel ?? "执行节点";

  return <button
    className="node-primary node-run-action"
    disabled={isWaiting || isRunning || isDone}
    onClick={(event) => { event.stopPropagation(); data.onRunNode?.(id); }}
  >
    {isRunning ? <LoaderCircle size={13} className="spin" /> : isDone ? <Check size={13} /> : <Play size={13} />}
    {buttonLabel}
  </button>;
}

function BriefContent({ id, data }: { id: string; data: StudioNodeData }) {
  const isEmptyBrief = data.state === "empty";
  const isParsing = data.state === "running";
  const isWorkflowBrief = Boolean(data.workflowId);
  const isDone = data.state === "success" || Boolean(data.briefParsed);
  const [fileName, setFileName] = useState(data.briefFileName ?? (isEmptyBrief ? "未上传文件" : "深渊学园_第一幕.pdf"));
  const [draft, setDraft] = useState(data.scriptText ?? (isEmptyBrief ? "" : "Hikaru 在深渊学园医务室醒来，发现自己失去了记忆与身份记录。面对校医的压迫，他选择隐藏真实判断。随后，导师周成带他穿过教学楼，林小光与一名神秘精英学生相继出现，揭开学园危险规则的一角。"));
  const actionLabel = isWorkflowBrief
    ? data.workflowActionLabel ?? "确认输入"
    : isDone
      ? "镜头已创建"
      : isParsing
        ? "正在解析镜头"
        : "解析并创建镜头";
  const handleRun = (event: ReactMouseEvent) => {
    event.stopPropagation();
    if (isWorkflowBrief) {
      data.onRunNode?.(id);
      return;
    }
    data.onCreateShotPlan?.(id);
  };
  return <div className="brief-content">
    <div className="brief-editor nodrag nowheel" onClick={(event) => event.stopPropagation()}>
      <div className="brief-editor-head">
        <span>剧本 / 创作想法</span>
        <label className="brief-upload" aria-label="上传剧本或参考文件">
          <input type="file" accept=".pdf,.doc,.docx,.txt,.md" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "剧本.pdf")} />
          <Plus size={15} /><em>上传文件</em>
        </label>
      </div>
      <textarea
        aria-label="剧本或创作想法"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="在这里粘贴剧本，或直接写下你的创作想法..."
      />
      <div className="brief-editor-foot"><span>{fileName}</span><small>可浏览、编辑或替换文件</small></div>
    </div>
    <div className="brief-meta-run">
      <div className="meta-grid"><span>类型</span><b>{data.briefType ?? (isEmptyBrief ? "待设置" : "科幻校园短片")}</b><span>时长</span><b>{data.totalDuration ?? (isEmptyBrief ? "待设置" : "71s")}</b><span>画幅</span><b>{data.briefAspect ?? (isEmptyBrief ? "待设置" : "16:9")}</b></div>
      <div className="brief-run-row">
        <div className="chip-row"><span>氛围参考 {data.atmosphereCount ?? (isEmptyBrief ? 0 : 3)}</span></div>
        <button className="node-primary" disabled={isDone || isParsing} onClick={handleRun}>
          {isDone ? <Check size={14} /> : isParsing ? <LoaderCircle size={14} className="spin" /> : <Sparkles size={14} />}
          {actionLabel}
        </button>
      </div>
    </div>
  </div>;
}

type ShotDetail = ShotDetailData;

const initialShotDetails: ShotDetail[] = academyShotDetails;

function ShotDetailDialog({ shot, onSave, onClose }: { shot: ShotDetail; onSave: (shot: ShotDetail) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(shot);
  const update = (key: keyof ShotDetail, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  return createPortal(<div className="shot-dialog-backdrop" onMouseDown={onClose}>
    <section className="shot-dialog" role="dialog" aria-modal="true" aria-labelledby="shot-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
      <header><div><code>SHOT {draft.id}</code><input id="shot-dialog-title" value={draft.title} onChange={(event) => update("title", event.target.value)} /></div><button className="icon-button" aria-label="关闭镜头详情" onClick={onClose}><X size={17} /></button></header>
      <label className="shot-description-field"><span>完整画面描述</span><textarea value={draft.description} onChange={(event) => update("description", event.target.value)} /></label>
      <div className="shot-parameter-grid">
        <label><span>镜头时长</span><input value={draft.duration} onChange={(event) => update("duration", event.target.value)} /></label>
        <label><span>景别</span><input value={draft.shotSize} onChange={(event) => update("shotSize", event.target.value)} /></label>
        <label><span>光影氛围</span><textarea value={draft.lighting} onChange={(event) => update("lighting", event.target.value)} /></label>
        <label><span>对白 · 旁白</span><textarea value={draft.dialogue} onChange={(event) => update("dialogue", event.target.value)} /></label>
        <label><span>音效</span><textarea value={draft.sound} onChange={(event) => update("sound", event.target.value)} /></label>
        <label><span>运镜</span><textarea value={draft.movement} onChange={(event) => update("movement", event.target.value)} /></label>
      </div>
      <footer><span>修改将同步到提示词融合与后续生成节点</span><button className="node-primary" onClick={() => onSave(draft)}><Check size={14} />保存镜头</button></footer>
    </section>
  </div>, document.body);
}

function ShotPlanContent({ id, data }: { id: string; data: StudioNodeData }) {
  const [shots, setShots] = useState(() => data.shotDetails ?? (data.shotCount ? initialShotDetails.slice(0, data.shotCount) : initialShotDetails));
  const [activeShot, setActiveShot] = useState<ShotDetail | null>(null);
  const [createdModes, setCreatedModes] = useState({
    image: data.createdStoryboardModes?.includes("image") ?? false,
    video: data.createdStoryboardModes?.includes("video") ?? false
  });
  const [creatingMode, setCreatingMode] = useState<"image" | "video" | null>(null);
  const assetsReady = Boolean(data.assetStage);
  const createStoryboardGroup = (mode: "image" | "video") => {
    setCreatingMode(mode);
    data.onGenerateStoryboards?.(mode);
    window.setTimeout(() => {
      setCreatedModes((current) => ({ ...current, [mode]: true }));
      setCreatingMode((current) => current === mode ? null : current);
    }, 1050);
  };
  const saveShot = (updated: ShotDetail) => {
    setShots((current) => current.map((shot) => shot.id === updated.id ? updated : shot));
    setActiveShot(null);
  };
  return <div className="shot-plan nodrag nowheel" onClick={(event) => event.stopPropagation()}>
    <div className="shot-stepper" aria-label="镜头生产步骤">
      <button className={assetsReady ? "done" : "active"} disabled><span>{assetsReady ? <Check size={11} /> : "1"}</span><div><b>镜头编排</b><small>确认镜头内容与参数</small></div></button>
      <button className={assetsReady ? "done" : ""} disabled><span>{assetsReady ? <Check size={11} /> : "2"}</span><div><b>资产准备</b><small>生成并执行资产组</small></div></button>
      <button className={assetsReady ? "active" : ""} disabled><span>3</span><div><b>分镜生产</b><small>批量生成分镜结果</small></div></button>
    </div>
    <div className="shot-plan-heading"><div><strong>镜头画面描述</strong><span>点击任意镜号编辑完整参数</span></div><small>{shots.length} SHOTS · {data.totalDuration ?? "71s"}</small></div>
    <div className="shot-card-row">
      {shots.map((shot) => <button className="shot-card" key={shot.id} onClick={() => setActiveShot(shot)}>
        <div><code>SHOT {shot.id}</code><span>{shot.duration}</span></div>
        <strong>{shot.title}</strong>
        <p>{shot.description}</p>
        <small>{shot.shotSize} · {shot.movement}</small>
      </button>)}
    </div>
    <div className="shot-plan-action"><span>{assetsReady ? "资产容器已铺设在节点下方，可按组执行" : data.state === "running" ? "正在分析镜头中的共享资产需求" : "镜头确认后，按角色、场景与道具铺设资产容器"}</span><button className="node-primary" disabled={assetsReady || data.state === "running"} onClick={() => data.onGenerateAssets?.(id)}>{assetsReady ? <Check size={14} /> : data.state === "running" ? <LoaderCircle size={14} className="spin" /> : <Sparkles size={14} />}{assetsReady ? "资产已生成" : data.state === "running" ? "正在准备资产" : "资产生成"}</button></div>
    {assetsReady && <div className="storyboard-quick-actions">
      <button className={createdModes.image || creatingMode === "image" ? "is-running" : ""} disabled={createdModes.image || creatingMode !== null} onClick={() => createStoryboardGroup("image")}>{creatingMode === "image" ? <LoaderCircle size={14} className="spin" /> : <ImageIcon size={14} />}<span>{createdModes.image ? "分镜图容器已创建" : creatingMode === "image" ? "正在铺设分镜图" : "批量生产分镜图"}</span></button>
      <button className={createdModes.video || creatingMode === "video" ? "is-running" : ""} disabled={createdModes.video || creatingMode !== null} onClick={() => createStoryboardGroup("video")}>{creatingMode === "video" ? <LoaderCircle size={14} className="spin" /> : <Video size={14} />}<span>{createdModes.video ? "分镜视频容器已创建" : creatingMode === "video" ? "正在铺设分镜视频" : "批量生产分镜视频"}</span></button>
    </div>}
    {activeShot && <ShotDetailDialog shot={activeShot} onSave={saveShot} onClose={() => setActiveShot(null)} />}
  </div>;
}

type AssetPreviewItem = {
  label: string;
  detail: string;
  pos: StudioNodeData["mediaPosition"] | "50% 50%";
  src?: string;
  fit?: StudioNodeData["mediaFit"];
  empty?: boolean;
};

const assetItems: AssetPreviewItem[] = [
  { label: "风格", detail: "冷白科幻校园", pos: "50% 50%", src: academyStoryboardFrames[0] },
  { label: "角色", detail: "Hikaru · 失忆探索期", pos: "50% 50%", src: academyCharacters[0].mediaSrc, fit: "contain" },
  { label: "场景", detail: "深渊学园医务室", pos: "50% 50%", src: academyScenes[0].mediaSrc },
  { label: "道具", detail: "临床平板终端", pos: "50% 50%", src: academyProps[0].mediaSrc, fit: "contain" },
  { label: "产品", detail: "待补充", pos: "0% 0%", empty: true },
  { label: "其他", detail: "破窗走廊光影", pos: "50% 50%", src: academyScenes[2].mediaSrc }
];

const groupedAssetItems: Record<NonNullable<StudioNodeData["assetCategory"]>, AssetPreviewItem[]> = {
  character: academyCharacters.map((asset) => ({ label: asset.label, detail: asset.description, pos: "50% 50%", src: asset.mediaSrc, fit: "contain" })),
  scene: academyScenes.map((asset) => ({ label: asset.label, detail: asset.description, pos: "50% 50%", src: asset.mediaSrc, fit: "cover" })),
  prop: academyProps.map((asset) => ({ label: asset.label, detail: asset.description, pos: "50% 50%", src: asset.mediaSrc, fit: "contain" }))
};

function AssetGroupContent({ id, data }: { id: string; data: StudioNodeData }) {
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const items = data.assetCategory ? groupedAssetItems[data.assetCategory] : assetItems;
  const runGroup = () => {
    setRunning(true);
    window.setTimeout(() => { setRunning(false); setCompleted(true); data.onRunNode?.(id); }, 1100);
  };
  return <div className="asset-group-content"><div className="asset-grid">{items.map((item) => <div className={`asset-tile ${item.empty ? "asset-tile--empty" : ""}`} key={item.label}>
    {!item.empty ? <div className="asset-thumb media-crop" style={mediaStyle(item.pos, item.src, item.fit)} /> : <div className="asset-empty"><ImageIcon size={18} /><span>添加产品</span></div>}
    <div className="asset-copy"><b>{item.label}</b><span>{item.detail}</span></div>
    {!item.empty && <Check size={13} className="asset-check" />}
  </div>)}</div>{data.assetCategory && <div className="asset-group-run"><span>{completed ? "整组生成完成" : "共享镜头引用 · 可统一生成"}</span><button className="node-primary" disabled={running || completed} onClick={runGroup}>{running ? <LoaderCircle size={13} className="spin" /> : <Play size={13} />}{completed ? "已完成" : running ? "执行中" : "整组执行"}</button></div>}</div>;
}

function ShotLaneContent({ id, data }: { id: string; data: StudioNodeData }) {
  return <div className="lane-shell">
    <div className="lane-title"><span>{data.label}</span><small>{data.subtitle}</small></div>
    <div className="container-actions">
      <button className={data.route === "storyboard-image" ? "active" : ""} onClick={(event) => { event.stopPropagation(); data.onRouteChange?.(id, "storyboard-image"); }}>先出分镜</button>
      <button className={data.route === "storyboard-video" ? "active" : ""} onClick={(event) => { event.stopPropagation(); data.onRouteChange?.(id, "storyboard-video"); }}>直接视频</button>
      <button className={data.route === "free" ? "active" : ""} onClick={(event) => { event.stopPropagation(); data.onRouteChange?.(id, "free"); }}>补充资产</button>
    </div>
  </div>;
}

function AssetLaneContent({ id, data }: { id: string; data: StudioNodeData }) {
  return <div className="lane-shell asset-lane-shell">
    <Handle className="studio-handle asset-lane-handle" type="target" position={Position.Left} />
    <div className="lane-title"><span>{data.label}</span><small>{data.subtitle}</small></div>
    <div className="container-actions">
      <button disabled={data.state === "running" || data.state === "success"} onClick={(event) => { event.stopPropagation(); data.onRunAssetGroup?.(id); }}>
        {data.state === "running" ? "整组生成中" : data.state === "success" ? "整组已完成" : "整组执行"}
      </button>
    </div>
  </div>;
}

function StoryboardLaneContent({ id, data }: { id: string; data: StudioNodeData }) {
  return <div className="lane-shell storyboard-lane-shell">
    <div className="lane-title"><span>{data.label}</span><small>{data.subtitle}</small></div>
    <div className="container-actions">
      <button disabled={data.state === "running" || data.state === "success"} onClick={(event) => { event.stopPropagation(); data.onRunStoryboardGroup?.(id); }}>
        {data.state === "running" ? "整组执行中" : data.state === "success" ? "整组已完成" : "整组执行"}
      </button>
    </div>
  </div>;
}

function PromptContent({ data }: { data: StudioNodeData }) {
  return <div className="prompt-content">
    <div className="chip-row"><span>角色</span><span>场景</span><span>风格</span></div>
    <p className="mono-copy">wet transit hall, courier enters frame, slow dolly in, cyan practical light...</p>
    {data.state === "stale" ? <button className="node-secondary"><RefreshCw size={13} />刷新资产引用</button> : <div className="node-foot"><span>Prompt v3</span><span>128 tokens</span></div>}
  </div>;
}

function StoryboardContent({ id, data }: { id: string; data: StudioNodeData }) {
  const [draft, setDraft] = useState(data.workflowBody ?? "把当前创作输入拆成可执行分镜：明确镜头顺序、主体动作、场景切换、画面节奏与生成约束。");
  return <div className="storyboard-content">
    <textarea
      className="workflow-editable-field nodrag nowheel"
      aria-label="分镜板编辑内容"
      value={draft}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => setDraft(event.target.value)}
    />
    <div className="story-grid">{academyStoryboardFrames.slice(0, 4).map((src, index) => <div key={src} className="media-crop story-frame" style={mediaStyle("50% 50%", src)}><span>{String(index + 1).padStart(2, "0")}</span></div>)}</div>
    <WorkflowRunButton id={id} data={data} />
  </div>;
}

function InlineVideo({ src, poster, label }: { src: string; poster?: string; label: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.load();
    setPlaying(false);
  }, [src]);

  const togglePlayback = async (event: ReactMouseEvent) => {
    event.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      await video.play();
    } else {
      video.pause();
    }
  };

  return <>
    <video
      ref={videoRef}
      className="embedded-video nodrag nowheel"
      src={src}
      poster={poster}
      preload="metadata"
      playsInline
      muted
      aria-label={label}
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onEnded={() => setPlaying(false)}
    />
    <button className="play-button" aria-label={playing ? `暂停${label}` : `播放${label}`} onClick={togglePlayback}>
      {playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
    </button>
  </>;
}

function MediaContent({ id, data, isVideo }: { id: string; data: StudioNodeData; isVideo?: boolean }) {
  if (data.assetCategory && !isVideo) return <AssetMediaContent id={id} data={data} />;
  const hasGeneratedMedia = data.state === "running" || data.state === "success" || data.state === "review";
  return <div className="media-content">
    <div className={`media-preview ${hasGeneratedMedia ? "media-crop" : ""}`} style={hasGeneratedMedia ? mediaStyle(data.mediaPosition, data.mediaSrc, data.mediaFit) : undefined}>
      {hasGeneratedMedia && isVideo && data.videoSrc && <InlineVideo src={data.videoSrc} poster={data.mediaSrc} label={`${data.label}视频预览`} />}
      {hasGeneratedMedia && isVideo && !data.videoSrc && <button className="play-button" aria-label="播放预览"><Play size={17} fill="currentColor" /></button>}
      {data.state === "running" && <div className="render-progress"><span style={{ width: `${data.progress ?? 64}%` }} /></div>}
      {(data.state === "empty" || data.state === "needs-config" || data.state === "ready") && <div className="media-empty"><ImageIcon size={20} /><span>{data.state === "needs-config" ? "等待上游" : data.state === "ready" ? "可执行" : data.storyboardShot ? "等待执行" : "等待输入"}</span><WorkflowRunButton id={id} data={data} label={isVideo ? "生成视频" : "生成图片"} /></div>}
    </div>
    {data.storyboardShot && data.referenceLabels && <div className="storyboard-reference-list"><span>引用</span>{data.referenceLabels.map((reference) => <i className={`storyboard-reference storyboard-reference--${reference.category}`} title={reference.label} key={reference.category}>{reference.label}</i>)}</div>}
    <div className="node-foot"><span>{isVideo ? "16:9 · 1080p" : "4 张 · 2K"}</span><span className="mono">seed 4821</span></div>
  </div>;
}

function AssetPreview({ data, className = "" }: { data: StudioNodeData; className?: string }) {
  const hasImage = Boolean(data.mediaSrc) && (data.state === "running" || data.state === "success" || data.state === "review");
  return <div className={`asset-preview ${hasImage ? "has-image" : ""} ${className}`}>
    {hasImage && <img className="asset-preview-image" src={data.mediaSrc} alt={data.label} />}
    {data.state === "running" && <div className="render-progress"><span style={{ width: `${data.progress ?? 64}%` }} /></div>}
    {(data.state === "empty" || data.state === "needs-config" || data.state === "ready") && <div className="media-empty"><ImageIcon size={20} /><span>{data.state === "needs-config" ? "等待上游" : data.state === "ready" ? "可执行" : "等待生成"}</span></div>}
  </div>;
}

function AssetDescription({ data, eyebrow }: { data: StudioNodeData; eyebrow: string }) {
  return <div className="asset-node-description"><span>{eyebrow}</span><p title={data.assetDescription}>{data.assetDescription}</p></div>;
}

function AssetMediaContent({ id, data }: { id: string; data: StudioNodeData }) {
  if (data.assetCategory === "character") {
    return <div className="asset-media asset-media--character">
      <AssetDescription data={data} eyebrow="角色描述" />
      <AssetPreview data={data} className="asset-preview--portrait" />
      <div className="node-foot"><span>全身角色 · 2K</span><span>一致性参考</span></div>
      {(data.workflowId || data.state !== "success") && <WorkflowRunButton id={id} data={data} label="生成角色" />}
    </div>;
  }
  if (data.assetCategory === "scene") {
    return <div className="asset-media asset-media--scene">
      <AssetPreview data={data} className="asset-preview--scene" />
      <p className="asset-scene-description" title={data.assetDescription}>{data.assetDescription}</p>
      <div className="node-foot"><span>环境概念 · 16:9</span><span>2K</span></div>
      {(data.workflowId || data.state !== "success") && <WorkflowRunButton id={id} data={data} label="生成场景" />}
    </div>;
  }
  return <div className="asset-media asset-media--prop">
    <AssetPreview data={data} className="asset-preview--prop" />
    <AssetDescription data={data} eyebrow="道具描述" />
    <div className="node-foot"><span>单体道具 · 2K</span><span>材质参考</span></div>
    {(data.workflowId || data.state !== "success") && <WorkflowRunButton id={id} data={data} label="生成道具" />}
  </div>;
}

function AudioContent({ id, data }: { id: string; data: StudioNodeData }) {
  const bars = [15, 42, 28, 68, 52, 76, 31, 60, 84, 46, 70, 35, 58, 26, 64, 44, 78, 38, 57, 22, 49, 72, 33, 61];
  const [draft, setDraft] = useState(data.workflowBody ?? "编辑口播、音效、配乐和节奏点，匹配当前视频时长。");
  return <div className="audio-content">
    {data.workflowId && <textarea className="workflow-editable-field nodrag nowheel" aria-label="音频节点内容" value={draft} onClick={(event) => event.stopPropagation()} onChange={(event) => setDraft(event.target.value)} />}
    <div className="waveform">{bars.map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div>
    <div className="audio-tracks"><span>对白 1</span><span>环境声 2</span><span>配乐 1</span><b>{data.totalDuration ?? "00:42"}</b></div>
    {data.workflowId && <WorkflowRunButton id={id} data={data} label="生成音频" />}
  </div>;
}

function DirectorContent({ data }: { data: StudioNodeData }) {
  return <div className="director-content"><div className="media-crop director-preview" style={mediaStyle(data.mediaPosition, data.mediaSrc ?? academyScenes[1].mediaSrc)}><div className="camera-reticle"><span /><span /></div><div className="director-tools"><b>CAM 02</b><span>35mm</span><span>f/2.8</span></div></div><div className="node-foot"><span>演员占位 1</span><span>环境光 v2</span><span>关键帧 3</span></div></div>;
}

function ReviewContent({ id, data }: { id: string; data: StudioNodeData }) {
  const candidates = data.mediaSequence ?? [];
  const slots = Array.from({ length: 4 }, (_, index) => candidates[index]);
  const labels = ["A", "B", "C", "D"];
  const [draft, setDraft] = useState(data.workflowBody ?? "对候选结果进行构图、清晰度、一致性和交付规格质检。");
  if (data.workflowId && data.state !== "review" && !candidates.length) {
    return <div className="workflow-review-content">
      <textarea
        className="workflow-editable-field nodrag nowheel"
        aria-label="候选质检内容"
        value={draft}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => setDraft(event.target.value)}
      />
      <div className="node-foot"><span>候选队列</span><span>待生成</span></div>
      <WorkflowRunButton id={id} data={data} label={data.workflowActionLabel ?? "生成候选"} />
    </div>;
  }
  return <div className="review-content">
    {slots.map((src, index) => <div className={`candidate ${index === 0 && src ? "selected" : ""} ${src ? "" : "candidate--empty"}`} key={labels[index]}>
      {src ? <div className="media-crop" style={mediaStyle("50% 50%", src)} /> : <div><Plus size={16} /><small>等待候选</small></div>}
      <span>{labels[index]}</span>
      {index === 0 && src && <Check size={12} />}
    </div>)}
    {data.state === "review"
      ? <button className="node-primary" onClick={(event) => { event.stopPropagation(); data.onApprove?.(id); }}><Check size={13} />采用 A</button>
      : <WorkflowRunButton id={id} data={data} label={data.workflowActionLabel ?? "生成候选"} />}
  </div>;
}

function TimelineContent({ id, data }: { id: string; data: StudioNodeData }) {
  const positions: Array<StudioNodeData["mediaPosition"] | "50% 50%"> = ["0% 0%", "50% 0%", "100% 0%", "0% 100%", "50% 100%", "100% 100%", "50% 50%"];
  const sequence = data.mediaSequence ?? academyStoryboardFrames.slice(0, positions.length);
  const canEdit = data.workflowId ? data.state === "success" : data.state === "ready" || data.state === "success";
  return <div className="timeline-content"><div className={`timeline-player ${canEdit ? "media-crop" : ""}`} style={canEdit ? mediaStyle("50% 50%", data.mediaSrc ?? sequence[0], data.mediaFit) : undefined}>{canEdit ? data.videoSrc ? <InlineVideo src={data.videoSrc} poster={data.mediaSrc} label="合成预览" /> : <button className="play-button" aria-label="播放时间线"><Play size={18} fill="currentColor" /></button> : <div className="timeline-empty"><Film size={19} /><span>{data.state === "needs-config" ? "等待上游视频与音频" : "等待分镜视频接入"}</span></div>}</div><div className="timeline-ruler"><span>00:00</span><span>00:24</span><span>00:48</span><span>{data.totalDuration ?? "00:42"}</span></div><div className={`filmstrip ${canEdit ? "" : "is-empty"}`} style={{ gridTemplateColumns: `repeat(${sequence.length}, 1fr)` }}>{sequence.map((src, index) => <div key={index} className={canEdit ? "media-crop" : ""} style={canEdit ? mediaStyle("50% 50%", src) : undefined} />)}</div><div className="timeline-audio"><AudioLines size={13} /><span /></div><div className="timeline-actions">{data.workflowId && <WorkflowRunButton id={id} data={data} label="执行合成" />}<button className="node-primary" disabled={!canEdit} onClick={(event) => { event.stopPropagation(); data.onOpenEditor?.(); }}><Film size={13} />{canEdit ? "打开剪辑" : "等待视频完成"}</button></div></div>;
}

const utilityNodeMeta: Partial<Record<StudioNodeData["kind"], { body: string; chips: string[]; foot: string[] }>> = {
  "reference-analysis": {
    body: "拆解参考片的构图、镜头节奏、光影方向与可复用视觉规则，作为后续风格板和生成节点的约束。",
    chips: ["构图", "光影", "节奏"],
    foot: ["参考片 3", "规则提取"]
  },
  "style-board": {
    body: "沉淀项目视觉调性，包括色彩、材质、景深、角色造型倾向与禁止项，可被资产和生图节点引用。",
    chips: ["色彩", "笔触", "材质"],
    foot: ["风格 v1", "可复用"]
  },
  "product-brief": {
    body: "把产品输入拆为目标人群、核心卖点、使用场景、证据点与转化目标，供广告分镜和成片使用。",
    chips: ["人群", "卖点", "证据"],
    foot: ["Brief v2", "营销约束"]
  },
  "brand-guideline": {
    body: "整理命名、品牌色、构图禁区、角色一致性与输出规格，用于团队复用和交付校验。",
    chips: ["命名", "禁用项", "规格"],
    foot: ["规范页", "可导出"]
  },
  "image-polish": {
    body: "对已生成图片进行高清增强、局部重绘、扩图、角色特写与光影统一，保留原画幅比例。",
    chips: ["高清", "重绘", "扩图"],
    foot: ["精修队列", "保比例"]
  },
  "consistency-check": {
    body: "检查角色、场景、道具在不同镜头中的身份、服装、空间关系与材质连续性。",
    chips: ["角色", "空间", "材质"],
    foot: ["一致性", "待确认"]
  }
};

const workflowUtilityKinds: StudioNodeData["kind"][] = [
  "reference-analysis",
  "style-board",
  "product-brief",
  "brand-guideline",
  "image-polish",
  "consistency-check"
];

function WorkflowUtilityContent({ id, data }: { id: string; data: StudioNodeData }) {
  const meta = utilityNodeMeta[data.kind] ?? {
    body: data.assetDescription ?? "可接入现有画布节点，作为流程中的辅助能力。",
    chips: ["输入", "处理", "输出"],
    foot: ["工作流", "可编辑"]
  };
  const [draft, setDraft] = useState(data.workflowBody ?? data.assetDescription ?? meta.body);
  return <div className="workflow-utility-content">
    <textarea
      className="workflow-editable-field nodrag nowheel"
      aria-label={`${data.label}节点内容`}
      value={draft}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => setDraft(event.target.value)}
    />
    <div className="chip-row">{meta.chips.map((chip) => <span key={chip}>{chip}</span>)}</div>
    <div className="workflow-node-footer">
      <div className="node-foot"><span>{meta.foot[0]}</span><span>{meta.foot[1]}</span></div>
      <WorkflowRunButton id={id} data={data} />
    </div>
  </div>;
}

function ContainerCaption({ data }: { data: StudioNodeData }) {
  const Icon = iconMap[data.kind];
  const quietWaiting = Boolean(data.workflowId) && data.state === "needs-config";
  return <div className="container-caption"><span><Icon size={13} /></span><strong>{data.label}</strong>{data.subtitle && <small>{data.subtitle}</small>}{!quietWaiting && <i className={`caption-state caption-state--${data.state}`}>{stateLabel[data.state]}</i>}</div>;
}

function SelectionToolbar({ id, data, controlsVisible, onToggleControls }: { id: string; data: StudioNodeData; controlsVisible: boolean; onToggleControls: () => void }) {
  const showsAddToReview = data.kind === "image" || data.kind === "video";
  const canAddToReview = data.state === "success";
  const downloadResult = () => {
    const payload = JSON.stringify({
      node: data.label,
      type: data.kind,
      state: data.state,
      shot: data.shotId ?? null,
      details: data.subtitle ?? null
    }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${data.label.replace(/[^\w\u4e00-\u9fa5-]+/g, "-") || "if-studio"}-result.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return <div className="selection-toolbar" onClick={(event) => event.stopPropagation()}>
    {showsAddToReview
      ? <button className="selection-toolbar__review" title={canAddToReview ? "添加至候选" : "生成完成后可添加至候选"} aria-label="添加至候选" disabled={!canAddToReview} onClick={() => data.onAddToReview?.(id)}><ScanSearch size={14} /><span>添加至候选</span></button>
      : <button className={controlsVisible ? "active" : ""} title="参数设置" aria-label="参数设置" onClick={onToggleControls}><SlidersHorizontal size={14} /></button>}
    <button title="重新生成" aria-label="重新生成" onClick={() => data.onRunNode?.(id)}><RefreshCw size={14} /></button>
    <button title="下载结果" aria-label="下载结果" onClick={downloadResult}><Download size={14} /></button>
  </div>;
}

export default function StudioNode({ id, data, selected }: NodeProps<StudioNodeType>) {
  const [controlsVisible, setControlsVisible] = useState(true);
  const isLane = data.kind === "shot-lane" || data.kind === "asset-lane" || data.kind === "storyboard-lane";
  const supportsInlineControls = ["asset-group", "image", "video", "audio"].includes(data.kind);
  const usesExternalCaption = ["asset-group", "storyboard", "image", "video", "audio", "director-3d", "review", "timeline"].includes(data.kind);
  const showSingleNodeControls = selected && !isLane && !data.suppressSingleToolbar;
  const usesWorkflowSurface = Boolean(data.workflowId) && data.kind !== "brief";
  const className = `studio-node studio-node--${data.kind} studio-node--${data.state} ${usesWorkflowSurface ? "studio-node--workflow" : ""} ${data.assetCategory ? `studio-node--asset-${data.assetCategory}` : ""} ${selected ? "is-selected" : ""}`;
  return <div className={className} style={{ width: data.width, height: data.height }}>
    {showSingleNodeControls && <SelectionToolbar id={id} data={data} controlsVisible={controlsVisible} onToggleControls={() => setControlsVisible((visible) => !visible)} />}
    {!isLane && <Handle className="studio-handle" type="target" position={Position.Left} />}
    {data.kind === "shot-lane" ? <ShotLaneContent id={id} data={data} /> : data.kind === "asset-lane" ? <AssetLaneContent id={id} data={data} /> : data.kind === "storyboard-lane" ? <StoryboardLaneContent id={id} data={data} /> : usesExternalCaption ? <ContainerCaption data={data} /> : <NodeHeader data={data} />}
    {!isLane && <div className="node-body">
      {data.kind === "brief" && <BriefContent id={id} data={data} />}
      {data.kind === "shot-plan" && <ShotPlanContent id={id} data={data} />}
      {data.kind === "asset-group" && <AssetGroupContent id={id} data={data} />}
      {data.kind === "prompt" && <PromptContent data={data} />}
      {workflowUtilityKinds.includes(data.kind) && <WorkflowUtilityContent id={id} data={data} />}
      {data.kind === "storyboard" && <StoryboardContent id={id} data={data} />}
      {data.kind === "image" && <MediaContent id={id} data={data} />}
      {data.kind === "video" && <MediaContent id={id} data={data} isVideo />}
      {data.kind === "audio" && <AudioContent id={id} data={data} />}
      {data.kind === "director-3d" && <DirectorContent data={data} />}
      {data.kind === "review" && <ReviewContent id={id} data={data} />}
      {data.kind === "timeline" && <TimelineContent id={id} data={data} />}
    </div>}
    {!isLane && <Handle className="studio-handle" type="source" position={Position.Right} />}
    {showSingleNodeControls && supportsInlineControls && controlsVisible && <Inspector
      data={data}
      onClose={() => data.onCloseControls?.()}
      onRun={() => data.kind === "review" ? data.onApprove?.(id) : data.onRunNode?.(id)}
    />}
  </div>;
}
