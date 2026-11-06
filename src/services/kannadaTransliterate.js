// Comprehensive Phonetic Transliteration Engine for Kannada (ಕನ್ನಡ)
// Converts Kannada script to phonetic Latin characters so standard system/Indian TTS voices
// (en-IN, hi-IN, or default OS voices on Windows/Android/macOS) can pronounce Kannada fluently
// even when native kn-IN voice packs are not installed!

const KANNADA_DICT = {
  // App & General
  'ಕ್ರಾಪ್ ಕೇರ್': 'Crop Care',
  'ಕ್ರಾಪ್‌ಕೇರ್': 'Crop Care',
  'ರೈತ': 'Raita',
  'ರೈತರ': 'Raitara',
  'ಕೃಷಿ': 'Krishi',
  'ಆರೋಗ್ಯ': 'Aarogya',
  'ಆರೋಗ್ಯಕರ': 'Aarogyakara',
  'ಸ್ಕ್ಯಾನ್': 'Scan',
  'ಕ್ಯಾಮೆರಾ': 'Camera',
  'ಫೋಟೋ': 'Photo',
  'ಚಿತ್ರ': 'Chitra',
  'ಎಲೆ': 'Ele',
  'ಎಲೆಗಳು': 'Elegalu',
  
  // Crops
  'ಟೊಮೇಟೊ': 'Tomato',
  'ತೊಮೇಟೊ': 'Tomato',
  'ಟೊಮಾಟೊ': 'Tomato',
  'ಆಲೂಗಡ್ಡೆ': 'Aaloogadde',
  'ಆಲೂ': 'Aaloo',
  'ಮೆಕ್ಕೆಜೋಳ': 'Mekkejola',
  'ಜೋಳ': 'Jola',
  'ಭತ್ತ': 'Bhatta',
  'ಅಕ್ಕಿ': 'Akki',
  'ಮೆಣಸಿನಕಾಯಿ': 'Menasinakaayi',
  'ಮೆಣಸು': 'Menasu',

  // Farming & Land
  'ಜಮೀನು': 'Jameenu',
  'ಹೊಲ': 'Hola',
  'ಗದ್ದೆ': 'Gadde',
  'ತೋಟ': 'Tota',
  'ಎಕರೆ': 'Ekkare',
  'ಬಿತ್ತನೆ': 'Bitthane',
  'ದಿನಾಂಕ': 'Dinaanka',
  'ಬೆಳೆ': 'Bele',
  'ಬೆಳೆಗಳು': 'Belegalu',

  // Diseases & Symptoms
  'ರೋಗ': 'Roga',
  'ರೋಗಗಳು': 'Rogagalu',
  'ಲಕ್ಷಣ': 'Lakshana',
  'ಲಕ್ಷಣಗಳು': 'Lakshanagalu',
  'ಅಂಗಮಾರಿ': 'Angamaari',
  'ಆರಂಭಿಕ': 'Aarambhika',
  'ತಡವಾದ': 'Tadavaada',
  'ಬೂಜು': 'Booju',
  'ಸುಟ್ಟ': 'Sutta',
  'ಚುಕ್ಕೆ': 'Chukke',
  'ಎಲೆ ಸುರುಟು': 'Ele Surutu',
  'ತುಕ್ಕು': 'Tukku',
  'ಬ್ಯಾಕ್ಟೀರಿಯಾ': 'Bacteeriyaa',
  'ನಂಜು': 'Nanju',
  'ಕೀಟ': 'Keeta',
  'ಹಾನಿ': 'Haani',

  // Treatments & Solutions
  'ಚಿಕಿತ್ಸೆ': 'Chikitse',
  'ಚಿಕಿತ್ಸಾ': 'Chikitsaa',
  'ಪರಿಹಾರ': 'Parihaara',
  'ಔಷಧ': 'Aushadha',
  'ಔಷಧಗಳು': 'Aushadhagalu',
  'ಸಿಂಪಡಿಸಿ': 'Simpadisi',
  'ಸಿಂಪಡಣೆ': 'Simpadane',
  'ಸಾವಯವ': 'Saavayava',
  'ರಾಸಾಯನಿಕ': 'Raasaanika',
  'ಪ್ರತಿಬಂಧಕ': 'Prathibandhaka',
  'ಬೇವು': 'Baevu',
  'ಎಣ್ಣೆ': 'Enne',
  'ಗೊಬ್ಬರ': 'Gobbara',
  'ಪ್ರಮಾಣ': 'Pramaana',

  // Cost & Economics
  'ವೆಚ್ಚ': 'Vechcha',
  'ಬೆಲೆ': 'Bele',
  'ದರ': 'Dara',
  'ರೂಪಾಯಿ': 'Roopayi',
  'ರೂ': 'Roopayi',
  'ಖರ್ಚು': 'Kharchu',
  'ಅಗ್ಗದ': 'Aggada',
  'ಉತ್ತಮ ಮೌಲ್ಯ': 'Utthama Maulya',
  'ಪರಿಣಾಮಕಾರಿ': 'Parinaamakaari',

  // Risk levels
  'ಕಡಿಮೆ ಅಪಾಯ': 'Kadime Apaaya',
  'ಮಧ್ಯಮ ಅಪಾಯ': 'Madhyama Apaaya',
  'ಹೆಚ್ಚು ಅಪಾಯ': 'Hechchu Apaaya',
  'ಅಪಾಯ': 'Apaaya',
  'ಖಚಿತತೆ': 'Khachitathe'
};

