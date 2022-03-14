import { Node } from '@babel/traverse'
import generate from '@babel/generator'
export const convertMobx = (c: Node) => {
  if (c.type === 'ImportDeclaration') {
    if (c.source.value === 'mobx-react-lite' || c.source.value === 'mobx') {
      let rpath = 'web-utils'
      c.source.extra = {
        rawValue: `'${rpath}'`,
        raw: "'" + rpath + "'",
      }
      c.source.value = rpath
    }
  }
}
