import { EmergencyContact, SafetyInstruction } from '@/types';

export const mockEmergencyContacts: EmergencyContact[] = [
  {
    id: 'CNT-01',
    name: 'National Disaster Response Force (NDRF) HQ',
    department: 'Ministry of Home Affairs, Govt of India',
    phone: '1078 / 011-24363260',
    alternativePhone: '9711077372',
    availableHours: '24/7 National Emergency Operations Control',
    isOfficial: true,
  },
  {
    id: 'CNT-02',
    name: 'State Emergency Operations Centre (SEOC)',
    department: 'Disaster Management Authority',
    phone: '1070',
    alternativePhone: '044-28593990',
    availableHours: '24/7 Flood Control & Evacuation Dispatch',
    isOfficial: true,
  },
  {
    id: 'CNT-03',
    name: 'District Collectorate Flood Taskforce',
    department: 'Revenue & Disaster Relief Administration',
    phone: '1077',
    availableHours: '24/7 Zonal Relief Coordination',
    isOfficial: true,
  },
  {
    id: 'CNT-04',
    name: 'Fire & Rescue Emergency Helpline',
    department: 'State Fire and Rescue Services',
    phone: '101 / 112',
    availableHours: 'Immediate Rescue & Boat Evacuation',
    isOfficial: true,
  },
];

export const mockSafetyInstructions: SafetyInstruction[] = [
  {
    id: 'INS-01',
    category: 'before',
    title: 'Pre-Inundation Preparedness Protocols',
    officialSource: 'National Disaster Management Guidelines (Flood Mitigation Manual)',
    steps: [
      'Keep an emergency grab-bag ready: valid photo IDs, potable water purification tablets, dry rations, first-aid kit, waterproof torch, and battery power bank.',
      'Identify designated high-ground flood shelters and safe evacuation routes mapped by local authorities.',
      'Secure domestic livestock, elevate electrical appliances at least 1.5 meters above ground level, and disconnect main circuit breakers before floodwaters enter premises.',
      'Do not store inflammable or toxic chemicals in ground-floor or basement storage areas.',
    ],
  },
  {
    id: 'INS-02',
    category: 'during',
    title: 'Active Flood Inundation Safety Protocols',
    officialSource: 'State Disaster Response Directive & CWC Operational Protocol',
    steps: [
      'NEVER attempt to walk, swim, or drive through moving floodwaters. Just 15 cm (6 inches) of rapid water can knock a person down; 30 cm can float passenger vehicles.',
      'Stay away from submerged power poles, electrical transformer boxes, and downed transmission cables to prevent electrocution.',
      'If stranded inside a rising-water building, move to the top floor or terrace; do not climb into enclosed attics unless an exterior roof escape hatch is present.',
      'Continuously monitor official government broadcasts over battery-powered or hand-crank radios.',
    ],
  },
  {
    id: 'INS-03',
    category: 'after',
    title: 'Post-Flood Recovery & Sanitation Protocols',
    officialSource: 'Public Health Sanitation Guidelines for Flooded Zones',
    steps: [
      'Boil all drinking water vigorously for a minimum of 2 minutes or use certified chlorine purification tablets prior to consumption.',
      'Beware of displaced reptiles, rodents, and venomous insects that seek dry refuge in residential structures.',
      'Have licensed electrical contractors inspect breaker panels and meter connections before turning electrical mains back on.',
      'Disinfect all walls, floors, and submerged surfaces with bleaching powder or sodium hypochlorite solution to prevent water-borne pathogen outbreaks.',
    ],
  },
];
