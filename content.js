const server = 'http://127.0.0.1:5000/';
var currentLocation = window.location.href;
fetch(server, {
    method: 'POST',
    headers: {
        "Access-Control-Allow-Origin": "*",
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 'url': currentLocation })
})
// fetch(server, {
//     method: 'POST',
//     mode:'no-cors',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ 'tokens': currentLocation })
// })
.then((resp) => resp.json())
.then(function(data) {
    print(data)
})
.catch(function (error) {
    alert('POST ERRR: ' + error);
});

// const [currentTab] = await browser.tabs.query({
//     active: true,
//     currentWindow: true,
// });
// alert(currentTab.url)
// console.log({ id: currentTab.id, url: currentTab.url });