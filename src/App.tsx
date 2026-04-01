import { ChangeEvent, useMemo, useState } from 'react';

type ToolKey = 'notif' | 'minecraft' | 'palette';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolKey>('notif');

  return (
    <main className="app-shell">
      <header>
        <h1>DIcon Studio</h1>
        <p>
          Build Discord icons, April Fools notification fakes, Minecraft server icons,
          and color palettes in one modern web app.
        </p>
      </header>

      <nav className="tabs">
        <button onClick={() => setActiveTool('notif')} className={activeTool === 'notif' ? 'active' : ''}>Discord April Fools Badge</button>
        <button onClick={() => setActiveTool('minecraft')} className={activeTool === 'minecraft' ? 'active' : ''}>Minecraft Server Icon Tool</button>
        <button onClick={() => setActiveTool('palette')} className={activeTool === 'palette' ? 'active' : ''}>Icon Palette & Shape Tool</button>
      </nav>

      {activeTool === 'notif' && <DiscordNotifTool />}
      {activeTool === 'minecraft' && <MinecraftIconTool />}
      {activeTool === 'palette' && <PaletteTool />}
    </main>
  );
}

function imageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function DiscordNotifTool() {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [badgeValue, setBadgeValue] = useState('1');
  const [badgeColor, setBadgeColor] = useState('#ed4245');
  const [size, setSize] = useState(256);
  const [offset, setOffset] = useState(12);

  const previewStyle = useMemo(() => {
    const diameter = Math.max(38, Math.round(size * 0.28));
    const fontSize = Math.max(20, Math.round(size * 0.11));
    return {
      width: size,
      height: size,
      badge: {
        width: diameter,
        height: diameter,
        fontSize,
        bottom: offset,
        right: offset,
        background: badgeColor
      }
    };
  }, [badgeColor, badgeValue, offset, size]);

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const img = await imageFromFile(file);
    setImgSrc(img.src);
  }

  async function download() {
    if (!imgSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imgSrc;
    await img.decode();

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);

    const iconRadius = size / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(iconRadius, iconRadius, iconRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, 0, 0, size, size);
    ctx.restore();

    const diameter = Math.max(38, Math.round(size * 0.28));
    const badgeCenterX = size - offset - diameter / 2;
    const badgeCenterY = size - offset - diameter / 2;

    ctx.fillStyle = '#111214';
    ctx.beginPath();
    ctx.arc(badgeCenterX, badgeCenterY, diameter / 2 + 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = badgeColor;
    ctx.beginPath();
    ctx.arc(badgeCenterX, badgeCenterY, diameter / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.max(20, Math.round(size * 0.11))}px Inter, sans-serif`;
    ctx.fillText(badgeValue, badgeCenterX, badgeCenterY + 1);

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `discord-april-fools-${badgeValue}.png`;
    a.click();
  }

  return (
    <section className="tool-grid">
      <div className="panel">
        <h2>April Fools Notification Badge</h2>
        <p>
          Upload a logo, then add the fake unread badge in the bottom-right to prank friends.
        </p>

        <label>
          Upload logo
          <input type="file" accept="image/*" onChange={onFileChange} />
        </label>

        <label>
          Badge text (1, 9+, 99, etc.)
          <input value={badgeValue} maxLength={3} onChange={(e) => setBadgeValue(e.target.value || '1')} />
        </label>

        <label>
          Badge color
          <input type="color" value={badgeColor} onChange={(e) => setBadgeColor(e.target.value)} />
        </label>

        <label>
          Export size ({size}px)
          <input type="range" min={128} max={1024} step={8} value={size} onChange={(e) => setSize(Number(e.target.value))} />
        </label>

        <label>
          Badge offset ({offset}px)
          <input type="range" min={0} max={48} value={offset} onChange={(e) => setOffset(clamp(Number(e.target.value), 0, 48))} />
        </label>

        <button onClick={download} disabled={!imgSrc}>Download PNG</button>
      </div>

      <div className="panel preview-wrap">
        <h3>Preview</h3>
        <div className="discord-preview" style={{ width: previewStyle.width, height: previewStyle.height }}>
          {imgSrc ? <img src={imgSrc} alt="Icon preview" /> : <div className="placeholder">Upload an icon</div>}
          {imgSrc && (
            <div className="notif" style={previewStyle.badge}>
              {badgeValue}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MinecraftIconTool() {
  const [imgSrc, setImgSrc] = useState('');
  const [serverText, setServerText] = useState('SMP');
  const [pixelate, setPixelate] = useState(3);

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const img = await imageFromFile(file);
    setImgSrc(img.src);
  }

  async function export64() {
    if (!imgSrc) return;
    const img = new Image();
    img.src = imgSrc;
    await img.decode();

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    const block = Math.max(1, pixelate);

    const temp = document.createElement('canvas');
    temp.width = Math.max(1, Math.floor(64 / block));
    temp.height = Math.max(1, Math.floor(64 / block));
    const tctx = temp.getContext('2d');
    if (!tctx) return;

    tctx.drawImage(img, 0, 0, temp.width, temp.height);
    ctx.drawImage(temp, 0, 0, temp.width, temp.height, 0, 0, 64, 64);

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 48, 64, 16);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(serverText.slice(0, 8), 32, 56);

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `minecraft-server-icon-${serverText || 'custom'}.png`;
    a.click();
  }

  return (
    <section className="tool-grid">
      <div className="panel">
        <h2>Minecraft Server Icon Tool</h2>
        <p>Generate a 64x64 server icon with pixel-art filtering and optional server text overlay.</p>

        <label>
          Upload base image
          <input type="file" accept="image/*" onChange={onFileChange} />
        </label>

        <label>
          Overlay text
          <input value={serverText} maxLength={8} onChange={(e) => setServerText(e.target.value.toUpperCase())} />
        </label>

        <label>
          Pixel intensity ({pixelate})
          <input type="range" min={1} max={8} value={pixelate} onChange={(e) => setPixelate(Number(e.target.value))} />
        </label>

        <button onClick={export64} disabled={!imgSrc}>Export server-icon.png</button>
      </div>
    </section>
  );
}

function PaletteTool() {
  const [bg, setBg] = useState('#5865f2');
  const [fg, setFg] = useState('#ffffff');
  const [rounded, setRounded] = useState(25);

  const gradient = `linear-gradient(135deg, ${bg}, ${fg})`;

  return (
    <section className="tool-grid">
      <div className="panel">
        <h2>Palette & Shape Helper</h2>
        <p>Experiment with icon backgrounds for Discord brands, game servers, and social assets.</p>

        <label>
          Primary color
          <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} />
        </label>

        <label>
          Accent color
          <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} />
        </label>

        <label>
          Corner roundness ({rounded}%)
          <input type="range" min={0} max={50} value={rounded} onChange={(e) => setRounded(Number(e.target.value))} />
        </label>
      </div>

      <div className="panel preview-wrap">
        <h3>Gradient Icon Mockup</h3>
        <div
          className="shape-preview"
          style={{ background: gradient, borderRadius: `${rounded}%` }}
          aria-label="Gradient icon preview"
        />
      </div>
    </section>
  );
}
