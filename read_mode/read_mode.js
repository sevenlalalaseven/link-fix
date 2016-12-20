// ==UserScript==
// @name                HTML cliper@
// @@description         HTML cliper
// @@description:zh-CN   HTML cliper
// @@description:zh-TW   HTML cliper

// @authuer             Moshel
// @namespace           https://hzy.pw
// @@homepageURL         https://hzy.pw/p/1364
// @supportURL          https://github.com/h2y/link-fix
// @@icon                https://hzy.pw/wp-content/uploads/2015/08/i-300x300.jpg
// @license             GPL-3.0
// @updateURL           https://github.com/h2y/link-fix/raw/master/read_mode/read_mode.user.js

// @include             *
// @grant               Moshels
// @run-at              context-menu
// @require             https://cdn.staticfile.org/keymaster/1.6.1/keymaster.min.js

// @date                12/17/2015
// @modified            12/20/2015
// @version             1.0.0
// ==/UserScript==


/*
    global var
 */
let mode = 0,        //状态标记
    topNode = null,  //顶层节点
    styleNode = null,
    butNodes = null,
    zoomLevel = 1;


/*
    Tool functions
 */
function isNodeShow(node) {
    const styles = window.getComputedStyle(node);

    if(styles.display=='none' || styles.visibility=='hidden')
        return false;

    if(!parseInt(styles.height) || !parseInt(styles.height))
        return false;

    return true;
}


function nodeStyleInline(node) {
    let styleStr = '',
        styles = window.getComputedStyle(node);

    let keys = Object.keys(styles);
    for(let key of keys) {
        //if(key==='cssText')     continue;
        //if(parseInt(key)==key)  continue;
        /*if(/^(webkit|moz|ms)/.test(key))
            continue;

        if(styles[key]=='')     continue;*/

        let value = styles[key];
        key = changeStrStyle(key.replace('webkit','-webkit'));

        styleStr += key + ':' + value + ';';
    }

    node.className = '';
    node.id = '';
    node.style = styleStr;

    //child
    if(node.childElementCount)
        for(let child of node.children)
            nodeStyleInline(child);
}


// textAlign -> text-align
function changeStrStyle(str) {
    let chars = str.split('');

    for(let i=chars.length-1; i>=0; i--) {
        let ascii = chars[i].charCodeAt(0);
        if(ascii>=65 && ascii<91) {
            //A-Z
            chars[i] = '-' + String.fromCharCode(ascii+32);
        }
    }

    return chars.join('');
}


/*
    main functions
 */
function enterCliping(e) {
    mode = 1;
    e.preventDefault();

    //add style
    if(!styleNode) {
        styleNode = document.createElement('style');
        styleNode.innerHTML = `.cliper-top-node {
            box-shadow: 0 0 20px #777;
            border:     3px solid red;
        } .read-mode-reading {
            position:   fixed   !important;
            z-index:    999970  !important;
            top:        0       !important;
            left:       0       !important;
            width:      100%    !important;
            height:     100%    !important;
            background-color: white     !important;
            overflow:         scroll    !important;
            padding:          1rem 3rem !important;
            border:           0         !important;
            margin:           0         !important;
        } .read-mode-buts {
            position:   fixed;
            z-index:    999985;
            top: 1rem;  right: 1rem;
        } .read-mode-button {
            width:      54px;
            height:     54px;
            margin:     0 1rem;
        }`;
        styleNode.id = 'read_mode';
        document.body.appendChild(styleNode);
    }

    //choose the init node
    topNode = document.body;
    let preNode = null;

    do {
        preNode = topNode;
        onDown(e);
    }while(preNode!=topNode && preNode.clientHeight*0.8 < topNode.clientHeight);
}

function quitCliping(e) {
    mode = 0;
    e.preventDefault();

    topNode.style.zoom = '';

    changeTopNode(null);

    if(butNodes)
        butNodes.style.display = 'none';

    topNode.classList.remove('read-mode-reading');
}