const KANNADA_VOWELS = {
  '\u0C85': 'a', '\u0C86': 'aa', '\u0C87': 'i', '\u0C88': 'ee', '\u0C89': 'u',
  '\u0C8A': 'oo', '\u0C8B': 'ru', '\u0C8E': 'e', '\u0C8F': 'ae', '\u0C90': 'ai',
  '\u0C92': 'o', '\u0C93': 'o', '\u0C94': 'au'
};

const KANNADA_CONSONANTS = {
  '\u0C95': 'k', '\u0C96': 'kh', '\u0C97': 'g', '\u0C98': 'gh', '\u0C99': 'ng',
  '\u0C9A': 'ch', '\u0C9B': 'chh', '\u0C9C': 'j', '\u0C9D': 'jh', '\u0C9E': 'ny',
  '\u0C9F': 't', '\u0CA0': 'th', '\u0CA1': 'd', '\u0CA2': 'dh', '\u0CA3': 'n',
  '\u0CA4': 'th', '\u0CA5': 'th', '\u0CA6': 'd', '\u0CA7': 'dh', '\u0CA8': 'n',
  '\u0CAA': 'p', '\u0CAB': 'ph', '\u0CAC': 'b', '\u0CAD': 'bh', '\u0CAE': 'm',
  '\u0CAF': 'y', '\u0CB0': 'r', '\u0CB1': 'r', '\u0CB2': 'l', '\u0CB3': 'l',
  '\u0CB5': 'v', '\u0CB6': 'sh', '\u0CB7': 'sh', '\u0CB8': 's', '\u0CB9': 'h'
};

const KANNADA_MATRAS = {
  '\u0CBE': 'aa', '\u0CBF': 'i', '\u0CC0': 'ee', '\u0CC1': 'u', '\u0CC2': 'oo',
  '\u0CC3': 'ru', '\u0CC6': 'e', '\u0CC7': 'ae', '\u0CC8': 'ai', '\u0CCA': 'o',
  '\u0CCB': 'o', '\u0CCC': 'au', '\u0CCD': '' // virama
};

const KANNADA_DIGITS = {
  '\u0CE6': '0', '\u0CE7': '1', '\u0CE8': '2', '\u0CE9': '3', '\u0CEA': '4',
  '\u0CEB': '5', '\u0CEC': '6', '\u0CED': '7', '\u0CEE': '8', '\u0CEF': '9'
};

export function transliterateKannada(text) {
  if (!text) return '';
  let processed = text;

  // 1. Substitute dictionary terms first for natural fluent pronunciation
  for (const [k, v] of Object.entries(KANNADA_DICT)) {
    processed = processed.split(k).join(v);
  }

  // 2. Character-by-character transliteration for remaining Kannada characters
  let result = '';
  const chars = [...processed];

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const code = ch.charCodeAt(0);

    // If Kannada digit
    if (KANNADA_DIGITS[ch]) {
      result += KANNADA_DIGITS[ch];
      continue;
    }

    // Currency symbol
    if (ch === '₹') {
      result += ' rupees ';
      continue;
    }

    // Non-Kannada range: preserve intact
    if (code < 0x0C80 || code > 0x0CFF) {
      result += ch;
      continue;
    }

    // Anusvara (am / m)
    if (ch === '\u0C82') {
      result += 'm';
      continue;
    }

    // Visarga (h)
    if (ch === '\u0C83') {
      result += 'h';
      continue;
    }

    // Independent Vowel
    if (KANNADA_VOWELS[ch]) {
      result += KANNADA_VOWELS[ch];
      continue;
    }

    // Consonant
    if (KANNADA_CONSONANTS[ch]) {
      const base = KANNADA_CONSONANTS[ch];
      const nextCh = chars[i + 1];

      if (nextCh && KANNADA_MATRAS[nextCh] !== undefined) {
        // Consonant + Matra or Consonant + Virama
        result += base + KANNADA_MATRAS[nextCh];
        i++; // skip matra
      } else {
        // Inherent 'a' vowel
        result += base + 'a';
      }
      continue;
    }

    // Fallback
    result += ch;
  }

  // Polish formatting for speech engine
  return result
    .replace(/aa+/g, 'aa')
    .replace(/ee+/g, 'ee')
    .replace(/oo+/g, 'oo')
    .replace(/\s+/g, ' ')
    .trim();
}
