// const server = 'http://127.0.0.1:5000/';
// import * as tf from '@tensorflow/tfjs';

const descriptions = {
    'Sneaking': 'Coerces users to act in ways that they would not normally act by obscuring information.',
    'Urgency': 'Places deadlines on things to make them appear more desirable',
    'Misdirection': 'Aims to deceptively incline a user towards one choice over the other.',
    'Social Proof': 'Gives the perception that a given action or product has been approved by other people.',
    'Scarcity': 'Tries to increase the value of something by making it appear to be limited in availability.',
    'Obstruction': 'Tries to make an action more difficult so that a user is less likely to do that action.',
    'Forced Action': 'Forces a user to complete extra, unrelated tasks to do something that should be simple.',
    'Fake Low Stock': 'This stock message was created using random function',
    'Fake Countdown Timer': 'This Countdown Timer was created using random function'
};

const THIRD_PARTY_LIB = {
    "Fomo": "fomo.com",
    "Beeketing": "beeketing.com",
    "Recently": "appifiny.io",
    "Fera": "fera.ai",
    "Vitals": "getvitals.io",
    "Nice (Shopify plugin)": "goldendev.win",
    "LeanConvert": "lc-api.net",
    "Taggstar": "taggstar.com",
    "Insider": "useinsider.com",
    "FreshRelevance": "dn1i8v75r669j.cloudfront.net",
    "Qubit": "goqubit.com",
    "Bunting": "bunting.com",
    "ConvertCart": "convertcart.com",
    "Proof": "useproof.com",
    "Convertize": "convertize.io",
    "Credibly": "credibly.io",
    "DynamicYield": "dynamicyield.com",
    "Bizzy": "pxu-recent-sales-apps.s3.amazonaws.com",
    "Exponea": "exponea.com",
    "Yieldify": "yieldify.com",
    "Amasty (Magento plugin)": "amwhatsup/block/getlastactivity",
    "Boost (Wordpress plugin)": "plugins/boost/public/js/boost",
    "Woocommerce Notification (Woocommerce plugin)": "plugins/woocommerce-notification",
}


function check_timer_exist(sentence) {
    sentence = sentence.toLowerCase();
    return /\d/.test(sentence);
}

function social_proof_watching(sentence) {
    sentence = sentence.toLowerCase();
    var social_proof_watching = false;
    if ((sentence.includes('watching') || (sentence.includes('looking')) || (sentence.includes('viewing')))) {
        social_proof_watching = true;
        console.log('social_proof_watching', social_proof_watching);
    }
    return social_proof_watching;
}

function extract_name_and_loc(sentence) {
    sentence = sentence.toLowerCase();
    console.log('all sentence', sentence)
    var split_key = "";
    var name_and_loc = "";
    var name = "";
    var loc = "";

    if (sentence.includes('purchased')) {
        split_key = 'purchased';
    } else if (sentence.includes('bought')) {
        split_key = 'bought';
    } else if (sentence.includes('ordered')) {
        split_key = 'ordered';
    } else if (sentence.includes('added to cart')) {
        split_key = 'added to cart'
    }
    if (split_key !== ""){
        console.log('sentence ne', sentence);
        console.log('split key ne', split_key);
        name_and_loc = sentence.split(split_key)[0];
        name_and_loc = name_and_loc.trim()
        if (name_and_loc.includes(" in ")) {
            name = name_and_loc.split(" in ")[0];
            loc = name_and_loc.split(" in ")[1];
        } else if (name_and_loc.includes(" from ")) {
            name = name_and_loc.split(" from ")[0];
            loc = name_and_loc.split(" from ")[1];
        } else {
            name = name_and_loc;
            loc = "";
        }
    }
    return name + ' -- ' + loc
}


function detect_low_stock(sentence){
    sentence = sentence.toLowerCase();
    if (/[0-9]+ left/i.test(sentence) || /only [0-9]+/i.test(sentence)) {
        return true;
    }
    return false;
}

