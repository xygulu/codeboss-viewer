// 桌宠「工头」参数化模型 —— 单位 mm，改 P 即可改整机
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const P = {
  // r 是平面圆角；顶边沿用 17（帽子靠这一圈的收窄套住）。底边**不倒圆**：
  // 一倒圆，杯口就比腔体窄（30.2 vs 33.2），抽芯时是倒扣；直角底边也让底面是完整 70×70
  body: { w: 70, d: 70, h: 68, r: 17, rTop: 17, rBottom: 0, wall: 1.8, cover: 1.8 },
  // 底板 4 颗 M2 自攻：螺丝在 r28.5（避开 Ø44 充电环），柱外径 9，柱高 10.2
  screw: { r: 28.5, od: 9, hole: 2.0, h: 10.2 },
  face: { w: 42, h: 36, r: 11, bezel: 1.0, proud: 0.7, cy: 49 },
  // 帽壳直径约 0.77×机身、帽檐约等于机身宽：帽子是"扣在头顶"的，不能宽过脸
  // 檐内孔 = 2*(domeR-0.4)，比头顶那一截机身大 0.4mm 单边间隙，帽子能真的套下去
  // lift = -4：帽檐落座面抬到 h−4（机身收肩之后最宽的一圈）。
  // 再高（−3 以上）机身已经被 r17 的顶圆角收到 24.7，比 Ø52.4 的帽座还窄，
  // 帽座就成了倒扣的蘑菇头；落在 h−4 时机身半宽 26.2，帽座正好与肩齐平
  hat: { domeR: 27, domeH: 27, brimR: 34, brimT: 3.2, lift: -4.0 },
  // 坞高 24：后仰角越大，倾斜的托盘后沿越需要向下让位，坞就得越深。
  // 20mm 高只能装 ~4.5° 后仰；要 12° 得 33mm 深碗（会变成"桶"）
  // hole 90：本体圆角后的最大外接半径 42.4，坞口半径 43 只剩 0.6 太贴，放到 45
  dock: { w: 100, d: 100, h: 24, r: 28, hole: 90, holeR: 24, floor: 5 },
  // rimT 5.0：唇口内径 72，本体底面外接 42.46，唇口 43.04，角上才留得出 0.58；
  // 5.5 时角上只剩 0.09，装配时本体擦唇口
  tray: { w: 82, r: 24, plate: 4, rim: 4.5, rimT: 5.0, bottom: 11 },
  ring: { od: 44, id: 39, hub: 14 },
  pogo: { rOut: 20.75, rIn: 0 },
  sw: { bodyH: 4, gap: 0.5 },
  pillar: { n: 4, r: 30, d: 6 },
  batt: { r: 9.25, h: 58, x: -12, z: -1 },
  mcu: { w: 21, d: 17.5, h: 5, x: 17, z: 2 },
  // 姿态：本体不是正着插在底座里，而是往后仰一点坐在托座上（正角度 = 后仰，脸朝上）
  pose: { tilt: 7, sink: 0, yaw: 0 },
};

const B = P.body;
const floor = P.dock.floor;
const TILT = THREE.MathUtils.degToRad(P.pose.tilt);
const tanT = Math.tan(TILT), cosT = Math.cos(TILT);
const trayHalf = P.tray.w / 2;
const swTop = floor + 1.5 + P.sw.bodyH + P.sw.gap;      // 轻触开关顶面（有顶杆时从这里起）

// 落座面高度由两个约束推出来：
// 1) 开关堆叠 + 顶杆 + 托盘厚度（托盘底面不能压到开关）
// 2) 托盘倾斜后，后沿不能低于坞底（真实机构必须有这段让位）
const trayPlate = Math.max(
  swTop + 1.5 + P.tray.plate / cosT,
  floor + 2.5 + P.tray.plate / cosT + trayHalf * tanT,   // 2.5 = PCB 1.5 + 后沿离 PCB 1mm

);
const trayBottom = trayPlate - P.tray.plate / cosT;      // 托盘底面中心（倾斜后）
const dockH = P.dock.h;

