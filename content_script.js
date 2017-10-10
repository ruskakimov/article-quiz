(function() { // scoping function start
console.log('script inserted')

/**
 * Create DOM element from the passed parameters
 * @param {string} tagName 
 * @param {string} text 
 * @param {string[]} classNames 
 */
function makeElement(tagName, text, classNames) {
    var el = document.createElement(tagName)
    if (text) {
        var content = document.createTextNode(text)
        el.appendChild(content)
    }
    if (classNames) classNames.forEach(name => el.classList.add(name))
    return el
}

var APP = function() {
    // private attrs
    var classNames = {
        highlightedSelection: 'my-extension-outline'
    }

    var highlightTarget = function() {
        var className = classNames.highlightedSelection
        var lastEl = null
        return function(targetEl) {
            if (lastEl) lastEl.classList.remove(className)
            if (targetEl) targetEl.classList.add(className)
            lastEl = targetEl
        }
    }()

    function documentMouseoverHandler(e) {
        highlightTarget(e.target)
    }

    function documentClickHandler(e) {
        highlightTarget(null)
        document.removeEventListener('mouseover', documentMouseoverHandler)
        exitWithoutATrace()
    }

    function start() {
        console.log('started app')
        document.addEventListener('mouseover', documentMouseoverHandler)
        document.addEventListener('click', documentClickHandler)
        chrome.runtime.sendMessage({opened: true})
    }

    function exitWithoutATrace() {
        console.log('reverting DOM modifications & removing listeners')
        highlightTarget(null)
        document.removeEventListener('mouseover', documentMouseoverHandler)
        document.removeEventListener('click', documentClickHandler)
        chrome.runtime.sendMessage({closed: true})
        chrome.runtime.onMessage.removeListener(messageHandler)
    }

    return {
        // public attrs
        start, exitWithoutATrace
    }
}()

function messageHandler(request, sender, sendResponse) {
    if (request.exit === true) {
        APP.exitWithoutATrace()
    }
}

function DOMisReady() {
    return new Promise(function (resolve) {
        if (document.readyState === 'complete') resolve()
        else document.addEventListener('DOMContentLoaded', function listenerWithSelfDestruct() {
            resolve()
            document.removeEventListener('DOMContentLoaded', listenerWithSelfDestruct)
        })
    })
}

chrome.runtime.onMessage.addListener(messageHandler)

DOMisReady().then(function() {
    APP.start()
})

})() // scoping function end