package app

import io.javalin.Javalin
import io.javalin.websocket.WsContext
import java.util.concurrent.ConcurrentHashMap

// class that contains each room's document, collaborators, and previous calculations
data class Collaboration(var doc: String = "", val clients: MutableSet<WsContext> = ConcurrentHashMap.newKeySet(), var calculations: String = "")

fun main() {
    // keeps track of room ID along with each room's document, collaborators, and previous calculations
    val collaborations = ConcurrentHashMap<String, Collaboration>()
    // creating a web application and server
    Javalin.create {
        // accessing all of the web development files (HTML, CSS, Javascript)
        it.addStaticFiles("/public")
    }.apply {
        ws("/docs/:doc-id") { ws ->
            // every time a user joins, websocket provides a unique id called ctx
            ws.onConnect { ctx ->
                // checking if user's unique id exists in collaboration
                if (collaborations[ctx.docId] == null) {
                    collaborations[ctx.docId] = Collaboration()
                }
                // adds newly connected user to the client list of ctx.docId
                collaborations[ctx.docId]!!.clients.add(ctx)
                // sending the doc and previous calculations to the user that just connected
                ctx.send(collaborations[ctx.docId]!!.doc)
                ctx.send(collaborations[ctx.docId]!!.calculations)
            }
            ws.onMessage { ctx ->
                val message: String = ctx.message() // ctx.message() = text.value from index.js
                var isCalc: Boolean = false
                // adds all of the previous calculations from every user in a specific room with a unique identifier
                // separating each calculation
                if((message.length >= 5) && (message.contains("charles"))){
                    collaborations[ctx.docId]!!.calculations += message
                    isCalc = true
                }
                // changes the doc to the newly sent message
                collaborations[ctx.docId]!!.doc = ctx.message()
                // sends doc and calculations to user who have their tab open
                collaborations[ctx.docId]!!.clients.filter { it.session.isOpen }.forEach {
                    it.send(collaborations[ctx.docId]!!.doc)
                    if (isCalc) {
                        it.send(collaborations[ctx.docId]!!.calculations)
                    }
                }
            }
            // removes user from client list if they exit the tab
            ws.onClose { ctx ->
                collaborations[ctx.docId]!!.clients.remove(ctx)
            }
        }
    }.start(8000)

}
// gets the room id
val WsContext.docId: String get() = this.pathParam("doc-id")
