let faceMesh;
let video;
let faces = [];
let statusMessage = 'Inicializando...';
let statusDetail = '';
let currentGesture = null;
let gestureImages = {};

const IMAGE_PANEL_WIDTH = 280;
const CAMERA_CAPTURE_WIDTH = 760;
const CAMERA_CAPTURE_HEIGHT = 560;

const options = { maxFaces: 1, refineLandmarks: true, flipHorizontal: false };

// Mostrar u ocultar el círculo amarillo que marca la sonrisa
const SHOW_SMILE_CIRCLE = false;

const GESTURE_LABELS = {
  angry: 'ceño fruncido',
  sad: 'tristeza',
  kiss: 'kiss',
  teethTogether: 'dientes juntos',
  mouthOpenEyesOpen: 'boca abierta y ojos abiertos',
  mouthOpen: 'boca abierta',
  smile: 'sonrisa',
  smileSmall: 'sonrisa',
  openEyes: 'ojos abiertos',
  leftEyeClosed: 'ojo izquierdo cerrado',
  rightEyeClosed: 'ojo derecho cerrado',
  neutral: 'neutral',
};

const ARTWORK_DETAILS = {
  openEyes: {
    title: 'Le Désespéré',
    authorYear: 'Gustave Courbet, 1845',
    note: 'Autorretrato de fuerte intensidad emocional.',
  },
  leftEyeClosed: {
    title: 'Mujer Abstracta',
    authorYear: 'Pablo Picasso, 1925',
    note: 'Fragmentación de la figura y rasgos simplificados.',
  },
  rightEyeClosed: {
    title: 'La joven de la perla',
    authorYear: 'Johannes Vermeer, 1667',
    note: 'Retrato célebre por la luz y la mirada directa.',
  },
  mouthOpenEyesOpen: {
    title: 'Un Hombre Sorprendido',
    authorYear: 'Joos van Craesbeeck, 1635',
    note: 'Escena expresiva asociada a la sorpresa.',
  },
  mouthOpen: {
    title: 'El Grito',
    authorYear: 'Edvard Munch, 1893',
    note: 'Símbolo visual de angustia existencial.',
  },
  kiss: {
    title: 'Autorretrato con collar de espinas y colibrí',
    authorYear: 'Frida Kahlo, 1940',
    note: 'Autorretrato con carga simbólica y biográfica.',
  },
  sad: {
    title: 'El Último Día de Pompeya',
    authorYear: 'Karl Briullov, 1830',
    note: 'Gran escena histórica de dramatismo clásico.',
  },
  angry: {
    title: 'El Ángel Caído',
    authorYear: 'Alexandre Cabanel, 1847',
    note: 'Figura de tensión y rebeldía contenida.',
  },
  neutral: {
    title: 'Retrato de Madame Rachele Osterlind',
    authorYear: 'Amedeo Modigliani, 1919',
    note: 'Retrato sobrio de formas alargadas y elegantes.',
  },
  teethTogether: {
    title: 'La Sombra del Amor',
    authorYear: 'Frederick Sandys, 1867',
    note: 'Composición simbólica con tono enigmático.',
  },
  smile: {
    title: 'Bufón con laud',
    authorYear: 'Frans Hals, 1624',
    note: 'Pintura con gesto vivo y energía barroca.',
  },
  smileSmall: {
    title: 'La Mona Lisa',
    authorYear: 'Leonardo da Vinci, 1503',
    note: 'Retrato universalmente reconocido por su sonrisa.',
  },
};

const LANDMARKS = {
  foreheadTop: 10,
  chin: 152,
  leftEyeOuter: 33,
  leftEyeInner: 133,
  leftEyeUpper: 159,
  leftEyeLower: 145,
  rightEyeOuter: 263,
  rightEyeInner: 362,
  rightEyeUpper: 386,
  rightEyeLower: 374,
  leftBrowInner: 70,
  leftBrowOuter: 105,
  rightBrowInner: 300,
  rightBrowOuter: 334,
  mouthLeft: 61,
  mouthRight: 291,
  upperLip: 13,
  lowerLip: 14,
  faceLeft: 234,
  faceRight: 454,
};

