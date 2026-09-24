import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// ============================================================
// ECOSYSTEM FACTOR DATA (centralized, easy to expand)
// ============================================================
// Each factor: id, title, category, description. To add a new ecosystem
// factor, append an entry here AND assign userData.factorId on its group —
// no other interaction wiring is required.
const ecosystemFactors = [
  {
    id: "volcano",
    title: "Volcano",
    category: "Abiotic",
    description:
      "A massive quaking cone of molten rock at the heart of the desert. Active fissures paint the slopes with rivers of fresh lava, shaping the land and feeding the vents around it."
  },
  {
    id: "volcanicVent",
    title: "Volcanic Vent",
    category: "Abiotic",
    description:
      "A smoking fissure where superheated gases and minerals escape from beneath the planet's crust — a raw outlet of the ecosystem's hidden geothermal energy."
  },
  {
    id: "lichens",
    title: "Lichens",
    category: "Biotic",
    description:
      "Hardy mutualistic organisms clinging to the warm rocks. Among the first living pioneers, they slowly break bare stone down into soil, preparing the ground for more life."
  },
  {
    id: "mosses",
    title: "Mosses",
    category: "Biotic",
    description:
      "Soft green cushions tucked into sheltered hollows. They hold precious moisture against the burning rocks, letting dense patchy growth take root wherever the heat loosens its grip."
  },
  {
    id: "microbes",
    title: "Microbial Colonies",
    category: "Biotic",
    description:
      "Tiny extremophile bacteria and archaea that thrive in the steam-warm crevices near vents and lava. Invisible to the naked eye, they form the chemical bedrock of the whole web of life."
  },
  {
    id: "lavaCrickets",
    title: "Lava Crickets",
    category: "Biotic",
    description:
      "Heat-hardy crickets that hop across the scorched rocks beside the hot zones. Their black chitin lets them blend into the dark cinders while they graze on algae and tiny lichens."
  },
  {
    id: "volcanicLongicornBeetles",
    title: "Volcanic Longicorn Beetles",
    category: "Biotic",
    description:
      "Long-horned wood-boring beetles drawn to the warm spent timber left by lava flows. Their sweeping antennae sense heat and smoke from afar, guiding them to burnt trees where they raise their young."
  }
];

const factorById = Object.fromEntries(ecosystemFactors.map((f) => [f.id, f]));

// ============================================================
// SCENE SETUP
// ============================================================
const container = document.getElementById("scene");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0d18);
scene.fog = new THREE.Fog(0x14100b, 110, 260);

// ============================================================
// CAMERA
// ============================================================
const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  900
);
camera.position.set(0, 40, 52);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
container.appendChild(renderer.domElement);

// Orbit pivot: exact center of the spherical world. Do NOT change.
const PLANET_CENTER = new THREE.Vector3(0, 0, 0);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(PLANET_CENTER);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.maxPolarAngle = Math.PI * 0.85;
controls.minDistance = 12;
controls.maxDistance = 170;

// ============================================================
// LIGHTING (bright desert day)
// ============================================================
scene.add(new THREE.AmbientLight(0xffd4a0, 1.6));
scene.add(new THREE.HemisphereLight(0xffffff, 0xb08968, 1.5));

const sunLight = new THREE.DirectionalLight(0xfff0d8, 4.5);
sunLight.position.set(60, 50, 35);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.left = -70;
sunLight.shadow.camera.right = 70;
sunLight.shadow.camera.top = 70;
sunLight.shadow.camera.bottom = -70;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 250;
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0xffc8a0, 1.4);
fillLight.position.set(-50, 25, -40);
scene.add(fillLight);

// ============================================================
// HELPERS
// ============================================================
function random(min, max) {
  return min + Math.random() * (max - min);
}

function material(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.1, ...opts });
}

function addShadowing(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// ============================================================
// SPHERICAL WORLD
// ============================================================
const WORLD_RADIUS = 28;

// Volcano integration proportions (non-uniform: height boosted, width kept)
const VOLCANO_BASE_SCALE = 0.55;
const VOLCANO_HEIGHT_SCALE = VOLCANO_BASE_SCALE * 1.7;
const VOLCANO_BASE_Y = terrainHeightAt(0, 1, 0) - 0.3;

function terrainHeightAt(nx, ny, nz) {
  const base =
    Math.sin(nx * 7 + ny * 3) * 0.5 +
    Math.sin(ny * 5 + nz * 8) * 0.5 +
    Math.sin(nz * 6 + nx * 4) * 0.5;
  const coarse =
    Math.sin(nx * 3 + 1.7) * Math.sin(ny * 3) * Math.sin(nz * 3 + 0.6);
  const fine =
    Math.sin(nx * 14 + 2.1) * 0.5 + Math.sin(ny * 12 + 1.2) * 0.5;
  const bump = (base * 0.28 + coarse * 0.26 + fine * 0.18) * 0.75 + 0.5;
  return WORLD_RADIUS * (1.0 + THREE.MathUtils.clamp(bump, 0, 1) * 0.14);
}

function mountDirection(fx, fz) {
  return new THREE.Vector3(fx, 14, fz).normalize();
}

function mountOnSphere(group, fx, fz, spinY = 0) {
  const dir = mountDirection(fx, fz);
  group.position
    .copy(dir)
    .multiplyScalar(terrainHeightAt(dir.x, dir.y, dir.z) - 0.4);
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  group.rotateY(spinY);
}

function mountOnWorldSphere(group, dir, spinY = 0) {
  group.position
    .copy(dir)
    .multiplyScalar(terrainHeightAt(dir.x, dir.y, dir.z) - 0.4);
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  group.rotateY(spinY);
}

function randomWorldDirection(existingDirs, minDot) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const u = Math.random() * 2 - 1;
    const t = Math.random() * Math.PI * 2;
    const dir = new THREE.Vector3(
      Math.sqrt(1 - u * u) * Math.cos(t),
      u,
      Math.sqrt(1 - u * u) * Math.sin(t)
    );
    // Keep clear of the volcano cap at the north pole.
    if (dir.y > 0.9) continue;
    let tooClose = false;
    for (const d of existingDirs) {
      if (dir.dot(d) > minDot) {
        tooClose = true;
        break;
      }
    }
    if (!tooClose) return dir;
  }
  return null;
}

function createTerrain() {
  const terrainGeo = new THREE.SphereGeometry(WORLD_RADIUS, 96, 64);
  const tPos = terrainGeo.attributes.position;

  for (let i = 0; i < tPos.count; i++) {
    const x = tPos.getX(i);
    const y = tPos.getY(i);
    const z = tPos.getZ(i);
    const r = Math.sqrt(x * x + y * y + z * z);
    const nx = x / r;
    const ny = y / r;
    const nz = z / r;

    const base =
      Math.sin(nx * 7 + ny * 3) * 0.5 +
      Math.sin(ny * 5 + nz * 8) * 0.5 +
      Math.sin(nz * 6 + nx * 4) * 0.5;
    const coarse =
      Math.sin(nx * 3 + 1.7) * Math.sin(ny * 3) * Math.sin(nz * 3 + 0.6);
    const fine =
      Math.sin(nx * 14 + 2.1) * 0.5 + Math.sin(ny * 12 + 1.2) * 0.5;
    const bump =
      (base * 0.28 + coarse * 0.26 + fine * 0.18) * 0.75 + 0.5;

    const rad = r * (1.0 + THREE.MathUtils.clamp(bump, 0, 1) * 0.14);
    tPos.setXYZ(i, nx * rad, ny * rad, nz * rad);
  }

  terrainGeo.computeVertexNormals();

  const sphere = new THREE.Mesh(
    terrainGeo,
    material(0x2a2118)
  );
  sphere.receiveShadow = true;
  scene.add(sphere);

  const rockMat = material(0x33281d);
  const rockPositions = [
    [-6, 9, 0.9], [11, -8, 1.1], [9, 13, 0.8], [-13, -9, 1.0],
    [14, 3, 0.7], [-7, -12, 0.9], [18, -2, 1.0], [-16, 5, 0.8]
  ];
  rockPositions.forEach(([x, z, s]) => {
    const g = new THREE.Group();
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockMat);
    rock.rotation.set(random(0, 3), random(0, 3), random(0, 3));
    rock.position.y = s * 0.5;
    rock.scale.y = random(0.5, 0.8);
    g.add(addShadowing(rock));
    mountOnSphere(g, x, z, random(0, Math.PI * 2));
    scene.add(g);
  });
}

