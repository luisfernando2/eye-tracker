const math = window.math;
import GeometryUtil from "./geometry.util.js";
//import Rosto from "./rosto.js";

/*const botaopos = document.getElementById("botao")*/
const fundo = document.getElementById("fundo");
const contexto = fundo.getContext("2d");
const botao = document.getElementById("botao");
let mesh;
var pontox;
var pontoy;
var difx = 0;
var dify = 0;
var divx = 2;
var divy = 2;
var vetx = [];
var vety = [];
var cont = 0; // tem que ser 1 se usar click
var olho_direito;
var olho_esquerdo;
var re;
var le;

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

var botoes = [];

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
  //botao

  faces.forEach(face => {
    // keypoints  recebe a matriz com os valores x,y,z de cada keypont mapeado
    const keypoints = face.scaledMesh;
    //----------------------------------------------------------------------------------------------
    // desenha os pontos
    output.strokeStyle = GREEN;
    output.lineWidth = 2.0;
    output.fillStyle = GREEN;
    let a = [],
      b = [],
      c = [];
    let x, y;
    mesh = face.scaledMesh;
    let can = document.getElementById("output");
    let out = can.getContext("2d");
    var r = new Rosto(mesh);
    olho_direito = r.olho.direito.pupila;
    olho_esquerdo = r.olho.esquerdo.pupila;
    re = olho_direito.centro; // right eye coordinates centro: pontos[473], cima: pontos[475],
    // direita: pontos[474], baixo: pontos[477], esquerda: pontos[476]

    le = olho_esquerdo.centro; // left eye coordinates  centro: pontos[468],
    //cima: pontos[470],
    //direita: pontos[469],
    //baixo: pontos[472],
    //esquerda: pontos[471]
    x = (le[0] + re[0]) / 2;
    y = (le[1] + re[1]) / 2;
    //TESTE PROJETAR VETORES X,Y,Z
    contexto.clearRect(0, 0, fundo.width, fundo.height);
    const centroide = math.mean(
      [
        olho_esquerdo.cima,
        olho_esquerdo.direita,
        olho_esquerdo.baixo,
        olho_esquerdo.esquerda
      ],
      0
    );
    const {
      origin,
      rotationMatrix,
      pitch,
      yaw,
      roll,
      ptx,
      pty
    } = computeHeadRotation(face, mesh[4], difx, dify, divx, divy);
    pontox = ptx;
    pontoy = pty;
    drawAxis(contexto, origin, rotationMatrix); //contexto para seta no meio da tela, output no video
    
    var z= re[2]+le[2];
    contexto.font = "40px Arial";
    contexto.strokeText(z.toFixed(2), keypoints[10][0], keypoints[10][1]);
    
    var eyesDistance = math.norm(math.subtract(keypoints[473], keypoints[468]));
    //console.log(eyesDistance)
  });
  requestAnimationFrame(trackFace);
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

  const f = fundo.getContext("2d");

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

function computeHeadRotation(face, origem, x, y,dx,dy) {
  var {
    origin,
    rotationMatrix,
    ptx,
    pty
  } = GeometryUtil.computeHeadPoseEstimation(face, origem, x, y,dx,dy);
  const { pitch, yaw, roll } = GeometryUtil.rotationMatrixToEulerAngles(
    rotationMatrix
  );
  //const eyesDistance = math.norm(math.subtract(le, re));

  let mesh = face.scaledMesh;

  return { origin, rotationMatrix, pitch, yaw, roll, ptx, pty };
}
function drawAxis(ctx, origin, rotationMatrix) {
  let limitX = math
    .subtract(
      origin,
      math.multiply(math.squeeze(math.row(rotationMatrix, 0)), 100.0)
    )
    .toArray();
  drawArrow([origin[1], origin[0]], [limitX[1], limitX[0]], "red", 1.0, ctx, 3);
  let limitY = math
    .add(
      origin,
      math.multiply(math.squeeze(math.row(rotationMatrix, 1)), 100.0)
    )
    .toArray();
  drawArrow(
    [origin[1], origin[0]],
    [limitY[1], limitY[0]],
    "green",
    1.0,
    ctx,
    3
  );
  let limitZ = math
    .subtract(
      origin,
      math.multiply(math.squeeze(math.row(rotationMatrix, 2)), 900.0) //alterar tamanho da seta
    )
    .toArray();
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

const click3 = function calibra3() { 
  if (cont < 5) {
    vetx[cont] = (mesh[130][0] + mesh[359][0]) / ((mesh[473][0] + mesh[468][0])/2);
    vety[cont] = (mesh[52][1] + mesh[230][1]) / mesh[159][1];
    console.log(vetx[cont]);
    cont++;
  }
  if (cont == 5) {
    vetx.sort();
    vety.sort();
    vetx.pop();
    vety.pop();
    vetx.shift();
    vety.shift();
    divx = math.mean(vetx); 
    divy = math.mean(vety);
    cont = 6;
    console.log(divx + "," + divy);
  }
};

const click2 = function calibra() {
  if (cont < 5) {
    vetx[cont] = (olho_direito.centro[0] + olho_esquerdo.centro[0] ) / 2;
    vety[cont] = mesh[159][1];
    console.log(vetx[cont]);
    cont++;
  }
  if (cont == 5) {
    vetx.sort();
    vety.sort();
    vetx.pop();
    vety.pop();
    vetx.shift();
    vety.shift();
    difx = pontox[0] - math.mean(vetx);
    dify = pontoy[1] - math.mean(vety);
    cont = 6;
    console.log(difx + "," + dify);
  }
};
const click = function calibra() {
  cont++;
  difx = (difx + (pontox[0] - (mesh[473][0] + mesh[468][0]) / 2)) / cont;
  dify = (dify + (pontoy[1] - mesh[159][1])) / cont;
  console.log(difx, dify);
};

botao.onclick = click3;

function draw(x, y, ctx, cor = "#00ff00", raio = 5) {
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.arc(x, y, raio, 0, Math.PI * 2, true);
  ctx.fill();
}

class Rosto {
  constructor(pontos) {
    this.olho = {
      direito: {
        pupila: {
          centro: pontos[473],
          cima: pontos[475],
          direita: pontos[474],
          baixo: pontos[477],
          esquerda: pontos[476]
        }
      },

      esquerdo: {
        pupila: {
          centro: pontos[468],
          cima: pontos[470],
          direita: pontos[469],
          baixo: pontos[472],
          esquerda: pontos[471]
        }
      }
    };
  }
}
