function makeApplyClassToCurrentTarget(className) {
    var lastElement = null
    return function(e) {
        if (lastElement) lastElement.classList.remove(className)
        if (e) {
            e.target.classList.add(className)
            lastElement = e.target
        }
    }
}

var applyOutlineToCurrentTarget = makeApplyClassToCurrentTarget('my-extension-outline')

function insertOptionsPanel() {
    var panel = makeEl('div', '', ['my-extension-panel']);

    var thebtn = makeEl('button', 'the', ['my-extension-option-button', 'my-extension-option-the'])
    panel.appendChild(thebtn)

    var abtn = makeEl('button', 'a', ['my-extension-option-button', 'my-extension-option-a'])
    panel.appendChild(abtn)

    var anbtn = makeEl('button', 'an', ['my-extension-option-button', 'my-extension-option-an'])
    panel.appendChild(anbtn)

    document.body.appendChild(panel)
    panel.style.display = 'none'
    console.log('inserted panel')
}

function updateOptionsPanel() {
    var panel = document.querySelector('.my-extension-panel')
    var thebtn = document.querySelector('.my-extension-option-the')
    var abtn = document.querySelector('.my-extension-option-a')
    var anbtn = document.querySelector('.my-extension-option-an')
    panel.style.display = 'block'

    thebtn.addEventListener('click', function(e) {handleAnswer('the')}, false)
    abtn.addEventListener('click', function(e) {handleAnswer('a')}, false)
    anbtn.addEventListener('click', function(e) {handleAnswer('an')}, false)

    window._my_extension_memory.options = {
        the: thebtn,
        a: abtn,
        an: anbtn
    }
}

function endQuiz() {
    console.log('the end')
    // unbind option buttons listeners
    // unbind key listener
}

function clickHandler(e) {
    window._my_extension_memory.listeners.mouseover(null)
    window._my_extension_memory.state.selection = {
        DOMelement: e.target,
        innerHTML: e.target.innerHTML
    }
    document.removeEventListener('mouseover', window._my_extension_memory.listeners.mouseover, false)
    window._my_extension_memory.state.mouseoverListener = false
    document.removeEventListener('click', window._my_extension_memory.listeners.click, false)
    window._my_extension_memory.state.clickListener = false
    document.querySelector('.my-extension-message').style.display = 'none'

    var theReg = /(The | the )/g
    var aReg = /(A | a )/g
    var anReg = /(An | an )/g
    var modif = e.target.innerHTML
    modif = modif.replace(theReg, '<span class="my-extension-field" data-truth="the" data-original="$&"> _ </span>')
    modif = modif.replace(aReg, '<span class="my-extension-field" data-truth="a" data-original="$&"> _ </span>')
    modif = modif.replace(anReg, '<span class="my-extension-field" data-truth="an" data-original="$&"> _ </span>')
    e.target.innerHTML = modif

    var first = document.querySelector('.my-extension-field')
    if (first) first.classList.add('my-extension-field-focused')
    window._my_extension_memory.current_el = first
    updateOptionsPanel()
}

function handleAnswer(answer) {
    var el = window._my_extension_memory.current_el
    if (!el) {
        console.log('the end')
        return
    }
    el.classList.remove('my-extension-field')
    el.classList.remove('my-extension-field-focused')
    el.innerText = el.dataset.original
    if (el.dataset.truth === answer) {
        el.classList.add('my-extension-true')
    }
    else {
        el.classList.add('my-extension-false')
    }
    window._my_extension_memory.options[answer].style.transform = 'translateY(10px)'
    window.setTimeout(function(){
        window._my_extension_memory.options[answer].style.transform = ''
    }, 100)
    var next = document.querySelector('.my-extension-field')
    if (next) next.classList.add('my-extension-field-focused')
    window._my_extension_memory.current_el = next
}

function keypressHandler(e) {
    switch (e.code) {
        case 'KeyZ':
            handleAnswer('the')
            break;
        case 'KeyX':
            handleAnswer('a')
            break;
        case 'KeyC':
            handleAnswer('an')
            break;
    }
}

var makeEl = function(tag, text, classList) {
    var el = document.createElement(tag)
    var content = document.createTextNode(text)
    el.appendChild(content)
    if (classList) classList.forEach(name => el.classList.add(name))
    return el
}



function promiseDOMready() {
    return new Promise(function (resolve) {
        if (document.readyState === 'complete') return resolve()
        document.addEventListener('DOMContentLoaded', resolve)
    })
}

promiseDOMready()
    .then(function() {
        if (!window._my_extension_memory) {
            // first call
            console.log('first call')
            window._my_extension_memory = {}
            window._my_extension_memory.state = {
                mouseoverListener: false,
                clickListener: false,
                keypressListener: false
            }
            window._my_extension_memory.listeners = {
                mouseover: applyOutlineToCurrentTarget,
                click: clickHandler,
                keypress: keypressHandler
            }
            var msg = makeEl('div', 'Select element', ['my-extension-message'])
            document.body.appendChild(msg)
            insertOptionsPanel()
        }
        else {
            document.querySelector('.my-extension-message').style.display = 'block'
            if (window._my_extension_memory.state.selection) {
                window._my_extension_memory.state.selection.DOMelement.innerHTML = window._my_extension_memory.state.selection.innerHTML
                window._my_extension_memory.state.selection = null
            }
        }

        if (!window._my_extension_memory.state.mouseoverListener) {
            console.log('attached mouseover listener')
            document.addEventListener('mouseover', window._my_extension_memory.listeners.mouseover, false)
            window._my_extension_memory.state.mouseoverListener = true
        }
        if (!window._my_extension_memory.state.clickListener) {
            console.log('attached click listener')
            document.addEventListener('click', window._my_extension_memory.listeners.click, false)
            window._my_extension_memory.state.clickListener = true
        }
        if (!window._my_extension_memory.state.keypressListener) {
            console.log('attached keypress listener')
            document.addEventListener('keypress', window._my_extension_memory.listeners.keypress, false)
            window._my_extension_memory.state.keypressListener = true
        }
    })