let img_idle, img_pressed, img_btn_picnic, img_btn_photo;
let cx, cy;
let is_cam_on = false;
let capture;
let photo;

let layer_face_paint;
let px = 0,
  py = 0;
let palette_h;
let palette_colors = [];
let color_codes = [
  "#FFFFFF",
  "#EC9F05",
  "#BF3100",
  "#F5BB00",
  "#8EA604",
  "#FF4E00",
  "#F7EBEC",
  "#DDBDD5",
  "#AC9FBB",
];
let color_width;
let picked_color;

const FRAME_THICKNESS = 20;
const FRAME_BOTTOM = 40;

let c_frame;

let now_status;
const STATUS_ENUM = {
  Painting: 1,
  TakePhoto: 2,
  Developed: 3,
};
Object.freeze(STATUS_ENUM);

function preload() {
  img_idle = loadImage("assets/bambi.png");
  img_pressed = loadImage("assets/bambi_pressed.png");
  img_btn_picnic = loadImage("assets/btn_picnic.png");
  img_btn_photo = loadImage("assets/btn_photo.png");
  now_status = STATUS_ENUM.Painting;
}

function setup() {
  photo = createCanvas(400, 600);
  centerCanvas(photo);

  cx = width * 0.5;
  cy = height * 0.5;
  palette_h = (height * 5) / 6;
  c_frame = color(0, 200);

  // init camera
  capture = createCapture(VIDEO);
  capture.hide();

  // init painting layer
  layer_face_paint = createGraphics(width, height);
  layer_face_paint.noStroke();
  color_codes.forEach((code) => {
    palette_colors.push(color(code));
  });
  color_width = width / palette_colors.length;
  picked_color = color("#FFFFFF");
}

function draw() {
  background(220);

  imageMode(CENTER);
  if (is_cam_on) {
    image(capture, cx, cy, (capture.width * height) / capture.height, height);
  }

  switch (now_status) {
    // 페이스 페인팅 그리기 모드
    case STATUS_ENUM.Painting:
      if (mouseIsPressed && isPaintable()) {
        image(
          img_pressed,
          cx,
          cy - 100,
          width,
          (img_idle.height * width) / img_idle.width
        );
      } else {
        image(
          img_idle,
          cx,
          cy - 100,
          width,
          (img_idle.height * width) / img_idle.width
        );
      }

      image(layer_face_paint, cx, cy - 100, width, height);

      drawPalette();
      break;
    // 촬영 모드
    case STATUS_ENUM.TakePhoto:
      push();
      translate(width * 0.4, 213);
      scale(0.5);

      image(
        img_idle,
        cx,
        cy,
        width,
        (img_idle.height * width) / img_idle.width
      );
      image(layer_face_paint, cx, cy, width, height);

      pop();
      drawPhotoframe(c_frame);
      drawCameraButton();
      break;
    // 현상모드
    case STATUS_ENUM.Developed:
      break;
  }
}

function touchStarted() {
  if (isPaintable()) {
    layer_face_paint.strokeWeight(5);
    layer_face_paint.noFill();
    layer_face_paint.stroke(picked_color);
    layer_face_paint.line(mouseX, mouseY + 100, mouseX, mouseY + 100);
    px = mouseX;
    py = mouseY;
  }
  // prevent default
  return false;
}

function touchMoved() {
  if (isPaintable()) {
    layer_face_paint.line(mouseX, mouseY + 100, px, py + 100);
    px = mouseX;
    py = mouseY;
  }
}

function isPaintable() {
  if (now_status == STATUS_ENUM.Painting && mouseY < palette_h) {
    return true;
  } else {
    return false;
  }
}

function touchEnded() {
  switch (now_status) {
    // 페이스 페인팅 그리기 모드
    case STATUS_ENUM.Painting:
      if (mouseY >= palette_h) {
        // 색상 변경하기
        if (mouseY < palette_h + height / 12) {
          palette_colors.forEach((c, idx) => {
            if (color_width * idx <= mouseX && mouseX < color_width * (idx + 1))
              picked_color = c;
          });
        } else {
          // 산책가기
          if (mouseX > cx) {
            now_status = STATUS_ENUM.TakePhoto;
            is_cam_on = true;
          }
        }
      }
      break;
    // 촬영 모드
    case STATUS_ENUM.TakePhoto:
      if (mouseY >= palette_h + height / 12 && mouseX > cx) {
        // 저장하기

        now_status = STATUS_ENUM.Developed;

        const date = new Date();
        drawPhotoframe(255);

        let description =
          "아래 현상된 이미지를 " +
          (isMobile() ? "꾹 눌러서" : "오른쪽 클릭해서") +
          " 저장할 수 있어요";
        let alt_text = createP(description);
        alt_text.class("animate__animated animate__fadeIn animate__delay-1s");

        let canvas_data = canvas.toDataURL();
        let img_element = createImg(canvas_data, "sikadeer-photo-" + date);
        img_element.class("animate__animated animate__backInDown");

        photo.hide();
        noLoop();
      }
      break;
    // 현상모드
    case STATUS_ENUM.Developed:
      break;
  }
  // prevent default
  return false;
}

function drawPhotoframe(c) {
  noStroke();
  stroke(200);
  strokeWeight(1);
  fill(c);
  beginShape();
  vertex(0, 0);
  vertex(0, height);
  vertex(width, height);
  vertex(width, 0);
  beginContour();
  vertex(FRAME_THICKNESS, FRAME_THICKNESS);
  vertex(width - FRAME_THICKNESS, FRAME_THICKNESS);
  vertex(width - FRAME_THICKNESS, height - FRAME_THICKNESS - FRAME_BOTTOM);
  vertex(FRAME_THICKNESS, height - FRAME_THICKNESS - FRAME_BOTTOM);
  endContour();
  endShape(CLOSE);
}

function drawPalette() {
  noStroke();
  fill(200, 180, 140);
  rect(0, palette_h, width, height / 6);

  ellipseMode(CORNER);
  palette_colors.forEach((c, idx) => {
    if (c === picked_color) {
      stroke(100);
      strokeWeight(2);
    } else {
      noStroke();
    }
    fill(c);
    ellipse(
      color_width * idx + 5,
      palette_h + 5,
      color_width - 10,
      color_width - 10
    );
  });

  image(
    img_btn_picnic,
    (cx * 3) / 2,
    palette_h + height / 8,
    width * 0.5,
    (img_btn_picnic.height * width * 0.5) / img_btn_picnic.width
  );
}

function drawCameraButton() {
  image(
    img_btn_photo,
    (cx * 3) / 2,
    palette_h + height / 8 - 10,
    width * 0.5,
    (img_btn_picnic.height * width * 0.5) / img_btn_picnic.width
  );
}

function centerCanvas(target) {
  const x = (windowWidth - width) / 2;
  const y = (windowHeight - height) / 2;
  target.position(x, y);
}
const isMobile = () => {
  const pcDevice = "win16|wind32|win64|mac|macintel";
  if (navigator.platform) {
    if (pcDevice.indexOf(navigator.platform.toLowerCase()) < 0) {
      return true; //mobile
    }
  }
  return false; //desktop
};
