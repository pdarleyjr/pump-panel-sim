/**
 * Training overlay content definitions
 * Provides educational content for failure scenarios and training tips
 */

export type OverlayType = 'critical' | 'warning' | 'info' | 'tip';

export interface OverlayContent {
  id: string;
  type: OverlayType;
  title: string;
  icon?: string;
  sections: {
    label: string;
    items: string[];
  }[];
  dismissable: boolean;
  pauseSimulation?: boolean;
}

/**
 * Cavitation failure overlay
 */
export const CAVITATION_OVERLAY: OverlayContent = {
  id: 'cavitation',
  type: 'critical',
  title: 'CAVITATION DETECTED',
  icon: '⚠️',
  sections: [
    {
      label: 'What is Cavitation?',
      items: [
        'Cavitation occurs when water pressure drops below vapor pressure, forming bubbles',
        'These bubbles collapse violently, causing noise, vibration, and pump damage',
        'Can destroy impeller and pump housing if not corrected immediately'
      ]
    },
    {
      label: 'Symptoms',
      items: [
        'Loss of discharge pressure',
        'Grinding or rattling noise from pump',
        'Reduced flow rate',
        'Pump vibration'
      ]
    },
    {
      label: 'Common Causes',
      items: [
        'Insufficient intake pressure (below 20 PSI)',
        'Clogged or partially closed intake valve',
        'Tank-to-pump valve not fully open',
        'Excessive discharge flow for available supply',
        'Air leaks in intake system'
      ]
    },
    {
      label: 'Solutions',
      items: [
        '✓ Check tank-to-pump valve is fully open',
        '✓ Verify adequate water supply pressure',
        '✓ Reduce discharge flow by closing valves',
        '✓ Increase intake pressure if using hydrant',
        '✓ Check for air leaks in intake connections',
        '✓ Reduce engine RPM to lower demand'
      ]
    }
  ],
  dismissable: true,
  pauseSimulation: false
};

/**
 * Overpressure warning overlay
 */
export const OVERPRESSURE_OVERLAY: OverlayContent = {
  id: 'overpressure',
  type: 'critical',
  title: 'OVERPRESSURE WARNING',
  icon: '🔴',
  sections: [
    {
      label: 'Danger',
      items: [
        'Discharge pressure exceeds safe limits (>400 PSI)',
        'Risk of hose burst and equipment damage',
        'Safety hazard to personnel',
        'Potential for water hammer effects'
      ]
    },
    {
      label: 'Common Causes',
      items: [
        'Excessive engine RPM',
        'Discharge valves closed or partially closed',
        'Discharge Relief Valve (DRV) not engaged',
        'Governor in RPM mode during pressure buildup',
        'Water hammer from rapid valve closure'
      ]
    },
    {
      label: 'Immediate Actions Required',
      items: [
        '🚨 Reduce engine RPM immediately',
        '🚨 Open discharge valves to relieve pressure',
        '🚨 Engage Discharge Relief Valve (DRV)',
        '🚨 Switch governor to PRESSURE mode',
        '🚨 Verify DRV setpoint is appropriate (200-250 PSI)',
        '🚨 Monitor pressure gauge continuously'
      ]
    }
  ],
  dismissable: true,
  pauseSimulation: false
};

/**
 * Overheating warning overlay
 */
export const OVERHEATING_OVERLAY: OverlayContent = {
  id: 'overheating',
  type: 'warning',
  title: 'OVERHEATING WARNING',
  icon: '🔥',
  sections: [
    {
      label: 'Temperature Alert',
      items: [
        'Pump or engine temperature exceeds safe operating range',
        'Pump temperature above 250°F',
        'Engine temperature above 230°F',
        'Risk of equipment damage if not corrected'
      ]
    },
    {
      label: 'Symptoms',
      items: [
        'Temperature gauge in red zone',
        'Warning indicators illuminated',
        'Steam or vapor from pump area',
        'Decreased pump performance'
      ]
    },
    {
      label: 'Common Causes',
      items: [
        'Insufficient cooling water flow',
        'Prolonged operation at high RPM',
        'Low water level in tank',
        'Tank fill/recirculation valve closed',
        'Restricted coolant flow',
        'Operating pump dry or at low flow'
      ]
    },
    {
      label: 'Corrective Actions',
      items: [
        '✓ Activate tank-to-pump recirculation (33-50%)',
        '✓ Reduce engine RPM to idle or low speed',
        '✓ Open discharge lines for cooling flow',
        '✓ Check water supply and level',
        '✓ Verify coolant circulation',
        '✓ Allow pump to cool before resuming high-load operations'
      ]
    }
  ],
  dismissable: true,
  pauseSimulation: false
};

/**
 * Tank empty warning overlay
 */
