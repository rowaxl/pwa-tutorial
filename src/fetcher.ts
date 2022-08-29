const URL = 'http://localhost:4000/numbers'

export const fetcher = async () => await (await fetch(URL)).json()

export const mutator = async (input: number) => 
  await (await fetch(
    URL, 
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: input })
    }
  )).json()