// ============================================================
// GEMINI VOLCANO MODEL
// ============================================================
function createVolcano() {
  const volcanoGroup = new THREE.Group();

  const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0x221e1e,
    roughness: 0.95,
    metalness: 0.05,
    flatShading: true
  });

  const darkRockMaterial = new THREE.MeshStandardMaterial({
    color: 0x151212,
    roughness: 0.98,
    metalness: 0.02,
    flatShading: true
  });

  const lavaMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4400,
    emissive: 0xff3300,
    emissiveIntensity: 1.4,
    roughness: 0.2,
    metalness: 0.1,
    flatShading: true
  });

  const deepLavaMaterial = new THREE.MeshStandardMaterial({
    color: 0xff5500,
    emissive: 0xff4400,
    emissiveIntensity: 1.9,
    roughness: 0.1,
    metalness: 0.1,
    flatShading: true
  });

  function hash(x, z) {
    let n = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453123;
    return n - Math.floor(n);
  }

  function noise2D(x, z) {
    let floorX = Math.floor(x);
    let floorZ = Math.floor(z);
    let fracX = x - floorX;
    let fracZ = z - floorZ;

    let u = fracX * fracX * (3.0 - 2.0 * fracX);
    let v = fracZ * fracZ * (3.0 - 2.0 * fracZ);

    let n00 = hash(floorX, floorZ);
    let n10 = hash(floorX + 1, floorZ);
    let n01 = hash(floorX, floorZ + 1);
    let n11 = hash(floorX + 1, floorZ + 1);

    let nx0 = n00 * (1.0 - u) + n10 * u;
    let nx1 = n01 * (1.0 - u) + n11 * u;

    return nx0 * (1.0 - v) + nx1 * v;
  }

  function fbm(x, z, octaves) {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1.0;

    for (let i = 0; i < octaves; i++) {
      value += amplitude * noise2D(x * frequency, z * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }

    return value;
  }

  const lavaChannels = [0.4, 2.1, 4.3, 5.2];

  function getDistanceToLavaChannel(angle, rad) {
    let minDiff = Infinity;

    for (let i = 0; i < lavaChannels.length; i++) {
      let chAngle = lavaChannels[i] + Math.sin(rad * 0.3 + i) * 0.2;
      let diff = Math.abs(angle - chAngle);
      diff = Math.min(diff, Math.PI * 2 - diff);

      if (diff < minDiff) minDiff = diff;
    }

    return minDiff;
  }

  const radius = 18;
  const height = 12;
  const radialSegments = 64;
  const heightSegments = 32;

  const mountainGeo = new THREE.ConeGeometry(
    radius,
    height,
    radialSegments,
    heightSegments,
    true
  );

  mountainGeo.translate(0, height / 2, 0);

  const posAttr = mountainGeo.attributes.position;

  for (let i = 0; i < posAttr.count; i++) {
    let vx = posAttr.getX(i);
    let vy = posAttr.getY(i);
    let vz = posAttr.getZ(i);

    const currentRad = Math.sqrt(vx * vx + vz * vz);

    let angle = Math.atan2(vz, vx);
    if (angle < 0) angle += Math.PI * 2;

    const normalizedHeight = vy / height;

    let profileFactor = Math.pow(1.0 - normalizedHeight, 1.8);
    let targetRadius = radius * profileFactor;

    const noiseVal = fbm(vx * 0.15, vz * 0.15, 4);
    const asymmetry = 1.0 + (noiseVal - 0.5) * 0.45;

    const ridgePattern =
      Math.sin(angle * 9) * 0.15 +
      Math.cos(angle * 15) * 0.1;

    targetRadius *= asymmetry + ridgePattern * profileFactor;

    const isCraterZone = normalizedHeight > 0.7;

    if (isCraterZone) {
      const craterRatio = (normalizedHeight - 0.7) / 0.3;

      const craterLipRadius =
        radius * Math.pow(1.0 - 0.7, 1.8) * 1.9;

      const craterDepthFactor =
        Math.sin(craterRatio * Math.PI * 0.5);

      targetRadius = THREE.MathUtils.lerp(
        targetRadius,
        craterLipRadius * (1.0 - craterDepthFactor * 0.55),
        craterRatio
      );

      vy -= craterDepthFactor * 4.2;
    }

    const distToChannel =
      getDistanceToLavaChannel(angle, currentRad);

    const channelWidth = 0.28;

    if (
      distToChannel < channelWidth &&
      normalizedHeight < 0.85 &&
      normalizedHeight > 0.05
    ) {
      const depth = Math.cos(
        (distToChannel / channelWidth) * (Math.PI / 2)
      );

      targetRadius -= depth * 0.8;
      vy -= depth * 0.3;
    }

    if (currentRad > 0.0001) {
      vx = (vx / currentRad) * targetRadius;
      vz = (vz / currentRad) * targetRadius;
    }

    posAttr.setXYZ(i, vx, vy, vz);
  }

  // Plant the volcano's base into the planet's spherical surface so the
  // lower body follows the curvature instead of a flat bottom.
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const y0 = posAttr.getY(i);
    const vz = posAttr.getZ(i);

    const nh = y0 / height;
    if (nh < 0 || nh > 0.35) continue;

    const wr = Math.sqrt(
      vx * vx * VOLCANO_BASE_SCALE * VOLCANO_BASE_SCALE +
        vz * vz * VOLCANO_BASE_SCALE * VOLCANO_BASE_SCALE
    );
    const surf = Math.sqrt(Math.max(0, WORLD_RADIUS * WORLD_RADIUS - wr * wr));
    const baseY = (surf - VOLCANO_BASE_Y) / VOLCANO_HEIGHT_SCALE;

    const fade = 1 - nh / 0.35;
    const smooth = fade * fade * (3 - 2 * fade);
    posAttr.setY(i, y0 + (baseY - y0) * smooth);
  }

  mountainGeo.computeVertexNormals();

  const mountainMesh =
    new THREE.Mesh(mountainGeo, rockMaterial);

  volcanoGroup.add(mountainMesh);

  const craterLavaGeo =
    new THREE.CylinderGeometry(1.9, 1.9, 0.4, 24);

  const craterLavaMesh =
    new THREE.Mesh(craterLavaGeo, deepLavaMaterial);

  craterLavaMesh.position.set(
    0,
    height * 0.71,
    0
  );

  volcanoGroup.add(craterLavaMesh);

  const lavaCoreGeo =
    new THREE.SphereGeometry(1.5, 16, 12);

  lavaCoreGeo.scale(1.1, 0.35, 1.1);

  const lavaCoreMesh =
    new THREE.Mesh(lavaCoreGeo, lavaMaterial);

  lavaCoreMesh.position.set(
    0,
    height * 0.72,
    0
  );

  volcanoGroup.add(lavaCoreMesh);

  lavaChannels.forEach((startAngle) => {
    const streamPoints = [];
    const numSteps = 28;

    for (let step = 0; step <= numSteps; step++) {
      const progress = step / numSteps;

      const h = THREE.MathUtils.lerp(
        height * 0.85,
        height * 0.05,
        progress
      );

      const r = THREE.MathUtils.lerp(
        1.9,
        radius * 0.92,
        Math.pow(progress, 0.6)
      );

      const angle =
        startAngle +
        Math.sin(progress * 4) * 0.15;

      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      const surfLocal =
        (Math.sqrt(
          Math.max(
            0,
            WORLD_RADIUS * WORLD_RADIUS -
              r * r * VOLCANO_BASE_SCALE * VOLCANO_BASE_SCALE
          )
        ) -
          VOLCANO_BASE_Y) /
        VOLCANO_HEIGHT_SCALE;

      const endBlend = THREE.MathUtils.clamp(
        (progress - 0.8) / 0.2,
        0,
        1
      );
      const y = THREE.MathUtils.lerp(
        h - 0.05,
        surfLocal,
        endBlend * endBlend * (3 - 2 * endBlend)
      );

      streamPoints.push(
        new THREE.Vector3(
          x,
          y,
          z
        )
      );
    }

    const curve =
      new THREE.CatmullRomCurve3(streamPoints);

    const tubeGeo =
      new THREE.TubeGeometry(
        curve,
        32,
        0.35,
        6,
        false
      );

    tubeGeo.scale(1.0, 0.35, 1.0);

    const tubeMesh =
      new THREE.Mesh(tubeGeo, lavaMaterial);

    volcanoGroup.add(tubeMesh);
  });

  const rockCount = 22;

  for (let i = 0; i < rockCount; i++) {
    const ang =
      (i / rockCount) * Math.PI * 2 +
      (Math.random() - 0.5) * 0.4;

    const dist =
      THREE.MathUtils.lerp(
        radius * 0.4,
        radius * 1.05,
        Math.random()
      );

    const scale =
      Math.random() * 1.8 + 0.6;

    const rockGeo =
      new THREE.DodecahedronGeometry(
        scale,
        1
      );

    const rPos = rockGeo.attributes.position;

    for (let j = 0; j < rPos.count; j++) {
      rPos.setXYZ(
        j,
        rPos.getX(j) +
          (Math.random() - 0.5) *
            0.3 *
            scale,

        rPos.getY(j) +
          (Math.random() - 0.5) *
            0.3 *
            scale,

        rPos.getZ(j) +
          (Math.random() - 0.5) *
            0.3 *
            scale
      );
    }

    rockGeo.computeVertexNormals();

    const rockMesh =
      new THREE.Mesh(
        rockGeo,
        Math.random() > 0.5
          ? rockMaterial
          : darkRockMaterial
      );

    const normH =
      1.0 -
      dist / (radius * 1.1);

    const terrainY =
      Math.max(
        0,
        normH * height * 0.85
      );

    const distScaled = dist * VOLCANO_BASE_SCALE;
    const planetY =
      (Math.sqrt(
        Math.max(
          0,
          WORLD_RADIUS * WORLD_RADIUS - distScaled * distScaled
        )
      ) -
        VOLCANO_BASE_Y) /
      VOLCANO_HEIGHT_SCALE;

    const flankBlend = THREE.MathUtils.clamp(normH * 2, 0, 1);
    const rockY =
      THREE.MathUtils.lerp(planetY, terrainY, flankBlend) -
      scale * 0.25;

    rockMesh.position.set(
      Math.cos(ang) * dist,
      rockY,
      Math.sin(ang) * dist
    );

    rockMesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    volcanoGroup.add(rockMesh);
  }

  const craterLight =
    new THREE.PointLight(
      0xff4400,
      4.5,
      25,
      1.5
    );

  craterLight.position.set(
    0,
    height * 0.85,
    0
  );

  volcanoGroup.add(craterLight);
  volcanoCraterLight = craterLight;

  return volcanoGroup;
}

