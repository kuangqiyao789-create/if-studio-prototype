import type { Edge } from "@xyflow/react";
import type { AssetCategory, ShotDetailData, StudioNode } from "./types";

export type DemoAsset = {
  id: string;
  label: string;
  category: AssetCategory;
  description: string;
  mediaSrc: string;
};

export const characters: DemoAsset[] = [
  {
    id: "asset-characters-1",
    label: "Hikaru",
    category: "character",
    description: "失忆探索期学生，黑色短发与深色立领校服，警觉克制，在压力下快速观察环境。",
    mediaSrc: "/media/academy/character-hikaru.png"
  },
  {
    id: "asset-characters-2",
    label: "校医",
    category: "character",
    description: "深渊学园校医，白色长外套与平板终端，语气冷峻，具有明显的权威压迫感。",
    mediaSrc: "/media/academy/character-doctor.png"
  },
  {
    id: "asset-characters-3",
    label: "周成",
    category: "character",
    description: "深渊学园导师期角色，深灰西装与黑色高领，沉稳从容，负责引导 Hikaru 熟悉学园。",
    mediaSrc: "/media/academy/character-zhou-cheng.png"
  },
  {
    id: "asset-characters-4",
    label: "林小光",
    category: "character",
    description: "深渊学园学生期角色，深灰运动校服，外向活跃，对新来的失忆转学生充满好奇。",
    mediaSrc: "/media/academy/character-lin-xiaoguang.png"
  }
];

export const scenes: DemoAsset[] = [
  {
    id: "asset-scenes-1",
    label: "医务室_病床区全景_白天",
    category: "scene",
    description: "白天的深渊学园医务室，冷白顶光、病床、药柜与监护设备构成洁净而压迫的空间。",
    mediaSrc: "/media/academy/scene-medical-room.png"
  },
  {
    id: "asset-scenes-2",
    label: "教学楼走廊_完好状态_白天",
    category: "scene",
    description: "通透的教学楼长走廊，窗侧自然光在湿润地面形成纵深反射，空间完整安静。",
    mediaSrc: "/media/academy/scene-corridor-intact.png"
  },
  {
    id: "asset-scenes-3",
    label: "教学楼走廊_破窗战损_白天",
    category: "scene",
    description: "同一走廊的战损状态，玻璃破裂、碎片散落，强光穿过破窗形成危险的高反差空间。",
    mediaSrc: "/media/academy/scene-corridor-damaged.png"
  }
];

export const props: DemoAsset[] = [
  {
    id: "asset-props-1",
    label: "临床平板终端",
    category: "prop",
    description: "校医使用的深色临床平板，显示学生身份、入学记录与生命体征，边框带有冷白状态灯。",
    mediaSrc: "/media/academy/prop-clinical-tablet.png"
  },
  {
    id: "asset-props-2",
    label: "电击警棍",
    category: "prop",
    description: "校医腰间携带的黑色制式电击警棍，短柄结构与安全锁清晰，符合学园医务装备体系。",
    mediaSrc: "/media/academy/prop-electric-baton.png"
  }
];

export const demoAssetCounts = {
  characters: characters.length,
  scenes: scenes.length,
  props: props.length
};

const assetCollections = [
  { key: "characters", label: "角色", category: "character" as const, y: 650, assets: characters },
  { key: "scenes", label: "场景", category: "scene" as const, y: 960, assets: scenes },
  { key: "props", label: "道具", category: "prop" as const, y: 1270, assets: props }
];

export const storyboardFrames = Array.from({ length: 7 }, (_, index) => `/media/academy/storyboard-${String(index + 1).padStart(2, "0")}.png`);
export const videoFiles = Array.from({ length: 7 }, (_, index) => `/media/academy/segment-${String(index + 1).padStart(2, "0")}.mp4`);

export const shots = [
  { id: "01", label: "SHOT 01", title: "病床惊醒", duration: "8s", assets: [characters[0], characters[1], scenes[0], props[0]] },
  { id: "02", label: "SHOT 02", title: "校医质询", duration: "11s", assets: [characters[0], characters[1], scenes[0], props[0]] },
  { id: "03", label: "SHOT 03", title: "身份缺失", duration: "15s", assets: [characters[0], characters[1], scenes[0], props[1]] },
  { id: "04", label: "SHOT 04", title: "权威压制", duration: "12s", assets: [characters[0], characters[1], scenes[0], props[0]] },
  { id: "05", label: "SHOT 05", title: "暗中决断", duration: "7s", assets: [characters[0], scenes[0]] },
  { id: "06", label: "SHOT 06", title: "走廊引路", duration: "9s", assets: [characters[0], characters[2], characters[3], scenes[1]] },
  { id: "07", label: "SHOT 07", title: "破窗挑衅", duration: "9s", assets: [characters[0], scenes[2]] }
];

