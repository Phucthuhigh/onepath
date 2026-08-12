"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// Nodes sit on a triangular/hex-packed lattice (every interior node has 6
// equidistant neighbours) — this is what reads as a dense honeycomb mesh.
// Topology (who connects to whom) is computed once from the ideal grid, then
// jitter/wobble/mouse-pull only ever displaces node positions, never the
// connections — so the mesh stays structured instead of degrading into noise.
const COL_SPACING = 1.05;
const ROW_SPACING = COL_SPACING * (Math.sqrt(3) / 2);
const X_HALF = 9.5;
const Y_HALF = 6;
const Z_JITTER = 1.1;
const XY_JITTER = COL_SPACING * 0.15;
const NEIGHBOR_THRESHOLD = COL_SPACING * 1.15;

const WOBBLE_AMP = 0.11;
const WOBBLE_SPEED = 0.6;

const INFLUENCE_RADIUS = 3.2; // how far a node "feels" the cursor
const PULL_STRENGTH = 0.8; // how far toward the cursor a fully-influenced node reaches
const FOLLOW_EASE = 0.09; // how quickly a node eases toward its (mouse-pulled) target

const RED = new THREE.Color("#dc2626");
const DIM = new THREE.Color("#8b93a1");

function buildLattice() {
  const points: { x: number; y: number }[] = [];
  const cols = Math.ceil((X_HALF * 2) / COL_SPACING) + 1;
  const rows = Math.ceil((Y_HALF * 2) / ROW_SPACING) + 1;

  for (let row = 0; row < rows; row++) {
    const y = -Y_HALF + row * ROW_SPACING;
    const rowOffset = row % 2 === 1 ? COL_SPACING / 2 : 0;
    for (let col = 0; col < cols; col++) {
      const x = -X_HALF + col * COL_SPACING + rowOffset;
      if (x > X_HALF + COL_SPACING / 2) continue;
      points.push({ x, y });
    }
  }
  return points;
}

export function NetworkBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.z = 9;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // --- lattice nodes ---
    const lattice = buildLattice();
    const nodeCount = lattice.length;

    // latticePositions: the node's ideal, unmoving "home" slot (used only to
    // derive topology). basePositions: home slot + a fixed per-node jitter +
    // per-frame wobble. positions: what's actually rendered, eased toward
    // (basePosition + pull-toward-cursor).
    const latticePositions = new Float32Array(nodeCount * 3);
    const jitter = new Float32Array(nodeCount * 3);
    const phase = new Float32Array(nodeCount);
    const basePositions = new Float32Array(nodeCount * 3);
    const positions = new Float32Array(nodeCount * 3);

    for (let i = 0; i < nodeCount; i++) {
      const ix = i * 3;
      const p = lattice[i];
      latticePositions[ix] = p.x;
      latticePositions[ix + 1] = p.y;
      latticePositions[ix + 2] = 0;
      jitter[ix] = (Math.random() - 0.5) * XY_JITTER;
      jitter[ix + 1] = (Math.random() - 0.5) * XY_JITTER;
      jitter[ix + 2] = (Math.random() - 0.5) * Z_JITTER;
      phase[i] = Math.random() * Math.PI * 2;

      basePositions[ix] = p.x + jitter[ix];
      basePositions[ix + 1] = p.y + jitter[ix + 1];
      basePositions[ix + 2] = jitter[ix + 2];
      positions[ix] = basePositions[ix];
      positions[ix + 1] = basePositions[ix + 1];
      positions[ix + 2] = basePositions[ix + 2];
    }

    const colors = new Float32Array(nodeCount * 3);
    for (let i = 0; i < nodeCount; i++) {
      const c = Math.random() < 0.14 ? RED : DIM;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pointsGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const pointsMaterial = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });
    const pointCloud = new THREE.Points(pointsGeometry, pointsMaterial);
    scene.add(pointCloud);

    // --- edges: computed once from the ideal (unjittered) lattice, fixed for the component's lifetime ---
    const edges: [number, number][] = [];
    const thresholdSq = NEIGHBOR_THRESHOLD * NEIGHBOR_THRESHOLD;
    for (let i = 0; i < nodeCount; i++) {
      const ix = i * 3;
      for (let j = i + 1; j < nodeCount; j++) {
        const jx = j * 3;
        const dx = latticePositions[ix] - latticePositions[jx];
        const dy = latticePositions[ix + 1] - latticePositions[jx + 1];
        const distSq = dx * dx + dy * dy;
        if (distSq < thresholdSq) edges.push([i, j]);
      }
    }

    const linePositions = new Float32Array(edges.length * 2 * 3);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x3a4150,
      transparent: true,
      opacity: 0.4,
    });
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // --- mouse tracking: project screen position into world space on the
    // z=0 plane the lattice is centered on, via raycasting ---
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2(10, 10);
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const mouseWorld = new THREE.Vector3();
    let hasPointer = false;

    function onPointerMove(e: PointerEvent) {
      const rect = container!.getBoundingClientRect();
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      hasPointer = true;
    }
    function onPointerLeave() {
      hasPointer = false;
    }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerleave", onPointerLeave);

    function onResize() {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener("resize", onResize);

    let rafId = 0;
    let disposed = false;
    let t = 0;
    const influenceSq = INFLUENCE_RADIUS * INFLUENCE_RADIUS;

    function tick() {
      if (disposed) return;
      t += 1;

      if (hasPointer) {
        raycaster.setFromCamera(pointerNdc, camera);
        raycaster.ray.intersectPlane(groundPlane, mouseWorld);
      }

      for (let i = 0; i < nodeCount; i++) {
        const ix = i * 3;
        const wobble = Math.sin(t * 0.016 * WOBBLE_SPEED + phase[i]) * WOBBLE_AMP;

        let targetX = basePositions[ix] + wobble;
        let targetY = basePositions[ix + 1] + wobble * 0.7;
        let targetZ = basePositions[ix + 2] + wobble * 0.5;

        if (hasPointer) {
          const dx = mouseWorld.x - targetX;
          const dy = mouseWorld.y - targetY;
          const dz = mouseWorld.z - targetZ;
          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq < influenceSq && distSq > 0.0001) {
            const dist = Math.sqrt(distSq);
            const pull = (1 - dist / INFLUENCE_RADIUS) * PULL_STRENGTH;
            targetX += dx * pull;
            targetY += dy * pull;
            targetZ += dz * pull;
          }
        }

        positions[ix] += (targetX - positions[ix]) * FOLLOW_EASE;
        positions[ix + 1] += (targetY - positions[ix + 1]) * FOLLOW_EASE;
        positions[ix + 2] += (targetZ - positions[ix + 2]) * FOLLOW_EASE;
      }
      (pointsGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;

      for (let e = 0; e < edges.length; e++) {
        const [i, j] = edges[e];
        const ix = i * 3;
        const jx = j * 3;
        const li = e * 6;
        linePositions[li] = positions[ix];
        linePositions[li + 1] = positions[ix + 1];
        linePositions[li + 2] = positions[ix + 2];
        linePositions[li + 3] = positions[jx];
        linePositions[li + 4] = positions[jx + 1];
        linePositions[li + 5] = positions[jx + 2];
      }
      (lineGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(tick);
    }

    if (reducedMotion) {
      renderer.render(scene, camera);
    } else {
      tick();
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", onResize);
      pointsGeometry.dispose();
      pointsMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div ref={containerRef} aria-hidden="true" className="pointer-events-none absolute inset-0" />
  );
}
