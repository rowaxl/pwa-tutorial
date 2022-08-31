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

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const App = () => {
  const [numbers, setNumbers] = useState<number[]>([])
  const [value, setValue] = useState('')

  const [updateWaiting, setUpdateWaiting] = useState(false)
  const [registration, setRegistration] = useState(null)
  const [swListener, setSwListener] = useState({})
  
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompts] = useState<BeforeInstallPromptEvent>()

  useEffect(() => {
    const doFetch = async () => {
      const data = await supabaseFetch()
      data && setNumbers(data)
    }

    doFetch()
    if (process.env.NODE_ENV === "development") return

    let listener = new ServiceWorkerUpdateListener()
    setSwListener(listener)

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

  useEffect(() => {
    if (!('Notification' in window)) {
      alert('Notificaiton is not supported in this window!')
    }

    Notification.requestPermission()
  }, [])

  useEffect(() => {
    if (!window) return

    const ready = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later.
      setDeferredPrompts(e as BeforeInstallPromptEvent)
      // Update UI notify the user they can install the PWA
      setShowInstallPrompt(true)
      // Optionally, send analytics event that PWA install promo was shown.
      console.log(`'beforeinstallprompt' event was fired.`);
    }

    const installed = () => {
      setShowInstallPrompt(false)
    }

    window.addEventListener('beforeinstallprompt', ready)

    window.addEventListener('appinstalled', installed)

    return () => {
      window.removeEventListener('beforeinstallprompt', ready)
      window.removeEventListener('appinstalled', installed)
    }
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

  const handleRefresh = () => {
    if (window) {
      window.location.reload()
    }
  }

  const handleNotification = () => {
    if (!('Notification' in window)) {
      alert('Notificaiton is not supported in this window!')
    }

    try {
      new Notification('Non-persist notification')
    } catch(err) {
      console.error('Notification API Error: ', err)
    }
  }

  const handlePWAInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()

    const { outcome } = await deferredPrompt.userChoice
    console.log(`User response to the install prompt: ${outcome}`);

    setDeferredPrompts(undefined)
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
            Update waits!
          </p>
          <button onClick={handleUpdate}>Click and Update</button>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <button
          onClick={handleRefresh}
          style={{ marginRight: 12 }}
        >
          Refresh
        </button>
        <button 
          onClick={handleNotification}
        >
          Local Notificaiton
        </button>
      </div>

      { showInstallPrompt && 
        <div>
          <p>You can try PWA!</p>
          <button onClick={handlePWAInstall}>Install</button>
        </div>
      }
    </div>
  )
}

export default App
