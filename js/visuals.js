function resizeCanvas(canvas, context) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { width, height };
}

export function startCyberCity(canvas) {
  const context = canvas.getContext("2d");
  const stars = Array.from({ length: 80 }, (_, index) => ({
    x: (index * 97) % 1280,
    y: (index * 53) % 390,
    speed: 0.15 + (index % 5) * 0.05,
  }));
  const buildings = Array.from({ length: 34 }, (_, index) => {
    const width = 34 + ((index * 17) % 65);
    return {
      x: index * 48 - 20,
      width,
      height: 110 + ((index * 43) % 310),
      hue: index % 3,
      antenna: index % 4 === 0,
    };
  });
  const vehicles = Array.from({ length: 7 }, (_, index) => ({
    x: (index * 211) % 1280,
    y: 130 + ((index * 47) % 260),
    speed: 0.55 + (index % 4) * 0.22,
    color: index % 2 ? "#ff3cac" : "#5eeaff",
    size: 1 + (index % 2),
  }));
  let frame = 0;

  function draw() {
    if (document.hidden) {
      window.requestAnimationFrame(draw);
      return;
    }
    frame += 1;
    const width = canvas.width;
    const height = canvas.height;
    const horizon = height * 0.68;
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#02030a");
    gradient.addColorStop(0.58, "#071326");
    gradient.addColorStop(0.72, "#23072b");
    gradient.addColorStop(1, "#03050a");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    stars.forEach((star, index) => {
      const x = (star.x - frame * star.speed + width) % width;
      context.fillStyle = index % 7 === 0 ? "#ff3cac" : "#5eeaff";
      context.globalAlpha = 0.15 + (index % 5) * 0.09;
      context.fillRect(x, star.y, index % 9 === 0 ? 9 : 2, 2);
    });
    context.globalAlpha = 1;

    context.fillStyle = "rgba(255, 60, 172, 0.09)";
    context.fillRect(0, horizon - 18, width, 36);

    vehicles.forEach((vehicle, index) => {
      const x = (vehicle.x + frame * vehicle.speed * (index % 2 ? 1 : -1) + width) % width;
      const y = vehicle.y * (height / 720);
      const size = vehicle.size;
      context.globalAlpha = 0.78;
      context.fillStyle = vehicle.color;
      context.fillRect(x, y, 18 * size, 4 * size);
      context.fillRect(x + 4 * size, y - 3 * size, 8 * size, 3 * size);
      context.fillStyle = "#ffd166";
      context.fillRect(x + (index % 2 ? 18 : -4) * size, y + size, 4 * size, 2 * size);
      context.globalAlpha = 0.18;
      context.fillStyle = vehicle.color;
      context.fillRect(x - (index % 2 ? 18 : -2) * size, y + size, 16 * size, 2 * size);
    });
    context.globalAlpha = 1;

    buildings.forEach((building, index) => {
      const scale = width / 1280;
      const x = building.x * scale;
      const w = building.width * scale;
      const h = building.height * (height / 720);
      const y = horizon - h;
      context.fillStyle = index % 2 ? "#071019" : "#09131e";
      context.fillRect(x, y, w, h);
      context.fillStyle = building.hue === 0 ? "#5eeaff" : building.hue === 1 ? "#ff3cac" : "#ffd166";

      for (let wy = y + 18; wy < horizon - 12; wy += 19) {
        for (let wx = x + 8; wx < x + w - 6; wx += 15) {
          if ((Math.floor(wx + wy + index + frame / 45) % 5) < 2) {
            context.globalAlpha = 0.28 + ((wx + wy) % 3) * 0.12;
            context.fillRect(wx, wy, 5, 3);
          }
        }
      }
      context.globalAlpha = 1;

      if (building.antenna) {
        context.fillStyle = "#ff3cac";
        context.fillRect(x + w / 2, y - 30, 2, 30);
        if (frame % 70 < 35) context.fillRect(x + w / 2 - 2, y - 34, 6, 4);
      }

      if (index % 6 === 0 && w > 34) {
        const signY = y + 34;
        const signOn = (Math.floor(frame / 28) + index) % 4 !== 0;
        context.fillStyle = signOn ? "#ff3cac" : "rgba(255, 60, 172, 0.18)";
        context.fillRect(x + 8, signY, Math.min(38, w - 16), 10);
        context.fillStyle = signOn ? "#03050a" : "rgba(3, 5, 10, 0.45)";
        context.fillRect(x + 12, signY + 3, 5, 4);
        context.fillRect(x + 21, signY + 3, 11, 4);
      }
    });

    context.strokeStyle = "rgba(94, 234, 255, 0.13)";
    for (let line = 0; line < 12; line += 1) {
      const y = horizon + line * line * 3.2;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
    for (let line = -12; line <= 12; line += 1) {
      context.beginPath();
      context.moveTo(width / 2, horizon);
      context.lineTo(width / 2 + line * 130, height);
      context.stroke();
    }

    window.requestAnimationFrame(draw);
  }

  draw();
}

export function startDataRain(canvas) {
  const context = canvas.getContext("2d");
  let dimensions = { width: 0, height: 0 };
  let particles = [];
  let motes = [];

  function reset() {
    dimensions = resizeCanvas(canvas, context);
    particles = Array.from({ length: Math.floor(dimensions.width / 18) }, (_, index) => ({
      x: index * 18,
      y: -Math.random() * dimensions.height,
      speed: 0.35 + Math.random() * 1.2,
      length: 1 + Math.floor(Math.random() * 5),
      color: Math.random() > 0.86 ? "#ff3cac" : "#5eeaff",
    }));
    motes = Array.from({ length: Math.max(10, Math.floor(dimensions.width / 90)) }, (_, index) => ({
      x: (index * 83) % Math.max(dimensions.width, 1),
      y: (index * 137) % Math.max(dimensions.height, 1),
      speed: 0.18 + (index % 4) * 0.08,
      color: index % 3 === 0 ? "#ffd166" : "#65ff9a",
    }));
  }

  function draw() {
    if (document.hidden) {
      window.requestAnimationFrame(draw);
      return;
    }
    context.clearRect(0, 0, dimensions.width, dimensions.height);
    context.font = "11px monospace";
    particles.forEach((particle) => {
      particle.y += particle.speed;
      if (particle.y > dimensions.height + 70) particle.y = -100;

      for (let row = 0; row < particle.length; row += 1) {
        context.globalAlpha = 0.13 * (1 - row / (particle.length + 1));
        context.fillStyle = particle.color;
        const glyph = ((particle.x + row * 7 + Math.floor(particle.y)) % 16).toString(16);
        context.fillText(glyph, particle.x, particle.y - row * 15);
      }
    });
    motes.forEach((mote, index) => {
      mote.x = (mote.x + mote.speed) % Math.max(dimensions.width, 1);
      const y = mote.y + Math.sin((mote.x + index * 19) * 0.012) * 6;
      context.globalAlpha = 0.11;
      context.fillStyle = mote.color;
      context.fillRect(mote.x, y, 6, 6);
      context.fillRect(mote.x + 8, y + 2, 2, 2);
    });
    context.globalAlpha = 1;
    window.requestAnimationFrame(draw);
  }

  reset();
  window.addEventListener("resize", reset);
  draw();
}
