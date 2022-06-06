import { FC, Fragment } from 'react'
import { useLocal } from 'web-utils'
import { IFormSchema } from '../form/types'
import { prepareSchemaFromDb } from '../form/utils/prep-schema'
import { ITreeProps } from './types'
import { loadRootTree } from './utils/load-root-tree'
import { loadItemTree } from './utils/load-item-tree'

export const Tree: FC<ITreeProps> = (props) => {
  const { schema } = props
  const local = useLocal(
    {
      schema: { ...schema } as unknown as IFormSchema,
      root: [] as any,
      expanded: new WeakSet(),
      initialized: false,
      reloadRoot: async () => {
        local.root = (await loadRootTree(schema)) || []
        local.render()
      },
    },
    async () => {
      local.schema = await prepareSchemaFromDb(schema)
      local.root = (await loadRootTree(schema)) || []
      local.render()
      local.initialized = true

      local.render()
    }
  )

  if (!local.initialized) return null

  return (
    <div className="tree-container">
      {local.root.map((row: any, idx: number) => {
        return (
          <TreeItem
            key={idx}
            {...props}
            level={0}
            isCurrentExpanded={true}
            row={row}
            render={local.render}
            reloadRoot={local.reloadRoot}
            expanded={local.expanded}
            initialized={local.initialized}
            childCol={local.schema.dbInternal?.primaryKey || 'id'}
          />
        )
      })}
    </div>
  )
}

const defaultRenderItem: ITreeProps['renderItem'] = (ctx, event) => {
  if (event === 'init') {
    ctx.expand()
  }
  return (
    <div
      onClick={() => {
        if (ctx.isExpanded) {
          ctx.collapse()
        } else {
          ctx.expandAll()
        }
      }}
    >
      <span
        css={css`
          padding-left: ${10 * ctx.level}px;
        `}
      ></span>
      {ctx.row.name}
    </div>
  )
}

const TreeItem: FC<
  ITreeProps & {
    render: () => void
    expanded: WeakSet<any>
    isCurrentExpanded: boolean
    level: number
    row: any
    initialized: boolean
    reloadRoot: () => Promise<void>
    childCol: string
    onRender?: (children: any) => void
  }
> = (props) => {
  const {
    renderItem,
    expanded,
    render,
    row,
    schema,
    onRender,
    initialized,
    reloadRoot,
    childCol,
    level,
  } = props
  let local = useLocal({
    children: [] as any,
    loaded: false,
    event: 'init' as any,
    onRender: undefined as any,
  })

  let content = <Fragment></Fragment>

  let _render = renderItem
  if (!_render) {
    _render = defaultRenderItem
  }

  const ctxData = {
    collapse: () => {
      if (expanded.has(row)) {
        expanded.delete(row)
        local.event = 'collapse'
        local.render()
        local.event = 'render'
      }
    },
    level,
    get isExpanded() {
      return expanded.has(row)
    },
    expand: async () => {
      if (!expanded.has(row)) {
        expanded.add(row)

        local.event = 'expand'
        if (!local.loaded) {
          local.children = await loadItemTree(row, schema, childCol)
          local.loaded = true
        }

        local.render()

        local.event = 'render'
      }
    },
    expandAll: async () => {
      if (!expanded.has(row)) {
        expanded.add(row)

        local.event = 'expand'
        if (!local.loaded) {
          local.children = await loadItemTree(row, schema, childCol)
          local.loaded = true
        }

        local.onRender = async (children: any) => {
          if (children && children.expandAll) await children.expandAll()
          local.onRender = undefined
          local.render()
        }

        local.render()

        local.event = 'render'
      }
    },
    render,
    reloadChildren: async () => {
      local.loaded = false
      local.render()
      local.children = await loadItemTree(row, schema, childCol)
      local.loaded = true
      local.render()
    },
    reloadRoot,
    row,
  }

  if (onRender) {
    onRender(ctxData)
  }

  if (_render) {
    content = _render(ctxData, local.event)
  } else {
    content = <Fragment>Halo</Fragment>
  }

  return (
    <div class="tree-item">
      {content}
      <div className={`tree-child ${!expanded.has(row) ? 'hidden' : ''}`}>
        {local.loaded &&
          (local.children || []).map((row: any, idx: number) => {
            return (
              <TreeItem
                key={idx}
                {...props}
                row={row}
                level={level + 1}
                render={render}
                onRender={local.onRender}
                isCurrentExpanded={expanded.has(row)}
                expanded={expanded}
                initialized={initialized}
              />
            )
          })}
      </div>
    </div>
  )
}
