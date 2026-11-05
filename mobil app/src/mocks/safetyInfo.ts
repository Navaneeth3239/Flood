import { SafetyInfo } from '@/types';

// Mock safety info for development/demo testing when EXPO_PUBLIC_USE_MOCK_DATA=true.
export const mockSafetyInfo: SafetyInfo = {
  isOfficial: false, // Explicitly marked as prototype/mock per safety guidelines
  lastUpdated: new Date().toISOString(),
  emergencyContacts: [
    {
      id: 'CNT-01',
      name: 'National Emergency Response Helpline',
      department: 'Disaster Management Authority',
      phone: '112',
      alternativePhone: '1070',
      availableHours: '24/7 Toll-Free',
      isOfficial: true,
    },
    {
      id: 'CNT-02',
      name: 'Flood Control Room - Central Operations',
      department: 'State Emergency Operation Centre (SEOC)',
      phone: '1077',
      availableHours: '24/7 Emergency Line',
      isOfficial: true,
    },
    {
      id: 'CNT-03',
      name: 'Fire & Rescue Services',
      department: 'Emergency & Fire Rescue Department',
      phone: '101',
      availableHours: '24/7 Immediate Dispatch',
      isOfficial: true,
    },
    {
      id: 'CNT-04',
      name: 'Ambulance Emergency Medical Response',
      department: 'Emergency Medical Services',
      phone: '108',
      availableHours: '24/7 Medical Response',
      isOfficial: true,
    },
    {
      id: 'CNT-05',
      name: 'Municipal Drainage & Inundation Helpline',
      department: 'City Corporation Stormwater Division',
      phone: '1913',
      availableHours: 'Round-the-clock during monsoon',
      isOfficial: true,
    },
  ],
  instructions: [
    {
      id: 'INS-01',
      category: 'before',
      title: 'Before Flooding: Preparation & Protection',
      steps: [
        'Assemble an emergency kit with potable water, non-perishable food, flashlight, power bank, first aid, and critical medications.',
        'Keep essential documents, identity cards, and property deeds in a waterproof container.',
        'Identify high-ground evacuation points and nearest community relief shelters in your ward.',
        'Clear domestic drains and secure outdoor objects that could float and cause blockages.',
      ],
      officialSource: 'National Disaster Management Authority (NDMA)',
    },
    {
      id: 'INS-02',
      category: 'during',
      title: 'During Flooding: Critical Survival Actions',
      steps: [
        'Turn off main electricity switch and LPG gas valves immediately if water enters your premises.',
        'Never walk, swim, or drive through flowing water. Just 6 inches of moving water can knock down an adult; 12 inches can sweep away small cars.',
        'Stay clear of fallen electrical poles, sagging wires, and flooded transformers.',
        'Move to the highest floor or elevated terrain. Do not climb into closed attics where water can trap you.',
        'Follow verified instructions broadcast by local district magistrates and disaster relief forces.',
      ],
      officialSource: 'NDMA Flood Safety Protocol',
    },
    {
      id: 'INS-03',
      category: 'after',
      title: 'After Flooding: Recovery & Hygiene Precautions',
      steps: [
        'Return home only after authorities issue an official all-clear announcement.',
        'Do not touch electrical equipment or switches until certified dry and inspected by a qualified electrician.',
        'Boil all drinking water for at least 1 minute or use purification tablets to prevent waterborne diseases like cholera.',
        'Watch for venomous reptiles and insects that seek dry shelter in residences during flood recessions.',
        'Take timestamped photos of damage for insurance and official disaster compensation claims.',
      ],
      officialSource: 'State Disaster Management Guidelines',
    },
  ],
};
