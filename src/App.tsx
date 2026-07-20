import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type NodeChange,
  ReactFlow,
  ReactFlowProvider,
  ViewportPortal,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useViewport,
  type Connection,
  type Edge,
  type NodeMouseHandler
} from "@xyflow/react";
import TopBar from "./components/TopBar";
import LeftNavigation from "./components/LeftNavigation";
import BottomDock, { type DockView, type WorkflowTemplateId } from "./components/BottomDock";
import AgentAssistant, { type AgentCanvasContext, type AgentJourneyStage, type AgentSuggestion } from "./components/AgentAssistant";
import CanvasContextMenu from "./components/CanvasContextMenu";
import EmptyCanvas from "./components/EmptyCanvas";
import MultiSelectionToolbar from "./components/MultiSelectionToolbar";
import VideoEditorModal from "./components/VideoEditorModal";
import StudioNodeComponent from "./nodes/StudioNode";
import { canvasElementCatalog, initialEdges, initialNodes } from "./data/canvas";
import {
  characters as academyCharacters,
  demoEdges,
  demoNodes,
  props as academyProps,
  scenes as academyScenes,
  shotDetails as academyShotDetails,
  shots as academyShots,
  storyboardFrames as academyStoryboardFrames,
  videoFiles as academyVideoFiles
} from "./data/demo";
import type { AssetCategory, NodeCreationOptions, NodeKind, NodeState, StudioNode } from "./data/types";

const scenario = new URLSearchParams(window.location.search).get("scenario") ?? "empty";
const studioNodeTypes = { studio: StudioNodeComponent };

type CanvasGraph = {
  nodes: StudioNode[];
  edges: Edge[];
};

type FigmaNodePlacement = {
  x: number;
  y: number;
  data?: Partial<StudioNode["data"]>;
  style?: StudioNode["style"];
};

const figmaScenarioNodeIds: Record<string, string[]> = {
  "figma-main": ["brief", "shot-plan", "asset-characters-1", "asset-scenes-1", "asset-props-1", "storyboard-image-shot-01", "storyboard-video-shot-01", "audio", "timeline"],
  "figma-shot": ["brief", "shot-plan"],
  "figma-assets": ["brief", "shot-plan", "asset-characters-1", "asset-scenes-1", "asset-props-1"],
  "figma-prompt": ["brief", "shot-plan", "asset-characters-1", "asset-scenes-1", "asset-props-1", "storyboard-image-shot-03", "storyboard-video-shot-03"],
  "figma-review": ["brief", "shot-plan", "asset-characters-1", "asset-scenes-1", "asset-props-1", "storyboard-video-shot-03", "review-storyboard-video-shot-03"],
  "figma-editor": ["brief", "shot-plan", "asset-characters-1", "storyboard-image-shot-03", "storyboard-video-shot-03", "audio", "timeline"],
  "figma-agent": ["brief", "shot-plan", "asset-characters-1", "storyboard-video-shot-03", "timeline"],
  "figma-agent-guide": ["brief", "shot-plan", "asset-characters-1", "storyboard-video-shot-03", "timeline"],
  "figma-search": ["brief", "shot-plan", "asset-characters-1", "asset-scenes-1", "storyboard-video-shot-03"],
  "figma-add": ["brief", "shot-plan", "asset-characters-1", "storyboard-video-shot-03", "timeline"],
  "figma-workflow": ["brief", "shot-plan", "asset-characters-1", "storyboard-video-shot-03", "timeline"],
  "figma-roles": ["brief", "shot-plan", "asset-characters-1", "storyboard-video-shot-03", "timeline"],
  "figma-history": ["brief", "shot-plan", "asset-characters-1", "storyboard-video-shot-03", "timeline"],
  "figma-running": ["brief", "shot-plan", "asset-characters-1", "storyboard-image-shot-03", "storyboard-video-shot-03", "timeline"]
};

const figmaScenarioIds = new Set(Object.keys(figmaScenarioNodeIds));

const screenshotScenarioIds = new Set([
  "shotref-empty",
  "shotref-input-agent",
  "shotref-shot-agent",
  "shotref-design-chain",
  "shotref-assets-empty-agent",
  "shotref-asset-setting-chain",
  "shotref-product-chain",
  "shotref-workflow-panel",
  "shotref-asset-prompt-agent",
  "shotref-storyboard-image-agent",
  "shotref-review-agent",
  "shotref-add-panel",
  "shotref-video-execute-agent",
  "shotref-timeline-agent",
  "shotref-video-prompt-agent",
  "shotref-editor"
]);

const screenshotAgentScenarioIds = new Set([
  "shotref-input-agent",
  "shotref-shot-agent",
  "shotref-assets-empty-agent",
  "shotref-asset-prompt-agent",
  "shotref-storyboard-image-agent",
  "shotref-review-agent",
  "shotref-video-execute-agent",
  "shotref-timeline-agent",
  "shotref-video-prompt-agent"
]);

const screenshotViewportByScenario: Record<string, { x: number; y: number; zoom: number }> = {
  "shotref-input-agent": { x: 122, y: 34, zoom: 1 },
  "shotref-shot-agent": { x: 110, y: 122, zoom: .9 },
  "shotref-design-chain": { x: 74, y: 318, zoom: .56 },
  "shotref-assets-empty-agent": { x: 252, y: 42, zoom: .56 },
  "shotref-asset-setting-chain": { x: 198, y: 252, zoom: .62 },
  "shotref-product-chain": { x: 188, y: 232, zoom: .58 },
  "shotref-asset-prompt-agent": { x: 260, y: 54, zoom: .58 },
  "shotref-storyboard-image-agent": { x: -48, y: 18, zoom: .45 },
  "shotref-review-agent": { x: -506, y: 108, zoom: .56 },
  "shotref-add-panel": { x: -486, y: -28, zoom: .47 },
  "shotref-video-execute-agent": { x: -470, y: -36, zoom: .47 },
  "shotref-timeline-agent": { x: -756, y: 20, zoom: .52 },
  "shotref-video-prompt-agent": { x: -548, y: -14, zoom: .55 }
};

const figmaNodePlacements: Record<string, Record<string, FigmaNodePlacement>> = {
  "figma-main": {
    brief: { x: 32, y: 220 },
    "shot-plan": { x: 440, y: 150 },
    "asset-characters-1": { x: 905, y: 40 },
    "asset-scenes-1": { x: 905, y: 296 },
    "asset-props-1": { x: 905, y: 552 },
    "storyboard-image-shot-01": { x: 1280, y: 88 },
    "storyboard-video-shot-01": { x: 1280, y: 372 },
    audio: { x: 1648, y: 110 },
    timeline: { x: 1648, y: 404 }
  },
  "figma-shot": {
    brief: { x: 96, y: 260 },
    "shot-plan": { x: 552, y: 170 }
  },
  "figma-assets": {
    brief: { x: 38, y: 270 },
    "shot-plan": { x: 438, y: 170 },
    "asset-characters-1": { x: 860, y: 34 },
    "asset-scenes-1": { x: 860, y: 292 },
    "asset-props-1": { x: 860, y: 550 }
  },
  "figma-prompt": {
    brief: { x: 34, y: 270 },
    "shot-plan": { x: 410, y: 150 },
    "asset-characters-1": { x: 790, y: 30 },
    "asset-scenes-1": { x: 790, y: 286 },
    "asset-props-1": { x: 790, y: 542 },
    "storyboard-image-shot-03": { x: 1160, y: 100 },
    "storyboard-video-shot-03": { x: 1160, y: 382 }
  },
  "figma-review": {
    brief: { x: 34, y: 270 },
    "shot-plan": { x: 410, y: 150 },
    "asset-characters-1": { x: 770, y: 36 },
    "asset-scenes-1": { x: 770, y: 292 },
    "asset-props-1": { x: 770, y: 548 },
    "storyboard-video-shot-03": { x: 1115, y: 210 },
    "review-storyboard-video-shot-03": { x: 1495, y: 178 }
  },
  "figma-editor": {
    brief: { x: 34, y: 270 },
    "shot-plan": { x: 410, y: 150 },
    "asset-characters-1": { x: 790, y: 70 },
    "storyboard-image-shot-03": { x: 1150, y: 92 },
    "storyboard-video-shot-03": { x: 1150, y: 378 },
    audio: { x: 1495, y: 132 },
    timeline: { x: 1495, y: 420 }
  },
  "figma-agent": {
    brief: { x: 70, y: 240 },
    "shot-plan": { x: 500, y: 180 },
    "asset-characters-1": { x: 870, y: 70 },
    "storyboard-video-shot-03": { x: 1210, y: 210 },
    timeline: { x: 1210, y: 520 }
  },
  "figma-agent-guide": {
    brief: { x: 70, y: 240 },
    "shot-plan": { x: 500, y: 180 },
    "asset-characters-1": { x: 870, y: 70 },
    "storyboard-video-shot-03": { x: 1210, y: 210 },
    timeline: { x: 1210, y: 520 }
  },
  "figma-search": {
    brief: { x: 360, y: 252 },
    "shot-plan": { x: 720, y: 160 },
    "asset-characters-1": { x: 1080, y: 50 },
    "asset-scenes-1": { x: 1080, y: 306 },
    "storyboard-video-shot-03": { x: 1420, y: 248 }
  },
  "figma-add": {
    brief: { x: 82, y: 258 },
    "shot-plan": { x: 485, y: 170 },
    "asset-characters-1": { x: 850, y: 76 },
    "storyboard-video-shot-03": { x: 1190, y: 220 },
    timeline: { x: 1190, y: 526 }
  },
  "figma-workflow": {
    brief: { x: 82, y: 258 },
    "shot-plan": { x: 485, y: 170 },
    "asset-characters-1": { x: 850, y: 76 },
    "storyboard-video-shot-03": { x: 1190, y: 220 },
    timeline: { x: 1190, y: 526 }
  },
  "figma-roles": {
    brief: { x: 82, y: 258 },
    "shot-plan": { x: 485, y: 170 },
    "asset-characters-1": { x: 850, y: 76 },
    "storyboard-video-shot-03": { x: 1190, y: 220 },
    timeline: { x: 1190, y: 526 }
  },
  "figma-history": {
    brief: { x: 82, y: 258 },
    "shot-plan": { x: 485, y: 170 },
    "asset-characters-1": { x: 850, y: 76 },
    "storyboard-video-shot-03": { x: 1190, y: 220 },
    timeline: { x: 1190, y: 526 }
  },
  "figma-running": {
    brief: { x: 64, y: 238 },
    "shot-plan": { x: 458, y: 170 },
    "asset-characters-1": { x: 816, y: 70 },
    "storyboard-image-shot-03": { x: 1150, y: 110, data: { state: "running", progress: 78 } },
    "storyboard-video-shot-03": { x: 1150, y: 390, data: { state: "running", progress: 42 } },
    timeline: { x: 1490, y: 268 }
  }
};

function cloneFigmaNode(source: StudioNode, placement?: FigmaNodePlacement, preserveHierarchy = false): StudioNode {
  return {
    ...source,
    position: placement ? { x: placement.x, y: placement.y } : { ...source.position },
    data: { ...source.data, ...placement?.data },
    selected: false,
    parentId: preserveHierarchy ? source.parentId : undefined,
    extent: preserveHierarchy ? source.extent : undefined,
    style: placement?.style ?? (source.style ? { ...source.style } : undefined)
  };
}

function makeFigmaReviewNode(placement: FigmaNodePlacement): StudioNode {
  return {
    id: "review-storyboard-video-shot-03",
    type: "studio",
    position: { x: placement.x, y: placement.y },
    data: {
      label: "候选质检",
      subtitle: "SHOT 03 · 分镜视频 · 2 / 4 候选",
      kind: "review",
      state: "review",
      mediaSequence: academyStoryboardFrames.slice(0, 4),
      width: 360
    },
    style: { width: 360 },
    zIndex: 2
  };
}

function cloneFigmaEdge(source: Edge): Edge {
  return {
    ...source,
    style: source.style ? { ...source.style } : undefined
  };
}

function makeFigmaScenarioGraph(value: string): CanvasGraph {
  const nodeById = new Map(demoNodes.map((node) => [node.id, node]));
  const placements = figmaNodePlacements[value] ?? {};
  const nodes = figmaScenarioNodeIds[value].flatMap((id) => {
    if (id === "review-storyboard-video-shot-03") return [makeFigmaReviewNode(placements[id])];
    const source = nodeById.get(id);
    return source ? [cloneFigmaNode(source, placements[id])] : [];
  });
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = demoEdges
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .map(cloneFigmaEdge);

  if (nodeIds.has("storyboard-video-shot-03") && nodeIds.has("review-storyboard-video-shot-03")) {
    edges.push({
      id: "storyboard-video-shot-03-review-storyboard-video-shot-03",
      source: "storyboard-video-shot-03",
      target: "review-storyboard-video-shot-03",
      type: "default",
      className: "reference-edge reference-edge--review",
      style: { stroke: "#FDCE8B", strokeWidth: 1.4 }
    });
  }

  return { nodes, edges };
}

function cloneCanvasGraph(nodes: StudioNode[], edges: Edge[]): CanvasGraph {
  return {
    nodes: nodes.map((node) => cloneFigmaNode(node, undefined, true)),
    edges: edges.map(cloneFigmaEdge)
  };
}

function cloneDemoSubset(nodeIds: string[], dataPatches: Record<string, Partial<StudioNode["data"]>> = {}): CanvasGraph {
  const requestedIds = new Set(nodeIds);
  const nodes = demoNodes
    .filter((node) => requestedIds.has(node.id))
    .map((node) => {
      const patch = dataPatches[node.id] ?? {};
      return cloneFigmaNode({
        ...node,
        data: { ...node.data, ...patch }
      }, undefined, true);
    });
  const availableIds = new Set(nodes.map((node) => node.id));
  return {
    nodes,
    edges: demoEdges
      .filter((edge) => availableIds.has(edge.source) && availableIds.has(edge.target))
      .map(cloneFigmaEdge)
  };
}

