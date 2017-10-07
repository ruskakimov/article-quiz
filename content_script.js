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
        console.log('removed')
        window._my_extension_memory.state.mouseoverListener = false
        window._my_extension_memory.state.clickListener = false

        var re = /(The | the | a | an )/g
        e.target.innerHTML = e.target.innerHTML.replace(re, '<span class="my-extension-yellow" data-truth="$&"> _ </span>')
    }

    var keypressHandler = function(e) {
        if (e.code = 'Space') {
            e.preventDefault()
            var el = document.querySelector('.my-extension-yellow')
            if (el) {
                el.classList.remove('my-extension-yellow')
                el.innerText = el.dataset.truth
            }
            else {
                console.log('the end')
            }
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
        }
        else {
            console.log(window._my_extension_memory)
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