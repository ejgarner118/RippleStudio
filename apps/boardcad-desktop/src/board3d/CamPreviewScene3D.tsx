import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { ToolpathPreview } from "@boardcad/core";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type CamPreviewScene3DProps = {
  preview: ToolpathPreview | null;
  viewResetNonce: number;
};

const DEFAULT_CAM: [number, number, number] = [320, 220, 320];

function fitCameraToPreview(camera: THREE.PerspectiveCamera, controls: OrbitControls, preview: ToolpathPreview | null) {
  if (!preview) {
    camera.position.set(...DEFAULT_CAM);
    controls.target.set(0, 0, 0);
    controls.update();
    return;
  }
  const min = preview.bounds.min;
  const max = preview.bounds.max;
  const sizeX = Math.max(1, max[0] - min[0]);
  const sizeY = Math.max(1, max[2] - min[2]);
  const sizeZ = Math.max(1, max[1] - min[1]);
  const radius = Math.max(sizeX, sizeY, sizeZ) * 0.8;
  const fovRad = (camera.fov * Math.PI) / 180;
  const dist = (radius / Math.sin(fovRad / 2)) * 1.25;
  const dir = new THREE.Vector3(1.1, 0.82, 1.18).normalize();
  camera.position.copy(dir.multiplyScalar(dist));
  camera.near = Math.max(0.1, dist / 100);
  camera.far = Math.max(4000, dist * 20);
  camera.updateProjectionMatrix();
  controls.target.set(0, 0, 0);
  controls.update();
}

function CamOrbitControls({ preview, viewResetNonce }: CamPreviewScene3DProps) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControls | null>(null);
  const prevResetRef = useRef(0);

  useEffect(() => {
    const c = new OrbitControls(camera, gl.domElement);
    c.enableDamping = true;
    c.dampingFactor = 0.08;
    c.enablePan = true;
    c.enableRotate = true;
    c.enableZoom = true;
    c.screenSpacePanning = true;
    c.rotateSpeed = 0.85;
    c.panSpeed = 0.75;
    c.zoomSpeed = 0.9;
    c.minDistance = 0.15;
    c.maxDistance = 12000;
    c.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
    c.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;
    c.mouseButtons.RIGHT = THREE.MOUSE.PAN;
    c.touches.ONE = THREE.TOUCH.ROTATE;
    c.touches.TWO = THREE.TOUCH.DOLLY_PAN;
    controlsRef.current = c;
    fitCameraToPreview(camera as THREE.PerspectiveCamera, c, preview);
    return () => {
      controlsRef.current = null;
      c.dispose();
    };
  }, [camera, gl]);

  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return;
    fitCameraToPreview(camera as THREE.PerspectiveCamera, c, preview);
  }, [preview, camera]);

  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return;
    if (viewResetNonce <= 0 || viewResetNonce === prevResetRef.current) return;
    prevResetRef.current = viewResetNonce;
    fitCameraToPreview(camera as THREE.PerspectiveCamera, c, preview);
  }, [viewResetNonce, preview, camera]);

  useFrame(() => controlsRef.current?.update());
  return null;
}

function buildGeometry(
  preview: ToolpathPreview | null,
  predicate: (curr: ToolpathPreview["points"][number]) => boolean,
): THREE.BufferGeometry | null {
  if (!preview || preview.points.length < 2) return null;
  const verts: number[] = [];
  for (let i = 1; i < preview.points.length; i++) {
    const prev = preview.points[i - 1]!;
    const curr = preview.points[i]!;
    if (!predicate(curr)) continue;
    verts.push(prev.x, prev.z, prev.y, curr.x, curr.z, curr.y);
  }
  if (verts.length === 0) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  return g;
}

export function CamPreviewScene3D({ preview, viewResetNonce }: CamPreviewScene3DProps) {
  const roughCutGeometry = useMemo(
    () => buildGeometry(preview, (p) => !(p.rapid ?? false) && p.feed >= 2200),
    [preview],
  );
  const finishCutGeometry = useMemo(
    () => buildGeometry(preview, (p) => !(p.rapid ?? false) && p.feed < 2200),
    [preview],
  );
  const rapidGeometry = useMemo(() => buildGeometry(preview, (p) => p.rapid ?? false), [preview]);
  const center = useMemo<[number, number, number]>(() => {
    if (!preview) return [0, 0, 0];
    const min = preview.bounds.min;
    const max = preview.bounds.max;
    return [(min[0] + max[0]) / 2, (min[2] + max[2]) / 2, (min[1] + max[1]) / 2];
  }, [preview]);

  return (
    <Canvas camera={{ position: DEFAULT_CAM, fov: 50, near: 1, far: 4000 }}>
      <color attach="background" args={["#0f1726"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[120, 220, 140]} intensity={0.9} />
      <CamOrbitControls preview={preview} viewResetNonce={viewResetNonce} />
      <gridHelper args={[1200, 24, 0x355680, 0x223043]} position={[0, -0.01, 0]} />
      <group position={[-center[0], -center[1], -center[2]]}>
        {roughCutGeometry ? (
          <lineSegments geometry={roughCutGeometry}>
            <lineBasicMaterial color={0x38bdf8} />
          </lineSegments>
        ) : null}
        {finishCutGeometry ? (
          <lineSegments geometry={finishCutGeometry}>
            <lineBasicMaterial color={0x86efac} />
          </lineSegments>
        ) : null}
        {rapidGeometry ? (
          <lineSegments geometry={rapidGeometry}>
            <lineBasicMaterial color={0xfbbf24} />
          </lineSegments>
        ) : null}
      </group>
    </Canvas>
  );
}

