/*
 * 👋 Hello! This is an ml5.js example made and shared with ❤️.
 * Learn more about the ml5.js project: https://ml5js.org/
 * ml5.js license and Code of Conduct: https://github.com/ml5js/ml5-next-gen/blob/main/LICENSE.md
 *
 * This example demonstrates face tracking on live video through ml5.faceMesh.
 */

let faceMesh;
let video;
let faces = [];
let options = { maxFaces: 1, refineLandmarks: true, flipHorizontal: false };

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

function preload() {
  // Load the faceMesh model
  faceMesh = ml5.faceMesh(options);
}

function setup() {
  createCanvas(640, 480);
  // Create the webcam video and hide it
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  // Start detecting faces from the webcam video
  faceMesh.detectStart(video, gotFaces);
}

function draw() {
  // Draw the webcam video
  image(video, 0, 0, width, height);

  if (faces.length === 0) {
    drawStatus('Esperando rostro...');
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

  drawStatus(
    'Ojo izq.: ' + (leftEyeOpen ? 'abierto' : 'cerrado') +
      ' | Ojo der.: ' + (rightEyeOpen ? 'abierto' : 'cerrado') +
      ' | Sonrisa: ' + (smileDetected ? 'sí' : 'no'),
    'Ratios -> izq: ' + leftEyeOpenRatio.toFixed(3) +
      ' | der: ' + rightEyeOpenRatio.toFixed(3) +
      ' | sonrisa: ' + smileRatio.toFixed(3)
  );

  if (smileDetected) {
    noFill();
    stroke(255, 200, 0);
    strokeWeight(3);

    const mouthCenterX = (getPoint(face, LANDMARKS.mouthLeft).x + getPoint(face, LANDMARKS.mouthRight).x) / 2;
    const mouthCenterY = (getPoint(face, LANDMARKS.upperLip).y + getPoint(face, LANDMARKS.lowerLip).y) / 2;

    ellipse(mouthCenterX, mouthCenterY, mouthWidth * 1.15, mouthOpen * 2.2 + 30);
  }
}

// Callback function for when faceMesh outputs data
function gotFaces(results) {
  // Save the output to the faces variable
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
  circle(point.x, point.y, 6);
}

function drawStatus(line1, line2 = '') {
  noStroke();
  fill(0, 0, 0, 160);
  rect(10, 10, 620, line2 ? 66 : 40, 10);

  fill(255);
  textSize(18);
  textAlign(LEFT, TOP);
  text(line1, 20, 18);

  if (line2) {
    textSize(14);
    text(line2, 20, 40);
  }
}
