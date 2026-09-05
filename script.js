import {FaceDetector, FilesetResolver} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

const video = document.getElementById('webcam');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

let facedetector;
let lvt = -1; // avoid duplicate detections

async function setup () {
    try{
        status.innerText = "Loading scrambler...";
        
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        
        facedetector = await FaceDetector.createFromOptions(vision,{
            baseOptions:{
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
                delegate: "GPU"
            },
            runningMode: "VIDEO"
        });

        status.innerText = "Accessing camera...";
        startCamera();
    }catch (err) {
        status.innerText = "Error: " + err.message;
        console.error(err);
    }
}

async function startCamera () {
    try{
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        video.srcObject = stream;
        video.addEventListener("loadeddata", () => {
            canvas.width = video.videoWidth || 1280;
            canvas.height = video.videoHeight || 720;
            status.innerText = "Scrambler Active";
            renderLoop();
        });
    }catch (err) {
        status.innerText = "Error: " + err.message;
        console.error(err);
    }
}

function renderLoop () {
    if (video.currentTime !== lvt && facedetector) {
        lvt = video.currentTime;
        const detections = facedetector.detectForVideo(video, performance.now()).detections;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const detection of detections) {
            const{ originX, originY, width, height } = detection.boundingBox;
            scrambleeffect(originX, originY, width, height);
        }
    }
    requestAnimationFrame(renderLoop);
}

function scrambleeffect(x, y, w, h){
    const X = x + w / 2;
    const Y = y + h / 2;

    const techCyan = "rgba(180, 245, 240, 0.9)";
    const faintCyan = "rgba(180, 245, 240, 0.4)";

    const numBlackBoxes = 4;
    for (let i = 0; i < numBlackBoxes; i++){
        const shiftX = (Math.random() - 0.5) * (w * 0.4);
        const shiftY = (Math.random() - 0.5) * (h * 0.4);
        
        const boxW = w * (0.6 + Math.random() * 0.6);
        const boxH = h * (0.6 + Math.random() * 0.6);

        ctx.fillStyle = "#000000";
        ctx.fillRect(
            X - boxW / 2 + shiftX, 
            Y - boxH / 2 + shiftY, 
            boxW, 
            boxH
        );
    }

    const numCyanBoxes = 3;
    for (let i = 0; i < numCyanBoxes; i++) {
        const jitterX = (Math.random() - 0.5) * 30;
        const jitterY = (Math.random() - 0.5) * 30;
        const boxW = w * (0.35 + Math.random() * 0.3);
        const boxH = h * (0.35 + Math.random() * 0.3);

        ctx.strokeStyle = techCyan;
        ctx.lineWidth = 1;
        ctx.strokeRect(X - boxW / 2 + jitterX, Y - boxH / 2 + jitterY, boxW, boxH);
    }

    ctx.strokeStyle = faintCyan;
    ctx.lineWidth = 1;
    const lineSpacing = 6;
    const gridW = w * 0.35;
    const gridJitterX = (Math.random() - 0.5) * 15;
    const startX = (X - gridW / 2) + gridJitterX;
    const gridY = Y - h * 0.25 + ((Math.random() - 0.5) * 10);
    
    for (let lx = startX; lx <= startX + gridW; lx += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(lx, gridY);
        ctx.lineTo(lx, gridY + (h * 0.15));
        ctx.stroke();
    }

    drawCrosshair(X + (w * 0.4) + (Math.random() - 0.5) * 20, Y + (h * 0.4) + (Math.random() - 0.5) * 20, 8, techCyan);
    drawCrosshair(X - (w * 0.35) + (Math.random() - 0.5) * 20, Y + (h * 0.25) + (Math.random() - 0.5) * 20, 6, faintCyan);
    drawCrosshair(X + (Math.random() - 0.5) * 25, Y - 15 + (Math.random() - 0.5) * 15, 5, techCyan);

    const bracketSize = 12;
    const bX = X - (w * 0.35) + (Math.random() - 0.5) * 10;
    const bY = Y - (h * 0.2) + (Math.random() - 0.5) * 10;

    ctx.strokeStyle = techCyan;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bX, bY + bracketSize);
    ctx.lineTo(bX, bY);
    ctx.lineTo(bX + bracketSize, bY);
    ctx.stroke();

    ctx.fillStyle = techCyan;
    ctx.fillRect(X + (Math.random() - 0.5) * 40, Y - 25 + (Math.random() - 0.5) * 15, 3, 3);
    ctx.fillRect(X - 10 + (Math.random() - 0.5) * 30, Y - (h * 0.4) + (Math.random() - 0.5) * 30, 2, 2);
    ctx.fillRect(X + (w * 0.3) + (Math.random() - 0.5) * 20, Y + (Math.random() - 0.5) * 30, 3, 3);
}

function drawCrosshair(cx, cy, size, color){
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - size, cy);
    ctx.lineTo(cx + size, cy);
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx, cy + size);
    ctx.stroke();
}

setup();
