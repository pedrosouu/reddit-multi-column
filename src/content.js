document.addEventListener('rmcStorageData', function(e) {
const div = document.createElement('div');
div.style = 'width: calc(100vw - var(--rmc-left-sidebar, 0px) - var(--rmc-gap, 0px) - var(--rmc-right-sidebar, 0px) - var(--rmc-right-sidebar-gap, 0px))';

document.documentElement.style.setProperty('--rmc-max-column-width', (e.detail.maxColumnWidth || 732) + 'px');
document.documentElement.style.setProperty('--rmc-max-cont-width', (e.detail.maxContWidth || 732) + 'px');
if (e.detail.autoHideRSidebar) document.documentElement.classList.add('rmc-auto-hide-r-sidebar');
if (e.detail.autoHideRSidebarFeedPages) document.documentElement.classList.add('rmc-auto-hide-r-sidebar-feed-pages');

let numOfColumns, width, postsContainer, app;
let maxNumOfColumns = e.detail.maxNumOfColumns || 5;
let minColumnWidth = e.detail.minColumnWidth || 450;
let heights = [];
let heightsBatch = [];
let observer = new MutationObserver(function (e) {
    requestAnimationFrame(function () {
        addPostsToArray(e);
    });
});

new MutationObserver(function () {
    if (document.querySelector('shreddit-feed')) {
        this.disconnect();
        handlePageNav();
    }
}).observe(document.documentElement, {
    childList: true,
    subtree: true
});

document.addEventListener = function () {
    if (arguments[0] == 'scroll') handlePageNav();
    HTMLDocument.prototype.addEventListener.apply(document, arguments);
}

document.removeEventListener = function () {
    if (arguments[0] == 'scroll') handlePageNav();
    HTMLDocument.prototype.removeEventListener.apply(document, arguments);
}

function handlePageNav() {
    if (!postsContainer?.isConnected && (postsContainer = document.body.querySelector('shreddit-app:not([routename^="profile"]):not([routename="explore-page"]) shreddit-feed'))) {
        document.documentElement.classList.add('rmc-feed-page');

        observer.disconnect();
        observer.observe(postsContainer, {
            childList: true
        });

        if (!div.isConnected) postsContainer.after(div);
        if (!numOfColumns) columns();
        if (!postsContainer.posts) {
            postsContainer.style.position = 'relative';
            postsContainer.posts = [];
        }

        requestAnimationFrame(addPostsToArray);
    } else if (!postsContainer) document.documentElement.classList.remove('rmc-feed-page');
}

function addPostsToArray(entries) {
    const newPosts = postsContainer.querySelectorAll(':is(article, in-feed-wiki-page-carousel, in-feed-community-recommendations):not([style])');
    if (!newPosts.length) return;

    // All the old posts were removed
    if (entries[0]?.removedNodes.length > 1) postsContainer.posts = [];

    for (let i = 0; i < newPosts.length; i++) {
        postsContainer.posts.push(newPosts[i]);
    }

    arrangePosts();
}

function arrangePosts() {
    let post, shortestCol;
    for (let i = 0; i < postsContainer.posts.length; i++) {
        post = postsContainer.posts[i];
        shortestCol = post.column ?? getShortestCol(heights);

        if (post.isConnected) {
            post.style = `
                position: absolute; 
                width: var(--rmc-post-width); 
                left: ${width * shortestCol}%; 
                top: ${heights[shortestCol]}px; 
                box-sizing: border-box;
                `;
            heights[shortestCol] += post.offsetHeight;
            post.height = post.offsetHeight;
            post.column = shortestCol;
            if (!post.parentElement.posts) {
                heightsBatch[getShortestCol(heightsBatch)] += post.offsetHeight;
                if (!post.nextElementSibling?.nextElementSibling) {
                    postsContainer.classList.add('rmc-has-batch');
                    post.parentElement.style.minHeight = Math.max(...heightsBatch) + 'px';
                    for (let i = 0; i < heightsBatch.length; i++) {
                        heightsBatch[i] = 0;
                    }
                }
            }
        } else {
            heights[shortestCol] += post.height;
        }
    }

    const loadMorePostsEl = getLoadMorePostsEl();

    if (loadMorePostsEl) {
        shortestCol = getShortestCol(heights);
        loadMorePostsEl.style = `
            position: absolute; 
            width: var(--rmc-post-width); 
            left: ${width * shortestCol}%; 
            top: ${heights[shortestCol]}px;
            `;
        postsContainer.style.height = Math.max(...heights) + loadMorePostsEl.offsetHeight + 'px';
    } else {
        postsContainer.style.height = Math.max(...heights) + 'px';
    }
    for (let i = 0; i < heights.length; i++) {
        heights[i] = 0;
    }
}

function getLoadMorePostsEl() {
    let el = postsContainer.lastElementChild;
    if (el.attributes.method) return el;

    for (let i = 0; i < 5; i++) {
        if (el?.attributes.method) return el;
        else if (el) el = el.previousElementSibling;
        else break;
    }
}

function calcNumOfColumns() {
    for (let i = maxNumOfColumns; i > 0; i--) {
        if (div.clientWidth / i >= minColumnWidth) {
            document.documentElement.style.setProperty('--rmc-columns', i);
            return i;
        }
    }
}

function getShortestCol(array) {
    let column = 0;
    for (let i = 1; i < array.length; i++) {
        if (array[column] > array[i]) {
            column = i;
        }
    }
    return column;
}

function handlePageResize() {
    if (calcNumOfColumns() != numOfColumns) {
        columns();
        for (let i = 0; i < postsContainer.posts.length; i++) {
            delete postsContainer.posts[i].column;
        }
        arrangePosts();
    } else {
        document.documentElement.style.setProperty('--rmc-post-width', postsContainer.clientWidth / numOfColumns + 'px');
    }
}

function columns() {
    numOfColumns = calcNumOfColumns() || 1;
    document.documentElement.style.setProperty('--rmc-post-width', postsContainer.clientWidth / numOfColumns + 'px');
    width = 100 / numOfColumns;
    heights = [];
    heightsBatch = [];
    for (let i = 0; i < numOfColumns; i++) {
        heights.push(0);
        heightsBatch.push(0);
    }
}

new ResizeObserver(function () {
    if (postsContainer?.isConnected) requestAnimationFrame(handlePageResize);
}).observe(div);

window.addEventListener('scrollend', function () {
    if (postsContainer?.isConnected) requestAnimationFrame(arrangePosts);
});

document.addEventListener('rmcStorageChanged', function (e) {
    if (e.detail.minColumnWidth) {
        minColumnWidth = e.detail.minColumnWidth.newValue;
    }

    if (e.detail.maxNumOfColumns) {
        maxNumOfColumns = e.detail.maxNumOfColumns.newValue;
    }

    if (e.detail.maxColumnWidth) {
        document.documentElement.style.setProperty('--rmc-max-column-width', e.detail.maxColumnWidth.newValue + 'px');
    }

    if (e.detail.maxContWidth) {
        document.documentElement.style.setProperty('--rmc-max-cont-width', e.detail.maxContWidth.newValue + 'px');
    }

    if (e.detail.autoHideRSidebar) {
        document.documentElement.classList.toggle('rmc-auto-hide-r-sidebar');
    }

    if (e.detail.autoHideRSidebarFeedPages) {
        document.documentElement.classList.toggle('rmc-auto-hide-r-sidebar-feed-pages');
    }

    handlePageResize();
});
});