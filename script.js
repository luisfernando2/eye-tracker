/*function drawCoordinates(x,y){
  var ctx = document.getElementById("plotting_canvas").getContext('2d');
  ctx.fillStyle = RED; // Red color
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2, true);
  ctx.fill();
}
*/
const math = window.math;
import GeometryUtil from "./geometry.util.js";

/*const botaopos = document.getElementById("botao")*/
const fundo = document.getElementById("fundo");
const contexto = fundo.getContext("2d");
var maiorx = -99999;
var maiory = -99999;
var menorx = 999999;
var menory = 999999;
var preresultadox = [];
var resultadox = [];
var preresultadoy = [];
var resultadoy = [];
var preresultadoz = [];
var inx = 0;
var iny = 0;
var inz = 0;
var outx = 0;
var outy = 0;
let mesh;
window.addEventListener("keydown", tecla);
/*********/

function tecla(key) {
  let limite = 100; //armazena no maximo 100 valores
  if (key.key === "d") {
    if (
      resultadox[resultadox.length - 1] != outx &&
      resultadox.length < limite
    ) {
      resultadox.push(outx);
      resultadoy.push(outy);
      //preresultadox.push(inx)
      //preresultadoy.push(iny)
      //preresultadoz.push(inz)
      console.log(
        [inx.toFixed(2), iny.toFixed(2), inz.toFixed(2)],
        [outx.toFixed(2), outy.toFixed(2)]
      );
    } else if (resultadox.length == limite) {
      console.log("chegou ao valor maximo de", resultadox.length, "valores");
    }
  } else if (key.key === "r") {
    resultadox = [];
    preresultadox = [];
    resultadoy = [];
    preresultadoy = [];
    preresultadoz = [];
    console.clear();
    console.log("resetou os dados");
  } else if (key.key === "e") {
    //console.log(preresultadox)
    //console.log(preresultadoy)
    console.log(resultadox);
    console.log(resultadoy);
    /*for (let i = 0; i < preresultadox.length; i++){
      console.log("ponto olho: x: " + preresultadox[i].toFixed(2) + " y: " + preresultadoy[i].toFixed(2) + " z: " + preresultadoz[i].toFixed(2))
      console.log("resultado: x:",resultadox[i].toFixed(2),"y:",resultadoy[i].toFixed(2))

    }*/
  }
}

const NUM_KEYPOINTS = 468;
const NUM_IRIS_KEYPOINTS = 5;
const GREEN = "#32EEDB";
const RED = "#FF2C35";
const BLUE = "#157AB3";