function createVolcanicVent() {
  const ventGroup = new THREE.Group();

  const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0x1f1a1a,
    roughness: 0.95,
    metalness: 0.05,
    flatShading: true
  });

  const darkRockMaterial = new THREE.MeshStandardMaterial({
    color: 0x120f0f,
    roughness: 0.98,
    metalness: 0.02,
    flatShading: true
  });

  const deepInteriorMaterial = new THREE.MeshBasicMaterial({
    color: 0x050202
  });

  const glowingHeatMaterial = new THREE.MeshStandardMaterial({
    color: 0xff3300,
    emissive: 0xff2200,
    emissiveIntensity: 2.2,
    roughness: 0.2,
    metalness: 0.1,
    flatShading: true
  });

  const steamMaterial = new THREE.MeshStandardMaterial({
    color: 0xdddddd,
    roughness: 1.0,
    metalness: 0.0,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    flatShading: true
  });

  function hash(x, z) {
    let n = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453123;
    return n - Math.floor(n);
  }

  function noise2D(x, z) {
    let floorX = Math.floor(x);
    let floorZ = Math.floor(z);
    let fracX = x - floorX;
    let fracZ = z - floorZ;

    let u = fracX * fracX * (3.0 - 2.0 * fracX);
    let v = fracZ * fracZ * (3.0 - 2.0 * fracZ);

    let n00 = hash(floorX, floorZ);
    let n10 = hash(floorX + 1, floorZ);
    let n01 = hash(floorX, floorZ + 1);
    let n11 = hash(floorX + 1, floorZ + 1);

    let nx0 = n00 * (1.0 - u) + n10 * u;
    let nx1 = n01 * (1.0 - u) + n11 * u;

    return nx0 * (1.0 - v) + nx1 * v;
  }

  const outerRadius = 3.8;
  const innerRadius = 1.3;
  const ventHeight = 1.2;
  const radialSegments = 36;
  const ringSegments = 16;

  const ventGeo = new THREE.RingGeometry(
    innerRadius,
    outerRadius,
    radialSegments,
    ringSegments
  );

  ventGeo.rotateX(-Math.PI / 2);

  const posAttr = ventGeo.attributes.position;

  for (let i = 0; i < posAttr.count; i++) {
    let vx = posAttr.getX(i);
    let vy = posAttr.getY(i);
    let vz = posAttr.getZ(i);

    let distFromCenter = Math.sqrt(vx * vx + vz * vz);
    let normDist =
      (distFromCenter - innerRadius) /
      (outerRadius - innerRadius);

    let angle = Math.atan2(vz, vx);

    let noiseVal = noise2D(vx * 0.8 + 5.0, vz * 0.8 + 5.0);
    let rimIrregularity =
      Math.sin(angle * 5) * 0.25 +
      Math.cos(angle * 7) * 0.15;

    if (normDist < 0.3) {
      let t = normDist / 0.3;
      vy =
        Math.sin(t * Math.PI * 0.5) * ventHeight * 0.85 -
        ventHeight * 0.6;
    } else if (normDist < 0.7) {
      let t = (normDist - 0.3) / 0.4;
      vy =
        ventHeight *
        (0.85 + rimIrregularity * 0.3 + noiseVal * 0.2) *
        (1.0 - Math.pow(t - 0.5, 2) * 2.0);
    } else {
      let t = (normDist - 0.7) / 0.3;
      vy =
        (ventHeight * 0.5 + rimIrregularity * 0.1) *
        Math.pow(1.0 - t, 1.8);
    }

    let radialOffset =
      1.0 +
      (noiseVal - 0.5) * 0.35 +
      Math.sin(angle * 4) * 0.12;

    vx *= radialOffset;
    vz *= radialOffset;

    posAttr.setXYZ(i, vx, vy, vz);
  }

  ventGeo.computeVertexNormals();

  const ventMesh = new THREE.Mesh(ventGeo, rockMaterial);
  ventGroup.add(ventMesh);

  const throatGeo = new THREE.CylinderGeometry(
    innerRadius * 0.95,
    innerRadius * 0.6,
    2.5,
    18,
    4,
    true
  );

  throatGeo.translate(0, -1.55, 0);

  const throatPos = throatGeo.attributes.position;

  for (let i = 0; i < throatPos.count; i++) {
    let x = throatPos.getX(i);
    let z = throatPos.getZ(i);
    let y = throatPos.getY(i);

    let noise = noise2D(x * 1.5 + 12, z * 1.5 + 12) * 0.2;

    throatPos.setXYZ(
      i,
      x + noise,
      y,
      z + noise
    );
  }

  throatGeo.computeVertexNormals();

  const throatMesh = new THREE.Mesh(
    throatGeo,
    darkRockMaterial
  );

  ventGroup.add(throatMesh);

  const bottomCapGeo = new THREE.CircleGeometry(
    innerRadius * 0.65,
    16
  );

  bottomCapGeo.rotateX(-Math.PI / 2);
  bottomCapGeo.translate(0, -2.8, 0);

  const bottomCapMesh = new THREE.Mesh(
    bottomCapGeo,
    deepInteriorMaterial
  );

  ventGroup.add(bottomCapMesh);

  const glowCoreGeo = new THREE.DodecahedronGeometry(
    innerRadius * 0.6,
    1
  );

  glowCoreGeo.scale(1.1, 0.3, 1.1);

  const glowCoreMesh = new THREE.Mesh(
    glowCoreGeo,
    glowingHeatMaterial
  );

  glowCoreMesh.position.set(0, -1.8, 0);
  glowCoreMesh.rotation.set(0.2, 0.5, 0.1);

  ventGroup.add(glowCoreMesh);

  const veinGeo = new THREE.TorusGeometry(
    innerRadius * 0.85,
    0.08,
    6,
    16,
    Math.PI * 1.2
  );

  veinGeo.rotateX(Math.PI / 2 + 0.2);

  const veinMesh = new THREE.Mesh(
    veinGeo,
    glowingHeatMaterial
  );

  veinMesh.position.set(-0.1, -0.8, 0.1);
  ventGroup.add(veinMesh);

  const rockCount = 14;

  for (let i = 0; i < rockCount; i++) {
    let ang =
      (i / rockCount) * Math.PI * 2 +
      (Math.random() - 0.5) * 0.4;

    let dist = THREE.MathUtils.lerp(
      innerRadius * 1.2,
      outerRadius * 0.95,
      Math.random()
    );

    let size = Math.random() * 0.55 + 0.2;

    const cragGeo = new THREE.DodecahedronGeometry(
      size,
      1
    );

    const cragPos = cragGeo.attributes.position;

    for (let j = 0; j < cragPos.count; j++) {
      cragPos.setXYZ(
        j,
        cragPos.getX(j) +
          (Math.random() - 0.5) * 0.2 * size,
        cragPos.getY(j) +
          (Math.random() - 0.5) * 0.2 * size,
        cragPos.getZ(j) +
          (Math.random() - 0.5) * 0.2 * size
      );
    }

    cragGeo.computeVertexNormals();

    const cragMesh = new THREE.Mesh(
      cragGeo,
      Math.random() > 0.4
        ? darkRockMaterial
        : rockMaterial
    );

    let x = Math.cos(ang) * dist;
    let z = Math.sin(ang) * dist;

    let y =
      (1.0 -
        (dist - innerRadius) /
          (outerRadius - innerRadius)) *
      ventHeight *
      0.6;

    cragMesh.position.set(
      x,
      y + size * 0.3,
      z
    );

    cragMesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    ventGroup.add(cragMesh);
  }

  const crackCount = 5;

  for (let i = 0; i < crackCount; i++) {
    let crackAngle =
      (i / crackCount) * Math.PI * 2 +
      Math.random() * 0.5;

    let length = Math.random() * 1.2 + 1.0;

    const crackPoints = [];

    let startR = innerRadius * 1.1;
    let endR = startR + length;

    for (let step = 0; step <= 8; step++) {
      let t = step / 8;

      let currR =
        THREE.MathUtils.lerp(
          startR,
          endR,
          t
        );

      let currAng =
        crackAngle +
        Math.sin(t * Math.PI * 2) * 0.12;

      let cx = Math.cos(currAng) * currR;
      let cz = Math.sin(currAng) * currR;

      let cy =
        (1.0 -
          (currR - innerRadius) /
            (outerRadius - innerRadius)) *
        ventHeight *
        0.7 +
        0.02;

      crackPoints.push(
        new THREE.Vector3(
          cx,
          cy,
          cz
        )
      );
    }

    const crackCurve =
      new THREE.CatmullRomCurve3(
        crackPoints
      );

    const crackGeo =
      new THREE.TubeGeometry(
        crackCurve,
        12,
        0.04,
        4,
        false
      );

    crackGeo.scale(
      1.0,
      0.4,
      1.0
    );

    const crackMesh = new THREE.Mesh(
      crackGeo,
      darkRockMaterial
    );

    ventGroup.add(crackMesh);
  }

  const plumeCount = 6;

  for (let i = 0; i < plumeCount; i++) {
    let angleOffset =
      (i / plumeCount) * Math.PI * 2 +
      Math.random() * 0.3;

    let startRad =
      Math.random() *
      innerRadius *
      0.6;

    let startX =
      Math.cos(angleOffset) *
      startRad;

    let startZ =
      Math.sin(angleOffset) *
      startRad;

    const curvePoints = [];

    let plumeHeight =
      Math.random() * 2.5 + 3.0;

    let driftX =
      (Math.random() - 0.5) * 1.2;

    let driftZ =
      (Math.random() - 0.5) * 1.2;

    curvePoints.push(
      new THREE.Vector3(
        startX,
        -0.5,
        startZ
      )
    );

    curvePoints.push(
      new THREE.Vector3(
        startX * 1.2 +
          driftX * 0.3,
        plumeHeight * 0.35,
        startZ * 1.2 +
          driftZ * 0.3
      )
    );

    curvePoints.push(
      new THREE.Vector3(
        startX * 1.6 +
          driftX * 0.7,
        plumeHeight * 0.7,
        startZ * 1.6 +
          driftZ * 0.7
      )
    );

    curvePoints.push(
      new THREE.Vector3(
        startX * 2.0 +
          driftX,
        plumeHeight,
        startZ * 2.0 +
          driftZ
      )
    );

    const plumeCurve =
      new THREE.CatmullRomCurve3(
        curvePoints
      );

    const segments = 16;

    const steamGeo =
      new THREE.TubeGeometry(
        plumeCurve,
        segments,
        0.25,
        8,
        false
      );

    const steamPos =
      steamGeo.attributes.position;

    for (
      let j = 0;
      j < steamPos.count;
      j++
    ) {
      let py =
        steamPos.getY(j);

      let progress =
        Math.max(
          0,
          (py + 0.5) /
            (plumeHeight + 0.5)
        );

      let expandFactor =
        1.0 +
        progress * 2.8;

      let sx =
        steamPos.getX(j);

      let sz =
        steamPos.getZ(j);

      let puff =
        noise2D(
          sx * 2.0,
          sz * 2.0 + py
        ) * 0.25;

      steamPos.setX(
        j,
        sx * expandFactor + puff
      );

      steamPos.setZ(
        j,
        sz * expandFactor + puff
      );
    }

    steamGeo.computeVertexNormals();

    const steamMesh =
      new THREE.Mesh(
        steamGeo,
        steamMaterial
      );

    steamMesh.rotation.y =
      Math.random() * Math.PI;

    ventGroup.add(steamMesh);
  }

  const ventLight =
    new THREE.PointLight(
      0xff4400,
      3.0,
      8,
      1.8
    );

  ventLight.position.set(
    0,
    -0.4,
    0
  );

  ventGroup.add(ventLight);

  return ventGroup;
}

