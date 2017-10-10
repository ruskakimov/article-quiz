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
    const classNames = {
        highlightedSelection: 'my-extension-outline',
        selectionMessage: 'my-extension-message',
        answerPanel: 'my-extension-panel',
        answerOptionButton: 'my-extension-option-button',
        optionClasses: {
            the: 'my-extension-option-the',
            a: 'my-extension-option-a',
            an: 'my-extension-option-an'
        },
        articleField: 'my-extension-field',
        articleFieldFocused: 'my-extension-field-focused',
        exitButton: 'my-extension-exit-btn'
    }
    const articleRegexes = {
        the: /(^|\s)(The )|( the )/g,
        a: /(^|\s)(A )|( a )/g,
        an: /(^|\s)(An )|( an )/g
    }
    var selection = {}
    var interface = {}
    var currentField = null

    function initInterface() {
        // selection message
        var msg = makeElement('div', 'Select element', [classNames.selectionMessage])
        interface.selectionMessage = {
            el: msg,
            present: false
        }
        // answer options panel
        var answerPanel = makeElement('div', null, [classNames.answerPanel])
        var btn_the = makeElement('button', 'the', [classNames.answerOptionButton, classNames.optionClasses.the])
        var btn_a   = makeElement('button', 'a',   [classNames.answerOptionButton, classNames.optionClasses.a])
        var btn_an  = makeElement('button', 'an',  [classNames.answerOptionButton, classNames.optionClasses.an])
        btn_the.addEventListener('click', makeAnswerHandler('the'))
        btn_a.addEventListener('click', makeAnswerHandler('a'))
        btn_an.addEventListener('click', makeAnswerHandler('an'))
        answerPanel.appendChild(btn_the)
        answerPanel.appendChild(btn_a)
        answerPanel.appendChild(btn_an)
        interface.answerPanel = {
            el: answerPanel,
            present: false,
            children: [
                btn_the,
                btn_a,
                btn_an
            ]
        }
        // exit button
        var exitButton = makeElement('button', 'Exit article quiz', [classNames.exitButton])
        interface.exitButton = {
            el: exitButton,
            present: false
        }
        exitButton.addEventListener('click', exitWithoutATrace)
    }

    function removeInterface() {
        Object.keys(interface).forEach(key => {
            setInterfaceElementPresence(interface[key], false)
        })
    }

    function setInterfaceElementPresence(interfaceObj, present) {
        if (interfaceObj.present !== present) {
            if (interfaceObj.present) {
                interfaceObj.el.parentElement.removeChild(interfaceObj.el)
            }
            else {
                document.body.appendChild(interfaceObj.el)
            }
            interfaceObj.present = present
        }
    }

    function selectNextField() {
        if (currentField) {
            currentField.innerText = currentField.dataset.original
            currentField.classList.remove(classNames.articleField)
            currentField.classList.remove(classNames.articleFieldFocused)
        }
        currentField = document.querySelector('.' + classNames.articleField)
        if (currentField) currentField.classList.add(classNames.articleFieldFocused)
        else endQuiz()
    }

    function makeAnswerHandler(chosenArticle) {
        return function(e) {
            console.log(chosenArticle)
            selectNextField()
        }
    }

    function endQuiz() {
        setInterfaceElementPresence(interface.answerPanel, false)
    }

    /**
     * @param {string} article 
     */
    function makeFieldHTML(article) {
        return `<span class="${classNames.articleField}" data-truth="${article}" data-original="$&"> _ </span>`
    }
    
    function insertFields(element) {
        if (element.tagName === "P") {
            var modif = element.innerText
            modif = modif.replace(articleRegexes.the, makeFieldHTML('the'))
            modif = modif.replace(articleRegexes.a, makeFieldHTML('a'))
            modif = modif.replace(articleRegexes.an, makeFieldHTML('an'))
            element.innerHTML = modif
        }
        else if (element.children) {
            Array.prototype.forEach.call(element.children, child => insertFields(child))
        }
    }

    function handleSelection(selectedElement) {
        highlightTarget(null)
        document.removeEventListener('mouseover', documentMouseoverHandler)
        removeInterface() // to get original innerHTML (if selection is document.body)
        selection.el = selectedElement
        selection.innerHTML_backup = selectedElement.innerHTML
        insertFields(selectedElement)
        selectNextField()
        setInterfaceElementPresence(interface.answerPanel, true)
        setInterfaceElementPresence(interface.exitButton, true)
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
        if (Object.keys(interface).every(key => interface[key].el !== e.target)) {
            highlightTarget(e.target)
        }
    }

    function documentClickHandler(e) {
        if (Object.keys(interface).every(key => interface[key].el !== e.target)) {
            handleSelection(e.target)
            document.removeEventListener('click', documentClickHandler)
        }
    }

    function start() {
        console.log('started app')
        // set up interface
        initInterface()
        setInterfaceElementPresence(interface.selectionMessage, true)
        setInterfaceElementPresence(interface.exitButton, true)
        // add listeners
        document.addEventListener('mouseover', documentMouseoverHandler)
        document.addEventListener('click', documentClickHandler)
        // notify background script
        chrome.runtime.sendMessage({opened: true})
    }

    function exitWithoutATrace() {
        console.log('reverting DOM modifications & removing listeners')
        // revert DOM
        highlightTarget(null)
        removeInterface()
        if (selection.el) selection.el.innerHTML = selection.innerHTML_backup
        // remove listeners
        document.removeEventListener('mouseover', documentMouseoverHandler)
        document.removeEventListener('click', documentClickHandler)
        chrome.runtime.onMessage.removeListener(messageHandler)
        // notify background script
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