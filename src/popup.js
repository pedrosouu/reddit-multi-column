let intervalId;

chrome.storage.sync.get().then(function(result) {
    for (const key in result) {
        const el = document.getElementById(key);
        if (el?.type === 'checkbox') el.checked = result[key];
        else if (el) el.value = result[key];
    }
});

function savePreference(target) {
    chrome.storage.sync.set({
        [target.id]: target.type === 'checkbox' ? target.checked : target.value
    });
}

document.addEventListener('change', function(e) {
    savePreference(e.target);
});

document.addEventListener('mousedown', function(e) {
    if(e.target.classList[0] === 'numInputBtn') {
        const input = e.target.closest('label').children[1];
        if (e.target.classList[1] === 'plus') {
            input.stepUp();
            intervalId = setTimeout(function() {
                intervalId = setInterval(function() {
                   input.stepUp();
                }, 35);
            }, 150);
        } else {
            input.stepDown();
            intervalId = setTimeout(function() {
                intervalId = setInterval(function() {
                    input.stepDown();
                }, 35);
            }, 150);
        }
    }
});

document.addEventListener('mouseup', function(e) {
    clearInterval(intervalId);
    if (e.target.classList[0] === 'numInputBtn') {
        savePreference(e.target.closest('label').children[1]);
    }
});