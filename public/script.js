let canvas = document.getElementById('canvas');

canvas.width = 0.98 * window.innerWidth;
canvas.height = window.innerHeight;

var io = io.connect('http://localhost:8080/')

let ctx = canvas.getContext("2d");
let x;
let y;
let mouseDown = false;

// const tools = document.querySelectorAll('.tools button');
// let currentTool = 'pencil';
// // Set up default tool
// const setTool = (tool) => {
//     tools.forEach(button => button.classList.remove('selected'));
//     document.getElementById(tool).classList.add('selected');
//     currentTool = tool;
// };

// // Handle tool selection
// tools.forEach(button => {
//     button.addEventListener('click', () => {
//         setTool(button.id);
//     });
// });
























window.onmousedown = (e) => {
    ctx.moveTo(x, y);
    io.emit('down', { x, y });
    mouseDown = true;
}

window.onmouseup = (e) => {
    mouseDown = false;
}

io.on('ondraw', ({ x, y }) => {
    ctx.lineTo(x, y);
    ctx.stroke();
})

io.on('ondown', ({ x, y }) => {
    ctx.moveTo(x, y);
})

window.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;

    if (mouseDown) {
        io.emit('draw', { x, y });
        ctx.lineTo(x, y);
        ctx.stroke();
    }
};

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}

// Initial resize
resizeCanvas();

// Resize canvas on window resize
window.addEventListener('resize', resizeCanvas);
