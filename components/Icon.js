export default function Icon({ name }) {
  const c = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24' };
  switch (name) {
    case 'home': return (<svg {...c}><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" /></svg>);
    case 'globe': return (<svg {...c}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3Z" /></svg>);
    case 'book': return (<svg {...c}><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21.5v-16Z" /><path d="M5 18.5A2.5 2.5 0 0 1 7.5 16H19" /></svg>);
    case 'calendar': return (<svg {...c}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 9h18" /></svg>);
    case 'clipboard-check': return (<svg {...c}><rect x="6" y="4" width="12" height="17" rx="1.5" /><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" /><path d="m9.5 13 2 2 3.5-3.5" /></svg>);
    case 'users': return (<svg {...c}><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.3" /><path d="M15.5 14.2c2.4.4 4.5 2.3 4.5 5.8" /></svg>);
    case 'folder': return (<svg {...c}><path d="M3 7a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Z" /></svg>);
    case 'scan': return (<svg {...c}><path d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3" /><circle cx="12" cy="12" r="3.2" /><path d="m14.3 14.3 2 2" /></svg>);
    case 'upload': return (<svg {...c}><path d="M12 16V4m0 0-4 4m4-4 4 4" /><path d="M5 16v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3" /></svg>);
    case 'download': return (<svg {...c}><path d="M12 4v11m0 0-4-4m4 4 4-4" /><path d="M5 19h14" /></svg>);
    case 'sliders': return (<svg {...c}><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h14M22 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></svg>);
    case 'chevron-right': return (<svg {...c}><path d="m9 6 6 6-6 6" /></svg>);
    case 'warning-triangle': return (<svg {...c}><path d="M12 4 2.5 20h19L12 4Z" /><path d="M12 10v4M12 17h.01" /></svg>);
    case 'file-text': return (<svg {...c}><path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h6" /></svg>);
    default: return null;
  }
}
