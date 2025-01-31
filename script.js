const POINT_RADIUS = 5;
const MAX_DISTANCE = 10;

const curveCanvas = document.getElementById('curveCanvas');
const hodographCanvas = document.getElementById('hodographCanvas');
const curveCtx = curveCanvas.getContext('2d');
const hodoCtx = hodographCanvas.getContext('2d');

curveCanvas.width = hodographCanvas.width = curveCanvas.parentElement.clientWidth;
curveCanvas.height = hodographCanvas.height = curveCanvas.parentElement.clientHeight;

let controlPoints = [];
let selectedPoint = null;

function drawPoint(ctx, point, color) {
  ctx.beginPath();
  ctx.arc(point.x, point.y, POINT_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.closePath();
}

function drawLine(ctx, points, color) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();
}

function calculateDerivative(points) {
  const derivative = [];
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    derivative.push({ x: dx, y: dy });
  }
  return derivative;
}

function calculateBezierCurve(points) {
  const steps = 100;
  const curvePoints = [];
  for (let t = 0; t <= 1; t += 1 / steps) {
    curvePoints.push(deCasteljau(points, t));
  }
  return curvePoints;
}

function deCasteljau(points, t) {
  let currentPoints = points.map(p => ({ ...p }));
  while (currentPoints.length > 1) {
    const nextPoints = [];
    for (let i = 0; i < currentPoints.length - 1; i++) {
      const x = (1 - t) * currentPoints[i].x + t * currentPoints[i + 1].x;
      const y = (1 - t) * currentPoints[i].y + t * currentPoints[i + 1].y;
      nextPoints.push({ x, y });
    }
    currentPoints = nextPoints;
  }
  return currentPoints[0];
}

function drawCurvePanel() {
  curveCtx.clearRect(0, 0, curveCanvas.width, curveCanvas.height);
  drawLine(curveCtx, controlPoints, 'pink');
  controlPoints.forEach(point => drawPoint(curveCtx, point, 'black'));
  if (controlPoints.length > 1) {
    const bezierCurve = calculateBezierCurve(controlPoints);
    drawLine(curveCtx, bezierCurve, 'blue');
  }
}

function drawHodographPanel() {
  hodoCtx.clearRect(0, 0, hodographCanvas.width, hodographCanvas.height);
  const derivative = calculateDerivative(controlPoints);
  derivative.forEach(point => drawPoint(hodoCtx, { x: point.x + 300, y: point.y + 300 }, 'white'));
  if (derivative.length > 1) {
    drawLine(hodoCtx, derivative.map(p => ({ x: p.x + 300, y: p.y + 300 })), 'green');
    const hodoCurve = calculateBezierCurve(derivative);
    drawLine(hodoCtx, hodoCurve.map(p => ({ x: p.x + 300, y: p.y + 300 })), 'orange');
  }
}

function getClosestPoint(point) {
  let closest = null;
  let minDistance = Infinity;
  controlPoints.forEach((p, index) => {
    const distance = Math.hypot(p.x - point.x, p.y - point.y);
    if (distance < minDistance && distance < MAX_DISTANCE) {
      closest = { index, point: p };
      minDistance = distance;
    }
  });
  return closest;
}

curveCanvas.addEventListener('mousedown', e => {
  const rect = curveCanvas.getBoundingClientRect();
  const mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  const closest = getClosestPoint(mousePos);
  if (closest) {
    selectedPoint = closest.index;
  } else {
    controlPoints.push(mousePos);
    drawCurvePanel();
    drawHodographPanel();
  }
});

curveCanvas.addEventListener('mousemove', e => {
  if (selectedPoint !== null) {
    const rect = curveCanvas.getBoundingClientRect();
    controlPoints[selectedPoint] = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    drawCurvePanel();
    drawHodographPanel();
  }
});

curveCanvas.addEventListener('mouseup', () => {
  selectedPoint = null;
});

curveCanvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  const rect = curveCanvas.getBoundingClientRect();
  const mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  const closest = getClosestPoint(mousePos);
  if (closest) {
    controlPoints.splice(closest.index, 1);
    drawCurvePanel();
    drawHodographPanel();
  }
});

drawCurvePanel();
drawHodographPanel();
