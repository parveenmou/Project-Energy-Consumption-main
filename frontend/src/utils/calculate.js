export const LIGHT_TYPES = [
  { type: 'LED Bulb',           watts: 9  },
  { type: 'CFL Bulb',           watts: 14 },
  { type: 'LED Tube Light',     watts: 18 },
  { type: 'Fluorescent Tube',   watts: 36 },
  { type: 'Incandescent Bulb',  watts: 60 },
  { type: 'Halogen',            watts: 50 },
]

export const APPLIANCE_LIBRARY = [
  { id: 'ac_1t',    name: 'AC (1 Ton)',           icon: '❄️',  watts: 1000, category: 'Cooling',       defaultHours: 8  },
  { id: 'ac_15t',   name: 'AC (1.5 Ton)',          icon: '❄️',  watts: 1500, category: 'Cooling',       defaultHours: 8  },
  { id: 'ac_2t',    name: 'AC (2 Ton)',             icon: '❄️',  watts: 2000, category: 'Cooling',       defaultHours: 8  },
  { id: 'fan',      name: 'Ceiling Fan',            icon: '🌀',  watts: 75,   category: 'Cooling',       defaultHours: 10 },
  { id: 'cooler',   name: 'Air Cooler',             icon: '💨',  watts: 200,  category: 'Cooling',       defaultHours: 8  },
  { id: 'fridge',   name: 'Refrigerator',           icon: '🧊',  watts: 150,  category: 'Kitchen',       defaultHours: 24 },
  { id: 'micro',    name: 'Microwave',              icon: '📡',  watts: 1000, category: 'Kitchen',       defaultHours: 1  },
  { id: 'oven',     name: 'Electric Oven',          icon: '🔥',  watts: 2150, category: 'Kitchen',       defaultHours: 1  },
  { id: 'mixer',    name: 'Mixer / Grinder',        icon: '🔄',  watts: 750,  category: 'Kitchen',       defaultHours: 0.5},
  { id: 'dishwash', name: 'Dishwasher',             icon: '🍽️',  watts: 1800, category: 'Kitchen',       defaultHours: 1  },
  { id: 'tv32',     name: 'TV (32")',               icon: '📺',  watts: 60,   category: 'Entertainment', defaultHours: 5  },
  { id: 'tv55',     name: 'TV (55"+)',              icon: '📺',  watts: 150,  category: 'Entertainment', defaultHours: 5  },
  { id: 'desktop',  name: 'Desktop PC',             icon: '🖥️',  watts: 200,  category: 'Entertainment', defaultHours: 6  },
  { id: 'laptop',   name: 'Laptop',                 icon: '💻',  watts: 50,   category: 'Entertainment', defaultHours: 6  },
  { id: 'router',   name: 'WiFi Router',            icon: '📶',  watts: 10,   category: 'Entertainment', defaultHours: 24 },
  { id: 'washing',  name: 'Washing Machine',        icon: '🫧',  watts: 500,  category: 'Laundry',       defaultHours: 1  },
  { id: 'dryer',    name: 'Clothes Dryer',          icon: '♨️',  watts: 3000, category: 'Laundry',       defaultHours: 1  },
  { id: 'iron',     name: 'Clothes Iron',           icon: '👔',  watts: 1000, category: 'Laundry',       defaultHours: 0.5},
  { id: 'geyser',   name: 'Water Heater / Geyser',  icon: '🚿',  watts: 2000, category: 'Water',         defaultHours: 1  },
  { id: 'pump',     name: 'Water Pump',              icon: '💧',  watts: 750,  category: 'Water',         defaultHours: 1  },
]

export const CATEGORIES = [...new Set(APPLIANCE_LIBRARY.map(a => a.category))]

// Typical hours each category is active (for hourly profile generation)
const CATEGORY_HOURS = {
  Cooling:       [9,10,11,12,13,14,15,16,17,18,19,20,21],
  Kitchen:       [7,8,12,13,18,19,20],
  Entertainment: [8,9,10,18,19,20,21,22,23],
  Laundry:       [8,9,10,11],
  Water:         [6,7,18,19],
  Lighting:      [6,7,18,19,20,21,22],
}

