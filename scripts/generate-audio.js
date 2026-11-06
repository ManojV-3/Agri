import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diseases definition
const diseases = [
  'tomato_early_blight',
  'tomato_late_blight',
  'tomato_leaf_curl',
  'tomato_healthy',
  'potato_early_blight',
  'potato_late_blight',
  'potato_healthy',
  'maize_common_rust',
  'maize_fall_armyworm',
  'maize_healthy',
  'rice_blast',
  'rice_brown_spot',
  'rice_healthy',
  'chilli_leaf_curl',
  'chilli_anthracnose',
  'chilli_healthy'
];

const solutionIds = [
  'sol_eb_organic_neem',
  'sol_eb_chemical_mancozeb',
  'sol_eb_preventive_mulch',
  'sol_lb_organic_copper',
  'sol_lb_chemical_metalaxyl',
  'sol_lb_preventive_drainage',
  'sol_tlc_organic_traps',
  'sol_tlc_chemical_imidacloprid',
  'sol_tlc_preventive_mesh',
  'sol_th_preventive_panchagavya',
  'sol_th_preventive_scouting',
  'sol_peb_organic_trichoderma',
  'sol_peb_chemical_chlorothalonil',
  'sol_peb_preventive_rotation',
  'sol_plb_organic_pseudomonas',
  'sol_plb_chemical_cymoxanil',
  'sol_plb_preventive_earthing',
  'sol_ph_organic_jeevamrutha',
  'sol_ph_preventive_monitoring',
  'sol_mcr_organic_sour_buttermilk',
  'sol_mcr_chemical_azoxystrobin',
  'sol_mcr_preventive_hybrid',
  'sol_faw_organic_sand_lime',
  'sol_faw_chemical_emamectin',
  'sol_faw_preventive_pheromone',
  'sol_mh_organic_compost',
  'sol_mh_preventive_weed',
  'sol_rb_organic_silicon',
  'sol_rb_chemical_tricyclazole',
  'sol_rb_preventive_nitrogen',
  'sol_rbs_organic_cow_urine',
  'sol_rbs_chemical_edifenphos',
  'sol_rbs_preventive_zinc',
  'sol_rh_organic_azolla',
  'sol_rh_preventive_water',
  'sol_clc_organic_dashaparni',
  'sol_clc_chemical_diafenthiuron',
  'sol_clc_preventive_border',
  'sol_can_organic_cow_dung',
  'sol_can_chemical_tebuconazole',
  'sol_can_preventive_spacing',
  'sol_ch_organic_waste_decomposer',
  'sol_ch_preventive_micronutrient'
];

const standardKeys = [
  'welcome',
  'choose_language',
  'nav_home',
  'nav_scan',
  'nav_dashboard',
  'nav_cost',
  'offline_ready',
  'voice_unavailable',
  'scan_tip',
  'err_blurry',
  'err_dark',
  'analyzing',
  'result_healthy',
  'result_detected',
  'result_low_conf',
  'scan_saved',
  'conf_high',
  'conf_medium',
  'conf_low',
  'risk_low',
  'risk_medium',
  'risk_high',
  'type_organic',
  'type_chemical',
  'type_preventive',
  'cost_cheapest',
  'cost_for_land',
  'rupees',
  'best_value',
  'disclaimer',
  'trend_improving',
  'trend_same',
  'trend_worse'
];

const allKeys = [...standardKeys];

diseases.forEach(d => {
  allKeys.push(`disease_${d}`);
});

solutionIds.forEach(s => {
  allKeys.push(`${s}_name`);
  allKeys.push(`${s}_steps`);
});

// A valid, compliant minimal silent MP3 file (MPEG-1 Audio Layer 3, 128 kbps, 44.1 kHz, stereo)
// Header: 0xFF 0xFB 0x90 0x64 (417 bytes frame)
function createSilentMp3Buffer() {
  const frameLength = 417;
  const numFrames = 4; // ~100ms silence
  const buffer = Buffer.alloc(frameLength * numFrames, 0);

  for (let f = 0; f < numFrames; f++) {
    const offset = f * frameLength;
    buffer[offset] = 0xFF;     // Sync
    buffer[offset + 1] = 0xFB; // MPEG-1 Layer 3, No CRC
    buffer[offset + 2] = 0x90; // 128kbps, 44100Hz
    buffer[offset + 3] = 0x64; // Stereo
  }
  return buffer;
}

const silentMp3 = createSilentMp3Buffer();

const languages = ['en', 'kn'];
const publicDir = path.resolve(__dirname, '../public');
const manifestPath = path.join(publicDir, 'audio-manifest.json');

// Write audio-manifest.json
fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(manifestPath, JSON.stringify({
  version: '1.0.0',
  languages,
  totalKeys: allKeys.length,
  keys: allKeys
}, null, 2));

console.log(`Audio manifest created with ${allKeys.length} keys.`);

// Generate files for each language
languages.forEach(lang => {
  const dir = path.join(publicDir, 'audio', lang);
  fs.mkdirSync(dir, { recursive: true });

  allKeys.forEach(key => {
    const filePath = path.join(dir, `${key}.mp3`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, silentMp3);
    }
  });
  console.log(`Generated ${allKeys.length} placeholder audio clips for [${lang}].`);
});
