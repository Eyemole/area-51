const EEG_MIN = 0;
const EEG_MAX = 1200;
const EEG_RANGE = EEG_MAX - EEG_MIN;
const MAX_HEIGHT = 5;
const GSR_MAX = 500;
const B = 172;
const G = 113;

const EEG_ADDR = "out/muse/eeg/";
const GSR_ADDR = "out/gsr/";
var ADDRESSES = {"out/muse/eeg/": 4, "out/gsr/": 1};
var CHANNEL_MAP = {0: "tp9", 1: "af7", 2: "af8", 3: "tp10"};

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


    //Move one of the 4 spheres 
    function moveY(el, data) {
      console.log(el);
      var pos = el.getAttribute("position");
      var anim = el.getElementsByTagName('a-animation')[0];
      anim.setAttribute("from", pos);
      pos.y = data/EEG_RANGE*MAX_HEIGHT;
      anim.setAttribute("to", pos);
      el.setAttribute("position", pos);
    }

    //Change the colour of the sky according to the GSR data
    function changeSkyColour(data) {

      data = Math.min(GSR_MAX, data);
      var sky = document.getElementsByTagName('a-sky')[0];

      //Amount of red in the sky is inversely proportional to the GSR value 
      //Low arousal = blue sky, high arousal = red sky 
      var r = Math.floor(255 * (1 - data / GSR_MAX));
      sky.setAttribute("color", "rgb(" + r + "," + G + "," + B + ")");;
    }


    //Listen to messages from the eeg-connector server.
    //On receiveng a "out/muse/eeg/{i}" message, 
    //Move the i'th sphere
    for (var i = 0; i < ADDRESSES[EEG_ADDR]; i++) {
      console.log(document.getElementById(CHANNEL_MAP[i]));
      socket.on(EEG_ADDR + i, function(data) {
          moveY(document.getElementById(CHANNEL_MAP[i]), data);
    });
    }

    //On receiveng a "out/gsr" message, 
    //Update the sky colour
    socket.on(GSR_ADDR + 0, function(data) {
          changeSkyColour(data);
    });

  }
}
