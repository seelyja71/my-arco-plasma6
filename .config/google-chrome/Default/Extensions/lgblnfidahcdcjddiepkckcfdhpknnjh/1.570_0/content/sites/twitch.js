(() => {
    const scriptTag = document.createElement('script');
    scriptTag.setAttribute('type', 'text/javascript');
    const browser = window.browser || chrome;
    const scriptSource = browser.runtime.getURL(
      'views/web_accessible/scripts/twitch.js'
    );
    const hash = Math.random().toString(36).substring(5);
    scriptTag.setAttribute('src', `${scriptSource}?${hash}`);
    const parent = document.head || document.documentElement;
    parent.appendChild(scriptTag);
    if (scriptTag.parentNode) {
      scriptTag.parentNode.removeChild(scriptTag);
    }
  })();