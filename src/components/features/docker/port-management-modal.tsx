'use client';

import { useState, useMemo } from 'react';
import { Search, Network, Server, Container, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DockerContainer } from '@/types/api';

interface PortInfo {
  port: number;
  containerName: string;
  containerId: string;
  hostName: string;
  containerPort?: number;
  isHostPort: boolean;
}

interface PortManagementModalProps {
  containers: DockerContainer[];
  children: React.ReactNode;
}

function getPortUrl(port: number, hostName?: string): string | null {
  if (!hostName) return null;

  let baseUrl = '';
  if (hostName === 'nuk') {
    baseUrl = 'http://10.20.30.203';
  } else if (hostName === 'zero') {
    baseUrl = 'http://10.20.30.202';
  } else {
    return null;
  }

  return `${baseUrl}:${port}`;
}

export function PortManagementModal({
  containers,
  children,
}: PortManagementModalProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHostPorts, setShowHostPorts] = useState(true);
  const [nextPortInput, setNextPortInput] = useState('');

  // Extract all ports from containers
  const allPorts = useMemo(() => {
    const ports: PortInfo[] = [];

    containers.forEach((container) => {
      if (container.ports) {
        container.ports.forEach((portMapping) => {
          // Add host port if it exists
          if (portMapping.host_port) {
            ports.push({
              port: portMapping.host_port,
              containerName: container.name,
              containerId: container.id,
              hostName: container.host_name || 'unknown',
              containerPort: portMapping.container_port,
              isHostPort: true,
            });
          }

          // Add container port
          ports.push({
            port: portMapping.container_port,
            containerName: container.name,
            containerId: container.id,
            hostName: container.host_name || 'unknown',
            containerPort: portMapping.host_port,
            isHostPort: false,
          });
        });
      }
    });

    // Remove duplicates and sort by port number
    const uniquePorts = ports.filter((port, index, arr) => {
      return (
        arr.findIndex(
          (p) =>
            p.port === port.port &&
            p.isHostPort === port.isHostPort &&
            p.containerId === port.containerId
        ) === index
      );
    });

    return uniquePorts.sort((a, b) => a.port - b.port);
  }, [containers]);

  // Filter ports based on search term and host/container toggle
  const filteredPorts = useMemo(() => {
    return allPorts.filter((portInfo) => {
      // Filter by host/container toggle
      if (showHostPorts && !portInfo.isHostPort) return false;
      if (!showHostPorts && portInfo.isHostPort) return false;

      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          portInfo.port.toString().includes(searchTerm) ||
          portInfo.containerName.toLowerCase().includes(searchLower) ||
          portInfo.hostName.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [allPorts, searchTerm, showHostPorts]);

  // Find next available port
  const findNextAvailablePort = (startPort: number): number => {
    const usedHostPorts = new Set(
      allPorts.filter((p) => p.isHostPort).map((p) => p.port)
    );

    let nextPort = startPort;
    while (usedHostPorts.has(nextPort)) {
      nextPort++;
    }

    return nextPort;
  };

  const suggestedNextPort = useMemo(() => {
    const inputPort = parseInt(nextPortInput);
    if (isNaN(inputPort) || inputPort <= 0) return null;

    return findNextAvailablePort(inputPort);
  }, [nextPortInput, allPorts]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            Port Management
          </DialogTitle>
          <DialogDescription>
            View all ports used across containers and find available ports
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Controls */}
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search ports, containers, or hosts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="port-type"
                checked={showHostPorts}
                onCheckedChange={setShowHostPorts}
              />
              <Label htmlFor="port-type" className="flex items-center gap-2">
                {showHostPorts ? (
                  <>
                    <Server className="w-4 h-4" />
                    Host Ports
                  </>
                ) : (
                  <>
                    <Container className="w-4 h-4" />
                    Container Ports
                  </>
                )}
              </Label>
            </div>

            {/* Next Available Port Finder */}
            <Card className="p-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Find Next Available Port
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter starting port (e.g., 3000)"
                    value={nextPortInput}
                    onChange={(e) => setNextPortInput(e.target.value)}
                    type="number"
                    min="1"
                    max="65535"
                  />
                  {suggestedNextPort !== null && (
                    <Badge variant="secondary" className="px-3 py-2">
                      Next available: {suggestedNextPort}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Ports List */}
          <div className="flex-1 overflow-auto space-y-2">
            {filteredPorts.length === 0 ? (
              <Card className="p-8 text-center">
                <Network className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No ports found</h3>
                <p className="text-muted-foreground">
                  {searchTerm
                    ? 'No ports match your search criteria.'
                    : `No ${showHostPorts ? 'host' : 'container'} ports found.`}
                </p>
              </Card>
            ) : (
              filteredPorts.map((portInfo, index) => {
                const url = portInfo.isHostPort
                  ? getPortUrl(portInfo.port, portInfo.hostName)
                  : null;

                return (
                  <Card
                    key={`${portInfo.containerId}-${portInfo.port}-${portInfo.isHostPort}`}
                    className="transition-colors hover:bg-accent/50"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className="font-mono text-lg px-3 py-1"
                          >
                            {portInfo.port}
                          </Badge>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Container className="w-3 h-3" />
                              <span className="font-medium">
                                {portInfo.containerName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Server className="w-3 h-3" />
                              <span>{portInfo.hostName}</span>
                              {portInfo.containerPort &&
                                portInfo.isHostPort && (
                                  <>
                                    <span>→</span>
                                    <span>
                                      Container: {portInfo.containerPort}
                                    </span>
                                  </>
                                )}
                              {!portInfo.isHostPort &&
                                portInfo.containerPort && (
                                  <>
                                    <span>→</span>
                                    <span>Host: {portInfo.containerPort}</span>
                                  </>
                                )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              portInfo.isHostPort ? 'default' : 'secondary'
                            }
                          >
                            {portInfo.isHostPort ? 'Host' : 'Container'}
                          </Badge>

                          {url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(url, '_blank')}
                              className="h-8 w-8 p-0"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
