import type { RefObject } from "react";
import {
  Suspense,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SCALE_3D } from "../constants";
import type { CenterMm, LoftMeshData } from "../types/view";

export type OrbitControlsApi = { reset: () => void };

const DEFAULT_CAM: [number, number, number] = [1.8, 1.2, 2.4];
const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0);

/** World-space bounds of outline + loft after the same centering as the scene group. */
function computeWorldContentBox(
  outlineLowerXy: Float32Array,
  outlineUpperXy: Float32Array,
  loft: LoftMeshData | null,
  showLoft: boolean,
  centerMm: CenterMm,
  S: number,
): THREE.Box3 {
  const box = new THREE.Box3();
  const cx = centerMm.x * S;
  const cz = centerMm.y * S;

  const expandOutline = (xy: Float32Array) => {
    for (let i = 0; i + 1 < xy.length; i += 2) {
      const wx = xy[i]! * S - cx;
      const wz = xy[i + 1]! * S - cz;
      box.expandByPoint(new THREE.Vector3(wx, 0, wz));
    }
  };
  expandOutline(outlineLowerXy);
  expandOutline(outlineUpperXy);

  if (showLoft && loft && loft.positions.length >= 3) {
    const p = loft.positions;
    for (let i = 0; i < p.length; i += 3) {
      box.expandByPoint(
        new THREE.Vector3(p[i]! * S - cx, p[i + 1]! * S, p[i + 2]! * S - cz),
      );
    }
  }

  if (!box.isEmpty()) {
    return box;
  }
  return new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(1.5, 0.35, 0.45),
  );
}

function fitPerspectiveCameraToBox(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  box: THREE.Box3,
  margin = 1.28,
): void {
  const sphere = new THREE.Sphere();
  box.getBoundingSphere(sphere);
  if (!Number.isFinite(sphere.radius) || sphere.radius < 1e-6) {
    sphere.radius = 0.5;
  }
  const vFovRad = (camera.fov * Math.PI) / 180;
  const dist = (sphere.radius / Math.sin(vFovRad / 2)) * margin;
  const dir = new THREE.Vector3(1.15, 0.82, 1.25).normalize();
  camera.position.copy(sphere.center).add(dir.multiplyScalar(dist));
  controls.target.copy(sphere.center);
  camera.near = Math.max(dist / 200, 0.02);
  camera.far = Math.max(dist * 80, 500);
  camera.updateProjectionMatrix();
  controls.update();
}

function resetCameraDefault(camera: THREE.PerspectiveCamera, controls: OrbitControls): void {
  camera.position.set(...DEFAULT_CAM);
  controls.target.copy(DEFAULT_TARGET);
  camera.near = 0.1;
  camera.far = 2000;
  camera.updateProjectionMatrix();
  controls.update();
}

function OutlinePolyline({
  positions,
  color,
  lineWidth,
}: {
  positions: Float32Array;
  color: number;
  lineWidth: number;
}) {
  const lineObject = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = positions.length / 2;
    const pos3 = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos3[i * 3] = positions[i * 2]! * SCALE_3D;
      pos3[i * 3 + 1] = 0;
      pos3[i * 3 + 2] = positions[i * 2 + 1]! * SCALE_3D;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos3, 3));
    const m = new THREE.LineBasicMaterial({ color, linewidth: lineWidth });
    return new THREE.Line(g, m);
  }, [positions, color, lineWidth]);
  return <primitive object={lineObject} />;
}

function LoftMesh({
  positions,
  indices,
  color,
}: {
  positions: Float32Array;
  indices: Uint32Array;
  color: string;
}) {
  const mesh = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setIndex(new THREE.BufferAttribute(indices, 1));
    g.computeVertexNormals();
    const m = new THREE.MeshStandardMaterial({
      color,
      side: THREE.DoubleSide,
      flatShading: false,
      metalness: 0.05,
      roughness: 0.55,
      emissive: new THREE.Color(color).multiplyScalar(0.12),
    });
    const meshObj = new THREE.Mesh(g, m);
    meshObj.scale.set(SCALE_3D, SCALE_3D, SCALE_3D);
    return meshObj;
  }, [positions, indices, color]);
  return <primitive object={mesh} />;
}

type DampedOrbitControlsProps = { contentBox: THREE.Box3 };

const DampedOrbitControls = forwardRef<OrbitControlsApi, DampedOrbitControlsProps>(
  function DampedOrbitControls({ contentBox }, ref) {
    const { camera, gl } = useThree();
    const ctrlRef = useRef<OrbitControls | null>(null);
    const boxRef = useRef(contentBox);
    boxRef.current = contentBox;

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
      c.maxDistance = 800;

      // Match common 3D apps: left = orbit, middle = zoom, right = pan (same as three.js defaults; set explicitly for clarity).
      c.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
      c.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;
      c.mouseButtons.RIGHT = THREE.MOUSE.PAN;

      c.touches.ONE = THREE.TOUCH.ROTATE;
      c.touches.TWO = THREE.TOUCH.DOLLY_PAN;

      ctrlRef.current = c;
      return () => {
        ctrlRef.current = null;
        c.dispose();
      };
    }, [camera, gl]);

    useImperativeHandle(
      ref,
      () => ({
        reset() {
          const c = ctrlRef.current;
          if (!c) return;
          const cam = camera as THREE.PerspectiveCamera;
          if (cam.isPerspectiveCamera) {
            fitPerspectiveCameraToBox(cam, c, boxRef.current.clone());
          } else {
            resetCameraDefault(cam as THREE.PerspectiveCamera, c);
          }
        },
      }),
      [camera],
    );

    useFrame(() => ctrlRef.current?.update());
    return null;
  },
);

