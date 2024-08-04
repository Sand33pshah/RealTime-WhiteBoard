let canvas = document.getElementById('canvas');
canvas.width = 0.98 * window.innerWidth;
canvas.height = window.innerHeight;

var io = io.connect('http://localhost:8080/');

let ctx = canvas.getContext("2d");
let x;
let y;
let mouseDown = false;

// Tool-related variables
let startX, startY;
let currentTool = 'pencil'; // Default tool
const eraserSize = 20;  // Size of the eraser

// Retrieving and handling tool selection
const toolButtons = document.querySelectorAll('.tools button');
toolButtons.forEach(button => {
    button.addEventListener('click', () => {
        currentTool = button.id;
        toolButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    });
});

window.onmousedown = (e) => {
    x = e.clientX;
    y = e.clientY;
    const rect = canvas.getBoundingClientRect();
    x -= rect.left;
    y -= rect.top;
    startX = x;
    startY = y;

    if (currentTool === 'pencil') {
        ctx.beginPath();
        ctx.moveTo(x, y);
    } else if (currentTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, eraserSize, 0, Math.PI * 2); // Draw initial circle
        ctx.fill();
    }

    io.emit('down', { x, y, tool: currentTool });
    mouseDown = true;
};

window.onmouseup = (e) => {
    if (mouseDown) {
        if (currentTool === 'line') {
            io.emit('drawLine', { startX, startY, endX: x, endY: y });
        } else if (currentTool === 'rectangle') {
            io.emit('drawRect', { startX, startY, width: x - startX, height: y - startY });
        }
        mouseDown = false;
    }
};

window.onmousemove = (e) => {
    x = e.clientX;
    y = e.clientY;
    const rect = canvas.getBoundingClientRect();
    x -= rect.left;
    y -= rect.top;

    if (mouseDown) {
        if (currentTool === 'pencil') {
            io.emit('draw', { x, y });
            ctx.lineTo(x, y);
            ctx.stroke();
        } else if (currentTool === 'eraser') {
            io.emit('erase', { x, y, size: eraserSize });
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(x, y, eraserSize, 0, Math.PI * 2); // Draw a large circle for erasing
            ctx.fill();
        } else if (currentTool === 'line') {
            // Use a buffer canvas to draw intermediate line
            const bufferCanvas = document.createElement('canvas');
            bufferCanvas.width = canvas.width;
            bufferCanvas.height = canvas.height;
            const bufferCtx = bufferCanvas.getContext('2d');

            bufferCtx.beginPath();
            bufferCtx.moveTo(startX, startY);
            bufferCtx.lineTo(x, y);
            bufferCtx.stroke();

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(bufferCanvas, 0, 0);
        } else if (currentTool === 'rectangle') {
            // Use a buffer canvas to draw intermediate rectangle
            const bufferCanvas = document.createElement('canvas');
            bufferCanvas.width = canvas.width;
            bufferCanvas.height = canvas.height;
            const bufferCtx = bufferCanvas.getContext('2d');

            bufferCtx.beginPath();
            bufferCtx.rect(startX, startY, x - startX, y - startY);
            bufferCtx.stroke();

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(bufferCanvas, 0, 0);
        }
    }
};

io.on('ondraw', ({ x, y }) => {
    if (currentTool === 'pencil') {
        ctx.lineTo(x, y);
        ctx.stroke();
    }
});

io.on('onErase', ({ x, y, size }) => {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2); // Draw a large circle for erasing
    ctx.fill();
});

io.on('onLine', ({ startX, startY, endX, endY }) => {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
});

io.on('onRect', ({ startX, startY, width, height }) => {
    ctx.beginPath();
    ctx.rect(startX, startY, width, height);
    ctx.stroke();
});

io.on('ondown', ({ x, y }) => {
    ctx.moveTo(x, y);
});

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}

// Initial resize
resizeCanvas();

// Resize canvas on window resize
window.addEventListener('resize', resizeCanvas);
