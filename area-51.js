const EEG_MIN = 0;
const EEG_MAX = 1200;
const EEG_RANGE = EEG_MAX - EEG_MIN;
const MAX_HEIGHT = 5;
const GSR_MIN = 100;
const GSR_MAX = 500;
const ALPHA_MIN = -1;
const ALPHA_MAX = 2;
const MIN_OCEAN_SPEED = 0.1;
const MAX_OCEAN_SPEED = 10;
const MIN_OCEAN_AMPLITUDE = 0.01;
const MAX_OCEAN_AMPLITUDE = 1;
const B = 172;
const G = 113;
var R = 25;

const MAX_LINE_LENGTH = 180;

const EEG_ADDR = "out/muse/eeg/";
const ALPHA_ADDR = "out/muse/elements/alpha_absolute";
const BETA_ADDR = "out/muse/elements/beta_absolute";
const THETA_ADDR = "out/muse/elements/theta_absolute";
const BLINK_ADDR = "out/muse/elements/blink";
const GSR_ADDR = "out/gsr/";
var ADDRESSES = {"out/muse/eeg/": 4, "out/muse/elements/alpha_absolute": 4, "out/muse/elements/beta_absolute": 4,
 "out/muse/elements/theta_absolute": 4, "out/muse/elements/blink": 1, "out/gsr/": 1};
var CHANNEL_MAP = {0: "tp9", 1: "af7", 2: "af8", 3: "tp10"};
var RADIUS_MAP = {0: 4, 1: 2, 2: 3, 3: 5};
var INIT_POS_MAP = {0: {x: -4, y:1 , z: 0} , 1: {x: 0, y: 2, z: -2},  2: {x: 0, y: 2, z: 3}, 3: {x: 5, y: 1, z:0 } };
var LINE_MAP = {0: ["-4 1 0"], 1: ["0 2 -2"], 2: ["0 2 3"], 3: ["5 1 0"]};


var currt = 0;
var alphas = [0, 0, 0, 0];
var betas = [0, 0, 0, 0];
var thetas = [0, 0, 0, 0];
var eeg = [0, 0, 0, 0];
var blink = false;
var gsr = 0;

