// import {timeFlyer}  from "./time_flyer";

chrome.tabs.onActivated.addListener(tab => {
    console.log(tab)
    chrome.tabs.get(tab.tabId, current_tab_info => {
        console.log(current_tab_info.url)
        // chrome.tabs.executeScript(null, {file: './time_flyer.js'}, () => console.log('injected'))
        chrome.tabs.executeScript(null, {file: './block_segment.js'}, (result) => console.log('result', result))
        // chrome.tabs.executeScript(null, {code: timeFlyer.getString(100000)}, () => console.log('injected'))
    })
})
//