function buildButNodes() {
    butNodes = document.createElement('div');
    butNodes.className = 'read-mode-buts';

    let buts = [
        {
            text:    "Exit read mode",
            handler: quitCliping,
            icon:    'https://github.com/h2y/link-fix/raw/master/read_mode/icons/277-exit.svg'
        }, {
            text:    "Enlarge",
            handler: onEnlarge,
            icon:    'https://github.com/h2y/link-fix/raw/master/read_mode/icons/136-zoom-in.svg'
        }, {
            text:    "Shrink",
            handler: onShrink,
            icon:    'https://github.com/h2y/link-fix/raw/master/read_mode/icons/137-zoom-out.svg'
        }, {
            text:    "Save HTML data",
            handler: onSaveHTML,
            icon:    'https://github.com/h2y/link-fix/raw/master/read_mode/icons/097-download.svg'
        }
    ];

    for(let but of buts) {
        let newBut = document.createElement('a');
        newBut.className = 'read-mode-button';
        newBut.innerHTML = `<img src="${but.icon}">`;
        newBut.title = but.text;
        newBut.onClick = but.handler;
        butNodes.appendChild(newBut);
    }

    document.body.appendChild(butNodes);
}


function changeTopNode(newNode) {
    if(topNode)
        topNode.classList.remove('cliper-top-node');

    if(newNode)
        newNode.classList.add('cliper-top-node');
    else
        return;

    topNode = newNode;

    //scroll
    var winH = window.screen.availHeight,
        winY = window.scrollY,
        domH = topNode.clientHeight,
        domY = topNode.getBoundingClientRect().top + winY;

    if(domH>winH)
        document.body.scrollTop = domY - 50;
    else
        document.body.scrollTop = domY - (winH-domH)/2;
}


/*
    Event handler
 */
function onEnlarge(e) {
    zoomLevel += .1;
    topNode.style.zoom = zoomLevel;
}
function onShrink(e) {
   zoomLevel -= .1;
   topNode.style.zoom = zoomLevel;
}


function onSaveHTML(e) {

}


function onUp(e) {
    if(!mode) return;
    e.preventDefault();

    if(topNode.parentElement)
        changeTopNode(topNode.parentNode);
}

function onDown(e) {
    if(!mode) return;
    e.preventDefault();

    if(!topNode.childElementCount)
        return;

    var scanNodes = topNode.children,
        maxNode = null;
    var maxHeight = -1;

    for(let node of scanNodes)
        if(isNodeShow(node) && node.clientHeight > maxHeight) {
            maxHeight = node.clientHeight;
            maxNode = node;
        }

    if(maxNode)
        changeTopNode(maxNode);
}

function onLeft(e) {
    if(!mode) return;
    e.preventDefault();

    let nowNode = topNode;
    for(let node=nowNode; node.previousElementSibling;) {
        node = node.previousElementSibling;
        if(isNodeShow(node)) {
            nowNode = node;
            break;
        }
    }

    if(nowNode!=topNode)
        changeTopNode(nowNode);
    //else: up
    else if (topNode.parentNode) {
        let bakNode = nowNode = topNode;

        onUp(e);
        nowNode = topNode;

        onLeft(e);
        if(nowNode==topNode)
            changeTopNode(bakNode);
        else
            onDown(e);
    }
}

function onRight(e) {
    if(!mode) return;
    e.preventDefault();

    let nowNode = topNode;
    for(let node=nowNode; node.nextElementSibling;) {
        node = node.nextElementSibling;
        if(isNodeShow(node)) {
            nowNode = node;
            break;
        }
    }

    if(nowNode!=topNode)
        changeTopNode(nowNode);
    //else: up
    else if (topNode.parentNode) {
        let bakNode = nowNode = topNode;

        onUp(e);
        nowNode = topNode;

        onRight(e);
        if(nowNode==topNode)
            changeTopNode(bakNode);
        else
            onDown(e);
    }
}


function onEnter(e) {
    if(!mode) return;
    e.preventDefault();

    quitCliping(e);

    topNode.classList.add('read-mode-reading');

    topNode.style.zoom = 1.2;
    zoomLevel = 1.2;

    //buttons
    if(butNodes)
        butNodes.style.display = '';
    else
        buildButNodes();
}


/*
    Main
 */
if(mode)      quitCliping(new MouseEvent("main"));
else         enterCliping(new MouseEvent("main"));


/*
    bind action
 */
window.key('up', onUp);
window.key('down', onDown);
window.key('left', onLeft);
window.key('right', onRight);

window.key('enter', onEnter);
window.key('esc', quitCliping);