function preload() {
  if (window.ml5 && ml5.faceMesh) {
    faceMesh = ml5.faceMesh(options);
  }

  gestureImages = {
    openEyes: loadImage('Le Désesperé Corbet 1845.jpg'),
    leftEyeClosed: loadImage('Mujer Abstracta Picasso 1925.png'),
    rightEyeClosed: loadImage('La joven de la perla Vermeer 1667.jpg'),
    mouthOpenEyesOpen: loadImage('Un Hombre Sorprendido Craesbeeck 1635.jpg'),
    mouthOpen: loadImage('El Grito Munch 1893.jpg'),
    kiss: loadImage('Autoretrato con collar de espinas y colibrí Kahlo 1940.jpg'),
    sad: loadImage('El Último Día De Pompeya Briulov 1830.jpg'),
    angry: loadImage('El Ángel Caído Cabanel 1847.jpg'),
    neutral: loadImage('Retrato de Madame Rachele Osterlind Modigliani 1919.jpg'),
    teethTogether: loadImage('La Sombra Del Amor Sandys 1867.jpg'),
    smile: loadImage('Bufón Con Laud Hals 1624.jpg'),
    smileSmall: loadImage('La Mona Lisa Da Vinci 1503.jpeg'),
  };
}

async function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('Arial');

  if (!faceMesh) {
    statusMessage = 'No se pudo cargar ml5.js';
    statusDetail = 'Revisa la conexión a internet o el CDN de ml5.';
    return;
  }

  try {
    await startCamera();
  } catch (error) {
    statusMessage = 'No se pudo iniciar el detector';
    statusDetail = error && error.message ? error.message : String(error);
  }
}

async function startCamera() {
  statusMessage = 'Buscando cámara...';
  statusDetail = '';

  const camera = await pickVideoInput();
  const cameraConstraints = camera && camera.deviceId
    ? { deviceId: { ideal: camera.deviceId } }
    : true;

  video = createCapture({
    video: cameraConstraints,
    audio: false,
  });

  video.size(CAMERA_CAPTURE_WIDTH, CAMERA_CAPTURE_HEIGHT);
  video.hide();
  video.elt.style.transform = 'none';
  video.elt.style.webkitTransform = 'none';

  await waitForVideoReady(video);
  faceMesh.detectStart(video, gotFaces);

  statusMessage = camera.label
    ? 'Usando ' + camera.label + '. Esperando rostro...'
    : 'Usando la cámara disponible. Esperando rostro...';
  statusDetail = '';
}

async function pickVideoInput() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    throw new Error('El navegador no soporta acceso a la cámara.');
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoInputs = devices.filter((device) => device.kind === 'videoinput');

  if (videoInputs.length === 0) {
    throw new Error('No se encontró ninguna cámara disponible en este equipo.');
  }

  const rankedInputs = videoInputs
    .map((device) => ({
      device,
      score: scoreVideoInput(device),
    }))
    .sort((a, b) => b.score - a.score);

  return rankedInputs[0].device;
}

function scoreVideoInput(device) {
  const label = (device.label || '').toLowerCase();

  if (!label) {
    return 0;
  }

  if (
    label.includes('webcam') ||
    label.includes('usb') ||
    label.includes('external') ||
    label.includes('logitech')
  ) {
    return 3;
  }

  if (
    label.includes('integrated') ||
    label.includes('built-in') ||
    label.includes('builtin') ||
    label.includes('internal') ||
    label.includes('front') ||
    label.includes('face time') ||
    label.includes('facetime')
  ) {
    return 2;
  }

  return 1;
}

function waitForVideoReady(videoElement) {
  return new Promise((resolve) => {
    const videoNode = videoElement.elt;

    if (videoNode.readyState >= 2) {
      resolve();
      return;
    }

    videoNode.onloadedmetadata = () => resolve();
  });
}

