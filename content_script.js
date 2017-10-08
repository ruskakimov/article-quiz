function makeApplyClassToCurrentTarget(className) {
    var lastElement = null
    return function(e) {
        if (lastElement) lastElement.classList.remove(className)
        if (e) {
            if (!e.target.classList.contains('my-extension-message')) {
                e.target.classList.add(className)
                lastElement = e.target
            }
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

    window._my_extension_memory.optionButtons = {
        the: thebtn,
        a: abtn,
        an: anbtn
    }
}


function unbindListener(action) {
    document.removeEventListener(action, window._my_extension_memory.listeners[action], false)
    window._my_extension_memory.bound[action] = false
}


function endQuiz() {
    // unbind option button listeners?
    unbindListener('keypress')
    document.querySelector('.my-extension-panel').style.display = 'none'
    console.log('the end')
}


var theReg = /(^|\s)(The )|( the )/g
var aReg = /(^|\s)(A )|( a )/g
var anReg = /(^|\s)(An )|( an )/g

function replaceArticles(element) {
    if (element.tagName === "P") {
        var modif = element.innerText
        modif = modif.replace(theReg, '<span class="my-extension-field" data-truth="the" data-original="$&"> _ </span>')
        modif = modif.replace(aReg, '<span class="my-extension-field" data-truth="a" data-original="$&"> _ </span>')
        modif = modif.replace(anReg, '<span class="my-extension-field" data-truth="an" data-original="$&"> _ </span>')
        element.innerHTML = modif
    }
    else if (element.children) {
        Array.prototype.forEach.call(element.children, function(child) {
            replaceArticles(child)
        })
    }
}


function prepareNextField() {
    var first = document.querySelector('.my-extension-field')
    if (first) {
        first.classList.add('my-extension-field-focused')
        first.scrollIntoViewIfNeeded()
    }
    window._my_extension_memory.current_el = first
}


function clickHandler(e) {
    window._my_extension_memory.listeners.mouseover(null)
    window._my_extension_memory.selection = {
        DOMelement: e.target,
        innerHTML: e.target.innerHTML
    }
    unbindListener('mouseover')
    unbindListener('click')
    document.querySelector('.my-extension-message').style.display = 'none'
    replaceArticles(e.target)
    prepareNextField()
    updateOptionsPanel()
}


function handleAnswer(answer) {
    var el = window._my_extension_memory.current_el
    window._my_extension_memory.optionButtons[answer].classList.add('my-extension-option-button-pressed')
    window.setTimeout(function(){
        window._my_extension_memory.optionButtons[answer].classList.remove('my-extension-option-button-pressed')
    }, 100)
    if (el.dataset.truth === answer) {
        if (!el.classList.contains('my-extension-false')) {
            el.classList.add('my-extension-true')
        }
        el.innerText = el.dataset.original
        el.classList.remove('my-extension-field')
        el.classList.remove('my-extension-field-focused')
        Object.keys(_my_extension_memory.optionButtons).forEach(option => {
            window._my_extension_memory.optionButtons[option].classList.remove('my-extension-option-button-false')
        })
    }
    else {
        el.classList.add('my-extension-false')
        window._my_extension_memory.optionButtons[answer].classList.add('my-extension-option-button-false')
    }
    prepareNextField()
    if (!window._my_extension_memory.current_el) endQuiz()
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
            window._my_extension_memory.bound = {
                mouseover: false,
                click: false,
                keypress: false
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
            if (window._my_extension_memory.selection) {
                window._my_extension_memory.selection.DOMelement.innerHTML = window._my_extension_memory.selection.innerHTML
                window._my_extension_memory.selection = null
            }
        }

        if (!window._my_extension_memory.bound.mouseover) {
            console.log('attached mouseover listener')
            document.addEventListener('mouseover', window._my_extension_memory.listeners.mouseover, false)
            window._my_extension_memory.bound.mouseover = true
        }
        if (!window._my_extension_memory.bound.click) {
            console.log('attached click listener')
            document.addEventListener('click', window._my_extension_memory.listeners.click, false)
            window._my_extension_memory.bound.click = true
        }
        if (!window._my_extension_memory.bound.keypress) {
            console.log('attached keypress listener')
            document.addEventListener('keypress', window._my_extension_memory.listeners.keypress, false)
            window._my_extension_memory.bound.keypress = true
        }
    })