import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useHolidays(year) {
  const [holidays, setHolidays] = useState([])

  useEffect(() => {
    if (!year) return
    fetchHolidays(year)
  }, [year])

  async function fetchHolidays(y) {
    // First try the local cache in Supabase
    const { data: cached } = await supabase
      .from('holidays')
      .select('*')
      .eq('country_code', 'BG')
      .eq('year', y)

    if (cached && cached.length > 0) {
      setHolidays(cached)
      return
    }

    // Fallback: hardcoded BG public holidays (always reliable, no API key needed)
    const bgHolidays = getBgHolidays(y)
    setHolidays(bgHolidays)

    // Cache them in Supabase for future use
    await supabase.from('holidays').upsert(
      bgHolidays.map(h => ({ ...h, year: y, country_code: 'BG' })),
      { onConflict: 'country_code,year,date,name' }
    )
  }

  return { holidays }
}

function getBgHolidays(year) {
  return [
    { date: `${year}-01-01`, name: 'Нова година', name_bg: 'Нова година', type: 'national' },
    { date: `${year}-03-03`, name: 'Национален празник – Освобождение', name_bg: 'Освобождение на България', type: 'national' },
    { date: `${year}-05-01`, name: 'Ден на труда', name_bg: 'Ден на труда', type: 'national' },
    { date: `${year}-05-06`, name: 'Гергьовден', name_bg: 'Гергьовден / Ден на храбростта', type: 'national' },
    { date: `${year}-05-24`, name: 'Ден на просветата', name_bg: 'Ден на Кирил и Методий', type: 'national' },
    { date: `${year}-09-06`, name: 'Ден на Съединението', name_bg: 'Ден на Съединението', type: 'national' },
    { date: `${year}-09-22`, name: 'Ден на независимостта', name_bg: 'Ден на независимостта', type: 'national' },
    { date: `${year}-11-01`, name: 'Ден на народните будители', name_bg: 'Ден на народните будители', type: 'national' },
    { date: `${year}-12-24`, name: 'Бъдни вечер', name_bg: 'Бъдни вечер', type: 'national' },
    { date: `${year}-12-25`, name: 'Коледа', name_bg: 'Коледа', type: 'national' },
    { date: `${year}-12-26`, name: 'Коледа (2 ден)', name_bg: 'Коледа (втори ден)', type: 'national' },
  ]
}
