import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_API_URL || ''
const supabaseAnonKey = process.env.REACT_APP_API_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const fetchNumbers = async () => {
  const { data, error } = await supabase
    .from('my_set')
    .select('numbers')
    .match({ id: 1 })
  
  console.log({data, error})
  if (data) return data[0].numbers as number[]
}

export const updateNumbers = async (numbers: number[]) => {
  const { data, error } = await supabase
    .from('my_set')
    .update({numbers})
    .match({ id: 1 })
  
  console.log({data, error})
}
