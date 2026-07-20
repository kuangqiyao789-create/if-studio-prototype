import { FileUp, Plus, Workflow } from "lucide-react";

type Props = { onAdd: () => void; onWorkflow: () => void };

export default function EmptyCanvas({ onAdd, onWorkflow }: Props) {
  return <div className="empty-canvas">
    <div className="empty-spectral" />
    <div className="empty-ripple" />
    <div className="empty-copy">
      <span className="empty-icon"><FileUp size={20} /></span>
      <strong>开始搭建生产画布</strong>
      <p>导入剧本或从专业工作流建立镜头与资产骨架。</p>
      <div>
        <button className="primary-command" onClick={onAdd}><Plus size={15} />添加创作输入</button>
        <button className="secondary-command" onClick={onWorkflow}><Workflow size={15} />选择工作流</button>
      </div>
    </div>
  </div>;
}
