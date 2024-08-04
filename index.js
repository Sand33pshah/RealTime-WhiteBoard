let express = require('express');
let app = express();
let httpServer = require('http').createServer(app);
let io = require('socket.io')(httpServer);

let connections = [];
let drawingActions = []; // Store all drawing actions

io.on('connect', (socket) => {
    connections.push(socket);
    console.log(`${socket.id} has connected`);

    // Send current drawing state to new client
    socket.emit('initDrawing', drawingActions);

    socket.on('draw', (data) => {
        let action = { tool: 'pencil', startX: data.startX, startY: data.startY, endX: data.endX, endY: data.endY};
        drawingActions.push(action);
        connections.forEach(con => {
            if (con.id !== socket.id) {
                con.emit('ondraw', action);
            }
        });
    });

    socket.on('erase', (data) => {
        let action = { tool: 'eraser', x: data.x, y: data.y, size: data.size };
        drawingActions.push(action);
        connections.forEach(con => {
            if (con.id !== socket.id) {
                con.emit('onErase', action);
            }
        });
    });

    socket.on('drawLine', (data) => {
        let action = { tool: 'line', startX: data.startX, startY: data.startY, endX: data.endX, endY: data.endY};
        drawingActions.push(action);
        connections.forEach(con => {
            if (con.id !== socket.id) {
                con.emit('onLine', action);
            }
        });
    });

    socket.on('drawRect', (data) => {
        let action = { tool: 'rectangle', startX: data.startX, startY: data.startY, width: data.width, height: data.height};
        drawingActions.push(action);
        connections.forEach(con => {
            if (con.id !== socket.id) {
                con.emit('onRect', action);
            }
        });
    });
    socket.on('down', (data) => {
        connections.forEach(con => {
            if (con.id !== socket.id) {
                con.emit('ondown', data);
            }
        });
    });

    socket.on('disconnect', (reason) => {
        console.log(`${socket.id} is disconnected`);
        connections = connections.filter(con => con.id != socket.id);
    });
});

app.use(express.static('public'));

let PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => console.log(`Server started on port ${PORT}`));