export function calculate(rooms, appliances, rate) {
  let lightingWh = 0
  const roomBreakdown = rooms.map(r => {
    const lt = LIGHT_TYPES.find(l => l.type === r.type) ?? LIGHT_TYPES[0]
    const wh = lt.watts * r.count * r.hours
    lightingWh += wh
    return { ...r, dailyWh: wh, dailyKwh: wh / 1000 }
  })

  let appliancesWh = 0
  const activeAppliances = appliances.filter(a => a.enabled)
  activeAppliances.forEach(a => { appliancesWh += a.watts * a.count * a.hours })

  const totalDailyWh  = lightingWh + appliancesWh
  const dailyKwh      = totalDailyWh / 1000
  const monthlyKwh    = dailyKwh * 30
  const monthlyCost   = monthlyKwh * rate

  // Category totals (includes Lighting as its own category)
  const catMap = {}
  activeAppliances.forEach(a => {
    catMap[a.category] = (catMap[a.category] ?? 0) + a.watts * a.count * a.hours
  })
  if (lightingWh > 0) catMap['Lighting'] = lightingWh

  const categories = Object.entries(catMap)
    .map(([name, wh]) => ({ name, dailyKwh: +(wh / 1000).toFixed(3), monthlyKwh: +(wh * 30 / 1000).toFixed(1), monthlyCost: +(wh * 30 * rate / 1000).toFixed(0) }))
    .sort((a, b) => b.dailyKwh - a.dailyKwh)

  // Per-appliance breakdown (sorted by consumption)
  const appBreakdown = activeAppliances
    .map(a => ({ ...a, dailyWh: a.watts * a.count * a.hours, dailyKwh: +(a.watts * a.count * a.hours / 1000).toFixed(3) }))
    .sort((a, b) => b.dailyWh - a.dailyWh)

  const biggest = appBreakdown[0] ?? (lightingWh > 0 ? { name: 'Lighting', icon: '💡', dailyKwh: +(lightingWh / 1000).toFixed(2) } : null)

  return {
    dailyKwh: +dailyKwh.toFixed(3),
    monthlyKwh: +monthlyKwh.toFixed(1),
    monthlyCost: +monthlyCost.toFixed(0),
    lightingWh, appliancesWh, totalDailyWh,
    lightingPct:   totalDailyWh > 0 ? +((lightingWh   / totalDailyWh) * 100).toFixed(1) : 0,
    appliancesPct: totalDailyWh > 0 ? +((appliancesWh / totalDailyWh) * 100).toFixed(1) : 0,
    categories,
    appBreakdown,
    roomBreakdown,
    biggestConsumer: biggest ? `${biggest.icon} ${biggest.name}` : '—',
    biggestConsumerKwh: biggest?.dailyKwh ?? 0,
  }
}

export function generateHourlyProfile(appBreakdown, lightingWh) {
  const hourly = new Array(24).fill(0)

  appBreakdown.forEach(a => {
    const hours = CATEGORY_HOURS[a.category] ?? Array.from({ length: 24 }, (_, i) => i)
    const whPerSlot = a.dailyWh / hours.length
    hours.forEach(h => { hourly[h] += whPerSlot })
  })

  const lightHours = CATEGORY_HOURS.Lighting
  const lightPerSlot = lightingWh / lightHours.length
  lightHours.forEach(h => { hourly[h] += lightPerSlot })

  return hourly.map((wh, h) => ({ hour: h, energy: +(wh / 1000).toFixed(3) }))
}

export function generateSavingsTips(results, rooms) {
  const tips = []

  // Non-LED lights tip
  const nonLED = rooms.filter(r => !r.type.includes('LED'))
  if (nonLED.length > 0) {
    const saving = nonLED.reduce((s, r) => {
      const cur = LIGHT_TYPES.find(l => l.type === r.type)?.watts ?? 60
      const led = 9
      return s + (cur - led) * r.count * r.hours * 30 / 1000
    }, 0)
    tips.push({ icon: '💡', title: 'Switch to LED Bulbs', desc: `Replacing ${nonLED.map(r => r.name).join(', ')} with LED could save ~${saving.toFixed(1)} kWh/month` })
  }

  // Multiple AC tip
  const acs = results.appBreakdown.filter(a => a.category === 'Cooling' && a.id?.startsWith('ac'))
  if (acs.length > 0 && acs.reduce((s, a) => s + a.count, 0) > 2) {
    tips.push({ icon: '❄️', title: 'Reduce AC Hours', desc: 'Every 1 hour less of AC use saves ~' + ((acs[0].watts * acs.reduce((s,a)=>s+a.count,0)) / 1000 * 30).toFixed(0) + ' kWh/month' })
  }

  // Geyser tip
  const geyser = results.appBreakdown.find(a => a.id === 'geyser')
  if (geyser && geyser.hours > 1) {
    tips.push({ icon: '🚿', title: 'Reduce Geyser Time', desc: `Running geyser ${geyser.hours}h/day uses ${geyser.dailyKwh.toFixed(1)} kWh/day. Try reducing to 30–45 min.` })
  }

  // High cost tip
  if (results.monthlyCost > 2000) {
    tips.push({ icon: '📊', title: 'High Monthly Bill', desc: `Your estimated bill of ₹${results.monthlyCost} is above average. Cooling accounts for ${results.categories.find(c=>c.name==='Cooling')?.monthlyCost ?? 0}` })
  }

  if (tips.length === 0) {
    tips.push({ icon: '✅', title: 'Good Energy Habits', desc: 'Your setup looks efficient! Keep using LED lights and limit AC/geyser hours for best results.' })
  }

  return tips
}
