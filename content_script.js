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
        document.removeEventListener('click', window._my_extension_memory.listeners.click, false)
        window._my_extension_memory.state.mouseoverListener = false
        window._my_extension_memory.state.clickListener = false
        document.querySelector('.my-extension-message').style.display = 'none'

        var theReg = /(The | the )/g
        var aReg = /(A | a )/g
        var anReg = /(An | an )/g
        var modif = e.target.innerHTML
        modif = modif.replace(theReg, '<span class="my-extension-yellow" data-truth="the" data-original="$&"> _ </span>')
        modif = modif.replace(aReg, '<span class="my-extension-yellow" data-truth="a" data-original="$&"> _ </span>')
        modif = modif.replace(anReg, '<span class="my-extension-yellow" data-truth="an" data-original="$&"> _ </span>')
        e.target.innerHTML = modif
    }

    var keypressHandler = function(e) {
        switch (e.code) {
            case 'KeyZ':
                var el = document.querySelector('.my-extension-yellow')
                el.classList.remove('my-extension-yellow')
                el.innerText = el.dataset.original
                break;
            case 'KeyX':
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
            document.addEventListener('mouseover', applyOutlineToCurrentTarget, false)
            document.addEventListener('click', clickHandler, false)
            document.addEventListener('keypress', keypressHandler, true)
            window._my_extension_memory = {}
            window._my_extension_memory.state = {
                mouseoverListener: true,
                clickListener: true,
                keypressListener: true
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
                document.addEventListener('keypress', window._my_extension_memory.listeners.keypress, true)
                window._my_extension_memory.state.keypressListener = true
            }
        }
    })