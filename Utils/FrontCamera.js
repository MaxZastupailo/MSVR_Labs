let video;
function getFrontCamera() {
    video = document.createElement('video');
    video.setAttribute('autoplay', true);
    window.vid = video;
    navigator.getUserMedia({ video: true, audio: false }, function (stream) {
        video.srcObject = stream;
        track = stream.getTracks()[0];
    }, function (e) {
        console.error('Rejected!', e);
    });
}
getFrontCamera();