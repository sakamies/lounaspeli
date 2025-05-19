export const sessionid = 'xyz-321'

//TODO: Generate and persist a client uuid to localstorage
export const myid = 'abc-123'

export const lunches = [
  {
    id: 'a',
    url: 'https://www.sauraha.fi',
    name: 'Sauraha',
    menu: ['Italianpataa', 'Curryriisi'],
    likedby: ['array of client ids'],
    dissedby: ['array of client ids'],
  },
  {
    id: 'b',
    url: 'https://ravintolapuistola.fi',
    name: 'Puistola',
    menu: ['Risottoa', 'Tomaattipyree'],
    likedby: ['array of client ids'],
    dissedby: ['array of client ids'],
  },
  {
    id: 'c',
    url: 'https://www.raflaamo.fi/fi/ravintola/oulu/frans-camille-oulu/menu/lounas',
    name: 'Frans & Camille Oulu',
    menu: ['Risottoa', 'Tomaattipyree'],
    likedby: ['array of client ids'],
    dissedby: ['array of client ids'],
  }
]

export const opinions = {
  'clientid1': {
    'lunchid1': 'like',
    'lunchid2': 'diss'
  },
  'clientid2': {
    'lunchid1': 'like',
    'lunchid2': 'diss',
  },
  //etc...
}