function draw() {
  background(0);

  if (!video) {
    drawStatus(statusMessage, statusDetail);
    return;
  }

  const layout = getLayout();
  const cameraX = layout.cameraX;
  const cameraY = layout.cameraY;
  const cameraW = layout.cameraW;
  const cameraH = layout.cameraH;

  drawCameraTitle(layout);

  noStroke();
  fill(18);
  rect(cameraX - 8, cameraY - 8, cameraW + 16, cameraH + 16, 14);
  image(video, cameraX, cameraY, cameraW, cameraH);

  if (faces.length === 0) {
    drawStatus(statusMessage, statusDetail || 'Sin detecciones todavía', layout);
    drawGesturePanel({ key: 'neutral', label: 'seria.jpg', image: gestureImages.neutral }, layout);
    return;
  }

  const face = faces[0];
  const faceWidth = distance(face, LANDMARKS.faceLeft, LANDMARKS.faceRight);
  const faceHeight = distance(face, LANDMARKS.foreheadTop, LANDMARKS.chin);

  const leftEyeOpenRatio = eyeOpenRatio(
    face,
    LANDMARKS.leftEyeOuter,
    LANDMARKS.leftEyeInner,
    LANDMARKS.leftEyeUpper,
    LANDMARKS.leftEyeLower
  );
  const rightEyeOpenRatio = eyeOpenRatio(
    face,
    LANDMARKS.rightEyeOuter,
    LANDMARKS.rightEyeInner,
    LANDMARKS.rightEyeUpper,
    LANDMARKS.rightEyeLower
  );

  const mouthWidth = distance(face, LANDMARKS.mouthLeft, LANDMARKS.mouthRight);
  const mouthOpen = distance(face, LANDMARKS.upperLip, LANDMARKS.lowerLip);

  const smileRatio = faceWidth > 0 ? mouthWidth / faceWidth : 0;
  const mouthOpenRatio = faceWidth > 0 ? mouthOpen / faceWidth : 0;

  const leftEyeOpen = leftEyeOpenRatio > 0.18;
  const rightEyeOpen = rightEyeOpenRatio > 0.18;
  const smileDetected = smileRatio > 0.42 && mouthOpenRatio < 0.12;
  const smallSmileDetected = smileRatio > 0.36 && smileRatio <= 0.42 && mouthOpenRatio < 0.12;
  const mouthOpenDetected = mouthOpenRatio > 0.13;
  const mouthOpenEyesOpenDetected = mouthOpenDetected && leftEyeOpen && rightEyeOpen;

  const upperLipPoint = getPoint(face, LANDMARKS.upperLip);
  const lowerLipPoint = getPoint(face, LANDMARKS.lowerLip);
  const lowerLipOverUpperDetected = lowerLipPoint.y < upperLipPoint.y - 1;

  const mouthWidthRatio = faceWidth > 0 ? mouthWidth / faceWidth : 0;
  const kissDetected = mouthOpenRatio < 0.09 && mouthWidthRatio > 0.22 && mouthWidthRatio < 0.33;
  const teethTogetherDetected = mouthOpenRatio > 0.05 && mouthOpenRatio < 0.11 && mouthWidthRatio >= 0.30 && mouthWidthRatio <= 0.42;
  const mouthSlightlyOpen = mouthOpenRatio > 0.04 && mouthOpenRatio < 0.14;
  const mouthNotDetected = mouthWidthRatio < 0.18;

  const leftBrowInnerPoint = getPoint(face, LANDMARKS.leftBrowInner);
  const leftBrowOuterPoint = getPoint(face, LANDMARKS.leftBrowOuter);
  const rightBrowInnerPoint = getPoint(face, LANDMARKS.rightBrowInner);
  const rightBrowOuterPoint = getPoint(face, LANDMARKS.rightBrowOuter);

  const browTilt = faceHeight > 0
    ? ((leftBrowOuterPoint.y - leftBrowInnerPoint.y) + (rightBrowOuterPoint.y - rightBrowInnerPoint.y)) / (2 * faceHeight)
    : 0;
  const browsDownTilt = browTilt > 0.01;
  const browsLifted = browTilt < -0.008;

  const detectedGesture = detectGesture({
    leftEyeOpen,
    rightEyeOpen,
    smileDetected,
    smallSmileDetected,
    mouthOpenDetected,
    mouthOpenEyesOpenDetected,
    lowerLipOverUpperDetected,
    kissDetected,
    teethTogetherDetected,
    browsDownTilt,
    browsLifted,
    mouthSlightlyOpen,
    mouthNotDetected,
  });

  currentGesture = detectedGesture;

  drawStatus(
    'Ojo izquierdo: ' + (leftEyeOpen ? 'abierto' : 'cerrado') +
      ' | Ojo derecho: ' + (rightEyeOpen ? 'abierto' : 'cerrado') +
      ' | Gesto: ' + detectedGesture.label,
    'Ratios -> izq: ' + leftEyeOpenRatio.toFixed(3) +
      ' | der: ' + rightEyeOpenRatio.toFixed(3) +
      ' | sonrisa: ' + smileRatio.toFixed(3)
  , layout);

  drawGesturePanel(detectedGesture, layout);

  if (SHOW_SMILE_CIRCLE && (smileDetected || smallSmileDetected)) {
    noFill();
    stroke(255, 200, 0);
    strokeWeight(3);

    const mouthCenterX = (getPoint(face, LANDMARKS.mouthLeft).x + getPoint(face, LANDMARKS.mouthRight).x) / 2;
    const mouthCenterY = (getPoint(face, LANDMARKS.upperLip).y + getPoint(face, LANDMARKS.lowerLip).y) / 2;

    ellipse(mouthCenterX, mouthCenterY, mouthWidth * 1.15, mouthOpen * 2.2 + 30);
  }
}

