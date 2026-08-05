type Resource = { id: string; title: string; desc: string; url: string };
export type Machine = {
  id: string;
  name: string;
  subtitle: string;
  baseline: { dose: number; yield: number; seconds: string };
  image: any; // require(...)
  roastTargets: { light: string; medium: string; dark: string };
  guides: Resource[];
  cleaning: Resource[];
};


export const MACHINES: Record<string, Machine> = {
  "gaggia-classic-pro": {
    
    id: "gaggia-classic-pro",
    name: "Gaggia Classic Pro",
    subtitle: "Classic single boiler — great for learning espresso.",
    baseline: { dose: 18, yield: 36, seconds: "25–30" },
    image: require("../assets/images/machines/gaggia.jpg"),
    roastTargets: {
      light: "28–33",
      medium: "25–30",
      dark: "22–28",
    },
    guides: [
  {
    id: "first-use",
    title: "First use (setup)",
    desc: "Warmup, water, portafilter basics.",
    url: "https://www.youtube.com/results?search_query=gaggia+classic+pro+first+use",
  },
  {
    id: "dial-in-basics",
    title: "Dial-in basics",
    desc: "Time-based dialing workflow.",
    url: "https://www.youtube.com/results?search_query=gaggia+classic+pro+dial+in",
  },
],
cleaning: [
  {
    id: "after-shot",
    title: "After each session",
    desc: "Purge, wipe, rinse portafilter, quick cleanup.",
    url: "https://www.youtube.com/results?search_query=gaggia+classic+pro+after+shot+cleaning",
  },
  {
    id: "weekly",
    title: "Weekly routine",
    desc: "Backflush / shower screen / gasket basics.",
    url: "https://www.youtube.com/results?search_query=gaggia+classic+pro+weekly+cleaning",
  },
  {
    id: "deep-clean",
    title: "Deep clean (monthly)",
    desc: "Descale / deep maintenance checklist.",
    url: "https://www.youtube.com/results?search_query=gaggia+classic+pro+descale+deep+clean",
  },
],
    
  },
  "rancilio-silvia": {
    id: "rancilio-silvia",
    name: "Rancilio Silvia",
    subtitle: "Powerful single boiler with a strong community.",
    baseline: { dose: 18, yield: 36, seconds: "25–30" },
    image: require("../assets/images/machines/rancilio.jpg"),
    roastTargets: {
      light: "28–33",
      medium: "25–30",
      dark: "22–28",
},
guides: [
  {
    id: "first-use",
    title: "First use (setup)",
    desc: "Warmup, water, portafilter basics.",
    url: "https://www.youtube.com/results?search_query=gaggia+classic+pro+first+use",
  },
  {
    id: "dial-in-basics",
    title: "Dial-in basics",
    desc: "Time-based dialing workflow.",
    url: "https://www.youtube.com/results?search_query=gaggia+classic+pro+dial+in",
  },
],
cleaning: [
  {
    id: "after-shot",
    title: "After each session",
    desc: "Purge, wipe, rinse portafilter, quick cleanup.",
    url: "https://www.youtube.com/results?search_query=gaggia+classic+pro+after+shot+cleaning",
  },
  {
    id: "weekly",
    title: "Weekly routine",
    desc: "Backflush / shower screen / gasket basics.",
    url: "https://www.youtube.com/results?search_query=gaggia+classic+pro+weekly+cleaning",
  },
  {
    id: "deep-clean",
    title: "Deep clean (monthly)",
    desc: "Descale / deep maintenance checklist.",
    url: "https://www.youtube.com/results?search_query=gaggia+classic+pro+descale+deep+clean",
  },
],
  },
  "breville-barista-express": {
    id: "breville-barista-express",
    name: "Breville Barista Express",
    subtitle: "All-in-one machine with built-in grinder.",
    baseline: { dose: 18, yield: 36, seconds: "25–30" },
    image: require("../assets/images/machines/breville.jpg"),
    roastTargets: {
      light: "28–33",
      medium: "25–30",
      dark: "22–28",
},
guides: [
  {
    id: "first-use",
    title: "First use (setup)",
    desc: "Warmup, water, portafilter basics.",
    url: "https://www.youtube.com/results?search_query=gaggia+classic+pro+first+use",
  },
  {
    id: "dial-in-basics",
    title: "Dial-in basics",
    desc: "Time-based dialing workflow.",
    url: "https://www.youtube.com/results?search_query=gaggia+classic+pro+dial+in",
  },
],
cleaning: [
  {
    id: "after-shot",
    title: "After each session",
    desc: "Purge, wipe, rinse portafilter, quick cleanup.",
    url: "https://www.youtube.com/results?search_query=gaggia+classic+pro+after+shot+cleaning",
  },
  {
    id: "weekly",
    title: "Weekly routine",
    desc: "Backflush / shower screen / gasket basics.",
    url: "https://www.youtube.com/results?search_query=gaggia+classic+pro+weekly+cleaning",
  },
  {
    id: "deep-clean",
    title: "Deep clean (monthly)",
    desc: "Descale / deep maintenance checklist.",
    url: "https://www.youtube.com/results?search_query=gaggia+classic+pro+descale+deep+clean",
  },
],
  },
};