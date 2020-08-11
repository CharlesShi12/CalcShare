let queue = [];
let input;
function run() {
    input = document.querySelector("#text").value;
}
function clear(){
    queue=[];
    document.getElementById("calculations").innerHTML = "";
}
btn = document.querySelector("#button");
btn.addEventListener("click", run);
btnClear = document.querySelector("#clear");
btnClear.addEventListener("click", clear);
$('.btn').click(function(){
    let calc = document.querySelector("#text").value;
    calc = calc.split("+").join("%2B");
    calc = calc.split("-").join("%2D");
    calc = calc.split("/").join("%2F");
    calc = calc.split("*").join("%2A");
    const Url = 'http://api.mathjs.org/v4/?expr=' + calc;
    $.getJSON(Url, function(result){
        if(queue.length === 10) {
            queue.shift();
            queue.push(input + "=" + result);
        }else{
            queue.push(input + "=" + result);
        }
        var app = document.querySelector('#calculations');
        app.innerHTML = '<ul class="list-group">' + queue.map(function (queue) {
            return '<li class="list-group-item">' + queue + '</li>';
        }).reverse().join('') + '</ul>';
        document.querySelector("#text").value = null;
    })
});
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
    ws.onmessage = msg => {
        const offset = msg.data.length - textArea.value.length;
        const selection = {start: textArea.selectionStart, end: textArea.selectionEnd};
        const startsSame = msg.data.startsWith(textArea.value.substring(0, selection.end));
        const endsSame = msg.data.endsWith(textArea.value.substring(selection.start));
        textArea.value = msg.data;
        if (startsSame && !endsSame) {
            textArea.setSelectionRange(selection.start, selection.end);
        } else if (!startsSame && endsSame) {
            textArea.setSelectionRange(selection.start + offset, selection.end + offset);
        } else {
            textArea.setSelectionRange(selection.start, selection.end + offset);
        }
    };
    ws.onclose = setupWebSocket; // should reconnect if connection is closed
}
