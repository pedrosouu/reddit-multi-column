
chrome.storage.sync.get().then(function(settings) {
    const div = document.createElement('div');
    div.style = 'width: calc(100vw - var(--rmc-left-sidebar, 0px) - var(--rmc-gap, 0px) - var(--rmc-right-sidebar, 0px) - var(--rmc-right-sidebar-gap, 0px))';

    document.documentElement.style.setProperty('--rmc-max-column-width', (settings.maxColumnWidth || 732) + 'px');
    document.documentElement.style.setProperty('--rmc-max-cont-width', (settings.maxContWidth || 732) + 'px');
    if (settings.autoHideRSidebar) document.documentElement.classList.add('rmc-auto-hide-r-sidebar');
    if (settings.autoHideRSidebarFeedPages) document.documentElement.classList.add('rmc-auto-hide-r-sidebar-feed-pages');

    let numOfColumns, width, postsContainer, app;
    let maxNumOfColumns = settings.maxNumOfColumns || 5;
    let minColumnWidth = settings.minColumnWidth || 450;
    let heights = [];
    let heights2 = [];
    let observer = new MutationObserver(function () {
        requestAnimationFrame(addPostsToArray);
    });

    window.addEventListener('popstate', function() {
        requestAnimationFrame(handlePageNav);
    });

    new MutationObserver(function () {
        if (document.querySelector('shreddit-feed')) {
            this.disconnect();
            handlePageNav();

            new MutationObserver(function () {
                handlePageNav();
            }).observe(document.querySelector('title'), {
                childList: true
            });
            
            let nav = document.body.querySelector('navigation-indicator');
            const observer = new ResizeObserver(function (e) {
                if (!e[0].contentRect.height) requestAnimationFrame(handlePageNav);
            });

            if (nav) observer.observe(nav); 
            else {
                new MutationObserver(function () {
                    let nav = document.body.querySelector('navigation-indicator');
                    if (nav) observer.observe(nav);
                }).observe(document.body, {
                    childList: true
                });
            }
        }
    }).observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    function addPostsToArray() {
        const posts = postsContainer.querySelectorAll(':is(article, in-feed-wiki-page-carousel, in-feed-community-recommendations):not([style])');
        if (!posts.length) return;
        for (let i = 0; i < posts.length; i++) {
            postsContainer.posts.push(posts[i]);
        }
        arrangePosts();
    }

    function arrangePosts() {
        let post, shortestCol;
        for (let i = 0; i < postsContainer.posts.length; i++) {
            post = postsContainer.posts[i];
            shortestCol = post.attributes.column?.value || getShortestCol(heights);

            if (post.isConnected) {
                post.style = `position: absolute; width: var(--rmc-post-width); left: ${width * shortestCol}%; top: ${heights[shortestCol]}px; box-sizing: border-box;`;
                heights[shortestCol] += post.offsetHeight;
                post.setAttribute('height', post.offsetHeight);
                post.setAttribute('column', shortestCol);
                if (!post.parentElement.posts) {
                    heights2[getShortestCol(heights2)] += post.offsetHeight;
                    if (!post.nextElementSibling?.nextElementSibling) {
                        postsContainer.classList.add('rmc-has-batch');
                        post.parentElement.style.minHeight = Math.max(...heights2) + 'px';
                        for (let i = 0; i < heights2.length; i++) {
                            heights2[i] = 0;
                        }
                    }
                }
            } else {
                heights[shortestCol] += +post.attributes.height.value;
            }
        }        

        const loadMorePostsEl = getLoadMorePostsEl();

        if (loadMorePostsEl) {
            shortestCol = getShortestCol(heights);
            loadMorePostsEl.style = `position: absolute; width: var(--rmc-post-width); left: ${width * shortestCol}%; top: ${heights[shortestCol]}px;`;
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

    function handlePageNav() {
        if (!postsContainer?.isConnected && (postsContainer = document.body.querySelector('shreddit-app:not([routename^="profile"]):not([routename="explore-page"]) shreddit-feed'))) {
            document.documentElement.classList.add('rmc-feed-page');

            observer.disconnect();
            observer.observe(postsContainer, { 
                childList: true 
            });

            if (!div.isConnected) {
                postsContainer.after(div);
                if (!numOfColumns) columns();
                if (!postsContainer.posts) {
                    postsContainer.style.position = 'relative';
                    postsContainer.posts = [];
                }
            }

            requestAnimationFrame(addPostsToArray);
        } else if (!postsContainer) document.documentElement.classList.remove('rmc-feed-page');
    }
    
    function handlePageResize() {
        if (calcNumOfColumns() != numOfColumns) {
            columns();
            for (let i = 0; i < postsContainer.posts.length; i++) {
                postsContainer.posts[i].removeAttribute('column');
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
        heights2 = [];
        for (let i = 0; i < numOfColumns; i++) {
            heights.push(0);
            heights2.push(0); 
        }
    }

    new ResizeObserver(function() {
        if (postsContainer?.isConnected) requestAnimationFrame(handlePageResize);
    }).observe(div);
    
    window.addEventListener('scrollend', function() { 
        if (postsContainer?.isConnected) requestAnimationFrame(arrangePosts);
    });
    
    chrome.storage.onChanged.addListener(function(changes) {
        if (changes.minColumnWidth) {
            minColumnWidth = changes.minColumnWidth.newValue;
        } 
        
        else if (changes.maxNumOfColumns) {
            maxNumOfColumns = changes.maxNumOfColumns.newValue;
        } 
        
        else if (changes.maxColumnWidth) {
            document.documentElement.style.setProperty('--rmc-max-column-width', changes.maxColumnWidth.newValue + 'px');
        } 
        
        else if (changes.maxContWidth) {
            document.documentElement.style.setProperty('--rmc-max-cont-width', changes.maxContWidth.newValue + 'px');
        } 
        
        else if (changes.autoHideRSidebar) {
            document.documentElement.classList.toggle('rmc-auto-hide-r-sidebar');
        }

        else if (changes.autoHideRSidebarFeedPages) {
            document.documentElement.classList.toggle('rmc-auto-hide-r-sidebar-feed-pages');
        }


        handlePageResize();
    });
});