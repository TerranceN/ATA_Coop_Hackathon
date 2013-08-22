ATA Coop Hackathon
==============

Working on the server
---------------------

Code is reused between the client and the node.js server using the browserify node.js module.

Just write code in the node.js style (requires, and module.exports), then run browserify on the main client js file (client/js/app.js) to turn it into a bundle.js that includes the app.js code and all the node modules that it requires. I've also included a makefile that will do it for you by just running `make`.

SSHing into the server
----------------------
Wesley should have given you access. Just do `ssh 199.167.22.180` then enter your panel password.

Running the server
------------------

just run `node server.js` in the project's root directory.
