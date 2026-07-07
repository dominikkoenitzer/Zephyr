import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';

// Full-viewport WebGL aurora (React Bits-style, built on ogl).
// Sits behind the app shell; the translucent header/sidebar/cards let it
// glow through. Theme-aware (watches the `dark` class on <html>), skipped
// entirely under prefers-reduced-motion, and lazy-loaded from AppLayout so
// it never blocks first paint.

const VERTEX = /* glsl */ `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform float uTime;
uniform float uIntensity;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = vUv;

  // Colour ramp across x, gently drifting so the hues wander over time.
  float t = clamp(uv.x + 0.18 * snoise(vec2(uv.x * 1.4 + uTime * 0.03, uTime * 0.04)), 0.0, 1.0);
  vec3 ramp = t < 0.5
    ? mix(uColorA, uColorB, smoothstep(0.0, 0.5, t))
    : mix(uColorB, uColorC, smoothstep(0.5, 1.0, t));

  // Two octaves of noise shape the wavy lower edge of the glow.
  float n = snoise(vec2(uv.x * 2.2 + uTime * 0.08, uTime * 0.12)) * 0.5
          + snoise(vec2(uv.x * 4.5 - uTime * 0.05, uTime * 0.09)) * 0.25;

  float edge = 0.78 + n * 0.16;
  float band = smoothstep(edge - 0.38, edge + 0.06, uv.y); // glow hugs the top
  float fade = smoothstep(0.30, 0.95, uv.y);               // dissolve lower down
  float a = band * fade * uIntensity;

  // Premultiplied alpha out.
  fragColor = vec4(ramp * a, a);
}
`;

const hex = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

// Blue → violet → cyan, matching the primary palette.
const THEMES = {
  dark: {
    colors: [hex('#2563eb'), hex('#7c3aed'), hex('#06b6d4')],
    intensity: 0.55,
  },
  light: {
    colors: [hex('#60a5fa'), hex('#a78bfa'), hex('#22d3ee')],
    intensity: 0.32,
  },
};

function AuroraBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const container = containerRef.current;
    let renderer;
    try {
      renderer = new Renderer({
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      });
    } catch {
      return undefined; // No WebGL — quietly render nothing.
    }

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    container.appendChild(gl.canvas);
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    gl.canvas.style.display = 'block';

    const theme = () =>
      document.documentElement.classList.contains('dark') ? THEMES.dark : THEMES.light;

    const initial = theme();
    const program = new Program(gl, {
      vertex: VERTEX,
      fragment: FRAGMENT,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: initial.intensity },
        uColorA: { value: initial.colors[0] },
        uColorB: { value: initial.colors[1] },
        uColorC: { value: initial.colors[2] },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const applyTheme = () => {
      const t = theme();
      program.uniforms.uIntensity.value = t.intensity;
      program.uniforms.uColorA.value = t.colors[0];
      program.uniforms.uColorB.value = t.colors[1];
      program.uniforms.uColorC.value = t.colors[2];
    };
    const observer = new MutationObserver(applyTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const resize = () => renderer.setSize(container.clientWidth, container.clientHeight);
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    const start = performance.now();
    const loop = (now) => {
      program.uniforms.uTime.value = (now - start) / 1000;
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('resize', resize);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      gl.canvas.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none"
    />
  );
}

export default AuroraBackground;
