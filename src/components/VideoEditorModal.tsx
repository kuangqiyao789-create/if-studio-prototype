import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  AudioLines,
  Captions,
  ChevronDown,
  Download,
  Eye,
  Film,
  FolderOpen,
  Gauge,
  Link2,
  Music2,
  Pause,
  Play,
  Redo2,
  Scissors,
  SlidersHorizontal,
  Sparkles,
  Type,
  Undo2,
  Upload,
  Volume2,
  VolumeX,
  X,
  ZoomIn
} from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

const clips = [
  { id: "01", name: "病床惊醒", duration: "8s", src: "/media/academy/storyboard-01.png", video: "/media/academy/segment-01.mp4" },
  { id: "02", name: "校医质询", duration: "11s", src: "/media/academy/storyboard-02.png", video: "/media/academy/segment-02.mp4" },
  { id: "03", name: "身份缺失", duration: "15s", src: "/media/academy/storyboard-03.png", video: "/media/academy/segment-03.mp4" },
  { id: "04", name: "权威压制", duration: "12s", src: "/media/academy/storyboard-04.png", video: "/media/academy/segment-04.mp4" },
  { id: "05", name: "暗中决断", duration: "7s", src: "/media/academy/storyboard-05.png", video: "/media/academy/segment-05.mp4" },
  { id: "06", name: "走廊引路", duration: "9s", src: "/media/academy/storyboard-06.png", video: "/media/academy/segment-06.mp4" },
  { id: "07", name: "破窗挑衅", duration: "9s", src: "/media/academy/storyboard-07.png", video: "/media/academy/segment-07.mp4" }
];

const mediaStyle = (src: string) => ({
  "--media-image": `url("${src}")`,
  "--media-fit": "cover",
  "--media-position": "50% 50%"
} as CSSProperties);