function drawLine(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

let output = null;
let model = null;
// ---------------------------------------------------------------
async function setupWebcam() {
  return new Promise((resolve, reject) => {
    console.log("Setup da Webcam");
    const webcamElement = document.getElementById("webcam");
    const navigatorAny = navigator;
    navigator.getUserMedia =
      navigator.getUserMedia ||
      navigatorAny.webkitGetUserMedia ||
      navigatorAny.mozGetUserMedia ||
      navigatorAny.msGetUserMedia;
    if (navigator.getUserMedia) {
      navigator.getUserMedia(
        { video: true },
        stream => {
          webcamElement.srcObject = stream;
          webcamElement.addEventListener("loadeddata", resolve, false);
        },
        error => reject()
      );
    } else {
      reject();
    }
  });
}
// ---------------------------------------------------------------
function calculaCoordenadas(x, y) {}

// ---------------------------------------------------------------
async function trackFace() {
  //DESENHA CÍRCULO DE LIMITAÇÃO
  output.beginPath();
  output.arc(640 / 2, 480 / 2, 150, 0, Math.PI * 2, true);
  output.stroke();

  const video = document.getElementById("webcam");
  const faces = await model.estimateFaces({
    input: video,
    returnTensors: false,
    flipHorizontal: false,
    predictIrises: true
  });

  output.drawImage(
    video,
    0,
    0,
    video.width,
    video.height,
    0,
    0,
    video.width,
    video.height
  );

  faces.forEach(face => {
    // Draw the bounding box
    const x1 = face.boundingBox.topLeft[0];
    const y1 = face.boundingBox.topLeft[1];
    const x2 = face.boundingBox.bottomRight[0];
    const y2 = face.boundingBox.bottomRight[1];
    const bWidth = x2 - x1;
    const bHeight = y2 - y1;
    drawLine(output, x1, y1, x2, y1);
    drawLine(output, x2, y1, x2, y2);
    drawLine(output, x1, y2, x2, y2);
    drawLine(output, x1, y1, x1, y2);

    // keypoints  recebe a matriz com os valores x,y,z de cada keypont mapeado
    const keypoints = face.scaledMesh;
    //console.log("keypoints: " + keypoints.length);
    //---------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------
    // desenha os pontos
    //console.log(keypoints) 20/4
    output.strokeStyle = GREEN;
    output.lineWidth = 2.0;
    output.fillStyle = GREEN;
    let a = [],
      b = [],
      c = [];
    /*for (let i = 0; i < NUM_KEYPOINTS; i++) {
      const x = keypoints[i][0];
      const y = keypoints[i][1];
      const z = keypoints[i][2];

      contexto.beginPath();
      contexto.arc(x, y, 1, 0, 2 * Math.PI); //1 eh o raio
      contexto.fill();
    }*/
    //ponto:  295.8774108886719 266.49322509765625 -0.3770290017127991
    //angulos:  -9.54806817078692 -5.103096396584392 -2.6529650097592334
    /*const x = keypoints[1][0]; //(274.9 , 236.2 , 0.97)
    const y = keypoints[1][1];
    const z = keypoints[1][2];*/
    //console.log("ponto: ", x, y, z);
    //output.beginPath();
    let x,y;
    mesh = face.scaledMesh;
    let le = mesh[468]; // left eye coordinates
    let re = mesh[473]; // right eye coordinates
    //console.log("esq:"+le[0]+le[1]+"\n dir:"+re[0]+re[1]);
    x = (le[0] + re[0])/2
    y = (le[1] + re[1])/2
    
    for (let i=468;i<474;i+=5) {
      output.beginPath()
      output.arc(mesh[i][0], mesh[i][1], 3, 0, 2 * Math.PI)
      output.fill();
    }
    //output.rect(mesh[468][0], mesh[468][1], 5, 5);
    //output.rect(mesh[473][0], mesh[473][1], 5, 5);
    inx = x;
    iny = y;
    output.beginPath()
    output.arc(x, y, 3, 0, 2 * Math.PI); //3 eh o raio
    output.fill();

    //TESTE PROJETAR VETORES X,Y,Z
    contexto.clearRect(0, 0, fundo.width, fundo.height);
    //for(let i=468;i<474;i+=5){
    //for(let i=0;i<6;i+=5){
    //471, cima:470, dir:469, baixo:472, meio:468
    const centroide = math.mean([mesh[470], mesh[472], mesh[469], mesh[471]],0);
    
    //console.log(centroide[0],centroide[1],centroide[2]);
    const { origin, rotationMatrix, pitch, yaw, roll } = computeHeadRotation(face, mesh[4]);
    drawAxis(contexto, origin, rotationMatrix);  //contexto para seta no meio da tela, output no video
    //}


  });
  //---------------------------------------------------------------------
  //let mesh = face.scaledMesh;
  //console.log("antes", mesh[473]);
  requestAnimationFrame(trackFace);
  //console.log("depois", mesh[473]);
}
//-----------------------------------------------------------------
(async () => {
  await setupWebcam();
  const video = document.getElementById("webcam");
  video.play();
  let videoWidth = video.videoWidth;
  let videoHeight = video.videoHeight;
  video.width = videoWidth;
  video.height = videoHeight;

  let canvas = document.getElementById("output");
  canvas.width = video.width;
  canvas.height = video.height;

  output = canvas.getContext("2d");
  //comentei translate e scale  resultado: a camera mudou de posicao
  let fundo = document.getElementById("fundo");

  let f = fundo.getContext("2d");
  fundo.width = video.width;
  fundo.height = video.height;
  f.translate(window.width / 2, window.height / 2); //
  f.translate(canvas.width, 0); //canvas.width, 0
  f.scale(-1, 1);
  output.translate(canvas.width, 0); //canvas.width, 0
  output.scale(-1, 1); //Mirror cam
  output.fillStyle = "#fdffb6";
  output.strokeStyle = "#fdffb6";
  output.lineWidth = 1; //mudei para ficar linha fina

  console.log("Inicio carregamento do modelo");
  // Load Face Landmarks Detection
  model = await faceLandmarksDetection.load(
    faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
  );
  console.log("modelo carregado");

  f.fillStyle = GREEN;
  f.fillRect(0, 0, 10, 10); //Ponto na origem do canvas para comparação

  trackFace();
})();

function computeHeadRotation(face, origem) {
  var { origin, rotationMatrix } = GeometryUtil.computeHeadPoseEstimation(face, origem);
  const { pitch, yaw, roll } = GeometryUtil.rotationMatrixToEulerAngles(
    rotationMatrix
  );
  //const eyesDistance = math.norm(math.subtract(le, re));
  
  let mesh = face.scaledMesh;

  return { origin, rotationMatrix, pitch, yaw, roll };
}
function drawAxis(ctx, origin, rotationMatrix) {
   let limitX = math.subtract(origin, math.multiply(math.squeeze(math.row(rotationMatrix, 0)), 100.0)).toArray();
        drawArrow([origin[1], origin[0]], [limitX[1], limitX[0]], "red", 1.0, ctx, 3);
        let limitY = math.add(origin, math.multiply(math.squeeze(math.row(rotationMatrix, 1)), 100.0)).toArray();
        drawArrow([origin[1], origin[0]], [limitY[1], limitY[0]], "green", 1.0, ctx, 3);
  let limitZ = math
    .subtract(
      origin,
      math.multiply(math.squeeze(math.row(rotationMatrix, 2)), 1000.0) //alterar tamanho da seta
    )
    .toArray();
  outx = limitZ[0];
  outy = limitZ[1];
  drawArrow(
    [origin[1], origin[0]],
    [limitZ[1], limitZ[0]],
    "blue",
    1.0,
    ctx,
    3
  );
}

function drawArrow([ay, ax], [by, bx], color, scale, ctx, lineWidth = 2) {
  var headlen = 10; // length of head in pixels
  var dx = bx - ax;
  var dy = by - ay;
  var angle = Math.atan2(dy, dx);
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.lineTo(
    bx - headlen * Math.cos(angle - Math.PI / 6),
    by - headlen * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(bx, by);
  ctx.lineTo(
    bx - headlen * Math.cos(angle + Math.PI / 6),
    by - headlen * Math.sin(angle + Math.PI / 6)
  );
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.stroke();
}
