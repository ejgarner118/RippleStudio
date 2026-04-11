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

const DampedOrbitControls = forwardRef<OrbitControlsApi>(function DampedOrbitControls(
  _props,
  ref,
) {
  const { camera, gl } = useThree();
  const ctrlRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const c = new OrbitControls(camera, gl.domElement);
    c.enableDamping = true;
    c.dampingFactor = 0.08;
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
        camera.position.set(...DEFAULT_CAM);
        c.target.set(0, 0, 0);
        c.update();
      },
    }),
    [camera],
  );

  useFrame(() => ctrlRef.current?.update());
  return null;
});

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
}: SceneInnerProps) {
  const grid = useMemo(
    () => new THREE.GridHelper(28, 28, gridMajor, gridMinor),
    [gridMajor, gridMinor],
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
      <DampedOrbitControls ref={orbitRef} />
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
              color="#5a8f5a"
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
}: BoardScene3DProps) {
  const background = isDark ? "#1a1f28" : "#e8ecf4";
  const outlineColor = isDark ? 0x6ab0ff : 0x1a5fb4;
  const gridMajor = isDark ? 0x4a5568 : 0xb0b8c8;
  const gridMinor = isDark ? 0x3d4556 : 0xc8ccd8;

  return (
    <Canvas dpr={[1, 2]} camera={{ position: DEFAULT_CAM, fov: 50 }}>
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
      />
    </Canvas>
  );
}
