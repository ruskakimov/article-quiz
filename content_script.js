if (!window._my_extension_memory) {
    var makeApplyClassToCurrentTarget = function(className) {
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


    var clickHandler = function(e) {
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

        window._my_extension_memory.current_el = document.querySelector('.my-extension-field')
        window._my_extension_memory.current_el.classList.add('my-extension-field-focused')
    }

    var keypressHandler = function(e) {
        var end = function() {
            console.log('the end')
            document.removeEventListener('keypress', window._my_extension_memory.listeners.mouseover, false)
            window._my_extension_memory.state.keypressListener = false
        }

        var check = function(answer) {
            var el = window._my_extension_memory.current_el
            if (!el) {
                end()
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
            var next = document.querySelector('.my-extension-field')
            if (next) next.classList.add('my-extension-field-focused')
            else end()
            window._my_extension_memory.current_el = next
        }
        switch (e.code) {
            case 'KeyZ':
                check('the')
                break;
            case 'KeyX':
                check('a')
                break;
            case 'KeyC':
                check('an')
                break;
        }
    }
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
            var msg = document.createElement('div')
            var content = document.createTextNode('Select element')
            msg.appendChild(content)
            msg.classList.add('my-extension-message')
            document.body.appendChild(msg)
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