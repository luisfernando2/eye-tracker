const math = window.math;

// Converts from degrees to radians.
Math.radians = degrees => (degrees * Math.PI) / 180;
// Converts from radians to degrees.
Math.degrees = radians => (radians * 180) / Math.PI;

export default class GeometryUtil {
  /**
   * find the angle between 3 point in the 2d space
   * @param p1
   * @param p2
   * @param p3
   * @returns {number}
   */
  static findAngle(p1, p2, p3) {
    const p12 = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    const p13 = Math.sqrt(Math.pow(p1.x - p3.x, 2) + Math.pow(p1.y - p3.y, 2));
    const p23 = Math.sqrt(Math.pow(p2.x - p3.x, 2) + Math.pow(p2.y - p3.y, 2));
    const angle = Math.acos(
      (Math.pow(p12, 2) + Math.pow(p13, 2) - Math.pow(p23, 2)) / (2 * p12 * p13)
    );
    return angle;
  }

  /**
   * scale a value
   * @param original
   * @param in_min
   * @param in_max
   * @param out_min
   * @param out_max
   * @returns {*}
   */
  static map(original, in_min, in_max, out_min, out_max) {
    return (
      ((original - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min
    );
  }

  static computeHeadPoseEstimation(face, origem) {
    const { annotations, scaledMesh } = face;
    const { leftCheek, rightCheek } = annotations;
    // grab the landmark points
    const points = math.matrix(scaledMesh);
    //1. create new coordinate system
    //choose the origin point
    // const { noseTip } = annotations;
    const origin = origem;
    //compute inner distance between extreme points
    const cheeksDistance = math.norm(
      math.subtract(leftCheek[0], rightCheek[0])
    );
    // scale coordinates
    const scaled = math.divide(points, cheeksDistance);
    // normalized coordinates - 0-1
    const centered = math.subtract_(points, math.mean(scaled, 0));

    // pick target coordinates
    let a = math.squeeze(math.row(centered, 33)).toArray(); //left eyes - 33 idx 
    let b = math.squeeze(math.row(centered, 263)).toArray(); // right eye - 263 idx 
    let c = [(a[0] + b[0]) / 2, a[1], a[2]]; 
    let d = math.squeeze(math.row(centered, 152)).toArray(); //queixo; 
    let palpebra = math.squeeze(math.row(centered, 159)).toArray(); // palpebra 159
    let eye1=math.squeeze(math.row(centered, 473)).toArray(); // pupila olho direito 473 
    let eye2=math.squeeze(math.row(centered, 468)).toArray(); // pupila olho esquerdo 468 
    let mediaOlhos =[(eye1[0]+eye2[0])/2,(eye1[1]+eye2[1])/2,(eye1[2]+eye2[2])/2]
    
    let canvas = document.getElementById("output");
    let output = canvas.getContext("2d");
    //desenha vetores que orientam eixos x e y
    drawArrow([b[1], b[0]], [a[1], a[0]], output, 3);
    drawArrow([d[1], d[0]], [c[1], c[0]], output, 3);
    
    
    //Compensa moximento horizontal da pupila no eixo z
  
    let p1= math.squeeze(math.row(centered, 130)).toArray();//esq
    let p2= math.squeeze(math.row(centered, 359)).toArray();//dir
    let p3=[(p1[0]+p2[0])/2 -0.5,p1[1],p1[2]]; //ponto esperado no eixo x
    let distH = p3[0] - mediaOlhos[0];  //positivo olha pra direita, negativo olha pra esquerda
    if(distH > 0){
      a=[a[0],a[1],a[2]+9*distH];  //z aumenta quando se afasta da tela, e diminui quando nos aproximamos
      b=[b[0],b[1],b[2]-9*distH];
    }
    else if(distH < 0){
      a=[a[0],a[1],a[2]-Math.abs(9*distH)];  //z aumenta quando se afasta da tela, e diminui quando nos aproximamos
      b=[b[0],b[1],b[2]+Math.abs(9*distH)];
    }
    
    
    //Compensa movimento vertical da pálpebra no eixo z 
    
    let p4= math.squeeze(math.row(centered, 52)).toArray(); //cima
    let p5= math.squeeze(math.row(centered, 230)).toArray(); //baixo
    let p6=[p4[0],(p4[1]+p5[1])/2 +0.8,p4[2]]; // ponto esperado no eixo y
    let p7=math.squeeze(math.row(centered, 473)).toArray(); // pupila olho direito
    let p8=math.squeeze(math.row(centered, 468)).toArray(); // pupila olho esquerdo
    var aux=p7[2]+p8[2];
    if(aux>6.0){    //"Filtra" mudanças muito bruscas
      aux=6.0;
    }
    if(aux<(-6.0)){
      aux=-6.0;
    }
    p6[1]=p6[1]+ (aux/4); // compensa giro vertical da cabeça na posição esperada da pálpebra
    let distV = p6[1]-palpebra[1];  //positivo olha pra cima, negativo olha pra baixo
    if(distV>0){
      c=[c[0],c[1],c[2]+8*distV];  //z aumenta quando se afasta da tela, e diminui quando nos aproximamos
      d=[d[0],d[1],d[2]-8*distV];
    }
    else if(distV<0){
      c=[c[0],c[1],c[2]-Math.abs(8*distV)];  //z aumenta quando se afasta da tela, e diminui quando nos aproximamos
      d=[d[0],d[1],d[2]+Math.abs(8*distV)];
    }
    //console.log("esq:"+p7[2].toFixed(2)+"dir:"+p8[2].toFixed(2)+"aux:"+aux.toFixed(2));

    //desenha alguns pontos no canvas para acompanharmos
  /*  output.fillStyle = "#32EEDB";
    output.beginPath()
    output.arc(e[0], e[1], 3, 0, 2 * Math.PI); //ponto central da pupila estimado
    output.fill();
    output.fillStyle = "#FF2C35";
    output.beginPath()
    output.arc(p3[0], p6[1], 3, 0, 2 * Math.PI); //ponto central da pupila estimado
    output.fill();
    output.beginPath()
    output.arc(p4[0], p4[1], 3, 0, 2 * Math.PI); //3 eh o raio
    output.fill();
    output.beginPath()
    output.arc(p5[0], p5[1], 3, 0, 2 * Math.PI); //3 eh o raio
    output.fill();*/
    
    output.fillStyle = "#32EEDB";
    output.beginPath()
    output.arc(p3[0], p3[1], 3, 0, 2 * Math.PI); //ponto central da pupila estimado
    output.fill();
    output.fillStyle = "#FF2C35";
    output.beginPath()
    output.arc(mediaOlhos[0], mediaOlhos[1], 3, 0, 2 * Math.PI); //3 eh o raio
    output.fill();
    output.beginPath()
    output.arc(p1[0], p1[1], 3, 0, 2 * Math.PI); //3 eh o raio
    output.fill();
    output.beginPath()
    output.arc(p2[0], p2[1], 3, 0, 2 * Math.PI); //3 eh o raio
    output.fill();
   
    
    // using pitagoras and identity functions
    let rx = math.subtract(a, b); //vetor que sai b e chega em a (a-b)
    rx = math.divide(rx, math.norm(rx));
    
    // using pitagoras and identity functions
    let ry = math.subtract(c, d);
    ry = math.divide(ry, math.norm(ry));

    // project z vector as computing the cross product
    let rz = math.cross(rx, ry);

    // create rotation matrix
    let rotationMatrix = math.matrix([rx, ry, rz]);

    return { origin, rotationMatrix };
  }

  static computeEyePoseEstimation() {}

  /**
   * transform a rotation matrix into euler angles representation
   * @param R
   * @returns {{roll: *, pitch: *, yaw: *}}
   */
  static rotationMatrixToEulerAngles(R) {
    R = R.toArray(); // convert mat.js array to js native array
    let sy = Math.sqrt(Math.pow(R[0][0], 2) + Math.pow(R[1][0], 2));
    let isSingular = sy < 1e-6;
    let x = 0;
    let y = 0;
    let z = 0;
    if (!isSingular) {
      x = Math.atan2(R[2][1], R[2][2]);
      y = Math.atan2(-R[2][0], sy);
      z = Math.atan2(R[1][0], -R[0][0]);
    } else {
      x = Math.atan2(-R[1][2], R[1][1]);
      y = Math.atan2(-R[2][0], sy);
      z = 0;
    }
    let pitch = Math.degrees(y); //x    //MUDEI, ANTES TAVA Math.radians
    let yaw = Math.degrees(z); //y
    let roll = Math.degrees(x); //z

    return { pitch, yaw, roll };
  }
}

math.import({
  /**
   * multiply a 1d vector for each row in a 2d matrix
   * @param X
   * @param y
   * @returns {*}
   * @private
   */
  subtract_: (X, y) => {
    const _X = math.clone(X);
    for (let rowIndex = 0; rowIndex < _X.length; rowIndex++) {
      const row = X[rowIndex];
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const column = row[colIndex];
        // Supports y.length === 1 or y.length === row.length
        if (y.length === 1) {
          const subs = y[0];
          _X[rowIndex][colIndex] = column - subs;
        } else if (y.length === row.length) {
          const subs = y[colIndex];
          _X[rowIndex][colIndex] = column - subs;''
        } else {
          throw Error(
            `Dimension of y ${y.length} and row ${row.length} are not compatible`
          );
        }
      }
    }
    return _X;
  }
});

function drawArrow([ay, ax], [by, bx], ctx, lineWidth = 2) {
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
  ctx.strokeStyle = "pink";
  ctx.stroke();
}

function distanciaEntrePontos(ponto1, ponto2){
  return Math.sqrt(Math.pow((ponto1.x - ponto2.x), 2) + Math.pow((ponto1.y - ponto2.y), 2))
}


function pupilaDireita(mesh,valor2,valor1,acumx,a,b){
  console.log("depois");
  valor2=mesh[473];
  
  //eixo x
  let distH =mesh[473][0]-valor1[0]; //ERRO
   acumx+= Math.abs(distH);
    if(distH>0){
      a=[a[0],a[1],a[2]+6*acumx];  //z aumenta quando se afasta da tela, e diminui quando nos aproximamos
      b=[b[0],b[1],b[2]-6*acumx];
    }
    else if(distH<0){
      a=[a[0],a[1],a[2]-Math.abs(6*acumx)];  //z aumenta quando se afasta da tela, e diminui quando nos aproximamos
      b=[b[0],b[1],b[2]+Math.abs(6*acumx)];
    }
}

