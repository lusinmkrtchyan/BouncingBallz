const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const circles = [];
let lastTime = 0;

const rubber = { gravity: 6.8, dampening: 0.8 };
const metal = { gravity: 13.6, dampening: 0.3 };

// const obstacle = {
//     x: canvas.width - 100,
//     y: canvas.height - 200,
//     width: 100,
//     height: 200,
//     color: '#8B0000'
// };

class Circle {
    constructor(x, y, radius, color, borderWidth, gravity, dampening) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.dy = 0;
        this.dx = 0;
        this.color = color;
        this.borderWidth = borderWidth;
        this.gravity = gravity;
        this.dampening = dampening;
    }

    draw() {
        const stretchFactor = 0.01;
        const stretch = 0.1;

        let stretchY = 1 + Math.min(Math.abs(this.dy) * stretchFactor, stretch);
        let stretchX = 1 / stretchY;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(stretchX, stretchY);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        if (this.borderWidth > 0) {
            ctx.lineWidth = this.borderWidth;
            ctx.strokeStyle = '#000000';
            ctx.stroke();
        }
        ctx.closePath();
        ctx.restore();
    }

    update(deltaTime) {
        const delta = deltaTime / 30;
        this.dy += this.gravity * delta;
        this.x += this.dx * delta;
        this.y += this.dy * delta;

        // Collision with the canvas boundaries
        if (this.y + this.radius > canvas.height) {
            this.y = canvas.height - this.radius;
            this.dy = -this.dy * this.dampening;
        }
        if (this.x + this.radius > canvas.width) {
            this.x = canvas.width - this.radius;
            this.dx = -this.dx * this.dampening;
        } else if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.dx = -this.dx * this.dampening;
        }

        if (Math.abs(this.dy) < 0.5 && this.y + this.radius >= canvas.height) {
            this.dy = 0;
            this.y = canvas.height - this.radius;
        }

        this.draw();
    }

    checkCollision(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + other.radius;
    }

    resolveCollision(other) {
        const xVelocityDiff = this.dx - other.dx;
        const yVelocityDiff = this.dy - other.dy;

        const xDist = other.x - this.x;
        const yDist = other.y - this.y;

        if (xVelocityDiff * xDist + yVelocityDiff * yDist >= 0) {
            const angle = -Math.atan2(other.y - this.y, other.x - this.x);

            const m1 = this.radius;
            const m2 = other.radius;

            const u1 = rotate({ x: this.dx, y: this.dy }, angle);
            const u2 = rotate({ x: other.dx, y: other.dy }, angle);

            const v1 = { x: u1.x * (m1 - m2) / (m1 + m2) + u2.x * 2 * m2 / (m1 + m2), y: u1.y };
            const v2 = { x: u2.x * (m1 - m2) / (m1 + m2) + u1.x * 2 * m1 / (m1 + m2), y: u2.y };

            const vFinal1 = rotate(v1, -angle);
            const vFinal2 = rotate(v2, -angle);

            this.dx = vFinal1.x;
            this.dy = vFinal1.y;

            other.dx = vFinal2.x;
            other.dy = vFinal2.y;
        }
    }
}

function rotate(velocity, angle) {
    const rotatedVelocities = {
        x: velocity.x * Math.cos(angle) - velocity.y * Math.sin(angle),
        y: velocity.x * Math.sin(angle) + velocity.y * Math.cos(angle)
    };
    return rotatedVelocities;
}

function interpolateProperties(ratio, properties1, properties2) {
    return {
        gravity: properties1.gravity + ratio * (properties2.gravity - properties1.gravity),
        dampening: properties1.dampening + ratio * (properties2.dampening - properties1.dampening)
    };
}

function spawnCircle(event) {
    const x = event.clientX;
    const y = event.clientY;
    const radius = parseInt(document.getElementById('radius').value, 10);
    const color = document.getElementById('color').value;
    const borderWidth = parseInt(document.getElementById('border').value, 10);
    const materialRange = parseFloat(document.getElementById('materialRange').value);
    const { gravity, dampening } = interpolateProperties(materialRange, rubber, metal);
    const circle = new Circle(x, y, radius, color, borderWidth, gravity, dampening);
    circles.push(circle);
}

function drawSky() {
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawObstacle(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

function tick(currentTime) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawSky();

    for (let i = 0; i < circles.length; i++) {
        const circle = circles[i];
        circle.update(deltaTime);
        for (let j = i + 1; j < circles.length; j++) {
            const otherCircle = circles[j];
            if (circle.checkCollision(otherCircle)) {
                circle.resolveCollision(otherCircle);
            }
        }
    }
    requestAnimationFrame(tick);
}

canvas.addEventListener('click', spawnCircle);
requestAnimationFrame(tick);
