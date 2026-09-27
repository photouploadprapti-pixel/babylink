/** English names of Thai provinces and commonly used towns. */
export const THAILAND_CITIES = [
  'Bangkok',
  'Koh Lanta',
  'Krabi',
  'Ao Nang',
  'Phuket',
  'Patong',
  'Kata',
  'Karon',
  'Chiang Mai',
  'Chiang Rai',
  'Pattaya',
  'Jomtien',
  'Hua Hin',
  'Cha-am',
  'Koh Samui',
  'Chaweng',
  'Lamai',
  'Koh Phangan',
  'Thong Sala',
  'Koh Tao',
  'Koh Phi Phi',
  'Koh Chang',
  'Koh Samet',
  'Koh Lipe',
  'Koh Yao',
  'Khao Lak',
  'Hat Yai',
  'Songkhla',
  'Surat Thani',
  'Nakhon Si Thammarat',
  'Trang',
  'Phang Nga',
  'Ranong',
  'Chumphon',
  'Prachuap Khiri Khan',
  'Phetchaburi',
  'Kanchanaburi',
  'Ayutthaya',
  'Nonthaburi',
  'Pak Kret',
  'Pathum Thani',
  'Rangsit',
  'Samut Prakan',
  'Bang Na',
  'Samut Sakhon',
  'Nakhon Pathom',
  'Rayong',
  'Chonburi',
  'Si Racha',
  'Chanthaburi',
  'Trat',
  'Pai',
  'Mae Rim',
  'Lampang',
  'Lamphun',
  'Mae Hong Son',
  'Nan',
  'Phrae',
  'Phayao',
  'Udon Thani',
  'Khon Kaen',
  'Nakhon Ratchasima',
  'Ubon Ratchathani',
  'Buriram',
  'Surin',
  'Roi Et',
  'Sakon Nakhon',
  'Nong Khai',
  'Loei',
  'Nakhon Sawan',
  'Phitsanulok',
  'Sukhothai',
  'Tak',
  'Pattani',
  'Yala',
  'Narathiwat',
  'Satun',
  'Amnat Charoen',
  'Ang Thong',
  'Bueng Kan',
  'Chachoengsao',
  'Chai Nat',
  'Chaiyaphum',
  'Kalasin',
  'Kamphaeng Phet',
  'Lopburi',
  'Maha Sarakham',
  'Mukdahan',
  'Nakhon Nayok',
  'Nakhon Phanom',
  'Nong Bua Lamphu',
  'Phatthalung',
  'Phetchabun',
  'Phichit',
  'Prachinburi',
  'Ratchaburi',
  'Sa Kaeo',
  'Samut Songkhram',
  'Saraburi',
  'Sing Buri',
  'Sisaket',
  'Suphan Buri',
  'Uthai Thani',
  'Uttaradit',
  'Yasothon',
] as const

/**
 * Filters Thai city names by a partial query, preferring prefix matches.
 * @param query - Text the parent has typed
 * @param limit - Maximum suggestions to return
 */
export const suggestThailandCities = (query: string, limit = 8) => {
  const needle = query.trim().toLowerCase()
  const ranked = [...THAILAND_CITIES].sort((left, right) => {
    const leftName = left.toLowerCase()
    const rightName = right.toLowerCase()
    const leftStarts = needle ? leftName.startsWith(needle) : true
    const rightStarts = needle ? rightName.startsWith(needle) : true
    if (leftStarts !== rightStarts) return leftStarts ? -1 : 1
    return leftName.localeCompare(rightName)
  })

  if (!needle) return ranked.slice(0, limit)

  return ranked
    .filter((city) => city.toLowerCase().includes(needle))
    .slice(0, limit)
}