const Y = {
  floor,
  pcbTop: floor + 1.5,
  swTop,
  trayBottom,
  trayPlate,                                   // 落座面中心高度（面本身倾斜 12°）
  get trayRim() { return Y.trayPlate + P.tray.rim; },
  bodyBottom: trayPlate,
  get bodyTop() { return Y.bodyBottom + B.h; },
  get brim() { return Y.bodyTop + P.hat.lift; },
  get hatTop() { return Y.brim + P.hat.domeH; },
  // 落座面在任意 z 处的高度（倾斜 12°，前高后低）
  seatAt(z) { return Y.trayPlate + z * tanT; },
  // 坞壁高度就是底座外形高度：不为了藏住托盘而长高，托盘前唇自己露在坞口上沿，
  // 露出来的那截正好是"托座把本体托住"的视觉
  get wallTop() { return dockH; },
};
export { Y };

const plastic = (color, rough = 0.45) => new THREE.MeshPhysicalMaterial({
  color, roughness: rough, clearcoat: 0.35, clearcoatRoughness: 0.35,
});
export const MAT = {
  cream: plastic(0xf5ebda, 0.5),
  mustard: plastic(0xe0a71c, 0.42),
  gold: new THREE.MeshStandardMaterial({ color: 0xb08d57, roughness: 0.26, metalness: 0.95 }),
  black: new THREE.MeshStandardMaterial({ color: 0x3d2f24, roughness: 0.45, metalness: 0.35 }),
  silicone: new THREE.MeshStandardMaterial({ color: 0xd8d2c6, roughness: 0.9 }),
  pcb: new THREE.MeshStandardMaterial({ color: 0x1f5d3a, roughness: 0.6 }),
  batt: new THREE.MeshStandardMaterial({ color: 0x2f4f7a, roughness: 0.5, metalness: 0.4 }),
  led: new THREE.MeshStandardMaterial({ color: 0xffc46b, emissive: 0xffa83c, emissiveIntensity: 3 }),
  faceGlass: new THREE.MeshStandardMaterial({ color: 0xf6c6a2, roughness: 0.35 }),
};

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// 圆角矩形板/环，沿 Y 拉伸，底面落在 y0；bevel 为边缘倒圆半径
function slab(outer, inner, depth, y0, bevel = 0, holes = []) {
  const s = roundedRectShape(outer.w, outer.h, outer.r);
  if (inner) s.holes.push(new THREE.Path(
    roundedRectShape(inner.w, inner.h, inner.r).getPoints(64).reverse()));
  for (const h of holes) s.holes.push(h);
  // 倒角会在两端各多出一个 bevel，所以实体深度扣掉 2*bevel，保证总高正好是 depth
  const g = new THREE.ExtrudeGeometry(s, {
    depth: depth - bevel * 2, curveSegments: 24,
    bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel,
    bevelSegments: 4, bevelOffset: -bevel,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0 + bevel, 0);
  return g;
}

const mesh = (g, m, name) => { const o = new THREE.Mesh(g, m); o.name = name; return o; };

// ---- 本体外形：分边圆角的方盒截面 ----
// δ(y) 是底/顶圆角造成的水平内缩；顶边保留原来的 17 + 收肩（0.8h 以上收 12%），
// 头部轮廓和改之前完全一致，帽子不用动。内缩量同时作用于半宽和平面圆角，
// 这样每一层截面都是真正的圆角矩形，抽壳时内外两层能逐点对上。
function bodySection(y) {
  const b = P.body, h = b.h, rb = b.rBottom, rt = b.rTop;
  const ab = Math.max(0, rb - Math.min(rb, y));
  const at = Math.max(0, rt - Math.min(rt, h - y));
  const d = Math.max(rb - Math.sqrt(rb * rb - ab * ab), rt - Math.sqrt(rt * rt - at * at));
  const u = Math.min(1, Math.max(0, (y / h - 0.8) / 0.2));
  const k = 1 - 0.12 * u * u * (3 - 2 * u);
  return { hw: (b.w / 2 - d) * k, hd: (b.d / 2 - d) * k, rc: Math.max(0.02, b.r - d) * k };
}

// 帽座：帽檐落座面（h + hat.lift）以上收成 Ø52.4 的圆台，帽檐的 Ø52 内孔在这里过盈 0.2，
// 靠 PP 的弹性压进去。这一段整个藏在帽檐内孔和帽壳里，外观不变。
// 顶部 0.7 做 45° 导入倒角，装配时先导向；rc 比半径小 0.05，避免 rrRing 退化成零长直边。
export const NECK_R = P.hat.domeR - 0.8;
function crownSection(y) {
  const r = y > P.body.h - 0.7 ? NECK_R - (y - (P.body.h - 0.7)) : NECK_R;
  return { hw: r, hd: r, rc: r - 0.05 };
}

// 圆角矩形一圈的点：4 个 1/4 圆角 + 4 条直边，点数固定，内外两层才能一一对应
const SEG_C = 7, SEG_S = 5, RING_N = 4 * (SEG_C + SEG_S);
function rrRing(s) {
  const pts = [];
  const cc = [[1, 1], [-1, 1], [-1, -1], [1, -1]]
    .map(([sx, sz]) => [sx * (s.hw - s.rc), sz * (s.hd - s.rc)]);
  for (let q = 0; q < 4; q++) {
    const [cx, cz] = cc[q], [nx, nz] = cc[(q + 1) % 4];
    const a0 = q * Math.PI / 2, a1 = a0 + Math.PI / 2;
    for (let i = 0; i < SEG_C; i++) {
      const a = a0 + (a1 - a0) * i / SEG_C;
      pts.push([cx + s.rc * Math.cos(a), cz + s.rc * Math.sin(a)]);
    }
    const ax = cx + s.rc * Math.cos(a1), az = cz + s.rc * Math.sin(a1);
    const bx = nx + s.rc * Math.cos(a1), bz = nz + s.rc * Math.sin(a1);
    for (let i = 0; i < SEG_S; i++) {
      const t = i / SEG_S;
      pts.push([ax + (bx - ax) * t, az + (bz - az) * t]);
    }
  }
  return pts;
}

// 抽壳后的本体：外形 + 内腔（整体内缩 wall）+ 杯口环面 + 内顶面。
// 杯口朝下（底板是第二个件），所以这是一个封闭的、壁厚均匀的杯形实体。
function bodyShellGeometry() {
  const b = P.body, wall = b.wall, h = b.h, rt = b.rTop;
  const yN = h + P.hat.lift;              // 帽檐落座高度
  const ys = [];
  for (let i = 0; i <= 8; i++) ys.push(b.rBottom * i / 8);
  for (let y = 10; y < h - rt; y += 4) ys.push(y);
  for (let i = 0; i <= 18; i++) ys.push(h - rt + rt * i / 18);
  ys.push(yN, h - wall);                  // 帽座台阶、内腔顶面各单独一层
  ys.sort((p, q) => p - q);
  const uniq = ys.filter((y, i) => i === 0 || y - ys[i - 1] > 1e-3);

  // 每层 {y, s}。帽座平面放两圈（宽肩 + 窄颈），中间那条水平环面就是帽檐的落座台阶，
  // 帽檐底面整圈坐在上面，不会被压进头里
  const levels = uniq.map(y => ({ y, s: y < yN - 1e-6 ? bodySection(y) : crownSection(y) }));
  levels.splice(levels.findIndex(l => l.y >= yN - 1e-6), 0, { y: yN, s: bodySection(yN) });
  const inner = levels.filter(l => l.y <= h - wall + 1e-6)
    .map(l => ({ y: l.y, s: { hw: l.s.hw - wall, hd: l.s.hd - wall, rc: Math.max(0.5, l.s.rc - wall) } }));

  const pos = [], idx = [];
  const push = (s, y) => { for (const [x, z] of rrRing(s)) pos.push(x, y, z); };
  for (const l of levels) push(l.s, l.y);
  const baseI = pos.length / 3;
  for (const l of inner) push(l.s, l.y);
  const cTop = pos.length / 3; pos.push(0, h, 0);
  const cCeil = pos.length / 3; pos.push(0, h - wall, 0);

  const M = levels.length, Mi = inner.length, N = RING_N;
  // 外壁
  for (let j = 0; j < M - 1; j++) for (let i = 0; i < N; i++) {
    const a = j * N + i, n = j * N + (i + 1) % N, c = (j + 1) * N + i, d = (j + 1) * N + (i + 1) % N;
    idx.push(a, c, n, n, c, d);
  }
  // 顶面
  const t0 = (M - 1) * N;
  for (let i = 0; i < N; i++) idx.push(cTop, t0 + (i + 1) % N, t0 + i);
  // 杯口环面（朝下）
  for (let i = 0; i < N; i++) {
    const o = i, o1 = (i + 1) % N, s = baseI + i, s1 = baseI + (i + 1) % N;
    idx.push(o, o1, s, s, o1, s1);
  }
  // 内壁（法线朝腔内）
  for (let j = 0; j < Mi - 1; j++) for (let i = 0; i < N; i++) {
    const a = baseI + j * N + i, n = baseI + j * N + (i + 1) % N;
    const c = baseI + (j + 1) * N + i, d = baseI + (j + 1) * N + (i + 1) % N;
    idx.push(a, n, c, n, d, c);
  }
  // 内顶面（朝下）
  const ct0 = baseI + (Mi - 1) * N;
  for (let i = 0; i < N; i++) idx.push(cCeil, ct0 + i, ct0 + (i + 1) % N);

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function buildBody() {
  const g = new THREE.Group(); g.name = 'body';
  const b = P.body, f = P.face, sc = P.screw;

  const shell = mesh(bodyShellGeometry(), MAT.cream, 'shell');
  shell.position.y = Y.bodyBottom;
  g.add(shell);

  // 底板：封住杯口，底面跟本体齐平，4 颗 M2 自攻从下往上拧
  const cover = new THREE.Group(); cover.name = 'bottomCover';
  const s0 = bodySection(0);
  const cw = 2 * (s0.hw - b.wall) - 0.4;              // 杯口内轮廓留 0.2 单边间隙
  const cr = Math.max(2, s0.rc - b.wall - 0.2);
  const holes = [0, 1, 2, 3].map(k => {
    const a = k * Math.PI / 2;
    const p = new THREE.Path();
    p.absarc(sc.r * Math.cos(a), sc.r * Math.sin(a), sc.hole / 2 + 0.1, 0, Math.PI * 2, true);
    return p;
  });
  // 底面沉台 Ø46 × 1.0 深，**朝下开口**，金环贴在沉台顶面：pogo 的针尖在座位面以上 1.05、
  // 带 1.2 行程，不沉下去就会把整机顶离座位面。做法是底板开 Ø46 通孔，圆片封在孔的**上面**，
  // 底板中间就凹了个 1.0 的坑，螺丝柱和内腔都不受影响
  const pocketR = 23, pocketD = 1.0;
  const pocket = new THREE.Path();
  pocket.absarc(0, 0, pocketR, 0, Math.PI * 2, true);
  holes.unshift(pocket);
  cover.add(mesh(slab({ w: cw, h: cw, r: cr }, null, b.cover, Y.bodyBottom, 0.3, holes), MAT.cream, 'coverPlate'));
  const disc = mesh(new THREE.CylinderGeometry(pocketR, pocketR, b.cover - pocketD, 64), MAT.cream, 'coverDisc');
  disc.position.y = Y.bodyBottom + b.cover - (b.cover - pocketD) / 2;   // 圆片顶到 1.8，底下留 1.0 的坑
  cover.add(disc);

  // 底板的同心双环触点（金色，跟底板一起是装配件），贴在沉台顶面（朝下可见）
  const ringY = Y.bodyBottom + pocketD - 0.06;
  const ring = mesh(new THREE.RingGeometry(P.ring.id / 2, P.ring.od / 2, 72), MAT.gold, 'ringOuter');
  ring.rotation.x = Math.PI / 2;
  ring.position.y = ringY;
  cover.add(ring);
  const hub = mesh(new THREE.CircleGeometry(P.ring.hub / 2, 48), MAT.gold, 'ringHub');
  hub.rotation.x = Math.PI / 2;
  hub.position.y = ringY;
  cover.add(hub);
  g.add(cover);

  // 螺丝柱：从底板上表面（1.8）长到 12，柱底 1.8 正好落在底板上。
  // 柱心 r28.5 离内壁还有几毫米，所以每根柱子带一条短筋连到壁上——悬空的柱子
  // 在模具里没有分型面可走
  const bossProf = [[sc.hole / 2, 0], [sc.od / 2, 0], [sc.od / 2, sc.h], [sc.hole / 2, sc.h], [sc.hole / 2, 0]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const bossGeo = new THREE.LatheGeometry(bossProf, 32);
  const wallIn = bodySection(6).hw - b.wall;
  for (let k = 0; k < 4; k++) {
    const a = k * Math.PI / 2, ax = Math.cos(a), az = Math.sin(a);
    const boss = mesh(bossGeo, MAT.cream, 'boss');
    boss.position.set(sc.r * ax, Y.bodyBottom + b.cover, sc.r * az);
    g.add(boss);
    const len = wallIn + 0.4 - (sc.r + 1.5);
    const rib = mesh(new THREE.BoxGeometry(len, sc.h, 3), MAT.cream, 'bossRib');
    rib.position.set((sc.r + 1.5 + wallIn + 0.4) / 2 * ax, Y.bodyBottom + b.cover + sc.h / 2, (sc.r + 1.5 + wallIn + 0.4) / 2 * az);
    rib.rotation.y = -a;
    g.add(rib);
  }

  // 屏幕：黑色外框（带孔）+ 内嵌玻璃（玻璃只比机身高 0.05，靠边框高出 0.7 形成凹槽感）
  const s = roundedRectShape(f.w + f.bezel * 2, f.h + f.bezel * 2, f.r + f.bezel);
  s.holes.push(new THREE.Path(roundedRectShape(f.w, f.h, f.r).getPoints(64).reverse()));
  const bezel = new THREE.ExtrudeGeometry(s, { depth: f.proud, bevelEnabled: false, curveSegments: 24 });
  bezel.translate(0, f.cy, b.d / 2 - 0.05);
  g.add(mesh(bezel, MAT.black, 'bezel'));

  // 玻璃用圆角形状，跟边框内孔完全对齐（方形平面会在四角戳出边框）
  const glassGeo = new THREE.ShapeGeometry(roundedRectShape(f.w, f.h, f.r), 32);
  const uv = glassGeo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / f.w + 0.5, uv.getY(i) / f.h + 0.5);
  const glass = mesh(glassGeo, MAT.faceGlass, 'glass');
  glass.position.set(0, f.cy, b.d / 2 + 0.06);
  g.add(glass);

  return g;
}

// 帽壳网格：旋转椭球 + 径向调制出的前后中脊，一体成型（没有贴着焊上去的脊片，
// 也就没有拼缝和打印时的悬空薄片）。phi=0 是顶点，ridge 的强度随 sin(phi) 衰减，
// 所以穹顶是顺的，只在近根部最鼓。
function domeGeometry(R, H, zScale = 1.06, ridge = 0.035, segU = 240, segV = 64) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= segV; j++) {
    const phi = (Math.PI / 2) * (j / segV);
    const s = Math.sin(phi), c = Math.cos(phi);
    for (let i = 0; i <= segU; i++) {
      const th = (Math.PI * 2) * (i / segU);
      const x0 = Math.cos(th) * s, z0 = Math.sin(th) * s;
      // 壳体的加强筋：中间一条脊 + 两侧各一道浅槽，等于把帽壳分成前后两瓣。
      // 这是注塑件本身有的结构，所以直接调制在同一个网格里，不另贴片
      const u = Math.abs(x0);
      const rib = Math.exp(-Math.pow(u / 0.16, 2));
      const groove = Math.exp(-Math.pow((u - 0.45) / 0.20, 2));
      const k = 1 + ridge * (rib - 0.45 * groove) * Math.pow(s, 0.35);
      pos.push(x0 * R * k, c * H * k, z0 * R * zScale * k);
      uv.push(i / segU, j / segV);
    }
  }
  for (let j = 0; j < segV; j++) {
    for (let i = 0; i < segU; i++) {
      const a = j * (segU + 1) + i, b = a + segU + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);   // 逆时针，法线朝外
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function buildHat() {
  const g = new THREE.Group(); g.name = 'hat';
  const h = P.hat;
  const R = h.brimR, T = h.brimT;
  // 帽檐内孔 = 帽壳底半径 - 0.4。帽壳底半径 27 比这一高度上的头顶（半宽 26.2）大，
  // 所以整个帽子能从上往下套进去，单边留 0.4mm 装配间隙，不是硬穿模
  const inner = h.domeR - 1.0;        // 比头顶窄 0.2（过盈），帽子是靠弹性压进去的，不会自己掉
  const drop = 1.4;                   // 帽檐向外微微下垂
  // 帽檐必须是正圆、不能 z 向压扁也不能前后偏移：内孔一压扁（0.95）z 向就只剩 24.7，
  // 比 Ø52.4 的帽座小 1.5，帽子根本压不进去；前后偏 2 更会啃掉后半圈 3.5

  // 帽檐：薄环，向外微垂，外沿一圈卷边（车削件，壁厚 T）
  const prof = [
    [inner, 0], [inner + 1.2, -0.15 * drop], [R - 2.4, -drop], [R - 2.4, -drop + T], [inner, T], [inner, 0],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const brim = mesh(new THREE.LatheGeometry(prof, 96), MAT.mustard, 'brim');
  brim.position.y = Y.brim;
  g.add(brim);

  const bead = mesh(new THREE.TorusGeometry(R - 2.4, T * 0.62, 12, 96), MAT.mustard, 'brimBead');
  bead.rotation.x = Math.PI / 2;
  bead.position.y = Y.brim - drop + T / 2;
  g.add(bead);

  // 帽壳：一体成型（中脊就在这个网格里），底边正好压在帽檐上
  const domeY = Y.brim + T;
  const dome = mesh(domeGeometry(h.domeR, h.domeH, 1.06, 0.035), MAT.mustard, 'dome');
  dome.position.y = domeY;
  g.add(dome);

  // 帽箍：帽壳根部的凸起带，压在帽檐上表面上（内侧埋进帽壳）。
  // 不能像原来那样往下沉 1.6：帽檐内孔里现在是 26.2 的帽座，沉下去就顶在头上了
  const band = mesh(new THREE.TorusGeometry(h.domeR - 0.8, 2.4, 12, 96), MAT.mustard, 'band');
  band.rotation.x = Math.PI / 2;
  band.scale.z = 1.06;
  band.position.y = domeY + 2.4;
  g.add(band);

  // 帽箍上的 4 个方形凸耳，底面坐在帽檐上表面上、跨过帽箍（实际模具里跟帽檐一体）
  for (const a of [45, 135, 225, 315]) {
    const rad = THREE.MathUtils.degToRad(a);
    const tab = mesh(new RoundedBoxGeometry(7.5, 4.5, 6.5, 4, 1.5), MAT.mustard, 'tab');
    tab.position.set(Math.sin(rad) * (h.domeR + 0.9), domeY + 2.25, Math.cos(rad) * (h.domeR + 0.9));
    tab.rotation.y = rad;
    g.add(tab);
  }

  // 帽檐外沿下的一条琥珀光：实体是一个嵌入式导光环（帽檐下表面开 1.5×3 环槽，
  // 装半透明 PC 环 + 帽壳里的 LED），模型里用发光环表示
  const glow = mesh(new THREE.TorusGeometry(R - 0.8, 0.55, 8, 96), MAT.led, 'glow');
  glow.rotation.x = Math.PI / 2;
  glow.position.y = Y.brim - drop;
  g.add(glow);

  const spill = new THREE.PointLight(0xffa53c, 6, 46, 2);
  spill.position.set(0, Y.brim - 5, 30);   // 在帽檐外沿下方，照亮额头和帽檐内侧
  g.add(spill);

  return g;
}

export function buildDock() {
  const g = new THREE.Group(); g.name = 'dock';
  const d = P.dock, t = P.tray;

  g.add(mesh(slab({ w: d.w, h: d.d, r: d.r },
    { w: d.hole, h: d.hole, r: d.holeR }, Y.wallTop - d.floor, d.floor, 1.4), MAT.cream, 'dockWall'));
  g.add(mesh(slab({ w: d.w, h: d.d, r: d.r }, null, d.floor, 0, 1.8), MAT.cream, 'dockFloor'));

  // 浮动托盘：整体随落座面倾斜 12°，所以它是一块斜放的板（做楔形要 ~15mm 厚，装不进浅底座）。
  // 托盘只沿竖直方向浮动（4 根硅胶柱 + 中心导向），倾斜由托盘自身姿态保证
  const tray = new THREE.Group();
  tray.name = 'tray';
  tray.position.y = Y.trayPlate;
  tray.rotation.x = -TILT;
  tray.add(mesh(slab({ w: t.w, h: t.w, r: t.r }, null, t.plate, -t.plate, 1.2), MAT.mustard, 'trayPlate'));
  tray.add(mesh(slab({ w: t.w, h: t.w, r: t.r },
    { w: t.w - t.rimT * 2, h: t.w - t.rimT * 2, r: t.r - t.rimT }, t.rim, 0, 1.0),
    MAT.mustard, 'trayRim'));

  // pogo 针 ×2，装在落座面上、垂直于座位面（跟托盘一起倾斜），随托盘浮动所以接触压力不变。
  // 画的是压缩到位的状态：针尖 1.05，沉台顶（金环面）0.94，留 0.11 的预压
  for (const r of [P.pogo.rOut, P.pogo.rIn]) {
    const h = 0.45;
    const pin = mesh(new THREE.CylinderGeometry(1.1, 1.1, h, 16), MAT.gold, 'pogo');
    pin.position.set(r, h / 2, 0);
    tray.add(pin);
    const tip = mesh(new THREE.SphereGeometry(0.6, 16, 10), MAT.gold, 'pogoTip');
    tip.position.set(r, h, 0);
    tray.add(tip);
  }
  g.add(tray);

  // 硅胶柱：从 PCB 顶面顶到倾斜的托盘底面。托盘斜着放，所以四根长度不同（后短前长）
  for (let i = 0; i < P.pillar.n; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2;
    const px = Math.cos(a) * P.pillar.r, pz = Math.sin(a) * P.pillar.r;
    const len = Y.seatAt(pz) - t.plate / cosT - Y.pcbTop;
    const p = mesh(new THREE.CylinderGeometry(P.pillar.d / 2, P.pillar.d / 2, len, 24), MAT.silicone, 'pillar');
    p.position.set(px, Y.pcbTop + len / 2, pz);
    g.add(p);
  }
  // 中心导向柱：托盘沿它竖直滑动（托盘底面中心到 PCB 顶面）
  const guideLen = Y.trayBottom - Y.pcbTop;
  const guide = mesh(new THREE.CylinderGeometry(3, 3, guideLen, 24), MAT.silicone, 'guide');
  guide.position.y = Y.pcbTop + guideLen / 2;
  g.add(guide);

  // PCB / 开关 / USB-C
  const pcb = mesh(new THREE.BoxGeometry(d.hole - 10, 1.5, d.hole - 10), MAT.pcb, 'pcb');
  pcb.position.y = Y.floor + 0.75;
  g.add(pcb);

  const sw = mesh(new THREE.BoxGeometry(6, P.sw.bodyH, 6), MAT.black, 'switch');
  sw.position.y = Y.swTop - P.sw.bodyH / 2;
  g.add(sw);

  // 顶杆：开关顶面到倾斜的托盘底面。倾斜后这里必然有一段间隙，靠顶杆补齐
  const plungerLen = Y.trayBottom - Y.swTop;
  if (plungerLen > 0.2) {
    const pl = mesh(new THREE.CylinderGeometry(3, 3, plungerLen, 20), MAT.black, 'plunger');
    pl.position.y = Y.swTop + plungerLen / 2;
    g.add(pl);
  }

  const usb = mesh(new THREE.BoxGeometry(9, 3.4, 7), MAT.black, 'usb');
  usb.position.set(0, Y.floor + 3, -d.d / 2 + 3.5);
  g.add(usb);

  return g;
}

export function buildInternals() {
  const g = new THREE.Group(); g.name = 'internals';
  const b = P.batt, m = P.mcu;

  const batt = mesh(new THREE.CylinderGeometry(b.r, b.r, b.h, 32), MAT.batt, 'battery18650');
  batt.position.set(b.x, Y.bodyBottom + 3 + b.h / 2, b.z);
  g.add(batt);

  // 主板（承载板）：XIAO 用 2.5 的排针插在上面，IMU、pogo 线和灯线都焊在这块板上
  const carrier = mesh(new THREE.BoxGeometry(32, 1.6, 24), MAT.pcb, 'carrier');
  carrier.position.set(m.x, Y.bodyBottom + 43.2, m.z);
  g.add(carrier);

  const mcu = mesh(new THREE.BoxGeometry(m.w, m.h, m.d), MAT.pcb, 'xiao');
  mcu.position.set(m.x, Y.bodyBottom + 49.0, m.z);   // 板顶 44.0 + 2.5 排针 + 2.5 板厚
  g.add(mcu);

  // 6 轴 IMU（QMI8658 / BMI270 一类 3.2×3.2 QFN），焊在主板上、靠近机身中线。
  // 拿起、抚摸、轻敲、摇晃、倒扣全靠它——唯一能把"被摸"变成事件的零件。
  // 装在主板上而不是贴在外壳上：刚性够，离电池和线束远，低频噪声小
  const imu = mesh(new THREE.BoxGeometry(3.2, 1, 3.2), MAT.black, 'imu');
  imu.position.set(m.x - 12, Y.bodyBottom + 44.5, m.z + 1);
  g.add(imu);

  // 屏幕模组贴在内壁前方，四角留 0.1（方屏的角会顶到内腔圆角，纯贴面会穿 0.3）
  const panel = mesh(new THREE.BoxGeometry(P.face.w, P.face.h, 3), MAT.black, 'panel');
  panel.position.set(0, P.face.cy, P.body.d / 2 - P.body.wall - 1.9);
  g.add(panel);

  return g;
}

export function makeFaceTexture() {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 512; c.height = 480;
  const x = c.getContext('2d');
  const grd = x.createLinearGradient(0, 0, 0, 480);
  grd.addColorStop(0, '#ffdcbe'); grd.addColorStop(1, '#f5b78c');
  x.fillStyle = grd; x.fillRect(0, 0, 512, 480);
  const eye = (cx) => {
    x.fillStyle = '#2b1b14'; x.beginPath(); x.ellipse(cx, 200, 60, 72, 0, 0, 7); x.fill();
    x.fillStyle = '#fff';
    x.beginPath(); x.arc(cx - 20, 174, 19, 0, 7); x.fill();
    x.beginPath(); x.arc(cx + 22, 228, 8, 0, 7); x.fill();
  };
  eye(160); eye(352);
  x.strokeStyle = '#2b1b14'; x.lineWidth = 10; x.lineCap = 'round';
  x.beginPath(); x.arc(256, 250, 26, 0.3, Math.PI - 0.3); x.stroke();
  x.fillStyle = 'rgba(238,120,120,0.35)';
  x.beginPath(); x.ellipse(90, 268, 28, 17, 0, 0, 7); x.fill();
  x.beginPath(); x.ellipse(422, 268, 28, 17, 0, 0, 7); x.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildAll() {
  const root = new THREE.Group();

  // 本体绕"落座面中心"整体倾斜，再下沉 sink，后底角埋进托盘、前底角抬起来被托盘唇口挡住
  const pivot = new THREE.Group();
  pivot.name = 'pose';
  pivot.position.y = Y.trayPlate - P.pose.sink;
  pivot.rotation.x = -THREE.MathUtils.degToRad(P.pose.tilt);
  pivot.rotation.y = THREE.MathUtils.degToRad(P.pose.yaw);
  const inner = new THREE.Group();
  inner.position.y = -Y.trayPlate;
  inner.add(buildBody(), buildHat(), buildInternals());
  pivot.add(inner);

  root.add(buildDock(), pivot);
  const tex = makeFaceTexture();
  if (tex) {
    MAT.faceGlass.map = tex;
    MAT.faceGlass.emissive = new THREE.Color(0xffffff);
    MAT.faceGlass.emissiveMap = tex;
    MAT.faceGlass.emissiveIntensity = 0.55;
    MAT.faceGlass.needsUpdate = true;
  }
  return root;
}
