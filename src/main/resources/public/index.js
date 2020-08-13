let queue = [];
let calc = [];

window.onload = setupWebSocket;
window.onhashchange = setupWebSocket;
if (!window.location.hash) {
    const newDocumentId = Date.now().toString(36);
    window.history.pushState(null, null, "#" + newDocumentId);
}

function setupWebSocket() {
    const textArea = document.querySelector("textarea");
    const ws = new WebSocket(`ws://localhost:8000/docs/${window.location.hash.substr(1)}`);
    textArea.onkeyup = () => ws.send(textArea.value);
    $('.btn').click(function(){
        ws.send(textArea.value + "charles");
        location.reload();
    });
    let j = 0;
    ws.onmessage = msg => {
        const offset = msg.data.length - textArea.value.length;
        const selection = {start: textArea.selectionStart, end: textArea.selectionEnd};
        const startsSame = msg.data.startsWith(textArea.value.substring(0, selection.end));
        const endsSame = msg.data.endsWith(textArea.value.substring(selection.start));
        if(msg.data.includes("charles")){
            calc.push(msg.data);
            calc = calc[calc.length - 1].split('charles');
            if(j % 2 === 1) {
                queue=[];
                document.getElementById("calculations").innerHTML = "";
                for(var i = 0; i < calc.length - 1; i++){
                    let calcs = calc[i];
                    let equations = calc[i];
                    calcs = calcs.split("+").join("%2B");
                    calcs = calcs.split("-").join("%2D");
                    calcs = calcs.split("/").join("%2F");
                    calcs = calcs.split("*").join("%2A");
                    const Url = 'http://api.mathjs.org/v4/?expr=' + calcs;
                    $.getJSON(Url, function (result) {
                        if (queue.length === 300) {
                            queue.shift();
                            queue.push(equations + "=" + result);
                        } else {
                            queue.push(equations + "=" + result);
                        }
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
        if (startsSame && !endsSame) {
            textArea.setSelectionRange(selection.start, selection.end);
        } else if (!startsSame && endsSame) {
            textArea.setSelectionRange(selection.start + offset, selection.end + offset);
        } else {
            textArea.setSelectionRange(selection.start, selection.end + offset);
        }
        j++;
    };
    ws.onclose = setupWebSocket;
}
