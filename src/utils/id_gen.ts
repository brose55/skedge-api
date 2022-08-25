const idGen = (alphabet: string, length: number) => {
  let id = ''
  for (let i = 0; i < length; i++) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return id
}

export default idGen