// ============================================================
// LICHENS MODEL
// ============================================================
function createLichens() {
  const lichenGroup = new THREE.Group();

  const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0x1f1a1a,
    roughness: 0.95,
    metalness: 0.05,
    flatShading: true
  });

  const darkRockMaterial = new THREE.MeshStandardMaterial({
    color: 0x120e0e,
    roughness: 0.98,
    metalness: 0.02,
    flatShading: true
  });

  const lichenMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x6e805d, roughness: 0.9, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x93a346, roughness: 0.85, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0xa1b09b, roughness: 0.88, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0xd9822b, roughness: 0.82, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x8a7251, roughness: 0.92, flatShading: true })
  ];

  function hash(x, z) {
    let n = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453123;
    return n - Math.floor(n);
  }

  function noise2D(x, z) {
    let floorX = Math.floor(x);
    let floorZ = Math.floor(z);
    let fracX = x - floorX;
    let fracZ = z - floorZ;

    let u = fracX * fracX * (3.0 - 2.0 * fracX);
    let v = fracZ * fracZ * (3.0 - 2.0 * fracZ);

    let n00 = hash(floorX, floorZ);
    let n10 = hash(floorX + 1, floorZ);
    let n01 = hash(floorX, floorZ + 1);
    let n11 = hash(floorX + 1, floorZ + 1);

    let nx0 = n00 * (1.0 - u) + n10 * u;
    let nx1 = n01 * (1.0 - u) + n11 * u;

    return nx0 * (1.0 - v) + nx1 * v;
  }

  const rockRadius = 1.4;
  const rockGeo = new THREE.DodecahedronGeometry(rockRadius, 2);
  const rockPos = rockGeo.attributes.position;

  for (let i = 0; i < rockPos.count; i++) {
    let x = rockPos.getX(i);
    let y = rockPos.getY(i);
    let z = rockPos.getZ(i);

    let n = noise2D(x * 1.5 + 2.0, z * 1.5 + 2.0) * 0.45;

    if (y < -0.2) {
      y *= 0.3;
    } else {
      y += n * 0.5;
    }

    x += (noise2D(y * 2.0, z * 2.0) - 0.5) * 0.35;
    z += (noise2D(x * 2.0, y * 2.0) - 0.5) * 0.35;

    rockPos.setXYZ(i, x, y, z);
  }

  rockGeo.computeVertexNormals();
  const rockMesh = new THREE.Mesh(rockGeo, rockMaterial);
  lichenGroup.add(rockMesh);

  const cragCount = 5;

  for (let i = 0; i < cragCount; i++) {
    let ang = (i / cragCount) * Math.PI * 2 + Math.random() * 0.5;
    let rScale = Math.random() * 0.35 + 0.2;

    const miniGeo = new THREE.DodecahedronGeometry(rScale, 1);
    const miniPos = miniGeo.attributes.position;

    for (let j = 0; j < miniPos.count; j++) {
      miniPos.setXYZ(
        j,
        miniPos.getX(j) + (Math.random() - 0.5) * 0.1,
        miniPos.getY(j) + (Math.random() - 0.5) * 0.1,
        miniPos.getZ(j) + (Math.random() - 0.5) * 0.1
      );
    }

    miniGeo.computeVertexNormals();

    const miniMesh = new THREE.Mesh(miniGeo, darkRockMaterial);

    miniMesh.position.set(
      Math.cos(ang) * 1.1,
      0.1,
      Math.sin(ang) * 1.1
    );

    miniMesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    lichenGroup.add(miniMesh);
  }

  const patchCount = 18;
  const patchCenters = [];

  for (let p = 0; p < patchCount; p++) {
    let phi = Math.random() * Math.PI * 0.4;
    let theta = Math.random() * Math.PI * 2;
    let radiusFactor = rockRadius * 0.92;

    let cx = Math.sin(phi) * Math.cos(theta) * radiusFactor;
    let cy = Math.cos(phi) * radiusFactor * 0.85 + 0.2;
    let cz = Math.sin(phi) * Math.sin(theta) * radiusFactor;

    patchCenters.push(new THREE.Vector3(cx, cy, cz));

    const mat = lichenMaterials[p % lichenMaterials.length];
    const patchRadius = Math.random() * 0.45 + 0.18;
    const radialSegs = Math.floor(Math.random() * 6) + 10;
    const ringSegs = 4;

    const patchGeo = new THREE.RingGeometry(
      0.02,
      patchRadius,
      radialSegs,
      ringSegs
    );

    patchGeo.rotateX(-Math.PI / 2);

    const pPos = patchGeo.attributes.position;

    for (let j = 0; j < pPos.count; j++) {
      let vx = pPos.getX(j);
      let vy = pPos.getY(j);
      let vz = pPos.getZ(j);

      let d = Math.sqrt(vx * vx + vz * vz);
      let normD = d / patchRadius;
      let angle = Math.atan2(vz, vx);

      let borderNoise =
        noise2D(vx * 6.0 + p, vz * 6.0 + p) * 0.4;

      let lobePattern =
        Math.sin(angle * (5 + (p % 3))) * 0.22 +
        Math.cos(angle * 3) * 0.15;

      let edgeDistulate =
        1.0 + borderNoise + lobePattern;

      vx *= edgeDistulate;
      vz *= edgeDistulate;

      if (normD > 0.7) {
        vy +=
          Math.sin(
            ((normD - 0.7) / 0.3) * Math.PI
          ) * 0.04 +
          (Math.random() - 0.5) * 0.015;
      } else {
        vy +=
          (Math.random() - 0.5) * 0.01 +
          noise2D(vx * 10.0, vz * 10.0) * 0.02;
      }

      pPos.setXYZ(j, vx, vy, vz);
    }

    patchGeo.computeVertexNormals();

    const patchMesh = new THREE.Mesh(patchGeo, mat);
    patchMesh.position.set(cx, cy, cz);

    const normal = new THREE.Vector3(
      cx,
      cy * 1.2,
      cz
    ).normalize();

    const up = new THREE.Vector3(0, 1, 0);

    const quaternion =
      new THREE.Quaternion().setFromUnitVectors(
        up,
        normal
      );

    patchMesh.quaternion.copy(quaternion);
    patchMesh.rotation.y += Math.random() * Math.PI * 2;

    lichenGroup.add(patchMesh);

    if (Math.random() > 0.4) {
      const cupsCount =
        Math.floor(Math.random() * 4) + 2;

      for (let c = 0; c < cupsCount; c++) {
        let cupRad =
          Math.random() * 0.06 + 0.03;

        const cupGeo =
          new THREE.CylinderGeometry(
            cupRad * 1.2,
            cupRad * 0.6,
            0.03,
            7
          );

        const cupMesh =
          new THREE.Mesh(cupGeo, mat);

        let offsetX =
          (Math.random() - 0.5) *
          patchRadius *
          0.6;

        let offsetZ =
          (Math.random() - 0.5) *
          patchRadius *
          0.6;

        cupMesh.position.set(
          cx + offsetX,
          cy + 0.02,
          cz + offsetZ
        );

        cupMesh.quaternion.copy(quaternion);

        lichenGroup.add(cupMesh);
      }
    }
  }

  const speckCount = 35;
  const speckGeo =
    new THREE.DodecahedronGeometry(0.03, 0);

  for (let s = 0; s < speckCount; s++) {
    const parentCenter =
      patchCenters[s % patchCenters.length];

    let offsetRad =
      Math.random() * 0.35 + 0.1;

    let ang =
      Math.random() * Math.PI * 2;

    let sx =
      parentCenter.x +
      Math.cos(ang) * offsetRad;

    let sy =
      parentCenter.y +
      (Math.random() - 0.5) * 0.1;

    let sz =
      parentCenter.z +
      Math.sin(ang) * offsetRad;

    const speckMat =
      lichenMaterials[
        s % lichenMaterials.length
      ];

    const speckMesh =
      new THREE.Mesh(
        speckGeo,
        speckMat
      );

    speckMesh.position.set(
      sx,
      sy,
      sz
    );

    speckMesh.scale.set(
      Math.random() * 0.8 + 0.4,
      0.3,
      Math.random() * 0.8 + 0.4
    );

    speckMesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      0
    );

    lichenGroup.add(speckMesh);
  }

  return lichenGroup;
}

