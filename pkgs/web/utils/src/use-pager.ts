import { useEffect, useRef, useState } from 'react'

interface IUsePager<T> {
  pageSize?: number
  query: (arg: {
    pageSize: number
    currentPage: number
    skip: number
    take: number
  }) => Promise<T[]>
  onChange?: (pager: any) => void
  init?: any
}

export const usePager = <T>(props: IUsePager<T>) => {
  const _ = useRef({
    dataPerPage: [] as Array<Array<T>>,
    data: [] as T[],
    currentPage: 0,
    pageSize: props.pageSize || 50,
    loading: false,
    hasMore: true,
    next: async () => {
      if (!meta.hasMore) return []

      meta.loading = true
      meta.render()
      meta.currentPage = meta.currentPage + 1
      const data = await props.query({
        currentPage: meta.currentPage,
        pageSize: meta.pageSize,
        skip: meta.pageSize * meta.currentPage,
        take: meta.pageSize,
      })
      meta.dataPerPage.push(data)
      for (let i of data) {
        meta.data.push(i)
      }

      if (data.length === 0) {
        meta.hasMore = false
      }

      meta.loading = false
      meta.render()

      if (props.onChange) {
        const pager = { ...meta } as any
        delete pager.next
        delete pager.render
        props.onChange(pager)
      }

      return data
    },
    render: () => {
      if (internal.current.mounted) {
        _render({})
      }
    },
  })
  const internal = useRef({ mounted: true })
  useEffect(() => {
    if (props.init) {
      for (let [k, v] of Object.entries(props.init)) {
        ;(meta as any)[k] = v
      }
    }
    meta.next()
    meta.render()
    return () => {
      internal.current.mounted = false
    }
  }, [])
  const [__, _render] = useState({})
  const meta = _.current
  return _.current
}
