/*TODO:
  since form.elements has a length property, either that case needs special handling
  like value.length for <input name="length"> would need something like if (name === 'length')
  or there needs to be a general handling that doesn't access stuff directly with form.elements
*/

//TODO: labels to go with value? Mostly so you can delete labels along with your inputs if you need to. Though if you know your input id or name, this would be kinda moot so not sure it's really needed.

//TODO: listen & change should work with individual input elements as well. Now they only work with the whole form of fieldsets. Listening to a single input is rather common. Event listeners deferred to containing elements is more robust than listening directly on an input element, but still.

/*TODO: Maybe maybe: Giving an object could define event names as keys and callbacks as values. Really nifty if you'd name your event handlers the same as the events.

```js
const click = event => console.log(event.target)
const submit = event => console.log(event.target)
listen({click, submit})
ignore({click, submit})
```
*/

export class Form {
  static event = new Event('change', {bubbles: true})
  static events = ['click', 'input', 'change']

  #root
  #path

  constructor(root, path) {
    this.#root = getRoot(root) || document.forms[0]
    this.#path = path || []

    this.elements = new Proxy(Function(), {
      apply: this.#elementsApply,
      get: this.#elementsGet,
    })

    this.value = new Proxy(Function(), {
      apply: this.#valueApply,
      get: this.#valueGet,
      // has: this.#valueHas,
      set: this.#valueSet,
      deleteProperty: this.#valueDelete,
    })

    this.tree = new Proxy(Function(), {
      apply: this.#treeApply,
      get: this.#treeGet,
      // has: this.#treeHas,
      set: this.#treeSet,
      deleteProperty: this.#treeDelete,
    })

    this.leaf = new Proxy(Function(), {
      apply: this.#leafApply,
      get: this.#leafGet,
      // has: this.#leafHas,
      set: this.#leafSet,
      deleteProperty: this.#leafDelete,
    })
  }

  #elementsApply = (_, __, [root]) => {
    return (new Form(getRoot(root))).elements
  }
  #elementsGet = (_, name) => {
    const node = this.#root.elements[name]
    validate(node)
    return node
  }

  #valueApply = (_, __, [root]) => {
    return (new Form(getRoot(root))).value
  }
  #valueGet = (_, name) => {
    const node = this.#root.elements[name]
    validate(node)
    return valueOf(node)
  }
  #valueSet = (_, name, value) => {
    const node = this.#root.elements[name]
    validate(node)
    set(node, value)
    return true
  }
  #valueDelete = (_, name) => {
    const node = this.#root.elements[name]
    validate(node)
    del(node)
    return true
  }

  #treeApply = (_, __, [param]) => {
    //TODO: [param] isnt's used and root is not defined inside this function
    //TODO: how does this work, does this even work?
    return (new Form(getRoot(root))).tree
  }
  #treeGet = (_, name) => {
    const path = [...this.#path, name]
    const fullName = nameFromPath(path)
    const node = this.#root.elements[fullName]
    if (node) {
      return this.value[fullName]
    } else {
      return (new Form(this.#root, path)).tree
    }
  }
  #treeSet = (_, name, value) => {
    const path = [...this.#path, name]
    const fullName = nameFromPath(path)
    const node = this.#root.elements[fullName]
    if (node) {
      this.value[fullName] = value
    } else {
      //TODO:
      // get all nodes that match this path
      // if value is an array, set by that
      // if value is string, set all to that string
    }
    return true
  }
  #treeDelete = (_, name) => {
    const path = [...this.#path, name]
    const fullName = nameFromPath(path)
    const node = this.#root.elements[fullName]
    if (node) {
      delete this.value[fullName]
    } else {
      //TODO:
      // get all nodes that match this path
      // delete all those nodes
    }
  }

  #leafApply = (_, __, [root]) => {
    return (new Form(getRoot(root))).leaf
  }
  #leafGet = (_, name) => {
    if (name === 'length') {
      //TODO: make length as name work
    }
    let names = Object.getOwnPropertyNames(this.#root.elements)
    names = names.filter(key => key.endsWith('[' + name + ']'))
    if (names.length === 1) {
      return this.value[names[0]]
    } else {
      return names.flatMap(name => this.value[name])
    }
  }
  #leafSet = (_, name, value) => {
    let names = Object.getOwnPropertyNames(this.#root.elements)
    names = names.filter(key => key.endsWith('[' + name + ']'))
    names.forEach(name => this.value[name] = value)
    return true
  }
  #leafDelete = (_, name) => {
    let names = Object.getOwnPropertyNames(this.#root.elements)
    names = names.filter(key => key.endsWith('[' + name + ']'))
    names.forEach(name => delete this.value[name])
    return true
  }

  change = (callback) => {
    const root = getRoot(callback)
    if (root) return (new Form(root)).change

    if (callback) callback()
    this.#root.dispatchEvent(event || Form.event)
  }

  listen = (...args) => {
    const root = getRoot(args[0])
    if (root) return (new Form(root)).listen

    const callbacks = args.filter(arg => typeof arg === 'function')
    let events = args.filter(arg => typeof arg === 'string')
    if (!events.length) events = Form.events

    for (let event of events) {
      for (let callback of callbacks) {
        // TODO: add support for options parameter
        // We can check if the last argument is an object and then add that as the options object
        this.#root.addEventListener(event, callback/*, options*/)
      }
    }
  }

  ignore = (...args) => {
    const root = getRoot(args[0])
    if (root) return (new Form(root)).ignore

    const callbacks = args.filter(arg => typeof arg === 'function')
    let events = args.filter(arg => typeof arg === 'string')
    if (!events.length) events = Form.events

    for (let event of events) {
      for (let callback of callbacks) {
        this.#root.removeEventListener(event, callback)
      }
    }
  }
}

