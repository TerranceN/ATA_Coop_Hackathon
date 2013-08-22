var socket = io.connect('http://199.167.22.180:8888/');
socket.on('news', function (data) {
    console.log(data);
    socket.emit('my other event', { my: 'data' });
});