// ============================================================
// STARFIELD (cursor magnet)
// ============================================================
const starCount = 26000;
const starBase = new Float32Array(starCount * 3);
const starPos = new Float32Array(starCount * 3);

for (let i = 0; i < starCount; i++) {
  const i3 = i * 3;
  const theta = random(0, Math.PI * 2);
  const phi = Math.acos(random(-1, 1));
  const r = random(120, 500);
  starBase[i3] = Math.sin(phi) * Math.cos(theta) * r;
  starBase[i3 + 1] = Math.cos(phi) * r;
  starBase[i3 + 2] = Math.sin(phi) * Math.sin(theta) * r;
  starPos[i3] = starBase[i3];
  starPos[i3 + 1] = starBase[i3 + 1];
  starPos[i3 + 2] = starBase[i3 + 2];
}

const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));

const starMat = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.9,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0.95,
  depthWrite: false,
  fog: false
});
const starField = new THREE.Points(starGeo, starMat);
scene.add(starField);

const starMagnet = {
  active: false,
  origin: new THREE.Vector3(),
  dir: new THREE.Vector3(),
  radius: 40
};

function setStarMagnet(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  const ray = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(mx, my), camera);
  starMagnet.origin.copy(ray.ray.origin);
  starMagnet.dir.copy(ray.ray.direction).normalize();
  starMagnet.active = true;
}

