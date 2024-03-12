function skipVideoAds() {
    if (
      document.querySelector('.ad-showing') ||
      document.querySelector('.ad-interrupting')
    ) {
      const video = document.querySelector('video');
  
      if (video?.duration) {
        video.muted = true;
        video.currentTime = video.duration;
        video.paused && video.play();
  
        setTimeout(() => {
          const skipButton = document.querySelector('button.ytp-ad-skip-button');
          skipButton?.click();
  
          const modernSkipButton = document.querySelector('.ytp-ad-skip-button-modern');
          modernSkipButton?.click();
        }, 120);
      }
    }
  }
  
  function hideStaticAds() {
    const overrideObject = (obj, propertyName, overrideValue) => {
      if (!obj) {
        return false;
      }
  
      let overridden = false;
  
      for (const key in obj) {
        if (obj.hasOwnProperty(key) && key === propertyName) {
          obj[key] = overrideValue;
          overridden = true;
        } else if (obj.hasOwnProperty(key) && typeof obj[key] === 'object') {
          if (overrideObject(obj[key], propertyName, overrideValue)) {
            overridden = true;
          }
        }
      }
  
      return overridden;
    };
  
    /**
     * Overrides JSON.parse and Response.json functions.
     * Examines these function arguments, looks for properties with the specified name there,
     * and if it exists, changes its value to what was specified.
     */
    const jsonOverride = (propertyName, overrideValue) => {
      const nativeJSONParse = JSON.parse;
      JSON.parse = (...args) => {
        const obj = nativeJSONParse.apply(this, args);
  
        // Override its props and return back to the caller
        overrideObject(obj, propertyName, overrideValue);
  
        return obj;
      };
  
      const nativeResponseJson = Response.prototype.json;
      Response.prototype.json = new Proxy(nativeResponseJson, {
        apply(...args) {
          // Call the target function, get the original Promise
          const promise = Reflect.apply(...args);
  
          // Create a new one and override the JSON inside
          return new Promise((resolve, reject) => {
            promise
              .then((data) => {
                overrideObject(data, propertyName, overrideValue);
                resolve(data);
              })
              .catch((error) => reject(error));
          });
        },
      });
    };
  
    // Removes ads metadata from YouTube XHR requests
    jsonOverride('adPlacements', []);
    jsonOverride('playerAds', []);
  }

  let bannerSeen = false;

  function youtubeBannerObserver() {
    if (
        document.querySelector('#error-screen') ||
        document.querySelector('.yt-playability-error-supported-renderers') ||
        document.getElementsByTagName('yt-playability-error-supported-renderers')
    ) {  
        if (!bannerSeen) {
            chrome.runtime.sendMessage({
                type: stndz.messages.updateUser,
                userData: {
                    attributes: { hasSeenYoutubeBanner: true }
                }
            });

            bannerSeen = true;
        }
    }
  }
  
  const startYoutubePageScript = async () => {
    hideStaticAds();
  
    skipVideoAds();
  
    observeDomChanges(() => {
      youtubeBannerObserver();
  
      skipVideoAds();
    });
  };
  
  startYoutubePageScript();
  