// Curated virtual prediction events (event contracts) per market — doc §11.
// No money, community votes only. `id` is stable so votes persist across edits.
export const PREDICTION_EVENTS = {
  SA: [
    { id: 'sa-aramco-q2', q: 'Will Aramco beat Q2 2026 EPS consensus?', options: ['Beat', 'In-line', 'Miss'], close: '2026-08-15' },
    { id: 'sa-sama-sep', q: 'What does SAMA do at the September 2026 meeting?', options: ['Cut 25bps', 'Cut 50bps', 'Hold', 'Hike'], close: '2026-09-30' },
    { id: 'sa-tasi-q3', q: 'Where does TASI close Q3 2026?', options: ['Above 12,000', '11,000–12,000', 'Below 11,000'], close: '2026-09-30' },
  ],
  AE: [
    { id: 'ae-dfm-q3', q: 'Where does the DFM index close Q3 2026?', options: ['Above 5,500', '5,000–5,500', 'Below 5,000'], close: '2026-09-30' },
    { id: 'ae-dld-q3', q: 'Do Dubai property transactions keep growing YoY in Q3?', options: ['Yes', 'No'], close: '2026-09-30' },
  ],
  EG: [
    { id: 'eg-egp-ye', q: 'Is USD/EGP below 50 at year-end 2026?', options: ['Yes (<50)', 'No (>50)'], close: '2026-12-31' },
    { id: 'eg-cbe-q3', q: 'Does the CBE cut rates again in Q3 2026?', options: ['Yes', 'No'], close: '2026-09-30' },
  ],
};
