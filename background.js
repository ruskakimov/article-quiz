var bgAPP = function() {
  var extensionActive = {}

  return {
    clickHandler: function(tab) {
      console.log(extensionActive)
      if (extensionActive[tab.id]) {
        console.log('exit')
        chrome.tabs.sendMessage(tab.id, {exit: true})
      }
      else {
        console.log('start')
        if (extensionActive[tab.id] === 'undefined') {
          extensionActive[tab.id] = false
        }
        chrome.tabs.insertCSS(tab.id, {file: "style.css"})
        chrome.tabs.executeScript(tab.id, {file: "content_script.js"})
      }
      extensionActive[tab.id] = !extensionActive[tab.id]
    },
    reloadHandler: function(tabId) {
      console.log('reload', tabId)
      extensionActive[tabId] = false
    }
  }
}()


chrome.browserAction.onClicked.addListener(bgAPP.clickHandler)
chrome.tabs.onUpdated.addListener(bgAPP.reloadHandler)