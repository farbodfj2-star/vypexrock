"use client";

/**
 * WebGL fragment-shader nebula. Hand-rolled, zero deps.
 *
 * Renders a full-screen quad with a procedural FBM noise field tinted
 * with cinematic cyan/violet/fuchsia gradients. Reacts to:
 *   - time (slow drift)
 *   - pointer position
 *   - scroll progress (the camera-feel via uScroll)
 *
 * Falls back gracefully (renders nothing) if WebGL is unavailable.
 */

import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 a;
varying vec2 v;
void main(){ v = a*0.5+0.5; gl_Position = vec4(a, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
varying vec2 v;
uniform float uT;
uniform vec2 uR;
uniform vec2 uM;
uniform float uScroll;
uniform float uDpr;

// Hash + value-noise + FBM
float hash21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i=floor(p); vec2 f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash21(i+vec2(0,0)),hash21(i+vec2(1,0)),u.x),
             mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),u.x), u.y);
}
float fbm(vec2 p){
  float v=0.0; float a=0.5;
  for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.02; a*=0.5; }
  return v;
}

void main(){
  vec2 uv = v;
  vec2 p = (gl_FragCoord.xy - 0.5*uR) / min(uR.x,uR.y);

  // Camera dolly via scroll
  float zoom = 1.0 - 0.18*uScroll;
  p *= zoom;
  p.y -= 0.05*uScroll;

  // Pointer parallax
  vec2 mp = (uM/uR - 0.5);
  p += mp*0.05;

  // Animated nebula field
  float t = uT*0.04;
  float n1 = fbm(p*1.6 + vec2(t, -t*0.6));
  float n2 = fbm(p*2.2 - vec2(t*0.4, t*0.7) + n1);
  float n3 = fbm(p*4.0 + n2*0.7 - vec2(t*0.2, t*0.9));

  // Color palette — cyan / violet / fuchsia / deep navy
  vec3 cBg     = vec3(0.008, 0.012, 0.024);
  vec3 cDeep   = vec3(0.02, 0.05, 0.10);
  vec3 cCyan   = vec3(0.36, 0.92, 0.83);   // 5eead4
  vec3 cViolet = vec3(0.65, 0.55, 0.98);   // a78bfa
  vec3 cFuchs  = vec3(0.91, 0.47, 0.97);   // e879f9

  vec3 col = cBg;
  col = mix(col, cDeep, smoothstep(0.0, 0.6, n1));
  col = mix(col, cCyan*0.55, smoothstep(0.45, 0.95, n2)*0.55);
  col = mix(col, cViolet*0.65, smoothstep(0.5, 1.0, n2*n3)*0.65);
  col = mix(col, cFuchs*0.6, smoothstep(0.7, 1.0, n3)*0.35);

  // Soft volumetric god-rays from upper-right
  vec2 lp = vec2(0.85, 0.85) - uv;
  float ray = exp(-dot(lp,lp)*4.0);
  col += cCyan*ray*0.06;

  // Vignette
  float r = length(p);
  col *= 1.0 - smoothstep(0.55, 1.4, r)*0.85;

  // Filmic-ish curve
  col = col / (1.0 + col);
  col = pow(col, vec3(0.85));

  // Subtle grain so it never looks plastic
  float g = (hash21(gl_FragCoord.xy + uT) - 0.5) * 0.025;
  col += g;

  gl_FragColor = vec4(col, 1.0);
}
`;

type Props = {
  className?: string;
  /** Layered intensity multiplier (0..1). Useful when rendered behind dense content. */
  intensity?: number;
};

export function WebglAtmosphere({ className, intensity = 1 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (typeof window === "undefined") return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const gl =
      (canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true }) as WebGLRenderingContext | null) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return; // Graceful no-op fallback

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        // eslint-disable-next-line no-console
        console.warn("[vx-atmosphere] shader error", gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;

    gl.useProgram(prog);

    // Fullscreen triangle
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aLoc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(aLoc);
    gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);

    const uT = gl.getUniformLocation(prog, "uT");
    const uR = gl.getUniformLocation(prog, "uR");
    const uM = gl.getUniformLocation(prog, "uM");
    const uScroll = gl.getUniformLocation(prog, "uScroll");
    const uDpr = gl.getUniformLocation(prog, "uDpr");

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0, h = 0;
    let mouseX = window.innerWidth * 0.5;
    let mouseY = window.innerHeight * 0.4;
    let scroll = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(2, Math.floor(rect.width * dpr));
      h = Math.max(2, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) * dpr;
      mouseY = (rect.height - (e.clientY - rect.top)) * dpr; // GL y-up
    };

    const onScroll = () => {
      const docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scroll = Math.max(0, Math.min(1, window.scrollY / docH));
    };

    resize();
    onScroll();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    let raf = 0;
    let last = performance.now();
    let visible = true;
    const start = performance.now();

    // Visibility observer — pause when offscreen
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.01 }
    );
    io.observe(canvas);

    // Pause when document hidden
    const onVis = () => {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      } else if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    const loop = (t: number) => {
      const dt = Math.min(64, t - last);
      last = t;

      if (visible && !document.hidden) {
        const elapsed = (t - start) * (reduceMotion ? 0.05 : 1) * 0.001 * intensity;
        gl.uniform1f(uT, elapsed * 4);
        gl.uniform2f(uR, w, h);
        gl.uniform2f(uM, mouseX, mouseY);
        gl.uniform1f(uScroll, scroll);
        gl.uniform1f(uDpr, dpr);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      raf = requestAnimationFrame(loop);
      void dt;
    };

    raf = requestAnimationFrame(loop);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
      try {
        gl.deleteProgram(prog);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        gl.deleteBuffer(buf);
        const ext = gl.getExtension("WEBGL_lose_context");
        ext?.loseContext();
      } catch {
        // no-op
      }
    };
  }, [intensity]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
