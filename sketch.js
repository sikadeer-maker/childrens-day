let img_idle,
  img_pressed,
  img_btn_picnic,
  img_btn_photo,
  img_btn_korea,
  img_btn_korea_other,
  img_bg_default;
let cx, cy;
let is_cam_on = false;
let is_back_mode = true;
let capture_back = undefined;
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
  img_btn_korea = loadImage("assets/btn_korea.png");
  img_btn_korea_other = loadImage("assets/btn_korea_other.png");
  img_bg_default = loadImage("assets/bg_default.png");
  now_status = STATUS_ENUM.Painting;
}

function setup() {
  photo = createCanvas(400, 600);

  cx = width * 0.5;
  cy = height * 0.5;
  palette_h = (height * 5) / 6;
  c_frame = color(0, 200);

  // init camera
  const frontCamera = {
    audio: false,
    video: {
      facingMode: {
        exact: "user",
      },
    },
  };

  if (isMobile()) {
    const backCamera = {
      audio: false,
      video: {
        facingMode: {
          exact: "environment",
        },
      },
    };
    capture_back = createCapture(backCamera);
    capture_back.hide();
  }

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
  if (now_status === STATUS_ENUM.Developed) return;
  imageMode(CENTER);
  if (is_cam_on) {
    image(img_bg_default, cx, cy, width, height);
    if (isMobile() && is_back_mode && capture_back) {
      image(
        capture_back,
        cx,
        cy,
        (capture_back.width * height) / capture_back.height,
        height
      );
    }
  } else {
    image(img_bg_default, cx, cy, width, height);
  }

  switch (now_status) {
    // ????????? ????????? ????????? ??????
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
    // ?????? ??????
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
      if (isMobile()) {
        drawCameraSwicthButton();
      }
      drawCameraButton();
      break;
    // ????????????
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
    // ????????? ????????? ????????? ??????
    case STATUS_ENUM.Painting:
      if (mouseY >= palette_h) {
        // ?????? ????????????
        if (mouseY < palette_h + height / 12) {
          palette_colors.forEach((c, idx) => {
            if (color_width * idx <= mouseX && mouseX < color_width * (idx + 1))
              picked_color = c;
          });
        } else {
          // ????????????
          if (mouseX > cx) {
            now_status = STATUS_ENUM.TakePhoto;
            is_cam_on = true;
          }
        }
      }
      break;
    // ?????? ??????
    case STATUS_ENUM.TakePhoto:
      if (mouseY >= palette_h + height / 12) {
        if (isMobile() && mouseX < cx) {
          // ????????? ????????????
          is_back_mode = !is_back_mode;
        } else if (mouseX > cx) {
          // ????????????

          now_status = STATUS_ENUM.Developed;

          const today = new Date();
          drawPhotoframe(255);
          is_cam_on = false;
          if (!isMobile()) {
            // ????????????
            let description =
              "?????? ????????? ???????????? ????????? ???????????? ????????? ??? ?????????";
            drawPhotoInHtml(description, today);
          } else {
            const device_name = checkDevice();
            if (device_name === "android") {
              // ??????????????? : ?????? ??????
              let description = "?????? ????????? ???????????? ???????????? ???????????????.";
              drawPhotoInHtml(description, today);
              setTimeout(() => {
                saveCanvas(photo, "sikadeer-" + today, "png");
              }, 100);
            } else if (device_name === "ios") {
              // ????????? : ??? ????????? ??????
              let description =
                "?????? ????????? ???????????? ??? ????????? ????????? ??? ?????????";
              drawPhotoInHtml(description, today);
            }
          }
        }
      }
      break;
    // ????????????
    case STATUS_ENUM.Developed:
      break;
  }
  // prevent default
  return false;
}

function drawPhotoInHtml(description, today) {
  let alt_text = createP(description);
  alt_text.class("animate__animated animate__fadeIn animate__delay-1s");
  alt_text.parent("main");

  let canvas_data = canvas.toDataURL();
  let img_element = createImg(canvas_data, "sikadeer-photo-" + today);
  img_element.class("animate__animated animate__backInDown");
  img_element.parent("main");

  photo.hide();
  noLoop();
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

function drawCameraSwicthButton() {
  if (is_back_mode) {
    image(
      img_btn_korea_other,
      (cx / 5) * 2,
      palette_h + height / 8 - 10,
      img_btn_korea_other.width * 0.2,
      img_btn_korea_other.height * 0.2
    );
  } else {
    image(
      img_btn_korea,
      (cx / 5) * 2,
      palette_h + height / 8 - 10,
      img_btn_korea.width * 0.2,
      img_btn_korea.height * 0.2
    );
  }
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
