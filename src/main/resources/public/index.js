let queue = [];
let calc = [];

// setting up websocket
window.onload = setupWebSocket;
window.onhashchange = setupWebSocket;
if (!window.location.hash) {
    // generating random room ids based off the date
    const newDocumentId = Date.now().toString(30);
    window.history.pushState(null, null, "#" + newDocumentId);
}
function setupWebSocket() {
    const textArea = document.querySelector("textarea");
    const ws = new WebSocket(`ws://localhost:8000/docs/${window.location.hash.substr(1)}`);
    $('#view').click(function(){
        location.reload();
    });
    // sending values to websocket every time there is a keystroke
    textArea.onkeyup = () => ws.send(textArea.value);
    $('.btn').click(function(){
        // sends user's equation along with a special identifier
        ws.send(textArea.value + "charles");
        location.reload();
    });
    let j = 0;
    // sending values every time there is a keystroke
    ws.onmessage = msg => {
        // searches for special identifier to see if the user clicked submit
        if(msg.data.includes("charles")){
            // sends all of the current and previous calculations to all of the collaborators for a specific room
            calc.push(msg.data);
            calc = calc[calc.length - 1].split('charles');
            if(j % 2 === 1) {
                queue=[];
                document.getElementById("calculations").innerHTML = "";
                for(let i = 0; i < calc.length - 1; i++){
                    // interacts with a RESTful API to calculate the user's equation
                    let calculation = calc[i];
                    let equations = calc[i];
                    calculation = calculation.split("+").join("%2B");
                    calculation = calculation.split("-").join("%2D");
                    calculation = calculation.split("/").join("%2F");
                    calculation = calculation.split("*").join("%2A");
                    const Url = 'http://api.mathjs.org/v4/?expr=' + calculation;
                    $.getJSON(Url, function (result) {
                        queue.push(equations + "=" + result);
                        // outputs calculations in a user-friendly format
                        var app = document.querySelector('#calculations');
                        app.innerHTML = '<ul class="list-group">' + queue.map(function (queue) {
                            return '<li class="list-group-item">' + queue + '</li>';
                        }).reverse().join('') + '</ul>';
                        document.querySelector("#text").value = null;
                    })
                }
            }
            textArea.value = "";
        } else {
            textArea.value = msg.data;
        }
        j++;
    };
    // will reconnect websocket if tab is closed
    ws.onclose = setupWebSocket;
}
