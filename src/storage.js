chrome.storage.sync.get().then(function (settings) {
    document.dispatchEvent(new CustomEvent('rmcStorageData', {
        detail: function (data) { try { return cloneInto(data, window) } catch { return data } }(settings)
    }));
});

chrome.storage.onChanged.addListener(handleStorageChange);

function handleStorageChange(changes) {
    document.dispatchEvent(new CustomEvent('rmcStorageChanged', {
        detail: function (data) { try { return cloneInto(data, window) } catch { return data } }(changes)
    }));
}