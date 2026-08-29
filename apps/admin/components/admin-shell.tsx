'use client';

import {
  Badge,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  SiteLogo,
} from '@mojo/shared/ui';
import { Activity, Scale, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/nexus', label: 'Overview', icon: Activity },
  { href: '/tutors/applications', label: 'Applications', icon: UserCheck },
  { href: '/trust/disputes', label: 'Disputes', icon: Scale },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar variant='inset' collapsible='icon'>
        <SidebarHeader>
          <SiteLogo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {NAV.map(({ href, label, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton asChild isActive={pathname === href}>
                  <Link href={href}>
                    <Icon />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <SidebarSeparator />
          <div className="px-3 py-2">
            <Badge variant="muted">Admin · demo mode</Badge>
          </div>
        </SidebarContent>
        <SidebarFooter>
          <p className="px-2 text-xs text-sidebar-foreground/60">mojo ops console</p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger />
          <span className="font-display text-sm font-bold text-headline">Mojo Admin</span>
        </header>
        <div className="flex-1 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
