import { Archive, Download, Group, Sparkles, Ungroup } from "lucide-react";

type MultiSelectionToolbarProps = {
  count: number;
  hasGroupedNodes: boolean;
  notice?: string | null;
  onSaveAssets: () => void;
  onToggleGroup: () => void;
  onDownload: () => void;
  onAddToAgent: () => void;
};

export default function MultiSelectionToolbar({
  count,
  hasGroupedNodes,
  notice,
  onSaveAssets,
  onToggleGroup,
  onDownload,
  onAddToAgent
}: MultiSelectionToolbarProps) {
  const GroupIcon = hasGroupedNodes ? Ungroup : Group;

  return <div
    className="multi-select-toolbar"
    onMouseDown={(event) => event.preventDefault()}
    onClick={(event) => event.stopPropagation()}
  >
    <span className="multi-select-toolbar__count">{notice ?? `已框选 ${count} 个节点`}</span>
    <button type="button" onClick={onSaveAssets}><Archive size={14} />保存到资产</button>
    <button type="button" onClick={onToggleGroup}><GroupIcon size={14} />{hasGroupedNodes ? "解组" : "打组"}</button>
    <button type="button" onClick={onDownload}><Download size={14} />批量下载</button>
    <button type="button" onClick={onAddToAgent}><Sparkles size={14} />添加到 Agent 助手</button>
  </div>;
}
