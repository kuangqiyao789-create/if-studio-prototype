import type { Edge } from "@xyflow/react";
import type { AssetCategory, NodeKind, StudioNode } from "./types";

export const initialNodes: StudioNode[] = [
  {
    id: "brief",
    type: "studio",
    position: { x: 40, y: 280 },
    data: {
      label: "创作输入",
      subtitle: "《深渊学园》",
      kind: "brief",
      state: "ready",
      scriptText: "Hikaru 在深渊学园医务室醒来，发现自己失去了记忆与身份记录。面对校医的压迫，他选择隐藏真实判断。随后，导师周成带他穿过教学楼，林小光与一名神秘精英学生相继出现，揭开学园危险规则的一角。",
      briefFileName: "深渊学园_第一幕.pdf",
      briefType: "科幻校园短片",
      briefAspect: "16:9",
      atmosphereCount: 3,
      totalDuration: "71s"
    }
  }
];

export const initialEdges: Edge[] = [];

export type NodeCatalogItem = {
  id: string;
  kind: NodeKind;
  label: string;
  group: string;
  assetCategory?: AssetCategory;
};

export const nodeCatalog: NodeCatalogItem[] = [
  { id: "brief", kind: "brief", label: "创作输入", group: "创作输入" },
  { id: "shot-plan", kind: "shot-plan", label: "镜头编排", group: "镜头与脚本" },
  { id: "storyboard", kind: "storyboard", label: "分镜板", group: "镜头与脚本" },
  { id: "reference-analysis", kind: "reference-analysis", label: "参考片解析", group: "设计专家" },
  { id: "style-board", kind: "style-board", label: "风格板", group: "设计专家" },
  { id: "brand-guideline", kind: "brand-guideline", label: "品牌规范", group: "设计专家" },
  { id: "product-brief", kind: "product-brief", label: "产品卖点拆解", group: "广告成片" },
  { id: "image-polish", kind: "image-polish", label: "图像精修", group: "生成" },
  { id: "consistency-check", kind: "consistency-check", label: "一致性检查", group: "资产设定" },
  { id: "image", kind: "image", label: "生图", group: "生成" },
  { id: "video", kind: "video", label: "生视频", group: "生成" },
  { id: "audio", kind: "audio", label: "音频", group: "音频" },
  { id: "director-3d", kind: "director-3d", label: "3D 导演台", group: "3D" },
  { id: "asset-character", kind: "image", label: "角色", group: "资产容器", assetCategory: "character" },
  { id: "asset-scene", kind: "image", label: "场景", group: "资产容器", assetCategory: "scene" },
  { id: "asset-prop", kind: "image", label: "道具", group: "资产容器", assetCategory: "prop" },
  { id: "review", kind: "review", label: "候选质检", group: "剪辑与输出" },
  { id: "timeline", kind: "timeline", label: "剪辑合成", group: "剪辑与输出" }
];

export const canvasElementCatalog: NodeCatalogItem[] = [
  { id: "brief", kind: "brief", label: "创作输入", group: "创作输入" },
  { id: "shot-plan", kind: "shot-plan", label: "镜头编排", group: "镜头与脚本" },
  { id: "storyboard", kind: "storyboard", label: "分镜板", group: "镜头与脚本" },
  { id: "reference-analysis", kind: "reference-analysis", label: "参考片解析", group: "设计专家" },
  { id: "style-board", kind: "style-board", label: "风格板", group: "设计专家" },
  { id: "brand-guideline", kind: "brand-guideline", label: "品牌规范", group: "设计专家" },
  { id: "product-brief", kind: "product-brief", label: "产品卖点拆解", group: "广告成片" },
  { id: "image-polish", kind: "image-polish", label: "图像精修", group: "生成" },
  { id: "consistency-check", kind: "consistency-check", label: "一致性检查", group: "资产设定" },
  { id: "storyboard-image", kind: "storyboard-lane", label: "分镜图", group: "分镜生产" },
  { id: "storyboard-video", kind: "storyboard-lane", label: "分镜视频", group: "分镜生产" },
  { id: "image", kind: "image", label: "生图", group: "生成" },
  { id: "video", kind: "video", label: "生视频", group: "生成" },
  { id: "audio", kind: "audio", label: "音频", group: "音频" },
  { id: "director-3d", kind: "director-3d", label: "3D 导演台", group: "3D" },
  { id: "asset-character", kind: "image", label: "角色", group: "资产容器", assetCategory: "character" },
  { id: "asset-scene", kind: "image", label: "场景", group: "资产容器", assetCategory: "scene" },
  { id: "asset-prop", kind: "image", label: "道具", group: "资产容器", assetCategory: "prop" },
  { id: "review", kind: "review", label: "候选质检", group: "剪辑与输出" },
  { id: "timeline", kind: "timeline", label: "剪辑合成", group: "剪辑与输出" }
];