export const shotDetails: ShotDetailData[] = [
  { id: "01", title: "病床惊醒", description: "Hikaru 在白天的深渊学园医务室病床上猛然睁眼并迅速坐起，校医站在床边用平板观察。", duration: "8 秒", shotSize: "近景 / 中景", lighting: "均匀冷白顶光，去饱和白色与金属色", dialogue: "无对白", sound: "监护仪底噪、衣料摩擦、急促呼吸", movement: "平视扫视后切至略带俯视的校医" },
  { id: "02", title: "校医质询", description: "校医冷漠审问 Hikaru 的身份与入学记录，Hikaru 背对镜头承受来自床边的压迫。", duration: "11 秒", shotSize: "近景 / 特写", lighting: "冰冷硬质侧光，纯白墙面压缩空间", dialogue: "校医：终端里完全没有你的入学记录。你是谁？", sound: "低频环境声、平板提示音", movement: "过肩镜头切低角度仰拍校医" },
  { id: "03", title: "身份缺失", description: "Hikaru 低头摸向空空的口袋，迅速扫过校医腰间的电击警棍，随后因剧烈头痛抱住头。", duration: "15 秒", shotSize: "近景 / 中景", lighting: "明亮但冰冷，人物面部保持硬质阴影", dialogue: "Hikaru 心声：没有身份证明，也没有记忆。", sound: "口袋摩擦、耳鸣、心跳增强", movement: "手持跟随视线，再切固定机位" },
  { id: "04", title: "权威压制", description: "校医看着 Hikaru 的表演冷笑，将平板重重拍在床头柜上，俯视病床宣告这里的残酷规则。", duration: "12 秒", shotSize: "中景 / 近景", lighting: "高对比硬光，阴冷低饱和", dialogue: "校医：这里不是普通高中，是给深渊培养猎犬的兵营。", sound: "平板撞击、空间回响", movement: "平视校医后切高角度俯拍 Hikaru" },
  { id: "05", title: "暗中决断", description: "Hikaru 低头抱臂掩饰表情，阴影中的眼神恢复冷静，决定先伪装成符合规则的学生。", duration: "7 秒", shotSize: "特写", lighting: "极暗低调光，仅保留眼部反光", dialogue: "Hikaru 心声：先降低敌意，装成合格品。", sound: "低频脉冲、呼吸逐渐平稳", movement: "低角度缓慢推近" },
  { id: "06", title: "走廊引路", description: "Hikaru 跟随周成穿过完好的教学楼走廊，林小光凭空出现，兴奋地认出这名失忆转学生。", duration: "9 秒", shotSize: "全景 / 近景", lighting: "窗侧自然光，冷净高亮", dialogue: "林小光：你就是那个失忆转学生？", sound: "脚步、走廊混响、空间扭曲音", movement: "背后跟拍后切正面近景" },
  { id: "07", title: "破窗挑衅", description: "战损走廊尽头的玻璃爆裂，陌生精英学生破窗落地，从 Hikaru 身后走过并留下轻蔑挑衅。", duration: "9 秒", shotSize: "全景 / 近景", lighting: "锐利窗光与高光过曝，冷灰色调", dialogue: "陌生学生：连自己的能力都搞不清，也配来 1-7 班？", sound: "玻璃爆裂、碎片落地、脚步", movement: "广角低机位后切过肩近景" }
];

const assetLaneNodes = assetCollections.flatMap((collection) => {
  const width = 30 + collection.assets.length * 309;
  const laneId = `asset-lane-${collection.key}`;
  const lane: StudioNode = {
    id: laneId,
    type: "studio",
    position: { x: 390, y: collection.y },
    data: {
      label: collection.label,
      subtitle: `${collection.assets.length} 个${collection.label} · 独立生图节点`,
      kind: "asset-lane",
      state: "success",
      assetCategory: collection.category,
      width,
      height: 250
    },
    style: { width, height: 250 },
    zIndex: 0
  };
  const children: StudioNode[] = collection.assets.map((asset, index) => ({
    id: asset.id,
    type: "studio",
    position: { x: 24 + index * 309, y: 40 },
    parentId: laneId,
    data: {
      label: asset.label,
      subtitle: `${collection.label} · 已就绪`,
      kind: "image",
      state: "success",
      assetCategory: asset.category,
      assetDescription: asset.description,
      mediaSrc: asset.mediaSrc,
      mediaFit: asset.category === "scene" ? "cover" : "contain"
    },
    zIndex: 2
  }));
  return [lane, ...children];
});