function collect_class_and_id_all_children(element){
    var class_and_id_list = [];
    var children_list = element.children

    if (element.className !== ''){
        class_and_id_list.push(element.className)
    }
    if (element.id !== ''){
        class_and_id_list.push(element.id)
    }

    for (var c = 0; c < children_list.length; c++) {
        class_and_id_list.push(...collect_class_and_id_all_children(children_list[c]))
    }
    return class_and_id_list
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
var elements;

async function scrape_tensorflow(script_inner_content, script_url) {
    let i;
    let count = 0;
    let old_count = 0;
    elements = segments(document.body);
    var previous_text_element = '';
    for (i = 0; i < elements.length; i++) {
        if (elements[i].innerText.trim().length === 0) {
            continue;
        }
        var text_element = elements[i].innerText.trim().replace(/\t/g, ' ');
        text_element = text_element.replace(/\n/g, ' ');
        chrome.runtime.sendMessage({
            message: 'classify_element',
            data: text_element,
            index: i,
        });


    }
}

async function scrape(script_inner_content, script_url) {
    let i;
    let count = 0;
    let old_count = 0;

    // aggregate all DOM elements on the page
    var elements = segments(document.body);
    // var array = [];
    var previous_text_element = '';
    for (i = 0; i < elements.length; i++) {
        if (elements[i].innerText.trim().length === 0) {
            continue;
        }
        // elements[i].classList.add('notransition');
        // elements[i].style.display = 'block';
        // first element
            // var previous_text_element =  elements[i].innerText.trim().replace(/\t/g, ' ');
        var text_element = elements[i].innerText.trim().replace(/\t/g, ' ');
        text_element = text_element.replace(/\n/g, ' ');
            // array.push(text_element);
        var name_and_loc = extract_name_and_loc(text_element)
        var is_social_proof_watching = social_proof_watching(text_element)
        var is_low_stock = detect_low_stock(text_element)
        var is_timer = check_timer_exist(text_element)
        if (is_timer) {
        }

        if (name_and_loc === ' -- '){
            name_and_loc = extract_name_and_loc(previous_text_element + ' ' + text_element)
        }
        if (name_and_loc !== ' -- ' || is_social_proof_watching !== false || is_low_stock !== false || is_timer !== false) {
            // get all class and id of element to check for the random function
            var class_and_id_list = collect_class_and_id_all_children(elements[i])
            var name = name_and_loc.split(" -- ")[0];
            var loc = name_and_loc.split(" -- ")[1];

            // check social proof in the js file
            for (var j = 0; j < script_inner_content.length; j++) {
                var script_content = script_inner_content[j].toLowerCase();
                if ((name !== "" && script_content.includes(name)) || (loc !== "" && script_content.includes(loc))) {
                    count++;
                    highlight(elements[i], 'Social Proof');
                    break;
                    // If they use some random function
                }
                else if (script_content.includes("random")){
                    const found = class_and_id_list.find(element => script_content.includes(element));

                    if (is_social_proof_watching && found) {
                        count++;
                        highlight(elements[i], 'Social Proof');
                        break;
                    } else if (is_low_stock && found) {
                        // not found the social proof anywhere, check for the fake low stock
                        count++;
                        highlight(elements[i], 'Fake Low Stock');
                        break;
                    }

                }
            }

            if (old_count === count){
                for (var k = 0; k < script_url.length; k++){
                    const third_party_key = Object.keys(THIRD_PARTY_LIB).find(key => script_url[k].includes(THIRD_PARTY_LIB[key]));
                    if (third_party_key !== undefined){
                        count++;
                        highlight(elements[i], 'Social Proof');
                        break;
                    }
                }
            }

            if (old_count === count){
                var text_element_after = elements[i].innerText.trim().replace(/\t/g, ' ');
                for (var h = 0; h < script_inner_content.length; h++) {
                    script_content = script_inner_content[h].toLowerCase();
                    if (script_content.includes("random")){
                        // find class that use the number function
                        const found = class_and_id_list.find(element => script_content.includes(element));
                        if (is_timer && found) {
                            count++;
                            highlight(elements[i], 'Fake Countdown Timer');
                            break;
                        }
                    }
                }

            }



            previous_text_element = '';
            old_count = count;
        } else {
            previous_text_element = text_element;
        }
    }
    var g = document.createElement('div');
    g.id = 'insite_count';
    g.value = count;
    g.style.opacity = 0;
    g.style.position = 'fixed';
    document.body.appendChild(g);
    sendDarkPatterns(g.value);
    // for (let j = 0; j < array.length; j++) {
    //     extract_name_and_loc(array[j]);
    // }
    // console.log('finishing segment', array)

    // // post to the web server
    // fetch(server, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ 'tokens': array })
    // })
    //     .then((resp) => resp.json()) // https://scotch.io/tutorials/how-to-use-the-javascript-fetch-api-to-get-data
    //     .then(function(data) {
    //         data = data.replace(/'/g, '"');
    //         json = JSON.parse(data);
    //         var count = 0;
    //         var index = 0;
    //
    //         for (var i = 0; i < elements.length; i++) {
    //             if (elements[i].innerText.trim().length == 0) {
    //                 continue;
    //             }
    //             if (json.result[index] != 'Not Dark') {
    //                 highlight(elements[i], json.result[index]);
    //                 count++;
    //             }
    //             index++;
    //         }
    //
    //         // store number of dark patterns
    //         var g = document.createElement('div');
    //         g.id = 'insite_count';
    //         g.value = count;
    //         g.style.opacity = 0;
    //         g.style.position = 'fixed';
    //         document.body.appendChild(g);
    //         sendDarkPatterns(g.value);
    //     })
    //     .catch(function (error) {
    //         alert('POST: ' + error);
    //     });
}

function highlight(element, type)
{
    element.style.border = "thick solid red";
    element.classList.add('insite-highlight');

    var body = document.createElement("span");
    body.classList.add('insite-highlight-body');

    /* header */
    var header = document.createElement("div");
    header.classList.add('modal-header');
    var headerText = document.createElement("h3");
    headerText.innerHTML = type + ' Pattern';
    header.appendChild(headerText);
    body.appendChild(header);

    /* content */
    var content = document.createElement('div');
    content.classList.add('modal-content');
    content.innerHTML = descriptions[type];
    body.appendChild(content);
    element.appendChild(body);
}

function sendDarkPatterns(number) {
    chrome.runtime.sendMessage({
        message: 'update_current_count',
        count: number
    });
}

// function wait(ms){
//     var start = new Date().getTime();
//     var end = start;
//     while(end < start + ms) {
//         end = new Date().getTime();
//     }
// }

// async function loadModel(){
//     this.model = await tf.loadModel('https://raw.githubusercontent.com/minhthai1995/StockBotTwitter/main/model.json');
// }

function getPosition(string, subString, index) {
    return string.split(subString, index).join(subString).length;
}

chrome.runtime.onMessage.addListener(
    async function(request, sender, sendResponse) {
        var scripts = document.getElementsByTagName("script");
        var script_inner_content = [];
        var script_url = [];
        for (var i = 0; i < scripts.length; i++) {
            if (scripts[i].src) {
                script_url.push(scripts[i].src)
            } else {
                script_inner_content.push(scripts[i].innerHTML)
            }
        }

        if (request.message === 'analyze_site') {
            await scrape_tensorflow(script_inner_content, script_url);
        }
        else if (request.message === 'popup_open') {
            var element = document.getElementById('insite_count');
            if (element) {
                sendDarkPatterns(element.value);
            }
            const position = getPosition(request.url, '/', 3)
            const webURL = request.url.substring(0,position)
            const pageURL = request.url.substring(position, request.url.length)

            chrome.runtime.sendMessage({
                message: 'update_url',
                webURL: webURL,
                pageURL: pageURL
            });

        } else if (request.message === 'update_dark_pattern') {
            var previous_text_element = '';
            let count = 0;
            let old_count = 0;

            if (request.sentence_encode === 'DARK') {
                // highlight(elements[request.index], 'Fake Countdown Timer');
                var text_element = request.sentence
                var name_and_loc = extract_name_and_loc(text_element)
                var is_social_proof_watching = social_proof_watching(text_element)
                var is_low_stock = detect_low_stock(text_element)
                var is_timer = check_timer_exist(text_element)
                if (is_timer) {
                }

                if (name_and_loc === ' -- '){
                    name_and_loc = extract_name_and_loc(previous_text_element + ' ' + text_element)
                }
                if (name_and_loc !== ' -- ' || is_social_proof_watching !== false || is_low_stock !== false || is_timer !== false) {
                    // get all class and id of element to check for the random function
                    var class_and_id_list = collect_class_and_id_all_children(elements[request.index])
                    var name = name_and_loc.split(" -- ")[0];
                    var loc = name_and_loc.split(" -- ")[1];

                    // check social proof in the js file
                    for (var j = 0; j < script_inner_content.length; j++) {
                        var script_content = script_inner_content[j].toLowerCase();
                        if ((name !== "" && script_content.includes(name)) || (loc !== "" && script_content.includes(loc))) {
                            count++;
                            highlight(elements[request.index], 'Social Proof');
                            break;
                            // If they use some random function
                        } else if (script_content.includes("random")) {
                            const found = class_and_id_list.find(element => script_content.includes(element));

                            if (is_social_proof_watching && found) {
                                count++;
                                highlight(elements[request.index], 'Social Proof');
                                break;
                            } else if (is_low_stock && found) {
                                // not found the social proof anywhere, check for the fake low stock
                                count++;
                                highlight(elements[request.index], 'Fake Low Stock');
                                break;
                            }

                        }
                    }

                    // not found in the js content, check 3rd party library
                    if (old_count === count) {
                        // check 3rd party
                        for (var k = 0; k < script_url.length; k++) {
                            const third_party_key = Object.keys(THIRD_PARTY_LIB).find(key => script_url[k].includes(THIRD_PARTY_LIB[key]));
                            if (third_party_key !== undefined) {
                                count++;
                                highlight(elements[request.index], 'Social Proof');
                                break;
                            }
                        }
                    }

                    // not found fake low stock and fake social proof, check for fake countdown timer
                    if (old_count === count) {

                        var text_element_after = elements[request.index].innerText.trim().replace(/\t/g, ' ');
                        for (var h = 0; h < script_inner_content.length; h++) {
                            script_content = script_inner_content[h].toLowerCase();
                            if (script_content.includes("random")) {
                                // find class that use the number function
                                const found = class_and_id_list.find(element => script_content.includes(element));
                                if (is_timer && found) {
                                    count++;
                                    highlight(elements[request.index], 'Fake Countdown Timer');
                                    break;
                                }
                            }
                        }

                    }
                }
                chrome.runtime.sendMessage({
                    message: 'update_dark_to_popup',
                    count: count
                });
            }
        }
    }
);