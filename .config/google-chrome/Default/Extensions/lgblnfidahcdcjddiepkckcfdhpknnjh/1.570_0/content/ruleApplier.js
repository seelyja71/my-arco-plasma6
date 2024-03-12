const observeDomChanges = (callback) => {
  const domMutationObserver = new MutationObserver((mutations) => {
    callback(mutations);
  });

  domMutationObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
};

function recursiveTextSearcher(elem, text) {
  let result = false;

  if (elem.textContent && elem.textContent.length > 0) {
    if (!text.includes('|')) {
      if (elem.textContent.includes(text)) {
        return true;
      }
    } else {
      const textArr = text.split('|').map((item) => item.replace('/', ''));
      const { length } = textArr;
      for (let i = 0; i < length; i++) {
        if (elem.textContent.includes(textArr[i])) {
          result = true;
          break;
        }
      }
    }
  } else if (elem.children && elem.children.length > 0) {
    const { children } = elem;
    const { length } = children;

    for (let i = 0; i < length; i++) {
      if (recursiveTextSearcher(children[i], text)) {
        result = true;
        break;
      }
    }
  }

  return result;
}

// finding exact content in pseudo class :before from rule with :-abp-content-before
function contentBeforeRuleApplier(elem, content, startElem) {
  const gotContent = getComputedStyle(elem, ':before').getPropertyValue('content');
  if (gotContent === content) {
    startElem.style.cssText = 'display: none !important';
  }
}

// finding exact text from rule with :-abp-contains
function textRuleApplier(elem, text, startElem) {
  if (
    recursiveTextSearcher(elem, text) &&
    startElem.children[0].parentElement
  ) {
    startElem.children[0].parentElement.style.cssText =
      'display: none !important';
  }
}

// finding exact last selector from rule with :-abp-has
function selectorRuleApplier(elem, selector, startElem) {
  if (elem.querySelectorAll(selector).length > 0) {
    startElem.children[0].parentElement.style.cssText =
      'display: none !important';
  }
}

// searching through array of selectors from rule
function recursiveSelectorSearcher(selectors, step, elems) {
  let result = [...elems];
  const { length } = selectors;
  if (step < length - 1) {
    const newGeneration = [];
    elems.forEach((elem) => {
      const kids = elem.querySelectorAll(selectors[step]);
      newGeneration.push([...kids]);
    });
    result = recursiveSelectorSearcher(
      selectors,
      step + 1,
      newGeneration.flat()
    );
  }

  return result;
}

function commonRuleApplier(extendedCSSRule) {
  const { selectors, type } = extendedCSSRule;

  let elems = document.querySelectorAll(selectors[0]);
  const { length } = selectors;

  elems.forEach((elem) => {
    const finalElems = recursiveSelectorSearcher(selectors, 1, [elem]);
    finalElems.forEach((finalElem) => {
      switch (type) {
        case 'text':
          textRuleApplier(finalElem, selectors[length - 1], elem);
          break;
        case 'selector':
          selectorRuleApplier(finalElem, selectors[length - 1], elem);
          break;
        case 'content-before':
          contentBeforeRuleApplier(finalElem, selectors[length - 1], elem);
          break;
        default:
          break;
      }
    });
  });
}

function ruleApplier(rules) {
  for (const key in rules) {
    if (pageData.topHostAddress.includes(key)) {
      rules[key]?.forEach((rule) => {
        // Error handler for broken rules
        try {
          commonRuleApplier(rule);
        } catch (e) {
        }
      });
    }
  }
}
