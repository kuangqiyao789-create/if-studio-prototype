import { useState, type CSSProperties } from "react";
import {
  AudioLines,
  Box,
  Check,
  ChevronDown,
  Image as ImageIcon,
  Languages,
  MapPin,
  Maximize2,
  Play,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Zap,
  X
} from "lucide-react";
import {
  characters as academyCharacters,
  props as academyProps,
  scenes as academyScenes,
  shotDetails as academyShotDetails,
  storyboardFrames as academyStoryboardFrames
} from "../data/demo";
import type { AssetCategory, StudioNodeData } from "../data/types";

type Props = {
  data: StudioNodeData;
  onClose: () => void;
  onRun: () => void;
};

const mediaStyle = (src: string, fit: "cover" | "contain" = "cover") => ({
  "--media-image": `url("${src}")`,
  "--media-fit": fit,
  "--media-position": "50% 50%"
} as CSSProperties);

type PromptReferenceCategory = AssetCategory | "frame";

type PromptReference = {
  label: string;
  category: PromptReferenceCategory;
  src: string;
  fit: "cover" | "contain";
};

type PromptToken = string | {
  type: "reference";
  reference: PromptReference;
  index: number;
};

type PromptSpec = {
  references: PromptReference[];
  tokens: PromptToken[];
};

const academyAssets = [...academyCharacters, ...academyScenes, ...academyProps];
const academyAssetByLabel = new Map(academyAssets.map((asset) => [asset.label, asset]));
const defaultAssetByCategory: Record<AssetCategory, (typeof academyAssets)[number]> = {
  character: academyCharacters[0],
  scene: academyScenes[0],
  prop: academyProps[0]
};

const categoryName: Record<AssetCategory, string> = {
  character: "角色",
  scene: "场景",
  prop: "道具"
};

function mediaFitForCategory(category: PromptReferenceCategory): "cover" | "contain" {
  return category === "scene" || category === "frame" ? "cover" : "contain";
}

function splitReferenceLabel(label: string) {
  return label.split(/\s*\+\s*/).map((item) => item.trim()).filter(Boolean);
}

function makeReference(label: string, category: AssetCategory, overrideSrc?: string): PromptReference {
  const matched = academyAssetByLabel.get(label) ?? defaultAssetByCategory[category];
  return {
    label,
    category,
    src: overrideSrc ?? matched.mediaSrc,
    fit: mediaFitForCategory(category)
  };
}

function uniqueReferences(references: PromptReference[]) {
  const used = new Set<string>();
  return references.filter((reference) => {
    const key = `${reference.category}:${reference.label}`;
    if (used.has(key)) return false;
    used.add(key);
    return true;
  });
}

function getShotDetail(data: StudioNodeData) {
  const shotId = (data.shotId ?? data.label).match(/\d{1,2}/)?.[0].padStart(2, "0");
  return academyShotDetails.find((shot) => shot.id === shotId);
}

function getPromptReferences(data: StudioNodeData): PromptReference[] {
  if (data.referenceLabels?.length) {
    return uniqueReferences(data.referenceLabels.flatMap((reference) => (
      splitReferenceLabel(reference.label).map((label) => makeReference(label, reference.category))
    )));
  }

  if (data.assetCategory) {
    return [makeReference(data.label, data.assetCategory, data.mediaSrc)];
  }

  if (data.mediaSrc && (data.kind === "image" || data.kind === "video")) {
    return [{
      label: data.label,
      category: "frame",
      src: data.mediaSrc,
      fit: data.mediaFit ?? "cover"
    }];
  }

  return [{
    label: "分镜参考",
    category: "frame",
    src: academyStoryboardFrames[0],
    fit: "cover"
  }];
}

function refsOfCategory(references: PromptReference[], category: PromptReferenceCategory) {
  return references.filter((reference) => reference.category === category);
}

function tokenForReference(references: PromptReference[], reference: PromptReference): PromptToken {
  return {
    type: "reference",
    reference,
    index: Math.max(1, references.findIndex((item) => item.category === reference.category && item.label === reference.label) + 1)
  };
}

