import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetcher, mutator } from './fetcher'
import { ServiceWorkerUpdateListener } from './ServiceWorkerUpdateListener'
import './App.css'

const App = () => {
  const queryClient = useQueryClient()
  const [value, setValue] = useState(0)
  const { data } = useQuery<{ id: number, value: number}[]>(['numbers'], fetcher, { staleTime: Infinity })
  const addNumber = useMutation(
    (input: number) => mutator(input),
    { onSuccess: () => { queryClient.invalidateQueries(['numbers'])} }
  )

  const [updateWaiting, setUpdateWaiting] = useState(false)
  const [registration, setRegistration] = useState(null)
  const [swListener, setSwListener] = useState({})

  useEffect(() => {
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

  const handleAddNumber = () => {
    addNumber.mutate(value)
    setValue(0)
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
        <input type='number' value={value} onChange={(e) => setValue(parseInt(e.target.value))} />
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
