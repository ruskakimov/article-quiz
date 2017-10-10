var bgAPP = function() {
  var extensionActive = {}

  return {
    clickHandler: function(tab) {
      if (extensionActive[tab.id]) {
        chrome.tabs.sendMessage(tab.id, {exit: true})
      }
      else {
        if (extensionActive[tab.id] === 'undefined') {
          extensionActive[tab.id] = false
        }
        chrome.tabs.insertCSS(tab.id, {file: "style.css"})
        chrome.tabs.executeScript(tab.id, {file: "content_script.js"})
      }
    },
    reloadHandler: function(tabId) {
      extensionActive[tabId] = false
    },
    messageHandler: function(request, sender, sendResponse) {
      if (request.opened === true) {
        extensionActive[sender.tab.id] = true
      }
      else if (request.closed === true) {
        extensionActive[sender.tab.id] = false
      }
    }
  }
}()


chrome.browserAction.onClicked.addListener(bgAPP.clickHandler)
chrome.tabs.onUpdated.addListener(bgAPP.reloadHandler)
chrome.runtime.onMessage.addListener(bgAPP.messageHandler)