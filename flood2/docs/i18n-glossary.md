# Multilingual i18n Hydrological Glossary (ബഹുഭാഷാ സാങ്കേതിക ശബ്ദകോശം)

This glossary documents the standard translations and terminological consistency rules for the **Smart Flood Monitoring and Early Warning System** across English, Tamil, Hindi, and Malayalam.

## Core Terminologies (പ്രധാന സാങ്കേതിക പദങ്ങൾ)

| Concept (English) | Malayalam (മലയാളം) | Tamil (தமிழ்) | Hindi (हिन्दी) | Guidelines / Context |
| :--- | :--- | :--- | :--- | :--- |
| **Flood** | വെള്ളപ്പൊക്കം | வெள்ளம் | बाढ़ | Refers to riverine or urban inundation. |
| **Water Level** | ജലനിരപ്പ് | நீர்மட்டம் | जल स्तर | Measured in meters (m) relative to gauge zero. |
| **Rainfall** | മഴ | மழை | वर्षा / बारिश | Measured in mm or mm/h. Unit stays in Latin script. |
| **Alert / Warning** | മുന്നറിയിപ്പ് | எச்சரிக்கை | चेतावनी / सतर्कता | Automated or manual threshold notification. |
| **Normal** | സാധാരണ നില | இயல்பு | सामान्य | Water level below watch mark. |
| **Watch** | നിരീക്ഷണം | கண்காணிப்பு | निगरानी | Level approaching threshold. |
| **Warning** | ജാഗ്രത | எச்சரிக்கை | चेतावनी | High inflow, preparedness alert. |
| **Danger** | അപകടനില | அபாயம் | ख़तरा | Evacuation threshold breached. |
| **Monitoring Station** | നിരീക്ഷണ കേന്ദ്രം / സ്റ്റേഷൻ | கண்காணிப்பு நிலையம் | निगरानी केंद्र / स्टेशन | IoT sensor node. "സ്റ്റേഷൻ" used in technical labels. |
| **Battery** | ബാറ്ററി | பேட்டரி | बैटरी | Hardware power percentage (%). |
| **Risk / Vulnerability** | അപകടസാധ്യത | இடர் / பாதிப்பு | जोखिम | Risk level classifications. |
| **Evacuation** | ഒഴിപ്പിക്കൽ | வெளியேற்றம் | निकासी | Moving residents to higher ground. |
| **River Basin** | നദീതടം | ஆற்றுப்படுகை | नदी बेसिन | Catchment area (e.g., Yamuna Basin, Kaveri Basin). |
| **Flow Rate / Discharge** | പ്രവാഹ നിരക്ക് | பாய்ச்சல் வேகம் | प्रवाह दर | Measured in cumecs (m³/s) or cusecs. |
| **Soil Moisture** | മണ്ണിന്റെ ഈർപ്പം | மண் ஈரப்பதம் | मिट्टी की नमी | Antecedent saturation percentage (%). |
| **Elevation** | സമുദ്രനിരപ്പിൽ നിന്നുള്ള ഉയരം | கடல் மட்ட உயரம் | समुद्र तल से ऊंचाई | Meters above mean sea level (MSL). |
| **Live Telemetry** | തത്സമയ ടെലിമെട്രി | நேரலை தொலைஅளவியல் | लाइव टेलीमेट्री | Streaming sensor readings. |
| **Demo Data** | ഡെമോ വിവരങ്ങൾ | மாதிரி தரவு | डेमो डेटा | Simulated data for demonstration and training. |
| **Illustrative / Simulated**| സാങ്കൽപ്പികം / ചിത്രീകരണത്തിന് | விளக்கப்பட மாதிரி | उदाहरणात्मक / सिमुलेटेड | Simulated GeoJSON polygons and 3D terrain meshes. |
| **Prediction** | എഐ പ്രവചനം | முன்கணிப்பு | पूर्वानुमान | Machine-learning hydrological forecast. |
| **Satellite Imagery** | ഉപഗ്രഹ ചിത്രങ്ങൾ | செயற்கைக்கோள் படங்கள் | उपग्रह चित्र | Sentinel/RISAT radar & optical rasters. |
| **Digital Elevation Model**| ഡിജിറ്റൽ എലവേഷൻ മോഡൽ (DEM) | டிஜிட்டல் உயர மாதிரி | डिजिटल एलिवेशन मॉडल | 3D topographical heightmap. |
| **System Health** | സിസ്റ്റം പ്രവർത്തനക്ഷമത | கணினி நலம் | सिस्टम स्वास्थ्य | Sensor and gateway diagnostic status. |

## Technical Units & Acronym Rules
1. Units (`mm`, `cm`, `m`, `mm/h`, `%`, `°C`, `dBm`, `cumecs`, `cusecs`) stay in Latin script for scientific clarity across all locales.
2. Protocols and standards (`LoRa`, `MQTT`, `GPS`, `GIS`, `API`, `WGS84`, `EPSG:4326`, `NDMA`, `CWC`, `SAR`, `DEM`) stay in Latin script or include standard transliteration in parentheses.
3. Numbers and dates adhere to `Intl.NumberFormat('ml-IN')` and `Intl.DateTimeFormat('ml-IN', { timeZone: 'Asia/Kolkata' })`.

## Review Status
- Malayalam (`ml`): **Implemented (pending native-speaker review)**
- Tamil (`ta`): Implemented
- Hindi (`hi`): Implemented
- English (`en`): Canonical Source