function appendReferenceList(tokens: PromptToken[], references: PromptReference[], label: string, category: PromptReferenceCategory) {
  const items = refsOfCategory(references, category);
  if (!items.length) return;
  tokens.push(label);
  items.forEach((reference, index) => {
    if (index > 0) tokens.push("、");
    tokens.push(tokenForReference(references, reference));
  });
  tokens.push("。");
}

function buildAssetPrompt(data: StudioNodeData, references: PromptReference[]): PromptToken[] {
  const description = data.assetDescription ?? `补全${categoryName[data.assetCategory ?? "character"]}的核心外观、功能和一致性规则。`;
  const primary = references[0];

  if (data.assetCategory === "character") {
    return [
      `生成角色资产「${data.label}」的全身设定图：${description}`,
      primary ? " 参考当前设定 " : "",
      ...(primary ? [tokenForReference(references, primary)] : []),
      "，保持身份、年龄感、发型、服装轮廓、面部比例和体态稳定；输出正面可复用的角色一致性参考，干净背景，2K，避免多余场景和无关文字。"
    ];
  }

  if (data.assetCategory === "scene") {
    return [
      `生成场景资产「${data.label}」的环境概念图：${description}`,
      primary ? " 参考空间基调 " : "",
      ...(primary ? [tokenForReference(references, primary)] : []),
      "，明确空间结构、纵深透视、主要光源、时间状态和气氛；画面为空景或弱人物尺度参考，16:9，2K，避免错误标识和无关文字。"
    ];
  }

  return [
    `生成道具资产「${data.label}」的单体设定图：${description}`,
    primary ? " 参考造型方向 " : "",
    ...(primary ? [tokenForReference(references, primary)] : []),
    "，强化材质、结构、尺寸关系、功能部件和识别轮廓；三分之四视角或正交展示，干净背景，2K，避免环境遮挡和文字水印。"
  ];
}

function buildStoryboardPrompt(data: StudioNodeData, references: PromptReference[]): PromptToken[] {
  const shot = getShotDetail(data);
  const isVideo = data.kind === "video";
  const title = shot ? `${data.shotId ?? shot.id}《${shot.title}》` : data.label;
  const tokens: PromptToken[] = [
    isVideo
      ? `生成${title}的分镜视频，时长 ${shot?.duration ?? data.subtitle ?? "当前镜头时长"}，${shot?.description ?? data.subtitle ?? "根据当前分镜描述推进画面"}。`
      : `生成${title}的单帧分镜图，${shot?.description ?? data.subtitle ?? "根据当前分镜描述完成关键帧"}。`
  ];

  appendReferenceList(tokens, references, "人物引用 ", "character");
  appendReferenceList(tokens, references, "场景引用 ", "scene");
  appendReferenceList(tokens, references, "道具引用 ", "prop");

  tokens.push(isVideo
    ? `镜头运动：${shot?.movement ?? "按分镜自然推进"}；光影：${shot?.lighting ?? "延续当前场景光影"}；对白/声音仅作为节奏参考：${shot?.dialogue ?? "无"}。保持角色身份、服装、脸部特征、道具位置和空间透视连续，16:9，1080p，避免变脸、穿帮、闪烁和错误字幕。`
    : `镜头规格：${shot?.shotSize ?? "当前镜头景别"}；光影：${shot?.lighting ?? "延续当前场景光影"}；构图需预留视频化动作方向。保持角色身份、服装、脸部特征、道具位置和空间透视连续，16:9，2K，避免错误文字、水印和身份漂移。`
  );

  return tokens;
}