function ResetViewListener({
  nonce,
  apiRef,
}: {
  nonce: number;
  apiRef: RefObject<OrbitControlsApi | null>;
}) {
  const prev = useRef(0);
  useEffect(() => {
    if (nonce <= 0 || nonce === prev.current) return;
    prev.current = nonce;
    apiRef.current?.reset();
  }, [nonce, apiRef]);
  return null;
}

type SceneInnerProps = {
  outlineLowerXy: Float32Array;
  outlineUpperXy: Float32Array;
  loft: LoftMeshData | null;
  showLoft: boolean;
  centerMm: CenterMm;
  orbitRef: RefObject<OrbitControlsApi | null>;
  viewResetNonce: number;
  background: string;
  outlineColor: number;
  gridMajor: number;
  gridMinor: number;
  boardColor: string;
};

function SceneInner({
  outlineLowerXy,
  outlineUpperXy,
  loft,
  showLoft,
  centerMm,
  orbitRef,
  viewResetNonce,
  background,
  outlineColor,
  gridMajor,
  gridMinor,
  boardColor,
}: SceneInnerProps) {
  const grid = useMemo(
    () => new THREE.GridHelper(28, 28, gridMajor, gridMinor),
    [gridMajor, gridMinor],
  );

  const contentBox = useMemo(
    () =>
      computeWorldContentBox(
        outlineLowerXy,
        outlineUpperXy,
        loft,
        showLoft,
        centerMm,
        SCALE_3D,
      ),
    [outlineLowerXy, outlineUpperXy, loft, showLoft, centerMm],
  );

  const groupPos: [number, number, number] = [
    -centerMm.x * SCALE_3D,
    0,
    -centerMm.y * SCALE_3D,
  ];

  return (
    <>
      <color attach="background" args={[background]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[6, 10, 8]} intensity={0.95} />
      <directionalLight position={[-4, 2, -2]} intensity={0.35} />
      <DampedOrbitControls ref={orbitRef} contentBox={contentBox} />
      <ResetViewListener nonce={viewResetNonce} apiRef={orbitRef} />
      <group position={groupPos}>
        <primitive object={grid} />
        <Suspense fallback={null}>
          {outlineLowerXy.length >= 4 ? (
            <OutlinePolyline
              positions={outlineLowerXy}
              color={outlineColor}
              lineWidth={2}
            />
          ) : null}
          {outlineUpperXy.length >= 4 ? (
            <OutlinePolyline
              positions={outlineUpperXy}
              color={outlineColor}
              lineWidth={2}
            />
          ) : null}
          {showLoft && loft ? (
            <LoftMesh
              positions={loft.positions}
              indices={loft.indices}
              color={boardColor}
            />
          ) : null}
        </Suspense>
      </group>
    </>
  );
}

type BoardScene3DProps = {
  outlineLowerXy: Float32Array;
  outlineUpperXy: Float32Array;
  loft: LoftMeshData | null;
  showLoft: boolean;
  centerMm: CenterMm;
  isDark: boolean;
  orbitRef: RefObject<OrbitControlsApi | null>;
  viewResetNonce: number;
  boardColor: "sage" | "ocean" | "sand" | "charcoal";
};

export function BoardScene3D({
  outlineLowerXy,
  outlineUpperXy,
  loft,
  showLoft,
  centerMm,
  isDark,
  orbitRef,
  viewResetNonce,
  boardColor,
}: BoardScene3DProps) {
  const background = isDark ? "#1a1f28" : "#e8ecf4";
  const outlineColor = isDark ? 0x6ab0ff : 0x1a5fb4;
  const gridMajor = isDark ? 0x4a5568 : 0xb0b8c8;
  const gridMinor = isDark ? 0x3d4556 : 0xc8ccd8;
  const meshColor = boardColor === "ocean" ? "#3e7aa5" : boardColor === "sand" ? "#b69e73" : boardColor === "charcoal" ? "#4f545a" : "#5a8f5a";

  return (
    <Canvas
      dpr={[1, 2]}
      style={{ touchAction: "none" }}
      gl={{ antialias: true }}
      camera={{ position: DEFAULT_CAM, fov: 50, near: 0.1, far: 2000 }}
    >
      <SceneInner
        outlineLowerXy={outlineLowerXy}
        outlineUpperXy={outlineUpperXy}
        loft={loft}
        showLoft={showLoft}
        centerMm={centerMm}
        orbitRef={orbitRef}
        viewResetNonce={viewResetNonce}
        background={background}
        outlineColor={outlineColor}
        gridMajor={gridMajor}
        gridMinor={gridMinor}
        boardColor={meshColor}
      />
    </Canvas>
  );
}
