(function() { // scoping function start

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
        button: '_article_quiz__button',
        answerPanel: '_article_quiz__answer-panel',
        answerOptionButton: '_article_quiz__option-button',
        answerOptionButtonPressed: '_article_quiz__option-button-pressed',
        answerOptionButtonTrue: '_article_quiz__option-button-true',
        answerOptionButtonFalse: '_article_quiz__option-button-false',
        optionClasses: {
            the: '_article_quiz__option-the',
            a: '_article_quiz__option-a',
            an: '_article_quiz__option-an'
        },
        articleField: '_article_quiz__field',
        articleFieldFocused: '_article_quiz__field-focused',
        articleFieldEmpty: '_article_quiz__field-unvisited',
        articleFieldRight: '_article_quiz__field-right',
        articleFieldWrong: '_article_quiz__field-wrong',
        exitButton: '_article_quiz__exit-btn',
        grade: '_article_quiz__grade'
    }
    const articleRegexes = {
        the: /(^|\s)(The )|( the )/g,
        a: /(^|\s)(A )|( a )/g,
        an: /(^|\s)(An )|( an )/g
    }
    const articles = ['the', 'a', 'an']
    var interface = {}
    var currentField = null
    var answerMatrix = articles.map(_ => [0, 0, 0])

    /*
        INTERFACE
    */
    function initInterface() {
        // answer options panel
        var answerPanel = makeElement('div', null, [classNames.answerPanel])
        const answerButtons = articles.reduce((obj, article) => {
            obj[article] = makeElement('button', article, [
                classNames.button,
                classNames.answerOptionButton,
                classNames.optionClasses[article]
            ])
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
        var exitButton = makeElement('button', 'X', [
            classNames.button,
            classNames.exitButton,
            classNames.answerOptionButton
        ])
        interface.exitButton = {
            el: exitButton,
            present: false
        }
        exitButton.addEventListener('click', exitWithoutATrace)
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

    function removeInterface() {
        Object.keys(interface).forEach(key => {
            setInterfaceElementPresence(interface[key], false)
        })
    }

    function removeFields() {
        document.querySelectorAll('.' + classNames.articleField).forEach(field => {
            var content = document.createTextNode(field.dataset.original)
            field.parentElement.insertBefore(content, field)
            field.parentElement.removeChild(field)
        })
    }

    function resetAnswerButtonsStyle() {
        articles.forEach(article => {
            interface.answerPanel.answerButtons[article].classList.remove(classNames.answerOptionButtonFalse)
        })
    }

    function showGrade(grade) {
        var gradeEl = makeElement('div', grade, [classNames.grade])
        interface.grade = {
            el: gradeEl,
            present: true
        }
        document.body.appendChild(gradeEl)
    }


    /*
        USER INTERACTION LOGIC
    */
    function handleAnswer(chosenArticle) {
        if (!currentField) return

        var correctArticle = currentField.dataset.truth
        var isFirstAttempt = !currentField.classList.contains(classNames.articleFieldWrong)
        var isFirstPressOfThisOption = !interface.answerPanel.answerButtons[chosenArticle].classList.contains(classNames.answerOptionButtonFalse)

        function recordAnswer() {
            var i = articles.indexOf(correctArticle)
            var j = articles.indexOf(chosenArticle)
            answerMatrix[i][j]++
        }
        // visually press the button
        interface.answerPanel.answerButtons[chosenArticle].classList.add(classNames.answerOptionButtonPressed)
        
        if (chosenArticle === correctArticle) {
            // correct answer
            if (isFirstAttempt) {
                currentField.classList.add(classNames.articleFieldRight)
                recordAnswer()
            }
            resetAnswerButtonsStyle()
            interface.answerPanel.answerButtons[chosenArticle].classList.add(classNames.answerOptionButtonTrue)
            selectNextField()
        }
        else {
            // wrong answer
            if (isFirstPressOfThisOption) {
                currentField.classList.add(classNames.articleFieldWrong)
                recordAnswer()
            }
            interface.answerPanel.answerButtons[chosenArticle].classList.add(classNames.answerOptionButtonFalse)
        }
    }


    /*
        INSERTING QUIZ FIELDS
    */
    function replaceArticles(text) {
        function makeFieldHTML(article) {
            return `<span class="${classNames.articleField} ${classNames.articleFieldEmpty}" data-truth="${article}" data-original="$&"> _ </span>`
        }
        text = text.replace(articleRegexes.the, makeFieldHTML('the'))
        text = text.replace(articleRegexes.a, makeFieldHTML('a'))
        text = text.replace(articleRegexes.an, makeFieldHTML('an'))
        return text
    }
    
    function insertFields(node) {
        if (node.nodeName === '#comment' ||
            node.nodeName === 'SCRIPT' ||
            node.nodeName === 'STYLE')
        {
            return
        }
        if (node.nodeType === 1 && node.tagName !== 'BODY' && node.offsetParent === null) { // invisible element
            return
        }
        if (node.nodeName === "#text") {
            var withFields = replaceArticles(node.textContent)
            if (withFields !== node.textContent) {
                var replacement = document.createElement('span')
                replacement.innerHTML = withFields
                node.parentNode.insertBefore(replacement, node)
                node.parentNode.removeChild(node)
            }
        }
        else if (node.children) {
            Array.prototype.forEach.call(node.childNodes, node => insertFields(node))
        }
    }

    
    /*
        APP FLOW OPERATIONS
    */
    function setupQuiz() {
        insertFields(document.body)
        setInterfaceElementPresence(interface.answerPanel, true)
        setInterfaceElementPresence(interface.exitButton, true)
        selectNextField()
    }

    function selectNextField() {
        if (currentField) {
            currentField.innerText = currentField.dataset.original
            currentField.classList.remove(classNames.articleFieldEmpty)
            currentField.classList.remove(classNames.articleFieldFocused)
        }
        currentField = document.querySelector('.' + classNames.articleFieldEmpty)
        if (currentField) {
            currentField.classList.add(classNames.articleFieldFocused)
            currentField.scrollIntoViewIfNeeded()
        }
        else endQuiz()
    }

    function endQuiz() {
        function calculateScore() {
            var correct = articles.reduce((acc, _, i) => acc + answerMatrix[i][i], 0)
            // total number of attempts
            var total = answerMatrix.reduce((acc, row) => {
                return acc + row.reduce((acc, val) => acc + val, 0)
            }, 0)
            return correct / total
        }
        function determineGrade(score) {
            var scores    = 'A+  A  A- B+ B  B- C+ C  C- D+ D  D- F'.split(/ +/)
            var lowerLims = '100 93 90 87 83 80 77 73 70 67 63 60 0'.split(/ +/).map(strPerc => +strPerc / 100)
            for (var i = 0; i < scores.length; i++) {
                if (score >= lowerLims[i]) return scores[i]
            }
        }
        setInterfaceElementPresence(interface.answerPanel, false)
        console.log(answerMatrix)
        var score = calculateScore()
        if (isNaN(score)) {
            alert('No articles found on the page.')
            exitWithoutATrace()
            return
        }
        var grade = determineGrade(score)
        showGrade(grade)
    }

    function exitWithoutATrace() {
        removeInterface()
        removeFields()
        document.removeEventListener('keypress', documentKeypressHandler)
        chrome.runtime.onMessage.removeListener(messageHandler)
        chrome.runtime.sendMessage({closed: true})
    }


    /*
        DOCUMENT EVENT HANDLERS
    */
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

    return {
        // public API
        start:  function() {
            chrome.runtime.sendMessage({opened: true})
            initInterface()
            setupQuiz()
            document.addEventListener('keypress', documentKeypressHandler)
        },
        exitWithoutATrace
    }
}()

function messageHandler(request, sender, sendResponse) {
    if (request.exit === true) {
        APP.exitWithoutATrace()
    }
}

function DOMisReady() {
    return new Promise(function (resolve) {
        if (document.readyState === 'interactive' || document.readyState === 'complete') resolve()
        else {
            document.addEventListener('DOMContentLoaded', function listenerWithSelfDestruct(e) {
                resolve()
                document.removeEventListener('DOMContentLoaded', listenerWithSelfDestruct)
            })
        }
    })
}

chrome.runtime.onMessage.addListener(messageHandler)

DOMisReady().then(function() {
    APP.start()
})

})() // scoping function end