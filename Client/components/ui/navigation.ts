import type { SidebarGroup,BreadcrumbItems } from './types'

export const adminNavigation: SidebarGroup[] = [
  {
    title: "Dashboard",
    url: "/",
    items: [
      {
        title: "Overview",
        url: "/",
      },
    ],
  },
  {
    title: "Calendar",
    url: "/calendar",
    items: [
      {
        title: "My Calendar",
        url: "/calendar",
      },
      {
        title: "Create Event",
        url: "/calendar/create",
      },
    ],
  },
  {
    title: "Documents",
    url: "/documents",
    items: [
      {
        title: "My Documents",
        url: "/documents",
      },
      {
        title: "Upload PDF",
        url: "/documents/upload",
      },
    ],
  },
  {
    title: "Summarization",
    url: "/summarization",
    items: [
      {
        title: "Resume Analyser",
        url: "/summarization",
      },
      {
        title: "JD Analyzer",
        url: "/summarization/jd",
      },
      {
        title: "QA from Drive",
        url: "/summarization/qa",
      },
    ],
  },
  {
    title: "Gmail",
    url: "/gmail",
    items: [
      {
        title: "All Mails",
        url: "/gmail",
      },
      {
        title: "Placement Emails",
        url: "/gmail/placement",
      },
    ],
  },
  {
    title: "Smart Notes",
    url: "/notes",
    items: [
      {
        title: "My Notes",
        url: "/notes",
      },
      {
        title: "Create Note",
        url: "/notes/create",
      },
    ],
  },
  {
    title: "AI Doubt Solver",
    url: "/doubt-solver",
    items: [
      {
        title: "Ask Question",
        url: "/doubt-solver",
      },
      {
        title: "History",
        url: "/doubt-solver/history",
      },
    ],
  },
];

export const adminBreadcrumb:BreadcrumbItems['items'] = {
  '/':[{
    title:'Dashboard',
    url:'/'
  }],
  '/calendar':[{
    title:'Calendar',
    url:'/calendar'
  }],
  '/calendar/create':[{
    title:'Calendar',
    url:'/calendar'
  },{
    title:'Create Event',
    url:'/calendar/create'
  }],
  '/documents':[{
    title:'Documents',
    url:'/documents'
  }],
  '/documents/upload':[{
    title:'Documents',
    url:'/documents'
  },{
    title:'Upload PDF',
    url:'/documents/upload'
  }],
  '/summarization/pdf':[{
    title:'Summarization',
    url:'/summarization'
  },{
    title:'PDF Summary',
    url:'/summarization/pdf'
  }],
  '/summarization/jd':[{
    title:'Summarization',
    url:'/summarization'
  },{
    title:'JD Summary',
    url:'/summarization/jd'
  }],
  '/summarization/qa':[{
    title:'Summarization',
    url:'/summarization'
  },{
    title:'QA from Drive',
    url:'/summarization/qa'
  }],
  '/gmail':[{
    title:'Gmail',
    url:'/gmail'
  }],
  '/gmail/placement':[{
    title:'Gmail',
    url:'/gmail'
  },{
    title:'Placement Emails',
    url:'/gmail/placement'
  }],
  '/notes':[{
    title:'Smart Notes',
    url:'/notes'
  }],
  '/notes/create':[{
    title:'Smart Notes',
    url:'/notes'
  },{
    title:'Create Note',
    url:'/notes/create'
  }],
  '/notes/edit/[id]':[{
    title:'Smart Notes',
    url:'/notes'
  },{
    title:'Edit Note',
    url:'/notes/edit/[id]'
  }],
  '/doubt-solver':[{
    title:'AI Doubt Solver',
    url:'/doubt-solver'
  }],
  '/doubt-solver/history':[{
    title:'AI Doubt Solver',
    url:'/doubt-solver'
  },{
    title:'History',
    url:'/doubt-solver/history'
  }],
}