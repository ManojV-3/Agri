# Translation Native-Speaker Review Notes

This document flags Kannada (kn-IN) and English translations added for the Krishi / CropCare village-level risk, early warning alerts, treatment feedback loop, and spread simulation features that should be reviewed and verified by an agricultural extension specialist or native Kannada agricultural translator.

## 1. Village Risk & Rupee Loss Estimation (`src/data/locales/kn.json` -> `villages`)

| English Key | English Text | Current Kannada Text | Reviewer Notes |
| :--- | :--- | :--- | :--- |
| `villages.layerTitle` | Village Risk & Rupee Loss Estimation | ಗ್ರಾಮ ಮಟ್ಟದ ಅಪಾಯ & ಆರ್ಥಿಕ ನಷ್ಟ ಅಂದಾಜು | Check if "ಅಪಾಯ ಮಟ್ಟ" or "ರೋಗ ಬಾಧೆಯ ಅಪಾಯ" is more customary for agricultural extension. |
| `villages.riskCritical` | Critical Risk | ಅಪಾಯಕಾರಿ (ಕ್ರಿಟಿಕಲ್) | Standard Kannada term is "ತೀವ್ರ ತುರ್ತು ಅಪಾಯ" or "ಅಪಾಯಕಾರಿ". |
| `villages.lossUntreated` | Estimated loss if untreated | ಔಷಧ ಸಿಂಪಡಿಸದಿದ್ದರೆ ಅಂದಾಜು ನಷ್ಟ | Translates "untreated" as "without spraying medicine". Verify if "ಚಿಕಿತ್ಸೆ ನೀಡದಿದ್ದಲ್ಲಿ" is preferred in North Karnataka dialects. |
| `villages.lossTreated` | Estimated loss if treated early | ಮುಂಚಿತವಾಗಿ ಚಿಕಿತ್ಸೆ ನೀಡಿದರೆ ಅಂದಾಜು ನಷ್ಟ | Accurate agronomic phrase for early prophylactic intervention. |
| `villages.guntasUnit` | Guntas (40 Guntas = 1 Acre) | ಗುಂಟೆ (೪೦ ಗುಂಟೆ = ೧ ಎಕರೆ) | Traditional South Indian land measurement unit (1 Gunta = 1,089 sq ft; 40 Guntas = 1 Acre). |
| `villages.yieldPerAcre` | Average Yield per Acre | ಎಕರೆಗೆ ಸರಾಸರಿ ಇಳುವರಿ | Grammatically correct and commonly understood by farmers. |
| `villages.marketPrice` | Market Price per Quintal | ಕ್ವಿಂಟಾಲ್ ಮಾರುಕಟ್ಟೆ ಬೆಲೆ | APMC standard terminology. |

## 2. Farmer-Facing Village Alerts (`src/data/locales/kn.json` -> `alerts`)

| English Key | English Text | Current Kannada Text | Reviewer Notes |
| :--- | :--- | :--- | :--- |
| `alerts.activeAlertTitle` | Active Early Warning Alert | ಸಕ್ರಿಯ ಮುನ್ನೆಚ್ಚರಿಕೆ ಸಂದೇಶ | Native phrase. |
| `alerts.disclaimer` | Consult your local agriculture officer before applying any chemical. | ಯಾವುದೇ ರಾಸಾಯನಿಕ ಸಿಂಪಡಿಸುವ ಮೊದಲು ನಿಮ್ಮ ಸ್ಥಳೀಯ ಕೃಷಿ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ. | Mandatory regulatory phrasing as required by government guidelines. |
| `alerts.kisanCallCentre` | Kisan Call Centre Helpline: 1800-180-1551 (Toll-Free) | ಕಿಸಾನ್ ಕಾಲ್ ಸೆಂಟರ್ ಸಹಾಯವಾಣಿ: 1800-180-1551 (ಉಚಿತ ಕರೆ) | Official Central Government helpline. |

## 3. Treatment Feedback Loop (`src/data/locales/kn.json` -> `feedback`)

| English Key | English Text | Current Kannada Text | Reviewer Notes |
| :--- | :--- | :--- | :--- |
| `feedback.remindCheck` | Remind me to check again in 7 days | ೭ ದಿನಗಳ ನಂತರ ಪರಿಶೀಲಿಸಲು ನೆನಪಿಸಿ | Simple and clear for phone UI. |
| `feedback.improved` | Improved | ಗುಣಮುಖವಾಗಿದೆ | In agronomy "ಚೇತರಿಸಿಕೊಂಡಿದೆ" (recovered) or "ಗುಣಮುಖವಾಗಿದೆ" (cured) are both used. Verify preference. |
| `feedback.noChange` | No change | ಯಾವುದೇ ಬದಲಾವಣೆ ಇಲ್ಲ | Simple and clear. |
| `feedback.worse` | Worse | ರೋಗ ಉಲ್ಬಣಿಸಿದೆ | Traditional term for aggravated crop disease. |

## 4. Spread Forecast (`src/data/locales/kn.json` -> `spread`)

| English Key | English Text | Current Kannada Text | Reviewer Notes |
| :--- | :--- | :--- | :--- |
| `spread.disclaimer` | Simplified forecast for guidance, not a scientific prediction | ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ಸರಳೀಕೃತ ಮುನ್ಸೂಚನೆ, ಇದು ವೈಜ್ಞಾನಿಕ ಅಂತಿಮ ತೀರ್ಪಲ್ಲ | Clear disclaimer to protect user expectations. |

## 5. Satellite Hotspot Map (`src/data/locales/kn.json` -> `mapHotspots`)

| English Key | English Text | Current Kannada Text | Reviewer Notes |
| :--- | :--- | :--- | :--- |
| `mapHotspots.backgroundNote` | Satellite image is the background map only. Outbreak locations come from farmer leaf scans. | ಉಪಗ್ರಹ ಚಿತ್ರವು ಹಿನ್ನೆಲೆ ನಕ್ಷೆ ಮಾತ್ರವಾಗಿದೆ. ರೋಗ ಹರಡುವ ಸ್ಥಳಗಳು ರೈತರ ಎಲೆ ಸ್ಕ್ಯಾನ್‌ಗಳಿಂದ ಬಂದಿವೆ. | Explicit mandatory disclaimer ensuring farmers understand satellite imagery is background only. |
| `mapHotspots.noHotspotsFound` | No spreading outbreaks found | ಯಾವುದೇ ಹರಡುವ ರೋಗ ಕೇಂದ್ರಗಳು ಕಂಡುಬಂದಿಲ್ಲ | Accurate message displayed when filtered criteria yields zero hotspots. |
| `mapHotspots.risingIndicator` | Pulsing marker = Rising outbreak (this week > last week) | ಮಿಣುಕುವ ಬಿಂದು = ವೇಗವಾಗಿ ಹೆಚ್ಚುತ್ತಿರುವ ರೋಗ (ಈ ವಾರ > ಕಳೆದ ವಾರ) | Clear legend explanation for farmers. |
| `mapHotspots.hiddenNotice` | Isolated cases (< 5 cases or no weekly growth) are hidden automatically. | ಪ್ರತ್ಯೇಕ ಒಂಟಿ ಪ್ರಕರಣಗಳು (೫ಕ್ಕಿಂತ ಕಡಿಮೆ ಅಥವಾ ಹೆಚ್ಚಳವಿಲ್ಲದವು) ನಕ್ಷೆಯಿಂದ ಮರೆಮಾಡಲ್ಪಟ್ಟಿವೆ. | Transparency explaining why single scans do not show up as spreading hotspots. |

---
*Created on 2026-11-05 for Krishi Agricultural Platform.*
