import React, {useEffect, useState} from 'react'

export default function ThemeToggle(){
  const [theme, setTheme] = useState(() => {
    try{ return localStorage.getItem('theme') || 'light' }catch(e){return 'light'}
  })

  useEffect(()=>{
    const root = document.documentElement
    if(theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    try{ localStorage.setItem('theme', theme) }catch(e){}
  }, [theme])

  return (
    <button
      onClick={()=>setTheme(t => t === 'dark' ? 'light' : 'dark')}
      className="theme-toggle"
      title="Toggle theme"
    >
      {theme === 'dark' ? 'Dark mode' : 'Light mode'}
    </button>
  )
}
