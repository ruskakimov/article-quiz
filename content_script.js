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
        answerOptionButtonPressed: 'my-extension-option-button-pressed',
        answerOptionButtonTrue: 'my-extension-option-button-true',
        answerOptionButtonFalse: 'my-extension-option-button-false',
        optionClasses: {
            the: 'my-extension-option-the',
            a: 'my-extension-option-a',
            an: 'my-extension-option-an'
        },
        articleField: 'my-extension-field',
        articleFieldFocused: 'my-extension-field-focused',
        rightAnswer: 'my-extension-true',
        wrongAnswer: 'my-extension-false',
        exitButton: 'my-extension-exit-btn'
    }
    const articleRegexes = {
        the: /(^|\s)(The )|( the )/g,
        a: /(^|\s)(A )|( a )/g,
        an: /(^|\s)(An )|( an )/g
    }
    const articles = ['the', 'a', 'an']
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
        const answerButtons = articles.reduce((obj, article) => {
            obj[article] = makeElement('button', article, [classNames.answerOptionButton, classNames.optionClasses[article]])
            return obj
        }, {})
        articles.forEach(article => {
            answerButtons[article].addEventListener('click', e => handleAnswer(article))
            answerButtons[article].addEventListener('transitionend', e => {
                e.target.classList.remove(classNames.answerOptionButtonPressed)
                e.target.classList.remove(classNames.answerOptionButtonTrue)
            })
            answerPanel.appendChild(answerButtons[article])
        })
        interface.answerPanel = {
            el: answerPanel,
            present: false,
            answerButtons: answerButtons
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

    function resetAnswerButtonsStyle() {
        articles.forEach(article => {
            interface.answerPanel.answerButtons[article].classList.remove(classNames.answerOptionButtonFalse)
        })
    }

    function handleAnswer(chosenArticle) {
        if (!currentField) return
        if (chosenArticle === currentField.dataset.truth) {
            if (!currentField.classList.contains(classNames.wrongAnswer)) {
                currentField.classList.add(classNames.rightAnswer)
            }
            resetAnswerButtonsStyle()
            interface.answerPanel.answerButtons[chosenArticle].classList.add(classNames.answerOptionButtonTrue)
            selectNextField()
        }
        else {
            currentField.classList.add(classNames.wrongAnswer)
            interface.answerPanel.answerButtons[chosenArticle].classList.add(classNames.answerOptionButtonFalse)
        }
        interface.answerPanel.answerButtons[chosenArticle].classList.add(classNames.answerOptionButtonPressed)
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

    function documentKeypressHandler(e) {
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

    function start() {
        console.log('started app')
        // set up interface
        initInterface()
        setInterfaceElementPresence(interface.selectionMessage, true)
        setInterfaceElementPresence(interface.exitButton, true)
        // add listeners
        document.addEventListener('mouseover', documentMouseoverHandler)
        document.addEventListener('click', documentClickHandler)
        document.addEventListener('keypress', documentKeypressHandler)
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
        document.removeEventListener('keypress', documentKeypressHandler)
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