function buildGenericPrompt(data: StudioNodeData, references: PromptReference[]): PromptToken[] {
  const primary = references[0];
  const isVideo = data.kind === "video";
  return [
    `根据节点「${data.label}」生成${isVideo ? "视频" : "图片"}内容：${data.assetDescription ?? data.subtitle ?? "补全画面主体、风格、构图和输出规格"}。`,
    primary ? "参考 " : "",
    ...(primary ? [tokenForReference(references, primary)] : []),
    isVideo
      ? "，保持主体和场景连续，镜头运动自然，16:9，1080p，避免跳帧、变形、闪烁和错误文字。"
      : "，保持主体清晰、构图稳定、材质可信，2K，避免无关元素、错误文字和水印。"
  ];
}

function buildPromptSpec(data: StudioNodeData): PromptSpec {
  const references = getPromptReferences(data);
  if (data.assetCategory) return { references, tokens: buildAssetPrompt(data, references) };
  if (data.storyboardShot) return { references, tokens: buildStoryboardPrompt(data, references) };
  return { references, tokens: buildGenericPrompt(data, references) };
}

const actionLabel: Partial<Record<StudioNodeData["kind"], string>> = {
  image: "生成图片",
  video: "生成视频",
  storyboard: "生成分镜",
  audio: "生成音频",
  "director-3d": "更新镜头",
  prompt: "合成提示词"
};

function ReviewControls({ data, onClose, onRun }: Props) {
  return <section className="inline-node-controls inline-node-controls--review nodrag nowheel" onClick={(event) => event.stopPropagation()}>
    <div className="inline-control-head">
      <strong>{data.label}</strong><span>{data.shotId ?? "项目节点"} · 候选结果质检</span>
      <button className="inline-close" aria-label="关闭节点扩展栏" onClick={onClose}><X size={13} /></button>
    </div>
    <div className="inline-review-candidates">
      <button className="selected"><span className="media-crop" style={mediaStyle(data.mediaSequence?.[0] ?? "/media/academy/storyboard-01.png")} /><b>候选 A</b><small>当前采用</small><Check size={12} /></button>
      <button><span className="media-crop" style={mediaStyle(data.mediaSequence?.[1] ?? "/media/academy/storyboard-02.png")} /><b>候选 B</b><small>备用版本</small></button>
    </div>
    <div className="inline-review-summary">
      <span><Check size={11} />角色一致性通过</span><span><Check size={11} />画面稳定通过</span>
      <span><Check size={11} />内容安全通过</span><span className="warning">末帧高光需注意</span>
    </div>
    <textarea className="inline-review-note" rows={2} defaultValue="采用候选 A，末帧高光变化可在剪辑阶段处理。" />
    <div className="inline-control-actions">
      <button className="secondary-command"><RotateCcw size={12} />退回修改</button>
      <button className="primary-command" onClick={onRun}><Check size={12} />通过并入剪辑</button>
    </div>
  </section>;
}

