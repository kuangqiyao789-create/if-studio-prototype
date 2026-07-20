import { Check, ChevronRight } from "lucide-react";

export type JourneyStage = "input" | "shots" | "assets" | "prompt" | "generate" | "export";

const stages: Array<{ id: JourneyStage; label: string }> = [
  { id: "input", label: "创作输入" },
  { id: "shots", label: "镜头确认" },
  { id: "assets", label: "准备资产" },
  { id: "prompt", label: "合成提示词" },
  { id: "generate", label: "生成与质检" },
  { id: "export", label: "剪辑导出" }
];

type Props = {
  active: JourneyStage;
  onSelect: (stage: JourneyStage) => void;
};

export default function JourneyRail({ active, onSelect }: Props) {
  const activeIndex = stages.findIndex((stage) => stage.id === active);
  return (
    <nav className="journey-rail" aria-label="完整创作流程">
      {stages.map((stage, index) => (
        <div className="journey-stage-wrap" key={stage.id}>
          <button
            className={`${index === activeIndex ? "active" : ""} ${index < activeIndex ? "done" : ""}`}
            onClick={() => onSelect(stage.id)}
          >
            <span>{index < activeIndex ? <Check size={10} /> : index + 1}</span>
            {stage.label}
          </button>
          {index < stages.length - 1 && <ChevronRight size={11} />}
        </div>
      ))}
    </nav>
  );
}
