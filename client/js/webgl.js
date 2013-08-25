var webgl = (function() {
    var gl;

    function initGL(canvas) {
        try {
            console.log(canvas);
            gl = canvas.getContext("experimental-webgl", { alpha: false });
            gl.viewportWidth = canvas.width;
            gl.viewportHeight = canvas.height;

            pMatrix = mat4.ortho(0, gl.viewportWidth, gl.viewportHeight, 0, -1, 1);

            nextPOTWidth = nextPOT(gl.viewportWidth);
            nextPOTHeight = nextPOT(gl.viewportHeight);

            console.log("nextPOT size: " + nextPOTWidth + ", " + nextPOTHeight);
            gl.disable(gl.DEPTH_TEST);
            gl.depthMask(false);
        } catch (e) {
            console.log("Error when creating gl context: " +  + e.message);
        }
        if (!gl) {
            alert("Could not initialise WebGL, sorry: ");
        }
    }


    function getShader(gl, id) {
        var shaderScript = document.getElementById(id);
        if (!shaderScript) {
            console.log("could not find shader with id: " + id);
            return null;
        }

        var str = "";
        var k = shaderScript.firstChild;
        while (k) {
            if (k.nodeType == 3) {
                str += k.textContent;
            }
            k = k.nextSibling;
        }

        var shader;
        if (shaderScript.type == "x-shader/x-fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (shaderScript.type == "x-shader/x-vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            console.log("unrecognized shader type for shader with id: " + id);
            return null;
        }

        gl.shaderSource(shader, str);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert("Error loading " + id + ": " + gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }


    function makeShader(vertexShaderName, fragmentShaderName) {
        var vertexShader = getShader(gl, vertexShaderName);
        var fragmentShader = getShader(gl, fragmentShaderName);

        if (vertexShader == null) {
            console.log("vertex shader, " + vertexShaderName + ", could not be loaded");
        }

        if (fragmentShader == null) {
            console.log("fragment shader, " + fragmentShaderName + ", could not be loaded");
        }

        var shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        setShader(shaderProgram);

        shaderProgram.vertexAttribLocation = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        shaderProgram.textureAttribLocation = gl.getAttribLocation(shaderProgram, "aTextureCoord");
        shaderProgram.colorAttribLocation = gl.getAttribLocation(shaderProgram, "aColor");

        gl.enableVertexAttribArray(shaderProgram.vertexAttribLocation);
        gl.enableVertexAttribArray(shaderProgram.textureAttribLocation);

        return shaderProgram;
    }

    var defaultProgram;
    var allOrNothingProgram;
    var testProgram;
    var distanceProgram;
    var reductionProgram;
    var makeShadowsProgram;
    var transparentProgram;

    function initShaders() {
        vertexShaderName = "shader-vs";

        defaultProgram = makeShader(vertexShaderName, "shader-fs");
        allOrNothingProgram = makeShader(vertexShaderName, "allOrNothing");
        testProgram = makeShader(vertexShaderName, "test");
        distanceProgram = makeShader(vertexShaderName, "distance");
        reductionProgram = makeShader(vertexShaderName, "reduction");
        makeShadowsProgram = makeShader(vertexShaderName, "makeShadows");
        transparentProgram = makeShader(vertexShaderName, "transparent");

        setShader(defaultProgram);
    }


    function handleLoadedTexture(texture) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }


    var neheTexture;

    function initTexture() {
        neheTexture = gl.createTexture();
        neheTexture.image = new Image();
        neheTexture.image.onload = function () {
            handleLoadedTexture(neheTexture)
        }

        neheTexture.image.src = "../../webgl/shadowtest.png";
    }


    var mvMatrix = mat4.create();
    var mvMatrixStack = [];
    var pMatrix = mat4.create();
    var pMatrixStack = [];

    function mvPushMatrix() {
        var copy = mat4.create();
        mat4.set(mvMatrix, copy);
        mvMatrixStack.push(copy);
    }

    function mvPopMatrix() {
        if (mvMatrixStack.length == 0) {
            throw "Invalid popMatrix!";
        }
        mvMatrix = mvMatrixStack.pop();
    }

    function pPushMatrix() {
        var copy = mat4.create();
        mat4.set(pMatrix, copy);
        pMatrixStack.push(copy);
    }

    function pPopMatrix() {
        if (pMatrixStack.length == 0) {
            throw "Invalid popMatrix!";
        }
        pMatrix = pMatrixStack.pop();
    }

    function setMatrixUniforms() {
        gl.uniformMatrix4fv(gl.getUniformLocation(currentShader, "uPMatrix"), false, pMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(currentShader, "uMVMatrix"), false, mvMatrix);
    }


    function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

    var squareVertexPositionBuffer;
    var squareVertexTextureCoordBuffer;
    var squareVertexIndexBuffer;

    var fullscreenVertexPositionBuffer;
    var fullscreenVertexTextureCoordBuffer;
    var fullscreenVertexIndexBuffer;

    function initBuffers() {
        squareVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
        vertices = [
            0.0, 0.0,
            1024.0, 0.0,
            1024.0, 1024.0,
            0.0, 1024.0
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        squareVertexPositionBuffer.itemSize = 2;
        squareVertexPositionBuffer.numItems = 4;

        squareVertexTextureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexTextureCoordBuffer);
        vertices = [
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            0.0, 0.0
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
        squareVertexTextureCoordBuffer.itemSize = 2;
        squareVertexTextureCoordBuffer.numItems = 4;

        squareVertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareVertexIndexBuffer);
        var squareVertexIndices = [
            0, 1, 2,      0, 2, 3,
        ];
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(squareVertexIndices), gl.STATIC_DRAW);
        squareVertexIndexBuffer.itemSize = 1;
        squareVertexIndexBuffer.numItems = 6;


        var width = nextPOTWidth;
        var height = nextPOTHeight;
        fullscreenVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, fullscreenVertexPositionBuffer);
        vertices = [
            0.0, 0.0,
            width, 0.0,
            width, height,
            0.0, height
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        fullscreenVertexPositionBuffer.itemSize = 2;
        fullscreenVertexPositionBuffer.numItems = 4;

        fullscreenVertexTextureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, fullscreenVertexTextureCoordBuffer);
        vertices = [
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            0.0, 0.0
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
        fullscreenVertexTextureCoordBuffer.itemSize = 2;
        fullscreenVertexTextureCoordBuffer.numItems = 4;

        fullscreenVertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, fullscreenVertexIndexBuffer);
        var fullscreenVertexIndices = [
            0, 1, 2,      0, 2, 3,
        ];
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(fullscreenVertexIndices), gl.STATIC_DRAW);
        fullscreenVertexIndexBuffer.itemSize = 1;
        fullscreenVertexIndexBuffer.numItems = 6;
    }

    var fbo1;
    var fbo2;
    var fbo3;

    function nextPOT(x) {
        var tmp = 2;
        while (tmp < x) {
            tmp = tmp * 2;
        }

        return tmp;
    }

    var nextPOTWidth;
    var nextPOTHeight;

    function newFBO(width, height) {
        var fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        fbo.width = nextPOT(width);
        fbo.height = nextPOT(height);

        console.log("making fbo with width and height: " + fbo.width + ", " + fbo.height);

        var renderTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, renderTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fbo.width, fbo.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        gl.generateMipmap(gl.TEXTURE_2D);

        var renderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, fbo.width, fbo.height);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, renderTexture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

        newFBOVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, newFBOVertexPositionBuffer);
        vertices = [
            0.0, 0.0,
            fbo.width, 0.0,
            fbo.width, fbo.height,
            0.0, fbo.height
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        newFBOVertexPositionBuffer.itemSize = 2;
        newFBOVertexPositionBuffer.numItems = 4;

        newFBOVertexTextureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, newFBOVertexTextureCoordBuffer);
        vertices = [
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            0.0, 0.0
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
        newFBOVertexTextureCoordBuffer.itemSize = 2;
        newFBOVertexTextureCoordBuffer.numItems = 4;

        newFBOVertexIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, newFBOVertexIndexBuffer);
        var newFBOVertexIndices = [
            0, 1, 2,      0, 2, 3,
        ];
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(newFBOVertexIndices), gl.STATIC_DRAW);
        newFBOVertexIndexBuffer.itemSize = 1;
        newFBOVertexIndexBuffer.numItems = 6;

        fbo.texture = renderTexture;
        fbo.renderbuffer = renderbuffer;
        fbo.vertexPositionBuffer = newFBOVertexPositionBuffer;
        fbo.vertexTextureCoordBuffer = newFBOVertexTextureCoordBuffer;
        fbo.vertexIndexBuffer = newFBOVertexIndexBuffer;

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return fbo;
    }

    function drawNeHeLogo() {
        gl.viewport(0, 0, fbo1.width, fbo1.height);

        gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
        if (currentShader) {
            gl.vertexAttribPointer(currentShader.vertexAttribLocation, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexTextureCoordBuffer);
        if (currentShader) {
            gl.vertexAttribPointer(currentShader.textureAttribLocation, squareVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
        }

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, neheTexture);
        if (currentShader) {
            gl.uniform1i(gl.getUniformLocation(currentShader, "uSampler"), 0);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareVertexIndexBuffer);
        setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, squareVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    function drawFBO(fbo) {
        pPushMatrix();
            pMatrix = mat4.ortho(0, fbo.width, fbo.height, 0, -1.0, 1.0);
            gl.viewport(0, 0, fbo.width, fbo.height);

            gl.bindBuffer(gl.ARRAY_BUFFER, fbo.vertexPositionBuffer);
            gl.vertexAttribPointer(currentShader.vertexAttribLocation, fbo.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, fbo.vertexTextureCoordBuffer);
            gl.vertexAttribPointer(currentShader.textureAttribLocation, fbo.vertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, fbo.texture);
            gl.uniform1i(gl.getUniformLocation(currentShader, "uSampler"), 0);
            gl.uniform2f(gl.getUniformLocation(currentShader, "resolution"), fbo.width, fbo.height);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, fbo.vertexIndexBuffer);
            setMatrixUniforms();
            gl.drawElements(gl.TRIANGLES, fbo.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        pPopMatrix();
    }

    var transX = 0;
    var transY = 0;

    var mouseX = 0;
    var mouseY = 0;

    function drawScene() {
        mvMatrix = mat4.identity(mvMatrix);

        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo1);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        setShader(allOrNothingProgram);
        mvPushMatrix();
            //mvPushMatrix();
            //    mat4.translate(mvMatrix, [-(fbo1.width - gl.viewportWidth) / 2, (fbo1.height - gl.viewportHeight) / 2, 0]);
            //    var testM = mat4.inverse(mvMatrix);
            //    var newMouse = vec3.create();
            //    mat4.multiplyVec3(mvMatrix, [mouseX, mouseY, 0], newMouse);
            //    var diffX = (gl.viewportWidth / 2) - newMouse[0];
            //    var diffY = (gl.viewportHeight / 2) - newMouse[1];
            //mvPopMatrix();
            mat4.translate(mvMatrix, [transX, transY, 0]);
            drawNeHeLogo();
        mvPopMatrix();

        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo2);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        setShader(distanceProgram);
        drawFBO(fbo1);

        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo1);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        setShader(testProgram);
        drawFBO(fbo2);

        reduceFBO(fbo1);

        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo1);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        setShader(makeShadowsProgram);
        drawFBO(reductionSteps[0]);

        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo2);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        setShader(defaultProgram);
        drawFBO(fbo1);
        gl.enable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(false);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        setShader(transparentProgram);

        drawNeHeLogo();
        gl.disable(gl.BLEND);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        setShader(defaultProgram);
        mvPushMatrix();
            mat4.translate(mvMatrix, [-(fbo1.width - gl.viewportWidth) / 2, (fbo1.height - gl.viewportHeight) / 2, 0]);
            drawFBO(fbo2);
        mvPopMatrix();
    }


    var lastTime = 0;

    function animate() {
        var timeNow = new Date().getTime();
        if (lastTime != 0) {
            var elapsed = timeNow - lastTime;
        }
        lastTime = timeNow;
    }


    function tick() {
        requestAnimFrame(tick);
        drawScene();
        animate();
    }

    function setShader(shader) {
        gl.useProgram(shader);
        currentShader = shader;
    }

    var reductionSteps;
    var reductionFBO;

    function initReductionSteps() {
        reductionSteps = [];
        var power = 2;
        for (var i = 0; power < fbo1.width / 2; i++) {
            power = 2 << i;
            var fbo = newFBO(fbo1.width, fbo1.height)
            reductionSteps.push(fbo);
        }
    }

    function reduceFBO(fbo) {
        for (var i = reductionSteps.length - 1; i >= 0; i--) {
            setShader(reductionProgram);
            gl.bindFramebuffer(gl.FRAMEBUFFER, reductionSteps[i]);
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.uniform1f(gl.getUniformLocation(currentShader, "size"), fbo1.width / (2 << (reductionSteps.length - 1 - i)));
            if (i == reductionSteps.length - 1) {
                drawFBO(fbo);
            } else {
                drawFBO(reductionSteps[i + 1]);
            }
        }
    }

    //function webGLStart() {
    //    var canvas = document.getElementById("lesson05-canvas");
    //    initGL(canvas);
    //    initShaders();
    //    initBuffers();
    //    fbo1 = newFBO(gl.viewportWidth, gl.viewportHeight);
    //    fbo2 = newFBO(gl.viewportWidth, gl.viewportHeight);
    //    fbo3 = newFBO(256, 1);
    //    initReductionSteps();
    //    initTexture();
    //
    //    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    //
    //    tick();
    //}
    //

    function loadCanvasToTexture() {
    }

    function relMouseCoords(event, elem){
        var totalOffsetX = 0;
        var totalOffsetY = 0;
        var canvasX = 0;
        var canvasY = 0;
        var currentElement = elem;

        do{
            totalOffsetX += currentElement.offsetLeft;
            totalOffsetY += currentElement.offsetTop;
        }
        while(currentElement = currentElement.offsetParent)

        canvasX = event.pageX - totalOffsetX;
        canvasY = event.pageY - totalOffsetY;

        return {x:canvasX, y:canvasY}
    }

    function webglInit() {
        var canvas = document.createElement("canvas");
        canvas.width = 800;
        canvas.height = 600;
        //canvas.width = 900;
        //canvas.height = 900;
        var target = document.getElementById("canvas-box");
        target.appendChild(canvas);

        canvas.onmousemove = function (e) {
            var coords = relMouseCoords(e, canvas);
            mouseX = coords.x;
            mouseY = coords.y;
            //gl.uniform2f(gl.getUniformLocation(currentShader, "lightPos"), e.clientX, e.clientY);
        }

        initGL(canvas);
        initShaders();
        initBuffers();
        fbo1 = newFBO(gl.viewportWidth, gl.viewportHeight);
        fbo2 = newFBO(gl.viewportWidth, gl.viewportHeight);
        initReductionSteps();
        initTexture();

        gl.clearColor(0.0, 0.0, 0.0, 0.0);

        tick();
    }

    function webglDraw(createLightBlockerImage, createFinalImage) {
        createLightBlockerImage();

        // generate mask

        createFinalImage();

        // use mask to mask final image
    }

    return {'init':webglInit, 'draw':webglDraw};
})();
