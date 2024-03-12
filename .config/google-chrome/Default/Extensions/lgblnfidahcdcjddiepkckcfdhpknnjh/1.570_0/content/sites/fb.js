let fbIntervalId;
const sponsoredTexts = [
  'sponsoreret',
  'sponsrad',
  'հովանավորվող',
  'реклама',
  'sponsorisé',
  'patrocinado',
  'sponsa',
  'bersponsor',
  'commandité',
  'ditaja',
  'gesponsert',
  'gesponsord',
  'publicidad',
  'sponset',
  'sponsored',
  'sponsorizat',
  'sponsorizzato',
  'sponsorlu',
  'sponsorowane',
  'sponsoroitu',
  'may sponsor',
  'χορηγούμενη',
  'la maalgeliyey',
  'geborg',
  'reklam',
  'kanthi sponsor',
  'giisponsoran',
  'sponzorirano',
  'paeroniet',
  'patrocinat',
  'sponzorováno',
  'noddwyd',
  'anzeige',
  'szpōnzorowane',
  'مُموَّل',
  'পৃষ্ঠপোষকতা কৰা',
  'spunsurizatu',
  '広告',
  'ⵉⴷⵍ',
  'ܒܘܕܩܐ ܡܡܘܘܢܐ',
  'پاڵپشتیکراو',
  'reklamo',
  'рэклама',
  'спонсорирано',
  'спонзорирано',
  'সৌজন্যে',
  'babestua',
  'دارای پشتیبانی مالی',
  'stuðlað',
  'urraithe',
  'oñepatrosinapyre',
  'પ્રાયોજિત',
  'daukar nauyi',
  'ממומן',
  'plaćeni oglas',
  'peye',
  'प्रायोजित',
  'kostað',
  'disponsori',
  'რეკლამა',
  'демеушілік көрсеткен',
  'បានឧបត្ថម្ភ',
  'демөөрчүлөнгөн',
  'ຜູ້ສະໜັບສະໜູນ',
  'remiama',
  'apmaksāta reklāma',
  'misy mpiantoka',
  'സ്പോൺസർ ചെയ്തത്',
  'ивээн тэтгэсэн',
  'sponsorjat',
  'ပံ့ပိုးထားသည်',
  'sponzorované',
  'zvabhadharirwa',
  'la maalgeliyey',
  'imedhaminiwa',
  'хәйрияче',
  'được tài tr',
];

// there are `ç` AND `onPageDataReady` in console
// but some sites still consider `onPageDataReady` as undefined
onPageDataReady?.(() => {
  if (pageData.blockAdsOnFacebook) {
    fbIntervalId = setInterval(blockFacebookFeedAdsInterval, 250);
  }
});

onPageDataUpdate?.((pageData, previousPageData) => {
    if (pageData.blockAdsOnFacebook && !previousPageData.blockAdsOnFacebook) {
      fbIntervalId = setInterval(blockFacebookFeedAdsInterval, 250);
    } else if (
      !pageData.blockAdsOnFacebook &&
      previousPageData.blockAdsOnFacebook
    ) {
      clearInterval(fbIntervalId);
      unblockFacebookFeedAds();
    }
  }
);

function blockFacebookFeedAdsInterval() {
  fbSetAdsVisibility('userContentWrapper', true);
  fbSetAdsVisibility('fbUserContent', true);
  fbSetAdsVisibility('pagelet-group', true);
  fbSetAdsVisibility('ego_column', true);
  fbBlockFeedAds(true);
}

function unblockFacebookFeedAds() {
  fbSetAdsVisibility('userContentWrapper', false);
  fbSetAdsVisibility('fbUserContent', false);
  fbSetAdsVisibility('pagelet-group', false);
  fbSetAdsVisibility('ego_column', false);
  fbBlockFeedAds(false);
}

function fbSetAdsVisibility(className, hide) {
  const elements = document.getElementsByClassName(className);

  for (const element of elements) {
    const state = element.getAttribute('stndz-state');

    if (state === (hide ? '1' : '0')) {
      continue;
    }

    const anchors = element.getElementsByTagName('a');

    for (const anchor of anchors) {
      if (anchor.innerText.toLowerCase() === 'sponsored') {
        element.style.display = hide ? 'none' : '';
        element.setAttribute('stndz-state', hide ? '1' : '0');
        break;
      }
    }
  }
}

function fbBlockFeedAds(hide) {
  const uses = document.querySelectorAll('use');
  uses.forEach((use) => {
    const state = use.getAttribute('stndz-state');
    if (state === (hide ? '1' : '0')) {
      return;
    }
    let href = use.getAttribute('xlink:href');
    const svg = document.querySelector(`svg${href}`);
    if (svg) {
      href = svg.querySelector('use').getAttribute('xlink:href');
    }

    const text = document.querySelector(`text${href}`);
    if (text && sponsoredTexts.includes(text.textContent.toLowerCase())) {
      const parent = use.closest('div[aria-describedby]');
      if (parent) {
        parent.style.display = hide ? 'none' : '';
        use.setAttribute('stndz-state', hide ? '1' : '0');
      }
    }
  });
}
