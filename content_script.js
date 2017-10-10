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
        highlightedSelection: 'my-extension-outline',
        selectionMessage: 'my-extension-message',
        answerPanel: 'my-extension-panel',
        answerOptionButton: 'my-extension-option-button',
        optionClasses: {
            the: 'my-extension-option-the',
            a: 'my-extension-option-a',
            an: 'my-extension-option-an'
        }
    }
    var interface = {}

    function insertInterface() {
        // selection message
        var msg = makeElement('div', 'Select element', [classNames.selectionMessage])
        document.body.appendChild(msg)
        interface.selectionMessage = {
            domEl: msg,
            visible: true
        }
        // answer options panel
        var answerPanel = makeElement('div', null, [classNames.answerPanel])
        var btn_the = makeElement('button', 'the', [classNames.answerOptionButton, classNames.optionClasses.the])
        var btn_a   = makeElement('button', 'a',   [classNames.answerOptionButton, classNames.optionClasses.a])
        var btn_an  = makeElement('button', 'an',  [classNames.answerOptionButton, classNames.optionClasses.an])
        answerPanel.appendChild(btn_the)
        answerPanel.appendChild(btn_a)
        answerPanel.appendChild(btn_an)
        document.body.appendChild(answerPanel)
        interface.answerPanel = {
            domEl: answerPanel,
            visible: true,
            children: [
                btn_the,
                btn_a,
                btn_an
            ]
        }
    }

    function removeInterface() {
        Object.keys(interface).forEach(key => {
            interface[key].domEl.parentElement.removeChild(interface[key].domEl)
        })
        interface = {}
    }

    function setInterfaceVisibility(interfaceObj, newState) {
        if (interfaceObj.visible !== newState) {
            if (interfaceObj.visible) {
                interfaceObj.domEl.style.visibility = 'hidden'
            }
            else {
                interfaceObj.domEl.style.visibility = 'visible'
            }
            interfaceObj.visible = newState
        }
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
        setInterfaceVisibility(interface.selectionMessage, false)
        setInterfaceVisibility(interface.answerPanel, true)
    }

    function start() {
        console.log('started app')
        insertInterface()
        setInterfaceVisibility(interface.answerPanel, false)
        document.addEventListener('mouseover', documentMouseoverHandler)
        document.addEventListener('click', documentClickHandler)
        chrome.runtime.sendMessage({opened: true})
    }

    function exitWithoutATrace() {
        console.log('reverting DOM modifications & removing listeners')
        highlightTarget(null)
        document.removeEventListener('mouseover', documentMouseoverHandler)
        document.removeEventListener('click', documentClickHandler)
        chrome.runtime.onMessage.removeListener(messageHandler)
        removeInterface()
        chrome.runtime.sendMessage({closed: true})
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