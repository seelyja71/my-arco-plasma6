function quotesInners(str) {
  return str.substring(str.indexOf('(') + 1, str.lastIndexOf(')'));
}

// parsing rule into array of selectors
function recursiveParser(rule, selectors) {
  let allSelectors = [...selectors];
  let type = '';

  allSelectors.push(rule.split(':-abp-')[0]);

  if (rule.includes('-abp-has')) {
    const rulePart = rule.substring(rule.indexOf('-abp-has') + 8);

    [allSelectors, type] = recursiveParser(
      quotesInners(rulePart),
      allSelectors
    );
  } else if (rule.includes('-abp-contains')) {
    type = 'text';
    const rulePart = rule.split('-abp-contains')[1];
    allSelectors.push(quotesInners(rulePart));
  } else if (rule.includes('-abp-content-before')) {
    type = 'content-before';
    const rulePart = rule.split('-abp-content-before')[1];
    allSelectors.push(quotesInners(rulePart));
  } else {
    type = 'selector';
  }

  return [allSelectors, type];
}

function ruleParser(rule) {
  const [selectors, type] = recursiveParser(rule, []);

  const ruleObject = {
    selectors,
    type,
  };

  return ruleObject;
}