const storyboardNodes = (["image", "video"] as const).flatMap((mode, laneIndex) => {
  const laneId = `storyboard-${mode}-lane`;
  const laneHeight = 1802;
  const lane: StudioNode = {
    id: laneId,
    type: "studio",
    position: { x: 1740 + laneIndex * 390, y: 430 },
    data: {
      label: mode === "image" ? "批量分镜图" : "批量分镜视频",
      subtitle: `7 个分镜段 · 自动引用镜头与对应资产`,
      kind: "storyboard-lane",
      state: "success",
      width: 338,
      height: laneHeight
    },
    style: { width: 338, height: laneHeight },
    zIndex: 0
  };
  const children: StudioNode[] = shots.map((shot, index) => ({
    id: `storyboard-${mode}-shot-${shot.id}`,
    type: "studio",
    position: { x: 24, y: 42 + index * 252 },
    parentId: laneId,
    data: {
      label: `${shot.label} · ${mode === "image" ? "分镜图" : "分镜视频"}`,
      subtitle: `${shot.title} · ${shot.duration}`,
      kind: mode,
      state: "success",
      storyboardShot: true,
      shotId: shot.label,
      referenceLabels: (["character", "scene", "prop"] as const).flatMap((category) => {
        const labels = shot.assets.filter((asset) => asset.category === category).map((asset) => asset.label);
        return labels.length ? [{ category, label: labels.join(" + ") }] : [];
      }),
      mediaSrc: storyboardFrames[index],
      videoSrc: mode === "video" ? videoFiles[index] : undefined,
      mediaFit: "cover"
    },
    zIndex: 2
  }));
  return [lane, ...children];
});

export const demoNodes: StudioNode[] = [
  {
    id: "brief",
    type: "studio",
    position: { x: 40, y: 220 },
    data: {
      label: "创作输入",
      subtitle: "《深渊学园》· 已解析 7 个镜头",
      kind: "brief",
      state: "success",
      briefParsed: true,
      scriptText: "Hikaru 在深渊学园医务室醒来，发现自己失去了记忆与身份记录。面对校医的压迫，他选择隐藏真实判断。随后，导师周成带他穿过教学楼，林小光与一名神秘精英学生相继出现，揭开学园危险规则的一角。",
      briefFileName: "深渊学园_第一幕.pdf",
      briefType: "科幻校园短片",
      briefAspect: "16:9",
      atmosphereCount: 3,
      totalDuration: "71s"
    },
    zIndex: 2
  },
  {
    id: "shot-plan",
    type: "studio",
    position: { x: 500, y: 170 },
    data: {
      label: "镜头编排",
      subtitle: "7 个镜头 · 71s · 资产准备完成",
      kind: "shot-plan",
      state: "success",
      assetStage: true,
      shotCount: 7,
      totalDuration: "71s",
      shotDetails,
      createdStoryboardModes: ["image", "video"]
    },
    zIndex: 2
  },
  ...assetLaneNodes,
  ...storyboardNodes,
  {
    id: "audio",
    type: "studio",
    position: { x: 1760, y: 2350 },
    data: { label: "音频设计", subtitle: "对白 · 医务室环境声 · 走廊声场 · 就绪", kind: "audio", state: "success", totalDuration: "71s" },
    zIndex: 2
  },
  {
    id: "timeline",
    type: "studio",
    position: { x: 2540, y: 1570 },
    data: {
      label: "剪辑合成 / 导出",
      subtitle: "7 / 7 分镜视频已就绪 · 01:11",
      kind: "timeline",
      state: "ready",
      mediaSrc: storyboardFrames[6],
      videoSrc: videoFiles[6],
      mediaSequence: storyboardFrames,
      videoSequence: videoFiles,
      totalDuration: "01:11",
      mediaFit: "cover"
    },
    zIndex: 2
  }
];

const edge = (id: string, source: string, target: string, stroke = "#FFFFFF2E", className?: string): Edge => ({
  id,
  source,
  target,
  type: "default",
  className,
  style: { stroke, strokeWidth: 1.15 }
});

const workflowEdges: Edge[] = [
  edge("brief-plan", "brief", "shot-plan"),
  ...assetCollections.map((collection) => edge(`plan-${collection.key}`, "shot-plan", `asset-lane-${collection.key}`, "#FFFFFF24"))
];

const storyboardEdges = (["image", "video"] as const).flatMap((mode) => shots.flatMap((shot) => [
  edge(`plan-${mode}-${shot.id}`, "shot-plan", `storyboard-${mode}-shot-${shot.id}`, "#4DC2EB", "reference-edge reference-edge--shot"),
  ...shot.assets.map((asset) => edge(
    `${asset.id}-${mode}-${shot.id}`,
    asset.id,
    `storyboard-${mode}-shot-${shot.id}`,
    asset.category === "character" ? "#8B7CF6" : asset.category === "scene" ? "#56C596" : "#F2B35B",
    `reference-edge reference-edge--${asset.category}`
  ))
]));

export const demoEdges: Edge[] = [
  ...workflowEdges,
  ...storyboardEdges,
  edge("audio-timeline", "audio", "timeline", "#C8855A")
];
