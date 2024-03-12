function addStyleRulesToShadowDomNodes(styleElementIds) {
  const getAllShadowDomNodes = () => {
    const shadowNodes = [];
    const getAllNodes = (node) => {
      if (node?.shadowRoot) {
        shadowNodes.push(node);
      }

      if (node?.children) {
        for (const child of node.children) {
          getAllNodes(child);
        }

        if (node.shadowRoot) {
          getAllNodes(node.shadowRoot);
        }
      }
    };

    getAllNodes(document.body);

    return shadowNodes;
  };

  const addStyleNodeToDomNode = (node) => {
    styleElementIds.forEach((styleElementId) => {
      const styleNode = document
        .getElementById(styleElementId)
        ?.cloneNode(true);

      const existedStyleNode = node.shadowRoot.getElementById(styleElementId);

      if (styleNode && !existedStyleNode) {
        node.shadowRoot.appendChild(styleNode);
      }
    });
  };

  const hideElements = () => {
    const shadowDomNodes = getAllShadowDomNodes();
    shadowDomNodes.forEach(addStyleNodeToDomNode);
  };

  let timeout;

  const debounce = (callback) => () => {
    clearTimeout(timeout);
    timeout = setTimeout(callback, 1000);
  };

  const debouncedHideElements = debounce(hideElements);

  const observeDomChanges = (callback) => {
    const domMutationObserver = new MutationObserver(callback);

    domMutationObserver.observe(document.documentElement, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });
  };

  hideElements();

  observeDomChanges(debouncedHideElements);
}
