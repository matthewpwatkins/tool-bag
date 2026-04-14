import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router'
import { Suspense } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { registry } from '@/tools/registry'
import { Loader2 } from 'lucide-react'

function Loading() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
      <h1 className="text-3xl font-bold tracking-tight">Toolbox</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Browser-based developer utilities. Select a tool from the sidebar to get started.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 w-full max-w-2xl">
        {registry.map(tool => (
          <a
            key={tool.id}
            href={`/tools/${tool.id}`}
            className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent transition-colors"
          >
            <tool.icon className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium">{tool.name}</p>
              <p className="text-xs text-muted-foreground">{tool.description}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

function ToolPage({ toolId }: { toolId: string }) {
  const tool = registry.find(t => t.id === toolId)
  if (!tool) return <Navigate to="/" replace />
  const { component: Component } = tool
  return (
    <Suspense fallback={<Loading />}>
      <Component />
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="tools/:toolId" element={<ToolIdRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function ToolIdRoute() {
  const { toolId = '' } = useParams<{ toolId: string }>()
  return <ToolPage toolId={toolId} />
}