function updateStarfield(dt) {
  const posAttr = starGeo.attributes.position;
  const arr = posAttr.array;
  const R = starMagnet.radius;

  for (let i = 0; i < starCount; i++) {
    const i3 = i * 3;
    let px = arr[i3];
    let py = arr[i3 + 1];
    let pz = arr[i3 + 2];

    const bx = starBase[i3];
    const by = starBase[i3 + 1];
    const bz = starBase[i3 + 2];

    if (starMagnet.active) {
      const ox = px - starMagnet.origin.x;
      const oy = py - starMagnet.origin.y;
      const oz = pz - starMagnet.origin.z;
      let t = ox * starMagnet.dir.x + oy * starMagnet.dir.y + oz * starMagnet.dir.z;
      if (t < 10) t = 10;
      const cx = starMagnet.origin.x + starMagnet.dir.x * t;
      const cy = starMagnet.origin.y + starMagnet.dir.y * t;
      const cz = starMagnet.origin.z + starMagnet.dir.z * t;
      const dx = cx - px;
      const dy = cy - py;
      const dz = cz - pz;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < R) {
        const falloff = 1 - dist / R;
        const pull = falloff * falloff * 20 * dt;
        const inv = dist > 0.001 ? 1 / dist : 1;
        px += dx * inv * pull;
        py += dy * inv * pull;
        pz += dz * inv * pull;
      }
    }

    arr[i3] = px + (bx - px) * Math.min(1, dt * 0.12);
    arr[i3 + 1] = py + (by - py) * Math.min(1, dt * 0.12);
    arr[i3 + 2] = pz + (bz - pz) * Math.min(1, dt * 0.12);
  }

  posAttr.needsUpdate = true;
}

// ============================================================
// ROCKET CURSOR (always points at the planet)
// ============================================================
const rocketEl = document.getElementById("rocket-cursor");
let rocketX = 0;
let rocketY = 0;
let rocketVisible = false;
const planetScreen = new THREE.Vector3();
const rocketTmp = new THREE.Vector3();

function updateRocket() {
  if (!rocketEl) return;
  if (!rocketVisible) {
    rocketEl.classList.add("hidden");
    rocketEl.style.opacity = "";
    return;
  }
  rocketEl.classList.remove("hidden");
  rocketTmp.copy(PLANET_CENTER).project(camera);
  planetScreen.set(
    (rocketTmp.x * 0.5 + 0.5) * window.innerWidth,
    (-rocketTmp.y * 0.5 + 0.5) * window.innerHeight
  );
  const dx = planetScreen.x - rocketX;
  const dy = planetScreen.y - rocketY;
  const angle = Math.atan2(dx, -dy);
  rocketEl.style.left = rocketX + "px";
  rocketEl.style.top = rocketY + "px";
  rocketEl.style.transform = "translate(-50%, -50%) rotate(" + angle + "rad)";
  rocketEl.style.opacity = "1";
}

// ============================================================
// FACTOR PLACEMENT (scatter helper)
// ============================================================
// Scatter clones of a builder output around the planet with a
// min-distance check so nothing sinks through its neighbor.
// Every clone is tagged with the factorId and mounted as its own
// factor target — the single existing raycaster handles them all.
const scatterMemory = [];

function mountScatterAt(group, fx, fz, yBias, spinY) {
  mountOnSphere(group, fx, fz, spinY);
  return group;
}

function clearOfScatter(targetDir, minDist) {
  for (const mem of scatterMemory) {
    if (targetDir.distanceToSquared(mem) < minDist * minDist) {
      return false;
    }
  }
  return true;
}

function scatterOnPlanet(builder, count, opts = {}) {
  const {
    fxMin = -24,
    fxMax = 13,
    fzMin = -16,
    fzMax = 18,
    minDist = 4.2,
    yBias = 0.9,
    spinY = 0,
    anchorX = 0,
    anchorZ = 0,
    clusterRadius = 0,
    focusDistance,
    spacer = 0
  } = opts;
  let placedCount = 0;

  for (let attempt = 0; attempt < count * 30 && placedCount < count; attempt++) {
    const fx =
      anchorX +
      (clusterRadius > 0
        ? (Math.random() - 0.5) * 2 * clusterRadius
        : random(fxMin, fxMax));
    const fz =
      anchorZ +
      (clusterRadius > 0
        ? (Math.random() - 0.5) * 2 * clusterRadius
        : random(fzMin, fzMax));

    const dir = mountDirection(fx, fz);
    if (!clearOfScatter(dir, minDist)) continue;

    const group = builder();
    group.userData.factorId = factorIdFor(group);

    const ventSpin =
      spinY === 0 ? random(0, Math.PI * 2) : spinY;

    mountScatterAt(group, fx, fz, yBias, ventSpinHelix ?? ventSpin);

    if (spacer) group.position.multiplyScalar(1 + spacer);
    scatterMemory.push(dir);
    scene.add(groupGenerator ? group : group);
    registerFactorTarget(group, null, focusDistance);
    placedCount++;
  }

  return placedCount;
}

