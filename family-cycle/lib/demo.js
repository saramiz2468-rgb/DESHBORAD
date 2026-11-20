// נתוני הדגמה: נוצרים יחסית להיום, ומסומנים is_demo כדי שאפשר יהיה למחוק אותם בלחיצה.
import { addDays, sortByStart } from '../public/calc.js';

function buildCycles(today, lengths, bleeds, lastStartAgo, notes = {}) {
  // בונים אחורה מהמחזור האחרון
  const starts = [addDays(today, -lastStartAgo)];
  for (let i = lengths.length - 1; i >= 0; i--) starts.unshift(addDays(starts[0], -lengths[i]));
  return starts.map((start, i) => {
    const bleed = bleeds[i % bleeds.length];
    let end = bleed ? addDays(start, bleed - 1) : null;
    if (end && end > today) end = null; // מחזור שעוד לא הסתיים
    return { start, end, notes: notes[i] || '' };
  });
}

export function demoFamily(today) {
  return [
    {
      daughter: { name: 'נועה', birthDate: addDays(today, -Math.round(15.4 * 365.25)), color: 0 },
      cycles: buildCycles(today, [28, 29, 27, 30, 28, 29, 28], [5, 5, 6, 4, 5, 5, 6, 5], 12, {
        2: 'כאבי בטן ביום הראשון',
        6: 'מחזור קל',
      }),
    },
    {
      daughter: { name: 'מאיה', birthDate: addDays(today, -Math.round(13.1 * 365.25)), color: 2 },
      cycles: buildCycles(today, [34, 31], [4, 5, 6], 2, { 0: 'מחזור ראשון 🌸' }),
    },
    {
      daughter: { name: 'הדר', birthDate: addDays(today, -Math.round(11.2 * 365.25)), color: 4 },
      cycles: [],
    },
  ];
}

export function loadDemo(store, userId, today) {
  return store.tx(() => {
    for (const { daughter, cycles } of demoFamily(today)) {
      const id = store.createDaughter(userId, { ...daughter, photo: null }, true);
      for (const c of sortByStart(cycles)) store.createCycle(userId, id, c, true);
    }
  });
}
