import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function debugSchema() {
  console.log('Checking workflow_stage_definitions...')
  const { data, error } = await supabase
    .from('workflow_stage_definitions')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error fetching data:', error)
    return
  }

  if (data && data.length > 0) {
    console.log('Available columns:', Object.keys(data[0]))
    console.log('Sample data:', data[0])
  } else {
    console.log('No data found in table.')
  }
}

debugSchema()
