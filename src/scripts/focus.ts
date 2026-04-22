import { Renderer, Camera, Transform, Torus, Program, Mesh, Color } from "ogl";

const vertex = /* glsl */ `
  attribute vec3 position;
  attribute vec3 normal;

  uniform mat3 normalMatrix;
  uniform mat4 modelMatrix;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform vec3 cameraPosition;

  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vView = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;

  varying vec3 vNormal;
  varying vec3 vView;

  uniform float uTime;
  uniform vec3 uInk;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vec3 L = normalize(vec3(0.45, 0.85, 0.5));
    float lambert = clamp(dot(vNormal, L), 0.0, 1.0);

    // Silhouette darken (fresnel-like)
    float fres = 1.0 - clamp(dot(vView, vNormal), 0.0, 1.0);
    fres = pow(fres, 2.2);

    // Base shade : ink darkened at rim, lightened at light face — still near-black overall
    vec3 base = mix(uInk * 0.35, uInk, lambert);
    base = mix(base, uInk * 0.12, fres * 0.7);

    // Grain — fine screen-space noise, low magnitude
    float grain = noise(gl_FragCoord.xy * 0.85 + uTime * 0.25) - 0.5;
    base += grain * 0.03;

    gl_FragColor = vec4(base, 1.0);
  }
`;

export function initFocus(reduced: boolean) {
  const canvas = document.querySelector<HTMLCanvasElement>("[data-focus-canvas]");
  if (!canvas) return;

  const stage = canvas.parentElement as HTMLElement | null;
  if (!stage) return;

  // Détecte les devices "modestes" : peu de RAM ou peu de coeurs.
  // Sur ces devices on rend une frame statique au lieu d'animer en continu.
  type NavExt = Navigator & { deviceMemory?: number };
  const nav = navigator as NavExt;
  const lowMem = typeof nav.deviceMemory === "number" && nav.deviceMemory < 4;
  const lowCpu = (nav.hardwareConcurrency ?? 4) < 4;
  const isLowEnd = lowMem || lowCpu;

  const renderer = new Renderer({
    canvas,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    alpha: true,
    antialias: true,
  });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);

  const camera = new Camera(gl, { fov: 32 });
  camera.lookAt([0, 0, 0]);

  const MOBILE_BP = 768;
  const updateCameraZ = () => {
    const isMobile = window.innerWidth < MOBILE_BP;
    camera.position.set(0, 0.45, isMobile ? 5.0 : 6.8);
  };
  updateCameraZ();

  const scene = new Transform();

  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      uTime: { value: 0 },
      uInk: { value: new Color(0.1, 0.095, 0.085) },
    },
  });

  const geometry = new Torus(gl, {
    radius: 1.05,
    tube: 0.3,
    radialSegments: 72,
    tubularSegments: 36,
  });

  const mesh = new Mesh(gl, { geometry, program });
  mesh.setParent(scene);

  const resize = () => {
    const rect = stage.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    renderer.setSize(w, h);
    camera.perspective({ aspect: w / h });
    updateCameraZ();
  };

  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(stage);

  // Pause quand hors viewport
  let visible = true;
  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { rootMargin: "200px" }
  );
  io.observe(canvas);

  if (reduced || isLowEnd) {
    // Rendu statique (1 frame à une rotation plaisante), pas d'animation continue.
    mesh.rotation.x = 0.6;
    mesh.rotation.y = 0.45;
    program.uniforms.uTime.value = 0.8;
    renderer.render({ scene, camera });
    return;
  }

  const t0 = performance.now();

  const tick = (now: number) => {
    requestAnimationFrame(tick);
    if (!visible) return;

    const t = (now - t0) * 0.001;
    program.uniforms.uTime.value = t;

    // Rotation lente, deux axes
    mesh.rotation.x = t * 0.18;
    mesh.rotation.y = t * 0.24;

    // Pomodoro pulse — cycle 30s (25s focus breathing + 5s rest swell)
    const CYCLE = 30;
    const phase = t % CYCLE;
    let pulse: number;
    if (phase < 25) {
      pulse = Math.sin(phase * 0.8) * 0.012;
    } else {
      const restT = (phase - 25) / 5; // 0 → 1
      pulse = Math.sin(restT * Math.PI) * 0.05;
    }
    const s = 1 + pulse;
    mesh.scale.set(s, s, s);

    renderer.render({ scene, camera });
  };

  requestAnimationFrame(tick);
}
