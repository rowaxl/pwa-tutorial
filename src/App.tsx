import { useEffect, useState } from 'react'
import { ServiceWorkerUpdateListener } from './ServiceWorkerUpdateListener'
import { createClient } from '@supabase/supabase-js'

import './App.css';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || ''
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)


const supabaseFetch = async () => {
  const { data, error } = await supabase
    .from('my_set')
    .select('numbers')
    .match({ id: 1 })
  
  console.log({data, error})
  if (data) return data[0].numbers as number[]
}

const supabaseUpdate = async (numbers: number[]) => {
  const { data, error } = await supabase
    .from('my_set')
    .update({numbers})
    .match({ id: 1 })
  
  console.log({data, error})
}

const App = () => {
  const [numbers, setNumbers] = useState<number[]>([])
  const [value, setValue] = useState('')

  const [updateWaiting, setUpdateWaiting] = useState(false)
  const [registration, setRegistration] = useState(null)
  const [swListener, setSwListener] = useState({})

  useEffect(() => {
    const doFetch = async () => {
      const data = await supabaseFetch()
      data && setNumbers(data)
    }

    doFetch()
    if (process.env.NODE_ENV === "development") return

    let listener = new ServiceWorkerUpdateListener()
    setSwListener(listener)
    console.log({ listener })

    // @ts-ignore
    listener.onupdateinstalling = (installingEvent) => {
      console.log("SW installed", installingEvent)
    }

    // @ts-ignore
    listener.onupdatewaiting = (waitingEvent) => {
      console.log("new update waiting", waitingEvent)
      setUpdateWaiting(true)
    };
    // @ts-ignore
    listener.onupdateready = (event) => {
      console.log("updateready event", event)
      window.location.reload()
    };

    navigator.serviceWorker.getRegistration().then((reg) => {
      // @ts-ignore
      listener.addRegistration(reg)
      // @ts-ignore
      setRegistration(reg)
    });

    // @ts-ignore
    return () => listener.removeEventListener()
  }, [])

  const handleAddNumber = async () => {
    setNumbers([...numbers, parseInt(value)])
    await supabaseUpdate([...numbers, parseInt(value)])
    setValue('')
  }

  const handleUpdate = () => {
    // @ts-ignore
    swListener.skipWaiting(registration.waiting);
  }

  return (
    <div className="App">
      <div>
        {
          numbers.length > 0 && 
          <>
            <p>Numbers: </p>
            <span>
              [ { numbers.join(', ') } ]
            </span>
          </>
        }
      </div>
      <div>
        <p>Add New Number:</p>
        <input type='number' value={value} onChange={(e) => setValue(e.target.value)} />
        <button onClick={handleAddNumber}>Add</button>
      </div>

      {
        updateWaiting && (
        <div>
          <p>
            Update waiting!
          </p>
          <button onClick={handleUpdate}>Update</button>
        </div>
      )}
    </div>
  )
}

export default App
