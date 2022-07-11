import { IClientSend } from 'client'

export const httpClient: IClientSend = async (params) => {
  const w = window as any
  let url = `${w.serverurl}/__data/${toSnake(params.action)}`

  if (params.table) {
    url += `...${params.table}`
  }

  const options = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify(params),
  }

  const fetching = await fetch(url, options)
  return await fetching.json()
}
export const directClient: IClientSend = async (args) => {}
export const clusterClient: IClientSend = async (args) => {}

const toSnake = (str: string) =>
  str[0].toLowerCase() +
  str
    .slice(1, str.length)
    .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