const briefAndShotIds = ["brief", "shot-plan"];
const assetNodeIds = [
  "asset-lane-characters",
  ...academyCharacters.map((_, index) => `asset-characters-${index + 1}`),
  "asset-lane-scenes",
  ...academyScenes.map((_, index) => `asset-scenes-${index + 1}`),
  "asset-lane-props",
  ...academyProps.map((_, index) => `asset-props-${index + 1}`)
];
const storyboardImageNodeIds = [
  "storyboard-image-lane",
  ...academyShots.map((shot) => `storyboard-image-shot-${shot.id}`)
];
const storyboardVideoNodeIds = [
  "storyboard-video-lane",
  ...academyShots.map((shot) => `storyboard-video-shot-${shot.id}`)
];

function patchAssetStates(state: NodeState): Record<string, Partial<StudioNode["data"]>> {
  return Object.fromEntries(assetNodeIds.map((id) => [
    id,
    id.startsWith("asset-lane-") ? { state } : { state }
  ]));
}

function patchStoryboardStates(mode: "image" | "video", state: NodeState): Record<string, Partial<StudioNode["data"]>> {
  const ids = mode === "image" ? storyboardImageNodeIds : storyboardVideoNodeIds;
  return Object.fromEntries(ids.map((id) => [
    id,
    id.endsWith("-lane") ? { state } : { state }
  ]));
}

function makeBlankBriefGraph(): CanvasGraph {
  return {
    nodes: [{
      id: "brief",
      type: "studio",
      position: { x: 282, y: 224 },
      data: {
        label: "创作输入",
        subtitle: "空白输入 · 待填写",
        kind: "brief",
        state: "empty",
        scriptText: "",
        briefFileName: "未上传文件",
        briefType: "待设置",
        totalDuration: "待设置",
        briefAspect: "待设置",
        atmosphereCount: 0
      },
      zIndex: 2
    }],
    edges: []
  };
}

function makeShotOnlyGraph(): CanvasGraph {
  return {
    nodes: [
      cloneFigmaNode({
        ...demoNodes.find((node) => node.id === "brief")!,
        position: { x: 210, y: 238 },
        data: {
          ...demoNodes.find((node) => node.id === "brief")!.data,
          subtitle: "已解析 · 7 个镜头"
        }
      }, undefined, true),
      cloneFigmaNode({
        ...demoNodes.find((node) => node.id === "shot-plan")!,
        position: { x: 645, y: 188 },
        data: {
          ...demoNodes.find((node) => node.id === "shot-plan")!.data,
          subtitle: "7 个镜头 · 71s",
          assetStage: false,
          createdStoryboardModes: []
        }
      }, undefined, true)
    ],
    edges: [cloneFigmaEdge(demoEdges.find((edge) => edge.id === "brief-plan")!)]
  };
}

function makeWorkflowTemplateStaticGraph(templateId: WorkflowTemplateId): CanvasGraph {
  const template = workflowTemplates[templateId];
  const nodes: StudioNode[] = template.nodes.map((item, index) => ({
    id: item.key,
    type: "studio",
    position: { x: item.x, y: item.y },
    data: {
      label: item.label,
      subtitle: item.subtitle,
      kind: item.kind,
      state: item.state ?? "ready",
      width: item.kind === "brief" ? undefined : item.width,
      workflowId: templateId,
      workflowBody: item.workflowBody,
      workflowActionLabel: item.workflowActionLabel,
      scriptText: item.scriptText,
      briefFileName: item.briefFileName,
      briefType: item.briefType,
      briefAspect: item.briefAspect,
      totalDuration: item.totalDuration,
      atmosphereCount: item.atmosphereCount,
      assetCategory: item.assetCategory,
      assetDescription: item.assetDescription
    },
    style: item.kind === "brief" ? undefined : { width: item.width },
    zIndex: 2 + index
  }));
  return {
    nodes,
    edges: template.edges.map(([source, target]) => ({
      id: `${templateId}-${source}-${target}`,
      source,
      target,
      type: "default",
      style: { stroke: "rgba(255,255,255,.22)", strokeWidth: 1.15 }
    }))
  };
}

function makeReviewGraph(): CanvasGraph {
  const base = cloneDemoSubset([...briefAndShotIds, ...assetNodeIds, ...storyboardVideoNodeIds]);
  const reviewNode: StudioNode = {
    id: "review-storyboard-video-shot-01",
    type: "studio",
    position: { x: 2528, y: 468 },
    data: {
      label: "候选质检",
      subtitle: "SHOT 01 · 分镜视频 · 1 / 4 候选",
      kind: "review",
      state: "review",
      mediaSequence: academyStoryboardFrames.slice(0, 4),
      videoSequence: academyVideoFiles.slice(0, 1),
      width: 360
    },
    style: { width: 360 },
    zIndex: 4
  };
  return {
    nodes: [...base.nodes, reviewNode],
    edges: [
      ...base.edges,
      {
        id: "storyboard-video-shot-01-review-storyboard-video-shot-01",
        source: "storyboard-video-shot-01",
        target: "review-storyboard-video-shot-01",
        type: "default",
        className: "reference-edge reference-edge--review",
        style: { stroke: "#F2B35B", strokeWidth: 1.25 }
      }
    ]
  };
}

function makeScreenshotScenarioGraph(value: string): CanvasGraph {
  if (value === "shotref-empty") return { nodes: [], edges: [] };
  if (value === "shotref-input-agent") return makeBlankBriefGraph();
  if (value === "shotref-shot-agent") return makeShotOnlyGraph();
  if (value === "shotref-design-chain") return makeWorkflowTemplateStaticGraph("design-expert");
  if (value === "shotref-asset-setting-chain") return makeWorkflowTemplateStaticGraph("asset-setting");
  if (value === "shotref-product-chain") return makeWorkflowTemplateStaticGraph("product-ad");
  if (value === "shotref-workflow-panel") return { nodes: [], edges: [] };
  if (value === "shotref-assets-empty-agent") {
    return cloneDemoSubset([...briefAndShotIds, ...assetNodeIds], patchAssetStates("empty"));
  }
  if (value === "shotref-asset-prompt-agent") {
    return cloneDemoSubset([...briefAndShotIds, ...assetNodeIds]);
  }
  if (value === "shotref-storyboard-image-agent") {
    return cloneDemoSubset(
      [...briefAndShotIds, ...assetNodeIds, ...storyboardImageNodeIds],
      patchStoryboardStates("image", "empty")
    );
  }
  if (value === "shotref-review-agent") return makeReviewGraph();
  if (value === "shotref-add-panel") {
    return cloneDemoSubset([...briefAndShotIds, ...assetNodeIds, ...storyboardImageNodeIds, ...storyboardVideoNodeIds]);
  }
  if (value === "shotref-video-execute-agent") {
    return cloneDemoSubset(
      [...briefAndShotIds, ...assetNodeIds, ...storyboardImageNodeIds, ...storyboardVideoNodeIds],
      patchStoryboardStates("video", "empty")
    );
  }
  if (value === "shotref-timeline-agent" || value === "shotref-editor") {
    return cloneDemoSubset([...briefAndShotIds, ...assetNodeIds, ...storyboardVideoNodeIds, "timeline"]);
  }
  if (value === "shotref-video-prompt-agent") {
    return cloneDemoSubset([...briefAndShotIds, ...assetNodeIds, ...storyboardVideoNodeIds]);
  }
  return { nodes: [], edges: [] };
}

function initialGraphForScenario(value: string): CanvasGraph {
  if (value === "empty") return { nodes: [], edges: [] };
  if (screenshotScenarioIds.has(value)) return makeScreenshotScenarioGraph(value);
  if (figmaScenarioIds.has(value)) return makeFigmaScenarioGraph(value);
  if (demoScenarioIds.has(value)) return cloneCanvasGraph(demoNodes, demoEdges);
  return cloneCanvasGraph(initialNodes, initialEdges);
}

const demoScenarioIds = new Set([
  "demo",
  ...figmaScenarioIds,
  ...screenshotScenarioIds,
  "flow-confirm",
  "flow-assets",
  "flow-prompt",
  "container-choice",
  "node-params",
  "selected",
  "review",
  "export",
  "editor",
  "agent",
  "agent-guide",
  "search",
  "add",
  "dock-workflow",
  "dock-roles",
  "dock-history",
  "running"
]);

const scenarioJourneyStage: Partial<Record<string, AgentJourneyStage>> = {
  "shotref-input-agent": "input",
  "shotref-shot-agent": "shots",
  "shotref-assets-empty-agent": "assets",
  "shotref-asset-prompt-agent": "assets",
  "shotref-storyboard-image-agent": "generate",
  "shotref-review-agent": "export",
  "shotref-video-execute-agent": "generate",
  "shotref-timeline-agent": "export",
  "shotref-video-prompt-agent": "generate",
  "flow-confirm": "shots",
  "figma-shot": "shots",
  "flow-assets": "assets",
  "figma-assets": "assets",
  "flow-prompt": "prompt",
  "figma-prompt": "prompt",
  "container-choice": "shots",
  "node-params": "generate",
  selected: "generate",
  review: "export",
  "figma-review": "export",
  export: "export",
  "figma-editor": "export",
  editor: "export",
  "figma-running": "generate",
  running: "generate"
};

function initialDockViewForScenario(value: string): DockView {
  if (value === "add" || value === "figma-add" || value === "shotref-add-panel") return "add";
  if (value === "dock-workflow" || value === "figma-workflow" || value === "shotref-workflow-panel") return "workflow";
  if (value === "dock-roles" || value === "figma-roles") return "roles";
  if (value === "dock-history" || value === "figma-history") return "history";
  return null;
}

function initialSelectedNodeForScenario(value: string) {
  if (value === "shotref-input-agent") return "brief";
  if (value === "shotref-shot-agent") return "shot-plan";
  if (value === "shotref-asset-prompt-agent") return "asset-characters-1";
  if (value === "shotref-review-agent") return "review-storyboard-video-shot-01";
  if (value === "shotref-timeline-agent") return "timeline";
  if (value === "shotref-video-prompt-agent") return "storyboard-video-shot-01";
  if (value === "flow-confirm" || value === "container-choice" || value === "figma-shot") return "shot-plan";
  if (value === "flow-assets" || value === "figma-assets") return "asset-characters-1";
  if (value === "flow-prompt" || value === "figma-prompt") return "storyboard-video-shot-03";
  if (value === "figma-review") return "review-storyboard-video-shot-03";
  if (value === "node-params" || value === "selected" || value === "running" || value === "figma-running") return "storyboard-video-shot-03";
  if (value === "review" || value === "export" || value === "editor" || value === "figma-editor") return "timeline";
  return null;
}

function initialLeftOpenForScenario(value: string) {
  if (value === "empty" || value === "shotref-empty" || value === "shotref-workflow-panel") return false;
  return true;
}

type CanvasContextMenuState = {
  x: number;
  y: number;
  flowPosition: { x: number; y: number };
};

type ManualSelectionGroup = {
  id: string;
  nodeIds: string[];
};

function nodeDimension(node: StudioNode, axis: "width" | "height", fallback: number) {
  const measured = node.measured?.[axis];
  const dataSize = node.data[axis];
  const styleSize = node.style?.[axis];
  if (typeof measured === "number" && measured > 0) return measured;
  if (typeof dataSize === "number" && dataSize > 0) return dataSize;
  if (typeof styleSize === "number" && styleSize > 0) return styleSize;
  return fallback;
}

function nodeAbsolutePosition(node: StudioNode, allNodes: StudioNode[]) {
  let x = node.position.x;
  let y = node.position.y;
  let parentId = node.parentId;

  while (parentId) {
    const parent = allNodes.find((candidate) => candidate.id === parentId);
    if (!parent) break;
    x += parent.position.x;
    y += parent.position.y;
    parentId = parent.parentId;
  }

  return { x, y };
}

function nodeHasMovedAncestor(node: StudioNode, movedIds: ReadonlySet<string>, allNodes: StudioNode[]) {
  let parentId = node.parentId;

  while (parentId) {
    if (movedIds.has(parentId)) return true;
    const parent = allNodes.find((candidate) => candidate.id === parentId);
    if (!parent) break;
    parentId = parent.parentId;
  }

  return false;
}

type WorkflowTemplateNode = {
  key: string;
  kind: NodeKind;
  label: string;
  subtitle?: string;
  scriptText?: string;
  briefFileName?: string;
  briefType?: string;
  briefAspect?: string;
  totalDuration?: string;
  atmosphereCount?: number;
  workflowBody?: string;
  workflowActionLabel?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  assetCategory?: AssetCategory;
  assetDescription?: string;
  state?: NodeState;
};

type WorkflowTemplateDefinition = {
  nodes: WorkflowTemplateNode[];
  edges: Array<[string, string]>;
};

type CanvasRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const WORKFLOW_TEMPLATE_GUTTER = 220;
const WORKFLOW_TEMPLATE_PADDING = 96;

function workflowTemplateBounds(template: WorkflowTemplateDefinition): CanvasRect {
  const minX = Math.min(...template.nodes.map((node) => node.x));
  const minY = Math.min(...template.nodes.map((node) => node.y));
  const maxX = Math.max(...template.nodes.map((node) => node.x + (node.width ?? 300)));
  const maxY = Math.max(...template.nodes.map((node) => node.y + (node.height ?? 180)));

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function inflateRect(rect: CanvasRect, padding: number): CanvasRect {
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2
  };
}