export default function VideoEditorModal({ open, onClose }: Props) {
  const [activeTab, setActiveTab] = useState("媒体");
  const [selectedClip, setSelectedClip] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [zoom, setZoom] = useState(62);
  const [exported, setExported] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.load();
    setPlaying(false);
  }, [selectedClip]);

  if (!open) return null;

  const currentClip = clips[selectedClip];
  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) await video.play();
    else video.pause();
  };
  const tabs = [
    { label: "媒体", icon: FolderOpen },
    { label: "音频", icon: Music2 },
    { label: "文本", icon: Type },
    { label: "转场", icon: Sparkles }
  ];

  return <div className="editor-backdrop" onMouseDown={onClose}>
    <section className="video-editor" role="dialog" aria-modal="true" aria-label="剪辑编辑器" onMouseDown={(event) => event.stopPropagation()}>
      <header className="editor-header">
        <div className="editor-title"><button className="icon-button" aria-label="关闭剪辑编辑器" onClick={onClose}><X size={17} /></button><div><strong>剪辑工作台</strong><span>深渊学园 · 7 个分镜段 · 01:11</span></div></div>
        <div className="editor-history"><button className="icon-button" aria-label="撤销"><Undo2 size={15} /></button><button className="icon-button" aria-label="重做"><Redo2 size={15} /></button><span>自动保存</span></div>
        <button className="editor-export" onClick={() => setExported(true)}><Download size={15} />{exported ? "已加入导出队列" : "导出视频"}</button>
      </header>

      <div className="editor-upper">
        <aside className="editor-media-panel">
          <nav className="editor-tabs" aria-label="剪辑素材类型">{tabs.map(({ label, icon: Icon }) => <button className={activeTab === label ? "active" : ""} key={label} onClick={() => setActiveTab(label)}><Icon size={14} /><span>{label}</span></button>)}</nav>
          <div className="editor-panel-heading"><div><strong>{activeTab}</strong><span>{activeTab === "媒体" ? "项目素材 7" : "可添加到当前时间线"}</span></div><button className="editor-import"><Upload size={13} />导入</button></div>
          {activeTab === "媒体" ? <div className="editor-media-grid">{clips.map((clip, index) => <button className={selectedClip === index ? "active" : ""} key={clip.id} onClick={() => setSelectedClip(index)}><span className="media-crop" style={mediaStyle(clip.src)}><i>{clip.duration}</i></span><b>SHOT {clip.id}</b><small>{clip.name}</small></button>)}</div> : <div className="editor-library-empty"><Sparkles size={22} /><strong>{activeTab}素材</strong><span>选择素材后可拖入下方轨道</span></div>}
        </aside>

        <section className="editor-viewer">
          <div className="editor-section-title"><span>播放器</span><small>节目画面 · 16:9</small></div>
          <div className="editor-stage"><div className="editor-stage-media"><video ref={videoRef} className="editor-stage-video" src={currentClip.video} poster={currentClip.src} preload="metadata" playsInline muted={muted} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} /><span>SHOT {currentClip.id} · {currentClip.name}</span></div></div>
          <div className="editor-player-controls"><code>00:00:00</code><button className="editor-play-control" aria-label={playing ? "暂停预览" : "播放预览"} onClick={togglePlayback}>{playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}</button><code>01:11:00</code><button className="editor-ratio">16:9 <ChevronDown size={12} /></button></div>
        </section>

        <aside className="editor-properties">
          <div className="editor-section-title"><span>片段参数</span><small>SHOT {currentClip.id}</small></div>
          <div className="property-section"><label>片段名称<input value={currentClip.name} readOnly /></label><div className="property-grid"><label>入点<input value="00:00" readOnly /></label><label>时长<input value={currentClip.duration} readOnly /></label></div></div>
          <div className="property-section"><div className="property-title"><span><Gauge size={13} />速度</span><b>1.0x</b></div><input className="editor-range" type="range" min="25" max="200" defaultValue="100" /><div className="property-ticks"><span>0.25x</span><span>1x</span><span>2x</span></div></div>
          <div className="property-section"><div className="property-title"><span><SlidersHorizontal size={13} />画面</span><button>重置</button></div><div className="property-grid"><label>缩放<input value="100%" readOnly /></label><label>旋转<input value="0°" readOnly /></label></div></div>
          <div className="property-section property-audio"><div><Volume2 size={14} /><span>原声</span></div><input className="editor-range" type="range" min="0" max="100" defaultValue="82" /></div>
        </aside>
      </div>

      <section className="editor-timeline">
        <header className="timeline-toolbar"><div><button aria-label="分割片段"><Scissors size={14} /></button><button aria-label="链接片段"><Link2 size={14} /></button><button aria-label={muted ? "恢复声音" : "静音"} onClick={() => setMuted((value) => !value)}>{muted ? <VolumeX size={14} /> : <Volume2 size={14} />}</button></div><div className="timeline-zoom"><ZoomIn size={13} /><input type="range" min="35" max="100" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></div></header>
        <div className="timeline-canvas">
          <div className="timeline-track-labels"><span><Film size={13} />视频</span><span><AudioLines size={13} />原声</span><span><Music2 size={13} />配乐</span><span><Captions size={13} />字幕</span></div>
          <div className="timeline-tracks">
            <div className="editor-time-ruler"><span>00:00</span><span>00:14</span><span>00:28</span><span>00:42</span><span>00:56</span><span>01:11</span></div>
            <div className="editor-playhead"><i /><span>00:34</span></div>
            <div className="video-track">{clips.map((clip, index) => <button className={selectedClip === index ? "active" : ""} key={clip.id} style={{ flexGrow: Number.parseInt(clip.duration) }} onClick={() => setSelectedClip(index)}><span className="media-crop" style={mediaStyle(clip.src)} /><b>{clip.id}</b></button>)}</div>
            <div className="audio-track"><div>{Array.from({ length: 44 }, (_, index) => <i key={index} style={{ height: `${24 + (index * 17) % 68}%` }} />)}</div></div>
            <div className="music-track"><span>深渊学园低频氛围 · 01:11</span></div>
            <div className="caption-track"><span>终端里没有你的入学记录</span><span>先降低敌意</span><span>失忆转学生</span></div>
          </div>
          <div className="timeline-track-tools"><button aria-label="显示视频轨"><Eye size={13} /></button><button aria-label="控制原声轨"><Volume2 size={13} /></button><button aria-label="控制配乐轨"><Volume2 size={13} /></button><button aria-label="显示字幕轨"><Eye size={13} /></button></div>
        </div>
      </section>
    </section>
  </div>;
}