window.onload = function() {

    // Find the session ID form 

    var formel = document.getElementsByTagName('form')[0];
  	console.log(formel);

    // When the Session ID is entered into the form, run the getsocket() function

    if (formel.addEventListener) {
      formel.addEventListener("submit", function(evt) { evt.preventDefault(); getsocket(); return false; }, false);
    } else if (formel.attachEvent) {
      formel.attachEvent("onsubmit", function(evt) { evt.preventDefault(); getsocket(); return false; });
    }

    function getsocket() {
      
    // Get the session ID value 
    sessionid = formel.elements[0].value;
    console.log("https://eeg-connector.herokuapp.com/" + sessionid);

    //The EEG/GSR data from the connector app is sent to the eeg-connector server 
    //to the {sessionid} room. The line below connects to that room 
    var socket = io("https://eeg-connector.herokuapp.com/" + sessionid).connect();
    console.log(socket);

    function updateAlpha(data, id) {

      data = Math.max(Math.min(ALPHA_MAX, data), ALPHA_MIN);
      alphas[id] = data;
    }

    function updateBeta(data, id) {

      data = Math.max(Math.min(ALPHA_MAX, data), ALPHA_MIN);
      betas[id] = data;
    }

   function updateTheta(data, id) {

      data = Math.max(Math.min(ALPHA_MAX, data), ALPHA_MIN);
      thetas[id] = data;
    }

    function updateEEG(data, id) {

      data = Math.max(Math.min(EEG_MAX, data), EEG_MIN);
      eeg[id] = data;
    }

    function updateGSR(data) {

      gsr = Math.max(Math.min(GSR_MAX, data), GSR_MIN);

    }

    //Listen to messages from the eeg-connector server.
    //On receiveng a "out/muse/eeg/{i}" message, 
    //Move the i'th sphere

    for (let i = 0; i < ADDRESSES[EEG_ADDR]; i++) {
      socket.on(EEG_ADDR + i, function(data) {
          updateEEG(data, i);
    });
    }

    //Listen to messages from the eeg-connector server.
    //On receiveng a "out/muse/elements/alpha_absolute/{i}" message, 
    //Change the speed of the ocean 

    for (let i = 0; i < ADDRESSES[ALPHA_ADDR]; i++) {
      socket.on(ALPHA_ADDR + i, function(data) {
          updateAlpha(data, i);
    });
    }

    for (let i = 0; i < ADDRESSES[BETA_ADDR]; i++) {
      socket.on(BETA_ADDR + i, function(data) {
          updateBeta(data, i);
    });
    }

    for (let i = 0; i < ADDRESSES[THETA_ADDR]; i++) {
      socket.on(THETA_ADDR + i, function(data) {
          updateTheta(data, i);
    });
    }

    //On receiveng a "out/gsr" message, 
    //Update the sky colour
    socket.on(GSR_ADDR + 0, function(data) {
          updateGSR(data);
    });


    //On receiveng a "out/muse/elements/blink/0" message, 
    //Just turn off the sky
    socket.on(BLINK_ADDR + 0, function(data) {
          blink = true;
    });

  }

      //Move one of the 4 spheres 
    function moveY(el, id) {
      var data = eeg[id];
      var r = RADIUS_MAP[id];
      var init_pos = INIT_POS_MAP[id];
      var line = LINE_MAP[id];
      var pos = el.getAttribute("position");
      pos.y = init_pos.y + data/EEG_RANGE*MAX_HEIGHT;
      pos.x = init_pos.x + r * Math.cos(currt * Math.PI / 180);
      pos.z = init_pos.z + r * Math.sin(currt * Math.PI / 180);
      el.setAttribute("position", pos);

      var meshline = el.getElementsByTagName("*")[0];

      if (line.length >= MAX_LINE_LENGTH) {
        line = line.splice(1, line.length);
      }

      line.push(pos.x + " " + pos.y + " " + pos.z);
      meshline.setAttribute("meshline", 'path: ' + line.toString() + "; lineWidth: 10; color: 50c878");
    }

    //Turn off the sky when you're blinking
    function blackenSky() {

      var sky = document.getElementsByTagName('a-sky')[0];
      sky.setAttribute("color", "#000");
    }


    //Change the colour of the sky according to the GSR data
    function changeSkyColour() {

      var sky = document.getElementsByTagName('a-sky')[0];

      //Amount of red in the sky is inversely proportional to the GSR value 
      //Low arousal = blue sky, high arousal = red sky 
      var r = Math.floor(R + 155 * (1 - gsr / GSR_MAX));
      sky.setAttribute("color", "rgb(" + r + "," + G + "," + B + ")");;
    }


    //Change the speed of the ocean according to absolute alpha values
    function changeOceanSpeed(data) {

      var ocean = document.getElementsByTagName('a-sky')[0];
      var zscore = 1 - (data - ALPHA_MIN)/ (ALPHA_MAX - ALPHA_MIN);
      ocean.setAttribute("speed", zscore * MAX_OCEAN_SPEED);
      ocean.setAttribute("amplitude", zscore * MAX_OCEAN_AMPLITUDE);

    }

    function render() {

        requestAnimationFrame(render);

        currt = (currt + 1) % 360;

        for (let i = 0; i < ADDRESSES[EEG_ADDR]; i++) {
          moveY(document.getElementById(CHANNEL_MAP[i]), i);
        }

        changeOceanSpeed(alphas.reduce((a,b) => (a+b)) / alphas.length);

        changeSkyColour();

        if (blink) {
          blackenSky();
          blink = false;
        }

    }

    requestAnimationFrame(render);

}