function createMosses() {
  const mossGroup = new THREE.Group();
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x413c32,
    roughness: 0.95,
    flatShading: true
  });
  const mossMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x577a3a, roughness: 0.9, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x6b8f45, roughness: 0.9, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x46652e, roughness: 0.95, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x7ca04f, roughness: 0.85, flatShading: true })
  ];

  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(1.3, 1),
    rockMat
  );
  rock.scale.y = 0.55;
  rock.position.y = 0.15;
  // Sink the rock base slightly into the planet so it hugs the curved
  // surface rather than resting on the tangent plane.
  rock.position.y = 0.1;
  mossGroup.add(rock);

  for (let i = 0; i < 12; i++) {
    const button = new THREE.Mesh(
      new THREE.SphereGeometry(0.3 + Math.random() * 0.45, 10, 8),
      mossMaterials[Math.floor(Math.random() * mossMaterials.length)]
    );
    button.scale.y = 0.35;
    button.position.set(
      (Math.random() - 0.5) * 2.0,
      0.35 + Math.random() * 0.25,
      (Math.random() - 0.5) * 2.0
    );
    mossGroup.add(button);
  }

  mossGroup.userData.factorId = "mosses";
  mossGroup.userData.slideId = "mosses";
  return mossGroup;
}

function createMicrobes() {
  const microbeGroup = new THREE.Group();

  const glowMaterials = [
    new THREE.MeshStandardMaterial({
      color: 0x66ffaa,
      emissive: 0x33cc77,
      emissiveIntensity: 0.9,
      roughness: 0.4,
      flatShading: true
    }),
    new THREE.MeshStandardMaterial({
      color: 0x88ffbb,
      emissive: 0x44ddaa,
      emissiveIntensity: 0.9,
      roughness: 0.4,
      flatShading: true
    }),
    new THREE.MeshStandardMaterial({
      color: 0x55dd88,
      emissive: 0x2a9944,
      emissiveIntensity: 0.9,
      roughness: 0.4,
      flatShading: true
    })
  ];

  for (let i = 0; i < 26; i++) {
    const blob = new THREE.Mesh(
      new THREE.SphereGeometry(0.12 + Math.random() * 0.3, 8, 6),
      glowMaterials[Math.floor(Math.random() * glowMaterials.length)]
    );
    blob.position.set(
      (Math.random() - 0.5) * 1.8,
      (Math.random() - 0.5) * 0.3 + 1,
      (Math.random() - 0.5) * 1.8
    );
    microbeGroup.add(blob);
  }

  microbeGroup.userData.factorId = "microbes";
  microbeGroup.userData.slideId = "microbes";
  return microbeGroup;
}

function createLavaCrickets() {
  const cricketGroup = new THREE.Group();
  const chitinMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1f,
    roughness: 0.6,
    metalness: 0.3,
    flatShading: true
  });

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 10, 8),
    chitinMat
  );
  body.scale.set(1.3, 0.8, 1);
  body.position.y = 0.35;
  cricketGroup.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 8, 6),
    chitinMat
  );
  head.position.set(0.42, 0.42, 0);
  cricketGroup.add(head);

  const jumpLegs = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.5, 0.05),
    chitinMat
  );
  jumpLegs.position.set(0.15, 0.1, 0.28);
  cricketGroup.add(jumpLegs);

  cricketGroup.userData.factorId = "lavaCrickets";
  cricketGroup.userData.slideId = "lavaCrickets";
  return cricketGroup;
}

function createVolcanicLongicornBeetles() {
  const beetleGroup = new THREE.Group();
  const shellMat = new THREE.MeshStandardMaterial({
    color: 0x3a1206,
    roughness: 0.35,
    metalness: 0.5,
    flatShading: true
  });

  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 10, 8),
    shellMat
  );
  shell.scale.set(1.1, 0.7, 0.75);
  shell.position.y = 0.3;
  beetleGroup.add(shell);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 8, 6),
    shellMat
  );
  head.position.set(0.42, 0.32, 0);
  beetleGroup.add(head);

  // Long sweeping antennae — the signature longicorn look.
  for (let side = -1; side <= 1; side += 2) {
    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.05, 0.7, 6),
      shellMat
    );
    antenna.position.set(0.42, 0.55, side * 0.28);
    antenna.rotation.x = side * -0.7;
    antenna.rotation.z = side * 0.5;
    beetleGroup.add(antenna);
  }

  beetleGroup.userData.factorId = "volcanicLongicornBeetles";
  beetleGroup.userData.slideId = "volcanicLongicornBeetles";
  return beetleGroup;
}
// ============================================================
// FACTOR INTERACTION (single raycast + smooth camera focus)
// ============================================================
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const clickStart = new THREE.Vector2();

const FOCUS_DISTANCE = 20;
const FOCUS_POINT = new THREE.Vector3(0, VOLCANO_BASE_Y + 5, 0);
const VENT_FOCUS_DISTANCE = 6.5;
const LICHENS_FOCUS_DISTANCE = 3.5;

// Registered clickable factor groups (volcano, volcanic vent, ...)
const factorTargets = [];

function registerFactorTarget(group, focusPoint, focusDistance) {
  const worldPoint = new THREE.Vector3();
  switch (group.userData.factorId) {
    case "volcano":
      worldPoint.copy(FOCUS_POINT);
      break;
    default:
      group.getWorldPosition(worldPoint);
      // offset slightly outward from the planet surface so the focus
      // wraps the object rather than pointing straight into its base
      worldPoint.add(worldPoint.clone().normalize().multiplyScalar(1.5));
  }
  factorTargets.push({
    group,
    factorId: group.userData.factorId,
    focusPoint: worldPoint,
    focusDistance
  });
}

const focusState = {
  active: false,
  animating: false,
  t: 0,
  duration: 1.2,
  fromPos: new THREE.Vector3(),
  toPos: new THREE.Vector3(),
  fromTarget: new THREE.Vector3(),
  toTarget: new THREE.Vector3(),
  saved: null
};

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function setPointer(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
}

// Walk up the scene graph so any child mesh resolves to a factor group.
function findFactorGroup(object) {
  let o = object;
  while (o) {
    if (o.userData && o.userData.factorId) return o;
    o = o.parent;
  }
  return null;
}

function raycastFactorHit() {
  if (factorTargets.length === 0) return null;
  raycaster.setFromCamera(pointer, camera);
  const groups = factorTargets.map((t) => t.group);
  const hits = raycaster.intersectObjects(groups, true);
  if (hits.length === 0) return null;
  return findFactorGroup(hits[0].object);
}

function onPointerMove(e) {
  setPointer(e);
  setStarMagnet(e);
  const hit = raycastFactorHit();
  renderer.domElement.style.cursor = hit ? "pointer" : "";
}

function onPointerDown(e) {
  setPointer(e);
  clickStart.copy(pointer);
}

