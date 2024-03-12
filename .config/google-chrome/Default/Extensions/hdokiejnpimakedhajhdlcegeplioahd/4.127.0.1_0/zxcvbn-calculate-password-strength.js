chrome.runtime.onMessage.addListener(async message => {
  if (
    message.target !== 'offscreen-zxcvbn-doc' ||
    message.type !== 'calculate-password-strength'
  ) {
    return
  }

  const score = challengegetstrength(
    message.data.username,
    message.data.password,
    message.data.passwordStrengthHardeningEnabled
  )

  chrome.runtime.sendMessage({
    type: 'password-strength-result',
    id: message.id,
    score
  })
})
