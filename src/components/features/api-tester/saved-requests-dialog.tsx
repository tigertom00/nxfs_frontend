"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Trash2, Calendar } from "lucide-react"
import { toast } from "sonner"

interface SavedRequest {
  id: string
  name: string
  url: string
  method: string
  headers: Array<{ key: string; value: string }>
  body: string
  token: string
  createdAt: Date
}

interface SavedRequestsDialogProps {
  children: React.ReactNode
  savedRequests: SavedRequest[]
  onLoadRequest: (request: SavedRequest) => void
  onDeleteRequest: (id: string) => void
}

export function SavedRequestsDialog({
  children,
  savedRequests,
  onLoadRequest,
  onDeleteRequest
}: SavedRequestsDialogProps) {
  const [open, setOpen] = useState(false)

  const handleLoadRequest = (request: SavedRequest) => {
    try {
      onLoadRequest(request)
      toast.success(`Loaded request "${request.name}"`)
      setOpen(false)
    } catch (error) {
      toast.error("Failed to load request")
    }
  }

  const handleDeleteRequest = (id: string, name: string) => {
    try {
      onDeleteRequest(id)
      toast.success(`Deleted request "${name}"`)
    } catch (error) {
      toast.error("Failed to delete request")
    }
  }

  const getMethodBadgeClass = (method: string) => {
    switch (method.toLowerCase()) {
      case 'get': return 'method-get'
      case 'post': return 'method-post'
      case 'put': return 'method-put'
      case 'delete': return 'method-delete'
      case 'patch': return 'method-patch'
      case 'head': return 'method-head'
      case 'options': return 'method-options'
      default: return 'bg-secondary text-secondary-foreground'
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Saved Requests</DialogTitle>
          <DialogDescription>
            Load a previously saved request configuration.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {savedRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No saved requests yet
            </div>
          ) : (
            <div className="space-y-3">
              {savedRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getMethodBadgeClass(request.method)}>
                        {request.method}
                      </Badge>
                      <h3 className="font-medium">{request.name}</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRequest(request.id, request.name)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {request.url}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {request.createdAt.toLocaleDateString()}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleLoadRequest(request)}
                    >
                      Load Request
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}