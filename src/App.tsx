import { useEffect, useState } from 'react'
import { ServiceWorkerUpdateListener } from './ServiceWorkerUpdateListener'
import { fetchNumbers, updateNumbers } from './supabase'
import './App.css';

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
  const [notificationPermitted, setNotificationPermitted] = useState<NotificationPermission>()

  useEffect(() => {
    const doFetch = async () => {
      const data = await fetchNumbers()
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
    if (!('Notification' in window)) return

    const requestPermission = async () => {
      const notificationPermission = await Notification.requestPermission()
      setNotificationPermitted(notificationPermission)
    }
    requestPermission()
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
    await updateNumbers([...numbers, parseInt(value)])
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
      return
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

      <div style={{ marginTop: 12 }}>
        <button
          onClick={handleRefresh}
          style={{ marginRight: 12 }}
        >
          Refresh
        </button>
        {
          notificationPermitted === 'granted' &&
          <button 
            onClick={handleNotification}
          >
            Local Notificaiton
          </button>
        }
      </div>

      { showInstallPrompt && 
        <div>
          <p>You can try PWA!</p>
          <button onClick={handlePWAInstall}>Install</button>
        </div>
      }

      {
        updateWaiting && (
        <div style={{ marginTop: 12 }}>
          <p>
            New Version Waits!
          </p>
          <button onClick={handleUpdate}>Update App</button>
        </div>
      )}
    </div>
  )
}

export default App
