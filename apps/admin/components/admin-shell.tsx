'use client';

import {
  Avatar,
  Badge,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  MojoMark,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarSeparator,
  useSidebar,
} from '@mojo/shared/ui';
import {
  ChevronDown,
  ChevronRight,
  type Gauge,
  Globe,
  GraduationCap,
  LineChart,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Scale,
  Settings,
  ShieldCheck,
  Speech,
  University,
  User,
  UserCheck,
  UserStar,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

interface NavItem {
  url: string;
  title: string;
  icon?: typeof Gauge;
  isActive?: boolean;
  items?: NavItem[];
}

const NAV: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'Menu',
    items: [
      { url: '/admin', title: 'Overview', icon: UserStar },
      {
        title: 'Tutors',
        url: '#',
        icon: Speech,
        items: [
          {
            title: 'Application queue',
            url: '#',
          },
          {
            title: 'Directory',
            url: '#',
          },
          {
            title: 'Levels & progression',
            url: '#',
          },
          {
            title: 'suspensions/appeals',
            url: '#',
          },
        ],
      },
      {
        title: 'Students',
        url: '#',
        icon: GraduationCap,
        items: [
          {
            title: 'Directory',
            url: '#',
          },
          {
            title: 'Suspensions & appeals',
            url: '#',
          },
        ],
      },
      {
        title: 'Sessions',
        url: '#',
        icon: Users,
        items: [
          {
            title: 'Bookings',
            url: '#',
          },
          {
            title: 'Disputes',
            url: '#',
          },
          {
            title: 'Cancellation log',
            url: '#',
          },
        ],
      },
      {
        title: 'Finance',
        url: '#',
        icon: Wallet,
        items: [
          {
            title: 'Wallets & transactions',
            url: '#',
          },
          {
            title: 'Payout approvals',
            url: '#',
          },
          {
            title: 'Pricing config',
            url: '#',
          },
          {
            title: 'Mupta+ config',
            url: '#',
          },
          {
            title: 'Revenue reports',
            url: '#',
          },
        ],
      },
      {
        title: 'Marketplace',
        url: '#',
        icon: University,
        items: [
          {
            title: 'Subjects',
            url: '#',
          },
          {
            title: 'Referral program',
            url: '#',
          },
          {
            title: 'Trial discount rules',
            url: '#',
          },
          {
            title: 'Featured tutors',
            url: '#',
          },
        ],
      },
    ],
  },
  {
    heading: 'Platform',
    items: [
      {
        title: 'Analytics',
        url: '/analytics',
        icon: LineChart,
        items: [
          {
            title: 'Platform metrics',
            url: '#',
          },
          {
            title: 'Tutor leaderboard',
            url: '#',
          },
          {
            title: 'Retention & cohorts',
            url: '#',
          },
        ],
      },
      {
        title: 'System',
        url: '#',
        icon: ShieldCheck,
        items: [
          {
            title: 'Admin roles & permissions',
            url: '#',
          },
          {
            title: 'Feature flags',
            url: '#',
          },
          {
            title: 'Broadcasts',
            url: '#',
          },
          {
            title: 'Help content',
            url: '#',
          },
          {
            title: 'Audit log',
            url: '#',
          },
        ],
      },
    ],
  },
  {
    heading: 'General',
    items: [
      { url: '/tutors/applications', title: 'Applications', icon: UserCheck },
      { url: '/trust/disputes', title: 'Disputes', icon: Scale },
      { url: '/settings', title: 'Settings', icon: Settings },
      { url: '/nexus', title: 'Nexus', icon: Globe },
    ],
  },
];

const QUICK_ACTIONS: { title: string; url: string }[] = [
  { title: 'Review applications', url: '/admin#verification' },
  { title: 'Manage users', url: '/admin/users' },
  { title: 'Platform analytics', url: '/analytics' },
  { title: 'Admin settings', url: '/settings' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar variant="floating" collapsible="icon">
        <SidebarHeader>
          {/* <SiteLogo /> */}
          <Link
            href="/"
            aria-label="mojo — back to site"
            className="flex items-center gap-2 px-2 py-1.5 transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 hover:opacity-80"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent dark:bg-accent-foreground">
              <MojoMark className="size-6" />
            </span>
            <span className="font-display text-2xl font-semibold tracking-tight text-headline group-data-[collapsible=icon]:hidden">
              mojo<span className="text-secondary">.</span>
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {NAV.map((group) => (
              <SidebarGroup key={group.heading}>
                <SidebarGroupLabel>{group.heading}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild tooltip={item.title}>
                            <a href={item.url}>
                              {item.icon && <item.icon />}
                              <span>{item.title}</span>
                            </a>
                          </SidebarMenuButton>
                          {item.items?.length ? (
                            <>
                              <CollapsibleTrigger asChild>
                                <SidebarMenuAction className="data-[state=open]:rotate-90">
                                  <ChevronRight />
                                  <span className="sr-only">Toggle</span>
                                </SidebarMenuAction>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <SidebarMenuSub>
                                  {item.items?.map((subItem) => (
                                    <SidebarMenuSubItem key={subItem.title}>
                                      <SidebarMenuSubButton asChild>
                                        <a href={subItem.url}>
                                          <span>{subItem.title}</span>
                                        </a>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  ))}
                                </SidebarMenuSub>
                              </CollapsibleContent>
                            </>
                          ) : null}
                        </SidebarMenuItem>
                      </Collapsible>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem></SidebarMenuItem>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Zap className="size-4" />
                    <span className="group-data-[collapsible=icon]:hidden">Quick actions</span>
                    <ChevronDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-52">
                  <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {QUICK_ACTIONS.map((action) => (
                    <DropdownMenuItem key={action.title} asChild>
                      <a href={action.url}>{action.title}</a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="px-3 py-2">
            <Badge variant="muted">Admin · demo mode</Badge>
          </div>
          <SidebarSeparator />
          <p className="px-2 text-xs text-sidebar-foreground/60">mojo ops console</p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        {/* <header className="flex h-14 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger /> */}
        <DashboardHeader />
        <div className="flex-1 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function DashboardHeader() {
  const { state, toggleSidebar } = useSidebar();
  return (
    <header className="sticky top-3 z-5 flex h-12 shrink-0 items-center gap-2 bg-background/90 px-4 backdrop-blur sm:px-6">
      <Button
        variant="ghost"
        onClick={() => toggleSidebar()}
        size="sm"
        className="text-muted-foreground"
      >
        {state === 'expanded' ? (
          <PanelLeftClose className="size-4" />
        ) : (
          <PanelLeftOpen className="size-4" />
        )}
      </Button>
      <p className="flex-1 truncate text-sm capitalize text-muted-foreground">mojo nexus</p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 px-2">
            <Avatar name="Nexus Admin" size="sm" />
            <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
              Nexus Admin
            </span>
            <ChevronDown className="hidden size-4 text-muted-foreground sm:inline" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <span className="truncate text-sm font-semibold">Nexus Admin</span>
              <span className="truncate text-xs font-normal capitalize text-muted-foreground">
                admin
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/settings">
              <User className="size-4" />
              Profile
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/settings">
              <Settings className="size-4" />
              Settings
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <button
              type="submit"
              form="dashboard-logout-form"
              className="flex w-full items-center gap-2"
            >
              <LogOut className="size-4" />
              Log out
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <form id="dashboard-logout-form" action="" className="hidden" aria-hidden="true" />
    </header>
  );
}