function onClick(e) {
  setPointer(e);
  const hit = raycastFactorHit();
  if (!hit) return;
  if (pointer.distanceTo(clickStart) > 0.02) return; // ignore drags
  toggleFocus(hit);
}

function startFocusAnim(fromPos, toPos, fromTarget, toTarget) {
  focusState.fromPos.copy(fromPos);
  focusState.toPos.copy(toPos);
  focusState.fromTarget.copy(fromTarget);
  focusState.toTarget.copy(toTarget);
  focusState.t = 0;
  focusState.animating = true;
  controls.enableDamping = false; // avoid fighting the programmatic animation
}

// ============================================================
// INFO PANEL
// ============================================================
const factorTitleEl = document.getElementById("factor-title");
const factorCategoryEl = document.getElementById("factor-category");
const factorDescriptionEl = document.getElementById("factor-description");
const infoPanelEl = document.getElementById("info-panel");
const closeBtnEl = document.getElementById("close-btn");

function openInfoPanel(factorId) {
  const f = factorById[factorId];
  if (!f) return;
  factorTitleEl.textContent = f.title;
  factorCategoryEl.textContent = f.category.toUpperCase() + " FACTOR";
  factorDescriptionEl.textContent = f.description;
  infoPanelEl.classList.remove("hidden");
  infoPanelEl.setAttribute("aria-hidden", "false");
}

function closeInfoPanel() {
  infoPanelEl.classList.add("hidden");
  infoPanelEl.setAttribute("aria-hidden", "true");
}

// Close (X): hide panel only. Camera focus is deliberately untouched so the
// visitor stays looking at the factor and OrbitControls keeps working.
closeBtnEl.addEventListener("click", closeInfoPanel);

function toggleFocus(group) {
  const target = factorTargets.find(
    (t) => t.group === group && t.factorId === group.userData.factorId
  );
  if (!target) return;

  if (!focusState.active || focusState.targetGroup !== group) {
    focusState.saved = {
      pos: camera.position.clone(),
      target: controls.target.clone()
    };
    const offset = camera.position.clone().sub(PLANET_CENTER).normalize();
    const toPos = target.focusPoint.clone().add(offset.multiplyScalar(target.focusDistance));
    startFocusAnim(camera.position, toPos, controls.target, target.focusPoint.clone());
    focusState.active = true;
    focusState.targetGroup = group;
    openInfoPanel(group.userData.factorId);
  } else {
    const saved = focusState.saved;
    startFocusAnim(camera.position, saved.pos, controls.target, saved.target);
    focusState.saved = null;
    focusState.active = false;
    focusState.targetGroup = null;
  }
}

// ============================================================
// ANIMATION LOOP
// ============================================================
const clock = new THREE.Clock();

let volcanoLavaTex = null;
let volcanoCraterLight = null;
let volcanoPulseTime = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  if (volcanoLavaTex) {
    volcanoLavaTex.offset.y -= dt * 0.3;
  }

  if (volcanoCraterLight) {
    volcanoPulseTime += dt;
    volcanoCraterLight.intensity =
      4.5 +
      Math.sin(volcanoPulseTime * 4.0) * 0.4 +
      Math.cos(volcanoPulseTime * 7.0) * 0.3;
  }

  if (focusState.animating) {
    focusState.t += dt / focusState.duration;
    const ease = easeInOutCubic(Math.min(focusState.t, 1));
    camera.position.lerpVectors(focusState.fromPos, focusState.toPos, ease);
    controls.target.lerpVectors(focusState.fromTarget, focusState.toTarget, ease);
    if (focusState.t >= 1) {
      focusState.t = 0;
      focusState.animating = false;
      controls.enableDamping = true;
    }
  }

  controls.update();
  updateStarfield(dt);
  renderer.render(scene, camera);
}

// ============================================================
// INITIALIZE
// ============================================================
createTerrain();

const volcano = createVolcano();
volcano.userData.factorId = "volcano";
volcano.userData.slideId = "volcano";
volcano.scale.set(VOLCANO_BASE_SCALE, VOLCANO_HEIGHT_SCALE, VOLCANO_BASE_SCALE);
volcano.position.set(0, VOLCANO_BASE_Y, 0);
scene.add(volcano);
registerFactorTarget(volcano, FOCUS_POINT, FOCUS_DISTANCE);

const volcanicVent = createVolcanicVent();
volcanicVent.userData.factorId = "volcanicVent";
volcanicVent.userData.slideId = "volcanicVent";
volcanicVent.scale.setScalar(1.2);
mountOnSphere(volcanicVent, 8, -10, random(0, Math.PI * 2));
scene.add(volcanicVent);
registerFactorTarget(volcanicVent, null, VENT_FOCUS_DISTANCE);

// Lichens — 12 clusters spread evenly across the whole planet.
const lichenDirs = [];
for (let i = 0; i < 12; i++) {
  const dir = randomWorldDirection(lichenDirs, 0.9);
  if (!dir) break;
  lichenDirs.push(dir);
  const lichen = createLichens();
  lichen.userData.factorId = "lichens";
  lichen.userData.slideId = "lichens";
  lichen.scale.setScalar(random(0.6, 1.8));
  mountOnWorldSphere(lichen, dir, random(0, Math.PI * 2));
  scene.add(lichen);
  registerFactorTarget(lichen, null, LICHENS_FOCUS_DISTANCE);
}

// Mosses — 12 cushions dotted evenly across the whole planet.
const mossDirs = [];
for (let i = 0; i < 12; i++) {
  const dir = randomWorldDirection(mossDirs, 0.9);
  if (!dir) break;
  mossDirs.push(dir);
  const mossGroup = createMosses();
  mossGroup.userData.factorId = "mosses";
  mossGroup.userData.slideId = "mosses";
  mossGroup.scale.setScalar(random(0.6, 1.9));
  mountOnWorldSphere(mossGroup, dir, random(0, Math.PI * 2));
  scene.add(mossGroup);
  registerFactorTarget(mossGroup, null, 3.0);
}

// Microbes — glowing colonies hugging the warm slope near the crater.
const microbes = createMicrobes();
microbes.userData.factorId = "microbes";
microbes.userData.slideId = "microbes";
mountOnSphere(microbes, 5, 14, random(0, Math.PI * 2));
scene.add(microbes);
registerFactorTarget(microbes, null, 3.0);

// Lava crickets — scattered across the dark rocky east field.
const lavaCrickets = createLavaCrickets();
lavaCrickets.userData.factorId = "lavaCrickets";
lavaCrickets.userData.slideId = "lavaCrickets";
mountOnSphere(lavaCrickets, -10, -8, random(0, Math.PI * 2));
scene.add(lavaCrickets);
registerFactorTarget(lavaCrickets, null, 2.8);

// Volcanic longicorn beetles — long antennae glittering on the far rock.
const volcanicLongicornBeetles = createVolcanicLongicornBeetles();
volcanicLongicornBeetles.userData.factorId = "volcanicLongicornBeetles";
volcanicLongicornBeetles.userData.slideId = "volcanicLongicornBeetles";
mountOnSphere(volcanicLongicornBeetles, 11, 6, random(0, Math.PI * 2));
scene.add(volcanicLongicornBeetles);
registerFactorTarget(volcanicLongicornBeetles, null, 2.8);

// Bind factor interaction (raycast + hover cursor + click focus)
renderer.domElement.addEventListener("pointermove", onPointerMove);
renderer.domElement.addEventListener("pointerdown", onPointerDown);
renderer.domElement.addEventListener("click", onClick);
renderer.domElement.addEventListener("pointerleave", () => { starMagnet.active = false; });

animate();
