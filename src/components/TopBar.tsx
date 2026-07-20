import type { CSSProperties } from "react";
import { ChevronDown, Cloud, Gem, Redo2, Undo2 } from "lucide-react";
import { mediaCssUrl } from "../utils/media";

const avatarStyle = {
  backgroundImage: mediaCssUrl("media/academy/character-hikaru.png")
} satisfies CSSProperties;

export default function TopBar() {
  return (
    <header className="topbar">
      <div className="brand-lockup"><span className="brand-mark">if</span><strong>studio</strong></div>
      <div className="project-path"><span>项目</span><b>深渊学园</b><span>/</span><span>工作画布</span></div>
      <div className="save-state"><Cloud size={13} /><span>已保存</span></div>
      <div className="topbar-actions">
        <div className="undo-group"><button className="icon-button" aria-label="撤销"><Undo2 size={16} /></button><button className="icon-button" aria-label="重做"><Redo2 size={16} /></button></div>
        <button className="user-account" aria-label="用户账户，1280 积分">
          <span className="user-avatar" style={avatarStyle} />
          <span className="user-points"><Gem size={13} />1,280 积分</span>
          <ChevronDown size={13} />
        </button>
      </div>
    </header>
  );
}
