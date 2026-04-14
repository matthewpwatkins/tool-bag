export function useFileIO() {
  function openFile(accept = '*'): Promise<string> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = accept
      input.onchange = () => {
        const file = input.files?.[0]
        if (!file) return reject(new Error('No file selected'))
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsText(file)
      }
      input.click()
    })
  }

  function downloadFile(content: string, filename: string, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  async function copyToClipboard(content: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(content)
      return true
    } catch {
      return false
    }
  }

  return { openFile, downloadFile, copyToClipboard }
}
