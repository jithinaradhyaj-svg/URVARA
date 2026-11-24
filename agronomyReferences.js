const references = [
  {
    id: 'uasb-ragi-ml322',
    crop: 'ragi',
    cropName: 'Finger millet (ragi)',
    subject: 'ML-322',
    type: 'variety',
    facts: [
      'UAS Bengaluru lists ML-322 as a finger millet variety recommended for Karnataka Zone 5.',
      'The UAS Bengaluru release note reports a duration of 105–110 days.',
    ],
    scope: 'Karnataka Zone 5 only; the source does not establish suitability for every district or farm.',
    sourceName: 'University of Agricultural Sciences, Bengaluru — Varieties recommended for release, 2022–23',
    sourceUrl: 'https://www.uasbangalore.edu.in/wp-content/uploads/2024/10/varieties-2022-23.pdf',
  },
  {
    id: 'uasb-ragi-gpu28',
    crop: 'ragi',
    cropName: 'Finger millet (ragi)',
    subject: 'GPU 28',
    type: 'variety',
    facts: ['UAS Bengaluru identifies GPU 28 as a finger millet variety released for Karnataka.'],
    scope: 'The reference confirms crop and release area; it does not establish suitability for a particular farm.',
    sourceName: 'University of Agricultural Sciences, Bengaluru — Small Millets, ZARS, GKVK',
    sourceUrl: 'https://www.uasbangalore.edu.in/en/small-millets-zars-gkvk-bengaluru/',
  },
  {
    id: 'icar-rice-pr126',
    crop: 'rice',
    cropName: 'Rice',
    subject: 'PR 126',
    type: 'variety',
    facts: ['An ICAR journal article identifies PR 126 as a short-duration rice variety developed by Punjab Agricultural University.'],
    scope: 'The cited study concerns the Indo-Gangetic Plains; it is not a recommendation for Karnataka.',
    sourceName: 'Indian Council of Agricultural Research — Indian Journal of Agricultural Sciences',
    sourceUrl: 'https://epubs.icar.org.in/index.php/IJAgS/article/view/174221',
  },
]

const normalize = value => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export function cropKey(value = '') {
  const crop = normalize(value)
  if (/\b(ragi|finger millet|finger millets)\b/.test(crop)) return 'ragi'
  if (/\b(rice|paddy)\b/.test(crop)) return 'rice'
  return ''
}

export function findCropReferences(value = '') {
  const key = cropKey(value)
  return key ? references.filter(reference => reference.crop === key) : []
}

export function findKnownVarietyConflict(question = '') {
  const text = normalize(question)
  const asksAboutRagi = /\b(ragi|finger millet)\b/.test(text)
  const mentionsPr126 = /\bpr 126\b/.test(text)
  if (!asksAboutRagi || !mentionsPr126) return null
  return {
    answer: 'PR 126 is documented as a rice variety, not a ragi (finger millet) variety. The cited ICAR study describes it as developed by Punjab Agricultural University and studied in the Indo-Gangetic Plains, so it is not evidence for using it in Karnataka. For ragi, UAS Bengaluru lists ML-322 for Zone 5 (105–110 days) and GPU 28 as released for Karnataka. District-level fit still needs local validation; share your district, soil, and water source or check with your KVK before choosing a variety.',
    sources: [references[2], references[0], references[1]],
  }
}

export function getMissingFarmDetails(question = '', profile = null) {
  const text = normalize(question)
  const missing = []
  const specificCropRequest = /\b(recommend|recommendation|which crops?|what crops?|which variety|variety|cultivar|sow|sowing|planting|grow|cultivat\w*|irrigat\w*|water schedule|fertili[sz]\w*|spray|pesticide|calendar|schedule)\b/.test(text)
  if (!specificCropRequest) return missing
  if (!profile?.state) missing.push('state')
  if (!profile?.district) missing.push('district')
  if (/\b(irrigat\w*|water|sow|sowing|planting|grow|cultivat\w*|recommend|which crops?|what crops?|variety|cultivar|fertili[sz]\w*|spray|pesticide|calendar|schedule)\b/.test(text) && !profile?.soil) missing.push('soil type')
  if (/\b(irrigat\w*|water|sow|sowing|planting|grow|cultivat\w*|recommend|which crops?|what crops?|variety|cultivar|fertili[sz]\w*|spray|pesticide|calendar|schedule)\b/.test(text) && !profile?.water) missing.push('water source')
  return missing
}

export function formatFarmClarification(fields, language = 'English') {
  const details = fields.join(', ')
  if (language === 'Kannada') return `ನಿಮ್ಮ ಪರಿಸ್ಥಿತಿಗೆ ಸರಿಹೊಂದುವ ಮಾಹಿತಿ ನೀಡಲು ಈ ವಿವರಗಳು ಬೇಕು: ${details}. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಜಿಲ್ಲೆ, ಮಣ್ಣಿನ ವಿಧ ಮತ್ತು ನೀರಿನ ಮೂಲವನ್ನು ತಿಳಿಸಿ. ಗೊತ್ತಿಲ್ಲದ ವಿವರಗಳನ್ನು ಹಾಗೆಯೇ ಹೇಳಬಹುದು.`
  if (language === 'Hindi') return `आपकी स्थिति के अनुसार जवाब देने के लिए ये जानकारी चाहिए: ${details}। कृपया अपना जिला, मिट्टी का प्रकार और पानी का स्रोत बताएं। जो जानकारी नहीं मालूम, उसे वैसा ही लिखें।`
  return `To give advice that fits your farm, please share: ${details}. What district are you in, what soil type do you know, and what is your water source? You can say if any detail is unknown.`
}

export { references as agronomyReferences }
