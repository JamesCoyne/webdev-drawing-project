// #######################
// canvas setup
// #######################

var windowTitle = document.getElementById('windowTitle');

var canvas = document.getElementById('myCanvas');
var ctx = canvas.getContext('2d');
var painting = document.getElementById('paint');
var paint_style = getComputedStyle(painting);

canvas.width = parseInt(paint_style.getPropertyValue('width'));
canvas.height = parseInt(paint_style.getPropertyValue('height'))-22;
ctx.lineJoin = 'round';
ctx.lineCap = 'round';

// #######################
// global variables
// #######################

var currentTool = "1";

var state = {
    me: {
        pos:{
            x: 0,
            y: 0
        },
        color: "#000",
        brushSize: 1
    }
};

// #######################
// fetch background
// #######################

let bgImg = new Image();
bgImg.onload = () => { ctx.drawImage(bgImg, 0, 0) }
fetch(window.location.origin + '/background')
.then(response => response.text())
.then(res => bgImg.src = res);


// #######################
// server side listeners
// #######################

var socket = io.connect(window.location.origin)
// when a clients mouse moves
socket.on('mouse', function(data){
    var oldPos = state[data.id].pos;
    var color = state[data.id].color;
    var brushSize = state[data.id].brushSize;

    strokeWeight(brushSize);
    stroke(color);
    line(data.x, data.y, oldPos.x, oldPos.y);
    state[data.id].pos = {x: data.x, y: data.y}
});

// when a clients mouse is down
socket.on('mouseDown', function(data){
    state[data.id] = data;
});

// request data when the page first loads
socket.on('requestData', function(data){
    console.log('requesting new data!');
    console.log(data);
    // for(var drawing in data){
    //     var currentDrawing = data[drawing];
    //     strokeWeight(currentDrawing.brushSize);
    //     stroke(currentDrawing.color);

    //     var oldPos = currentDrawing.pos;
    //     for(pos in currentDrawing.drawing){
    //         var pos = currentDrawing.drawing[pos];
    //         line(oldPos.x, oldPos.y, pos.x, pos.y);
    //         oldPos = pos;
    //     }
    // }
});
socket.emit('requestData', {});

// #######################
// server side listeners
// #######################

function mouseDragged(){
    console.log('mouse dragged')
    stroke(state.me.color);
    strokeWeight(state.me.brushSize);
    line(state.me.pos.x, state.me.pos.y, mouseX, mouseY);
    state.me.pos = {
        x: mouseX,
        y: mouseY
    }
    socket.emit('mouse', state.me.pos);
}

function mousePressed(){
    console.log('mouse down');
    state.me.pos = {
        x: mouseX,
        y: mouseY
    }
    socket.emit('mouseDown', state.me);
}

function mouseReleased(){
    socket.emit('mouseReleased', {});
}
 

// #######################
// UI functions
// #######################

function saveClicked(){
    var link = document.getElementById('link');
    link.setAttribute('download', 'scribble-party.png');
    link.setAttribute('href', canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"));
    link.click();
}

function onBrushSizeChange(selector){
    state.me.brushSize = selector.value;
}

function setCurrentColor() {
    state.me.color = $("#current-color").val();
}

function updateCurrentTools() {
    $("#brush-size-options").addClass("no-display");
    $("#eraser-size-options").addClass("no-display");

    if (currentTool == "1") {
        $("#tool-selected").html("Pencil");
    } 
    else if (currentTool == "2") {
        $("#brush-size-options").removeClass("no-display");
        $("#tool-selected").html("Brush");
    } 
    else if (currentTool == "3") {
        $("#eraser-size-options").removeClass("no-display")
        $("#tool-selected").html("Eraser");
    }
    else if (currentTool == "4") {
        $("#eraser-size-options").removeClass("no-display")
        $("#tool-selected").html("Save");
    }
}

$(".tool").click(function(e) {
    var target = e.target;
    var id = $(target).attr("id");
    currentTool = id;
    setCurrentColor();
    switch(currentTool){
        case "1":
            state.me.brushSize = 2;
            break;
        case "2":
            var selector = document.getElementById("brush-sizes");
            onBrushSizeChange(selector.options[selector.selectedIndex])
            break;
        case "3":
            var selector = document.getElementById("eraser-sizes");
            onBrushSizeChange(selector.options[selector.selectedIndex])
            state.me.color = '#fff'
            break;
    }
    updateCurrentTools();
})

updateCurrentTools();

// #######################
// drawing helper function
// #######################

function line(x1, y1, x2, y2){
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function stroke(colorParam){
    ctx.strokeStyle = colorParam;
}

function strokeWeight(size){
    ctx.lineWidth = size;
}

var mouseIsPressed = false;
var mouseX = 0;
var mouseY = 0;

// desktop event listeners

canvas.addEventListener('mousemove', function(e) {
    mouseX = e.clientX - painting.offsetLeft;
    mouseY = e.clientY - painting.offsetTop - 24;
    if(mouseIsPressed){
        mouseDragged();
    }
}, false);

canvas.addEventListener('mousedown', function(e) {
    mouseX = e.clientX - painting.offsetLeft;
    mouseY = e.clientY - painting.offsetTop - 24;
    mouseIsPressed = true;
    mousePressed();
}, false);

canvas.addEventListener('mouseup', function() {
    mouseIsPressed = false;
    mouseReleased();
}, false);

// mobile event listeners

canvas.addEventListener('touchmove', function(e) {
    mouseX = (event.targetTouches[0] ? event.targetTouches[0].pageX : event.changedTouches[event.changedTouches.length-1].pageX)
    - painting.offsetLeft;
    mouseY = (event.targetTouches[0] ? event.targetTouches[0].pageY : event.changedTouches[event.changedTouches.length-1].pageY)
    - painting.offsetTop - 24;
    if(mouseIsPressed){
        mouseDragged();
    }
}, false);

canvas.addEventListener('touchstart', function(e) {
    mouseX = (event.targetTouches[0] ? event.targetTouches[0].pageX : event.changedTouches[event.changedTouches.length-1].pageX)
    - painting.offsetLeft;
    mouseY = (event.targetTouches[0] ? event.targetTouches[0].pageY : event.changedTouches[event.changedTouches.length-1].pageY)
    - painting.offsetTop - 24;
    mouseIsPressed = true;
    mousePressed();
}, false);

canvas.addEventListener('touchend', function() {
    mouseIsPressed = false;
    mouseReleased();
}, false);

function mouseLeave(){
    mouseIsPressed = false;
    mouseReleased();
}

function mouseEnter(){
    console.log(windowTitle);
    mouseX = e.clientX - painting.offsetLeft;
    mouseY = e.clientY - painting.offsetTop - 24;
    mousePressed();
    if(mouseIsPressed){
        mouseDragged();
    }
}