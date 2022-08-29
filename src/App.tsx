import { useEffect, useState } from 'react'
import { fetcher, mutator } from './fetcher'
import { ServiceWorkerUpdateListener } from './ServiceWorkerUpdateListener'
import './App.css'

const App = () => {
  const [data, setData] = useState<{ value: number }[]>()
  const [value, setValue] = useState('')

  const [updateWaiting, setUpdateWaiting] = useState(false)
  const [registration, setRegistration] = useState(null)
  const [swListener, setSwListener] = useState({})

  useEffect(() => {
    const doFetch = async () => {
      const data = await fetcher()
      setData(data)
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
    await mutator(parseInt(value))
    setValue('')

    const data = await fetcher()
    setData(data)
  }

  const handleUpdate = () => {
    // @ts-ignore
    swListener.skipWaiting(registration.waiting);
  }

  return (
    <div className="App">
      <div>
        <p>Numbers: </p>
        <span>
          [
          { data && 
            data.map(d => d.value).join(', ')
          }
          ]
        </span>
      </div>
      <div>
        <p>New number:</p>
        <input type='number' value={value} onChange={(e) => setValue(e.target.value)} />
        <button onClick={handleAddNumber}>Add</button>
      </div>

      {
        updateWaiting && (
          <div>
            Update waiting! <button onClick={handleUpdate}>Update</button>
          </div>
      )}
    </div>
  )
}

export default App
