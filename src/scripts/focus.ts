import { Renderer, Program, Mesh, Geometry } from "ogl";

// Fullscreen triangle — couvre l'écran en 3 vertices, pas de perspective
// ni de mesh complexe : tout le travail se passe dans le fragment shader.
const vertex = /* glsl */ `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// Raymarching — deux tores entrelacés à 90°, topologiquement liés (Hopf link).
// Le shader raymarche le SDF d'union de deux tores, ombre en lambert + rim.
// Black mat ink sur alpha, rotation 4D via deux matrices 2D combinées.
const fragment = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform vec3 uInk;
  uniform float uPulse;

  // Rotation 2D
  mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

  // SDF d'un tore : R = rayon du grand cercle, r = rayon du tube.
  float sdTorus(vec3 p, float R, float r) {
    vec2 q = vec2(length(p.xz) - R, p.y);
    return length(q) - r;
  }

  // Lissage min (blend) — fond les deux tores au lieu de les intersecter nettement.
  float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
  }

  float map(vec3 p) {
    float R = 1.0;
    float r = 0.22 * uPulse;

    // Tore 1 : axe Y (dans le plan XZ)
    float t1 = sdTorus(p, R, r);

    // Tore 2 : axe X (plan YZ) — orientations perpendiculaires pour créer
    // un vrai lien topologique. On swap les composantes de p pour faire
    // tourner le tore autour de X sans matrice.
    float t2 = sdTorus(p.yzx, R, r);

    // Union lissée — les deux tubes se fondent où ils se rejoignent.
    return smin(t1, t2, 0.08);
  }

  // Normale par différences finies
  vec3 calcNormal(vec3 p) {
    const vec2 e = vec2(0.0012, 0);
    return normalize(vec3(
      map(p + e.xyy) - map(p - e.xyy),
      map(p + e.yxy) - map(p - e.yxy),
      map(p + e.yyx) - map(p - e.yyx)
    ));
  }

  // Soft shadow raymarch — ombre douce pour accentuer le volume.
  float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
    float res = 1.0;
    float t = mint;
    for (int i = 0; i < 32; i++) {
      float h = map(ro + rd * t);
      if (h < 0.001) return 0.0;
      res = min(res, k * h / t);
      t += clamp(h, 0.02, 0.2);
      if (t > maxt) break;
    }
    return clamp(res, 0.0, 1.0);
  }

  void main() {
    // UV normalisés, centrés, ratio préservé
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;

    // Origine rayon + direction
    vec3 ro = vec3(0.0, 0.0, 3.2);
    vec3 rd = normalize(vec3(uv, -1.5));

    // Rotations du monde — deux axes, vitesses légèrement déphasées pour
    // que l'œil ne trouve pas de "période" évidente.
    mat2 rXZ = rot(uTime * 0.18);
    mat2 rYZ = rot(uTime * 0.27);
    mat2 rXY = rot(uTime * 0.09);

    // Raymarching
    float dist = 0.0;
    float hit = 0.0;
    vec3 p;
    for (int i = 0; i < 96; i++) {
      p = ro + rd * dist;
      // Applique les rotations au point (rotate the scene around origin)
      vec3 rp = p;
      rp.xz = rXZ * rp.xz;
      rp.yz = rYZ * rp.yz;
      rp.xy = rXY * rp.xy;

      float d = map(rp);
      if (d < 0.001) { hit = 1.0; break; }
      if (dist > 8.0) break;
      dist += d * 0.9;
    }

    if (hit < 0.5) {
      // Miss — alpha 0, le papier derrière reste visible.
      gl_FragColor = vec4(0.0);
      return;
    }

    // Hit — shading
    vec3 rp = p;
    rp.xz = rXZ * rp.xz;
    rp.yz = rYZ * rp.yz;
    rp.xy = rXY * rp.xy;

    vec3 N = calcNormal(rp);
    vec3 L = normalize(vec3(0.4, 0.75, 0.5));
    float lambert = clamp(dot(N, L), 0.0, 1.0);

    // Ombre soft
    vec3 rdr = rd;
    rdr.xz = rXZ * rdr.xz;
    rdr.yz = rYZ * rdr.yz;
    rdr.xy = rXY * rdr.xy;
    float sh = softShadow(rp + N * 0.01, L, 0.02, 3.0, 8.0);

    // Fresnel — rim de lumière subtil sur les silhouettes
    float fres = 1.0 - clamp(dot(N, -rdr), 0.0, 1.0);
    fres = pow(fres, 2.2);

    // Noir profond à la lumière, presque noir dans l'ombre, rim lumineux.
    vec3 col = mix(uInk * 0.15, uInk * 1.1, lambert * sh);
    col = mix(col, uInk * 0.05, fres * 0.4);
    // Clamp pour ne pas dépasser le noir éditorial
    col = min(col, vec3(0.22));

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function initFocus(reduced: boolean) {
  const canvas = document.querySelector<HTMLCanvasElement>("[data-focus-canvas]");
  if (!canvas) return;

  const stage = canvas.parentElement as HTMLElement | null;
  if (!stage) return;

  // Détecte les devices modestes pour rendre une frame statique au lieu
  // d'animer en continu.
  type NavExt = Navigator & { deviceMemory?: number };
  const nav = navigator as NavExt;
  const lowMem = typeof nav.deviceMemory === "number" && nav.deviceMemory < 4;
  const lowCpu = (nav.hardwareConcurrency ?? 4) < 4;
  const isLowEnd = lowMem || lowCpu;

  const renderer = new Renderer({
    canvas,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    alpha: true,
    antialias: false, // on a du multi-sampling implicit via DPR
  });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);

  // Fullscreen triangle : 3 vertices couvrent tout l'écran, plus simple qu'un quad.
  const geometry = new Geometry(gl, {
    position: {
      size: 2,
      data: new Float32Array([-1, -1, 3, -1, -1, 3]),
    },
  });

  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: [1, 1] },
      uInk: { value: [0.14, 0.13, 0.11] },
      uPulse: { value: 1 },
    },
  });

  const mesh = new Mesh(gl, { geometry, program });

  const resize = () => {
    const rect = stage.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    renderer.setSize(w, h);
    const dpr = renderer.dpr;
    program.uniforms.uResolution.value = [w * dpr, h * dpr];
  };

  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(stage);

  // Pause quand hors viewport — économise GPU.
  let visible = true;
  const io = new IntersectionObserver(
    ([entry]) => { visible = entry.isIntersecting; },
    { rootMargin: "200px" }
  );
  io.observe(canvas);

  if (reduced || isLowEnd) {
    // Frame statique, pas d'animation continue.
    program.uniforms.uTime.value = 1.2;
    renderer.render({ scene: mesh });
    return;
  }

  const t0 = performance.now();

  const tick = (now: number) => {
    requestAnimationFrame(tick);
    if (!visible) return;

    const t = (now - t0) * 0.001;
    program.uniforms.uTime.value = t;

    // Pomodoro pulse — cycle 30s (25s focus breathing + 5s rest swell).
    // Module la section du tube pour qu'il respire.
    const CYCLE = 30;
    const phase = t % CYCLE;
    let pulse: number;
    if (phase < 25) {
      pulse = Math.sin(phase * 0.8) * 0.04;
    } else {
      const restT = (phase - 25) / 5;
      pulse = Math.sin(restT * Math.PI) * 0.15;
    }
    program.uniforms.uPulse.value = 1 + pulse;

    renderer.render({ scene: mesh });
  };

  requestAnimationFrame(tick);
}
