import { ArrowUp, Minimize2, X } from "lucide-react";

export type AgentCanvasContext = {
  stage: string;
  selectionLabel: string;
  selectedCount: number;
  nodeCount: number;
  assetCount: number;
  storyboardCount: number;
  nextStep: string;
};

export type AgentSuggestion = {
  id: string;
  title: string;
  body: string;
  label: string;
  tone?: "primary" | "default";
  onClick: () => void;
};

export type AgentJourneyStage = "input" | "shots" | "assets" | "prompt" | "generate" | "export";

const flowGuideSteps: Array<{ id: AgentJourneyStage; label: string; note: string }> = [
  { id: "input", label: "创作输入", note: "脚本与需求" },
  { id: "shots", label: "镜头确认", note: "拆镜头与时长" },
  { id: "assets", label: "准备资产", note: "角色场景道具" },
  { id: "prompt", label: "合成提示词", note: "引用与约束" },
  { id: "generate", label: "生成质检", note: "图视频候选" },
  { id: "export", label: "剪辑导出", note: "成片收尾" }
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: AgentCanvasContext;
  suggestions: AgentSuggestion[];
  quickActions: AgentSuggestion[];
  flowGuideOpen: boolean;
  activeJourneyStage: AgentJourneyStage;
  onJourneyStageSelect: (stage: AgentJourneyStage) => void;
};

const agentIpSrc = "/media/ifstudio-agent-ip-brand.png";

function AgentAvatar({ small = false }: { small?: boolean }) {
  return <span className={`agent-symbol agent-symbol--ip ${small ? "small" : ""}`} aria-hidden="true">
    <img src={agentIpSrc} alt="" />
  </span>;
}

export default function AgentAssistant({ open, onOpenChange, context, suggestions, quickActions, flowGuideOpen, activeJourneyStage, onJourneyStageSelect }: Props) {
  const primarySuggestion = suggestions[0];
  const secondarySuggestions = suggestions.slice(1);
  const auxiliaryLabels = new Set<string>();
  const auxiliaryActions = [...secondarySuggestions, ...quickActions]
    .filter((action) => action.label !== primarySuggestion?.label)
    .filter((action) => {
      if (auxiliaryLabels.has(action.label)) return false;
      auxiliaryLabels.add(action.label);
      return true;
    })
    .slice(0, 7);

  return <div className={`agent-wrap ${open ? "is-open" : ""}`}>
    {open && <section className="agent-panel agent-panel--chat" aria-label="if 助手">
      <div className="agent-head">
        <div>
          <AgentAvatar />
          <div>
            <strong>if 助手</strong>
            <small>当前画布 · {context.stage}</small>
          </div>
        </div>
        <div>
          <button className="icon-button" aria-label="最小化助手" title="最小化" onClick={() => onOpenChange(false)}><Minimize2 size={15} /></button>
          <button className="icon-button" aria-label="关闭助手" title="关闭" onClick={() => onOpenChange(false)}><X size={15} /></button>
        </div>
      </div>

      <div className="agent-conversation agent-conversation--clean">
        <span className="agent-time">上下文已同步</span>

        <div className="assistant-message agent-message--clean">
          <div className="agent-bubble">
            <p>我在看当前画布。现在是 <strong>{context.stage}</strong>，下一步可以{context.nextStep}。</p>
            <small>{context.nodeCount} 个节点 · {context.storyboardCount} 个分镜容器 · {context.selectionLabel}</small>
          </div>
        </div>

        {primarySuggestion && <div className="assistant-message agent-message--clean agent-message--followup">
          <div className="agent-bubble agent-bubble--plain">
            <p>{primarySuggestion.body}</p>
            <button className="agent-text-action is-primary" type="button" onClick={primarySuggestion.onClick}>
              {primarySuggestion.label}
            </button>
          </div>
        </div>}

        {flowGuideOpen && <div className="assistant-message agent-message--clean agent-message--guide">
          <div className="agent-bubble agent-flow-guide">
            <p>我把当前创作拆成 6 步。现在在 <strong>{context.stage}</strong>，下一步先{context.nextStep}。</p>
            <div className="agent-flow-guide__steps">
              {flowGuideSteps.map((step, index) => <button
                key={step.id}
                className={step.id === activeJourneyStage ? "active" : ""}
                type="button"
                onClick={() => onJourneyStageSelect(step.id)}
              >
                <span>{index + 1}</span>
                <b>{step.label}</b>
                <small>{step.note}</small>
              </button>)}
            </div>
          </div>
        </div>}

        <details className="agent-more-actions">
          <summary>可选辅助</summary>
          <div>
            {auxiliaryActions.map((action) => <button key={action.id} type="button" onClick={action.onClick}>
              {action.label}
            </button>)}
          </div>
        </details>
      </div>

      <div className="agent-composer">
        <textarea placeholder="继续描述你想处理的内容..." rows={3} />
        <div>
          <span>默认关联当前画布上下文</span>
          <button aria-label="发送消息"><ArrowUp size={15} /></button>
        </div>
      </div>
    </section>}
    <button className="agent-pet" aria-label="打开 if 助手" onClick={() => onOpenChange(!open)}>
      <span>if</span>
      {!open && <em>{context.nextStep}</em>}
    </button>
  </div>;
}
