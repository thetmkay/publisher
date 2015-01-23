Publisher
=============

Publisher (real name TBD) is [Express](github.com/strongloop/express) middleware to preview and publish/save posts that use a templating system (see currently supported engines below).

## Motivation

Let's say you had a blog written with Express. You may have a post template that looks something like this:

````html
<html>
<head>
<title>{{title}}</title>
</head>
<body>
{{post_content}}
</body>
</html>
````

To render a post, the server will fetch the post's data from the database, and render the template with the corresponding JSON.

Publisher will help you preview the content and see what it looks like without pushing anything to the database (ie while either writing the content or developing the template) by allowing you to 'fill out' the JSON and see the template rerender live. You can even maintain different JSON for the same template on the same webpage, or on different pages/browsers.

## Dependency

Publisher uses [websockets](socket.io). The IO server needs to be passed in to the middleware on instantiation.

## How it works

Every template gets a socket room, and all re-rendering of the template (or compiling of markdown files) happens on the server. Every client connects to the room, and pushes updates to the server if the user changes any of the mock JSON object. The server will then rerender the template, and push it to any client in the room.

The client will resolve the new template against the existing one using a [virtual-dom](github.com/Matt-Esch/virtual-dom) and diffing it against the current dom, and patching any differences.

## Use (Client)

In the browser, hovering over the right side will bring out the editor. Alternatively, pressing the '-' key will also toggle the editor. There are 10 (0-9) possible mock JSON objects whose state is maintained by the server (so refreshing or opening a new page will maintain the same objects). The objects can be switched using the number keys or by pressing the corresponding number on the editor.

## Use (server)

Publisher is express middleware, and therefore can be mounted under a special route. It has three parameters:

- app (Express app): used to get the template locations
- io (Socket server): used to set up sockets
- settings: list of default settings, including the JSON templates for each template
