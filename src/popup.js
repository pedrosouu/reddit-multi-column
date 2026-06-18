let intervalId;

chrome.storage.sync.get().then(function(result) {
    for (const key in result) {
        const el = document.getElementById(key);
        if (el?.type == 'checkbox') el.checked = result[key];
        else if (el) el.value = result[key];
    }
});

function storeSetting(setting) {
    chrome.storage.sync.set(setting);
}

document.addEventListener('change', function(e) {
    const setting = {};
    const isCheckbox = e.target.type == 'checkbox';
    setting[e.target.id] = isCheckbox ? e.target.checked : e.target.value;

    if (isCheckbox) {
        const checkbox = document.querySelector('[type="checkbox"]:checked:not(:focus)');
        if (checkbox) {
            setting[checkbox.id] = false;
            checkbox.checked = false;
        }
    }

    storeSetting(setting);
});

document.addEventListener('mousedown', function(e) {
    if(e.target.classList[0] == 'numInputBtn') {
        const input = e.target.closest('label').children[1];
        if (e.target.classList[1] == 'plus') {
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

document.addEventListener('mouseup', function (e) {
    clearInterval(intervalId);
    if (e.target.classList[0] == 'numInputBtn') {
        const input = e.target.closest('label').children[1];
        storeSetting({ [input.id]: input.value });
    }
});