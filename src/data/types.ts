import type { Node } from "@xyflow/react";

export type NodeKind =
  | "brief"
  | "shot-plan"
  | "asset-group"
  | "asset-lane"
  | "storyboard-lane"
  | "shot-lane"
  | "prompt"
  | "storyboard"
  | "reference-analysis"
  | "style-board"
  | "product-brief"
  | "brand-guideline"
  | "image-polish"
  | "consistency-check"
  | "image"
  | "video"
  | "audio"
  | "director-3d"
  | "review"
  | "timeline";

export type NodeState =
  | "empty"
  | "needs-config"
  | "ready"
  | "running"
  | "success"
  | "review"
  | "failed"
  | "stale";

export type MediaPosition = "0% 0%" | "50% 0%" | "100% 0%" | "0% 100%" | "50% 100%" | "100% 100%";
export type AssetCategory = "character" | "scene" | "prop";
export type WorkflowId = "design-expert" | "product-ad" | "asset-setting";

export type ShotDetailData = {
  id: string;
  title: string;
  description: string;
  duration: string;
  shotSize: string;
  lighting: string;
  dialogue: string;
  sound: string;
  movement: string;
};

export type NodeCreationOptions = {
  position?: { x: number; y: number };
  assetCategory?: AssetCategory;
  quietEntry?: boolean;
};

export type StudioNodeData = {
  label: string;
  kind: NodeKind;
  state: NodeState;
  subtitle?: string;
  shotId?: string;
  route?: "storyboard-image" | "storyboard-video" | "free";
  mediaPosition?: MediaPosition;
  mediaSrc?: string;
  videoSrc?: string;
  mediaFit?: "cover" | "contain";
  mediaSequence?: string[];
  videoSequence?: string[];
  progress?: number;
  width?: number;
  height?: number;
  briefParsed?: boolean;
  assetStage?: boolean;
  shotCount?: number;
  totalDuration?: string;
  scriptText?: string;
  briefFileName?: string;
  briefType?: string;
  briefAspect?: string;
  atmosphereCount?: number;
  shotDetails?: ShotDetailData[];
  createdStoryboardModes?: Array<"image" | "video">;
  assetCategory?: AssetCategory;
  assetDescription?: string;
  workflowId?: WorkflowId;
  workflowBody?: string;
  workflowActionLabel?: string;
  storyboardShot?: boolean;
  referenceLabels?: Array<{ label: string; category: "character" | "scene" | "prop" }>;
  onCreateShotPlan?: (id: string) => void;
  onRouteChange?: (id: string, route: "storyboard-image" | "storyboard-video" | "free") => void;
  onRunNode?: (id: string) => void;
  onGenerateAssets?: (id: string) => void;
  onRunAssetGroup?: (id: string) => void;
  onGenerateStoryboards?: (mode: "image" | "video") => void;
  onRunStoryboardGroup?: (id: string) => void;
  onAddToReview?: (id: string) => void;
  onApprove?: (id: string) => void;
  onOpenEditor?: () => void;
  onCloseControls?: () => void;
  suppressSingleToolbar?: boolean;
};

export type StudioNode = Node<StudioNodeData, "studio">;
