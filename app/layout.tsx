import type {Metadata} from "next";
import "./globals.css";
import "./real-motion.css";
import "./focus-targets.css";
import "./provider-platform.css";

export const metadata:Metadata={
 metadataBase:new URL("https://bodywise-snowy.vercel.app"),
 title:"Bodywise Remedy Calisthenics — Bodyweight Strength Coach",
 description:"Calisthenics and bodyweight training app with safer daily workouts built around your goal, age, level, body condition, recovery needs, and progress.",
 openGraph:{title:"Bodywise Remedy Calisthenics",description:"Bodyweight strength coaching built around your goals, readiness, body condition and schedule.",images:[{url:"/og.png",width:1792,height:896,alt:"Bodywise Remedy Calisthenics bodyweight strength coach"}]},
 twitter:{card:"summary_large_image",images:["/og.png"]},
 icons:{icon:"/favicon.svg",apple:"/apple-touch-icon.png"}
};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en" style={{"--display":"Impact, 'Arial Narrow', sans-serif","--body":"Arial, sans-serif"} as React.CSSProperties}><body>{children}</body></html>}