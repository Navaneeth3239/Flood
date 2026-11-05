import { AssistantSource } from '@/types';

export interface MockAssistantResponse {
  keywords: string[];
  reply: {
    en: string;
    ta: string;
    hi: string;
  };
  sources: AssistantSource[];
}

export const mockAssistantResponses: MockAssistantResponse[] = [
  {
    keywords: ['evacuat', 'safe', 'shelter', 'protocol', 'protect', 'escape', 'route'],
    reply: {
      en: 'Based on official flood mitigation guidelines, if you are situated in a designated low-lying flood zone:\n\n1. Relocate immediately to assigned high-ground shelters before water ingress reaches road levels.\n2. Do NOT drive or walk through flooded streets—moving water with a depth of merely 15 cm can disrupt balance.\n3. Disconnect domestic electricity mains and gas cylinders before departure.\n4. Follow evacuation corridors designated by State Disaster Management Authorities.',
      ta: 'அதிகாரப்பூர்வ வெள்ள மேலாண்மை நெறிமுறைகளின்படி:\n\n1. நீர் குடியிருப்புக்குள் நுழைவதற்கு முன் உடனடியாக உயரமான பகுதி நிவாரண முகாம்களுக்குச் செல்லவும்.\n2. வெள்ள நீரில் நடக்கவோ அல்லது வாகனங்களை ஓட்டவோ வேண்டாம்.\n3. மின்சார மெயின் சுவிட்ச் மற்றும் எரிவாயு சிலிண்டர்களை அணைக்கவும்.\n4. பேரிடர் மேலாண்மை ஆணையத்தால் நியமிக்கப்பட்ட பாதுகாப்பு வழிகளைப் பின்பற்றவும்.',
      hi: 'आधिकारिक बाढ़ प्रबंधन दिशानिर्देशों के अनुसार:\n\n1. पानी बढ़ने से पहले तुरंत सुरक्षित राहत शिविरों में चले जाएं।\n2. बाढ़ के बहते पानी में चलने या गाड़ी चलाने का प्रयास न करें।\n3. निकलने से पहले मुख्य बिजली स्विच और गैस सिलेंडर बंद कर दें।\n4. आपदा प्रबंधन प्राधिकरण द्वारा निर्धारित निकासी मार्गों का पालन करें।',
    },
    sources: [
      {
        title: 'National Disaster Management Authority (NDMA) Flood Guidelines - Chapter 4',
        url: 'https://ndma.gov.in',
        excerpt: 'Standard operating procedures for community evacuation and high-ground sheltering in riparian inundation events.',
      },
      {
        title: 'Central Water Commission (CWC) Early Warning Operating Manual',
        url: 'https://cwc.gov.in',
        excerpt: 'Protocols regarding trigger levels for public evacuation warnings during high reservoir release.',
      },
    ],
  },
  {
    keywords: ['yamuna', 'delhi', 'level', 'status', 'bridge', 'water'],
    reply: {
      en: 'Current documented telemetry for Yamuna Old Railway Bridge (STN-YM-001) shows the water level has exceeded the Warning Mark of 205.8 meters and is hovering near 206.2 meters due to heavy upstream discharges from Hathnikund Barrage. The situation is classified under Danger severity. Please refer to official District Magistrate bulletins for evacuation orders.',
      ta: 'யமுனா பழைய ரயில்வே பாலம் நிலையத்தின் (STN-YM-001) தற்போதைய அளவீடு 206.2 மீட்டராக உயர்ந்துள்ளது, இது எச்சரிக்கை அளவான 205.8 மீட்டரை விட அதிகம். ஹத்னிகுண்ட் அணையிலிருந்து நீர் திறக்கப்படுவதால் இது ஏற்பட்டுள்ளது. அதிகாரப்பூர்வ மாவட்ட நிர்வாக அறிவிப்புகளைப் பின்பற்றவும்.',
      hi: 'यमुना ओल्ड रेलवे ब्रिज (STN-YM-001) का वर्तमान स्तर 206.2 मीटर तक पहुंच गया है, जो चेतावनी स्तर 205.8 मीटर से ऊपर है। हथिनीकुंड बैराज से पानी छोड़े जाने के कारण स्थिति संवेदनशील है। आधिकारिक ज़िला प्रशासन के बुलेटिन पर ध्यान दें।',
    },
    sources: [
      {
        title: 'Central Water Commission - Daily Flood Situation Report (Upper Yamuna)',
        url: 'https://cwc.gov.in',
        excerpt: 'Inflow at Hathnikund and gauge levels monitored at Old Railway Bridge hydrometric station.',
      },
    ],
  },
  {
    keywords: ['adyar', 'chennai', 'chembarambakkam', 'reservoir'],
    reply: {
      en: 'The Chembarambakkam Weir station (STN-ADY-001) on the Adyar River is currently registering heightened inflows following heavy convective precipitation in Kanchipuram and Tiruvallur catchments. Controlled surplus discharge is underway to regulate reservoir head. Low-lying riparian areas downstream (Saidapet, Jafferkhanpet, Kotturpuram) are advised to remain vigilant.',
      ta: 'அடையாறு ஆற்று பகுதியில் செம்பரம்பாக்கம் ஏரி நிலையத்தின் (STN-ADY-001) நீர்வரத்து அதிகரித்துள்ளது. நீர்மட்டத்தைக் கட்டுப்படுத்த உபரி நீர் வெளியேற்றப்பட்டு வருகிறது. அடையாறு ஆற்றுப்படுகை மக்கள் விழிப்புடன் இருக்குமாறு கேட்டுக்கொள்ளப்படுகிறார்கள்.',
      hi: 'अड्यार नदी पर चेम्बरमबक्कम वियर स्टेशन (STN-ADY-001) में भारी बारिश के बाद पानी की आवक बढ़ गई है। जलाशय के स्तर को नियंत्रित करने के लिए पानी छोड़ा जा रहा है। नदी किनारे के निचले इलाकों को सतर्क रहने की सलाह दी जाती है।',
    },
    sources: [
      {
        title: 'Water Resources Department (WRD) Tamil Nadu - Flood Control Cell',
        excerpt: 'Discharge bulletin and catchment precipitation reports for Chembarambakkam and Adyar sub-basins.',
      },
    ],
  },
];
