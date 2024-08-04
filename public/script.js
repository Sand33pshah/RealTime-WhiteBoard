let canvas = document.getElementById('canvas');

canvas.width = 0.98 * window.innerWidth;
canvas.height = window.innerHeight;

var io = io.connect('http://localhost:8080/');

let ctx = canvas.getContext("2d");
let x, y;
let mouseDown = false;
let startX, startY;
let currentTool = 'pencil'; // default tool
const eraserSize = 20; // size of eraser
let storedDrawings = []; // to store all actions
let currentColor = '#000000'; // Default color


// Retrieve the tool selected
const toolButtons = document.querySelectorAll('.tools button');
toolButtons.forEach(button => {
    button.addEventListener('click', () => {
        currentTool = button.id;
        toolButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        if (currentTool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
        } else {
            ctx.globalCompositeOperation = 'source-over';
        }
    });
});

const colorPicker = document.getElementById('colorPicker');
colorPicker.addEventListener('input', (e) => {
    currentColor = e.target.value;
});


window.onmousedown = (e) => {
    const rect = canvas.getBoundingClientRect();
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
    startX = x;
    startY = y;

    if (currentTool === 'pencil') {
        ctx.beginPath();
        ctx.moveTo(x, y);
        io.emit('down', { x, y, color: currentColor });
    } else if (currentTool === 'eraser') {
        ctx.beginPath();
        ctx.arc(x, y, eraserSize, 0, Math.PI * 2); // Draw initial circle
        ctx.fill();
        io.emit('down', { x, y, size: eraserSize });
    } else if (currentTool === 'line' || currentTool === 'rectangle') {
        io.emit('down', { x: startX, y: startY, color: currentColor });
    }

    mouseDown = true;
};

window.onmouseup = (e) => {
    if (!mouseDown) return;

    const rect = canvas.getBoundingClientRect();
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;

    if (currentTool === 'line') {
        ctx.strokeStyle = currentColor; //set color
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(x, y);
        ctx.stroke();
        io.emit('drawLine', { startX, startY, endX: x, endY: y, color: currentColor });
    } else if (currentTool === 'rectangle') {
        ctx.beginPath();
        ctx.rect(startX, startY, x - startX, y - startY);
        ctx.stroke();
        io.emit('drawRect', { startX, startY, width: x - startX, height: y - startY, color: currentColor });
    }

    mouseDown = false;
};

window.onmousemove = (e) => {
    if (!mouseDown) return;

    const rect = canvas.getBoundingClientRect();
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;

    if (currentTool === 'pencil') {
        ctx.lineTo(x, y);
        ctx.stroke();
        io.emit('draw', { startX, startY, endX: x, endY: y, color: currentColor });
        startX = x;
        startY = y;
    } else if (currentTool === 'eraser') {
        ctx.beginPath();
        ctx.arc(x, y, eraserSize, 0, Math.PI * 2); // Draw a large circle for erasing
        ctx.fill();
        io.emit('erase', { x, y, size: eraserSize });
    }
};

io.on('initDrawing', (actions) => {
    storedDrawings = actions;
    redrawCanvas();
});

io.on('ondraw', (data) => {
    storedDrawings.push({ tool: 'pencil', startX: data.startX, startY: data.startY, endX: data.endX, endY: data.endY });
    drawAction({ tool: 'pencil', startX: data.startX, startY: data.startY, endX: data.endX, endY: data.endY });
});

io.on('onErase', (data) => {
    storedDrawings.push({ tool: 'eraser', x: data.x, y: data.y, size: data.size });
    drawAction({ tool: 'eraser', x: data.x, y: data.y, size: data.size });
});

io.on('onLine', (data) => {
    storedDrawings.push({ tool: 'line', startX: data.startX, startY: data.startY, endX: data.endX, endY: data.endY });
    drawAction({ tool: 'line', startX: data.startX, startY: data.startY, endX: data.endX, endY: data.endY });
});

io.on('onRect', (data) => {
    storedDrawings.push({ tool: 'rectangle', startX: data.startX, startY: data.startY, width: data.width, height: data.height });
    drawAction({ tool: 'rectangle', startX: data.startX, startY: data.startY, width: data.width, height: data.height });
});

io.on('ondown', (data) => {
    if (currentTool === 'pencil' || currentTool === 'eraser') {
        ctx.moveTo(data.x, data.y);
    }
});

function drawAction(action) {
    ctx.strokeStyle = action.color || '#000000'; // Use the action's color or default to black
    ctx.fillStyle = action.color || '#000000';   // Use the action's color or default to black

    if (action.tool === 'pencil') {
        ctx.beginPath();
        ctx.moveTo(action.startX, action.startY);
        ctx.lineTo(action.endX, action.endY);
        ctx.stroke();
    } else if (action.tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(action.startX, action.startY);
        ctx.lineTo(action.endX, action.endY);
        ctx.stroke();
    } else if (action.tool === 'rectangle') {
        ctx.beginPath();
        ctx.rect(action.startX, action.startY, action.width, action.height);
        ctx.stroke();
    } else if (action.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(action.x, action.y, action.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }
}

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    redrawCanvas();
}

function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    storedDrawings.forEach(drawAction);
}

// Initial resize
resizeCanvas();

// Resize canvas on window resize
window.addEventListener('resize', resizeCanvas);