function gotFaces(results) {
  faces = results;
  statusMessage = 'Rostro detectado';
  statusDetail = '';
}

function detectGesture(metrics) {
  if (metrics.browsLifted && metrics.mouthNotDetected) {
    return { key: 'angry', label: 'El Ángel Caído Cabanel 1847.jpg', image: gestureImages.angry };
  }

  if (metrics.browsDownTilt && metrics.mouthSlightlyOpen) {
    return { key: 'sad', label: 'El Último Día De Pompeya Briulov 1830.jpg', image: gestureImages.sad };
  }

  if (metrics.kissDetected) {
    return { key: 'kiss', label: 'Autoretrato con collar de espinas y colibrí Kahlo 1940.jpg', image: gestureImages.kiss };
  }

  if (metrics.teethTogetherDetected) {
    return { key: 'teethTogether', label: 'La Sombra Del Amor Sandys 1867.jpg', image: gestureImages.teethTogether };
  }

  if (metrics.mouthOpenEyesOpenDetected) {
    return { key: 'mouthOpenEyesOpen', label: 'Un Hombre Sorprendido Craesbeeck 1635.jpg', image: gestureImages.mouthOpenEyesOpen };
  }

  if (metrics.mouthOpenDetected) {
    return { key: 'mouthOpen', label: 'El Grito Munch 1893.jpg', image: gestureImages.mouthOpen };
  }
  
  if (metrics.smileDetected) {
    return { key: 'smile', label: 'Bufón Con Laud Hals 1624.jpg', image: gestureImages.smile };
  }

  if (metrics.smallSmileDetected) {
    return { key: 'smileSmall', label: 'La Mona Lisa Da Vinci 1503.jpeg', image: gestureImages.smileSmall };
  }

  if (metrics.leftEyeOpen && metrics.rightEyeOpen) {
    return { key: 'openEyes', label: 'Le Désesperé Corbet 1845.jpg', image: gestureImages.openEyes };
  }

  if (!metrics.leftEyeOpen && metrics.rightEyeOpen) {
    return { key: 'leftEyeClosed', label: 'Mujer Abstracta Picasso 1925.png', image: gestureImages.leftEyeClosed };
  }

  if (metrics.leftEyeOpen && !metrics.rightEyeOpen) {
    return { key: 'rightEyeClosed', label: 'La joven de la perla Vermeer 1667.jpg', image: gestureImages.rightEyeClosed };
  }

  return { key: 'neutral', label: 'Retrato de Madame Rachele Osterlind Modigliani 1919.jpg', image: gestureImages.neutral };
}