function rectsOverlap(first: CanvasRect, second: CanvasRect) {
  return first.x < second.x + second.width
    && first.x + first.width > second.x
    && first.y < second.y + second.height
    && first.y + first.height > second.y;
}

function nodeCanvasRect(node: StudioNode, allNodes: StudioNode[]): CanvasRect {
  const position = nodeAbsolutePosition(node, allNodes);
  return {
    x: position.x,
    y: position.y,
    width: nodeDimension(node, "width", 300),
    height: nodeDimension(node, "height", 180)
  };
}

function unionBounds(rects: CanvasRect[]): CanvasRect | null {
  if (!rects.length) return null;

  const minX = Math.min(...rects.map((rect) => rect.x));
  const minY = Math.min(...rects.map((rect) => rect.y));
  const maxX = Math.max(...rects.map((rect) => rect.x + rect.width));
  const maxY = Math.max(...rects.map((rect) => rect.y + rect.height));

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function findWorkflowTemplateBase(template: WorkflowTemplateDefinition, existingNodes: StudioNode[], center: { x: number; y: number }) {
  const bounds = workflowTemplateBounds(template);
  const existingRects = existingNodes.map((node) => inflateRect(nodeCanvasRect(node, existingNodes), WORKFLOW_TEMPLATE_PADDING));
  const target = { x: center.x - bounds.width / 2, y: center.y - bounds.height / 2 };
  const stepX = bounds.width + WORKFLOW_TEMPLATE_GUTTER;
  const stepY = bounds.height + WORKFLOW_TEMPLATE_GUTTER;
  const candidates: Array<{ x: number; y: number; weight: number }> = [{ ...target, weight: 0 }];

  for (let ring = 1; ring <= 4; ring += 1) {
    for (let column = -ring; column <= ring; column += 1) {
      for (let row = -ring; row <= ring; row += 1) {
        if (Math.max(Math.abs(column), Math.abs(row)) !== ring) continue;
        candidates.push({
          x: target.x + column * stepX,
          y: target.y + row * stepY,
          weight: Math.abs(column) + Math.abs(row) + ring * .08
        });
      }
    }
  }

  const sortedCandidates = candidates.sort((first, second) => first.weight - second.weight);
  const placement = sortedCandidates.find((candidate) => {
    const candidateRect = { x: candidate.x, y: candidate.y, width: bounds.width, height: bounds.height };
    return existingRects.every((rect) => !rectsOverlap(candidateRect, rect));
  });

  if (placement) return { x: placement.x - bounds.x, y: placement.y - bounds.y };

  const occupied = unionBounds(existingRects);
  if (!occupied) return { x: target.x - bounds.x, y: target.y - bounds.y };

  return {
    x: occupied.x + occupied.width + WORKFLOW_TEMPLATE_GUTTER - bounds.x,
    y: occupied.y - bounds.y
  };
}

function journeyStageFromNodes(nodes: StudioNode[]): AgentJourneyStage {
  if (nodes.some((node) => node.data.kind === "timeline")) return "export";
  if (nodes.some((node) => node.data.kind === "review" || node.data.kind === "video" || node.id === "storyboard-video-lane")) return "generate";
  if (nodes.some((node) => node.data.kind === "prompt")) return "prompt";
  if (nodes.some((node) => node.data.kind === "asset-lane" || node.data.kind === "asset-group" || node.data.assetCategory)) return "assets";
  if (nodes.some((node) => node.data.kind === "shot-plan" || node.data.kind === "storyboard" || node.data.kind === "shot-lane")) return "shots";
  return "input";
}

function findJourneyStageNode(stage: AgentJourneyStage, nodes: StudioNode[]) {
  const findByKind = (...kinds: StudioNode["data"]["kind"][]) => nodes.find((node) => kinds.includes(node.data.kind));

  if (stage === "input") return findByKind("brief") ?? nodes[0];
  if (stage === "shots") return findByKind("shot-plan", "storyboard", "shot-lane");
  if (stage === "assets") return findByKind("asset-lane", "asset-group") ?? nodes.find((node) => Boolean(node.data.assetCategory));
  if (stage === "prompt") return findByKind("prompt", "style-board", "brand-guideline");
  if (stage === "generate") return nodes.find((node) => node.id === "storyboard-video-lane")
    ?? findByKind("video", "image", "audio", "director-3d", "review")
    ?? nodes.find((node) => node.id === "storyboard-image-lane");
  return findByKind("timeline", "review");
}

const workflowTemplates: Record<WorkflowTemplateId, WorkflowTemplateDefinition> = {
  "design-expert": {
    nodes: [
      { key: "brief", kind: "brief", label: "创作输入", subtitle: "设计需求 · 参考素材", scriptText: "输入参考片、品牌方向和生图目标：需要从参考画面中提取构图、色彩、光影与材质规则，形成可复用风格板，并输出 3 套主视觉候选。", briefFileName: "设计专家生图流_brief.md", briefType: "设计专家生图", briefAspect: "16:9 / 4:5", totalDuration: "3 套主视觉", atmosphereCount: 2, workflowActionLabel: "确认需求", x: 0, y: 0, width: 340, height: 345, state: "ready" },
      { key: "reference", kind: "reference-analysis", label: "参考片解析", subtitle: "构图 / 色彩 / 光影", workflowBody: "拆解参考片的镜头构图、色彩层级、主光方向、材质质感和可迁移的视觉语言，输出后续风格板约束。", workflowActionLabel: "解析参考", x: 390, y: 0, width: 300, height: 200, state: "needs-config" },
      { key: "style", kind: "style-board", label: "风格板", subtitle: "视觉调性 · 可复用", workflowBody: "沉淀关键词、配色、材质、构图比例、景深和禁止项，作为生图节点的统一视觉约束。", workflowActionLabel: "生成风格板", x: 750, y: -105, width: 300, height: 200, state: "needs-config" },
      { key: "brand", kind: "brand-guideline", label: "品牌规范", subtitle: "字体 / 色彩 / 禁用项", workflowBody: "整理品牌色、字体使用、标识安全区、画面禁用元素和导出规格，避免生成结果偏离品牌。", workflowActionLabel: "生成规范", x: 750, y: 120, width: 300, height: 200, state: "needs-config" },
      { key: "image", kind: "image", label: "生图", subtitle: "3 套视觉方向", workflowBody: "引用风格板与品牌规范，生成三套可比选主视觉方案，并保留构图、色彩、主体比例差异。", workflowActionLabel: "生成主视觉", x: 1110, y: -45, width: 310, height: 220, state: "needs-config" },
      { key: "polish", kind: "image-polish", label: "图像精修", subtitle: "局部重绘 · 扩图 · 高清增强", workflowBody: "对入选方向进行局部重绘、高清增强、边缘修复和画幅扩展，保留品牌与风格一致性。", workflowActionLabel: "执行精修", x: 1470, y: -45, width: 300, height: 200, state: "needs-config" },
      { key: "review", kind: "review", label: "候选质检", subtitle: "KV 候选 A/B/C/D", workflowBody: "对候选主视觉进行构图、主体清晰度、品牌符合度、文字安全和交付规格质检。", workflowActionLabel: "生成候选", x: 1810, y: -45, width: 360, height: 220, state: "needs-config" }
    ],
    edges: [["brief", "reference"], ["reference", "style"], ["reference", "brand"], ["style", "image"], ["brand", "image"], ["image", "polish"], ["polish", "review"]]
  },
  "product-ad": {
    nodes: [
      { key: "brief", kind: "brief", label: "创作输入", subtitle: "产品 Brief · 卖点素材", scriptText: "输入产品卖点、目标人群、使用场景和成片目标：需要拆解核心利益点，生成产品资产与使用场景，制作 15 秒广告视频并进入剪辑合成。", briefFileName: "产品广告成片流_brief.md", briefType: "产品广告短片", briefAspect: "16:9", totalDuration: "15s 成片", atmosphereCount: 3, workflowActionLabel: "确认 Brief", x: 0, y: 0, width: 340, height: 345, state: "ready" },
      { key: "product", kind: "product-brief", label: "产品卖点拆解", subtitle: "人群 / 卖点 / 证据", workflowBody: "提炼目标人群、使用痛点、核心卖点、证据素材、转化动作与必须露出的产品识别点。", workflowActionLabel: "拆解卖点", x: 390, y: 0, width: 300, height: 200, state: "needs-config" },
      { key: "productAsset", kind: "image", label: "产品资产", subtitle: "产品 · 待生成", workflowBody: "建立产品外观、材质、尺寸与核心识别点，供广告镜头持续引用。", workflowActionLabel: "生成产品资产", x: 740, y: -105, width: 320, height: 210, assetCategory: "prop", assetDescription: "建立产品外观、材质、尺寸与核心识别点，供广告镜头持续引用。", state: "needs-config" },
      { key: "scene", kind: "image", label: "使用场景", subtitle: "场景 · 待生成", workflowBody: "定义产品出现的空间、光影、使用动作与目标人群环境。", workflowActionLabel: "生成使用场景", x: 740, y: 150, width: 320, height: 210, assetCategory: "scene", assetDescription: "定义产品出现的空间、光影、使用动作与目标人群环境。", state: "needs-config" },
      { key: "storyboard", kind: "storyboard", label: "分镜板", subtitle: "6 镜头广告节奏", workflowBody: "按卖点节奏梳理开场钩子、产品展示、场景使用、利益证明、记忆点和 CTA 六段分镜。", workflowActionLabel: "生成分镜板", x: 1130, y: 10, width: 300, height: 220, state: "needs-config" },
      { key: "video", kind: "video", label: "生视频", subtitle: "15s 主视觉成片", workflowBody: "根据分镜板批量生成广告镜头，保持产品外观、场景光影和动作节奏连续。", workflowActionLabel: "生成视频", x: 1490, y: -60, width: 330, height: 230, state: "needs-config" },
      { key: "audio", kind: "audio", label: "口播 / 音效", subtitle: "文案口播与节奏点", workflowBody: "生成口播、音效和节奏点，匹配 15 秒成片结构。", workflowActionLabel: "生成音频", x: 1490, y: 215, width: 300, height: 220, state: "needs-config" },
      { key: "timeline", kind: "timeline", label: "剪辑合成", subtitle: "待确认导出", workflowBody: "汇总视频镜头、口播音效和 CTA，进入剪辑合成并输出可交付版本。", workflowActionLabel: "执行合成", x: 1870, y: 15, width: 330, height: 230, state: "needs-config" }
    ],
    edges: [["brief", "product"], ["product", "productAsset"], ["product", "scene"], ["productAsset", "storyboard"], ["scene", "storyboard"], ["storyboard", "video"], ["audio", "timeline"], ["video", "timeline"]]
  },
  "asset-setting": {
    nodes: [
      { key: "brief", kind: "brief", label: "创作输入", subtitle: "资产设定 Brief · 世界观", scriptText: "输入世界观、角色关系、关键场景和道具需求：需要统一美术调性，生成角色、场景、道具资产，并输出一致性规范。", briefFileName: "资产设定工作流_brief.md", briefType: "资产设定", briefAspect: "16:9 / 角色全身", totalDuration: "资产包", atmosphereCount: 4, workflowActionLabel: "确认设定", x: 0, y: 0, width: 340, height: 345, state: "ready" },
      { key: "style", kind: "style-board", label: "世界观风格板", subtitle: "美术调性 · 色彩 · 禁用项", workflowBody: "确定世界观关键词、色彩、材质、服装体系、空间规则和禁止项，作为所有资产生成的总约束。", workflowActionLabel: "生成风格板", x: 390, y: 0, width: 300, height: 200, state: "needs-config" },
      { key: "character", kind: "image", label: "角色", subtitle: "角色 · 待生成", workflowBody: "设定主角与关键配角的身份、服装、年龄层、表演气质与一致性规则。", workflowActionLabel: "生成角色", x: 760, y: -165, width: 330, height: 210, assetCategory: "character", assetDescription: "设定主角与关键配角的身份、服装、年龄层、表演气质与一致性规则。", state: "needs-config" },
      { key: "scene", kind: "image", label: "场景", subtitle: "场景 · 待生成", workflowBody: "梳理世界观核心空间、时间、天气、光影方向和叙事氛围。", workflowActionLabel: "生成场景", x: 760, y: 90, width: 330, height: 210, assetCategory: "scene", assetDescription: "梳理世界观核心空间、时间、天气、光影方向和叙事氛围。", state: "needs-config" },
      { key: "prop", kind: "image", label: "道具", subtitle: "道具 · 待生成", workflowBody: "定义关键道具的造型、材质、用途、尺寸和在剧情中的识别点。", workflowActionLabel: "生成道具", x: 760, y: 345, width: 330, height: 210, assetCategory: "prop", assetDescription: "定义关键道具的造型、材质、用途、尺寸和在剧情中的识别点。", state: "needs-config" },
      { key: "consistency", kind: "consistency-check", label: "一致性检查", subtitle: "角色 / 场景 / 道具统一", workflowBody: "检查角色服装、场景光影、道具材质和命名是否统一，标记需要回改的资产。", workflowActionLabel: "执行检查", x: 1150, y: 90, width: 320, height: 200, state: "needs-config" },
      { key: "guideline", kind: "brand-guideline", label: "资产规范", subtitle: "命名 · 禁用项 · 复用规则", workflowBody: "输出资产命名、引用关系、可复用规则、禁用项和后续分镜生产的使用说明。", workflowActionLabel: "生成规范", x: 1510, y: 90, width: 300, height: 200, state: "needs-config" }
    ],
    edges: [["brief", "style"], ["style", "character"], ["style", "scene"], ["style", "prop"], ["character", "consistency"], ["scene", "consistency"], ["prop", "consistency"], ["consistency", "guideline"]]
  }
};

function CanvasApp() {
  const initialGraph = useMemo(() => initialGraphForScenario(scenario), []);
  const isDemoScenario = demoScenarioIds.has(scenario);
  const [nodes, setNodes, onNodesChange] = useNodesState<StudioNode>(initialGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialGraph.edges);
  const nodesRef = useRef(nodes);
  const [leftOpen, setLeftOpen] = useState(initialLeftOpenForScenario(scenario));
  const [query, setQuery] = useState(scenario === "search" || scenario === "figma-search" ? "角色" : "");
  const [activeDock, setActiveDock] = useState<DockView>(initialDockViewForScenario(scenario));
  const [agentOpen, setAgentOpen] = useState(scenario === "agent" || scenario === "agent-guide" || scenario === "figma-agent" || scenario === "figma-agent-guide" || screenshotAgentScenarioIds.has(scenario));
  const [agentFlowGuideOpen, setAgentFlowGuideOpen] = useState(scenario === "agent-guide" || scenario === "figma-agent-guide");
  const [editorOpen, setEditorOpen] = useState(scenario === "export" || scenario === "editor" || scenario === "figma-editor" || scenario === "shotref-editor");
  const [contextMenu, setContextMenu] = useState<CanvasContextMenuState | null>(null);
  const initialSelected = initialSelectedNodeForScenario(scenario);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelected);
  const [selectedManualGroupId, setSelectedManualGroupId] = useState<string | null>(null);
  const [manualGroupedNodeIds, setManualGroupedNodeIds] = useState<Set<string>>(() => new Set());
  const [manualSelectionGroups, setManualSelectionGroups] = useState<ManualSelectionGroup[]>([]);
  const [selectionNotice, setSelectionNotice] = useState<string | null>(null);
  const manualGroupDragRef = useRef<{ pointerId: number | null; lastClientX: number; lastClientY: number; nodeIds: string[] } | null>(null);
  const preserveManualGroupClickRef = useRef(false);
  const edgesRef = useRef(edges);
  const reactFlow = useReactFlow<StudioNode>();
  const viewport = useViewport();
  const openEditor = useCallback(() => setEditorOpen(true), []);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    setNodes((current) => {
      let changed = false;
      const next = current.map((node) => {
        let nextNode = node;
        if (node.extent === "parent") {
          changed = true;
          const { extent: _extent, ...nodeWithoutExtent } = node;
          nextNode = nodeWithoutExtent as StudioNode;
        }
        if (nextNode.data.workflowId) {
          const hasForcedWorkflowHeight = nextNode.data.height !== undefined || nextNode.style?.height !== undefined;
          const hasForcedBriefWidth = nextNode.data.kind === "brief"
            && (nextNode.data.width !== undefined || nextNode.style?.width !== undefined);
          const nextDuration = nextNode.data.workflowId === "design-expert" && nextNode.data.totalDuration === "静帧"
            ? "3 套主视觉"
            : nextNode.data.totalDuration;
          if (hasForcedWorkflowHeight || hasForcedBriefWidth || nextDuration !== nextNode.data.totalDuration) {
            changed = true;
            const nextData: StudioNode["data"] = {
              ...nextNode.data,
              totalDuration: nextDuration
            };
            const nextStyle = { ...(nextNode.style ?? {}) };
            delete nextData.height;
            delete nextStyle.height;
            if (nextNode.data.kind === "brief") {
              delete nextData.width;
              delete nextStyle.width;
            }
            return {
              ...nextNode,
              data: nextData,
              style: Object.keys(nextStyle).length ? nextStyle : undefined
            };
          }
          return nextNode;
        }
        return nextNode;
      });
      return changed ? next : current;
    });
  }, [setNodes]);

  useEffect(() => {
    const viewport = screenshotViewportByScenario[scenario];
    if (viewport) {
      const timer = window.setTimeout(() => reactFlow.setViewport(viewport, { duration: 0 }), 220);
      return () => window.clearTimeout(timer);
    }
    if (!isDemoScenario) return;
    const timer = window.setTimeout(() => reactFlow.fitView({ duration: 650, padding: .08, minZoom: .22, maxZoom: .38 }), 180);
    return () => window.clearTimeout(timer);
  }, [isDemoScenario, reactFlow]);

  useEffect(() => {
    if (!contextMenu) return;
    const closeMenu = (event: KeyboardEvent) => {
      if (event.key === "Escape") setContextMenu(null);
    };
    window.addEventListener("keydown", closeMenu);
    return () => window.removeEventListener("keydown", closeMenu);
  }, [contextMenu]);

  useEffect(() => {
    if (!selectionNotice) return;
    const timer = window.setTimeout(() => setSelectionNotice(null), 1500);
    return () => window.clearTimeout(timer);
  }, [selectionNotice]);

  const focusNode = useCallback((id: string, duration = 380) => {
    const navigationWidth = leftOpen ? (window.innerWidth <= 1380 ? 312 : 332) : 52;
    const availableWidth = window.innerWidth - navigationWidth - 32;
    const maxZoom = Math.min(.98, Math.max(.55, availableWidth / 620));
    reactFlow.fitView({ nodes: [{ id }], duration, padding: 1.15, maxZoom });
  }, [leftOpen, reactFlow]);
  const focusStoryboardLane = useCallback((id: string, duration = 560) => {
    const lane = reactFlow.getNode(id);
    if (!lane) {
      focusNode(id, duration);
      return;
    }
    reactFlow.fitView({
      nodes: [{ id }],
      duration,
      padding: .04,
      minZoom: .34,
      maxZoom: .52
    });
  }, [focusNode, reactFlow]);

  const onRouteChange = useCallback((id: string, route: "storyboard-image" | "storyboard-video" | "free") => {
    setNodes((current) => current.map((node) => node.id === id ? { ...node, data: { ...node.data, route } } : node));
  }, [setNodes]);

  const runNode = useCallback((id: string) => {
    setNodes((current) => current.map((node) => node.id === id ? { ...node, data: { ...node.data, state: "running", progress: 10 } } : node));
    setEdges((current) => current.map((edge) => edge.source === id || edge.target === id ? { ...edge, animated: true } : edge));
    window.setTimeout(() => {
      setNodes((current) => current.map((node) => node.id === id ? { ...node, data: { ...node.data, progress: 42 } } : node));
    }, 420);
    window.setTimeout(() => {
      setNodes((current) => current.map((node) => node.id === id ? { ...node, data: { ...node.data, progress: 76 } } : node));
    }, 980);
    window.setTimeout(() => {
      const downstreamIds = new Set(edgesRef.current.filter((edge) => edge.source === id).map((edge) => edge.target));
      setNodes((current) => current.map((node) => {
        if (node.id === id) {
          const isReview = node.data.kind === "review";
          const nextData: StudioNode["data"] = {
            ...node.data,
            state: isReview ? "review" : "success",
            progress: 100
          };
          if (node.data.kind === "image" && !node.data.mediaSrc) {
            nextData.mediaSrc = node.data.assetCategory === "character"
              ? academyCharacters[0].mediaSrc
              : node.data.assetCategory === "scene"
                ? academyScenes[0].mediaSrc
                : node.data.assetCategory === "prop"
                  ? academyProps[0].mediaSrc
                  : academyStoryboardFrames[0];
            nextData.mediaFit = node.data.assetCategory === "scene" ? "cover" : node.data.assetCategory ? "contain" : node.data.mediaFit;
          }
          if (node.data.kind === "video") {
            nextData.mediaSrc = node.data.mediaSrc ?? academyStoryboardFrames[0];
            nextData.videoSrc = node.data.videoSrc ?? academyVideoFiles[0];
          }
          if (node.data.kind === "review") {
            nextData.mediaSequence = node.data.mediaSequence ?? academyStoryboardFrames.slice(0, 4);
            nextData.subtitle = node.data.subtitle?.includes("候选") ? node.data.subtitle : "4 个候选 · 待选择";
          }
          if (node.data.kind === "timeline") {
            nextData.mediaSrc = node.data.mediaSrc ?? academyStoryboardFrames[0];
            nextData.videoSrc = node.data.videoSrc ?? academyVideoFiles[0];
            nextData.mediaSequence = node.data.mediaSequence ?? academyStoryboardFrames.slice(0, 7);
            nextData.videoSequence = node.data.videoSequence ?? academyVideoFiles.slice(0, 7);
            nextData.totalDuration = node.data.totalDuration ?? "00:15";
            nextData.subtitle = "合成完成 · 可打开剪辑";
          }
          return { ...node, data: nextData };
        }
        if (!downstreamIds.has(node.id) || !["empty", "needs-config"].includes(node.data.state)) return node;
        const incomingEdges = edgesRef.current.filter((edge) => edge.target === node.id);
        const allInputsComplete = incomingEdges.every((edge) => {
          if (edge.source === id) return true;
          const source = current.find((candidate) => candidate.id === edge.source);
          return source?.data.state === "success" || source?.data.state === "review";
        });
        if (!allInputsComplete) return node;
        return {
          ...node,
          data: {
            ...node.data,
            state: "ready",
            subtitle: node.data.subtitle?.replace("待生成", "可执行").replace("待确认导出", "可合成")
          }
        };
      }));
      setEdges((current) => current.map((edge) => edge.source === id || edge.target === id ? { ...edge, animated: false } : edge));
    }, 1800);
  }, [setEdges, setNodes]);

  const runAssetGroup = useCallback((id: string) => {
    const laneKey = id.replace("asset-lane-", "");
    const assetCount = laneKey === "characters" ? academyCharacters.length : laneKey === "scenes" ? academyScenes.length : academyProps.length;
    const childIds = Array.from({ length: assetCount }, (_, index) => `asset-${laneKey}-${index + 1}`);
    setNodes((current) => current.map((node) => node.id === id
      ? { ...node, data: { ...node.data, state: "running", progress: 8 } }
      : childIds.includes(node.id)
        ? { ...node, data: { ...node.data, state: "empty", progress: 0 } }
        : node));
    childIds.forEach((childId, index) => {
      const startDelay = index * 130;
      window.setTimeout(() => {
        setNodes((current) => current.map((node) => node.id === childId ? { ...node, data: { ...node.data, state: "running", progress: 18 } } : node));
      }, startDelay);
      window.setTimeout(() => {
        setNodes((current) => current.map((node) => node.id === childId ? { ...node, data: { ...node.data, progress: 68 } } : node));
      }, startDelay + 430);
      window.setTimeout(() => {
        setNodes((current) => current.map((node) => node.id === childId ? { ...node, data: { ...node.data, state: "success", progress: 100 } } : node));
      }, startDelay + 900);
    });
    window.setTimeout(() => {
      setNodes((current) => current.map((node) => node.id === id ? { ...node, data: { ...node.data, state: "success", progress: 100 } } : node));
    }, 1000 + Math.max(0, childIds.length - 1) * 130);
  }, [setNodes]);

  const runStoryboardGroup = useCallback((id: string) => {
    const mode = id.includes("-video-") ? "video" : "image";
    const childIds = academyShots.map((shot) => `storyboard-${mode}-shot-${shot.id}`);
    setNodes((current) => current.map((node) => node.id === id
      ? { ...node, data: { ...node.data, state: "running", progress: 6 } }
      : childIds.includes(node.id)
        ? { ...node, data: { ...node.data, state: "empty", progress: 0 } }
        : node));
    childIds.forEach((childId, index) => {
      const startDelay = index * 145;
      window.setTimeout(() => {
        setNodes((current) => current.map((node) => node.id === childId ? { ...node, data: { ...node.data, state: "running", progress: 14 } } : node));
      }, startDelay);
      window.setTimeout(() => {
        setNodes((current) => current.map((node) => node.id === childId ? { ...node, data: { ...node.data, progress: 61 } } : node));
      }, startDelay + 380);
      window.setTimeout(() => {
        setNodes((current) => current.map((node) => node.id === childId ? { ...node, data: { ...node.data, state: "success", progress: 100 } } : node));
      }, startDelay + 880);
    });
    window.setTimeout(() => {
      setNodes((current) => current.map((node) => node.id === id ? { ...node, data: { ...node.data, state: "success", progress: 100 } } : node));
    }, 1000 + Math.max(0, childIds.length - 1) * 145);
  }, [setNodes]);

  const generateAssetGroups = useCallback((id: string) => {
    setNodes((current) => current.map((node) => node.id === id
      ? { ...node, data: { ...node.data, state: "running", progress: 22, subtitle: "正在分析镜头资产需求..." } }
      : node));
    window.setTimeout(() => setNodes((current) => current.map((node) => node.id === id
      ? { ...node, data: { ...node.data, progress: 68, subtitle: "正在铺设资产生产节点..." } }
      : node)), 460);
    window.setTimeout(() => {
      setNodes((current) => {
      const hasGeneratedGroups = current.some((node) => node.id === "asset-lane-characters");
      const updated = current.map((node) => {
        if (node.id === id) return { ...node, data: { ...node.data, assetStage: true, state: "success" as const, progress: 100, subtitle: `${academyShots.length} 个镜头 · 资产准备` } };
        return node;
      });
      if (hasGeneratedGroups) return updated;

      const laneHeight = 250;
      const laneGap = 70;
      const maxLaneWidth = 30 + Math.max(academyCharacters.length, academyScenes.length, academyProps.length) * 309;
      const workflowAnchors = current.filter((node) => node.id === id || node.id === "shot-plan");
      const anchorLeft = Math.min(...workflowAnchors.map((node) => node.position.x));
      const anchorRight = Math.max(...workflowAnchors.map((node) => node.position.x + nodeDimension(node, "width", 340)));
      const anchorBottom = Math.max(...workflowAnchors.map((node) => node.position.y + nodeDimension(node, "height", 360)));
      const laneX = Math.max(40, anchorLeft + (anchorRight - anchorLeft - maxLaneWidth) / 2);
      const laneStartY = anchorBottom + 140;
      const laneDefinitions = [
        { id: "characters", label: "角色", category: "character" as const, assets: academyCharacters },
        { id: "scenes", label: "场景", category: "scene" as const, assets: academyScenes },
        { id: "props", label: "道具", category: "prop" as const, assets: academyProps }
      ];
      const generatedNodes: StudioNode[] = [];
      laneDefinitions.forEach((lane, laneIndex) => {
        const laneId = `asset-lane-${lane.id}`;
        const laneWidth = 30 + lane.assets.length * 309;
        generatedNodes.push({
          id: laneId,
          type: "studio",
          className: "flow-node-enter",
          position: { x: laneX, y: laneStartY + laneIndex * (laneHeight + laneGap) },
          data: { label: lane.label, subtitle: `${lane.assets.length} 个${lane.label} · 独立生图节点`, kind: "asset-lane", state: "ready", assetCategory: lane.category, width: laneWidth, height: laneHeight, onRunAssetGroup: runAssetGroup },
          style: { width: laneWidth, height: laneHeight, animationDelay: `${laneIndex * 90}ms` },
          zIndex: 0
        });
        lane.assets.forEach((asset, index) => {
          generatedNodes.push({
            id: `asset-${lane.id}-${index + 1}`,
            type: "studio",
            className: "flow-node-enter",
            position: { x: 24 + index * 309, y: 40 },
            parentId: laneId,
            data: {
              label: asset.label,
              subtitle: `${lane.label.slice(0, 2)} · 待生成`,
              kind: "image",
              state: "empty",
              assetCategory: lane.category,
              assetDescription: asset.description,
              mediaSrc: asset.mediaSrc,
              mediaFit: lane.category === "scene" ? "cover" : "contain",
              onRunNode: runNode,
              onCloseControls: () => setSelectedId(null)
            },
            style: { animationDelay: `${120 + laneIndex * 90 + index * 55}ms` },
            zIndex: 2
          });
        });
      });
      return [...updated, ...generatedNodes];
    });
    setEdges((current) => {
      if (current.some((edge) => edge.id === "plan-asset-lane-characters")) return current;
      return [
        ...current,
        ...["characters", "scenes", "props"].map((category) => ({
          id: `plan-asset-lane-${category}`,
          source: id,
          target: `asset-lane-${category}`,
          type: "default",
          style: { stroke: "#FFFFFF24", strokeWidth: 1.1 }
        }))
      ];
    });
    window.setTimeout(() => reactFlow.fitView({
      nodes: [id, "shot-plan", "asset-lane-characters", "asset-lane-scenes", "asset-lane-props"].map((nodeId) => ({ id: nodeId })),
      duration: 620,
      padding: .16,
      minZoom: .24,
      maxZoom: .58
    }), 100);
    }, 820);
  }, [reactFlow, runAssetGroup, runNode, setEdges, setNodes]);

  const generateStoryboardGroup = useCallback((mode: "image" | "video") => {
    const laneId = `storyboard-${mode}-lane`;
    const referencesForShot = (shotId: string) => {
      return (academyShots.find((shot) => shot.id === shotId)?.assets ?? []).map((asset) => ({
        assetId: asset.id,
        label: asset.label,
        category: asset.category
      }));
    };
    window.setTimeout(() => {
      setNodes((current) => {
      const withoutLegacyStoryboard = current.filter((node) => node.id !== "storyboard-lane" && !node.id.startsWith("storyboard-shot-"));
      if (withoutLegacyStoryboard.some((node) => node.id === laneId)) return withoutLegacyStoryboard;
      const positions = ["0% 0%", "50% 0%", "100% 0%", "0% 100%", "50% 100%", "100% 100%"] as const;
      const laneWidth = 338;
      const laneHeight = 1802;
      const storyboardNodeStride = 252;
      const layoutRoots = withoutLegacyStoryboard.filter((node) => !node.parentId && (
        node.id === "shot-plan" || node.data.kind === "asset-lane" || node.data.kind === "storyboard-lane"
      ));
      const layoutRight = Math.max(...layoutRoots.map((node) => node.position.x + nodeDimension(node, "width", 340)));
      const assetLaneTop = withoutLegacyStoryboard
        .filter((node) => node.data.kind === "asset-lane")
        .reduce((top, node) => Math.min(top, node.position.y), Number.POSITIVE_INFINITY);
      const shotPlanY = withoutLegacyStoryboard.find((node) => node.id === "shot-plan")?.position.y ?? 380;
      const lane: StudioNode = {
        id: laneId,
        type: "studio",
        className: "flow-node-enter",
        position: {
          x: layoutRight + 100,
          y: Number.isFinite(assetLaneTop) ? assetLaneTop : shotPlanY
        },
        data: {
          label: mode === "image" ? "批量分镜图" : "批量分镜视频",
          subtitle: `${academyShots.length} 个分镜段 · 自动引用镜头与对应资产`,
          kind: "storyboard-lane",
          state: "ready",
          width: laneWidth,
          height: laneHeight,
          onRunStoryboardGroup: runStoryboardGroup
        },
        style: { width: laneWidth, height: laneHeight, animationDelay: "40ms" },
        zIndex: 0
      };
      const children: StudioNode[] = academyShots.map((shot, index) => {
        const references = referencesForShot(shot.id);
        const referenceLabels = (["character", "scene", "prop"] as const).flatMap((category) => {
          const labels = references.filter((reference) => reference.category === category).map((reference) => reference.label);
          return labels.length ? [{ category, label: labels.join(" + ") }] : [];
        });
        return {
          id: `storyboard-${mode}-shot-${shot.id}`,
          type: "studio",
          className: "flow-node-enter",
          position: { x: 24, y: 42 + index * storyboardNodeStride },
          parentId: laneId,
          data: {
            label: `${shot.label} · ${mode === "image" ? "分镜图" : "分镜视频"}`,
            subtitle: `${shot.title} · ${shot.duration}`,
            kind: mode === "image" ? "image" : "video",
            state: "empty",
            storyboardShot: true,
            shotId: shot.label,
            referenceLabels,
            mediaPosition: positions[index % positions.length],
            mediaSrc: academyStoryboardFrames[index],
            videoSrc: mode === "video" ? academyVideoFiles[index] : undefined,
            mediaFit: "cover",
            onRunNode: runNode,
            onCloseControls: () => setSelectedId(null)
          },
          style: { animationDelay: `${100 + index * 105}ms` },
          zIndex: 2
        };
      });
      return [...withoutLegacyStoryboard.map((node) => node.id === "director" ? { ...node, position: { x: 2280, y: 1880 } } : node), lane, ...children];
    });
    setEdges((current) => {
      const retiredGroupEdges = new Set(["plan-storyboard-lane", "characters-storyboard-lane", "scenes-storyboard-lane", "props-storyboard-lane"]);
      const retained = current.filter((edge) => !retiredGroupEdges.has(edge.id) && edge.target !== "storyboard-lane" && !edge.target.startsWith("storyboard-shot-"));
      const shotEdges = academyShots.map((shot) => ({
        id: `shot-plan-${mode}-storyboard-${shot.id}`,
        source: "shot-plan",
        target: `storyboard-${mode}-shot-${shot.id}`,
        type: "default",
        className: "reference-edge reference-edge--shot",
        style: { stroke: "#4DC2EB", strokeWidth: 1.1 }
      }));
      const assetEdges = academyShots.flatMap((shot) => referencesForShot(shot.id).map((reference) => ({
        id: `${reference.assetId}-${mode}-storyboard-${shot.id}`,
        source: reference.assetId,
        target: `storyboard-${mode}-shot-${shot.id}`,
        type: "default",
        className: `reference-edge reference-edge--${reference.category}`,
        style: {
          stroke: reference.category === "character" ? "#8B7CF6" : reference.category === "scene" ? "#56C596" : "#F2B35B",
          strokeWidth: 1.15
        }
      })));
      const existingIds = new Set(retained.map((edge) => edge.id));
      return [...retained, ...[...shotEdges, ...assetEdges].filter((edge) => !existingIds.has(edge.id))];
    });
    window.setTimeout(() => focusStoryboardLane(laneId, 560), 100);
    }, 760);
  }, [focusStoryboardLane, runNode, runStoryboardGroup, setEdges, setNodes]);

  const approveReview = useCallback((id: string) => {
    setNodes((current) => current.map((node) => {
      if (node.id === id) return { ...node, data: { ...node.data, state: "success", subtitle: "候选 A · 已通过" } };
      if (node.id === "timeline") return { ...node, data: { ...node.data, subtitle: "4 / 8 镜头已通过" } };
      return node;
    }));
    setSelectedId(null);
  }, [setNodes]);

  const addToReview = useCallback((sourceId: string) => {
    const reviewId = `review-${sourceId}`;
    setNodes((current) => {
      if (current.some((node) => node.id === reviewId)) return current;
      const source = current.find((node) => node.id === sourceId);
      if (!source || !["image", "video"].includes(source.data.kind)) return current;

      const parent = source.parentId ? current.find((node) => node.id === source.parentId) : undefined;
      const sourceY = source.position.y + (parent?.position.y ?? 0);
      const sourceWidth = source.data.width ?? 290;
      const parentWidth = parent?.data.width ?? (typeof parent?.style?.width === "number" ? parent.style.width : 0);
      const storyboardRight = current
        .filter((node) => node.data.kind === "storyboard-lane")
        .reduce((right, node) => Math.max(right, node.position.x + (node.data.width ?? (typeof node.style?.width === "number" ? node.style.width : 0))), 0);
      const baseX = source.data.storyboardShot
        ? storyboardRight + 80
        : parent
          ? parent.position.x + parentWidth + 80
          : source.position.x + sourceWidth + 90;
      const reviewsInRow = current.filter((node) => node.data.kind === "review" && Math.abs(node.position.y - sourceY) < 36).length;
      const sourceMedia = source.data.mediaSequence?.length
        ? source.data.mediaSequence.slice(0, 4)
        : [source.data.mediaSrc ?? academyStoryboardFrames[0]];

      const reviewNode: StudioNode = {
        id: reviewId,
        type: "studio",
        className: "flow-node-enter",
        position: { x: baseX + reviewsInRow * 400, y: sourceY },
        data: {
          label: "候选质检",
          subtitle: `${source.data.label} · 1 / 4 候选`,
          kind: "review",
          state: "review",
          mediaSequence: sourceMedia,
          videoSequence: source.data.videoSrc ? [source.data.videoSrc] : undefined,
          width: 360,
          onApprove: approveReview,
          onCloseControls: () => setSelectedId(null)
        },
        style: { width: 360, animationDelay: "80ms" },
        zIndex: 2
      };
      return [...current, reviewNode];
    });
    setEdges((current) => current.some((edge) => edge.id === `${sourceId}-${reviewId}`) ? current : [...current, {
      id: `${sourceId}-${reviewId}`,
      source: sourceId,
      target: reviewId,
      type: "default",
      className: "reference-edge reference-edge--review",
      style: { stroke: "#F2B35B", strokeWidth: 1.25 }
    }]);
    setSelectedId(reviewId);
    window.setTimeout(() => focusNode(reviewId, 460), 60);
  }, [approveReview, focusNode, setEdges, setNodes]);

  const createShotPlan = useCallback((id: string) => {
    setNodes((current) => current.map((node) => node.id === id
      ? { ...node, data: { ...node.data, state: "running", progress: 16, subtitle: "正在解析故事结构..." } }
      : node));
    window.setTimeout(() => setNodes((current) => current.map((node) => node.id === id
      ? { ...node, data: { ...node.data, progress: 62, subtitle: "正在生成镜头编排..." } }
      : node)), 520);
    window.setTimeout(() => {
      setNodes((current) => {
      const source = current.find((node) => node.id === id);
      const alignedY = Math.max(80, (source?.position.y ?? 280) - 50);
      const updated = current.map((node) => node.id === id ? {
        ...node,
        position: { ...node.position, y: alignedY },
        data: {
          ...node.data,
          briefParsed: true,
          state: "success" as const,
          subtitle: `已解析 · ${academyShots.length} 个镜头`
        }
      } : node);
      if (updated.some((node) => node.id === "shot-plan")) return updated;
      return [...updated, {
        id: "shot-plan",
        type: "studio",
        className: "flow-node-enter",
        position: { x: (source?.position.x ?? 40) + 430, y: alignedY },
        data: {
          label: "镜头编排",
          subtitle: `${academyShots.length} 个镜头 · 71s`,
          kind: "shot-plan",
          state: "success",
          shotCount: academyShotDetails.length,
          totalDuration: "71s",
          shotDetails: academyShotDetails
        },
        style: { animationDelay: "80ms" },
        zIndex: 2
      }];
    });
    setEdges((current) => current.some((edge) => edge.id === "brief-plan") ? current : [...current, {
      id: "brief-plan",
      source: id,
      target: "shot-plan",
      type: "default",
      style: { stroke: "#FFFFFF2E", strokeWidth: 1.25 }
    }]);
    window.setTimeout(() => reactFlow.fitView({ nodes: [{ id }, { id: "shot-plan" }], duration: 480, padding: .42, maxZoom: .84 }), 100);
    }, 880);
  }, [reactFlow, setEdges, setNodes]);

  useEffect(() => {
    setNodes((current) => current.map((node) => ({ ...node, data: { ...node.data, onCreateShotPlan: createShotPlan, onRouteChange, onRunNode: runNode, onGenerateAssets: generateAssetGroups, onRunAssetGroup: runAssetGroup, onGenerateStoryboards: generateStoryboardGroup, onRunStoryboardGroup: runStoryboardGroup, onAddToReview: addToReview, onApprove: approveReview, onOpenEditor: openEditor, onCloseControls: () => setSelectedId(null) } })));
  }, [addToReview, approveReview, createShotPlan, generateAssetGroups, generateStoryboardGroup, nodes.length, onRouteChange, openEditor, runAssetGroup, runNode, runStoryboardGroup, setNodes]);

  useEffect(() => {
    if (isDemoScenario) return;
    const videoShots = nodes.filter((node) => node.parentId === "storyboard-video-lane");
    const timeline = nodes.find((node) => node.id === "timeline");
    if (!timeline) return;

    const completedVideoCount = videoShots.filter((node) => node.data.state === "success").length;
    const allVideosReady = videoShots.length === academyShots.length && completedVideoCount === academyShots.length;
    const nextState = allVideosReady ? "ready" : "empty";
    const nextSubtitle = `${completedVideoCount} / ${academyShots.length} 分镜视频已就绪`;
    if (timeline.data.state !== nextState || timeline.data.subtitle !== nextSubtitle) {
      setNodes((current) => current.map((node) => node.id === "timeline" ? { ...node, data: { ...node.data, state: nextState, subtitle: nextSubtitle } } : node));
    }

    if (!allVideosReady) return;

    setEdges((current) => {
      const existingIds = new Set(current.map((edge) => edge.id));
      const timelineEdges = videoShots.map((node) => ({
        id: `${node.id}-timeline`,
        source: node.id,
        target: "timeline",
        type: "default",
        className: "reference-edge reference-edge--timeline",
        style: { stroke: "#4DC2EB", strokeWidth: 1.35 }
      })).filter((edge) => !existingIds.has(edge.id));
      return timelineEdges.length ? [...current, ...timelineEdges] : current;
    });
  }, [isDemoScenario, nodes, openEditor, setEdges, setNodes]);

  useEffect(() => {
    setNodes((current) => current.map((node) => ({ ...node, selected: node.id === selectedId })));
    if (selectedId && ["flow-confirm", "flow-assets", "flow-prompt", "container-choice", "node-params", "selected", "review", "export", "editor", "running", "figma-shot", "figma-assets", "figma-prompt", "figma-review", "figma-editor", "figma-running"].includes(scenario)) {
      const timer = window.setTimeout(() => focusNode(selectedId, 450), 280);
      return () => window.clearTimeout(timer);
    }
  }, [focusNode, selectedId, setNodes]);

  useEffect(() => {
    if (scenario === "running" || scenario === "figma-running") {
      setNodes((current) => current.map((node) => ["image", "video", "review"].includes(node.data.kind) ? { ...node, data: { ...node.data, state: "running", progress: node.id.endsWith("1") ? 78 : 42 } } : node));
      setEdges((current) => current.map((edge) => ({ ...edge, animated: true, style: { stroke: "#4DC2EB", strokeWidth: 2 } })));
    }
  }, [setEdges, setNodes]);

  const onConnect = useCallback((connection: Connection) => setEdges((current) => addEdge({ ...connection, type: "default", style: { stroke: "#4DC2EB", strokeWidth: 1.5 } }, current)), [setEdges]);
  const onNodeClick: NodeMouseHandler<StudioNode> = useCallback((_, node) => {
    setSelectedManualGroupId(null);
    if (!["shot-lane", "asset-lane", "storyboard-lane"].includes(node.data.kind)) {
      setSelectedId(node.id);
      window.setTimeout(() => focusNode(node.id), 40);
    }
    setActiveDock(null);
  }, [focusNode]);

  const locateNode = useCallback((id: string) => {
    const catalogItem = canvasElementCatalog.find((item) => item.id === id);
    const regionNodeIds: Partial<Record<string, string>> = {
      "asset-character": "asset-lane-characters",
      "asset-scene": "asset-lane-scenes",
      "asset-prop": "asset-lane-props",
      "storyboard-image": "storyboard-image-lane",
      "storyboard-video": "storyboard-video-lane"
    };
    const regionNodeId = regionNodeIds[id];
    const target = (regionNodeId ? nodes.find((node) => node.id === regionNodeId) : undefined)
      ?? nodes.find((node) => node.id === id)
      ?? (catalogItem?.assetCategory
        ? nodes.find((node) => node.data.assetCategory === catalogItem.assetCategory)
        : undefined)
      ?? nodes.find((node) => node.data.kind === (catalogItem?.kind ?? id));
    if (!target) return;
    const isRegion = target.data.kind === "asset-lane" || target.data.kind === "storyboard-lane";
    setSelectedId(null);
    setActiveDock(null);
    if (target.data.kind === "storyboard-lane") {
      focusStoryboardLane(target.id, 560);
      return;
    }
    reactFlow.fitView({
      nodes: [{ id: target.id }],
      duration: 560,
      padding: isRegion ? .18 : 1.15,
      minZoom: isRegion ? .16 : .3,
      maxZoom: isRegion ? .72 : .95
    });
  }, [focusStoryboardLane, nodes, reactFlow]);

  const addNode = useCallback((kind: NodeKind, label: string, options?: NodeCreationOptions) => {
    const position = options?.position ?? reactFlow.screenToFlowPosition({ x: window.innerWidth * 0.55, y: window.innerHeight * 0.5 });
    if (kind === "brief") setLeftOpen(true);
    if (kind === "timeline") {
      const id = "timeline";
      setNodes((current) => {
        if (current.some((node) => node.id === id)) return current;
        const videoShots = current.filter((node) => node.parentId === "storyboard-video-lane");
        const completedVideoCount = videoShots.filter((node) => node.data.state === "success").length;
        const allVideosReady = videoShots.length === academyShots.length && completedVideoCount === academyShots.length;
        return [...current, {
          id,
          type: "studio",
          className: "flow-node-enter",
          position,
          data: {
            label: "剪辑合成 / 导出",
            kind: "timeline",
            state: allVideosReady ? "ready" : "empty",
            subtitle: `${completedVideoCount} / ${academyShots.length} 分镜视频已就绪`,
            onOpenEditor: openEditor,
            onCloseControls: () => setSelectedId(null)
          },
          zIndex: 2
        }];
      });
      setSelectedId(id);
      setActiveDock(null);
      window.setTimeout(() => focusNode(id), 40);
      return;
    }

    const id = `${options?.assetCategory ? `asset-${options.assetCategory}` : kind}-${Date.now()}`;
    const assetDescriptions: Record<AssetCategory, string> = {
      character: "描述角色的身份、年龄、外形、服装与性格特征...",
      scene: "描述场景的空间、时间、光影、天气与整体氛围...",
      prop: "描述道具的造型、材质、尺寸、状态与关键细节..."
    };
    const blankBriefData = kind === "brief"
      ? {
          scriptText: "",
          briefFileName: "未上传文件",
          briefType: "待设置",
          totalDuration: "待设置",
          briefAspect: "待设置",
          atmosphereCount: 0,
        }
      : {};
    const newNode: StudioNode = {
      id,
      type: "studio",
      className: options?.quietEntry ? undefined : "flow-node-enter",
      position,
      data: {
        label,
        kind,
        state: "empty",
        subtitle: options?.assetCategory
          ? "资产容器 · 待生成"
          : kind === "brief"
            ? "空白输入 · 待填写"
            : "新节点",
        assetCategory: options?.assetCategory,
        assetDescription: options?.assetCategory ? assetDescriptions[options.assetCategory] : undefined,
        ...blankBriefData,
        onRouteChange,
        onRunNode: runNode,
        onGenerateAssets: generateAssetGroups,
        onGenerateStoryboards: generateStoryboardGroup,
        onAddToReview: addToReview,
        onApprove: approveReview,
        onOpenEditor: openEditor,
        onCloseControls: () => setSelectedId(null),
      },
    };
    setNodes((current) => [...current, newNode]);
    setSelectedId(id);
    setActiveDock(null);
    window.setTimeout(() => focusNode(id), 40);
  }, [addToReview, approveReview, focusNode, generateAssetGroups, generateStoryboardGroup, onRouteChange, openEditor, reactFlow, runNode, setNodes]);

  const applyWorkflowTemplate = useCallback((templateId: WorkflowTemplateId) => {
    const template = workflowTemplates[templateId];
    const prefix = `workflow-${templateId}-${Date.now()}`;
    const center = reactFlow.screenToFlowPosition({
      x: window.innerWidth * (leftOpen ? 0.57 : 0.52),
      y: window.innerHeight * 0.48
    });
    const existingNodes = nodesRef.current;
    const base = findWorkflowTemplateBase(template, existingNodes, center);
    const idByKey = new Map<string, string>();

    const newNodes: StudioNode[] = template.nodes.map((item, index) => {
      const nodeId = `${prefix}-${item.key}`;
      idByKey.set(item.key, nodeId);
      const appliesTemplateWidth = item.kind !== "brief";
      const blankBriefData = item.kind === "brief"
        ? {
            scriptText: item.scriptText ?? "",
            briefFileName: item.briefFileName ?? "未上传文件",
            briefType: item.briefType ?? "待设置",
            totalDuration: item.totalDuration ?? "待设置",
            briefAspect: item.briefAspect ?? "待设置",
            atmosphereCount: item.atmosphereCount ?? 0
          }
        : {};

      return {
        id: nodeId,
        type: "studio",
        className: "flow-node-enter",
        position: { x: base.x + item.x, y: base.y + item.y },
        data: {
          label: item.label,
          subtitle: item.subtitle,
          kind: item.kind,
          state: item.state ?? "ready",
          width: appliesTemplateWidth ? item.width : undefined,
          height: undefined,
          workflowId: templateId,
          workflowBody: item.workflowBody,
          workflowActionLabel: item.workflowActionLabel,
          scriptText: item.scriptText,
          briefFileName: item.briefFileName,
          briefType: item.briefType,
          briefAspect: item.briefAspect,
          totalDuration: item.totalDuration,
          atmosphereCount: item.atmosphereCount,
          assetCategory: item.assetCategory,
          assetDescription: item.assetDescription,
          ...blankBriefData,
          onRouteChange,
          onRunNode: runNode,
          onGenerateAssets: generateAssetGroups,
          onRunAssetGroup: runAssetGroup,
          onGenerateStoryboards: generateStoryboardGroup,
          onRunStoryboardGroup: runStoryboardGroup,
          onAddToReview: addToReview,
          onApprove: approveReview,
          onOpenEditor: openEditor,
          onCloseControls: () => setSelectedId(null)
        },
        style: { ...(appliesTemplateWidth ? { width: item.width } : {}), animationDelay: `${index * 65}ms` },
        zIndex: 2
      };
    });

    const newEdges = template.edges.flatMap(([source, target]) => {
      const sourceId = idByKey.get(source);
      const targetId = idByKey.get(target);
      if (!sourceId || !targetId) return [];
      return [{
        id: `${prefix}-${source}-${target}`,
        source: sourceId,
        target: targetId,
        type: "default",
        style: { stroke: "rgba(255,255,255,.22)", strokeWidth: 1.15 }
      }];
    });

    setNodes((current) => {
      const next = [...current, ...newNodes];
      nodesRef.current = next;
      return next;
    });
    setEdges((current) => {
      const next = [...current, ...newEdges];
      edgesRef.current = next;
      return next;
    });
    setLeftOpen(true);
    setActiveDock(null);
    setContextMenu(null);
    setSelectedId(newNodes[0]?.id ?? null);
    window.setTimeout(() => {
      reactFlow.fitView({
        nodes: newNodes.map((node) => ({ id: node.id })),
        padding: .24,
        minZoom: .2,
        maxZoom: .72,
        duration: 620
      });
    }, 80);
  }, [
    addToReview,
    approveReview,
    generateAssetGroups,
    generateStoryboardGroup,
    leftOpen,
    onRouteChange,
    openEditor,
    reactFlow,
    runAssetGroup,
    runNode,
    runStoryboardGroup,
    setEdges,
    setNodes
  ]);

  const enterCanvasWithBrief = useCallback(() => {
    if (nodes.length > 0) return;
    addNode("brief", "创作输入", { quietEntry: true });
  }, [addNode, nodes.length]);

  const addNodeFromContextMenu = useCallback((kind: NodeKind, label: string, assetCategory?: AssetCategory) => {
    if (!contextMenu) return;
    addNode(kind, label, { position: contextMenu.flowPosition, assetCategory });
    setContextMenu(null);
  }, [addNode, contextMenu]);

  const onStudioNodesChange = useCallback((changes: NodeChange<StudioNode>[]) => {
    const currentNodes = nodesRef.current;
    const nodeById = new Map(currentNodes.map((node) => [node.id, node]));
    const groupByNodeId = new Map<string, ManualSelectionGroup>();
    manualSelectionGroups.forEach((group) => {
      group.nodeIds.forEach((nodeId) => groupByNodeId.set(nodeId, group));
    });
    const groupMoves = new Map<string, { group: ManualSelectionGroup; delta: { x: number; y: number }; dragging?: boolean }>();

    changes.forEach((change) => {
      if (change.type !== "position" || !change.position) return;
      const group = groupByNodeId.get(change.id);
      const source = nodeById.get(change.id);
      if (!group || !source || groupMoves.has(group.id)) return;
      groupMoves.set(group.id, {
        group,
        delta: {
          x: change.position.x - source.position.x,
          y: change.position.y - source.position.y
        },
        dragging: change.dragging
      });
    });

    if (!groupMoves.size) {
      onNodesChange(changes);
      return;
    }

    const movedGroupNodeIds = new Set(Array.from(groupMoves.values()).flatMap(({ group }) => group.nodeIds));
    const retainedChanges = changes.filter((change) => change.type !== "position" || !movedGroupNodeIds.has(change.id));
    const expandedChanges = Array.from(groupMoves.values()).flatMap(({ group, delta, dragging }) => {
      const movedIds = new Set(group.nodeIds);
      return group.nodeIds.flatMap((nodeId) => {
        const node = nodeById.get(nodeId);
        if (!node || nodeHasMovedAncestor(node, movedIds, currentNodes)) return [];
        return [{
          id: node.id,
          type: "position" as const,
          position: {
            x: node.position.x + delta.x,
            y: node.position.y + delta.y
          },
          dragging
        }];
      });
    });

    onNodesChange([...retainedChanges, ...expandedChanges]);
  }, [manualSelectionGroups, onNodesChange]);

  const moveManualGroupBy = useCallback((nodeIds: string[], delta: { x: number; y: number }) => {
    if (!delta.x && !delta.y) return;
    const movedIds = new Set(nodeIds);
    setNodes((current) => current.map((node) => {
      if (!movedIds.has(node.id) || nodeHasMovedAncestor(node, movedIds, current)) return node;
      return {
        ...node,
        position: {
          x: node.position.x + delta.x,
          y: node.position.y + delta.y
        }
      };
    }));
  }, [setNodes]);

  const beginManualGroupDrag = useCallback((groupId: string, nodeIds: string[], clientX: number, clientY: number, pointerId: number | null) => {
    manualGroupDragRef.current = {
      pointerId,
      lastClientX: clientX,
      lastClientY: clientY,
      nodeIds
    };
    preserveManualGroupClickRef.current = true;
    window.setTimeout(() => {
      preserveManualGroupClickRef.current = false;
    }, 140);
    setSelectedManualGroupId(groupId);
    setActiveDock(null);
    setContextMenu(null);
    setSelectedId(null);
  }, []);

  const startManualGroupDrag = useCallback((groupId: string, nodeIds: string[], event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    beginManualGroupDrag(groupId, nodeIds, event.clientX, event.clientY, event.pointerId);
  }, [beginManualGroupDrag]);

  const endManualGroupDrag = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = manualGroupDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    manualGroupDragRef.current = null;
  }, []);

  useEffect(() => {
    const moveGroup = (event: PointerEvent) => {
      const drag = manualGroupDragRef.current;
      if (!drag || (drag.pointerId !== null && drag.pointerId !== event.pointerId)) return;
      event.preventDefault();
      const zoom = viewport.zoom || 1;
      const delta = {
        x: (event.clientX - drag.lastClientX) / zoom,
        y: (event.clientY - drag.lastClientY) / zoom
      };
      drag.lastClientX = event.clientX;
      drag.lastClientY = event.clientY;
      moveManualGroupBy(drag.nodeIds, delta);
    };
    const stopGroupMove = (event: PointerEvent) => {
      const drag = manualGroupDragRef.current;
      if (!drag || (drag.pointerId !== null && drag.pointerId !== event.pointerId)) return;
      manualGroupDragRef.current = null;
    };

    window.addEventListener("pointermove", moveGroup);
    window.addEventListener("pointerup", stopGroupMove);
    window.addEventListener("pointercancel", stopGroupMove);
    return () => {
      window.removeEventListener("pointermove", moveGroup);
      window.removeEventListener("pointerup", stopGroupMove);
      window.removeEventListener("pointercancel", stopGroupMove);
    };
  }, [moveManualGroupBy, viewport.zoom]);

  const selectedNodes = useMemo(() => nodes.filter((node) => node.selected), [nodes]);
  const multiSelectedNodes = selectedNodes.length > 1 ? selectedNodes : [];
  const hasGroupedSelection = useMemo(() => multiSelectedNodes.some((node) =>
    manualGroupedNodeIds.has(node.id)
    || Boolean(node.parentId)
    || ["asset-lane", "storyboard-lane", "shot-lane"].includes(node.data.kind)
  ), [manualGroupedNodeIds, multiSelectedNodes]);
  const multiSelectionToolbarPosition = useMemo(() => {
    if (multiSelectedNodes.length < 2) return null;

    const boxes = multiSelectedNodes.map((node) => {
      const position = nodeAbsolutePosition(node, nodes);
      const width = nodeDimension(node, "width", 280);
      const height = nodeDimension(node, "height", 180);
      return {
        left: position.x,
        top: position.y,
        right: position.x + width,
        bottom: position.y + height
      };
    });
    const left = Math.min(...boxes.map((box) => box.left));
    const top = Math.min(...boxes.map((box) => box.top));
    const right = Math.max(...boxes.map((box) => box.right));
    const centerX = (left + right) / 2 * viewport.zoom + viewport.x;
    const topY = top * viewport.zoom + viewport.y;
    const canvasWidth = window.innerWidth - (leftOpen ? (window.innerWidth <= 1380 ? 312 : 332) : 52);
    const halfToolbarWidth = 210;

    return {
      x: Math.max(halfToolbarWidth + 12, Math.min(centerX, canvasWidth - halfToolbarWidth - 12)),
      y: Math.max(46, topY - 8)
    };
  }, [leftOpen, multiSelectedNodes, nodes, viewport.x, viewport.y, viewport.zoom]);
  const manualGroupFrames = useMemo(() => manualSelectionGroups.flatMap((group) => {
    const groupNodes = group.nodeIds
      .map((id) => nodes.find((node) => node.id === id))
      .filter(Boolean) as StudioNode[];

    if (groupNodes.length < 2) return [];

    const boxes = groupNodes.map((node) => {
      const position = nodeAbsolutePosition(node, nodes);
      const width = nodeDimension(node, "width", 280);
      const height = nodeDimension(node, "height", 180);
      return {
        left: position.x,
        top: position.y,
        right: position.x + width,
        bottom: position.y + height
      };
    });
    const padding = 18;
    const left = Math.min(...boxes.map((box) => box.left)) - padding;
    const top = Math.min(...boxes.map((box) => box.top)) - padding;
    const right = Math.max(...boxes.map((box) => box.right)) + padding;
    const bottom = Math.max(...boxes.map((box) => box.bottom)) + padding;

    return [{
      id: group.id,
      nodeIds: groupNodes.map((node) => node.id),
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
      count: groupNodes.length
    }];
  }), [manualSelectionGroups, nodes]);

  useEffect(() => {
    const flowRoot = document.querySelector(".react-flow");
    if (!flowRoot) return;

    const startBlankGroupDrag = (event: Event) => {
      const pointerEvent = event as PointerEvent;
      if (pointerEvent.button !== 0 || pointerEvent.defaultPrevented) return;
      const target = pointerEvent.target as Element | null;
      if (target?.closest(".react-flow__node, .react-flow__edge, .multi-select-floating, .dock-wrap, .canvas-context-menu")) return;

      const flowPoint = reactFlow.screenToFlowPosition({ x: pointerEvent.clientX, y: pointerEvent.clientY });
      const frame = [...manualGroupFrames].reverse().find((frame) =>
        flowPoint.x >= frame.x
        && flowPoint.x <= frame.x + frame.width
        && flowPoint.y >= frame.y
        && flowPoint.y <= frame.y + frame.height
      );
      if (!frame) return;

      pointerEvent.preventDefault();
      pointerEvent.stopPropagation();
      beginManualGroupDrag(frame.id, frame.nodeIds, pointerEvent.clientX, pointerEvent.clientY, pointerEvent.pointerId);
    };

    flowRoot.addEventListener("pointerdown", startBlankGroupDrag, true);
    return () => flowRoot.removeEventListener("pointerdown", startBlankGroupDrag, true);
  }, [beginManualGroupDrag, manualGroupFrames, reactFlow]);

  const renderedNodes = useMemo(() => {
    const suppressSingleToolbar = selectedNodes.length > 1;
    return nodes.map((node) => {
      const isManualGrouped = manualGroupedNodeIds.has(node.id);
      if (!suppressSingleToolbar && !isManualGrouped) return node;
      return {
        ...node,
        className: [node.className, isManualGrouped ? "is-manual-grouped" : ""].filter(Boolean).join(" ") || undefined,
        data: suppressSingleToolbar ? { ...node.data, suppressSingleToolbar: true } : node.data
      };
    });
  }, [manualGroupedNodeIds, nodes, selectedNodes.length]);
  const saveSelectionToAssets = useCallback(() => {
    if (multiSelectedNodes.length < 2) return;
    setSelectionNotice(`已保存 ${multiSelectedNodes.length} 个节点到资产`);
  }, [multiSelectedNodes.length]);
  const toggleSelectionGroup = useCallback(() => {
    if (multiSelectedNodes.length < 2) return;
    const selectedIds = multiSelectedNodes.map((node) => node.id);
    const selectedIdSet = new Set(selectedIds);
    const nextGroupId = `manual-group-${Date.now()}`;
    setManualGroupedNodeIds((current) => {
      const next = new Set(current);
      selectedIds.forEach((id) => {
        if (hasGroupedSelection) next.delete(id);
        else next.add(id);
      });
      return next;
    });
    setManualSelectionGroups((current) => {
      if (hasGroupedSelection) {
        setSelectedManualGroupId(null);
        return current
          .map((group) => ({
            ...group,
            nodeIds: group.nodeIds.filter((id) => !selectedIdSet.has(id))
          }))
          .filter((group) => group.nodeIds.length > 1);
      }

      const preservedGroups = current
        .map((group) => ({
          ...group,
          nodeIds: group.nodeIds.filter((id) => !selectedIdSet.has(id))
        }))
        .filter((group) => group.nodeIds.length > 1);
      return [
        ...preservedGroups,
        { id: nextGroupId, nodeIds: selectedIds }
      ];
    });
    if (!hasGroupedSelection) setSelectedManualGroupId(nextGroupId);
    setSelectionNotice(hasGroupedSelection ? "已解组所选节点" : "已将所选节点打组");
  }, [hasGroupedSelection, multiSelectedNodes]);
  const downloadSelection = useCallback(() => {
    if (multiSelectedNodes.length < 2) return;
    const payload = JSON.stringify({
      project: "if studio",
      exportedAt: new Date().toISOString(),
      nodes: multiSelectedNodes.map((node) => ({
        id: node.id,
        label: node.data.label,
        kind: node.data.kind,
        state: node.data.state,
        subtitle: node.data.subtitle ?? null
      }))
    }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `if-studio-selection-${multiSelectedNodes.length}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setSelectionNotice(`已打包下载 ${multiSelectedNodes.length} 个节点`);
  }, [multiSelectedNodes]);
  const addSelectionToAgent = useCallback(() => {
    if (multiSelectedNodes.length < 2) return;
    setAgentOpen(true);
    setSelectionNotice("已添加到 Agent 助手上下文");
  }, [multiSelectedNodes.length]);

  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedId), [nodes, selectedId]);
  const availableAssetIds = useMemo(() => new Set(nodes
    .filter((node) => Boolean(node.data.assetCategory))
    .map((node) => node.id)), [nodes]);
  const generatedAssetIds = useMemo(() => new Set(nodes
    .filter((node) => Boolean(node.data.assetCategory) && node.data.state === "success")
    .map((node) => node.id)), [nodes]);
  const availableNodeCatalogIds = useMemo(() => new Set(canvasElementCatalog
    .filter((item) => {
      if (item.assetCategory) return nodes.some((node) => node.data.assetCategory === item.assetCategory);
      if (item.id === "storyboard-image") return nodes.some((node) => node.id === "storyboard-image-lane");
      if (item.id === "storyboard-video") return nodes.some((node) => node.id === "storyboard-video-lane");
      if (item.id === "storyboard") return nodes.some((node) => node.data.kind === "storyboard");
      if (item.id === "image") {
        return nodes.some((node) => node.data.kind === "image" && !node.data.assetCategory && !node.data.storyboardShot);
      }
      if (item.id === "video") {
        return nodes.some((node) => node.data.kind === "video" && !node.data.storyboardShot);
      }
      return nodes.some((node) => node.data.kind === item.kind);
    })
    .map((item) => item.id)), [nodes]);
  const activeJourneyStage = useMemo(() => scenarioJourneyStage[scenario] ?? journeyStageFromNodes(nodes), [nodes]);
  const locateAgentTarget = useCallback(() => {
    const target = selectedNode
      ?? findJourneyStageNode(activeJourneyStage, nodes)
      ?? nodes.find((node) => node.data.kind === "shot-plan")
      ?? nodes.find((node) => node.data.kind === "brief")
      ?? nodes[0];

    if (!target) {
      setSelectionNotice("当前画布暂无可定位节点");
      return;
    }

    setActiveDock(null);
    setSelectedId(target.id);
    focusNode(target.id, 520);
  }, [activeJourneyStage, focusNode, nodes, selectedNode]);
  const openAgentFlowGuide = useCallback(() => {
    setAgentOpen(true);
    setAgentFlowGuideOpen(true);
    setActiveDock(null);
  }, []);
  const selectAgentJourneyStage = useCallback((stage: AgentJourneyStage) => {
    setAgentFlowGuideOpen(true);
    const target = findJourneyStageNode(stage, nodesRef.current);
    if (!target) {
      setSelectionNotice("该阶段暂无节点");
      return;
    }

    setSelectedId(target.id);
    focusNode(target.id, 520);
  }, [focusNode]);

  const agentContext = useMemo<AgentCanvasContext>(() => {
    const hasBrief = nodes.some((node) => node.data.kind === "brief");
    const hasShotPlan = nodes.some((node) => node.data.kind === "shot-plan");
    const hasAssetLane = nodes.some((node) => node.data.kind === "asset-lane");
    const hasStoryboardImage = nodes.some((node) => node.id === "storyboard-image-lane");
    const storyboardVideoLane = nodes.find((node) => node.id === "storyboard-video-lane");
    const reviewNode = nodes.find((node) => node.data.kind === "review");
    const hasCompletedStoryboardVideo = nodes.some((node) => node.data.kind === "video" && node.data.storyboardShot && node.data.state === "success");
    const hasTimeline = nodes.some((node) => node.data.kind === "timeline");
    const selectedCount = selectedNodes.length || (selectedNode ? 1 : 0);
    const selectionLabel = selectedCount > 1 ? `${selectedCount} 个节点` : selectedNode?.data.label ?? "未选择";
    const assetCount = nodes.filter((node) => Boolean(node.data.assetCategory) && node.data.state === "success").length;
    const storyboardCount = nodes.filter((node) => node.data.storyboardShot).length;
    let stage = "空白画布";
    let nextStep = "添加创作输入";

    if (hasTimeline) {
      stage = "剪辑收尾";
      nextStep = "检查导出设置";
    } else if (reviewNode?.data.state === "success") {
      stage = "候选已通过";
      nextStep = "添加剪辑合成";
    } else if (reviewNode) {
      stage = "候选质检";
      nextStep = "确认候选结果";
    } else if (storyboardVideoLane) {
      stage = "分镜视频";
      nextStep = hasCompletedStoryboardVideo ? "添加候选质检" : "执行分镜视频";
    } else if (hasStoryboardImage) {
      stage = "分镜图";
      nextStep = "批量生成视频";
    } else if (hasAssetLane) {
      stage = "资产准备";
      nextStep = "批量生成分镜图";
    } else if (hasShotPlan) {
      stage = "镜头编排";
      nextStep = "生成资产容器";
    } else if (hasBrief) {
      stage = "创作输入";
      nextStep = "解析镜头";
    }

    return {
      stage,
      selectionLabel,
      selectedCount,
      nodeCount: nodes.length,
      assetCount,
      storyboardCount,
      nextStep
    };
  }, [nodes, selectedNode, selectedNodes.length]);

  const agentSuggestions = useMemo<AgentSuggestion[]>(() => {
    const suggestions: AgentSuggestion[] = [];
    const briefNode = nodes.find((node) => node.data.kind === "brief");
    const shotPlanNode = nodes.find((node) => node.data.kind === "shot-plan");
    const hasAssetLane = nodes.some((node) => node.data.kind === "asset-lane");
    const hasStoryboardImage = nodes.some((node) => node.id === "storyboard-image-lane");
    const storyboardVideoLane = nodes.find((node) => node.id === "storyboard-video-lane");
    const reviewNode = nodes.find((node) => node.data.kind === "review");
    const timelineNode = nodes.find((node) => node.data.kind === "timeline");
    const completedStoryboardVideo = nodes.find((node) => node.data.kind === "video" && node.data.storyboardShot && node.data.state === "success");
    const selectedCompletedStoryboardVideo = selectedNode && selectedNode.data.kind === "video" && selectedNode.data.storyboardShot && selectedNode.data.state === "success"
      ? selectedNode
      : undefined;
    const genericReviewSource = selectedNode && (selectedNode.data.kind === "image" || selectedNode.data.kind === "video") && selectedNode.data.state === "success"
      ? selectedNode
      : nodes.find((node) => (node.data.kind === "image" || node.data.kind === "video") && node.data.state === "success" && !node.data.assetCategory);
    const reviewSource = storyboardVideoLane
      ? selectedCompletedStoryboardVideo ?? completedStoryboardVideo
      : genericReviewSource;

    if (timelineNode) {
      suggestions.push({
        id: "open-timeline",
        title: "检查剪辑与导出",
        body: "打开剪辑工作台，检查片段顺序、节奏和导出设置。",
        label: "打开剪辑",
        tone: "primary",
        onClick: () => {
          focusNode(timelineNode.id, 520);
          openEditor();
        }
      });
    } else if (!briefNode) {
      suggestions.push({
        id: "start-brief",
        title: "从空白画布开始",
        body: "添加创作输入节点，建立脚本与镜头骨架。",
        label: "添加输入",
        tone: "primary",
        onClick: enterCanvasWithBrief
      });
    } else if (!shotPlanNode) {
      suggestions.push({
        id: "parse-shot-plan",
        title: "解析镜头结构",
        body: "把创作输入拆成可编辑镜头卡与资产需求。",
        label: "创建镜头",
        tone: "primary",
        onClick: () => createShotPlan(briefNode.id)
      });
    } else if (!hasAssetLane) {
      suggestions.push({
        id: "prepare-assets",
        title: "铺设资产容器",
        body: "按角色、场景、道具生成独立资产节点并自动连线。",
        label: "生成资产",
        tone: "primary",
        onClick: () => generateAssetGroups(shotPlanNode.id)
      });
    } else if (!hasStoryboardImage) {
      suggestions.push({
        id: "make-storyboard-image",
        title: "生成分镜图组",
        body: "引用镜头与资产，创建竖向分镜图容器。",
        label: "生成分镜图",
        tone: "primary",
        onClick: () => generateStoryboardGroup("image")
      });
    } else if (!storyboardVideoLane) {
      suggestions.push({
        id: "make-storyboard-video",
        title: "生成分镜视频组",
        body: "以分镜图和资产为上下文，继续生成视频节点。",
        label: "生成视频",
        tone: "primary",
        onClick: () => generateStoryboardGroup("video")
      });
    } else if (reviewNode?.data.state === "success") {
      suggestions.push({
        id: "create-timeline",
        title: "进入剪辑合成",
        body: "候选结果已通过，下一步创建剪辑合成节点并接入成片工作台。",
        label: "剪辑合成",
        tone: "primary",
        onClick: () => addNode("timeline", "剪辑合成 / 导出", {
          position: {
            x: reviewNode.position.x + nodeDimension(reviewNode, "width", 360) + 90,
            y: reviewNode.position.y
          }
        })
      });
    } else if (reviewNode) {
      suggestions.push({
        id: "confirm-review",
        title: "确认候选结果",
        body: "候选质检节点已创建，先检查四宫格候选并采用最终结果。",
        label: "确认候选",
        tone: "primary",
        onClick: () => focusNode(reviewNode.id, 520)
      });
    } else if (reviewSource) {
      suggestions.push({
        id: "candidate-review",
        title: "送入候选质检",
        body: "分镜视频已完成，把成熟结果连接到四宫格候选质检节点。",
        label: "候选质检",
        tone: "primary",
        onClick: () => addToReview(reviewSource.id)
      });
    } else if (storyboardVideoLane) {
      suggestions.push({
        id: "run-storyboard-video",
        title: "执行分镜视频",
        body: "先批量执行分镜视频，完成后我会继续引导候选质检。",
        label: "执行视频",
        tone: "primary",
        onClick: () => runStoryboardGroup(storyboardVideoLane.id)
      });
    } else {
      suggestions.push({
        id: "open-add",
        title: "补一个专业节点",
        body: "打开节点菜单，可添加剪辑合成、音频或 3D 导演台。",
        label: "节点库",
        tone: "primary",
        onClick: () => setActiveDock("add")
      });
    }

    if (shotPlanNode) {
      suggestions.push({
        id: "locate-main",
        title: "回到主流程节点",
        body: "快速定位镜头编排，继续检查镜头与资产逻辑。",
        label: "定位",
        onClick: () => focusNode(shotPlanNode.id, 520)
      });
    }

    return suggestions.slice(0, 2);
  }, [addNode, addToReview, createShotPlan, enterCanvasWithBrief, focusNode, generateAssetGroups, generateStoryboardGroup, nodes, openEditor, runStoryboardGroup, selectedNode]);

  const agentQuickActions = useMemo<AgentSuggestion[]>(() => [
    {
      id: "quick-locate",
      title: "定位当前主线",
      body: "回到当前选择或画布所处阶段的主流程节点。",
      label: "定位",
      onClick: locateAgentTarget
    },
    {
      id: "quick-journey",
      title: "打开流程引导",
      body: "在对话中梳理完整创作流程，并按阶段定位画布节点。",
      label: "流程引导",
      onClick: openAgentFlowGuide
    },
    {
      id: "quick-node-library",
      title: "补充节点能力",
      body: "打开节点库，添加镜头、资产、音频或剪辑节点。",
      label: "节点库",
      onClick: () => setActiveDock("add")
    },
    {
      id: "quick-workflow",
      title: "调用工作流",
      body: "打开官方模板、我的工作流和收藏入口。",
      label: "工作流",
      onClick: () => setActiveDock("workflow")
    },
    {
      id: "quick-roles",
      title: "查看角色库",
      body: "打开已认证角色资产，检查当前可复用角色。",
      label: "角色库",
      onClick: () => setActiveDock("roles")
    },
    {
      id: "quick-history",
      title: "查看历史记录",
      body: "打开自动保存记录，回看最近的画布操作。",
      label: "历史",
      onClick: () => setActiveDock("history")
    },
    {
      id: "quick-overview",
      title: "回到画布全览",
      body: "缩放到当前画布的整体视图。",
      label: "全览",
      onClick: () => reactFlow.fitView({ duration: 520, padding: .12, minZoom: .22, maxZoom: .62 })
    }
  ], [locateAgentTarget, openAgentFlowGuide, reactFlow]);

  return <main className={`app-shell ${leftOpen ? "left-open" : ""}`} data-theme="dark">
    <TopBar />
    <LeftNavigation
      open={leftOpen}
      query={query}
      onOpenChange={setLeftOpen}
      onQueryChange={setQuery}
      onLocate={locateNode}
      availableAssetIds={availableAssetIds}
      availableNodeCatalogIds={availableNodeCatalogIds}
      generatedAssetIds={generatedAssetIds}
    />
    <section className="canvas-shell">
      <ReactFlow
        nodes={renderedNodes}
        edges={edges}
        nodeTypes={studioNodeTypes}
        onNodesChange={onStudioNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={() => {
          setSelectedId(null);
          if (!preserveManualGroupClickRef.current) setSelectedManualGroupId(null);
          setActiveDock(null);
          setContextMenu(null);
        }}
        onPaneContextMenu={(event) => {
          event.preventDefault();
          const menuWidth = 172;
          const menuHeight = 472;
          setActiveDock(null);
          setContextMenu({
            x: Math.max(12, Math.min(event.clientX, window.innerWidth - menuWidth - 12)),
            y: Math.max(60, Math.min(event.clientY, window.innerHeight - menuHeight - 12)),
            flowPosition: reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY })
          });
        }}
        defaultViewport={{ x: 18, y: 88, zoom: 0.55 }}
        minZoom={0.22}
        maxZoom={1.45}
        snapToGrid
        snapGrid={[8, 8]}
        proOptions={{ hideAttribution: true }}
        selectionOnDrag
        panOnDrag={false}
        panOnScroll
      >
        {manualGroupFrames.map((frame) => (
          <ViewportPortal key={frame.id}>
            <div
              className={`manual-group-frame ${selectedManualGroupId === frame.id ? "is-selected" : ""}`}
              style={{
                width: frame.width,
                height: frame.height,
                transform: `translate(${frame.x}px, ${frame.y}px)`
              }}
            >
              {(["top", "right", "bottom", "left"] as const).map((side) => (
                <button
                  key={side}
                  type="button"
                  tabIndex={-1}
                  aria-label="拖拽移动整组"
                  className={`manual-group-frame__hit manual-group-frame__hit--${side} nodrag nopan`}
                  onPointerDown={(event) => startManualGroupDrag(frame.id, frame.nodeIds, event)}
                  onPointerUp={endManualGroupDrag}
                  onPointerCancel={endManualGroupDrag}
                />
              ))}
              <button
                type="button"
                className="manual-group-frame__handle nodrag nopan"
                title="拖拽移动整组"
                onPointerDown={(event) => startManualGroupDrag(frame.id, frame.nodeIds, event)}
                onPointerUp={endManualGroupDrag}
                onPointerCancel={endManualGroupDrag}
              >
                {frame.count} 个节点 · 已打组
              </button>
            </div>
          </ViewportPortal>
        ))}
        {multiSelectionToolbarPosition && <div
          className="multi-select-floating"
          style={{
            transform: `translate3d(${Math.round(multiSelectionToolbarPosition.x)}px, ${Math.round(multiSelectionToolbarPosition.y)}px, 0) translate(-50%, -100%)`
          }}
        >
          <MultiSelectionToolbar
            count={multiSelectedNodes.length}
            hasGroupedNodes={hasGroupedSelection}
            notice={selectionNotice}
            onSaveAssets={saveSelectionToAssets}
            onToggleGroup={toggleSelectionGroup}
            onDownload={downloadSelection}
            onAddToAgent={addSelectionToAgent}
          />
        </div>}
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#FFFFFF12" />
        <MiniMap className="studio-minimap" pannable zoomable nodeColor={(node) => node.data?.state === "running" ? "#4DC2EB" : node.data?.kind === "shot-lane" ? "#202020" : "#5B5B5B"} maskColor="rgba(8,8,8,.74)" />
        <Controls className="studio-controls" showInteractive={false} />
        {nodes.length === 0 && <EmptyCanvas onAdd={enterCanvasWithBrief} onWorkflow={() => setActiveDock("workflow")} />}
      </ReactFlow>
      <BottomDock active={activeDock} onActiveChange={setActiveDock} onAddNode={addNode} onApplyWorkflow={applyWorkflowTemplate} />
      {contextMenu && <CanvasContextMenu x={contextMenu.x} y={contextMenu.y} onAdd={addNodeFromContextMenu} onClose={() => setContextMenu(null)} />}
    </section>
    {!editorOpen && <AgentAssistant
      open={agentOpen}
      onOpenChange={setAgentOpen}
      context={agentContext}
      suggestions={agentSuggestions}
      quickActions={agentQuickActions}
      flowGuideOpen={agentFlowGuideOpen}
      activeJourneyStage={activeJourneyStage}
      onJourneyStageSelect={selectAgentJourneyStage}
    />}
    <VideoEditorModal open={editorOpen} onClose={() => setEditorOpen(false)} />
  </main>;
}

export default function App() {
  return <ReactFlowProvider><CanvasApp /></ReactFlowProvider>;
}
