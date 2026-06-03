let faceMesh;
let video;
let faces = [];

const options = { maxFaces: 1, refineLandmarks: true, flipHorizontal: false };

const LANDMARKS = {
  leftEyeOuter: 33,
  leftEyeInner: 133,
  leftEyeUpper: 159,
  leftEyeLower: 145,
  rightEyeOuter: 263,
  rightEyeInner: 362,
  rightEyeUpper: 386,
  rightEyeLower: 374,
  mouthLeft: 61,
  mouthRight: 291,
  upperLip: 13,
  lowerLip: 14,
  faceLeft: 234,
  faceRight: 454,
};

const IMAGES = {};

function preload() {
  faceMesh = ml5.faceMesh(options);
  IMAGES.openEyes = loadImage('Ojos abiertos.jpg');
  IMAGES.pearl = loadImage('perla.jpg');
  IMAGES.leftEyeClosed = loadImage('Ojos cerrados.png');
  IMAGES.smile1 = loadImage('sonrisa.jpg');
  IMAGES.smile2 = loadImage('sonrisa2.jpeg');
}

function setup() {
  createCanvas(1000, 700);
  textFont('Arial');
  textSize(16);

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  faceMesh.detectStart(video, gotFaces);
}

function draw() {
  background(18);

  image(video, 20, 20, 640, 480);

  if (faces.length === 0) {
    drawStatus('Esperando rostro...', 'Acerca tu cara a la cámara.');
    drawPreview(null, 'Sin detección');
    return;
  }

  const face = faces[0];
  const faceWidth = distance(face, LANDMARKS.faceLeft, LANDMARKS.faceRight);

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
  const leftEyeClosed = leftEyeOpenRatio <= 0.18;
  const smileDetected = smileRatio > 0.42 && mouthOpenRatio < 0.12;

  drawLandmark(face, LANDMARKS.leftEyeOuter);
  drawLandmark(face, LANDMARKS.leftEyeInner);
  drawLandmark(face, LANDMARKS.leftEyeUpper);
  drawLandmark(face, LANDMARKS.leftEyeLower);
  drawLandmark(face, LANDMARKS.rightEyeOuter);
  drawLandmark(face, LANDMARKS.rightEyeInner);
  drawLandmark(face, LANDMARKS.rightEyeUpper);
  drawLandmark(face, LANDMARKS.rightEyeLower);
  drawLandmark(face, LANDMARKS.mouthLeft);
  drawLandmark(face, LANDMARKS.mouthRight);
  drawLandmark(face, LANDMARKS.upperLip);
  drawLandmark(face, LANDMARKS.lowerLip);

  const selection = chooseGestureImage({
    leftEyeOpenRatio,
    rightEyeOpenRatio,
    smileRatio,
    mouthOpenRatio,
    leftEyeOpen,
    rightEyeOpen,
    leftEyeClosed,
    smileDetected,
  });

  drawStatus(
    'Ojo izq.: ' + (leftEyeOpen ? 'abierto' : 'cerrado') +
      ' | Ojo der.: ' + (rightEyeOpen ? 'abierto' : 'cerrado') +
      ' | Sonrisa: ' + (smileDetected ? 'sí' : 'no'),
    'Ratios -> izq: ' + leftEyeOpenRatio.toFixed(3) +
      ' | der: ' + rightEyeOpenRatio.toFixed(3) +
      ' | sonrisa: ' + smileRatio.toFixed(3)
  );

  drawPreview(selection.image, selection.label, selection.detail);

  if (smileDetected) {
    noFill();
    stroke(255, 200, 0);
    strokeWeight(3);

    const mouthCenterX = (getPoint(face, LANDMARKS.mouthLeft).x + getPoint(face, LANDMARKS.mouthRight).x) / 2;
    const mouthCenterY = (getPoint(face, LANDMARKS.upperLip).y + getPoint(face, LANDMARKS.lowerLip).y) / 2;

    ellipse(mouthCenterX, mouthCenterY, mouthWidth * 1.15, mouthOpen * 2.2 + 30);
  }
}

function chooseGestureImage(state) {
  if (state.smileDetected) {
    const smileTarget = 0.48;
    const smileAltTarget = 0.56;
    const currentSmile = state.smileRatio;
    const useFirst = Math.abs(currentSmile - smileTarget) <= Math.abs(currentSmile - smileAltTarget);

    return {
      image: useFirst ? IMAGES.smile1 : IMAGES.smile2,
      label: 'Sonrisa',
      detail: useFirst ? 'sonrisa.jpg' : 'sonrisa2.jpeg',
    };
  }

  if (state.leftEyeClosed && state.rightEyeOpen) {
    return {
      image: IMAGES.leftEyeClosed,
      label: 'Ojo izquierdo cerrado',
      detail: 'Ojos cerrados.png',
    };
  }

  if (state.leftEyeOpen && state.rightEyeOpen) {
    const openScore = (state.leftEyeOpenRatio + state.rightEyeOpenRatio) / 2;
    const useOpenImage = openScore >= 0.22;

    return {
      image: useOpenImage ? IMAGES.openEyes : IMAGES.pearl,
      label: 'Ojos abiertos',
      detail: useOpenImage ? 'Ojos abiertos.jpg' : 'perla.jpg',
    };
  }

  return {
    image: IMAGES.pearl,
    label: 'Gesto mixto',
    detail: 'perla.jpg',
  };
}

function drawPreview(img, label, detail = '') {
  const panelX = 680;
  const panelY = 20;
  const panelW = 300;
  const panelH = 480;

  noStroke();
  fill(34);
  rect(panelX, panelY, panelW, panelH, 18);

  fill(255);
  textAlign(LEFT, TOP);
  textSize(18);
  text(label, panelX + 16, panelY + 14);

  if (detail) {
    textSize(13);
    fill(210);
    text(detail, panelX + 16, panelY + 40);
  }

  if (img) {
    const previewW = panelW - 32;
    const previewH = 360;
    const imgRatio = img.width / img.height;
    const boxRatio = previewW / previewH;

    let drawW = previewW;
    let drawH = previewH;
    if (imgRatio > boxRatio) {
      drawH = previewW / imgRatio;
    } else {
      drawW = previewH * imgRatio;
    }

    imageMode(CENTER);
    image(img, panelX + panelW / 2, panelY + 250, drawW, drawH);
    imageMode(CORNER);
  }
}

function gotFaces(results) {
  faces = results;
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

function drawLandmark(face, index) {
  const point = getPoint(face, index);
  fill(0, 255, 0);
  noStroke();
  circle(point.x + 20, point.y + 20, 6);
}

function drawStatus(line1, line2 = '') {
  noStroke();
  fill(0, 0, 0, 170);
  rect(20, 520, 960, line2 ? 74 : 46, 12);

  fill(255);
  textSize(18);
  textAlign(LEFT, TOP);
  text(line1, 34, 530);

  if (line2) {
    textSize(14);
    text(line2, 34, 556);
  }
}