function drawGesturePanel(gestureState, layout = getLayout()) {
  const panelX = layout.panelX;
  const panelY = layout.panelY;
  const panelH = layout.panelH;
  const artwork = ARTWORK_DETAILS[gestureState.key] || ARTWORK_DETAILS.neutral;

  noStroke();
  fill(16, 16, 16, 235);
  rect(panelX, panelY, IMAGE_PANEL_WIDTH, panelH, 12);

  fill(255);
  textAlign(LEFT, TOP);
  textSize(16);
  text('Imagen asociada', panelX + 12, panelY + 12);

  textSize(13);
  fill(220);
  text(gestureState.label, panelX + 12, panelY + 36);

  const previewX = panelX + 12;
  const previewY = panelY + 58;
  const previewW = IMAGE_PANEL_WIDTH - 24;
  const previewH = Math.max(150, panelH - 170);

  fill(255, 255, 255, 18);
  rect(previewX, previewY, previewW, previewH, 8);

  if (gestureState.image) {
    const img = gestureState.image;
    const scaleFactor = Math.min(previewW / img.width, previewH / img.height);
    const drawW = img.width * scaleFactor;
    const drawH = img.height * scaleFactor;
    const drawX = previewX + (previewW - drawW) / 2;
    const drawY = previewY + (previewH - drawH) / 2;

    image(img, drawX, drawY, drawW, drawH);
  } else {
    fill(255);
    textSize(12);
    text('Sin imagen disponible', previewX + 12, previewY + 12);
  }

  const infoY = previewY + previewH + 10;

  fill(245);
  textSize(11);
  text('Obra: ' + artwork.title, previewX, infoY, previewW, 18);

  fill(210);
  text('Autor: ' + artwork.authorYear, previewX, infoY + 18, previewW, 18);

  fill(185);
  text(artwork.note, previewX, infoY + 36, previewW, 28);
}

function getPoint(face, index) {
  return face.keypoints[index];
}

function distance(face, indexA, indexB) {
  const pointA = getPoint(face, indexA);
  const pointB = getPoint(face, indexB);
  return dist(pointA.x, pointA.y, pointB.x, pointB.y);
}

function eyeOpenRatio(face, outerIndex, innerIndex, upperIndex, lowerIndex) {
  const horizontal = distance(face, outerIndex, innerIndex);
  const vertical = distance(face, upperIndex, lowerIndex);
  return horizontal === 0 ? 0 : vertical / horizontal;
}

function drawStatus(line1, line2 = '', layout = getLayout()) {
  const boxWidth = layout.cameraW;
  const boxX = layout.cameraX;
  const boxY = layout.cameraY + layout.cameraH + 18;

  noStroke();
  fill(0, 0, 0, 200);
  rect(boxX, boxY, boxWidth, line2 ? 66 : 40, 10);

  fill(255);
  textSize(18);
  textAlign(LEFT, TOP);
  text(line1, boxX + 12, boxY + 8);

  if (line2) {
    textSize(14);
    text(line2, boxX + 12, boxY + 30);
  }
}

function drawCameraTitle(layout = getLayout()) {
  const cameraCenterX = layout.cameraX + layout.cameraW / 2;
  const titleText = GESTURE_LABELS[currentGesture ? currentGesture.key : 'neutral'] || 'neutral';
  const titleY = layout.cameraY - 10;
  const boxWidth = Math.min(260, layout.cameraW);
  const boxX = cameraCenterX - boxWidth / 2;

  noStroke();
  fill(0, 0, 0, 150);
  rect(boxX, titleY - 24, boxWidth, 28, 10);

  textSize(20);
  fill(255);
  textAlign(CENTER, BOTTOM);
  text(titleText, cameraCenterX, titleY);
}

function getLayout() {
  const margin = 24;
  const gap = 20;
  const panelX = Math.max(margin, width - IMAGE_PANEL_WIDTH - margin);
  const panelY = margin;
  const panelH = Math.max(180, height - margin * 2);
  const cameraX = margin;
  const cameraY = margin;
  const cameraW = Math.max(320, panelX - cameraX - gap);
  const cameraH = Math.max(240, height - margin * 2);

  return { cameraX, cameraY, cameraW, cameraH, panelX, panelY, panelH };
}

function mapPointToCamera(point, cameraX, cameraY, cameraW, cameraH) {
  const sourceWidth = video ? video.width : CAMERA_CAPTURE_WIDTH;
  const sourceHeight = video ? video.height : CAMERA_CAPTURE_HEIGHT;

  return {
    x: cameraX + (point.x / sourceWidth) * cameraW,
    y: cameraY + (point.y / sourceHeight) * cameraH,
  };
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}