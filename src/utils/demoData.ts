import { Expense, Group } from '../types';
import { calculateEqualSplit, calculateExactSplit, calculateSharesSplit } from './splitCalculator';
import { rupeesToPaise } from './formatCurrency';

export function getInitialDemoData(): { groups: Group[]; expenses: Expense[] } {
  const memberRahul = { id: 'm-rahul', name: 'Rahul Sharma', color: '#2563eb' };
  const memberAmit = { id: 'm-amit', name: 'Amit Verma', color: '#059669' };
  const memberSneha = { id: 'm-sneha', name: 'Sneha Patel', color: '#d97706' };
  const memberKaran = { id: 'm-karan', name: 'Karan Mehta', color: '#7c3aed' };

  const all4 = [memberRahul.id, memberAmit.id, memberSneha.id, memberKaran.id];

  const manaliGroup: Group = {
    id: 'grp-manali-trip',
    name: 'Manali Trip',
    emoji: '🏔️',
    description: 'College buddies mountain getaway & backpacking',
    members: [memberRahul, memberAmit, memberSneha, memberKaran],
    createdAt: '2026-10-20T09:00:00.000Z',
    updatedAt: '2026-10-28T18:30:00.000Z',
  };

  const hostelDev = { id: 'm-dev', name: 'Dev Joshi', color: '#0284c7' };
  const hostelVikas = { id: 'm-vikas', name: 'Vikas Nair', color: '#e11d48' };

  const hostelGroup: Group = {
    id: 'grp-room-214',
    name: 'Room 214',
    emoji: '🏠',
    description: 'Hostel roommates shared groceries & utilities',
    members: [memberRahul, hostelDev, hostelVikas],
    createdAt: '2026-10-01T12:00:00.000Z',
    updatedAt: '2026-10-27T14:15:00.000Z',
  };

  const manaliExpenses: Expense[] = [
    {
      id: 'exp-1',
      groupId: manaliGroup.id,
      description: 'Delhi to Manali Volvo Bus Tickets',
      amount: 6400,
      amountPaise: rupeesToPaise(6400),
      date: '2026-10-21',
      category: 'Travel',
      paidById: memberRahul.id,
      splitType: 'EQUAL',
      splits: calculateEqualSplit(rupeesToPaise(6400), all4),
      notes: 'HPTDC luxury semi-sleeper overnight bus tickets for 4',
      createdAt: '2026-10-21T07:30:00.000Z',
    },
    {
      id: 'exp-2',
      groupId: manaliGroup.id,
      description: 'Riverside Wood Cottage Booking (3 Nights)',
      amount: 12000,
      amountPaise: rupeesToPaise(12000),
      date: '2026-10-22',
      category: 'Stay',
      paidById: memberSneha.id,
      splitType: 'EQUAL',
      splits: calculateEqualSplit(rupeesToPaise(12000), all4),
      notes: 'Cottage near Old Manali river bank with mountain views',
      createdAt: '2026-10-22T14:00:00.000Z',
    },
    {
      id: 'exp-3',
      groupId: manaliGroup.id,
      description: 'Cafe 1947 & Old Manali Trout Dinner',
      amount: 3450,
      amountPaise: rupeesToPaise(3450),
      date: '2026-10-22',
      category: 'Food',
      paidById: memberAmit.id,
      splitType: 'EXACT',
      splits: calculateExactSplit(rupeesToPaise(3450), all4, {
        [memberRahul.id]: 850,
        [memberAmit.id]: 950,
        [memberSneha.id]: 750,
        [memberKaran.id]: 900,
      }).splits,
      notes: 'Woodfired pizza, grilled rainbow trout and pasta',
      createdAt: '2026-10-22T21:45:00.000Z',
    },
    {
      id: 'exp-4',
      groupId: manaliGroup.id,
      description: 'Solang Valley Paragliding & ATV Ride',
      amount: 7200,
      amountPaise: rupeesToPaise(7200),
      date: '2026-10-23',
      category: 'Travel',
      paidById: memberKaran.id,
      splitType: 'EQUAL',
      splits: calculateEqualSplit(rupeesToPaise(7200), [memberRahul.id, memberAmit.id, memberKaran.id]),
      notes: 'Sneha sat out due to altitude sickness; split among 3 flyers',
      createdAt: '2026-10-23T11:20:00.000Z',
    },
    {
      id: 'exp-5',
      groupId: manaliGroup.id,
      description: 'Hot Maggie, Omelettes & Chai at Rohtang Pass',
      amount: 480,
      amountPaise: rupeesToPaise(480),
      date: '2026-10-24',
      category: 'Food',
      paidById: memberRahul.id,
      splitType: 'EQUAL',
      splits: calculateEqualSplit(rupeesToPaise(480), all4),
      notes: 'Classic snowy Maggie shack pitstop',
      createdAt: '2026-10-24T13:10:00.000Z',
    },
    {
      id: 'exp-6',
      groupId: manaliGroup.id,
      description: 'Mall Road Woolen Shawls & Souvenirs',
      amount: 2800,
      amountPaise: rupeesToPaise(2800),
      date: '2026-10-24',
      category: 'Shopping',
      paidById: memberSneha.id,
      splitType: 'SHARES',
      splits: calculateSharesSplit(rupeesToPaise(2800), [memberRahul.id, memberSneha.id], {
        [memberRahul.id]: 1,
        [memberSneha.id]: 3,
      }).splits,
      notes: 'Sneha picked 3 shawls for family, Rahul picked 1 for mom',
      createdAt: '2026-10-24T18:00:00.000Z',
    },
    {
      id: 'exp-7',
      groupId: manaliGroup.id,
      description: 'Bonfire Barbeque & Local Apple Juice',
      amount: 1960,
      amountPaise: rupeesToPaise(1960),
      date: '2026-10-25',
      category: 'Food',
      paidById: memberAmit.id,
      splitType: 'EQUAL',
      splits: calculateEqualSplit(rupeesToPaise(1960), all4),
      notes: 'Wood logs, skewers, paneer tikka & chicken skewers',
      createdAt: '2026-10-25T20:30:00.000Z',
    },
    {
      id: 'exp-8',
      groupId: manaliGroup.id,
      description: '4x4 Gypsy Cab to Atal Tunnel & Sissu Falls',
      amount: 2400,
      amountPaise: rupeesToPaise(2400),
      date: '2026-10-26',
      category: 'Travel',
      paidById: memberKaran.id,
      splitType: 'EQUAL',
      splits: calculateEqualSplit(rupeesToPaise(2400), all4),
      notes: 'Day trip to Lahaul valley through the tunnel',
      createdAt: '2026-10-26T16:15:00.000Z',
    },
  ];

  const hostelExpenses: Expense[] = [
    {
      id: 'exp-h1',
      groupId: hostelGroup.id,
      description: 'High-Speed Fiber WiFi Bill',
      amount: 999,
      amountPaise: rupeesToPaise(999),
      date: '2026-10-05',
      category: 'Bills',
      paidById: memberRahul.id,
      splitType: 'EQUAL',
      splits: calculateEqualSplit(rupeesToPaise(999), [memberRahul.id, hostelDev.id, hostelVikas.id]),
      notes: 'Airtel Xstream 200 Mbps monthly pack',
      createdAt: '2026-10-05T10:00:00.000Z',
    },
    {
      id: 'exp-h2',
      groupId: hostelGroup.id,
      description: 'Monthly Groceries & Milk Supply',
      amount: 2450,
      amountPaise: rupeesToPaise(2450),
      date: '2026-10-15',
      category: 'Food',
      paidById: hostelDev.id,
      splitType: 'EQUAL',
      splits: calculateEqualSplit(rupeesToPaise(2450), [memberRahul.id, hostelDev.id, hostelVikas.id]),
      notes: 'Blinkit order: eggs, bread, tea, coffee, snacks',
      createdAt: '2026-10-15T19:00:00.000Z',
    },
  ];

  return {
    groups: [manaliGroup, hostelGroup],
    expenses: [...manaliExpenses, ...hostelExpenses],
  };
}