export const TANK_EMPTY_OVERLAY: OverlayContent = {
  id: 'tank_empty',
  type: 'warning',
  title: 'TANK WATER DEPLETED',
  icon: '💧',
  sections: [
    {
      label: 'Water Supply Exhausted',
      items: [
        'Onboard water tank is empty or critically low',
        'Loss of pump prime imminent',
        'No water supply available from tank'
      ]
    },
    {
      label: 'Immediate Impact',
      items: [
        'Pump will lose prime and suction',
        'Discharge pressure will drop to zero',
        'Risk of pump damage from running dry',
        'Operations cannot continue from tank'
      ]
    },
    {
      label: 'Required Actions',
      items: [
        '🚨 Switch to hydrant supply immediately',
        '🚨 Close tank-to-pump valve',
        '🚨 Open hydrant intake valve',
        '🚨 Begin tank fill operation if water available',
        '🚨 Reduce discharge flow if switching sources',
        '⚠️  DO NOT operate pump dry (severe damage risk)'
      ]
    }
  ],
  dismissable: true,
  pauseSimulation: false
};

/**
 * Hose burst emergency overlay
 */
export const HOSE_BURST_OVERLAY: OverlayContent = {
  id: 'hose_burst',
  type: 'critical',
  title: 'HOSE BURST EVENT',
  icon: '💥',
  sections: [
    {
      label: 'Emergency Situation',
      items: [
        'Discharge line has failed due to excessive pressure',
        'Equipment damage and potential safety hazard',
        'Water flow and pressure lost on affected line',
        'Immediate action required'
      ]
    },
    {
      label: 'Emergency Actions',
      items: [
        '🚨 Close affected discharge valve IMMEDIATELY',
        '🚨 Reduce discharge pressure below 300 PSI',
        '🚨 Inspect remaining lines for damage or stress',
        '🚨 Notify personnel of equipment failure',
        '🚨 Switch to alternate discharge lines',
        '🚨 Document incident for equipment report'
      ]
    },
    {
      label: 'Prevention',
      items: [
        'Always engage DRV before building pressure',
        'Monitor discharge pressure continuously',
        'Keep pressure within safe operating range (100-300 PSI)',
        'Inspect hoses regularly for wear and damage',
        'Use pressure governor mode for automatic control',
        'Avoid rapid throttle changes'
      ]
    }
  ],
  dismissable: true,
  pauseSimulation: true
};

/**
 * Preventive training tips
 */
export const TRAINING_TIPS: OverlayContent[] = [
  {
    id: 'tip_intake_monitoring',
    type: 'tip',
    title: 'Training Tip',
    icon: '💡',
    sections: [
      {
        label: 'Best Practice',
        items: [
          'Monitor intake pressure continuously to prevent cavitation',
          'Maintain minimum 20 PSI intake pressure during operations',
          'Watch for pressure drops that indicate supply issues'
        ]
      }
    ],
    dismissable: true
  },
  {
    id: 'tip_drv_engagement',
    type: 'tip',
    title: 'Safety Reminder',
    icon: '💡',
    sections: [
      {
        label: 'Discharge Relief Valve (DRV)',
        items: [
          'Always engage DRV before building pressure',
          'Set DRV to 200-250 PSI for typical operations',
          'DRV protects against dangerous pressure surges',
          'Verify DRV is functioning during startup checks'
        ]
      }
    ],
    dismissable: true
  },
  {
    id: 'tip_pressure_range',
    type: 'tip',
    title: 'Optimal Performance',
    icon: '💡',
    sections: [
      {
        label: 'Pressure Guidelines',
        items: [
          'Keep discharge pressure 100-250 PSI for optimal performance',
          'Higher pressure increases friction loss and hose stress',
          'Lower pressure may not provide adequate nozzle flow',
          'Use pressure governor mode for automatic regulation'
        ]
      }
    ],
    dismissable: true
  },
  {
    id: 'tip_cooling',
    type: 'tip',
    title: 'Pump Cooling',
    icon: '💡',
    sections: [
      {
        label: 'Prevent Overheating',
        items: [
          'Open tank fill/recirc valve to 33% during sustained operations',
          'Ensure continuous water flow through pump',
          'Never run pump dry or at zero flow',
          'Monitor temperature gauges regularly'
        ]
      }
    ],
    dismissable: true
  }
];

/**
 * Get overlay content by ID
 */
export function getOverlayContent(id: string): OverlayContent | undefined {
  const allOverlays = [
    CAVITATION_OVERLAY,
    OVERPRESSURE_OVERLAY,
    OVERHEATING_OVERLAY,
    TANK_EMPTY_OVERLAY,
    HOSE_BURST_OVERLAY,
    ...TRAINING_TIPS
  ];
  
  return allOverlays.find(overlay => overlay.id === id);
}

/**
 * Get all available overlay IDs
 */
export function getAllOverlayIds(): string[] {
  return [
    CAVITATION_OVERLAY.id,
    OVERPRESSURE_OVERLAY.id,
    OVERHEATING_OVERLAY.id,
    TANK_EMPTY_OVERLAY.id,
    HOSE_BURST_OVERLAY.id,
    ...TRAINING_TIPS.map(tip => tip.id)
  ];
}