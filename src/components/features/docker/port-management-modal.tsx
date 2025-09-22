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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { DockerContainer } from '@/types/api';

interface PortInfo {
  port: number;
  containerName: string;
  containerId: string;
  hostName: string;
  containerPort?: number;
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
  const [nextPortInput, setNextPortInput] = useState('');

  // Filter to only running containers and extract host ports
  const runningContainers = useMemo(() => {
    return containers.filter((container) => container.status === 'running');
  }, [containers]);

  // Get available hosts from running containers
  const availableHosts = useMemo(() => {
    const hosts = Array.from(
      new Set(runningContainers.map((c) => c.host_name).filter(Boolean))
    ) as string[];
    return hosts.sort();
  }, [runningContainers]);

  // Extract host ports by host
  const portsByHost = useMemo(() => {
    const hostPorts: Record<string, PortInfo[]> = {};

    runningContainers.forEach((container) => {
      const hostName = container.host_name || 'unknown';

      if (!hostPorts[hostName]) {
        hostPorts[hostName] = [];
      }

      if (container.ports) {
        container.ports.forEach((portMapping) => {
          // Only add host ports (no need for container ports)
          if (portMapping.host_port) {
            hostPorts[hostName].push({
              port: portMapping.host_port,
              containerName: container.name,
              containerId: container.id,
              hostName: hostName,
              containerPort: portMapping.container_port,
            });
          }
        });
      }
    });

    // Remove duplicates and sort by port number for each host
    Object.keys(hostPorts).forEach((host) => {
      const uniquePorts = hostPorts[host].filter((port, index, arr) => {
        return (
          arr.findIndex(
            (p) => p.port === port.port && p.containerId === port.containerId
          ) === index
        );
      });
      hostPorts[host] = uniquePorts.sort((a, b) => a.port - b.port);
    });

    return hostPorts;
  }, [runningContainers]);

  // Filter ports for a specific host based on search term (prefix matching)
  const getFilteredPortsForHost = (hostName: string) => {
    const hostPorts = portsByHost[hostName] || [];

    if (!searchTerm) return hostPorts;

    const searchNumber = searchTerm.trim();
    if (!/^\d+$/.test(searchNumber)) {
      // If search term is not a number, search in container names
      const searchLower = searchTerm.toLowerCase();
      return hostPorts.filter((portInfo) =>
        portInfo.containerName.toLowerCase().includes(searchLower)
      );
    }

    // For numeric search, only match ports that start with the search term
    return hostPorts.filter((portInfo) =>
      portInfo.port.toString().startsWith(searchNumber)
    );
  };

  // Find next available port for a specific host
  const findNextAvailablePortForHost = (
    startPort: number,
    hostName: string
  ): number => {
    const usedHostPorts = new Set(
      (portsByHost[hostName] || []).map((p) => p.port)
    );

    let nextPort = startPort;
    while (usedHostPorts.has(nextPort)) {
      nextPort++;
    }

    return nextPort;
  };

  const getNextPortSuggestionForHost = (hostName: string) => {
    const inputPort = parseInt(nextPortInput);
    if (isNaN(inputPort) || inputPort <= 0) return null;

    return findNextAvailablePortForHost(inputPort, hostName);
  };

  if (availableHosts.length === 0) {
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
              View all ports used across running containers and find available
              ports
            </DialogDescription>
          </DialogHeader>
          <Card className="p-8 text-center">
            <Network className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No running containers found
            </h3>
            <p className="text-muted-foreground">
              Start some containers to manage their ports.
            </p>
          </Card>
        </DialogContent>
      </Dialog>
    );
  }

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
            View all ports used across running containers and find available
            ports
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search ports (e.g., '80' for 80, 8000, 8080) or container names..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Host Tabs */}
          <Tabs
            defaultValue={availableHosts[0]}
            className="flex-1 overflow-hidden flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-2">
              {availableHosts.map((host) => (
                <TabsTrigger
                  key={host}
                  value={host}
                  className="flex items-center gap-2"
                >
                  <Server className="w-4 h-4" />
                  {host} ({(portsByHost[host] || []).length})
                </TabsTrigger>
              ))}
            </TabsList>

            {availableHosts.map((host) => {
              const filteredPorts = getFilteredPortsForHost(host);
              const nextPortSuggestion = getNextPortSuggestionForHost(host);

              return (
                <TabsContent
                  key={host}
                  value={host}
                  className="flex-1 overflow-hidden flex flex-col space-y-4"
                >
                  {/* Next Available Port Finder */}
                  <Card className="p-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Find Next Available Port on {host}
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
                        {nextPortSuggestion !== null && (
                          <Badge variant="secondary" className="px-3 py-2">
                            Next available: {nextPortSuggestion}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* Ports List */}
                  <div className="flex-1 overflow-auto space-y-2">
                    {filteredPorts.length === 0 ? (
                      <Card className="p-8 text-center">
                        <Network className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                          No ports found
                        </h3>
                        <p className="text-muted-foreground">
                          {searchTerm
                            ? 'No ports match your search criteria.'
                            : `No ports found on ${host}.`}
                        </p>
                      </Card>
                    ) : (
                      filteredPorts.map((portInfo) => {
                        const url = getPortUrl(
                          portInfo.port,
                          portInfo.hostName
                        );

                        return (
                          <Card
                            key={`${portInfo.containerId}-${portInfo.port}`}
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
                                      <span>
                                        → Container: {portInfo.containerPort}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Badge variant="default">Host Port</Badge>

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
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