// Pretty harsh, but I really want the js to yell at me if a label is accidentally missing.
function validate(node) {
  if (!node) {
    throw new Error(`Node missing.`, {cause: node});
  }
  if (node instanceof RadioNodeList) {
    return node.forEach(validate)
  }
  const unlabelledElement = ['submit', 'reset', 'button', 'fieldset', 'output', 'hidden'].includes(node.type)
  const hasLabel = node.labels?.length
  const hasAria = node.getAttribute('aria-label') || node.getAttribute('aria-labelledby')
  if (!hasLabel && !hasAria && !unlabelledElement) {
    console.error('Missing label for ', node)
  }
}

function valueOf(node) {
  const nodes = node instanceof RadioNodeList && Array.from(node)
  if (nodes && nodes.every(node => node.type !== 'radio')) {
    const values = nodes.map(n => valueOf(n))
    return values
  }
  if (node.valueAsDate && node.valueAsDate !== null) return node.valueAsDate
  if (node.valueAsNumber && node.valueAsNumber !== NaN) return node.valueAsNumber
  if (node.type === 'checkbox') return node.checked ? node.value : null
  if (node.type === 'fieldset') return (new Form(node)).value
  return node.value
}

function set(node, value) {
  if (node instanceof RadioNodeList && Array.isArray(value)) {
    Array.from(node).map((n, i) => set(n, value[i]))
  }
  if (value === null) {
    if (node.type === 'checkbox') node.checked = node.getAttribute('checked')
    else node.value = node.defaultValue
  } else {
    if (node.type === 'checkbox') node.checked = value
    else node.value = value
  }
}

function del(node) {
  const nodes = node instanceof RadioNodeList && Array.from(node)
  if (nodes) return nodes.forEach((n, i) => del(n))
  node.remove()
}

function nameFromPath(path) {
  return path.map((part, i) => i === 0 ? part : `[${part}]`).join('')
}

function getRoot(root) {
  root = document.forms[root] || root
  if (root instanceof HTMLFormElement || root instanceof HTMLFieldSetElement) {
    return root
  }
}

///////////////////////

export const elements = (new Form()).elements
export const value = (new Form()).value
export const tree = (new Form()).tree
export const leaf = (new Form()).leaf
export const change = (new Form()).change
export const listen = (new Form()).listen
export const ignore = (new Form()).ignore
