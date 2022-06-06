import { ReactElement } from 'react'
import { dbsList } from '../../../../../app/web/types/dbs-list'

type ITreeProps = {
  schema: ITreeSchema
  onExpand?: (ctx: ITreeContextData) => void
  onCollapse?: (ctx: ITreeContextData) => void
  renderItem?: (
    ctx: ITreeContextData,
    event: 'init' | 'expand' | 'collapse' | 'render'
  ) => ReactElement
}

type ITreeSchema = {
  dbConnection?: typeof dbsList[number]
  tableName: string
  parentColumn: string
  rootCondition: any
}

type ITreeContextData = {
  row: any
  expand: () => Promise<void>
  expandAll: () => Promise<void>
  isExpanded: boolean
  level: number
  collapse: () => void
  render: () => void
  reloadRoot: () => Promise<void>
  reloadChildren: () => Promise<void>
}