export default function Inspector(props: Props) {
  const { data, onRun } = props;
  const [presetOpen, setPresetOpen] = useState(false);
  const [preset, setPreset] = useState("预设");
  if (data.kind === "review") return <ReviewControls {...props} />;

  const isImage = ["image", "storyboard"].includes(data.kind);
  const isAudio = data.kind === "audio";
  const model = isImage ? "IF Image" : isAudio ? "Seed Audio 1.0" : "IF Video";
  const quality = isAudio ? "中文 · 24k · wav" : isImage ? "自适应 · 标准画质 · 2K" : "16:9 · 1080p · 6 秒";
  const presetOptions = isImage
    ? ["高清增强", "局部重绘", "扩图", "多机位九宫格", "角色三视图", "角色特写图", "电影级光影矫正", "人像质感优化"]
    : isAudio
      ? ["音频生视频", "旁白口播", "环境氛围", "节奏卡点", "音效补全", "人声分离"]
      : ["视频高清", "裁剪与拼接", "捕捉帧", "视频延长", "对口型", "视频解析", "人声分离", "去模糊"];
  const promptSpec = buildPromptSpec(data);

  return <section className={`inline-node-controls inline-node-controls--rich ${isAudio ? "inline-node-controls--audio" : ""} nodrag nowheel`} onClick={(event) => event.stopPropagation()}>
    {isAudio ? <div className="inline-audio-reference-strip">
      <button className="inline-audio-reference"><Plus size={17} />参考</button>
      <button className="inline-panel-expand" aria-label="展开节点参数"><Maximize2 size={17} /></button>
    </div> : <div className="inline-reference-strip">
      <div className="inline-reference-tools">
        <button><Box size={16} /><span>风格</span></button>
        <button><MapPin size={16} /><span>标记</span></button>
        <button><Plus size={16} /><span>参考</span></button>
      </div>
      <div className="inline-reference-thumbs">
        {promptSpec.references.map((reference, index) => (
          <div className="media-crop" style={mediaStyle(reference.src, reference.fit)} title={reference.label} key={`${reference.category}-${reference.label}`}>
            <span>{index + 1}</span>
          </div>
        ))}
      </div>
      <button className="inline-panel-expand" aria-label="展开节点参数"><Maximize2 size={17} /></button>
    </div>}

    <div className={`inline-prompt-editor ${isAudio ? "inline-prompt-editor--audio" : ""}`} aria-label="生成提示词" contentEditable suppressContentEditableWarning>
      {isAudio ? <span className="inline-audio-placeholder">描述你想要的音频效果，可用 @ 引用音频</span> : promptSpec.tokens.map((token, index) => typeof token === "string"
        ? <span key={index}>{token}</span>
        : <span key={`${token.reference.category}-${token.reference.label}-${index}`}>
          <span className="prompt-mention">@{token.reference.label}</span>
          <span className="prompt-media-chip"><i className="media-crop" style={mediaStyle(token.reference.src, token.reference.fit)} />图片 {token.index}</span>
        </span>
      )}
    </div>

    <div className={`inline-generation-toolbar ${isAudio ? "inline-generation-toolbar--audio" : ""}`}>
      <button className="inline-model-menu">{isAudio ? <AudioLines size={15} /> : <Sparkles size={15} />}<b>{model}</b><ChevronDown size={13} /></button>
      <button className="inline-quality-menu"><span className="quality-check" /><b>{quality}</b><ChevronDown size={13} /></button>
      {isAudio ? <>
        <button className="inline-icon-tool" aria-label="翻译提示词"><Languages size={16} /></button>
        <button className="inline-icon-tool" aria-label="音频参数"><SlidersHorizontal size={16} /></button>
        <span className="inline-token-count">0/2000</span>
        <span className="inline-cost"><Zap size={13} fill="currentColor" />1</span>
      </> : <>
        <div className="inline-preset-wrap">
        <button className="inline-preset-menu" aria-expanded={presetOpen} onClick={() => setPresetOpen((open) => !open)}>
          <ImageIcon size={15} /><b>{preset}</b><i />
        </button>
        {presetOpen && <div className="inline-preset-popover" role="menu" aria-label={isImage ? "图像生成预设" : "视频生成预设"}>
          <span>{isImage ? "图像能力" : "视频能力"}</span>
          <div>{presetOptions.map((option) => <button
            key={option}
            className={preset === option ? "selected" : ""}
            role="menuitem"
            onClick={() => { setPreset(option); setPresetOpen(false); }}
          >{option}{preset === option && <Check size={11} />}</button>)}</div>
        </div>}
      </div>
        <button className="inline-icon-tool" aria-label="首尾帧"><ImageIcon size={15} /></button>
        <button className="inline-icon-tool" aria-label="翻译提示词"><Languages size={16} /></button>
        <button className="inline-count-menu"><b>{isImage ? "1张" : "1个"}</b><ChevronDown size={12} /></button>
        <span className="inline-cost"><Zap size={13} fill="currentColor" />30</span>
      </>}
      <button className="inline-generate" title={actionLabel[data.kind] ?? "执行节点"} aria-label={actionLabel[data.kind] ?? "执行节点"} onClick={onRun}><Play size={12} fill="currentColor" /><span>执行</span></button>
    </div>
  </section>;
}
