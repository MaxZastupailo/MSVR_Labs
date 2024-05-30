let context;
let audioPlayer;
let source;
let notchFilter;
let panner;

function setupAudio() {
    audioPlayer = document.getElementById('audioID');

    audioPlayer.addEventListener('play', () => {
        if (!context) {
            context = new AudioContext();
            source = context.createMediaElementSource(audioPlayer);
            panner = context.createPanner();
            notchFilter = context.createBiquadFilter();

            source.connect(panner);
            panner.connect(notchFilter);
            notchFilter.connect(context.destination);

            notchFilter.type = 'notch'; 
            notchFilter.Q.value = 1;
            notchFilter.gain.value = 11;
            context.resume();
        }
    });

    audioPlayer.addEventListener('pause', () => {
        console.log('pause');
        context.resume();
    });
}

function initAudio() {
    setupAudio();
    const radioButton = document.getElementById('checker');
    radioButton.addEventListener('change', function() {
        if (radioButton.checked) {
            panner.disconnect();
            panner.connect(notchFilter);
            notchFilter.connect(context.destination);
        } else {
            panner.disconnect();
            panner.connect(context.destination);
        }
    });
    audioPlayer.play();
}
