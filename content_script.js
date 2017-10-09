(function() { // scoping function start
console.log('script inserted')

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
        console.log(e)
        highlightTarget(e.target)
    }

    function documentClickHandler(e) {
        console.log(e)
        highlightTarget(null)
    }

    return {
        // public attrs
        start: function() {
            console.log('started app')
            document.addEventListener('mouseover', documentMouseoverHandler)
            document.addEventListener('click', documentClickHandler)
        },
        exitWithoutATrace: function() {
            console.log('removing inserted elements / listeners')
            highlightTarget(null)
            document.removeEventListener('mouseover', documentMouseoverHandler)
            document.removeEventListener('click', documentClickHandler)
            chrome.runtime.onMessage.removeListener(messageHandler)
        }
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